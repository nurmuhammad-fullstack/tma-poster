import React from "react";
import { Trophy, Star } from "lucide-react";
import { t } from "../i18n";

// Volleyball accent color — energetic orange-yellow
const ACCENT = "#F97316";
const NAVY   = "#0D1B2A";

const Poster = React.forwardRef(({ report, lang }, ref) => {
  const { leagueName, roundName, season, standings, results, topPerformers } = report;

  return (
    <div
      ref={ref}
      className="poster-root"
      style={{
        width: 1080,
        height: 1350,
        background: "#FFFFFF",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        color: NAVY,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── HERO BAND ─────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          height: 290,
          background: `linear-gradient(135deg, ${NAVY} 0%, #1A2E45 60%, #1E3A52 100%)`,
          color: "white",
          padding: "52px 64px",
          overflow: "hidden",
        }}
      >
        {/* Volleyball texture — hexagonal dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }} />

        {/* Diagonal accent — volleyball orange */}
        <div style={{
          position: "absolute",
          top: 0, right: -100,
          width: 480, height: "100%",
          background: `linear-gradient(135deg, ${ACCENT} 0%, #EA580C 100%)`,
          transform: "skewX(-16deg)",
          transformOrigin: "top right",
          opacity: 0.92,
        }} />

        {/* Volleyball SVG watermark on accent area */}
        <div style={{
          position: "absolute", right: 50, top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.18, zIndex: 1,
        }}>
          <VolleyballIcon size={200} />
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{
            fontSize: 13, letterSpacing: 5, textTransform: "uppercase",
            opacity: 0.65, fontWeight: 700, marginBottom: 14,
            color: "#FED7AA",
          }}>
            🏐 {t(lang, "season")} · {season}
          </div>
          <div style={{
            fontSize: 68, fontWeight: 900, lineHeight: 1,
            letterSpacing: "-0.03em", textTransform: "uppercase", maxWidth: 660,
          }}>
            {leagueName || t(lang, "placeholderLeague")}
          </div>
          <div style={{
            fontSize: 26, fontWeight: 600, marginTop: 16,
            opacity: 0.9, letterSpacing: "-0.01em",
          }}>
            {roundName || t(lang, "placeholderRound")}
          </div>
        </div>
      </div>

      {/* Orange accent stripe */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${ACCENT}, #FB923C)` }} />

      {/* ── BODY GRID ─────────────────────────────────────────────── */}
      <div style={{ padding: "40px 60px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44 }}>

        {/* LEFT — STANDINGS */}
        <div>
          <SectionHeader icon={<Trophy size={17} />} title={t(lang, "standings")} />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 17 }}>
            <thead>
              <tr style={{ color: "#8A92A6", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                <th style={th(36, "left")}>{t(lang, "rank")}</th>
                <th style={th(36, "left")}></th>
                <th style={th(null, "left")}>{t(lang, "team")}</th>
                <th style={th(44, "center")}>{t(lang, "played")}</th>
                <th style={th(52, "center")}>{t(lang, "gd")}</th>
                <th style={th(52, "center")}>{t(lang, "points")}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.id} style={{
                  borderBottom: "1px solid #EEF0F4",
                  background: i < 3 ? "rgba(249,115,22,0.04)" : "transparent",
                }}>
                  <td style={td("left", true)}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: 6,
                      background: i === 0 ? ACCENT : i < 3 ? "#FB923C" : NAVY,
                      color: "white", fontSize: 13, fontWeight: 800,
                    }}>
                      {row.rank}
                    </span>
                  </td>
                  <td style={td("left")}>
                    {row.logo ? (
                      <img src={row.logo} alt="" crossOrigin="anonymous"
                        style={{ width: 30, height: 30, objectFit: "contain" }}
                        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                      />
                    ) : (
                      <div style={{ width: 30, height: 30, borderRadius: 15, background: "#EEF0F4" }} />
                    )}
                  </td>
                  <td style={{ ...td("left"), fontWeight: 600, fontSize: 16 }}>
                    {row.team || "—"}
                  </td>
                  <td style={{ ...td("center"), color: "#5A6478" }}>{row.played}</td>
                  <td style={{ ...td("center"), color: "#5A6478" }}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td style={{ ...td("center"), fontWeight: 800, fontSize: 18, color: NAVY }}>
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT — Results + Top Performers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>

          {/* RESULTS */}
          <div>
            <SectionHeader icon={<VolleyballIcon size={17} />} title={t(lang, "results")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map((m) => (
                <div key={m.id} style={{ background: "#F7F8FA", borderRadius: 14, overflow: "hidden" }}>
                  {(m.label || m.date) && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "7px 16px 0",
                      fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                      textTransform: "uppercase", color: "#8A92A6",
                    }}>
                      <span>{m.label}</span>
                      <span>{m.date}</span>
                    </div>
                  )}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center", gap: 12,
                    padding: m.label || m.date ? "9px 16px 13px" : "13px 16px",
                  }}>
                    <div style={{ fontWeight: 600, textAlign: "right", fontSize: 16 }}>
                      {m.home || "—"}
                    </div>
                    <div style={{
                      background: NAVY, color: "white",
                      borderRadius: 8, padding: "6px 12px",
                      fontWeight: 800, fontSize: 17, letterSpacing: 1,
                      minWidth: 66, textAlign: "center",
                    }}>
                      {m.homeScore} : {m.awayScore}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                      {m.away || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP PERFORMERS */}
          <div>
            <SectionHeader icon={<Star size={17} />} title={t(lang, "topPerformers")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topPerformers.map((p, i) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "30px 1fr auto",
                  alignItems: "center", gap: 12,
                  padding: "10px 4px", borderBottom: "1px solid #EEF0F4",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: i === 0
                      ? "linear-gradient(135deg,#FFD700,#E5A800)"
                      : i === 1
                      ? "linear-gradient(135deg,#D0D3DC,#9AA0AE)"
                      : i === 2
                      ? "linear-gradient(135deg,#CD7F32,#9C5A1F)"
                      : NAVY,
                    color: "white", fontWeight: 800, fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#8A92A6" }}>{p.team}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <span style={{ fontWeight: 900, fontSize: 20, color: ACCENT }}>{p.goals}</span>
                    <span style={{ fontSize: 11, color: "#8A92A6", textTransform: "uppercase", letterSpacing: 1 }}>
                      {t(lang, "goals")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "18px 64px",
        background: NAVY,
        color: "rgba(255,255,255,0.55)",
        fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>🏐 {t(lang, "poweredBy")}</span>
        <span>{new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}</span>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";
export default Poster;

// ── Helpers ──────────────────────────────────────────────────────────────────
const th = (w, align) => ({ textAlign: align, padding: "9px 5px", fontWeight: 700, width: w ?? "auto" });
const td = (align, first = false) => ({ padding: "11px 5px", textAlign: align, paddingLeft: first ? 0 : 5 });

function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      marginBottom: 14, paddingBottom: 11,
      borderBottom: `2px solid ${NAVY}`,
    }}>
      <div style={{
        background: ACCENT, color: "white",
        width: 30, height: 30, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// Volleyball SVG icon
function VolleyballIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 6.9 14.7M12 3a9 9 0 0 0-6.9 14.7" />
      <path d="M3.6 9h16.8M12 21a9 9 0 0 1-6.9-14.7M12 21a9 9 0 0 0 6.9-14.7" />
    </svg>
  );
}
