/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: ["SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ios: {
          blue: "#007AFF",
          gray: "#8E8E93",
          bg: "#F2F2F7",
          separator: "#C6C6C8",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.06)",
        glass: "0 8px 32px rgba(0,0,0,0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
