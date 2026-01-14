import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const message = req.body.message;
  if (!message) return res.status(200).send("No message");

  const chatId = message.chat.id;
  const prompt = message.caption || message.text;

  if (!prompt) {
    await sendMessage(chatId, "Prompt bhejo bhai 🙂");
    return res.status(200).send("Done");
  }

  try {
    const imageBase64 = await generateImage(prompt);

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: `data:image/png;base64,${imageBase64}`,
          caption: `Prompt: ${prompt}`
        })
      }
    );

  } catch (err) {
    await sendMessage(chatId, "Image generate nahi ho paayi ❌");
  }

  res.status(200).send("OK");
}

async function generateImage(prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate:generateImage?key=" +
      process.env.GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt
      })
    }
  );

  const data = await response.json();
  return data.images[0].base64;
}

async function sendMessage(chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    }
  );
}
