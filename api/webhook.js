import https from "https";

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = "https://tma-poster.vercel.app";

function sendMessage(chatId, text, extra = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra });
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      res.resume();
      res.on("end", resolve);
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const { message } = req.body || {};
    if (!message) return res.status(200).send("OK");

    const chatId = message.chat.id;
    const text = message.text || "";
    const firstName = message.from?.first_name || "Do'st";

    if (text === "/start") {
      // chatId ni URL ga qo'shamiz — Mini App shuni o'qib bot ga yuboradi
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
