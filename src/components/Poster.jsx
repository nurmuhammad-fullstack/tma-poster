import React, { useEffect, useState } from "react";

// Poster preview: fetches SVG from the server so preview = export (exact match)
const Poster = React.forwardRef(({ report, lang, theme }, ref) => {
  const [svgContent, setSvgContent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/render-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ getSvg: true, reportData: report, lang, theme: theme || "classic" }),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.ok) setSvgContent(data.svg); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [report, lang, theme]);

  return (
    <div
      ref={ref}
      style={{ width: 1080, height: 1350, position: "relative", overflow: "hidden" }}
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    >
      {!svgContent && (
        <div style={{
          width: 1080, height: 1350, background: "#0D1B2A",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.3)", fontSize: 28, fontFamily: "Arial,sans-serif",
        }}>
          🏐
        </div>
      )}
    </div>
  );
});

Poster.displayName = "Poster";
export default Poster;
