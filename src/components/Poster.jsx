import React, { useEffect, useMemo, useState } from "react";

// Poster preview: fetches SVG from the server so preview = export (exact match)
const Poster = React.forwardRef(({ report, lang, theme }, ref) => {
  const [svgContent, setSvgContent] = useState(null);
  // Stable body string: only refetch when data actually changes
  const bodyStr = useMemo(
    () => JSON.stringify({ getSvg: true, reportData: report, lang, theme: theme || "classic" }),
    [report, lang, theme]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/render-poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyStr,
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.ok) setSvgContent(data.svg); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [bodyStr]);

  if (!svgContent) {
    return (
      <div
        ref={ref}
        style={{
          width: 1080, height: 1350, background: "#0D1B2A",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.3)", fontSize: 28, fontFamily: "Arial,sans-serif",
        }}
      >
        🏐
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
