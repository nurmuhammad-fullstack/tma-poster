import sharp from "sharp";
import https from "https";

const BOT_TOKEN = process.env.BOT_TOKEN;
const NAVY   = "#0D1B2A";
const ACCENT = "#F97316";
const WHITE  = "#FFFFFF";
const GRAY   = "#8A92A6";
const LIGHT  = "#F7F8FA";
const BORDER = "#EEF0F4";
const W = 1080, H = 1350;

// ── SVG poster builder ────────────────────────────────────────────────────────
function buildSVG(d) {
  const lang = d.lang || "uz";
  const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const font = (size, weight=400) =>
    `font-family="-apple-system,BlinkMacSystemFont,Arial,sans-serif" font-size="${size}" font-weight="${weight}"`;

  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];

  // ── hero ──────────────────────────────────────────────────────────────────
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="hero" x1="0" y1="0" x2="${W}" y2="290" gradientUnits="userSpaceOnUse">
    <stop offset="0%"   stop-color="#0D1B2A"/>
    <stop offset="60%"  stop-color="#1A2E45"/>
    <stop offset="100%" stop-color="#1E3A52"/>
  </linearGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${ACCENT}"/>
    <stop offset="100%" stop-color="#EA580C"/>
  </linearGradient>
  <linearGradient id="stripe" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${ACCENT}"/>
    <stop offset="100%" stop-color="#FB923C"/>
  </linearGradient>
</defs>

<!-- BG -->
<rect width="${W}" height="${H}" fill="${WHITE}"/>

<!-- Hero -->
<rect width="${W}" height="290" fill="url(#hero)"/>
<polygon points="${W*0.52},0 ${W+10},0 ${W+10},290 ${W*0.45},290" fill="${ACCENT}" opacity="0.93"/>

<!-- Season -->
<text x="64" y="88" ${font(22,600)} fill="#FED7AA">🏐 ${esc(lang==="ru"?"Сезон":"Mavsum")} · ${esc(d.season||"")}</text>`;

  // League name — shorten if long
  const lname = esc((d.leagueName||"").toUpperCase());
  const lsize = lname.length > 18 ? 48 : lname.length > 12 ? 58 : 68;
  svg += `
<text x="64" y="${170 + (68 - lsize)}" ${font(lsize,900)} fill="${WHITE}">${lname}</text>
<text x="64" y="240" ${font(28,600)} fill="rgba(255,255,255,0.9)">${esc(d.roundName||"")}</text>

<!-- Accent stripe -->
<rect y="290" width="${W}" height="6" fill="url(#stripe)"/>`;

  // ── columns ───────────────────────────────────────────────────────────────
  const bodyY = 296;
  const pad   = 60;
  const colW  = (W - pad*2 - 44) / 2;
  const lx    = pad;
  const rx    = pad + colW + 44;

  // helper: section header
  function secHeader(x, y, title) {
    return `
<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="${ACCENT}"/>
<text x="${x+40}" y="${y}" ${font(17,800)} fill="${NAVY}">${esc(title.toUpperCase())}</text>
<line x1="${x}" y1="${y+8}" x2="${x+colW}" y2="${y+8}" stroke="${NAVY}" stroke-width="2"/>`;
  }

  let y = bodyY + 44;

  // ── STANDINGS (left) ──────────────────────────────────────────────────────
  svg += secHeader(lx, y, lang==="ru"?"Турнирная таблица":"Turnir jadvali");
  y += 28;

  // Column labels
  svg += `
<text x="${lx}"         y="${y+18}" ${font(11,700)} fill="${GRAY}">#</text>
<text x="${lx+72}"      y="${y+18}" ${font(11,700)} fill="${GRAY}">${lang==="ru"?"КОМАНДА":"JAMOA"}</text>
<text x="${lx+colW-114}" y="${y+18}" ${font(11,700)} fill="${GRAY}">${lang==="ru"?"И":"O'"}</text>
<text x="${lx+colW-70}"  y="${y+18}" ${font(11,700)} fill="${GRAY}">${lang==="ru"?"С":"S"}</text>
<text x="${lx+colW-28}"  y="${y+18}" ${font(11,700)} fill="${GRAY}">${lang==="ru"?"О":"B"}</text>`;
  y += 32;

  for (let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const ry = y + i * 46;
    const badgeCol = i===0 ? ACCENT : i<3 ? "#FB923C" : NAVY;

    if (i < 3) svg += `<rect x="${lx-4}" y="${ry-22}" width="${colW+8}" height="42" fill="${ACCENT}" opacity="0.05"/>`;

    // rank badge
    svg += `
<rect x="${lx}" y="${ry-18}" width="26" height="26" rx="5" fill="${badgeCol}"/>
<text x="${lx+13}" y="${ry-1}" ${font(13,800)} fill="${WHITE}" text-anchor="middle">${esc(row.rank)}</text>`;

    // logo circle
    svg += `<circle cx="${lx+52}" cy="${ry-5}" r="14" fill="${BORDER}"/>`;

    // team name
    svg += `<text x="${lx+72}" y="${ry}" ${font(15,600)} fill="${NAVY}">${esc(row.team||"—")}</text>`;

    // stats
    svg += `
