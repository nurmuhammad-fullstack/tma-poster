const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const W = 1080, H = 1350;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Inline SVG icon paths, scaled to fit a ~16×16 area inside a 30×30 rect
// All paths use translate(ix, iy) where ix,iy is the top-left of the icon inside the rect
function iconPath(type, ix, iy, color) {
  const t = `translate(${ix},${iy})`;
  if (type === "trophy") {
    // Trophy cup: simplified cup shape
    return `<g transform="${t}">
<path d="M3 1h10v7a5 5 0 0 1-10 0V1z" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M1 2h2M13 2h2" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
<path d="M1 2c0 3 1.5 5 3 5" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
<path d="M15 2c0 3-1.5 5-3 5" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/>
<line x1="8" y1="12" x2="8" y2="15" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
<line x1="5" y1="15" x2="11" y2="15" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
</g>`;
  }
  if (type === "ball") {
    // Volleyball: circle with curved lines
    return `<g transform="${t}">
<circle cx="8" cy="8" r="6.5" fill="none" stroke="${color}" stroke-width="1.5"/>
<path d="M2 8 Q5 5 8 8 Q11 11 14 8" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
<path d="M5 2.5 Q6 6 5 9.5" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
<path d="M11 2.5 Q10 6 11 9.5" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
</g>`;
  }
  if (type === "star") {
    // 5-point star
    return `<g transform="${t}">
<polygon points="8,1.5 9.8,6 14.5,6 10.8,8.8 12.2,13.5 8,10.5 3.8,13.5 5.2,8.8 1.5,6 6.2,6" fill="${color}" opacity="0.9"/>
</g>`;
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 1: Classic  (Navy + Orange)
// ─────────────────────────────────────────────────────────────────────────────
function buildClassic(d) {
  const lang = d.lang || "uz";
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];

  const NAVY = "#0D1B2A", ACCENT = "#F97316", WHITE = "#FFFFFF";
  const GRAY = "#8A92A6", LIGHT = "#F7F8FA", BORDER = "#EEF0F4";

  const pad = 60, colW = (W - pad * 2 - 44) / 2;
  const lx = pad, rx = pad + colW + 44;

  const secHeader = (x, y, title, icon) =>
    `<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="${ACCENT}"/>
${iconPath(icon, x+7, y-15, "#fff")}
<text x="${x+40}" y="${y}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${NAVY}">${esc(title.toUpperCase())}</text>
<line x1="${x}" y1="${y+20}" x2="${x+colW}" y2="${y+20}" stroke="${NAVY}" stroke-width="2"/>`;

  const lname = esc((d.leagueName || "").toUpperCase());
  const lsize = lname.length > 18 ? 46 : lname.length > 12 ? 56 : 66;
  let body = "";

  body += `<rect width="${W}" height="290" fill="${NAVY}"/>
<polygon points="${W*0.52},0 ${W},0 ${W},290 ${W*0.45},290" fill="${ACCENT}" opacity="0.93"/>
<text x="64" y="${165+(66-lsize)}" font-family="Arial,sans-serif" font-size="${lsize}" font-weight="900" fill="${WHITE}">${lname}</text>
<text x="64" y="240" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.9)">${esc(d.roundName||"")}</text>
<rect y="290" width="${W}" height="6" fill="${ACCENT}"/>`;

  let y = 296 + 54;
  body += secHeader(lx, y, lang==="ru"?"Турнирная таблица":"Turnir jadvali", "trophy");
  y += 40;
  // header row
  body += `<rect x="${lx-8}" y="${y}" width="${colW+16}" height="30" rx="6" fill="${NAVY}" opacity="0.07"/>
<text x="${lx+4}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">#</text>
<text x="${lx+72}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">${lang==="ru"?"КОМАНДА":"JAMOA"}</text>
<text x="${lx+colW-107}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${ACCENT}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"И":"O'"}</text>
<text x="${lx+colW-62}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${ACCENT}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"С":"S"}</text>
<text x="${lx+colW-17}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${ACCENT}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"О":"B"}</text>`;
  y += 38;

  // data rows — each row is 44px tall, top-aligned from y
  for (let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const ry  = y + i * 44;      // top of this row
    const mid = ry + 22;         // vertical center
    const bc  = i === 0 ? ACCENT : i < 3 ? "#FB923C" : NAVY;
    if (i < 3) body += `<rect x="${lx-4}" y="${ry+2}" width="${colW+8}" height="40" rx="6" fill="${ACCENT}" opacity="0.05"/>`;
    body += `<rect x="${lx}" y="${ry+8}" width="26" height="26" rx="5" fill="${bc}"/>
<text x="${lx+13}" y="${ry+25}" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(row.rank)}</text>
<circle cx="${lx+52}" cy="${mid}" r="14" fill="${BORDER}"/>
<text x="${lx+72}" y="${mid+5}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${NAVY}">${esc(row.team||"—")}</text>
<text x="${lx+colW-107}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${esc(row.played)}</text>
<text x="${lx+colW-62}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${row.gd>0?"+"+row.gd:esc(row.gd)}</text>
<text x="${lx+colW-17}" y="${mid+6}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${NAVY}" text-anchor="middle">${esc(row.points)}</text>
<line x1="${lx}" y1="${ry+43}" x2="${lx+colW}" y2="${ry+43}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  let ry2 = 296 + 54;
  body += secHeader(rx, ry2, lang==="ru"?"Результаты":"Natijalar", "ball");
  ry2 += 40;
  for (const m of results) {
    const hasH = !!(m.label || m.date), cardH = hasH ? 74 : 56;
    const cx = rx + colW / 2, sy = ry2 + (hasH ? 57 : 38);
    body += `<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="12" fill="${LIGHT}"/>`;
    if (hasH) {
      body += `<text x="${rx+14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${esc((m.label||"").toUpperCase())}</text>`;
      if (m.date) body += `<text x="${rx+colW-14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}" text-anchor="end">${esc(m.date)}</text>`;
    }
    body += `<text x="${cx-52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${NAVY}" text-anchor="end">${esc(m.home||"—")}</text>
<rect x="${cx-44}" y="${sy-19}" width="88" height="28" rx="7" fill="${NAVY}"/>
<text x="${cx-10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.homeScore)}</text>
<text x="${cx}" y="${sy}" font-family="Arial,sans-serif" font-size="13" font-weight="400" fill="rgba(255,255,255,0.6)" text-anchor="middle">:</text>
<text x="${cx+10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.awayScore)}</text>
<text x="${cx+52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${NAVY}">${esc(m.away||"—")}</text>`;
    ry2 += cardH + 12;
  }

  ry2 += 28;
  body += secHeader(rx, ry2, lang==="ru"?"Лучшие игроки":"Eng yaxshi o'yinchilar", "star");
  ry2 += 40;
  const medalC = ["#E5A800","#9AA0AE","#9C5A1F"];
  for (let i = 0; i < top.length; i++) {
    const p = top[i], py = ry2 + i * 52, mc = i < 3 ? medalC[i] : NAVY;
    body += `<circle cx="${rx+14}" cy="${py}" r="14" fill="${mc}"/>
<text x="${rx+14}" y="${py+5}" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="${WHITE}" text-anchor="middle">${i+1}</text>
<text x="${rx+36}" y="${py-2}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="${NAVY}">${esc(p.name||"—")}</text>
<text x="${rx+36}" y="${py+16}" font-family="Arial,sans-serif" font-size="12" fill="${GRAY}">${esc(p.team||"")}</text>
<text x="${rx+colW-4}" y="${py+4}" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${ACCENT}" text-anchor="end">${esc(p.goals)}</text>
<text x="${rx+colW-4}" y="${py+18}" font-family="Arial,sans-serif" font-size="11" fill="${GRAY}" text-anchor="end">${lang==="ru"?"очк.":"ball"}</text>
<line x1="${rx}" y1="${py+30}" x2="${rx+colW}" y2="${py+30}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  body += `<rect y="${H-54}" width="${W}" height="54" fill="${NAVY}"/>
<text x="${pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.55)">Voleybol Poster Studio</text>
<text x="${W-pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.55)" text-anchor="end">${esc(new Date().toLocaleDateString(lang==="ru"?"ru-RU":"uz-UZ"))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${WHITE}"/>${body}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 2: Dark Neon  (Black + Cyan + Magenta)
// ─────────────────────────────────────────────────────────────────────────────
function buildDarkNeon(d) {
  const lang = d.lang || "uz";
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];

  const BG = "#0A0A0F", CARD = "#13131C", CYAN = "#00D9FF", MAGENTA = "#FF006E";
  const WHITE = "#FFFFFF", GRAY = "#6B7280", BORDER = "#1E1E2E";

  const pad = 60, colW = (W - pad * 2 - 44) / 2;
  const lx = pad, rx = pad + colW + 44;

  const secHeader = (x, y, title, icon) =>
    `<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="${CYAN}" opacity="0.15"/>
<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="none" stroke="${CYAN}" stroke-width="1.5" opacity="0.6"/>
${iconPath(icon, x+7, y-15, CYAN)}
<text x="${x+40}" y="${y}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${WHITE}">${esc(title.toUpperCase())}</text>
<line x1="${x}" y1="${y+20}" x2="${x+colW}" y2="${y+20}" stroke="${BORDER}" stroke-width="1"/>`;

  const lname = esc((d.leagueName || "").toUpperCase());
  const lsize = lname.length > 18 ? 46 : lname.length > 12 ? 56 : 66;
  let body = "";

  // Hero — full dark with cyan gradient overlay
  body += `<defs>
  <linearGradient id="neonHero" x1="0" y1="0" x2="${W}" y2="290" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${CYAN}" stop-opacity="0.08"/>
    <stop offset="50%" stop-color="${BG}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${MAGENTA}" stop-opacity="0.12"/>
  </linearGradient>
  <linearGradient id="neonAccent" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="${CYAN}"/>
    <stop offset="100%" stop-color="${MAGENTA}"/>
  </linearGradient>
</defs>
<rect width="${W}" height="290" fill="${BG}"/>
<rect width="${W}" height="290" fill="url(#neonHero)"/>
<rect x="64" y="72" width="180" height="3" rx="2" fill="url(#neonAccent)"/>
<text x="64" y="${155+(66-lsize)}" font-family="Arial,sans-serif" font-size="${lsize}" font-weight="900" fill="${WHITE}">${lname}</text>
<text x="64" y="240" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.75)">${esc(d.roundName||"")}</text>
<rect y="288" width="${W}" height="3" fill="url(#neonAccent)"/>`;

  let y = 296 + 54;
  body += secHeader(lx, y, lang==="ru"?"Турнирная таблица":"Turnir jadvali", "trophy");
  y += 40;
  body += `<rect x="${lx-8}" y="${y}" width="${colW+16}" height="30" rx="6" fill="rgba(0,217,255,0.06)"/>
<text x="${lx+4}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">#</text>
<text x="${lx+72}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">${lang==="ru"?"КОМАНДА":"JAMOA"}</text>
<text x="${lx+colW-107}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${CYAN}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"И":"O'"}</text>
<text x="${lx+colW-62}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${CYAN}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"С":"S"}</text>
<text x="${lx+colW-17}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${CYAN}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"О":"B"}</text>`;
  y += 38;

  for (let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const ry  = y + i * 44;
    const mid = ry + 22;
    const rankColor = i === 0 ? CYAN : i < 3 ? MAGENTA : GRAY;
    if (i < 3) body += `<rect x="${lx-4}" y="${ry+2}" width="${colW+8}" height="40" rx="6" fill="${CARD}"/>`;
    body += `<text x="${lx+13}" y="${ry+26}" font-family="Arial,sans-serif" font-size="16" font-weight="900" fill="${rankColor}" text-anchor="middle">${esc(row.rank)}</text>
<circle cx="${lx+52}" cy="${mid}" r="14" fill="${CARD}"/>
<text x="${lx+72}" y="${mid+5}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${WHITE}">${esc(row.team||"—")}</text>
<text x="${lx+colW-107}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${esc(row.played)}</text>
<text x="${lx+colW-62}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${row.gd>0?"+"+row.gd:esc(row.gd)}</text>
<text x="${lx+colW-17}" y="${mid+6}" font-family="Arial,sans-serif" font-size="17" font-weight="800" fill="${CYAN}" text-anchor="middle">${esc(row.points)}</text>
<line x1="${lx}" y1="${ry+43}" x2="${lx+colW}" y2="${ry+43}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  let ry2 = 296 + 54;
  body += secHeader(rx, ry2, lang==="ru"?"Результаты":"Natijalar", "ball");
  ry2 += 40;
  for (const m of results) {
    const hasH = !!(m.label || m.date), cardH = hasH ? 74 : 56;
    const cx = rx + colW / 2, sy = ry2 + (hasH ? 57 : 38);
    body += `<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="12" fill="${CARD}"/>
<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="12" fill="none" stroke="${BORDER}" stroke-width="1"/>`;
    if (hasH) {
      body += `<text x="${rx+14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${esc((m.label||"").toUpperCase())}</text>`;
      if (m.date) body += `<text x="${rx+colW-14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}" text-anchor="end">${esc(m.date)}</text>`;
    }
    body += `<text x="${cx-52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${WHITE}" text-anchor="end">${esc(m.home||"—")}</text>
<rect x="${cx-44}" y="${sy-19}" width="88" height="28" rx="7" fill="url(#neonAccent)"/>
<text x="${cx-10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.homeScore)}</text>
<text x="${cx}" y="${sy}" font-family="Arial,sans-serif" font-size="13" font-weight="400" fill="rgba(255,255,255,0.6)" text-anchor="middle">:</text>
<text x="${cx+10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.awayScore)}</text>
<text x="${cx+52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${WHITE}">${esc(m.away||"—")}</text>`;
    ry2 += cardH + 12;
  }

  ry2 += 28;
  body += secHeader(rx, ry2, lang==="ru"?"Лучшие игроки":"Eng yaxshi o'yinchilar", "star");
  ry2 += 40;
  const medalC = ["#FFD700","#C0C0C0","#CD7F32"];
  for (let i = 0; i < top.length; i++) {
    const p = top[i], py = ry2 + i * 52;
    body += `<circle cx="${rx+14}" cy="${py}" r="14" fill="${i < 3 ? medalC[i] : CARD}" stroke="${BORDER}" stroke-width="1"/>
<text x="${rx+14}" y="${py+5}" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="${BG}" text-anchor="middle">${i+1}</text>
<text x="${rx+36}" y="${py-2}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="${WHITE}">${esc(p.name||"—")}</text>
<text x="${rx+36}" y="${py+16}" font-family="Arial,sans-serif" font-size="12" fill="${GRAY}">${esc(p.team||"")}</text>
<text x="${rx+colW-4}" y="${py+4}" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${CYAN}" text-anchor="end">${esc(p.goals)}</text>
<text x="${rx+colW-4}" y="${py+18}" font-family="Arial,sans-serif" font-size="11" fill="${GRAY}" text-anchor="end">${lang==="ru"?"очк.":"ball"}</text>
<line x1="${rx}" y1="${py+30}" x2="${rx+colW}" y2="${py+30}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  body += `<rect y="${H-54}" width="${W}" height="54" fill="${CARD}"/>
<rect y="${H-54}" width="${W}" height="1" fill="${BORDER}"/>
<text x="${pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="${GRAY}">Voleybol Poster Studio</text>
<text x="${W-pad}" y="${H-18}" font-family="Arial,sans-serif" font-size="12" font-weight="600" fill="${GRAY}" text-anchor="end">${esc(new Date().toLocaleDateString(lang==="ru"?"ru-RU":"uz-UZ"))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>${body}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 3: Minimal Gold  (White + Gold + Charcoal)
// ─────────────────────────────────────────────────────────────────────────────
function buildMinimal(d) {
  const lang = d.lang || "uz";
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];

  const BG = "#FAFAFA", CHARCOAL = "#1A1A2E", GOLD = "#D4A017", SOFT = "#F0F0F0";
  const WHITE = "#FFFFFF", GRAY = "#9CA3AF", BORDER = "#E5E7EB", DARK = "#374151";

  const pad = 60, colW = (W - pad * 2 - 44) / 2;
  const lx = pad, rx = pad + colW + 44;

  const secHeader = (x, y, title, icon) =>
    `<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="${GOLD}" opacity="0.15"/>
<rect x="${x}" y="${y-22}" width="30" height="30" rx="6" fill="none" stroke="${GOLD}" stroke-width="1.5" opacity="0.7"/>
${iconPath(icon, x+7, y-15, GOLD)}
<text x="${x+40}" y="${y}" font-family="Georgia,serif" font-size="13" font-weight="700" fill="${CHARCOAL}" letter-spacing="2">${esc(title.toUpperCase())}</text>
<line x1="${x}" y1="${y+20}" x2="${x+colW}" y2="${y+20}" stroke="${GOLD}" stroke-width="1.5" opacity="0.4"/>`;

  const lname = esc((d.leagueName || "").toUpperCase());
  const lsize = lname.length > 18 ? 46 : lname.length > 12 ? 56 : 66;
  let body = "";

  // Hero — clean white with gold accent bar
  body += `<rect width="${W}" height="290" fill="${CHARCOAL}"/>
<rect x="64" y="60" width="4" height="180" rx="2" fill="${GOLD}"/>
<text x="88" y="${175+(66-lsize)}" font-family="Arial,sans-serif" font-size="${lsize}" font-weight="900" fill="${WHITE}" letter-spacing="-1">${lname}</text>
<text x="88" y="240" font-family="Georgia,serif" font-size="24" font-weight="400" fill="rgba(255,255,255,0.65)" font-style="italic">${esc(d.roundName||"")}</text>
<line x1="0" y1="290" x2="${W}" y2="290" stroke="${GOLD}" stroke-width="2"/>`;

  let y = 296 + 54;
  body += secHeader(lx, y, lang==="ru"?"Турнирная таблица":"Turnir jadvali", "trophy");
  y += 40;
  body += `<rect x="${lx-8}" y="${y}" width="${colW+16}" height="30" rx="6" fill="${GOLD}" opacity="0.07"/>
<text x="${lx+4}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">#</text>
<text x="${lx+72}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GRAY}" letter-spacing="1">${lang==="ru"?"КОМАНДА":"JAMOA"}</text>
<text x="${lx+colW-107}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GOLD}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"И":"O'"}</text>
<text x="${lx+colW-62}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GOLD}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"С":"S"}</text>
<text x="${lx+colW-17}" y="${y+20}" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${GOLD}" text-anchor="middle" letter-spacing="1">${lang==="ru"?"О":"B"}</text>`;
  y += 38;

  for (let i = 0; i < standings.length; i++) {
    const row = standings[i];
    const ry  = y + i * 44;
    const mid = ry + 22;
    const isTop = i === 0;
    if (isTop) body += `<rect x="${lx-4}" y="${ry+2}" width="${colW+8}" height="40" rx="8" fill="${GOLD}" opacity="0.08"/>`;
    body += `<text x="${lx+13}" y="${ry+26}" font-family="Arial,sans-serif" font-size="14" font-weight="800" fill="${isTop ? GOLD : GRAY}" text-anchor="middle">${esc(row.rank)}</text>
<circle cx="${lx+52}" cy="${mid}" r="14" fill="${SOFT}"/>
<text x="${lx+72}" y="${mid+5}" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="${CHARCOAL}">${esc(row.team||"—")}</text>
<text x="${lx+colW-107}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${esc(row.played)}</text>
<text x="${lx+colW-62}" y="${mid+5}" font-family="Arial,sans-serif" font-size="14" fill="${GRAY}" text-anchor="middle">${row.gd>0?"+"+row.gd:esc(row.gd)}</text>
<text x="${lx+colW-17}" y="${mid+6}" font-family="Arial,sans-serif" font-size="17" font-weight="900" fill="${isTop ? GOLD : DARK}" text-anchor="middle">${esc(row.points)}</text>
<line x1="${lx}" y1="${ry+43}" x2="${lx+colW}" y2="${ry+43}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  let ry2 = 296 + 54;
  body += secHeader(rx, ry2, lang==="ru"?"Результаты":"Natijalar", "ball");
  ry2 += 40;
  for (const m of results) {
    const hasH = !!(m.label || m.date), cardH = hasH ? 74 : 56;
    const cx = rx + colW / 2, sy = ry2 + (hasH ? 57 : 38);
    body += `<rect x="${rx}" y="${ry2+4}" width="${colW}" height="${cardH}" rx="10" fill="${WHITE}" stroke="${BORDER}" stroke-width="1.5"/>`;
    if (hasH) {
      body += `<text x="${rx+14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="${GRAY}">${esc((m.label||"").toUpperCase())}</text>`;
      if (m.date) body += `<text x="${rx+colW-14}" y="${ry2+22}" font-family="Arial,sans-serif" font-size="11" fill="${GRAY}" text-anchor="end">${esc(m.date)}</text>`;
    }
    body += `<text x="${cx-52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${CHARCOAL}" text-anchor="end">${esc(m.home||"—")}</text>
<rect x="${cx-44}" y="${sy-19}" width="88" height="28" rx="6" fill="${CHARCOAL}"/>
<text x="${cx-10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.homeScore)}</text>
<text x="${cx}" y="${sy}" font-family="Arial,sans-serif" font-size="13" font-weight="400" fill="rgba(255,255,255,0.5)" text-anchor="middle">:</text>
<text x="${cx+10}" y="${sy}" font-family="Arial,sans-serif" font-size="15" font-weight="800" fill="${WHITE}" text-anchor="middle">${esc(m.awayScore)}</text>
<text x="${cx+52}" y="${sy}" font-family="Arial,sans-serif" font-size="14" font-weight="600" fill="${CHARCOAL}">${esc(m.away||"—")}</text>`;
    ry2 += cardH + 12;
  }

  ry2 += 28;
  body += secHeader(rx, ry2, lang==="ru"?"Лучшие игроки":"Eng yaxshi o'yinchilar", "star");
  ry2 += 40;
  const medalC = ["#D4A017","#9AA0AE","#9C5A1F"];
  for (let i = 0; i < top.length; i++) {
    const p = top[i], py = ry2 + i * 52, mc = i < 3 ? medalC[i] : SOFT;
    body += `<circle cx="${rx+14}" cy="${py}" r="14" fill="${mc}"/>
<text x="${rx+14}" y="${py+5}" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="${WHITE}" text-anchor="middle">${i+1}</text>
<text x="${rx+36}" y="${py-2}" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="${CHARCOAL}">${esc(p.name||"—")}</text>
<text x="${rx+36}" y="${py+16}" font-family="Arial,sans-serif" font-size="12" fill="${GRAY}">${esc(p.team||"")}</text>
<text x="${rx+colW-4}" y="${py+4}" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="${GOLD}" text-anchor="end">${esc(p.goals)}</text>
<text x="${rx+colW-4}" y="${py+18}" font-family="Arial,sans-serif" font-size="11" fill="${GRAY}" text-anchor="end">${lang==="ru"?"очк.":"ball"}</text>
<line x1="${rx}" y1="${py+30}" x2="${rx+colW}" y2="${py+30}" stroke="${BORDER}" stroke-width="1"/>`;
  }

  body += `<line x1="0" y1="${H-54}" x2="${W}" y2="${H-54}" stroke="${GOLD}" stroke-width="1" opacity="0.4"/>
<rect y="${H-53}" width="${W}" height="53" fill="${CHARCOAL}"/>
<text x="${pad}" y="${H-18}" font-family="Georgia,serif" font-size="12" fill="rgba(255,255,255,0.45)">Voleybol Poster Studio</text>
<text x="${W-pad}" y="${H-18}" font-family="Georgia,serif" font-size="12" fill="rgba(255,255,255,0.45)" text-anchor="end">${esc(new Date().toLocaleDateString(lang==="ru"?"ru-RU":"uz-UZ"))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${BG}"/>${body}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
export function buildSVG(d) {
  const theme = d.theme || "classic";
  if (theme === "neon")    return buildDarkNeon(d);
  if (theme === "minimal") return buildMinimal(d);
  return buildClassic(d);
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
    const { getSvg, reportData, lang, theme } = req.body;
    if (!reportData) return res.status(400).json({ ok: false, error: "Missing reportData" });

    const svgStr = buildSVG({ ...reportData, lang: lang || "uz", theme: theme || "classic" });

    if (getSvg) return res.status(200).json({ ok: true, svg: svgStr });

    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ ok: false, error: "Missing chatId" });
    const svgBuf = Buffer.from(svgStr, "utf8");
    const caption = `🏐 ${reportData.leagueName || "Poster"}${reportData.roundName ? " — " + reportData.roundName : ""}`;
    const result  = await sendDocument(String(chatId), svgBuf, caption);

    if (result.ok) res.status(200).json({ ok: true });
    else res.status(200).json({ ok: false, error: result.description });
  } catch (e) {
    console.error("render-poster error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
