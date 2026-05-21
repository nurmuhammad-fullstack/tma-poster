const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const APP_URL = "https://tma-poster.vercel.app";

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const { message } = req.body || {};
    if (!message) return res.status(200).send("OK");

    const chatId    = message.chat.id;
    const text      = message.text || "";
    const firstName = message.from?.first_name || "Do'st";

    if (text === "/start") {
      const appUrl = `${APP_URL}?chatId=${chatId}`;
      await sendMessage(
        chatId,
        `Assalomu alaykum, <b>${firstName}</b>! 🏐\n\nMen <b>Voleybol Poster Studio</b> botiman.\n\nTur natijalarini professional posterga aylantiring va yuklab oling!\n\nQuyidagi tugmani bosing 👇`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏐 Posterni ochish", web_app: { url: appUrl } }],
            ],
          },
        }
      );
    }
  } catch (e) {
    console.error("webhook error:", e);
  }

  res.status(200).send("OK");
}
