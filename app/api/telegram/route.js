export async function POST(req) {
  try {
    const body = await req.json();
    const msg = body.message;
    if (!msg) return Response.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // /image command
    if (text && text.startsWith("/image")) {
      const prompt = text.replace("/image", "").trim();

      if (!prompt) {
        await send(chatId, "❌ Use:\n/image ek ladka sunset me");
        return Response.json({ ok: true });
      }

      await send(chatId, "🎨 Gemini image generate ho rahi hai...\n⏳ Wait karo");

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

    await send(chatId, "👉 Image ke liye likho:\n/image ek ladka mountain par");
    return Response.json({ ok: true });

  } catch (err) {
    console.error("GEMINI BOT ERROR:", err);
    return Response.json({ ok: true });
  }
}

// ---------------- HELPERS ----------------

async function send(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    }
  );
}

// 🔥 Gemini Imagen (Direct Image Generation)
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
    const errText = await res.text();
    throw new Error(errText);
  }

  const data = await res.json();

  // base64 image
  return Buffer.from(
    data.predictions[0].bytesBase64Encoded,
    "base64"
  );
  }
