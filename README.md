# League Poster Studio — Telegram Mini App

A React-based Telegram Mini App that turns league round data into professional Ligue 1-style poster graphics. Bilingual (UZ/RU), Apple-style UI, exports to PNG/PDF, and shares back to your Telegram bot.

## Architecture overview

```
src/
├─ App.jsx              # Orchestrator: state, Telegram SDK, exports, layout
├─ main.jsx             # React entry
├─ index.css            # Tailwind + iOS polish (toggles, glass, inputs)
├─ i18n.js              # content{} dictionary for uz/ru + t() helper
├─ data.js              # Initial report shape + int parser
└─ components/
   ├─ Editor.jsx        # Click-to-edit fields, dynamic rows for all sections
   └─ Poster.jsx        # 1080×1350 sports-graphic poster (export target)
```

**State model** — a single JSON object in `App.jsx` is the source of truth:

```js
{
  leagueName: string,
  roundName: string,
  season: string,
  standings:    [{ id, rank, logo, team, played, gd, points }],
  results:      [{ id, home, homeScore, away, awayScore }],
  topPerformers:[{ id, name, team, goals }],
}
```

`Editor` mutates it via `setReport`; `Poster` consumes it for render. Exports rasterize a hidden full-size `<Poster>` mounted off-screen so they work from any view.

## Setup

### 1. Prereqs
- Node 18+
- A Telegram bot (create one via [@BotFather](https://t.me/BotFather))

### 2. Install
```bash
npm install
```

### 3. Local development
```bash
npm run dev
```
Opens at `http://localhost:5173`. The Telegram SDK gracefully no-ops when run outside Telegram — you can fully develop the editor + preview in any browser.

### 4. Test inside Telegram
The Telegram WebApp SDK requires an HTTPS URL. Two ways to expose your dev server:

**Option A — ngrok (fastest)**
```bash
npm run dev
ngrok http 5173
# copy the https://… URL ngrok prints
```

**Option B — deploy to Vercel / Netlify / Cloudflare Pages**
```bash
npm run build
# upload dist/ to any static host
```

### 5. Wire it into your bot
1. Open [@BotFather](https://t.me/BotFather) → `/mybots` → pick your bot
2. `Bot Settings` → `Menu Button` → set URL to your HTTPS deployment
3. Open your bot in Telegram → tap the menu button → app launches

### 6. Handle `sendData` on your bot backend
When the user taps **Share to Telegram**, the app calls `Telegram.WebApp.sendData(payload)`. Telegram delivers it to your bot as a `web_app_data` update. Example (Node + `telegraf`):

```js
bot.on("message", (ctx) => {
  if (ctx.message.web_app_data) {
    const payload = JSON.parse(ctx.message.web_app_data.data);
    // payload.standings, payload.results, payload.topPerformers, …
    // → render an image server-side, or store, or post to a channel.
  }
});
```

**Note:** `sendData` only works when the mini app is opened via a keyboard button (not a menu button or inline button). For menu-button launches, switch to the [`answerWebAppQuery`](https://core.telegram.org/bots/api#answerwebappquery) flow or simply rely on the PNG/PDF download.

## Design notes

- **Apple-style UI**: white background, soft `shadow-card`, `rounded-2xl`, iOS toggle for language, glassmorphism action bar, `-apple-system` font stack with Inter as fallback per spec.
- **Poster**: deep-navy hero + red diagonal stripe + heavy uppercase display type, evoking Ligue 1 / Serie A broadcast graphics. Fixed 1080×1350 — Instagram-portrait friendly.
- **Telegram theme adaptation**: pulls `themeParams` into CSS variables and re-reads on `themeChanged`. The poster itself stays branded (deep navy / red) regardless of Telegram theme — it's a deliverable, not chrome.

## Tweaking the poster

The poster is plain inline-styled JSX in `src/components/Poster.jsx`. Common tweaks:

- **Brand colors** → change `#0A0F1F` (navy) and `#EE0A46` (accent red)
- **Layout** → the body is a 2-col CSS grid; flip to single column for an Instagram Story (1080×1920) variant
- **Add sponsors** → drop a logo strip into the footer above the dark band

## Why html-to-image (not html2canvas directly)?

`html-to-image` produces noticeably sharper text and handles modern CSS (gradients, filters) more faithfully. `pixelRatio: 2` gives retina-quality PNGs. PDF export reuses the same PNG so visuals stay identical across formats.

## Known limits

- External logo URLs need CORS-friendly hosts for them to appear in the exported PNG. Self-host or use a CORS proxy if needed.
- `sendData` payloads are capped at ~4 KB by Telegram. For very large standings tables, render server-side instead.
