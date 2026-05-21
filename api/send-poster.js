import https from "https";

const BOT_TOKEN = process.env.BOT_TOKEN;

// Multipart form-data helper — sends a Buffer as a file to Telegram
function sendPhoto(chatId, imageBuffer, caption) {
  return new Promise((resolve, reject) => {
    const boundary = "----TGBoundary" + Date.now();
    const CRLF = "\r\n";

    const metaPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}` +
      `${chatId}${CRLF}`;

    const captionPart = caption
      ? `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="caption"${CRLF}${CRLF}` +
        `${caption}${CRLF}`
      : "";

    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="photo"; filename="poster.png"${CRLF}` +
      `Content-Type: image/png${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const head = Buffer.from(metaPart + captionPart + fileHeader);
    const tail = Buffer.from(closing);
    const body = Buffer.concat([head, imageBuffer, tail]);

    const options = {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN.replace(/:/g, "%3A")}/sendPhoto`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendDocument(chatId, pdfBuffer, filename, caption) {
  return new Promise((resolve, reject) => {
    const boundary = "----TGBoundary" + Date.now();
    const CRLF = "\r\n";

    const metaPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}` +
      `${chatId}${CRLF}`;

    const captionPart = caption
      ? `--${boundary}${CRLF}` +
        `Content-Disposition: form-data; name="caption"${CRLF}${CRLF}` +
        `${caption}${CRLF}`
      : "";

    const fileHeader =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="document"; filename="${filename}"${CRLF}` +
      `Content-Type: application/pdf${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const head = Buffer.from(metaPart + captionPart + fileHeader);
    const tail = Buffer.from(closing);
    const body = Buffer.concat([head, pdfBuffer, tail]);

    const options = {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN.replace(/:/g, "%3A")}/sendDocument`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

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

    // Strip data URL prefix: "data:image/png;base64,..."
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    let result;
    if (type === "pdf") {
      result = await sendDocument(chatId, buffer, filename || "poster.pdf", caption || "");
    } else {
      result = await sendPhoto(chatId, buffer, caption || "");
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
