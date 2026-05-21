const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { chatId, imageBase64, type, filename, caption } = req.body;
    if (!chatId || !imageBase64) {
      return res.status(400).json({ ok: false, error: "Missing chatId or imageBase64" });
    }

    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer     = Buffer.from(base64Data, "base64");
    const form       = new FormData();
    form.append("chat_id", String(chatId));
    if (caption) form.append("caption", caption);

    let result;
    if (type === "pdf") {
      form.append("document", new Blob([buffer], { type: "application/pdf" }), filename || "poster.pdf");
      const r = await fetch(`${TG}/sendDocument`, { method: "POST", body: form });
      result  = await r.json();
    } else {
      form.append("photo", new Blob([buffer], { type: "image/png" }), filename || "poster.png");
      const r = await fetch(`${TG}/sendPhoto`, { method: "POST", body: form });
      result  = await r.json();
    }

    if (result.ok) {
      res.status(200).json({ ok: true });
    } else {
      res.status(200).json({ ok: false, error: result.description });
    }
  } catch (e) {
    console.error("send-poster error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
