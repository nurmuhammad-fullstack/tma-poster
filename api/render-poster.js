import satori, { init } from "satori";

const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const W = 1080, H = 1350;

// h() — lightweight JSX-like helper (no transpiler needed)
function h(type, props, ...children) {
  const flat = children.flat(Infinity).filter((c) => c != null && c !== false);
  return { type, props: { ...props, children: flat.length === 1 ? flat[0] : flat.length === 0 ? undefined : flat } };
}

// ── font cache ────────────────────────────────────────────────────────────────
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  const [r800, r600, r400] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff"),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff"),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff"),
  ]);
  fontCache = [
    { name: "Inter", data: await r800.arrayBuffer(), weight: 800, style: "normal" },
    { name: "Inter", data: await r600.arrayBuffer(), weight: 600, style: "normal" },
    { name: "Inter", data: await r400.arrayBuffer(), weight: 400, style: "normal" },
  ];
  return fontCache;
}

// ── shared styles ─────────────────────────────────────────────────────────────
const row   = (extra = {}) => ({ display: "flex", flexDirection: "row",  ...extra });
const col   = (extra = {}) => ({ display: "flex", flexDirection: "column", ...extra });
const abs   = (extra = {}) => ({ position: "absolute", ...extra });

// ─────────────────────────────────────────────────────────────────────────────
// THEME 1 — Stadium Dark  (dark blue + gold)
// ─────────────────────────────────────────────────────────────────────────────
function themeStadium(d, lang) {
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];
  const lname     = (d.leagueName || "").toUpperCase();
  const lsize     = lname.length > 18 ? 52 : lname.length > 12 ? 64 : 76;

  const GOLD  = "#F5C842";
  const BLUE  = "#0B1A35";
  const WHITE = "rgba(255,255,255,0.92)";
  const GRAY  = "rgba(255,255,255,0.45)";
  const SCORE = "#0B1A35";
  const medals = ["#F5C842", "#B0B7C3", "#CD7F32"];

  const SectionLabel = (title) =>
    h("div", { style: row({ alignItems: "center", gap: 10, marginBottom: 14 }) },
      h("div", { style: { width: 4, height: 22, background: GOLD, borderRadius: 2 } }),
      h("div", { style: { fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 3 } }, title.toUpperCase())
    );

  const StandingRow = (rowData, i) =>
    h("div", { style: row({
      alignItems: "center", padding: "9px 12px",
      background: i < 3 ? "rgba(245,200,66,0.1)" : "rgba(255,255,255,0.04)",
      borderRadius: 10, marginBottom: 5, gap: 10,
    }) },
      h("div", { style: row({
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: i === 0 ? GOLD : i < 3 ? "rgba(245,200,66,0.5)" : "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        color: i === 0 ? SCORE : WHITE,
      }) }, String(rowData.rank)),
      h("div", { style: { flex: 1, fontSize: 14, fontWeight: 600, color: WHITE } }, rowData.team || "—"),
      h("div", { style: { fontSize: 12, color: GRAY, width: 26, textAlign: "center" } }, String(rowData.played)),
      h("div", { style: { fontSize: 12, color: GRAY, width: 32, textAlign: "center" } },
        rowData.gd > 0 ? `+${rowData.gd}` : String(rowData.gd)),
      h("div", { style: { fontSize: 18, fontWeight: 800, color: GOLD, width: 30, textAlign: "center" } },
        String(rowData.points))
    );

  const MatchCard = (m) =>
    h("div", { style: col({
      background: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 8,
      border: "1px solid rgba(245,200,66,0.15)", overflow: "hidden",
    }) },
      (m.label || m.date) && h("div", { style: row({
        justifyContent: "space-between", padding: "6px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }) },
        h("div", { style: { fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 } },
          (m.label || "").toUpperCase()),
        h("div", { style: { fontSize: 10, color: GRAY } }, m.date || "")
      ),
      h("div", { style: row({ alignItems: "center", padding: "11px 12px", gap: 8 }) },
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: WHITE, textAlign: "right" } }, m.home || "—"),
        h("div", { style: row({
          background: GOLD, borderRadius: 8, padding: "6px 12px",
          fontSize: 15, fontWeight: 800, color: SCORE,
          minWidth: 68, justifyContent: "center",
        }) }, `${m.homeScore} : ${m.awayScore}`),
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: WHITE } }, m.away || "—")
      )
    );

  const TopRow = (p, i) =>
    h("div", { style: row({
      alignItems: "center", padding: "9px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 10,
    }) },
      h("div", { style: row({
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: SCORE,
      }) }, String(i + 1)),
      h("div", { style: col({ flex: 1 }) },
        h("div", { style: { fontSize: 14, fontWeight: 700, color: WHITE } }, p.name || "—"),
        h("div", { style: { fontSize: 11, color: GRAY } }, p.team || "")
      ),
      h("div", { style: col({ alignItems: "flex-end" }) },
        h("div", { style: { fontSize: 20, fontWeight: 800, color: GOLD } }, String(p.goals)),
        h("div", { style: { fontSize: 9, color: GRAY, letterSpacing: 1 } }, lang === "ru" ? "ОЧК" : "BALL")
      )
    );

  return h("div", { style: col({
    width: W, height: H,
    background: "linear-gradient(160deg, #0B1A35 0%, #0D2147 40%, #091428 100%)",
    fontFamily: "Inter", position: "relative", overflow: "hidden",
  }) },
    // glow top
    h("div", { style: abs({ top: -200, left: "25%", width: 600, height: 500,
      background: "radial-gradient(ellipse, rgba(30,80,180,0.5) 0%, transparent 70%)" }) }),
    // spotlight left
    h("div", { style: abs({ top: 0, left: "18%", width: 2, height: 300,
      background: "linear-gradient(180deg, rgba(245,200,66,0.5) 0%, transparent 100%)",
      transform: "rotate(-12deg)" }) }),
    // spotlight right
    h("div", { style: abs({ top: 0, right: "18%", width: 2, height: 300,
      background: "linear-gradient(180deg, rgba(245,200,66,0.5) 0%, transparent 100%)",
      transform: "rotate(12deg)" }) }),

    // ── HERO ──
    h("div", { style: col({
      alignItems: "center", padding: "52px 60px 40px",
      borderBottom: "1px solid rgba(245,200,66,0.2)", position: "relative",
    }) },
      // crown bars
      h("div", { style: row({ gap: 5, marginBottom: 18, alignItems: "flex-end" }) },
        ...[40, 54, 64, 54, 40].map((ht, i) =>
          h("div", { key: i, style: {
            width: 9, height: ht, borderRadius: "3px 3px 0 0",
            background: i === 2 ? GOLD : `rgba(245,200,66,${0.25 + (i === 1 || i === 3 ? 0.25 : 0)})`,
          } })
        )
      ),
      h("div", { style: { fontSize: 12, color: GOLD, letterSpacing: 4, fontWeight: 600, marginBottom: 10 } },
        `${lang === "ru" ? "СЕЗОН" : "MAVSUM"} · ${d.season || ""}`),
      h("div", { style: row({ alignItems: "center", gap: 10, marginBottom: 14 }) },
        h("div", { style: { width: 80, height: 1, background: "rgba(245,200,66,0.4)" } }),
        h("div", { style: { width: 5, height: 5, background: GOLD, borderRadius: "50%" } }),
        h("div", { style: { width: 80, height: 1, background: "rgba(245,200,66,0.4)" } })
      ),
      h("div", { style: {
        fontSize: lsize, fontWeight: 800, color: WHITE,
        textAlign: "center", letterSpacing: -1, lineHeight: 1.05,
      } }, lname || "LIGA"),
      h("div", { style: { fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginTop: 12 } },
        d.roundName || "")
    ),

    // ── BODY ──
    h("div", { style: row({ flex: 1, padding: "32px 60px 16px", gap: 36 }) },
      // LEFT standings
      h("div", { style: col({ flex: 1 }) },
        SectionLabel(lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"),
        h("div", { style: row({ justifyContent: "flex-end", gap: 8, marginBottom: 8 }) },
          h("div", { style: { fontSize: 10, color: GRAY, width: 26, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "И" : "O'"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 32, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "С" : "S"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 30, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "О" : "B")
        ),
        ...standings.map((s, i) => StandingRow(s, i))
      ),
      // RIGHT results + top
      h("div", { style: col({ flex: 1, gap: 28 }) },
        h("div", { style: col({}) },
          SectionLabel(lang === "ru" ? "Результаты" : "Natijalar"),
          ...results.map(MatchCard)
        ),
        h("div", { style: col({}) },
          SectionLabel(lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"),
          ...top.map((p, i) => TopRow(p, i))
        )
      )
    ),

    // ── FOOTER ──
    h("div", { style: row({
      justifyContent: "space-between", alignItems: "center",
      padding: "14px 60px",
      borderTop: "1px solid rgba(245,200,66,0.2)",
      background: "rgba(0,0,0,0.35)",
    }) },
      h("div", { style: { fontSize: 11, color: GRAY, letterSpacing: 2 } }, "🏐 VOLEYBOL POSTER STUDIO"),
      h("div", { style: { fontSize: 11, color: GRAY } },
        new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ"))
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 2 — Neon Sport
// ─────────────────────────────────────────────────────────────────────────────
function themeNeon(d, lang) {
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];
  const lname     = (d.leagueName || "").toUpperCase();
  const lsize     = lname.length > 18 ? 52 : lname.length > 12 ? 64 : 76;

  const CYAN    = "#00E5FF";
  const MAGENTA = "#FF2D78";
  const BG      = "#07070F";
  const WHITE   = "rgba(255,255,255,0.9)";
  const GRAY    = "rgba(255,255,255,0.4)";
  const CARD    = "rgba(255,255,255,0.04)";
  const BORDER  = "rgba(255,255,255,0.07)";
  const medals  = ["#FFD700", "#C0C0C0", "#CD7F32"];

  const SectionLabel = (title) =>
    h("div", { style: row({ alignItems: "center", gap: 10, marginBottom: 14 }) },
      h("div", { style: {
        width: 28, height: 3, borderRadius: 2,
        background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
      } }),
      h("div", { style: { fontSize: 11, fontWeight: 800, color: WHITE, letterSpacing: 3 } }, title.toUpperCase())
    );

  const StandingRow = (rowData, i) => {
    const rc = i === 0 ? CYAN : i < 3 ? MAGENTA : WHITE;
    return h("div", { style: row({
      alignItems: "center", padding: "9px 12px",
      background: CARD, borderRadius: 8, marginBottom: 5,
      border: `1px solid ${i < 3 ? "rgba(0,229,255,0.12)" : BORDER}`, gap: 10,
    }) },
      h("div", { style: { width: 22, fontSize: 14, fontWeight: 800, color: rc, textAlign: "center" } },
        String(rowData.rank)),
      h("div", { style: { flex: 1, fontSize: 14, fontWeight: 600, color: WHITE } }, rowData.team || "—"),
      h("div", { style: { fontSize: 12, color: GRAY, width: 26, textAlign: "center" } }, String(rowData.played)),
      h("div", { style: { fontSize: 12, color: GRAY, width: 32, textAlign: "center" } },
        rowData.gd > 0 ? `+${rowData.gd}` : String(rowData.gd)),
      h("div", { style: { fontSize: 17, fontWeight: 800, color: CYAN, width: 28, textAlign: "center" } },
        String(rowData.points))
    );
  };

  const MatchCard = (m) =>
    h("div", { style: col({
      background: CARD, borderRadius: 10, marginBottom: 7,
      border: `1px solid ${BORDER}`, overflow: "hidden",
    }) },
      (m.label || m.date) && h("div", { style: row({ justifyContent: "space-between", padding: "6px 12px" }) },
        h("div", { style: { fontSize: 10, fontWeight: 700, color: CYAN, letterSpacing: 1 } },
          (m.label || "").toUpperCase()),
        h("div", { style: { fontSize: 10, color: GRAY } }, m.date || "")
      ),
      h("div", { style: row({ alignItems: "center", padding: "10px 12px", gap: 8 }) },
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: WHITE, textAlign: "right" } }, m.home || "—"),
        h("div", { style: row({
          borderRadius: 7, padding: "5px 12px",
          background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
          fontSize: 14, fontWeight: 800, color: BG,
          minWidth: 66, justifyContent: "center",
        }) }, `${m.homeScore} : ${m.awayScore}`),
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: WHITE } }, m.away || "—")
      )
    );

  const TopRow = (p, i) =>
    h("div", { style: row({
      alignItems: "center", padding: "9px 0",
      borderBottom: `1px solid ${BORDER}`, gap: 10,
    }) },
      h("div", { style: row({
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "rgba(255,255,255,0.1)",
        alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: "#000",
      }) }, String(i + 1)),
      h("div", { style: col({ flex: 1 }) },
        h("div", { style: { fontSize: 14, fontWeight: 700, color: WHITE } }, p.name || "—"),
        h("div", { style: { fontSize: 11, color: GRAY } }, p.team || "")
      ),
      h("div", { style: col({ alignItems: "flex-end" }) },
        h("div", { style: { fontSize: 20, fontWeight: 800, color: CYAN } }, String(p.goals)),
        h("div", { style: { fontSize: 9, color: GRAY, letterSpacing: 1 } }, lang === "ru" ? "ОЧК" : "BALL")
      )
    );

  return h("div", { style: col({
    width: W, height: H, background: BG,
    fontFamily: "Inter", position: "relative", overflow: "hidden",
  }) },
    h("div", { style: abs({ top: -150, left: -100, width: 450, height: 450,
      background: `radial-gradient(circle, rgba(0,229,255,0.13) 0%, transparent 70%)` }) }),
    h("div", { style: abs({ top: -150, right: -100, width: 450, height: 450,
      background: `radial-gradient(circle, rgba(255,45,120,0.1) 0%, transparent 70%)` }) }),

    // ── HERO ──
    h("div", { style: col({
      alignItems: "center", padding: "50px 60px 38px",
      borderBottom: `1px solid ${BORDER}`, position: "relative",
    }) },
      h("div", { style: {
        width: 140, height: 3, borderRadius: 2, marginBottom: 22,
        background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
      } }),
      h("div", { style: { fontSize: 12, color: CYAN, letterSpacing: 4, fontWeight: 600, marginBottom: 14 } },
        `${lang === "ru" ? "СЕЗОН" : "MAVSUM"} · ${d.season || ""}`),
      h("div", { style: {
        fontSize: lsize, fontWeight: 800, color: WHITE,
        textAlign: "center", letterSpacing: -1, lineHeight: 1.05,
      } }, lname || "LIGA"),
      h("div", { style: { fontSize: 22, fontWeight: 600, color: GRAY, marginTop: 12 } }, d.roundName || ""),
      h("div", { style: {
        marginTop: 18, width: 100, height: 2, borderRadius: 1,
        background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
      } })
    ),

    // ── BODY ──
    h("div", { style: row({ flex: 1, padding: "30px 60px 16px", gap: 34 }) },
      h("div", { style: col({ flex: 1 }) },
        SectionLabel(lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"),
        h("div", { style: row({ justifyContent: "flex-end", gap: 8, marginBottom: 8 }) },
          h("div", { style: { fontSize: 10, color: GRAY, width: 26, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "И" : "O'"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 32, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "С" : "S"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 28, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "О" : "B")
        ),
        ...standings.map((s, i) => StandingRow(s, i))
      ),
      h("div", { style: col({ flex: 1, gap: 26 }) },
        h("div", {},
          SectionLabel(lang === "ru" ? "Результаты" : "Natijalar"),
          ...results.map(MatchCard)
        ),
        h("div", {},
          SectionLabel(lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"),
          ...top.map((p, i) => TopRow(p, i))
        )
      )
    ),

    // ── FOOTER ──
    h("div", { style: row({
      justifyContent: "space-between", alignItems: "center",
      padding: "13px 60px", borderTop: `1px solid ${BORDER}`,
      background: "rgba(0,0,0,0.4)",
    }) },
      h("div", { style: { fontSize: 11, color: GRAY, letterSpacing: 2 } }, "🏐 VOLEYBOL POSTER STUDIO"),
      h("div", { style: { fontSize: 11, color: GRAY } },
        new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ"))
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 3 — Minimal Gold
// ─────────────────────────────────────────────────────────────────────────────
function themeMinimal(d, lang) {
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];
  const lname     = (d.leagueName || "").toUpperCase();
  const lsize     = lname.length > 18 ? 52 : lname.length > 12 ? 64 : 76;

  const GOLD    = "#C9962A";
  const DARK    = "#12121E";
  const CHARCOAL = "#1E1E2E";
  const BG      = "#F8F7F4";
  const WHITE   = "#FFFFFF";
  const GRAY    = "#9199A8";
  const BORDER  = "#EAECF0";
  const medals  = ["#C9962A", "#9AA0AE", "#A0724A"];

  const SectionLabel = (title) =>
    h("div", { style: row({ alignItems: "center", gap: 10, marginBottom: 14 }) },
      h("div", { style: { fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: 4 } }, title.toUpperCase()),
      h("div", { style: { flex: 1, height: 1, background: `${GOLD}44` } })
    );

  const StandingRow = (rowData, i) =>
    h("div", { style: row({
      alignItems: "center", padding: "10px 12px",
      background: i === 0 ? `${GOLD}0D` : WHITE,
      borderRadius: 10, marginBottom: 6, gap: 10,
      border: `1px solid ${i === 0 ? `${GOLD}33` : BORDER}`,
    }) },
      h("div", { style: row({
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: i === 0 ? GOLD : i < 3 ? `${GOLD}33` : "#F0F1F3",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        color: i === 0 ? WHITE : i < 3 ? GOLD : GRAY,
      }) }, String(rowData.rank)),
      h("div", { style: { flex: 1, fontSize: 14, fontWeight: 600, color: DARK } }, rowData.team || "—"),
      h("div", { style: { fontSize: 12, color: GRAY, width: 26, textAlign: "center" } }, String(rowData.played)),
      h("div", { style: { fontSize: 12, color: GRAY, width: 32, textAlign: "center" } },
        rowData.gd > 0 ? `+${rowData.gd}` : String(rowData.gd)),
      h("div", { style: {
        fontSize: 18, fontWeight: 800, width: 30, textAlign: "center",
        color: i === 0 ? GOLD : DARK,
      } }, String(rowData.points))
    );

  const MatchCard = (m) =>
    h("div", { style: col({
      background: WHITE, borderRadius: 12, marginBottom: 8,
      border: `1px solid ${BORDER}`, overflow: "hidden",
    }) },
      (m.label || m.date) && h("div", { style: row({
        justifyContent: "space-between", padding: "6px 12px",
        background: "#F8F7F4", borderBottom: `1px solid ${BORDER}`,
      }) },
        h("div", { style: { fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 } },
          (m.label || "").toUpperCase()),
        h("div", { style: { fontSize: 10, color: GRAY } }, m.date || "")
      ),
      h("div", { style: row({ alignItems: "center", padding: "11px 12px", gap: 8 }) },
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: DARK, textAlign: "right" } }, m.home || "—"),
        h("div", { style: row({
          background: CHARCOAL, borderRadius: 8, padding: "6px 12px",
          fontSize: 14, fontWeight: 800, color: WHITE,
          minWidth: 66, justifyContent: "center",
        }) }, `${m.homeScore} : ${m.awayScore}`),
        h("div", { style: { flex: 1, fontSize: 13, fontWeight: 600, color: DARK } }, m.away || "—")
      )
    );

  const TopRow = (p, i) =>
    h("div", { style: row({
      alignItems: "center", padding: "9px 0",
      borderBottom: `1px solid ${BORDER}`, gap: 10,
    }) },
      h("div", { style: row({
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "#F0F1F3",
        alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: i < 3 ? WHITE : GRAY,
      }) }, String(i + 1)),
      h("div", { style: col({ flex: 1 }) },
        h("div", { style: { fontSize: 14, fontWeight: 700, color: DARK } }, p.name || "—"),
        h("div", { style: { fontSize: 11, color: GRAY } }, p.team || "")
      ),
      h("div", { style: col({ alignItems: "flex-end" }) },
        h("div", { style: { fontSize: 20, fontWeight: 800, color: GOLD } }, String(p.goals)),
        h("div", { style: { fontSize: 9, color: GRAY, letterSpacing: 1 } }, lang === "ru" ? "ОЧК" : "BALL")
      )
    );

  return h("div", { style: col({
    width: W, height: H, background: BG,
    fontFamily: "Inter", position: "relative",
  }) },
    // ── HERO dark panel ──
    h("div", { style: col({
      alignItems: "center", padding: "48px 60px 38px",
      background: `linear-gradient(150deg, ${CHARCOAL} 0%, ${DARK} 100%)`,
      position: "relative", overflow: "hidden",
    }) },
      h("div", { style: abs({ top: -50, right: -50, width: 180, height: 180,
        border: `1px solid ${GOLD}22`, borderRadius: "50%" }) }),
      h("div", { style: abs({ top: -25, right: -25, width: 100, height: 100,
        border: `1px solid ${GOLD}33`, borderRadius: "50%" }) }),
      h("div", { style: { fontSize: 11, color: GOLD, letterSpacing: 5, fontWeight: 600, marginBottom: 14 } },
        `${lang === "ru" ? "СЕЗОН" : "MAVSUM"} · ${d.season || ""}`),
      h("div", { style: { width: 60, height: 2, background: GOLD, borderRadius: 1, marginBottom: 18 } }),
      h("div", { style: {
        fontSize: lsize, fontWeight: 800, color: WHITE,
        textAlign: "center", lineHeight: 1.05, letterSpacing: -1,
      } }, lname || "LIGA"),
      h("div", { style: { fontSize: 20, fontWeight: 400, color: "rgba(255,255,255,0.5)", marginTop: 14 } },
        d.roundName || "")
    ),
    // gold strip
    h("div", { style: { height: 4, background: `linear-gradient(90deg, ${GOLD}, #E8B84B, ${GOLD})` } }),

    // ── BODY ──
    h("div", { style: row({ flex: 1, padding: "30px 60px 16px", gap: 34 }) },
      h("div", { style: col({ flex: 1 }) },
        SectionLabel(lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"),
        h("div", { style: row({ justifyContent: "flex-end", gap: 8, marginBottom: 8 }) },
          h("div", { style: { fontSize: 10, color: GRAY, width: 26, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "И" : "O'"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 32, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "С" : "S"),
          h("div", { style: { fontSize: 10, color: GRAY, width: 30, textAlign: "center", fontWeight: 700 } },
            lang === "ru" ? "О" : "B")
        ),
        ...standings.map((s, i) => StandingRow(s, i))
      ),
      h("div", { style: col({ flex: 1, gap: 26 }) },
        h("div", {},
          SectionLabel(lang === "ru" ? "Результаты" : "Natijalar"),
          ...results.map(MatchCard)
        ),
        h("div", {},
          SectionLabel(lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"),
          ...top.map((p, i) => TopRow(p, i))
        )
      )
    ),

    // ── FOOTER ──
    h("div", { style: row({
      justifyContent: "space-between", alignItems: "center",
      padding: "13px 60px", background: DARK,
    }) },
      h("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 2 } },
        "🏐 VOLEYBOL POSTER STUDIO"),
      h("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)" } },
        new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ"))
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
async function buildSVG(d) {
  const fonts = await getFont();
  const lang  = d.lang || "uz";
  const theme = d.theme || "stadium";

  let element;
  if (theme === "neon")         element = themeNeon(d, lang);
  else if (theme === "minimal") element = themeMinimal(d, lang);
  else                          element = themeStadium(d, lang);

  return satori(element, { width: W, height: H, fonts });
}

// ── handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { getSvg, reportData, lang, theme } = req.body;
    if (!reportData) return res.status(400).json({ ok: false, error: "Missing reportData" });

    const svgStr = await buildSVG({ ...reportData, lang: lang || "uz", theme: theme || "stadium" });

    if (getSvg) return res.status(200).json({ ok: true, svg: svgStr });

    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ ok: false, error: "Missing chatId" });
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("caption", `🏐 ${reportData.leagueName || "Poster"}${reportData.roundName ? " — " + reportData.roundName : ""}`);
    form.append("document", new Blob([Buffer.from(svgStr)], { type: "image/svg+xml" }), "poster.svg");
    const r = await fetch(`${TG}/sendDocument`, { method: "POST", body: form });
    const result = await r.json();
    if (result.ok) res.status(200).json({ ok: true });
    else res.status(200).json({ ok: false, error: result.description });
  } catch (e) {
    console.error("render-poster error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
