// Default report shape. Single source of truth for the JSON model.
export const createInitialReport = () => ({
  leagueName: "",
  roundName: "",
  season: "2025/26",
  standings: [
    { id: crypto.randomUUID(), rank: 1, logo: "", team: "", played: 0, gd: 0, points: 0 },
    { id: crypto.randomUUID(), rank: 2, logo: "", team: "", played: 0, gd: 0, points: 0 },
    { id: crypto.randomUUID(), rank: 3, logo: "", team: "", played: 0, gd: 0, points: 0 },
    { id: crypto.randomUUID(), rank: 4, logo: "", team: "", played: 0, gd: 0, points: 0 },
  ],
  results: [
    { id: crypto.randomUUID(), home: "", homeScore: 0, away: "", awayScore: 0, date: "", label: "" },
    { id: crypto.randomUUID(), home: "", homeScore: 0, away: "", awayScore: 0, date: "", label: "" },
  ],
  topPerformers: [
    { id: crypto.randomUUID(), name: "", team: "", goals: 0 },
    { id: crypto.randomUUID(), name: "", team: "", goals: 0 },
    { id: crypto.randomUUID(), name: "", team: "", goals: 0 },
  ],
});

// Defensive int parser so empty inputs don't NaN downstream
export const toInt = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};