<text x="${lx+colW-107}" y="${ry}" ${font(14,500)} fill="${GRAY}" text-anchor="middle">${esc(row.played)}</text>
<text x="${lx+colW-62}"  y="${ry}" ${font(14,500)} fill="${GRAY}" text-anchor="middle">${row.gd>0?"+"+row.gd:esc(row.gd)}</text>
<text x="${lx+colW-17}"  y="${ry}" ${font(17,800)} fill="${NAVY}" text-anchor="middle">${esc(row.points)}</text>
<line x1="${lx}" y1="${ry+20}" x2="${lx+colW}" y2="${ry+20}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  // ── RESULTS (right top) ───────────────────────────────────────────────────
  let ry2 = bodyY + 44;
  svg += secHeader(rx, ry2, lang==="ru"?"Результаты":"Natijalar");
  ry2 += 28;

  for (const m of results) {
    const hasHead = !!(m.label || m.date);
    const cardH = hasHead ? 74 : 56;

    svg += `<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="12" fill="${LIGHT}"/>`;

    if (hasHead) {
      svg += `<text x="${rx+14}" y="${ry2+22}" ${font(11,700)} fill="${GRAY}">${esc((m.label||"").toUpperCase())}</text>`;
      if (m.date) svg += `<text x="${rx+colW-14}" y="${ry2+22}" ${font(11,700)} fill="${GRAY}" text-anchor="end">${esc(m.date)}</text>`;
    }

    const sy = ry2 + (hasHead ? 57 : 38);
    const cx = rx + colW/2;

    svg += `
<text x="${cx-48}" y="${sy}" ${font(15,600)} fill="${NAVY}" text-anchor="end">${esc(m.home||"—")}</text>
<rect x="${cx-40}" y="${sy-18}" width="80" height="27" rx="7" fill="${NAVY}"/>
<text x="${cx}" y="${sy}" ${font(15,800)} fill="${WHITE}" text-anchor="middle">${esc(m.homeScore)} : ${esc(m.awayScore)}</text>
<text x="${cx+48}" y="${sy}" ${font(15,600)} fill="${NAVY}">${esc(m.away||"—")}</text>`;

    ry2 += cardH + 12;
  }

  // ── TOP PERFORMERS (right bottom) ─────────────────────────────────────────
  ry2 += 16;
  svg += secHeader(rx, ry2, lang==="ru"?"Лучшие игроки":"Eng yaxshi o'yinchilar");
  ry2 += 28;

  const medalC = ["#E5A800","#9AA0AE","#9C5A1F"];
  for (let i = 0; i < top.length; i++) {
    const p = top[i];
    const py = ry2 + i*52;
    const mc = i < 3 ? medalC[i] : NAVY;

    svg += `
<circle cx="${rx+14}" cy="${py}" r="14" fill="${mc}"/>
<text x="${rx+14}" y="${py+5}" ${font(12,800)} fill="${WHITE}" text-anchor="middle">${i+1}</text>
<text x="${rx+36}" y="${py-2}" ${font(15,700)} fill="${NAVY}">${esc(p.name||"—")}</text>
<text x="${rx+36}" y="${py+16}" ${font(12,500)} fill="${GRAY}">${esc(p.team||"")}</text>
<text x="${rx+colW-4}" y="${py+4}" ${font(22,900)} fill="${ACCENT}" text-anchor="end">${esc(p.goals)}</text>
<text x="${rx+colW-4}" y="${py+18}" ${font(11,500)} fill="${GRAY}" text-anchor="end">${lang==="ru"?"очк.":"ball"}</text>
<line x1="${rx}" y1="${py+30}" x2="${rx+colW}" y2="${py+30}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  svg += `
<rect y="${H-54}" width="${W}" height="54" fill="${NAVY}"/>
<text x="${pad}" y="${H-18}" ${font(12,600)} fill="rgba(255,255,255,0.55)">🏐 ${esc(lang==="ru"?"Волейбол Постер Студия":"Voleybol Poster Studio")}</text>
<text x="${W-pad}" y="${H-18}" ${font(12,600)} fill="rgba(255,255,255,0.55)" text-anchor="end">${esc(new Date().toLocaleDateString(lang==="ru"?"ru-RU":"uz-UZ"))}</text>
</svg>`;

  return svg;
}

// ── Telegram sendPhoto ────────────────────────────────────────────────────────
function sendPhoto(chatId, buffer, caption) {
  return new Promise((resolve, reject) => {
    const boundary = "----TGB" + Date.now();
    const CRLF = "\r\n";
    const meta =
      `--${boundary}${CRLF}Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}${chatId}${CRLF}` +
      (caption ? `--${boundary}${CRLF}Content-Disposition: form-data; name="caption"${CRLF}${CRLF}${caption}${CRLF}` : "");
    const fileH = `--${boundary}${CRLF}Content-Disposition: form-data; name="photo"; filename="poster.png"${CRLF}Content-Type: image/png${CRLF}${CRLF}`;
    const close = `${CRLF}--${boundary}--${CRLF}`;
    const body  = Buffer.concat([Buffer.from(meta + fileH), buffer, Buffer.from(close)]);
    const opts  = {
      hostname: "api.telegram.org",
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    };
    const req = https.request(opts, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
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
    if (!chatId || !reportData) {
      return res.status(400).json({ ok: false, error: "Missing chatId or reportData" });
    }

    const svgStr = buildSVG({ ...reportData, lang: lang || "uz" });
    const pngBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();

    const caption = `🏐 ${reportData.leagueName || "Poster"}${reportData.roundName ? " — " + reportData.roundName : ""}`;
    const result  = await sendPhoto(String(chatId), pngBuf, caption);

    if (result.ok) {
      res.status(200).json({ ok: true });
    } else {
      console.error("Telegram error:", result);
      res.status(200).json({ ok: false, error: result.description });
    }
  } catch (e) {
    console.error("render-poster error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
