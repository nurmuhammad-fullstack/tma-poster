import React, { useEffect, useRef, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { Download, Send, FileImage, FileText, Pencil, Eye, X } from "lucide-react";

import Editor from "./components/Editor";
import Poster from "./components/Poster";
import { t } from "./i18n";
import { createInitialReport } from "./data";

export default function App() {
  const [report, setReport] = useState(() => createInitialReport());
  const [lang, setLang] = useState("uz");
  const [view, setView] = useState("edit");
  const [busy, setBusy] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [theme, setTheme] = useState("stadium");

  const posterRef = useRef(null);

  // --- Telegram WebApp wiring ------------------------------------------------
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      const tp = WebApp.themeParams || {};
      const root = document.documentElement;
      root.style.setProperty("--tg-bg", tp.bg_color || "#FFFFFF");
      root.style.setProperty("--tg-text", tp.text_color || "#000000");
      root.style.setProperty("--tg-hint", tp.hint_color || "#8E8E93");
      root.style.setProperty("--tg-accent", tp.button_color || "#007AFF");
      root.style.setProperty("--tg-header", tp.header_bg_color || tp.bg_color || "#FFFFFF");
      if (WebApp.setHeaderColor) { try { WebApp.setHeaderColor("bg_color"); } catch (_) {} }
      if (WebApp.setBackgroundColor) { try { WebApp.setBackgroundColor("#FFFFFF"); } catch (_) {} }
      WebApp.onEvent?.("themeChanged", () => {
        const p = WebApp.themeParams || {};
        root.style.setProperty("--tg-bg", p.bg_color || "#FFFFFF");
        root.style.setProperty("--tg-text", p.text_color || "#000000");
      });
    } catch (e) {
      console.warn("Telegram WebApp not available", e);
    }
  }, []);

  // chatId: URL ?chatId=... → WebApp.initDataUnsafe.user.id
  const getChatId = () => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("chatId");
      if (fromUrl) return fromUrl;
      return WebApp.initDataUnsafe?.user?.id || null;
    } catch { return null; }
  };

  // SVG string → PNG base64 via browser Canvas
  // Uses data URI (more reliable in Telegram WebView than createObjectURL)
  const svgToPngBase64 = (svgStr) =>
    new Promise((resolve, reject) => {
      const W = 1080, H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width  = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      const img = new Image();
      // encode as data URI — avoids createObjectURL CSP issues in WebView
      const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
      img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("SVG render xatosi"));
      img.src = encoded;
    });

  // Get SVG string from server, convert to PNG in browser, send PNG back to server→Telegram
  const sendPng = async () => {
    const chatId = getChatId();
    if (!chatId) throw new Error("chatId topilmadi. Botdan /start orqali oching.");

    // 1. Get SVG from server
    const svgResp = await fetch("/api/render-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ getSvg: true, reportData: report, lang, theme }),
    });
    const svgData = await svgResp.json();
    if (!svgData.ok) throw new Error(svgData.error || "SVG render xatosi");

    // 2. Convert SVG → PNG in browser
    const pngBase64 = await svgToPngBase64(svgData.svg);

    // 3. Send PNG to Telegram via server
    const sendResp = await fetch("/api/send-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        imageBase64: pngBase64,
        type: "png",
        caption: `🏐 ${report.leagueName || "Poster"}${report.roundName ? " — " + report.roundName : ""}`,
      }),
    });
    const sendData = await sendResp.json();
    if (!sendData.ok) throw new Error(sendData.error || "Yuborish xatosi");
  };

  const downloadPng = async () => {
    setBusy(true);
    setShowExport(false);
    try {
      await sendPng();
      WebApp.HapticFeedback?.notificationOccurred?.("success");
      WebApp.showAlert?.("🏐 Poster chatga yuborildi!");
    } catch (e) {
      console.error(e);
      WebApp.HapticFeedback?.notificationOccurred?.("error");
      WebApp.showAlert?.("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    setShowExport(false);
    try {
      await sendPng();
      WebApp.HapticFeedback?.notificationOccurred?.("success");
      WebApp.showAlert?.("📄 Poster chatga yuborildi!");
    } catch (e) {
      console.error(e);
      WebApp.HapticFeedback?.notificationOccurred?.("error");
      WebApp.showAlert?.("❌ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleLang = () => setLang((l) => (l === "uz" ? "ru" : "uz"));

  const [previewScale, setPreviewScale] = useState(0.32);
  useEffect(() => {
    const compute = () => {
      const w = Math.min(window.innerWidth, 480) - 32;
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
          <>
            <ThemeSelector theme={theme} setTheme={setTheme} lang={lang} />
            <PreviewPane scale={previewScale} report={report} lang={lang} theme={theme} />
          </>
        )}
      </main>

      {/* Hidden full-size poster for export */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }} aria-hidden>
        <Poster ref={posterRef} report={report} lang={lang} theme={theme} />
      </div>

      {/* ===== Bottom action bar ===== */}
      <div className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 py-3">
          <button
            onClick={() => setShowExport(true)}
            disabled={busy}
            className="press w-full flex items-center justify-center gap-2 py-4 rounded-2xl
                       bg-black text-white text-[16px] font-semibold shadow-glass
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="text-[13px]">{t(lang, "rendering")}</span>
            ) : (
              <>
                <Download size={18} />
                {t(lang, "download")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===== Export sheet ===== */}
      {showExport && (
        <ExportSheet
          lang={lang}
          busy={busy}
          theme={theme}
          onPng={downloadPng}
          onPdf={downloadPdf}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

// --- Export full-screen page ------------------------------------------------
function ExportSheet({ lang, busy, onPng, onPdf, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="glass sticky top-0 px-4 py-4 flex items-center gap-3">
        <button
          onClick={onClose}
          className="press w-9 h-9 rounded-full bg-ios-bg flex items-center justify-center"
        >
          <X size={18} className="text-black" />
        </button>
        <div>
          <h2 className="text-[17px] font-bold leading-tight">{t(lang, "downloadTitle")}</h2>
          <p className="text-[12px] text-ios-gray">{t(lang, "downloadSubtitle")}</p>
        </div>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <ExportOption
          icon={<FileImage size={26} className="text-blue-500" />}
          bg="bg-blue-50"
          title={t(lang, "exportPng")}
          desc={t(lang, "exportPngDesc")}
          onClick={onPng}
          disabled={busy}
        />
        <ExportOption
          icon={<FileText size={26} className="text-red-500" />}
          bg="bg-red-50"
          title={t(lang, "exportPdf")}
          desc={t(lang, "exportPdfDesc")}
          onClick={onPdf}
          disabled={busy}
        />
        <ExportOption
          icon={<Send size={26} className="text-green-500" />}
          bg="bg-green-50"
          title={t(lang, "exportShare")}
          desc={t(lang, "exportShareDesc")}
          onClick={onPng}
          disabled={busy}
        />
      </div>

      {busy && (
        <div className="px-4 pb-6 text-center text-[13px] text-ios-gray">
          {t(lang, "rendering")}
        </div>
      )}
    </div>
  );
}

function ExportOption({ icon, bg, title, desc, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="press w-full flex items-center gap-4 p-5 rounded-2xl bg-ios-bg/60
                 hover:bg-ios-bg transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-semibold">{title}</div>
        <div className="text-[13px] text-ios-gray leading-tight mt-1">{desc}</div>
      </div>
    </button>
  );
}

// --- Theme selector ---------------------------------------------------------
const THEMES = [
  { id: "stadium", label: "Stadium",  colors: ["#0B1A35", "#F5C842", "#1E3A6E"] },
  { id: "neon",    label: "Neon",     colors: ["#07070F", "#00E5FF", "#FF2D78"] },
  { id: "minimal", label: "Minimal",  colors: ["#F8F7F4", "#C9962A", "#12121E"] },
];

function ThemeSelector({ theme, setTheme }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-[12px] font-semibold text-ios-gray mb-3 uppercase tracking-wide">Dizayn shablon</p>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((th) => (
          <button
            key={th.id}
            onClick={() => setTheme(th.id)}
            className={`press rounded-2xl overflow-hidden border-2 transition-all ${
              theme === th.id ? "border-black scale-[1.03]" : "border-transparent"
            }`}
          >
            <div
              className="h-16 w-full flex items-center justify-center gap-1"
              style={{ background: th.colors[0] }}
            >
              {th.colors.map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="bg-ios-bg py-1.5 text-[11px] font-semibold text-black text-center">
              {th.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Preview pane -----------------------------------------------------------
function PreviewPane({ scale, report, lang, theme }) {
  return (
    <div className="px-4 py-4 flex justify-center pb-32">
      <div
        style={{
          width: 1080 * scale,
          height: 1350 * scale,
          overflow: "hidden",
          borderRadius: 20,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1080, height: 1350 }}>
          <Poster report={report} lang={lang} theme={theme} />
        </div>
      </div>
    </div>
  );
}
