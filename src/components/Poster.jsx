import React, { useEffect, useMemo, useState } from "react";

const Poster = React.forwardRef(({ report, lang, theme }, ref) => {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bodyStr = useMemo(
    () => JSON.stringify({ getSvg: true, reportData: report, lang, theme: theme || "stadium" }),
    [report, lang, theme]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/render-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyStr,
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setSvgContent(data.svg);
        } else {
          setError(data.error || "Xato");
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [bodyStr]);

  const baseStyle = {
    width: 1080, height: 1350,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "Arial,sans-serif", fontSize: 22,
  };

  if (loading) {
    return (
      <div ref={ref} style={{ ...baseStyle, background: "#0B1A35", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏐</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>Poster tayyorlanmoqda…</div>
      </div>
    );
  }

  if (error || !svgContent) {
    return (
      <div ref={ref} style={{ ...baseStyle, background: "#0B1A35", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, textAlign: "center", padding: "0 80px" }}>
          {error || "Ko'rib chiqish yuklanmadi"}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1350, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
});

Poster.displayName = "Poster";
export default Poster;
