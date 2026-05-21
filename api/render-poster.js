import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import https from "https";
import http from "http";

const BOT_TOKEN = process.env.BOT_TOKEN;

const NAVY   = "#0D1B2A";
const ACCENT = "#F97316";
const WHITE  = "#FFFFFF";
const GRAY   = "#8A92A6";
const LIGHT  = "#F7F8FA";
const BORDER = "#EEF0F4";

// ── helpers ──────────────────────────────────────────────────────────────────
function hex(h) { return h; }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fetchImage(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", () => resolve(null));
    }).on("error", () => resolve(null));
  });
}

// ── main renderer ────────────────────────────────────────────────────────────
async function renderPoster(data) {
  const W = 1080, H = 1350;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const font = (size, weight = "normal") =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, Arial, sans-serif`;

  // Background
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, W, H);

  // ── HERO ──────────────────────────────────────────────────────────────────
  const heroH = 290;
  const grad = ctx.createLinearGradient(0, 0, W, heroH);
  grad.addColorStop(0, "#0D1B2A");
  grad.addColorStop(0.6, "#1A2E45");
  grad.addColorStop(1, "#1E3A52");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, heroH);

  // Diagonal accent
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.55, 0);
  ctx.lineTo(W + 100, 0);
  ctx.lineTo(W + 100, heroH);
  ctx.lineTo(W * 0.48, heroH);
  ctx.closePath();
  const ag = ctx.createLinearGradient(W * 0.55, 0, W, heroH);
  ag.addColorStop(0, "#F97316");
  ag.addColorStop(1, "#EA580C");
  ctx.fillStyle = ag;
  ctx.fill();
  ctx.restore();

  // Season label
  ctx.fillStyle = "rgba(254,215,170,0.85)";
  ctx.font = font(22, "600");
  ctx.fillText(`🏐  ${data.lang === "ru" ? "Сезон" : "Mavsum"} · ${data.season}`, 64, 90);

  // League name
  ctx.fillStyle = WHITE;
  ctx.font = font(72, "900");
  const lname = (data.leagueName || (data.lang === "ru" ? "Чемпионат" : "Chempionat")).toUpperCase();
  // wrap if too long
  const maxW = 620;
  if (ctx.measureText(lname).width > maxW) {
    ctx.font = font(52, "900");
  }
  ctx.fillText(lname, 64, 175);

  // Round name
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = font(30, "600");
  ctx.fillText(data.roundName || (data.lang === "ru" ? "Тур" : "Tur"), 64, 235);

  // Accent stripe
  const sg = ctx.createLinearGradient(0, heroH, W, heroH + 6);
  sg.addColorStop(0, ACCENT);
  sg.addColorStop(1, "#FB923C");
  ctx.fillStyle = sg;
  ctx.fillRect(0, heroH, W, 6);

  // ── BODY ──────────────────────────────────────────────────────────────────
  const bodyY = heroH + 6;
  const pad = 60;
  const colW = (W - pad * 2 - 40) / 2;
  const leftX = pad;
  const rightX = pad + colW + 40;
  let y = bodyY + 44;

  // ── Section header helper ─────────────────────────────────────────────────
  function sectionHeader(x, cy, title) {
    // Icon box
    roundRect(ctx, x, cy - 22, 30, 30, 6);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    // Title
    ctx.fillStyle = NAVY;
    ctx.font = font(17, "800");
    ctx.fillText(title.toUpperCase(), x + 40, cy);
    // Underline
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, cy + 8);
    ctx.lineTo(x + colW, cy + 8);
    ctx.stroke();
    return cy + 28;
  }

  // ── STANDINGS ─────────────────────────────────────────────────────────────
  const standTitle = data.lang === "ru" ? "Турнирная таблица" : "Turnir jadvali";
  let sy = sectionHeader(leftX, y, standTitle);

  // Column headers
  ctx.fillStyle = GRAY;
  ctx.font = font(12, "700");
  ctx.fillText("#",            leftX,          sy + 18);
  ctx.fillText(data.lang === "ru" ? "КОМАНДА" : "JAMOA", leftX + 72, sy + 18);
  ctx.fillText(data.lang === "ru" ? "И" : "O'", leftX + colW - 120, sy + 18);
  ctx.fillText(data.lang === "ru" ? "С" : "S",  leftX + colW - 75,  sy + 18);
  ctx.fillText(data.lang === "ru" ? "О" : "B",  leftX + colW - 30,  sy + 18);
  sy += 32;

  for (let i = 0; i < data.standings.length; i++) {
    const row = data.standings[i];
    const ry = sy + i * 46;

    // Row bg for top 3
    if (i < 3) {
      ctx.fillStyle = "rgba(249,115,22,0.05)";
      ctx.fillRect(leftX - 4, ry - 22, colW + 8, 42);
    }

    // Rank badge
    roundRect(ctx, leftX, ry - 18, 26, 26, 5);
    ctx.fillStyle = i === 0 ? ACCENT : i < 3 ? "#FB923C" : NAVY;
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = font(13, "800");
    ctx.textAlign = "center";
    ctx.fillText(String(row.rank), leftX + 13, ry - 1);
    ctx.textAlign = "left";

    // Logo circle
    ctx.fillStyle = BORDER;
    ctx.beginPath();
    ctx.arc(leftX + 52, ry - 6, 14, 0, Math.PI * 2);
    ctx.fill();
    if (row.logo) {
      try {
        const { createImageFromBuffer } = await import("@napi-rs/canvas");
        const buf = await fetchImage(row.logo);
        if (buf) {
          const img = await createImageFromBuffer(buf);
          ctx.save();
          ctx.beginPath();
          ctx.arc(leftX + 52, ry - 6, 14, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, leftX + 38, ry - 20, 28, 28);
          ctx.restore();
        }
      } catch (_) {}
    }

    // Team name
    ctx.fillStyle = NAVY;
    ctx.font = font(16, "600");
    ctx.fillText(row.team || "—", leftX + 72, ry);

    // Stats
    ctx.fillStyle = GRAY;
    ctx.font = font(15, "500");
    ctx.textAlign = "center";
    ctx.fillText(String(row.played), leftX + colW - 107, ry);
    ctx.fillText(row.gd > 0 ? `+${row.gd}` : String(row.gd), leftX + colW - 62, ry);
    ctx.fillStyle = NAVY;
    ctx.font = font(17, "800");
    ctx.fillText(String(row.points), leftX + colW - 17, ry);
    ctx.textAlign = "left";

    // Separator
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, ry + 20);
    ctx.lineTo(leftX + colW, ry + 20);
    ctx.stroke();
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  let ry2 = y;
  const resTitle = data.lang === "ru" ? "Результаты" : "Natijalar";
  ry2 = sectionHeader(rightX, ry2, resTitle);

  for (const m of data.results) {
    const cardH = m.label || m.date ? 72 : 56;
    roundRect(ctx, rightX, ry2 + 4, colW, cardH, 12);
    ctx.fillStyle = LIGHT;
    ctx.fill();

    if (m.label || m.date) {
      ctx.fillStyle = GRAY;
      ctx.font = font(11, "700");
      ctx.fillText((m.label || "").toUpperCase(), rightX + 14, ry2 + 22);
      if (m.date) {
        ctx.textAlign = "right";
        ctx.fillText(m.date, rightX + colW - 14, ry2 + 22);
        ctx.textAlign = "left";
      }
    }

    const scoreY = ry2 + (m.label || m.date ? 56 : 36);

    // Home
    ctx.fillStyle = NAVY;
    ctx.font = font(16, "600");
    ctx.textAlign = "right";
    ctx.fillText(m.home || "—", rightX + colW / 2 - 48, scoreY);

    // Score badge
    roundRect(ctx, rightX + colW / 2 - 40, scoreY - 18, 80, 28, 7);
    ctx.fillStyle = NAVY;
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = font(16, "800");
    ctx.textAlign = "center";
    ctx.fillText(`${m.homeScore} : ${m.awayScore}`, rightX + colW / 2, scoreY);

    // Away
    ctx.fillStyle = NAVY;
    ctx.font = font(16, "600");
    ctx.textAlign = "left";
    ctx.fillText(m.away || "—", rightX + colW / 2 + 48, scoreY);
    ctx.textAlign = "left";

    ry2 += cardH + 12;
  }

  // ── TOP PERFORMERS ────────────────────────────────────────────────────────
  ry2 += 20;
  const topTitle = data.lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar";
  ry2 = sectionHeader(rightX, ry2, topTitle);

  const medals = [
    "linear-gradient(#FFD700,#E5A800)",
    "linear-gradient(#D0D3DC,#9AA0AE)",
    "linear-gradient(#CD7F32,#9C5A1F)",
  ];
  const medalColors = ["#E5A800", "#9AA0AE", "#9C5A1F"];

  for (let i = 0; i < data.topPerformers.length; i++) {
    const p = data.topPerformers[i];
    const py = ry2 + i * 52;

    // Medal circle
    ctx.beginPath();
    ctx.arc(rightX + 14, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = i < 3 ? medalColors[i] : NAVY;
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = font(12, "800");
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), rightX + 14, py + 4);
    ctx.textAlign = "left";

    // Name & team
    ctx.fillStyle = NAVY;
    ctx.font = font(16, "700");
    ctx.fillText(p.name || "—", rightX + 36, py - 2);
    ctx.fillStyle = GRAY;
    ctx.font = font(12, "500");
    ctx.fillText(p.team || "", rightX + 36, py + 16);

    // Goals
    ctx.fillStyle = ACCENT;
    ctx.font = font(22, "900");
    ctx.textAlign = "right";
    ctx.fillText(String(p.goals), rightX + colW - 4, py + 4);
    ctx.fillStyle = GRAY;
    ctx.font = font(11, "500");
    ctx.fillText(data.lang === "ru" ? "очк." : "ball", rightX + colW - 4, py + 18);
    ctx.textAlign = "left";

    // Separator
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightX, py + 30);
    ctx.lineTo(rightX + colW, py + 30);
    ctx.stroke();
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, H - 54, W, 54);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = font(12, "600");
  ctx.fillText(
    `🏐  ${data.lang === "ru" ? "Волейбол Постер Студия" : "Voleybol Poster Studio"}`,
    pad, H - 20
  );
  ctx.textAlign = "right";
  ctx.fillText(
    new Date().toLocaleDateString(data.lang === "ru" ? "ru-RU" : "uz-UZ"),
    W - pad, H - 20
  );
  ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

// ── send to Telegram ─────────────────────────────────────────────────────────
function sendPhoto(chatId, buffer, caption) {
  return new Promise((resolve, reject) => {
    const boundary = "----Boundary" + Date.now();
    const CRLF = "\r\n";
    const meta =
      `--${boundary}${CRLF}Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}${chatId}${CRLF}` +
      (caption ? `--${boundary}${CRLF}Content-Disposition: form-data; name="caption"${CRLF}${CRLF}${caption}${CRLF}` : "");
    const fileH =
      `--${boundary}${CRLF}Content-Disposition: form-data; name="photo"; filename="poster.png"${CRLF}Content-Type: image/png${CRLF}${CRLF}`;
    const close = `${CRLF}--${boundary}--${CRLF}`;
    const body = Buffer.concat([Buffer.from(meta + fileH), buffer, Buffer.from(close)]);
    const opts = {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve(JSON.parse(d)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { chatId, reportData, lang } = req.body;
    if (!chatId || !reportData) return res.status(400).json({ ok: false, error: "Missing fields" });

    const pngBuffer = await renderPoster({ ...reportData, lang: lang || "uz" });
    const caption = `🏐 ${reportData.leagueName || "Poster"} — ${reportData.roundName || ""}`.trim();
    const result = await sendPhoto(chatId, pngBuffer, caption);

    if (result.ok) {
      res.status(200).json({ ok: true });
    } else {
      res.status(200).json({ ok: false, error: result.description });
    }
  } catch (e) {
    console.error("render-poster error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
