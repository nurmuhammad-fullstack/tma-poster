import React from "react";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { t } from "../i18n";
import { toInt } from "../data";

// Reusable click-to-edit header — looks like text, behaves like an input on focus.
function EditableHeader({ value, onChange, placeholder, className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent outline-none w-full px-2 py-1 -mx-2 rounded-lg
                  placeholder:text-ios-gray/50 focus:bg-ios-bg/70
                  transition-colors duration-150 ${className}`}
    />
  );
}

function SectionCard({ title, children, right }) {
  return (
    <section className="bg-white rounded-2xl shadow-card p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-black/80 uppercase tracking-wide">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Editor({ report, setReport, lang }) {
  // --- Standings handlers ----------------------------------------------------
  const updateStanding = (id, field, val) => {
    setReport((r) => ({
      ...r,
      standings: r.standings.map((s) =>
        s.id === id
          ? { ...s, [field]: ["played", "gd", "points", "rank"].includes(field) ? toInt(val) : val }
          : s
      ),
    }));
  };

  const addStanding = () => {
    setReport((r) => ({
      ...r,
      standings: [
        ...r.standings,
        {
          id: crypto.randomUUID(),
          rank: r.standings.length + 1,
          logo: "",
          team: "",
          played: 0,
          gd: 0,
          points: 0,
        },
      ],
    }));
  };

  const removeStanding = (id) =>
    setReport((r) => ({ ...r, standings: r.standings.filter((s) => s.id !== id) }));

  // --- Results handlers ------------------------------------------------------
  const updateResult = (id, field, val) =>
    setReport((r) => ({
      ...r,
      results: r.results.map((m) =>
        m.id === id
          ? { ...m, [field]: field.includes("Score") ? toInt(val) : val }
          : m
      ),
    }));

  const addResult = () =>
    setReport((r) => ({
      ...r,
      results: [
        ...r.results,
        { id: crypto.randomUUID(), home: "", homeScore: 0, away: "", awayScore: 0, date: "", label: "" },
      ],
    }));

  const removeResult = (id) =>
    setReport((r) => ({ ...r, results: r.results.filter((m) => m.id !== id) }));

  // --- Top performers handlers ----------------------------------------------
  const updatePerformer = (id, field, val) =>
    setReport((r) => ({
      ...r,
      topPerformers: r.topPerformers.map((p) =>
        p.id === id ? { ...p, [field]: field === "goals" ? toInt(val) : val } : p
      ),
    }));

  const addPerformer = () =>
    setReport((r) => ({
      ...r,
      topPerformers: [
        ...r.topPerformers,
        { id: crypto.randomUUID(), name: "", team: "", goals: 0 },
      ],
    }));

  const removePerformer = (id) =>
    setReport((r) => ({ ...r, topPerformers: r.topPerformers.filter((p) => p.id !== id) }));

  return (
    <div className="px-4 pb-32">
      {/* Headline editable block */}
      <div className="pt-6 pb-4">
        <EditableHeader
          value={report.leagueName}
          onChange={(v) => setReport((r) => ({ ...r, leagueName: v }))}
          placeholder={t(lang, "placeholderLeague")}
          className="text-[28px] font-bold leading-tight"
        />
        <EditableHeader
          value={report.roundName}
          onChange={(v) => setReport((r) => ({ ...r, roundName: v }))}
          placeholder={t(lang, "placeholderRound")}
          className="text-[17px] text-ios-gray font-medium mt-1"
        />
      </div>

      {/* Standings */}
      <SectionCard
        title={t(lang, "standings")}
        right={
          <button
            onClick={addStanding}
            className="press flex items-center gap-1 text-ios-blue text-sm font-medium"
          >
            <Plus size={16} strokeWidth={2.5} /> {t(lang, "addRow")}
          </button>
        }
      >
        {/* Column headers — fixed-width grid keeps things aligned on narrow screens */}
        <div className="grid grid-cols-[24px_28px_1fr_28px_36px_36px_24px] gap-2 px-1 pb-2
                        text-[11px] font-semibold uppercase tracking-wider text-ios-gray">
          <span>{t(lang, "rank")}</span>
          <span></span>
          <span>{t(lang, "team")}</span>
          <span className="text-center">{t(lang, "played")}</span>
          <span className="text-center">{t(lang, "gd")}</span>
          <span className="text-center">{t(lang, "points")}</span>
          <span></span>
        </div>
        <div className="divide-y divide-ios-bg">
          {report.standings.map((row, idx) => (
            <div
              key={row.id}
              className="grid grid-cols-[24px_28px_1fr_28px_36px_36px_24px] gap-2 items-center py-2"
            >
              <input
                type="number"
                value={row.rank}
                onChange={(e) => updateStanding(row.id, "rank", e.target.value)}
                className="ios-input text-center font-semibold text-[15px]"
              />
              {/* Logo URL is hidden behind the small circle — tap to edit */}
              <LogoCircle
                value={row.logo}
                onChange={(v) => updateStanding(row.id, "logo", v)}
              />
              <input
                type="text"
                value={row.team}
                onChange={(e) => updateStanding(row.id, "team", e.target.value)}
                placeholder={t(lang, "placeholderTeam")}
                className="ios-input text-[15px] font-medium"
              />
              <input
                type="number"
                value={row.played}
                onChange={(e) => updateStanding(row.id, "played", e.target.value)}
                className="ios-input text-center text-[14px]"
              />
              <input
                type="number"
                value={row.gd}
                onChange={(e) => updateStanding(row.id, "gd", e.target.value)}
                className="ios-input text-center text-[14px]"
              />
              <input
                type="number"
                value={row.points}
                onChange={(e) => updateStanding(row.id, "points", e.target.value)}
                className="ios-input text-center text-[15px] font-bold"
              />
              <button
                onClick={() => removeStanding(row.id)}
                className="press text-ios-gray/70 hover:text-red-500 flex justify-center"
                aria-label="Remove row"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Results */}
      <SectionCard
        title={t(lang, "results")}
        right={
          <button
            onClick={addResult}
            className="press flex items-center gap-1 text-ios-blue text-sm font-medium"
          >
            <Plus size={16} strokeWidth={2.5} /> {t(lang, "addMatch")}
          </button>
        }
      >
        <div className="space-y-3">
          {report.results.map((m) => (
            <div key={m.id} className="bg-ios-bg/40 rounded-xl p-3 space-y-2">
              {/* Label + Date row */}
              <div className="grid grid-cols-[1fr_1fr_24px] gap-2 items-center">
                <input
                  type="text"
                  value={m.label}
                  onChange={(e) => updateResult(m.id, "label", e.target.value)}
                  placeholder={t(lang, "matchLabel")}
                  className="ios-input text-[13px] font-semibold text-ios-gray bg-white/60 rounded-lg px-2"
                />
                <input
                  type="text"
                  value={m.date}
                  onChange={(e) => updateResult(m.id, "date", e.target.value)}
                  placeholder={t(lang, "matchDate")}
                  className="ios-input text-[13px] text-ios-gray bg-white/60 rounded-lg px-2"
                />
                <button
                  onClick={() => removeResult(m.id)}
                  className="press text-ios-gray/70 hover:text-red-500 flex justify-center"
                  aria-label="Remove match"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {/* Score row */}
              <div className="grid grid-cols-[1fr_28px_18px_28px_1fr] gap-2 items-center">
                <input
                  type="text"
                  value={m.home}
                  onChange={(e) => updateResult(m.id, "home", e.target.value)}
                  placeholder={t(lang, "homeTeam")}
                  className="ios-input text-right text-[14px] font-medium"
                />
                <input
                  type="number"
                  value={m.homeScore}
                  onChange={(e) => updateResult(m.id, "homeScore", e.target.value)}
                  className="ios-input text-center font-bold text-[15px] bg-white rounded-lg"
                />
                <span className="text-center text-ios-gray text-[13px]">:</span>
                <input
                  type="number"
                  value={m.awayScore}
                  onChange={(e) => updateResult(m.id, "awayScore", e.target.value)}
                  className="ios-input text-center font-bold text-[15px] bg-white rounded-lg"
                />
                <input
                  type="text"
                  value={m.away}
                  onChange={(e) => updateResult(m.id, "away", e.target.value)}
                  placeholder={t(lang, "awayTeam")}
                  className="ios-input text-[14px] font-medium"
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Top performers */}
      <SectionCard
        title={t(lang, "topPerformers")}
        right={
          <button
            onClick={addPerformer}
            className="press flex items-center gap-1 text-ios-blue text-sm font-medium"
          >
            <Plus size={16} strokeWidth={2.5} /> {t(lang, "addPlayer")}
          </button>
        }
      >
        <div className="space-y-2">
          {report.topPerformers.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[1fr_1fr_40px_24px] gap-2 items-center"
            >
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePerformer(p.id, "name", e.target.value)}
                placeholder={t(lang, "placeholderPlayer")}
                className="ios-input text-[14px] font-medium"
              />
              <input
                type="text"
                value={p.team}
                onChange={(e) => updatePerformer(p.id, "team", e.target.value)}
                placeholder={t(lang, "teamShort")}
                className="ios-input text-[13px] text-ios-gray"
              />
              <input
                type="number"
                value={p.goals}
                onChange={(e) => updatePerformer(p.id, "goals", e.target.value)}
                className="ios-input text-center font-bold text-[15px] bg-ios-bg/60 rounded-lg"
              />
              <button
                onClick={() => removePerformer(p.id)}
                className="press text-ios-gray/70 hover:text-red-500 flex justify-center"
                aria-label="Remove player"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// Tap to pick from gallery → converts to Base64 so export works offline.
function LogoCircle({ value, onChange }) {
  const fileRef = React.useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="relative">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-7 h-7 rounded-full bg-ios-bg flex items-center justify-center
                   overflow-hidden border border-black/5"
        aria-label="Pick logo from gallery"
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus size={12} className="text-ios-gray/60" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
