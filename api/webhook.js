const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = "https://tma-poster.vercel.app";

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const { message } = req.body || {};
  if (!message) return res.status(200).send("OK");

  const chatId = message.chat.id;
  const text = message.text || "";
  const firstName = message.from?.first_name || "Do'st";

  if (text === "/start") {
    await sendMessage(
      chatId,
      `Assalomu alaykum, ${firstName}! 👋\n\nMen liga poster yaratuvchi botman. Quyidagi tugma orqali ilovani oching va chiroyli poster tayyorlang! 🏆`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🏆 Posterni ochish",
                web_app: { url: APP_URL },
              },
            ],
          ],
        },
      }
    );
  }

  res.status(200).send("OK");
}
