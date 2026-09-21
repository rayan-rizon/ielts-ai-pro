import React from 'react';
import { m } from 'framer-motion';
import GraduationCap from 'lucide-react/icons/graduation-cap';
import Sparkles from 'lucide-react/icons/sparkles';

import { PANEL, NUM, MICRO, TITLE, MUTED } from '@/features/dashboard/components/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ALL_COUNTRIES, ALL_ENTRIES, COUNTRIES, UPCOMING_COUNTRIES } from '../universityData';
import { SKILLS, LEVELS, SCORE_PRESETS, formatBand } from './matchToolConstants';
import SkillControlRow from './SkillControlRow';

function QuickCountryChips({ showingAllCountries, countryCode, setCountryCode }) {
  const guideText = showingAllCountries
    ? 'Showing every country. Tap one to focus your shortlist.'
    : 'Showing one country.';

  return (
    <div className="mt-2">
      <span className="mb-1.5 block text-[10.5px] font-medium leading-snug text-slate-500 dark:text-slate-400">
        {guideText}
      </span>
      <div className="flex flex-wrap gap-1">
        {!showingAllCountries && (
          <button
            type="button"
            onClick={() => setCountryCode(ALL_COUNTRIES)}
            className="inline-flex items-center gap-1 rounded-md border border-[#e4e2f0] bg-white px-1.5 py-1 text-[10.5px] font-bold text-slate-600 transition-colors hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:text-violet-300"
          >
            <span>🌍</span>
            <span>All</span>
          </button>
        )}
        {COUNTRIES.map((option) => {
          const isActive = option.code === countryCode;
          const chipClass = isActive
            ? 'border-[#5a63df] bg-[#f4f3fb] text-[#5a63df] dark:border-violet-400/50 dark:bg-violet-400/10 dark:text-violet-300'
            : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:text-violet-300';

          return (
            <button
              key={option.code}
              type="button"
              onClick={() => setCountryCode(isActive ? ALL_COUNTRIES : option.code)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10.5px] font-bold transition-colors ${chipClass}`}
            >
              <span>{option.flag}</span>
              <span>{option.code}</span>
              <span className="font-semibold text-slate-400">{option.entries.length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CountrySelector({
  countryCode,
  setCountryCode,
  showingAllCountries,
  country,
  activeEntries,
}) {
  const currentFlag = showingAllCountries ? '🌍' : (country?.flag ?? '🌍');
  const currentName = showingAllCountries ? 'All countries' : (country?.name ?? 'All countries');
  const pluralSuffix = activeEntries.length === 1 ? 'institution' : 'institutions';
  const countryCountSuffix = showingAllCountries ? ` · ${COUNTRIES.length} countries` : '';

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`${MICRO} ${MUTED}`}>Target Destination</span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Active
        </span>
      </div>

      <Select value={countryCode} onValueChange={setCountryCode}>
        <SelectTrigger className="group h-11 w-full rounded-xl border border-[#e4e2f0] bg-white px-3 py-1.5 text-left shadow-2xs transition-all duration-200 ease-out hover:border-[#5a63df]/40 hover:bg-[#faf9ff] hover:shadow-xs active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#16151e] dark:hover:border-violet-400/30 dark:hover:bg-[#1e1c28]">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2.5 pr-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-sm shadow-2xs">
                {currentFlag}
              </span>
              <div className="flex min-w-0 flex-col text-left">
                <span className="truncate text-xs font-extrabold leading-tight text-slate-900 dark:text-white">
                  {currentName}
                </span>
                <span className="text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                  {activeEntries.length} verified {pluralSuffix}
                  {countryCountSuffix}
                </span>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="rounded-xl border border-[#e4e2f0] bg-white p-1.5 shadow-lg transition-all duration-200 dark:border-white/10 dark:bg-[#18171f]">
          <SelectItem
            value={ALL_COUNTRIES}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 transition-colors focus:bg-[#f2f0ff] focus:text-[#5a63df] dark:text-white dark:focus:bg-white/10 dark:focus:text-violet-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🌍</span>
              <span>All countries</span>
              <span className="ml-1 text-[10.5px] font-semibold text-slate-400">
                ({ALL_ENTRIES.length} universities)
              </span>
            </div>
          </SelectItem>

          <div className="my-1 border-t border-[#e4e2f0] dark:border-white/10" />

          {COUNTRIES.map((option) => (
            <SelectItem
              key={option.code}
              value={option.code}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 transition-colors focus:bg-[#f2f0ff] focus:text-[#5a63df] dark:text-white dark:focus:bg-white/10 dark:focus:text-violet-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{option.flag}</span>
                <span>{option.name}</span>
                <span className="ml-1 text-[10.5px] font-semibold text-slate-400">
                  ({option.entries.length}{' '}
                  {option.entries.length === 1 ? 'university' : 'universities'})
                </span>
              </div>
            </SelectItem>
          ))}

          {UPCOMING_COUNTRIES.length > 0 && (
            <div className="my-1 border-t border-[#e4e2f0] px-2 pt-1.5 dark:border-white/10">
              <span className={`${MICRO} ${MUTED} block pb-1`}>Upcoming Verification Batches</span>
              <div className="grid grid-cols-2 gap-1">
                {UPCOMING_COUNTRIES.slice(0, 4).map((cName) => (
                  <div
                    key={cName}
                    className="flex items-center justify-between rounded-md bg-[#f4f3fb] px-2 py-1 text-[10.5px] font-medium text-slate-500 dark:bg-white/[0.04] dark:text-slate-400"
                  >
                    <span>{cName}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SelectContent>
      </Select>

      <QuickCountryChips
        showingAllCountries={showingAllCountries}
        countryCode={countryCode}
        setCountryCode={setCountryCode}
      />

      {/*
        No "next batch" line when nothing is queued — the sentence only made
        sense while there was a named country waiting, and an empty join()
        would have rendered "Next batch:  verifying now." with a dangling gap.
      */}
      {UPCOMING_COUNTRIES.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <Sparkles className="h-3 w-3 text-[#5a63df] dark:text-violet-400" />
          Next batch: {UPCOMING_COUNTRIES.slice(0, 4).join(', ')} verifying now.
        </p>
      )}
    </div>
  );
}

function StudyLevelSelector({ level, setLevel }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`${MICRO} ${MUTED}`}>Study Level</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a63df] dark:text-violet-300">
          {level === 'undergraduate' ? 'Undergraduate (UG)' : 'Postgraduate (PG)'}
        </span>
      </div>
      <div
        className="relative grid grid-cols-2 gap-1 rounded-xl border border-[#e4e2f0] bg-[#f4f3fb] p-1 dark:border-white/10 dark:bg-[#100f16]"
        role="group"
        aria-label="Study level"
      >
        {LEVELS.map((option) => {
          const isActive = level === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setLevel(option.key)}
              aria-pressed={isActive}
              className="relative flex h-9.5 items-center justify-center rounded-lg text-xs font-black transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
            >
              {isActive && (
                <m.div
                  layoutId="studyLevelIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-xs border border-black/5 dark:bg-[#5a63df] dark:border-violet-400/30 dark:shadow-[0_2px_12px_rgba(90,99,223,0.35)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${
                  isActive
                    ? 'text-[#5a63df] dark:text-white font-black'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScorePresetsGrid({ scores, onApplyPreset }) {
  return (
    <div className="mt-4 border-t border-[#e4e2f0] pt-4 dark:border-white/[0.07]">
      <span className={`${MICRO} ${MUTED} mb-0.5 block`}>Start from a typical score you got</span>
      <p className="mb-2 text-[10.5px] font-medium leading-snug text-slate-500 dark:text-slate-400">
        Tap one to fill in your four bands, then adjust each skill below.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {SCORE_PRESETS.map((preset) => {
          const isActive = SKILLS.every((skill) => scores[skill.key] === preset.scores[skill.key]);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApplyPreset(preset.scores)}
              aria-pressed={isActive}
              className={`rounded-lg border p-2 text-left transition-all duration-200 ease-smooth-out hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:bg-[#faf9ff] hover:shadow-2xs active:scale-[0.98] dark:hover:border-violet-400/30 dark:hover:bg-[#1f1d2b] ${
                preset.wide ? 'col-span-2' : ''
              } ${
                isActive
                  ? 'border-[#5a63df] bg-[#f4f3fb] dark:border-violet-400/50 dark:bg-violet-500/10'
                  : 'border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-[#16151e]'
              }`}
            >
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {preset.label}
              </span>
              <span className="block truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {preset.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OverallBandSummaryCard({ overall, lowestSkill }) {
  return (
    <div className="mt-4 rounded-xl border border-[#ded9ff] bg-linear-to-br from-[#f2f0ff] to-[#f8f7ff] p-4 dark:border-violet-500/25 dark:from-violet-950/40 dark:to-indigo-950/30">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#5e50ee] dark:text-violet-300">
            Estimated Overall Band
          </span>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Using Cambridge half-band rounding
          </p>
        </div>
        <strong className={`${NUM} text-3xl font-black text-[#5e50ee] dark:text-violet-200`}>
          {formatBand(overall)}
        </strong>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-[#ded9ff]/80 pt-2 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
        <span>Lowest Component:</span>
        <span className="font-extrabold text-[#07142f] dark:text-white">
          {lowestSkill.name} ({formatBand(lowestSkill.value)})
        </span>
      </div>
    </div>
  );
}

export function ScoreControlPanel({
  countryCode,
  setCountryCode,
  showingAllCountries,
  country,
  activeEntries,
  level,
  setLevel,
  scores,
  setScores,
  overall,
  lowestSkill,
}) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className={`${PANEL} p-5 shadow-xs sm:p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e2f0] pb-3.5 dark:border-white/[0.07]">
          <div>
            <span className={`${MICRO} ${MUTED}`}>Step 1 · Your IELTS result</span>
            <h3 className={`${TITLE} mt-0.5 text-base font-extrabold`}>Enter the scores you got</h3>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:text-[#afb5ff]">
            <GraduationCap className="h-4 w-4" />
          </span>
        </div>

        <CountrySelector
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          showingAllCountries={showingAllCountries}
          country={country}
          activeEntries={activeEntries}
        />

        <StudyLevelSelector level={level} setLevel={setLevel} />

        <ScorePresetsGrid scores={scores} onApplyPreset={setScores} />

        {/* Skill Score Controls */}
        <div className="mt-4 border-t border-[#e4e2f0] pt-3.5 dark:border-white/[0.07]">
          <div className="mb-1 flex items-center justify-between">
            <span className={`${MICRO} ${MUTED}`}>My four skill bands</span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              0.5 band steps
            </span>
          </div>

          <div className="space-y-1">
            {SKILLS.map((skill) => (
              <SkillControlRow
                key={skill.key}
                name={skill.name}
                icon={skill.icon}
                tone={skill.tone}
                value={scores[skill.key]}
                onChange={(val) => setScores((cur) => ({ ...cur, [skill.key]: val }))}
              />
            ))}
          </div>
        </div>

        <OverallBandSummaryCard overall={overall} lowestSkill={lowestSkill} />
      </div>

      {/* Quick Help Tip */}
      <div className={`${PANEL} p-4 text-xs font-medium text-slate-600 dark:text-slate-400`}>
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#5a63df] dark:text-violet-400" />
          <p className="leading-relaxed">
            <strong className="font-bold text-slate-800 dark:text-slate-200">
              The skill floor rule:{' '}
            </strong>
            Most universities reject applications if even one component is 0.5 below the minimum,
            even if your overall score is 7.5 or 8.0.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ScoreControlPanel;
