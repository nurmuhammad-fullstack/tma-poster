import satori from "satori";

const BOT_TOKEN = process.env.BOT_TOKEN;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;
const W = 1080, H = 1350;

// Cache font in memory across warm invocations
let fontCache = null;
async function getFont() {
  if (fontCache) return fontCache;
  const [boldRes, semiBoldRes, regularRes] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff"),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff"),
    fetch("https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff"),
  ]);
  fontCache = [
    { name: "Inter", data: await boldRes.arrayBuffer(),     weight: 800, style: "normal" },
    { name: "Inter", data: await semiBoldRes.arrayBuffer(), weight: 600, style: "normal" },
    { name: "Inter", data: await regularRes.arrayBuffer(),  weight: 400, style: "normal" },
  ];
  return fontCache;
}

// ─── shared helpers ───────────────────────────────────────────────────────────
const flex = (extra = {}) => ({ display: "flex", ...extra });
const abs  = (extra = {}) => ({ position: "absolute", ...extra });

// ─────────────────────────────────────────────────────────────────────────────
// THEME 1 — Stadium Dark  (like the reference image: dark blue + gold)
// ─────────────────────────────────────────────────────────────────────────────
function themeStadium(d, lang) {
  const standings = d.standings || [];
  const results   = d.results   || [];
  const top       = d.topPerformers || [];
  const lname     = (d.leagueName || "").toUpperCase();
  const lsize     = lname.length > 18 ? 52 : lname.length > 12 ? 64 : 76;

  const GOLD  = "#F5C842";
  const BLUE  = "#0B1A35";
  const LIGHT = "rgba(255,255,255,0.92)";
  const GRAY  = "rgba(255,255,255,0.5)";
  const ROW   = "rgba(255,255,255,0.06)";
  const SCORE = "#0B1A35";

  const colW  = (W - 120 - 40) / 2;

  const SectionLabel = ({ title }) => (
    <div style={flex({ alignItems: "center", gap: 12, marginBottom: 14 })}>
      <div style={{ width: 4, height: 22, background: GOLD, borderRadius: 2 }} />
      <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: 3 }}>
        {title.toUpperCase()}
      </div>
    </div>
  );

  const StandingRow = ({ row, i }) => (
    <div style={flex({
      alignItems: "center", padding: "10px 14px",
      background: i < 3 ? "rgba(245,200,66,0.08)" : ROW,
      borderRadius: 10, marginBottom: 6, gap: 10,
    })}>
      <div style={flex({
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: i === 0 ? GOLD : i < 3 ? "rgba(245,200,66,0.5)" : "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        color: i === 0 ? SCORE : LIGHT,
      })}>
        {row.rank}
      </div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: LIGHT, overflow: "hidden" }}>
        {row.team || "—"}
      </div>
      <div style={{ fontSize: 13, color: GRAY, width: 28, textAlign: "center" }}>{row.played}</div>
      <div style={{ fontSize: 13, color: GRAY, width: 36, textAlign: "center" }}>
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: GOLD, width: 32, textAlign: "center" }}>
        {row.points}
      </div>
    </div>
  );

  const MatchCard = ({ m }) => (
    <div style={flex({
      flexDirection: "column", background: "rgba(255,255,255,0.07)",
      borderRadius: 12, overflow: "hidden", marginBottom: 8,
      border: "1px solid rgba(245,200,66,0.15)",
    })}>
      {(m.label || m.date) && (
        <div style={flex({
          justifyContent: "space-between", padding: "7px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        })}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
            {(m.label || "").toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: GRAY }}>{m.date}</div>
        </div>
      )}
      <div style={flex({ alignItems: "center", padding: "12px 14px", gap: 8 })}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: LIGHT, textAlign: "right" }}>
          {m.home || "—"}
        </div>
        <div style={flex({
          background: GOLD, borderRadius: 8, padding: "6px 14px",
          fontSize: 16, fontWeight: 800, color: SCORE,
          minWidth: 72, justifyContent: "center",
        })}>
          {m.homeScore} : {m.awayScore}
        </div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: LIGHT }}>
          {m.away || "—"}
        </div>
      </div>
    </div>
  );

  const medals = ["#F5C842", "#B0B7C3", "#CD7F32"];
  const TopRow = ({ p, i }) => (
    <div style={flex({
      alignItems: "center", padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 12,
    })}>
      <div style={flex({
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "rgba(255,255,255,0.15)",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: i < 3 ? SCORE : LIGHT,
      })}>
        {i + 1}
      </div>
      <div style={flex({ flexDirection: "column", flex: 1 })}>
        <div style={{ fontSize: 15, fontWeight: 700, color: LIGHT }}>{p.name || "—"}</div>
        <div style={{ fontSize: 12, color: GRAY }}>{p.team}</div>
      </div>
      <div style={flex({ flexDirection: "column", alignItems: "flex-end" })}>
        <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{p.goals}</div>
        <div style={{ fontSize: 10, color: GRAY, letterSpacing: 1 }}>
          {lang === "ru" ? "ОЧК" : "BALL"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={flex({
      flexDirection: "column", width: W, height: H,
      background: "linear-gradient(160deg, #0B1A35 0%, #0D2147 40%, #091428 100%)",
      fontFamily: "Inter",
      position: "relative", overflow: "hidden",
    })}>

      {/* stadium glow effects */}
      <div style={abs({
        top: -200, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 600,
        background: "radial-gradient(ellipse, rgba(30,80,180,0.45) 0%, transparent 70%)",
      })} />
      <div style={abs({
        bottom: -100, left: -100,
        width: 500, height: 400,
        background: "radial-gradient(ellipse, rgba(245,200,66,0.08) 0%, transparent 70%)",
      })} />
      <div style={abs({
        bottom: -100, right: -100,
        width: 500, height: 400,
        background: "radial-gradient(ellipse, rgba(245,200,66,0.08) 0%, transparent 70%)",
      })} />

      {/* spotlight lines */}
      <div style={abs({
        top: 0, left: "20%", width: 2, height: 320,
        background: "linear-gradient(180deg, rgba(245,200,66,0.4) 0%, transparent 100%)",
        transform: "rotate(-15deg)", transformOrigin: "top center",
      })} />
      <div style={abs({
        top: 0, right: "20%", width: 2, height: 320,
        background: "linear-gradient(180deg, rgba(245,200,66,0.4) 0%, transparent 100%)",
        transform: "rotate(15deg)", transformOrigin: "top center",
      })} />

      {/* ── HERO ── */}
      <div style={flex({
        flexDirection: "column", alignItems: "center",
        padding: "56px 60px 44px", position: "relative",
        borderBottom: "1px solid rgba(245,200,66,0.2)",
      })}>
        {/* crown shape */}
        <div style={flex({ gap: 6, marginBottom: 20, alignItems: "flex-end" })}>
          {[40, 56, 64, 56, 40].map((h, i) => (
            <div key={i} style={{
              width: 10, height: h, borderRadius: "3px 3px 0 0",
              background: i === 2
                ? GOLD
                : `rgba(245,200,66,${0.3 + i * (i < 2 ? 0.15 : -0.15)})`,
            }} />
          ))}
        </div>

        <div style={{ fontSize: 13, color: GOLD, letterSpacing: 4, fontWeight: 600, marginBottom: 12 }}>
          {lang === "ru" ? "СЕЗОН" : "MAVSUM"} · {d.season || ""}
        </div>

        {/* gold divider */}
        <div style={flex({ alignItems: "center", gap: 12, marginBottom: 16 })}>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(245,200,66,0.6))" }} />
          <div style={{ width: 6, height: 6, background: GOLD, borderRadius: "50%" }} />
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(245,200,66,0.6), transparent)" }} />
        </div>

        <div style={{
          fontSize: lsize, fontWeight: 800, color: LIGHT,
          textAlign: "center", letterSpacing: -1, lineHeight: 1.05,
        }}>
          {lname || "LIGA"}
        </div>

        <div style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.65)", marginTop: 14 }}>
          {d.roundName || ""}
        </div>

        {/* bottom gold line */}
        <div style={abs({
          bottom: -1, left: "50%", transform: "translateX(-50%)",
          width: 200, height: 2, background: GOLD, borderRadius: 1,
        })} />
      </div>

      {/* ── BODY ── */}
      <div style={flex({ flex: 1, padding: "36px 60px 20px", gap: 40 })}>

        {/* LEFT — Standings */}
        <div style={flex({ flexDirection: "column", flex: 1 })}>
          <SectionLabel title={lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"} />
          <div style={flex({ justifyContent: "flex-end", gap: 10, marginBottom: 8, paddingRight: 6 })}>
            <div style={{ fontSize: 11, color: GRAY, width: 28, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "И" : "O'"}
            </div>
            <div style={{ fontSize: 11, color: GRAY, width: 36, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "С" : "S"}
            </div>
            <div style={{ fontSize: 11, color: GRAY, width: 32, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "О" : "B"}
            </div>
          </div>
          {standings.map((row, i) => <StandingRow key={i} row={row} i={i} />)}
        </div>

        {/* RIGHT — Results + Top */}
        <div style={flex({ flexDirection: "column", flex: 1, gap: 32 })}>
          <div>
            <SectionLabel title={lang === "ru" ? "Результаты" : "Natijalar"} />
            {results.map((m, i) => <MatchCard key={i} m={m} />)}
          </div>
          <div>
            <SectionLabel title={lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"} />
            {top.map((p, i) => <TopRow key={i} p={p} i={i} />)}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={flex({
        justifyContent: "space-between", alignItems: "center",
        padding: "16px 60px",
        borderTop: "1px solid rgba(245,200,66,0.2)",
        background: "rgba(0,0,0,0.3)",
      })}>
        <div style={{ fontSize: 12, color: GRAY, letterSpacing: 2 }}>🏐 VOLEYBOL POSTER STUDIO</div>
        <div style={{ fontSize: 12, color: GRAY }}>
          {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 2 — Neon Sport  (black + cyan + magenta)
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
  const CARD    = "rgba(255,255,255,0.04)";
  const BORDER  = "rgba(255,255,255,0.07)";
  const WHITE   = "rgba(255,255,255,0.92)";
  const GRAY    = "rgba(255,255,255,0.45)";

  const SectionLabel = ({ title }) => (
    <div style={flex({ alignItems: "center", gap: 10, marginBottom: 14 })}>
      <div style={{
        width: 28, height: 3,
        background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
        borderRadius: 2,
      }} />
      <div style={{ fontSize: 12, fontWeight: 800, color: WHITE, letterSpacing: 3 }}>
        {title.toUpperCase()}
      </div>
    </div>
  );

  const StandingRow = ({ row, i }) => {
    const rankColor = i === 0 ? CYAN : i < 3 ? MAGENTA : WHITE;
    return (
      <div style={flex({
        alignItems: "center", padding: "9px 12px",
        background: CARD, borderRadius: 8, marginBottom: 5,
        border: `1px solid ${i < 3 ? "rgba(0,229,255,0.12)" : BORDER}`,
        gap: 10,
      })}>
        <div style={{ width: 22, fontSize: 14, fontWeight: 800, color: rankColor, textAlign: "center" }}>
          {row.rank}
        </div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: WHITE }}>
          {row.team || "—"}
        </div>
        <div style={{ fontSize: 13, color: GRAY, width: 26, textAlign: "center" }}>{row.played}</div>
        <div style={{ fontSize: 13, color: GRAY, width: 32, textAlign: "center" }}>
          {row.gd > 0 ? `+${row.gd}` : row.gd}
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: CYAN, width: 28, textAlign: "center" }}>
          {row.points}
        </div>
      </div>
    );
  };

  const MatchCard = ({ m }) => (
    <div style={flex({
      flexDirection: "column", background: CARD, borderRadius: 10,
      marginBottom: 7, border: `1px solid ${BORDER}`, overflow: "hidden",
    })}>
      {(m.label || m.date) && (
        <div style={flex({ justifyContent: "space-between", padding: "6px 12px" })}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CYAN, letterSpacing: 1 }}>
            {(m.label || "").toUpperCase()}
          </div>
          <div style={{ fontSize: 10, color: GRAY }}>{m.date}</div>
        </div>
      )}
      <div style={flex({ alignItems: "center", padding: "10px 12px", gap: 8 })}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: WHITE, textAlign: "right" }}>
          {m.home || "—"}
        </div>
        <div style={flex({
          borderRadius: 7, padding: "5px 12px",
          background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
          fontSize: 15, fontWeight: 800, color: BG,
          minWidth: 68, justifyContent: "center",
        })}>
          {m.homeScore} : {m.awayScore}
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: WHITE }}>
          {m.away || "—"}
        </div>
      </div>
    </div>
  );

  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const TopRow = ({ p, i }) => (
    <div style={flex({
      alignItems: "center", padding: "9px 0",
      borderBottom: `1px solid ${BORDER}`, gap: 10,
    })}>
      <div style={flex({
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "rgba(255,255,255,0.1)",
        alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: "#000",
      })}>
        {i + 1}
      </div>
      <div style={flex({ flexDirection: "column", flex: 1 })}>
        <div style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>{p.name || "—"}</div>
        <div style={{ fontSize: 11, color: GRAY }}>{p.team}</div>
      </div>
      <div style={flex({ flexDirection: "column", alignItems: "flex-end" })}>
        <div style={{ fontSize: 20, fontWeight: 800, color: CYAN }}>{p.goals}</div>
        <div style={{ fontSize: 9, color: GRAY, letterSpacing: 1 }}>
          {lang === "ru" ? "ОЧК" : "BALL"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={flex({
      flexDirection: "column", width: W, height: H,
      background: BG, fontFamily: "Inter", position: "relative", overflow: "hidden",
    })}>
      {/* background grid lines */}
      <div style={abs({ inset: 0, overflow: "hidden" })}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={abs({
            left: `${i * 14}%`, top: 0, bottom: 0, width: 1,
            background: "rgba(255,255,255,0.02)",
          })} />
        ))}
      </div>

      {/* glow blobs */}
      <div style={abs({
        top: -150, left: -150, width: 500, height: 500,
        background: `radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)`,
      })} />
      <div style={abs({
        top: -150, right: -150, width: 500, height: 500,
        background: `radial-gradient(circle, rgba(255,45,120,0.1) 0%, transparent 70%)`,
      })} />

      {/* ── HERO ── */}
      <div style={flex({
        flexDirection: "column", alignItems: "center",
        padding: "52px 60px 40px",
        borderBottom: `1px solid ${BORDER}`, position: "relative",
      })}>
        {/* neon top bar */}
        <div style={{
          width: 160, height: 3, borderRadius: 2, marginBottom: 24,
          background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
        }} />

        <div style={{ fontSize: 13, color: CYAN, letterSpacing: 4, fontWeight: 600, marginBottom: 14 }}>
          {lang === "ru" ? "СЕЗОН" : "MAVSUM"} · {d.season || ""}
        </div>

        <div style={{
          fontSize: lsize, fontWeight: 800, color: WHITE,
          textAlign: "center", letterSpacing: -1, lineHeight: 1.05,
          textShadow: `0 0 40px rgba(0,229,255,0.3)`,
        }}>
          {lname || "LIGA"}
        </div>

        <div style={{ fontSize: 22, fontWeight: 600, color: GRAY, marginTop: 14 }}>
          {d.roundName || ""}
        </div>

        <div style={{
          marginTop: 20, width: 120, height: 2, borderRadius: 1,
          background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})`,
        }} />
      </div>

      {/* ── BODY ── */}
      <div style={flex({ flex: 1, padding: "32px 60px 20px", gap: 36 })}>
        <div style={flex({ flexDirection: "column", flex: 1 })}>
          <SectionLabel title={lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"} />
          <div style={flex({ justifyContent: "flex-end", gap: 8, marginBottom: 8 })}>
            <div style={{ fontSize: 10, color: GRAY, width: 26, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "И" : "O'"}
            </div>
            <div style={{ fontSize: 10, color: GRAY, width: 32, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "С" : "S"}
            </div>
            <div style={{ fontSize: 10, color: GRAY, width: 28, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "О" : "B"}
            </div>
          </div>
          {standings.map((row, i) => <StandingRow key={i} row={row} i={i} />)}
        </div>

        <div style={flex({ flexDirection: "column", flex: 1, gap: 28 })}>
          <div>
            <SectionLabel title={lang === "ru" ? "Результаты" : "Natijalar"} />
            {results.map((m, i) => <MatchCard key={i} m={m} />)}
          </div>
          <div>
            <SectionLabel title={lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"} />
            {top.map((p, i) => <TopRow key={i} p={p} i={i} />)}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={flex({
        justifyContent: "space-between", alignItems: "center",
        padding: "14px 60px",
        borderTop: `1px solid ${BORDER}`,
        background: "rgba(0,0,0,0.4)",
      })}>
        <div style={{ fontSize: 11, color: GRAY, letterSpacing: 2 }}>🏐 VOLEYBOL POSTER STUDIO</div>
        <div style={{ fontSize: 11, color: GRAY }}>
          {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME 3 — Minimal Gold  (clean white + charcoal + gold)
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
  const CARD    = "#FFFFFF";
  const GRAY    = "#9199A8";
  const BORDER  = "#EAECF0";

  const SectionLabel = ({ title }) => (
    <div style={flex({ alignItems: "center", gap: 10, marginBottom: 16 })}>
      <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: 4 }}>
        {title.toUpperCase()}
      </div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${GOLD}44, transparent)` }} />
    </div>
  );

  const StandingRow = ({ row, i }) => (
    <div style={flex({
      alignItems: "center", padding: "11px 14px",
      background: i === 0 ? `${GOLD}0D` : CARD,
      borderRadius: 10, marginBottom: 6, gap: 10,
      border: `1px solid ${i === 0 ? `${GOLD}33` : BORDER}`,
    })}>
      <div style={flex({
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: i === 0 ? GOLD : i < 3 ? `${GOLD}33` : "#F0F1F3",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800,
        color: i === 0 ? "#FFF" : i < 3 ? GOLD : GRAY,
      })}>
        {row.rank}
      </div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: DARK }}>
        {row.team || "—"}
      </div>
      <div style={{ fontSize: 13, color: GRAY, width: 26, textAlign: "center" }}>{row.played}</div>
      <div style={{ fontSize: 13, color: GRAY, width: 32, textAlign: "center" }}>
        {row.gd > 0 ? `+${row.gd}` : row.gd}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? GOLD : DARK, width: 30, textAlign: "center" }}>
        {row.points}
      </div>
    </div>
  );

  const MatchCard = ({ m }) => (
    <div style={flex({
      flexDirection: "column", background: CARD, borderRadius: 12,
      marginBottom: 8, border: `1px solid ${BORDER}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
    })}>
      {(m.label || m.date) && (
        <div style={flex({
          justifyContent: "space-between", padding: "7px 14px",
          background: "#F8F7F4", borderBottom: `1px solid ${BORDER}`,
        })}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
            {(m.label || "").toUpperCase()}
          </div>
          <div style={{ fontSize: 10, color: GRAY }}>{m.date}</div>
        </div>
      )}
      <div style={flex({ alignItems: "center", padding: "12px 14px", gap: 8 })}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DARK, textAlign: "right" }}>
          {m.home || "—"}
        </div>
        <div style={flex({
          background: CHARCOAL, borderRadius: 8, padding: "6px 14px",
          fontSize: 15, fontWeight: 800, color: "#FFF",
          minWidth: 70, justifyContent: "center",
        })}>
          {m.homeScore} : {m.awayScore}
        </div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DARK }}>
          {m.away || "—"}
        </div>
      </div>
    </div>
  );

  const medals = ["#C9962A", "#9AA0AE", "#A0724A"];
  const TopRow = ({ p, i }) => (
    <div style={flex({
      alignItems: "center", padding: "10px 0",
      borderBottom: `1px solid ${BORDER}`, gap: 12,
    })}>
      <div style={flex({
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: i < 3 ? medals[i] : "#F0F1F3",
        alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: i < 3 ? "#FFF" : GRAY,
      })}>
        {i + 1}
      </div>
      <div style={flex({ flexDirection: "column", flex: 1 })}>
        <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{p.name || "—"}</div>
        <div style={{ fontSize: 11, color: GRAY }}>{p.team}</div>
      </div>
      <div style={flex({ flexDirection: "column", alignItems: "flex-end" })}>
        <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{p.goals}</div>
        <div style={{ fontSize: 9, color: GRAY, letterSpacing: 1 }}>
          {lang === "ru" ? "ОЧК" : "BALL"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={flex({
      flexDirection: "column", width: W, height: H,
      background: BG, fontFamily: "Inter", position: "relative",
    })}>
      {/* ── HERO ── dark panel */}
      <div style={flex({
        flexDirection: "column", alignItems: "center",
        padding: "50px 60px 40px",
        background: `linear-gradient(150deg, ${CHARCOAL} 0%, ${DARK} 100%)`,
        position: "relative", overflow: "hidden",
      })}>
        {/* subtle corner ornament */}
        <div style={abs({
          top: -60, right: -60, width: 200, height: 200,
          border: `1px solid ${GOLD}22`, borderRadius: "50%",
        })} />
        <div style={abs({
          top: -30, right: -30, width: 120, height: 120,
          border: `1px solid ${GOLD}33`, borderRadius: "50%",
        })} />

        <div style={{ fontSize: 12, color: GOLD, letterSpacing: 5, fontWeight: 600, marginBottom: 16 }}>
          {lang === "ru" ? "СЕЗОН" : "MAVSUM"} · {d.season || ""}
        </div>

        <div style={{
          width: 80, height: 2, background: GOLD, borderRadius: 1, marginBottom: 20,
        }} />

        <div style={{
          fontSize: lsize, fontWeight: 800, color: "#FFFFFF",
          textAlign: "center", lineHeight: 1.05, letterSpacing: -1,
        }}>
          {lname || "LIGA"}
        </div>

        <div style={{
          fontSize: 22, fontWeight: 400, color: "rgba(255,255,255,0.55)",
          marginTop: 16, fontStyle: "italic",
        }}>
          {d.roundName || ""}
        </div>
      </div>

      {/* gold accent strip */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, #E8B84B, ${GOLD})` }} />

      {/* ── BODY ── */}
      <div style={flex({ flex: 1, padding: "32px 60px 20px", gap: 36 })}>
        <div style={flex({ flexDirection: "column", flex: 1 })}>
          <SectionLabel title={lang === "ru" ? "Турнирная таблица" : "Turnir jadvali"} />
          <div style={flex({ justifyContent: "flex-end", gap: 8, marginBottom: 8 })}>
            <div style={{ fontSize: 10, color: GRAY, width: 26, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "И" : "O'"}
            </div>
            <div style={{ fontSize: 10, color: GRAY, width: 32, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "С" : "S"}
            </div>
            <div style={{ fontSize: 10, color: GRAY, width: 30, textAlign: "center", fontWeight: 700, letterSpacing: 1 }}>
              {lang === "ru" ? "О" : "B"}
            </div>
          </div>
          {standings.map((row, i) => <StandingRow key={i} row={row} i={i} />)}
        </div>

        <div style={flex({ flexDirection: "column", flex: 1, gap: 28 })}>
          <div>
            <SectionLabel title={lang === "ru" ? "Результаты" : "Natijalar"} />
            {results.map((m, i) => <MatchCard key={i} m={m} />)}
          </div>
          <div>
            <SectionLabel title={lang === "ru" ? "Лучшие игроки" : "Eng yaxshi o'yinchilar"} />
            {top.map((p, i) => <TopRow key={i} p={p} i={i} />)}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={flex({
        justifyContent: "space-between", alignItems: "center",
        padding: "14px 60px",
        background: DARK,
      })}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>
          🏐 VOLEYBOL POSTER STUDIO
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
async function buildSVG(d) {
  const fonts = await getFont();
  const lang  = d.lang || "uz";
  const theme = d.theme || "stadium";

  let element;
  if (theme === "neon")    element = themeNeon(d, lang);
  else if (theme === "minimal") element = themeMinimal(d, lang);
  else element = themeStadium(d, lang);

  return satori(element, { width: W, height: H, fonts });
}

// ─────────────────────────────────────────────────────────────────────────────
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
    const caption = `🏐 ${reportData.leagueName || "Poster"}${reportData.roundName ? " — " + reportData.roundName : ""}`;
    form.append("caption", caption);
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
