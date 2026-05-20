import React, { useEffect, useMemo, useRef, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Download, Send, FileImage, FileText, Pencil, Eye } from "lucide-react";

import Editor from "./components/Editor";
import Poster from "./components/Poster";
import { content, t } from "./i18n";
import { createInitialReport } from "./data";

export default function App() {
  // Single JSON state holding the entire report
  const [report, setReport] = useState(() => createInitialReport());
  const [lang, setLang] = useState("uz"); // "uz" | "ru"
  const [view, setView] = useState("edit"); // "edit" | "preview"
  const [busy, setBusy] = useState(false);

  const posterRef = useRef(null);

  // --- Telegram WebApp wiring ------------------------------------------------
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();

      // Apply Telegram theme — fall back to white per the design spec
      const tp = WebApp.themeParams || {};
      const root = document.documentElement;
      root.style.setProperty("--tg-bg", tp.bg_color || "#FFFFFF");
      root.style.setProperty("--tg-text", tp.text_color || "#000000");
      root.style.setProperty("--tg-hint", tp.hint_color || "#8E8E93");
      root.style.setProperty("--tg-accent", tp.button_color || "#007AFF");
      root.style.setProperty("--tg-header", tp.header_bg_color || tp.bg_color || "#FFFFFF");

      if (WebApp.setHeaderColor) {
        try { WebApp.setHeaderColor("bg_color"); } catch (_) {}
      }
      if (WebApp.setBackgroundColor) {
        try { WebApp.setBackgroundColor("#FFFFFF"); } catch (_) {}
      }

      // Re-apply theme if user changes Telegram theme mid-session
      WebApp.onEvent?.("themeChanged", () => {
        const p = WebApp.themeParams || {};
        root.style.setProperty("--tg-bg", p.bg_color || "#FFFFFF");
        root.style.setProperty("--tg-text", p.text_color || "#000000");
      });
    } catch (e) {
      // Running outside Telegram (e.g. local dev) — silently ignore
      console.warn("Telegram WebApp not available", e);
    }
  }, []);

  // --- Export helpers --------------------------------------------------------
  const renderPosterToPng = async () => {
    if (!posterRef.current) return null;
    // pixelRatio:2 for retina-grade output; cacheBust to handle external logo URLs
    return await toPng(posterRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#FFFFFF",
    });
  };

  const downloadPng = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderPosterToPng();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${(report.leagueName || "league").replace(/\s+/g, "_")}_poster.png`;
      a.click();
      WebApp.HapticFeedback?.notificationOccurred?.("success");
    } catch (e) {
      console.error(e);
      WebApp.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const dataUrl = await renderPosterToPng();
      if (!dataUrl) return;

      // Poster is 1080×1350 — use the same aspect ratio in PDF (portrait A4-ish)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1080, 1350],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1350);
      pdf.save(`${(report.leagueName || "league").replace(/\s+/g, "_")}_poster.pdf`);
      WebApp.HapticFeedback?.notificationOccurred?.("success");
    } catch (e) {
      console.error(e);
      WebApp.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setBusy(false);
    }
  };

  const shareToTelegram = async () => {
    try {
      // sendData has a ~4KB limit, so we send a compact payload —
      // the bot backend would reconstruct or render server-side.
      const payload = {
        type: "league_report",
        lang,
        leagueName: report.leagueName,
        roundName: report.roundName,
        season: report.season,
        standings: report.standings.map(({ id, ...rest }) => rest),
        results: report.results.map(({ id, ...rest }) => rest),
        topPerformers: report.topPerformers.map(({ id, ...rest }) => rest),
      };
      WebApp.sendData(JSON.stringify(payload));
      WebApp.HapticFeedback?.notificationOccurred?.("success");
      WebApp.showAlert?.(t(lang, "confirmShare"));
    } catch (e) {
      console.error("sendData failed", e);
    }
  };

  // Stable handler — keep referential equality clean
  const toggleLang = () => setLang((l) => (l === "uz" ? "ru" : "uz"));

  // Compute responsive scale for the preview so the 1080-wide poster fits the viewport
  const [previewScale, setPreviewScale] = useState(0.32);
  useEffect(() => {
    const compute = () => {
      const w = Math.min(window.innerWidth, 480) - 32; // 16px side padding
      setPreviewScale(w / 1080);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      {/* ===== Top bar ===== */}
      <header className="sticky top-0 z-30 glass">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold leading-tight tracking-tight">
              {t(lang, "appTitle")}
            </h1>
            <p className="text-[12px] text-ios-gray leading-tight">
              {t(lang, "appSubtitle")}
            </p>
          </div>

          {/* iOS toggle for UZ <-> RU */}
          <button
            onClick={toggleLang}
            className={`ios-toggle ${lang === "ru" ? "right" : ""}`}
            aria-label="Switch language"
          >
            <span className="thumb" />
            <span className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold text-ios-gray pointer-events-none">
              <span className={lang === "uz" ? "opacity-0" : "opacity-100"}>UZ</span>
              <span className={lang === "ru" ? "opacity-0" : "opacity-100"}>RU</span>
            </span>
          </button>
        </div>

        {/* Segmented view switch */}
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="bg-ios-bg rounded-xl p-1 grid grid-cols-2 text-[14px] font-semibold">
            <button
              onClick={() => setView("edit")}
              className={`press py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                view === "edit" ? "bg-white shadow-sm text-black" : "text-ios-gray"
              }`}
            >
              <Pencil size={14} /> {t(lang, "editor")}
            </button>
            <button
              onClick={() => setView("preview")}
              className={`press py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                view === "preview" ? "bg-white shadow-sm text-black" : "text-ios-gray"
              }`}
            >
              <Eye size={14} /> {t(lang, "preview")}
            </button>
          </div>
        </div>
      </header>

      {/* ===== Main content ===== */}
      <main className="max-w-md mx-auto">
        {view === "edit" ? (
          <Editor report={report} setReport={setReport} lang={lang} />
        ) : (
          <PreviewPane scale={previewScale} report={report} lang={lang} posterRef={posterRef} />
        )}
      </main>

      {/* ===== Hidden full-size poster for export ===== */}
      {/* Always mounted (off-screen) so export works from either view */}
      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
        aria-hidden
      >
        <Poster ref={posterRef} report={report} lang={lang} />
      </div>

      {/* ===== Bottom action bar (glass) ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="glass rounded-2xl shadow-glass p-2 grid grid-cols-3 gap-2">
            <ActionButton
              icon={<FileImage size={16} />}
              label={t(lang, "exportPng")}
              onClick={downloadPng}
              disabled={busy}
            />
            <ActionButton
              icon={<FileText size={16} />}
              label={t(lang, "exportPdf")}
              onClick={downloadPdf}
              disabled={busy}
            />
            <ActionButton
              icon={<Send size={16} />}
              label={t(lang, "shareTelegram")}
              onClick={shareToTelegram}
              disabled={busy}
              primary
            />
          </div>
          {busy && (
            <p className="text-center text-[11px] text-ios-gray mt-1">
              {t(lang, "rendering")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoized preview pane — only the visual scaled-down poster
function PreviewPane({ scale, report, lang, posterRef: _ }) {
  // We render a *separate* Poster instance here for visual preview
  // The export-target Poster lives off-screen at full size (see App).
  return (
    <div className="px-4 py-6 flex justify-center pb-32">
      <div
        style={{
          width: 1080 * scale,
          height: 1350 * scale,
          overflow: "hidden",
          borderRadius: 20,
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: 1080,
            height: 1350,
          }}
        >
          <Poster report={report} lang={lang} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl
                  text-[11px] font-semibold transition
                  ${primary
                    ? "bg-ios-blue text-white shadow-sm"
                    : "bg-white/80 text-black/80 hover:bg-white"}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon}
      <span className="leading-none text-center">{label}</span>
    </button>
  );
}
