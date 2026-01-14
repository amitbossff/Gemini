export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (!msg) return Response.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // /start
    if (text === "/start") {
      await send(chatId,
        "🤖 *Gemini Image Bot*\n\n" +
        "Image banane ke liye likho:\n" +
        "/image ek ladka sunset me\n\n" +
        "⚠️ Ye bot Gemini Image API use karta hai."
      );
      return Response.json({ ok: true });
    }

    // /image prompt
    if (text && text.startsWith("/image")) {
      const prompt = text.replace("/image", "").trim();

      if (!prompt) {
        await send(chatId, "❌ Usage:\n/image ek ladka mountain par");
        return Response.json({ ok: true });
      }

      await send(chatId, "🎨 Gemini se image generate ho rahi hai...\n⏳ Thoda wait karo");

      const imageBuffer = await generateGeminiImage(prompt);

      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("photo", new Blob([imageBuffer]), "gemini.png");

      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
        { method: "POST", body: form }
      );

      return Response.json({ ok: true });
    }

    // Default reply
    await send(chatId, "👉 Image ke liye likho:\n/image ek ladka coffee shop me");
    return Response.json({ ok: true });

  } catch (err) {
    console.error("GEMINI IMAGE BOT ERROR:", err);

    // User-friendly error
    try {
      const body = await req.json();
      const chatId = body?.message?.chat?.id;
      if (chatId) {
        await send(chatId,
          "❌ Image generate nahi ho pa rahi.\n" +
          "Possible reasons:\n" +
          "• Gemini Image API enabled nahi\n" +
          "• Quota / permission issue\n\n" +
          "Try later or contact admin."
        );
      }
    } catch {}

    return Response.json({ ok: true });
  }
}

// ================= HELPERS =================

// Send text message
async function send(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown"
      })
    }
  );
}

// 🔥 DIRECT GEMINI IMAGE GENERATION (Imagen)
async function generateGeminiImage(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1 }
      })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  const data = await res.json();

  return Buffer.from(
    data.predictions[0].bytesBase64Encoded,
    "base64"
  );
}
