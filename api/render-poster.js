const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const W = 1080, H = 1350;
const NAVY   = "#0D1B2A";
const ACCENT = "#F97316";
const WHITE  = "#FFFFFF";
const GRAY   = "#8A92A6";
const LIGHT  = "#F7F8FA";
const BORDER = "#EEF0F4";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSVG(d) {
  const lang = d.lang || "uz";
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];

  const pad  = 60;
  const colW = (W - pad * 2 - 44) / 2;
  const lx   = pad;
  const rx   = pad + colW + 44;

  function secHeader(x, y, title) {
    return `<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="${ACCENT}"/>
<text x="${x+40}" y="${y}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${NAVY}">${esc(title.toUpperCase())}</text>
<line x1="${x}" y1="${y+8}" x2="${x+colW}" y2="${y+8}" stroke="${NAVY}" stroke-width="2"/>`;
  }

  const lname = esc((d.leagueName || "").toUpperCase());
  const lsize = lname.length > 18 ? 46 : lname.length > 12 ? 56 : 66;

  let body = "";

  // ── Hero ──────────────────────────────────────────────────────────────────
  body += `<rect width="${W}" height="290" fill="#0D1B2A"/>
<polygon points="${W*0.52},0 ${W},0 ${W},290 ${W*0.45},290" fill="${ACCENT}" opacity="0.93"/>
<text x="64" y="86" font-family="Arial,sans-serif" font-size="22" font-weight="600" fill="#FED7AA">${esc(lang==="ru"?"Сезон":"Mavsum")} · ${esc(d.season||"")}</text>
<text x="64" y="${165+(66-lsize)}" font-family="Arial,sans-serif" font-size="${lsize}" font-weight="900" fill="${WHITE}">${lname}</text>
<text x="64" y="240" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.9)">${esc(d.roundName||"")}</text>
<rect y="290" width="${W}" height="6" fill="${ACCENT}"/>`;

  // ── Standings ─────────────────────────────────────────────────────────────
  let y = 296 + 44;
  body += secHeader(lx, y, lang==="ru"?"Турнирная таблица":"Turnir jadvali");
  y += 28;

  body += `<text x="${lx}" y="${y+18}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">#</text>
<text x="${lx+72}" y="${y+18}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${lang==="ru"?"КОМАНДА":"JAMOA"}</text>
<text x="${lx+colW-114}" y="${y+18}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${lang==="ru"?"И":"O'"}</text>
<text x="${lx+colW-70}" y="${y+18}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${lang==="ru"?"С":"S"}</text>
<text x="${lx+colW-28}" y="${y+18}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${lang==="ru"?"О":"B"}</text>`;
  y += 32;

  for (let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const ry  = y + i * 46;
    const bc  = i === 0 ? ACCENT : i < 3 ? "#FB923C" : NAVY;
    if (i < 3) body += `<rect x="${lx-4}" y="${ry-22}" width="${colW+8}" height="42" fill="${ACCENT}" opacity="0.05"/>`;
    body += `<rect x="${lx}" y="${ry-18}" width="26" height="26" rx="5" fill="${bc}"/>
<text x="${lx+13}" y="${ry-1}" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(row.rank)}</text>
<circle cx="${lx+52}" cy="${ry-5}" r="14" fill="${BORDER}"/>
<text x="${lx+72}" y="${ry}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${NAVY}">${esc(row.team||"—")}</text>
<text x="${lx+colW-107}" y="${ry}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${esc(row.played)}</text>
<text x="${lx+colW-62}" y="${ry}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${row.gd>0?"+"+row.gd:esc(row.gd)}</text>
<text x="${lx+colW-17}" y="${ry}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">${esc(row.points)}</text>
<line x1="${lx}" y1="${ry+20}" x2="${lx+colW}" y2="${ry+20}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  // ── Results ───────────────────────────────────────────────────────────────
  let ry2 = 296 + 44;
  body += secHeader(rx, ry2, lang==="ru"?"Результаты":"Natijalar");
  ry2 += 28;

  for (const m of results) {
    const hasH  = !!(m.label || m.date);
    const cardH = hasH ? 74 : 56;
    const cx    = rx + colW / 2;
    const sy    = ry2 + (hasH ? 57 : 38);

    body += `<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="12" fill="${LIGHT}"/>`;
    if (hasH) {
      body += `<text x="${rx+14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${esc((m.label||"").toUpperCase())}</text>`;
      if (m.date) body += `<text x="${rx+colW-14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}" text-anchor="end">${esc(m.date)}</text>`;
    }
    body += `<text x="${cx-48}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${NAVY}" text-anchor="end">${esc(m.home||"—")}</text>
<rect x="${cx-40}" y="${sy-18}" width="80" height="27" rx="7" fill="${NAVY}"/>
<text x="${cx}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.homeScore)} : ${esc(m.awayScore)}</text>
<text x="${cx+48}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${NAVY}">${esc(m.away||"—")}</text>`;

    ry2 += cardH + 12;
  }

  // ── Top Performers ────────────────────────────────────────────────────────
  ry2 += 16;
  body += secHeader(rx, ry2, lang==="ru"?"Лучшие игроки":"Eng yaxshi o'yinchilar");
  ry2 += 28;

  const medalC = ["#E5A800","#9AA0AE","#9C5A1F"];
  for (let i = 0; i < top.length; i++) {
    const p  = top[i];
    const py = ry2 + i * 52;
    const mc = i < 3 ? medalC[i] : NAVY;
    body += `<circle cx="${rx+14}" cy="${py}" r="14" fill="${mc}"/>
<text x="${rx+14}" y="${py+5}" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="${WHITE}" text-anchor="middle">${i+1}</text>
<text x="${rx+36}" y="${py-2}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="${NAVY}">${esc(p.name||"—")}</text>
<text x="${rx+36}" y="${py+16}" font-family="Arial,sans-serif" font-size="12" fill="${GRAY}">${esc(p.team||"")}</text>
<text x="${rx+colW-4}" y="${py+4}" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${ACCENT}" text-anchor="end">${esc(p.goals)}</text>
<text x="${rx+colW-4}" y="${py+18}" font-family="Arial,sans-serif" font-size="11" fill="${GRAY}" text-anchor="end">${lang==="ru"?"очк.":"ball"}</text>
<line x1="${rx}" y1="${py+30}" x2="${rx+colW}" y2="${py+30}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  body += `<rect y="${H-54}" width="${W}" height="54" fill="${NAVY}"/>
<text x="${pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.55)">Voleybol Poster Studio</text>
<text x="${W-pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.55)" text-anchor="end">${esc(new Date().toLocaleDateString(lang==="ru"?"ru-RU":"uz-UZ"))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${WHITE}"/>
${body}
</svg>`;
}

async function sendDocument(chatId, svgBuffer, caption) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("document", new Blob([svgBuffer], { type: "image/svg+xml" }), "poster.svg");
  const res = await fetch(`${TG}/sendDocument`, { method: "POST", body: form });
  return res.json();
}

// ── handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { getSvg, reportData, lang } = req.body;
    if (!reportData) {
      return res.status(400).json({ ok: false, error: "Missing reportData" });
    }

    const svgStr = buildSVG({ ...reportData, lang: lang || "uz" });

    // getSvg=true → just return SVG string to browser for PNG conversion
    if (getSvg) {
      return res.status(200).json({ ok: true, svg: svgStr });
    }

    // fallback: send SVG as document (not used anymore but kept as backup)
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ ok: false, error: "Missing chatId" });
    const svgBuf = Buffer.from(svgStr, "utf8");
    const caption = `🏐 ${reportData.leagueName || "Poster"}${reportData.roundName ? " — " + reportData.roundName : ""}`;
    const result  = await sendDocument(String(chatId), svgBuf, caption);

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
