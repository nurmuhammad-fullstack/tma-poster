import React from "react";
import { Trophy, Target } from "lucide-react";
import { t } from "../i18n";

/**
 * Poster — fixed 1080×1350 canvas for predictable PNG/PDF export.
 * Scaled down visually via CSS transform from the parent.
 * Ligue 1-inspired: deep navy header, bold typography, accent stripe.
 */
const Poster = React.forwardRef(({ report, lang }, ref) => {
  const {
    leagueName,
    roundName,
    season,
    standings,
    results,
    topPerformers,
  } = report;

  return (
    <div
      ref={ref}
      className="poster-root"
      style={{
        width: 1080,
        height: 1350,
        background: "#FFFFFF",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
        color: "#0A0F1F",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HERO BAND — deep navy with diagonal accent */}
      <div
        style={{
          position: "relative",
          height: 280,
          background:
            "linear-gradient(135deg, #0A0F1F 0%, #141C36 55%, #1B2552 100%)",
          color: "white",
          padding: "56px 64px",
          overflow: "hidden",
        }}
      >
        {/* Diagonal accent shape */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -120,
            width: 520,
            height: "100%",
            background: "linear-gradient(135deg, #EE0A46 0%, #C9082B 100%)",
            transform: "skewX(-18deg)",
            transformOrigin: "top right",
            opacity: 0.95,
          }}
        />
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 6,
              textTransform: "uppercase",
              opacity: 0.7,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {t(lang, "season")} · {season}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              maxWidth: 720,
            }}
          >
            {leagueName || t(lang, "placeholderLeague")}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              marginTop: 18,
              opacity: 0.95,
              letterSpacing: "-0.01em",
            }}
          >
            {roundName || t(lang, "placeholderRound")}
          </div>
        </div>
      </div>

      {/* RED ACCENT STRIPE */}
      <div style={{ height: 6, background: "#EE0A46" }} />

      {/* BODY GRID */}
      <div
        style={{
          padding: "44px 64px 64px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
        }}
      >
        {/* STANDINGS */}
        <div>
          <SectionHeader icon={<Trophy size={18} />} title={t(lang, "standings")} />
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 18,
            }}
          >
            <thead>
              <tr style={{ color: "#8A92A6", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>
                <th style={th(40, "left")}>{t(lang, "rank")}</th>
                <th style={th(40, "left")}></th>
                <th style={th(null, "left")}>{t(lang, "team")}</th>
                <th style={th(50, "center")}>{t(lang, "played")}</th>
                <th style={th(60, "center")}>{t(lang, "gd")}</th>
                <th style={th(60, "center")}>{t(lang, "points")}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: "1px solid #EEF0F4",
                    background: i < 3 ? "rgba(238,10,70,0.03)" : "transparent",
                  }}
                >
                  <td style={td("left", true)}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: i < 3 ? "#EE0A46" : "#0A0F1F",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {row.rank}
                    </span>
                  </td>
                  <td style={td("left")}>
                    {row.logo ? (
                      <img
                        src={row.logo}
                        alt=""
                        crossOrigin="anonymous"
                        style={{ width: 32, height: 32, objectFit: "contain" }}
                        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: "#EEF0F4",
                        }}
                      />
                    )}
                  </td>
                  <td style={{ ...td("left"), fontWeight: 600, fontSize: 17 }}>
                    {row.team || "—"}
                  </td>
                  <td style={{ ...td("center"), color: "#5A6478" }}>{row.played}</td>
                  <td style={{ ...td("center"), color: "#5A6478" }}>
                    {row.gd > 0 ? `+${row.gd}` : row.gd}
                  </td>
                  <td style={{ ...td("center"), fontWeight: 800, fontSize: 18 }}>
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT COLUMN: Results + Top Performers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          <div>
            <SectionHeader icon={<ResultsIcon />} title={t(lang, "results")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "#F7F8FA",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  {/* Label + Date header — only shown when at least one is filled */}
                  {(m.label || m.date) && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "7px 18px 0",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                        color: "#8A92A6",
                      }}
                    >
                      <span>{m.label}</span>
                      <span>{m.date}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      alignItems: "center",
                      gap: 14,
                      padding: m.label || m.date ? "10px 18px 14px" : "14px 18px",
                    }}
                  >
                    <div style={{ fontWeight: 600, textAlign: "right", fontSize: 17 }}>
                      {m.home || "—"}
                    </div>
                    <div
                      style={{
                        background: "#0A0F1F",
                        color: "white",
                        borderRadius: 8,
                        padding: "6px 14px",
                        fontWeight: 800,
                        fontSize: 18,
                        letterSpacing: 1,
                        minWidth: 70,
                        textAlign: "center",
                      }}
                    >
                      {m.homeScore} : {m.awayScore}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 17 }}>
                      {m.away || "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader icon={<Target size={18} />} title={t(lang, "topPerformers")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topPerformers.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr auto",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 4px",
                    borderBottom: "1px solid #EEF0F4",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        i === 0
                          ? "linear-gradient(135deg,#FFD700,#E5A800)"
                          : i === 1
                          ? "linear-gradient(135deg,#D0D3DC,#9AA0AE)"
                          : i === 2
                          ? "linear-gradient(135deg,#CD7F32,#9C5A1F)"
                          : "#0A0F1F",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{p.name || "—"}</div>
                    <div style={{ fontSize: 13, color: "#8A92A6" }}>{p.team}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 22 }}>{p.goals}</span>
                    <span style={{ fontSize: 12, color: "#8A92A6", textTransform: "uppercase", letterSpacing: 1 }}>
                      {t(lang, "goals")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "20px 64px",
          background: "#0A0F1F",
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{t(lang, "poweredBy")}</span>
        <span>{new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "uz-UZ")}</span>
      </div>
    </div>
  );
});

Poster.displayName = "Poster";
export default Poster;

// --- Helpers ----------------------------------------------------------------
const th = (w, align) => ({
  textAlign: align,
  padding: "10px 6px",
  fontWeight: 700,
  width: w ?? "auto",
});
const td = (align, first = false) => ({
  padding: "12px 6px",
  textAlign: align,
  paddingLeft: first ? 0 : 6,
});

function SectionHeader({ icon, title }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "2px solid #0A0F1F",
      }}
    >
      <div
        style={{
          background: "#0A0F1F",
          color: "white",
          width: 32,
          height: 32,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 2,
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

// Inline SVG to avoid importing another lucide icon
function ResultsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
}
