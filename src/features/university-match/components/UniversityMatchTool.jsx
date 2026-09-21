import React, { useEffect, useMemo, useRef, useState } from 'react';
import { m } from 'framer-motion';
import Headphones from 'lucide-react/icons/headphones';
import BookOpen from 'lucide-react/icons/book-open';
import PenLine from 'lucide-react/icons/pen-line';
import Mic from 'lucide-react/icons/mic';
import ExternalLink from 'lucide-react/icons/external-link';
import TriangleAlert from 'lucide-react/icons/triangle-alert';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Search from 'lucide-react/icons/search';
import X from 'lucide-react/icons/x';
import Minus from 'lucide-react/icons/minus';
import Plus from 'lucide-react/icons/plus';
import Sparkles from 'lucide-react/icons/sparkles';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import MapPin from 'lucide-react/icons/map-pin';
import RotateCcw from 'lucide-react/icons/rotate-ccw';
import GraduationCap from 'lucide-react/icons/graduation-cap';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Building2 from 'lucide-react/icons/building-2';

import { roundOverallBand } from '@/features/core/components/calculator/calculatorData';
import {
  PANEL,
  WELL,
  TILE,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  Pill,
  IconChip,
} from '@/features/dashboard/components/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { matchUniversities, skillMinimum } from '../universityMatch';
import {
  ALL_COUNTRIES,
  ALL_ENTRIES,
  COUNTRIES,
  UPCOMING_COUNTRIES,
  countryByCode,
} from '../universityData';

const SKILLS = [
  { key: 'listening', name: 'Listening', icon: Headphones, tone: 'sky' },
  { key: 'reading', name: 'Reading', icon: BookOpen, tone: 'emerald' },
  { key: 'writing', name: 'Writing', icon: PenLine, tone: 'amber' },
  { key: 'speaking', name: 'Speaking', icon: Mic, tone: 'accent' },
];

const LEVELS = [
  { key: 'undergraduate', label: 'Undergraduate', short: 'UG' },
  { key: 'postgraduate', label: 'Postgraduate', short: 'PG' },
];

/*
 * Starting points for the learner's own four bands. The heading above them is
 * what says whose scores these are; the descriptions stay course-oriented
 * because that is the context a student recognises their own result by.
 *
 * The 8.0 row matters: stopping at 7.5 implied a ceiling, when the sliders run
 * to 9.0 and plenty of applicants score above it.
 */
const SCORE_PRESETS = [
  {
    label: '6.0 Baseline',
    desc: 'Foundation & Pathways',
    scores: { listening: 6.0, reading: 6.0, writing: 5.5, speaking: 6.0 },
  },
  {
    label: '6.5 Standard',
    desc: 'Most UK Taught Degrees',
    scores: { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.5 },
  },
  {
    label: '7.0 High',
    desc: 'Competitive Courses',
    scores: { listening: 7.0, reading: 7.0, writing: 6.5, speaking: 7.0 },
  },
  {
    label: '7.5 Advanced',
    desc: 'Medicine, Law, Oxford',
    scores: { listening: 7.5, reading: 7.5, writing: 7.0, speaking: 7.5 },
  },
  {
    label: '8.0+ Expert',
    desc: 'Clears almost every requirement',
    // Same shape as the rows above — three skills at the headline band and
    // Writing half a band under — so the label matches the overall it produces.
    scores: { listening: 8.0, reading: 8.0, writing: 7.5, speaking: 8.0 },
    wide: true,
  },
];

const OUTCOME_META = {
  safe: {
    label: 'Comfortably Clears',
    tone: 'ok',
    badgeText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    icon: CheckCircle2,
  },
  match: {
    label: 'Meets Requirement',
    tone: 'ok',
    badgeText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    icon: CheckCircle2,
  },
  reach: {
    label: 'Score Shortfall',
    tone: 'warn',
    badgeText: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    icon: AlertCircle,
  },
  unlikely: {
    label: 'Well Short',
    tone: 'fault',
    badgeText: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
    icon: TriangleAlert,
  },
  unknown: {
    label: 'Not Published',
    tone: 'neutral',
    badgeText: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
    icon: AlertCircle,
  },
  'not-accepted': {
    label: 'IELTS Not Accepted',
    tone: 'neutral',
    badgeText: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
    icon: AlertCircle,
  },
};

function formatBand(band) {
  return typeof band === 'number' ? band.toFixed(1) : '—';
}

function sliderFill(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #5a63df 0%, #5a63df ${pct}%, var(--calc-track, #e4e2f0) ${pct}%)`,
  };
}

function SkillControlRow({ name, value, onChange, icon: Icon, tone }) {
  const handleStep = (step) => {
    const next = Math.round((value + step) * 2) / 2;
    if (next >= 4.0 && next <= 9.0) {
      onChange(next);
    }
  };

  return (
    <div className="group rounded-xl border border-transparent p-3 transition-colors duration-150 hover:border-[#e4e2f0] hover:bg-[#fbfbfe] dark:hover:border-white/[0.07] dark:hover:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconChip icon={Icon} tone={tone} size="sm" />
          <span className="truncate text-[13.5px] font-bold text-slate-900 dark:text-slate-100">
            {name}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleStep(-0.5)}
            disabled={value <= 4.0}
            aria-label={`Decrease ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Minus className="h-3 w-3 stroke-[2.5]" />
          </button>

          <span
            className={`${NUM} inline-flex w-10 justify-center text-base font-black text-slate-900 dark:text-white`}
          >
            {formatBand(value)}
          </span>

          <button
            type="button"
            onClick={() => handleStep(0.5)}
            disabled={value >= 9.0}
            aria-label={`Increase ${name} band`}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e2f0] bg-white text-slate-600 transition-all duration-150 hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] hover:text-[#5a63df] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <input
          type="range"
          min="4.0"
          max="9.0"
          step="0.5"
          value={value}
          aria-label={`${name} band score`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="calc-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={sliderFill(value, 4, 9)}
        />
        <div className="mt-1 flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-500">
          <span>4.0</span>
          <span>6.0</span>
          <span>7.0</span>
          <span>8.0</span>
          <span>9.0</span>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, learnerOverall, learnerLowest, level, onSwitchLevel }) {
  const { entry, outcome, requirement, shortfalls, verification, clearsWholeRange } = result;
  const meta = OUTCOME_META[outcome] || OUTCOME_META.unknown;
  const OutcomeIcon = meta.icon;

  const entryCountry = countryByCode(entry.country);

  const otherLevel = level === 'postgraduate' ? 'undergraduate' : 'postgraduate';
  const otherLevelAvailable = Boolean(entry.requirements?.[otherLevel]);

  const reqOverall = requirement?.overall ?? null;

  const clearsOverall = reqOverall !== null && learnerOverall >= reqOverall;

  /*
   * The floor per skill is not always one flat number: Waterloo, for example,
   * asks 6.5 in writing and speaking but only 6.0 in reading and listening —
   * a per-skill override (`skills`), not a blanket `minComponent`. Reading
   * only `minComponent` here made the tile say "Not stated" for a university
   * that does have a floor, just not a uniform one, which understates the
   * requirement rather than the "no floor exists" case this card also has to
   * represent (Manchester, TUM).
   */
  const skillFloors = requirement
    ? SKILLS.map((skill) => skillMinimum(requirement, skill.key))
    : [];
  const definedFloors = skillFloors.filter((value) => value !== null);
  const hasComponentFloor = definedFloors.length > 0;
  const uniformFloor =
    hasComponentFloor && definedFloors.every((value) => value === definedFloors[0])
      ? definedFloors[0]
      : null;
  /*
   * "Your Lowest" is a single number, but a per-skill floor has no single
   * number to compare it against — 6.0 clears a 6.0 reading floor and misses
   * a 6.5 writing floor in the same breath. Only compare it when the floor is
   * uniform across all four skills; otherwise defer to the shortfalls list,
   * which already checks each skill against its own floor correctly.
   */
  const clearsComponents = uniformFloor !== null && learnerLowest >= uniformFloor;

  return (
    <li className="group relative rounded-2xl border border-[#e4e2f0] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-250 ease-smooth-out transform-gpu will-change-transform [backface-visibility:hidden] hover:-translate-y-0.5 hover:border-[#5a63df]/45 hover:bg-[#fcfbff] hover:shadow-[0_10px_25px_-5px_rgba(90,99,223,0.12),0_8px_10px_-6px_rgba(90,99,223,0.08)] active:scale-[0.995] active:translate-y-0 dark:border-white/[0.08] dark:bg-[#14131a] dark:shadow-none dark:hover:border-violet-400/35 dark:hover:bg-[#181723] dark:hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-violet-300 sm:text-[17px]">
              {entry.name}
            </h3>
            {entry.scope === 'programme' && (
              <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5a63df] dark:text-violet-300">
                Course Tiers
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {entry.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {entry.city}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {entryCountry ? `${entryCountry.flag} ${entryCountry.name}` : entry.country}
            </span>
            {entry.preSessional && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#5a63df] dark:text-violet-300">Pre-sessional Available</span>
              </>
            )}
          </div>
        </div>

        {/* Outcome Badge */}
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.08em] transition-transform duration-200 ease-smooth-out group-hover:scale-[1.02] ${meta.badgeText}`}
        >
          <OutcomeIcon className="h-3.5 w-3.5 stroke-[2.5]" />
          {meta.label}
        </span>
      </div>

      {/* Comparison Grid */}
      {requirement && (
        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Overall Comparison */}
          <div className={`${WELL} flex items-center justify-between rounded-xl p-2.5 px-3.5`}>
            <div>
              <span className={`${MICRO} ${MUTED} block`}>Overall Band</span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={`${NUM} text-lg font-black text-slate-900 dark:text-white`}>
                  {formatBand(reqOverall)}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  required
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`${MICRO} ${MUTED} block`}>Your Score</span>
              <span
                className={`${NUM} mt-0.5 inline-flex items-center gap-1 text-sm font-extrabold ${
                  clearsOverall
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {clearsOverall ? (
                  <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                ) : (
                  <AlertCircle className="h-3 w-3 stroke-[2.5]" />
                )}
                {formatBand(learnerOverall)}
              </span>
            </div>
          </div>

          {/* Component Floor Comparison */}
          <div className={`${WELL} flex items-center justify-between rounded-xl p-2.5 px-3.5`}>
            <div>
              <span className={`${MICRO} ${MUTED} block`}>Component Floor</span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={`${NUM} text-lg font-black text-slate-900 dark:text-white`}>
                  {uniformFloor !== null
                    ? `≥ ${formatBand(uniformFloor)}`
                    : hasComponentFloor
                      ? 'Varies'
                      : 'Not stated'}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {uniformFloor !== null
                    ? 'each skill'
                    : hasComponentFloor
                      ? 'by skill — see below'
                      : 'check course'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`${MICRO} ${MUTED} block`}>Your Lowest</span>
              <span
                className={`${NUM} mt-0.5 inline-flex items-center gap-1 text-sm font-extrabold ${
                  uniformFloor === null
                    ? 'text-slate-600 dark:text-slate-300'
                    : clearsComponents
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {uniformFloor !== null &&
                  (clearsComponents ? (
                    <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                  ) : (
                    <AlertCircle className="h-3 w-3 stroke-[2.5]" />
                  ))}
                {formatBand(learnerLowest)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shortfalls Callout */}
      {shortfalls.length > 0 && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0 text-xs">
            <strong className="font-extrabold">Requirement Gap: </strong>
            <span>
              {shortfalls
                .map(
                  (s) =>
                    `${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)} is ${formatBand(
                      s.gap
                    )} band short (needs ${formatBand(s.required)}, you have ${formatBand(s.actual)})`
                )
                .join('; ')}
            </span>
          </div>
        </div>
      )}

      {/*
       * "Not Published" was a dead end: no numbers, no explanation, no way
       * forward. It usually means the figure exists at the other study level,
       * so the card says which and offers to switch.
       */}
      {outcome === 'unknown' && (
        <div className={`${WELL} mt-3 rounded-xl p-3`}>
          <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
            No {level === 'postgraduate' ? 'postgraduate' : 'undergraduate'} requirement is
            published for this university yet, so your score cannot be compared against it.
            {otherLevelAvailable && (
              <>
                {' '}
                {level === 'postgraduate' ? 'An undergraduate' : 'A postgraduate'} figure is
                available.
              </>
            )}
          </p>
          {otherLevelAvailable && onSwitchLevel && (
            <button
              type="button"
              onClick={onSwitchLevel}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5a63df] transition-colors hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] dark:border-white/10 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
            >
              Switch to {level === 'postgraduate' ? 'Undergraduate' : 'Postgraduate'}
              <ArrowRight className="h-3 w-3 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}

      {/* Contextual Notes & Course Ranges */}
      {requirement?.range && (
        <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-200">Course range: </span>
          Different programmes require between{' '}
          <strong className="text-slate-900 dark:text-white">
            {formatBand(requirement.range.min)}
          </strong>{' '}
          and{' '}
          <strong className="text-slate-900 dark:text-white">
            {formatBand(requirement.range.max)}
          </strong>
          .
          {outcome !== 'unknown' && clearsWholeRange === false && (
            <span className="ml-1 text-amber-700 dark:text-amber-300">
              Your band clears typical courses, but competitive departments ask for higher.
            </span>
          )}
        </p>
      )}

      {entry.notes && (
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
          {entry.notes}
        </p>
      )}

      {/* Card Footer with Official Link & Verification */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e2f0]/70 pt-3 dark:border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Human-verified {entry.lastVerified}
          </span>
          {verification === 'stale' && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <TriangleAlert className="h-3 w-3" />
              Annual review pending
            </span>
          )}
        </div>

        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-xs font-bold text-[#5a63df] shadow-2xs transition-all duration-200 ease-smooth-out group-hover:border-[#5a63df]/35 group-hover:bg-[#f7f6fd] group-hover:text-[#4a53cf] hover:!border-[#5a63df] hover:!bg-[#ede9fe] dark:border-white/10 dark:bg-white/5 dark:text-violet-300 dark:group-hover:border-violet-400/30 dark:group-hover:bg-white/10 dark:hover:!border-violet-400/50"
        >
          Official Requirements Page
          <ExternalLink
            className="h-3 w-3 stroke-[2.5] transition-transform duration-200 ease-smooth-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </li>
  );
}

export default function UniversityMatchTool({ handlePrimaryCta }) {
  /*
   * Every country by default. Asking a learner to pick a country first put the
   * whole dataset behind a decision they often came here to make — and it made
   * the one country they happened to land on look like the entire register.
   */
  const [countryCode, setCountryCode] = useState(ALL_COUNTRIES);
  const [level, setLevel] = useState('postgraduate');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all | meets | short | presessional
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchBoxRef = useRef(null);

  const [scores, setScores] = useState({
    listening: 6.5,
    reading: 6.5,
    writing: 6.0,
    speaking: 6.5,
  });

  const overall = useMemo(() => {
    const total = SKILLS.reduce((sum, skill) => sum + scores[skill.key], 0);
    return roundOverallBand(total / SKILLS.length);
  }, [scores]);

  const lowestSkill = useMemo(() => {
    let minKey = SKILLS[0].key;
    let minVal = scores[minKey];
    for (const skill of SKILLS) {
      if (scores[skill.key] < minVal) {
        minVal = scores[skill.key];
        minKey = skill.key;
      }
    }
    const skillObj = SKILLS.find((s) => s.key === minKey);
    return { name: skillObj?.name ?? 'Skill', value: minVal };
  }, [scores]);

  const showingAllCountries = countryCode === ALL_COUNTRIES;
  const country = showingAllCountries
    ? undefined
    : COUNTRIES.find((option) => option.code === countryCode);

  const activeEntries = useMemo(
    () => (showingAllCountries ? ALL_ENTRIES : (country?.entries ?? [])),
    [showingAllCountries, country]
  );

  const allResults = useMemo(
    () => matchUniversities(activeEntries, level, { overall, skills: scores }),
    [activeEntries, level, overall, scores]
  );

  const qualifyingCount = useMemo(
    () => allResults.filter((r) => r.outcome === 'safe' || r.outcome === 'match').length,
    [allResults]
  );

  /*
   * Only universities that actually publish a figure for the chosen level can be
   * met or missed. Counting an unpublished entry in the denominator reads as a
   * failure ("2 of 3") when nothing was failed — there was simply nothing to
   * compare against.
   */
  const comparableCount = useMemo(
    () => allResults.filter((r) => r.outcome !== 'unknown' && r.outcome !== 'not-accepted').length,
    [allResults]
  );

  const shortCount = useMemo(
    () => allResults.filter((r) => r.outcome === 'reach' || r.outcome === 'unlikely').length,
    [allResults]
  );

  const preSessionalCount = useMemo(
    () => allResults.filter((r) => r.entry.preSessional).length,
    [allResults]
  );

  const filteredResults = useMemo(() => {
    return allResults.filter((r) => {
      // Search text match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = r.entry.name.toLowerCase().includes(query);
        const matchesCity = r.entry.city ? r.entry.city.toLowerCase().includes(query) : false;
        /*
         * Country is searchable because the list now spans all of them: typing
         * "australia" is the fastest way to narrow, and it would be strange for
         * a word printed on every card not to match.
         */
        const countryName = countryByCode(r.entry.country)?.name ?? '';
        const matchesCountry = countryName.toLowerCase().includes(query);
        if (!matchesName && !matchesCity && !matchesCountry) return false;
      }

      // Filter tabs
      if (activeFilter === 'meets') {
        return r.outcome === 'safe' || r.outcome === 'match';
      }
      if (activeFilter === 'short') {
        return r.outcome === 'reach' || r.outcome === 'unlikely';
      }
      if (activeFilter === 'presessional') {
        return Boolean(r.entry.preSessional);
      }
      return true;
    });
  }, [allResults, searchQuery, activeFilter]);

  /*
   * Suggestions come from the same entries the results list renders, so the box
   * can never propose a university the list cannot show. Each one carries the
   * match outcome, which turns the dropdown into a preview rather than a
   * spelling aid.
   */
  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return allResults
      .map((result) => {
        const name = result.entry.name;
        const city = result.entry.city ?? '';
        const countryName = countryByCode(result.entry.country)?.name ?? '';
        const nameIndex = name.toLowerCase().indexOf(query);
        const cityIndex = city.toLowerCase().indexOf(query);
        const countryIndex = countryName.toLowerCase().indexOf(query);
        if (nameIndex === -1 && cityIndex === -1 && countryIndex === -1) return null;
        return {
          result,
          // A name hit ranks above a city hit, a city hit above a country hit,
          // and a prefix above a mid-word hit within each.
          rank:
            nameIndex === 0
              ? 0
              : nameIndex > 0
                ? 1
                : cityIndex === 0
                  ? 2
                  : cityIndex > 0
                    ? 3
                    : countryIndex === 0
                      ? 4
                      : 5,
          matchedOn: nameIndex !== -1 ? 'name' : cityIndex !== -1 ? 'city' : 'country',
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.result.entry.name.localeCompare(b.result.entry.name))
      .slice(0, 6);
  }, [allResults, searchQuery]);

  // Reset the highlighted option whenever the candidate list changes underneath it.
  useEffect(() => {
    setActiveSuggestion(-1);
  }, [searchQuery]);

  useEffect(() => {
    if (!suggestionsOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!searchBoxRef.current?.contains(event.target)) setSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [suggestionsOpen]);

  const chooseSuggestion = (suggestion) => {
    if (!suggestion) return;
    setSearchQuery(suggestion.result.entry.name);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    // A picked university should never land behind an active filter that hides it.
    setActiveFilter('all');
  };

  const handleSearchKeyDown = (event) => {
    if (!suggestionsOpen || suggestions.length === 0) {
      if (event.key === 'ArrowDown' && suggestions.length > 0) {
        setSuggestionsOpen(true);
        setActiveSuggestion(0);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Enter') {
      if (activeSuggestion >= 0) {
        event.preventDefault();
        chooseSuggestion(suggestions[activeSuggestion]);
      } else {
        setSuggestionsOpen(false);
      }
    } else if (event.key === 'Escape') {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
    }
  };

  const applyPreset = (presetScores) => {
    setScores(presetScores);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:gap-8">
      {/* LEFT COLUMN: Sticky Score & Filter Controls */}
      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={`${PANEL} p-5 shadow-xs sm:p-6`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e4e2f0] pb-3.5 dark:border-white/[0.07]">
            <div>
              <span className={`${MICRO} ${MUTED}`}>Step 1 · Your IELTS result</span>
              <h3 className={`${TITLE} mt-0.5 text-base font-extrabold`}>
                Enter the scores you got
              </h3>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:text-[#afb5ff]">
              <GraduationCap className="h-4 w-4" />
            </span>
          </div>

          {/* Country Selection */}
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
                      {showingAllCountries ? '🌍' : (country?.flag ?? '🌍')}
                    </span>
                    <div className="flex min-w-0 flex-col text-left">
                      <span className="truncate text-xs font-extrabold leading-tight text-slate-900 dark:text-white">
                        {showingAllCountries ? 'All countries' : (country?.name ?? 'All countries')}
                      </span>
                      <span className="text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                        {activeEntries.length} verified{' '}
                        {activeEntries.length === 1 ? 'institution' : 'institutions'}
                        {showingAllCountries ? ` · ${COUNTRIES.length} countries` : ''}
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

                <div className="my-1 border-t border-[#e4e2f0] px-2 pt-1.5 dark:border-white/10">
                  <span className={`${MICRO} ${MUTED} block pb-1`}>
                    Upcoming Verification Batches
                  </span>
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
              </SelectContent>
            </Select>

            {/*
              The dropdown alone did not read as optional — learners treated the
              country as something they had to commit to before anything would
              happen. These chips make narrowing a visible, one-tap suggestion
              sitting next to the full list, and give an obvious way back.
            */}
            <div className="mt-2">
              <span className="mb-1.5 block text-[10.5px] font-medium leading-snug text-slate-500 dark:text-slate-400">
                {showingAllCountries
                  ? 'Showing every country. Tap one to focus your shortlist.'
                  : 'Showing one country.'}
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
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => setCountryCode(isActive ? ALL_COUNTRIES : option.code)}
                      aria-pressed={isActive}
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10.5px] font-bold transition-colors ${
                        isActive
                          ? 'border-[#5a63df] bg-[#f4f3fb] text-[#5a63df] dark:border-violet-400/50 dark:bg-violet-400/10 dark:text-violet-300'
                          : 'border-[#e4e2f0] bg-white text-slate-600 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:text-violet-300'
                      }`}
                    >
                      <span>{option.flag}</span>
                      <span>{option.code}</span>
                      <span className="font-semibold text-slate-400">{option.entries.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <Sparkles className="h-3 w-3 text-[#5a63df] dark:text-violet-400" />
              Next batch: {UPCOMING_COUNTRIES.slice(0, 4).join(', ')} verifying now.
            </p>
          </div>

          {/* Study Level Segmented Control */}
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

          {/* Quick Score Presets */}
          <div className="mt-4 border-t border-[#e4e2f0] pt-4 dark:border-white/[0.07]">
            <span className={`${MICRO} ${MUTED} mb-0.5 block`}>
              Start from a typical score you got
            </span>
            <p className="mb-2 text-[10.5px] font-medium leading-snug text-slate-500 dark:text-slate-400">
              Tap one to fill in your four bands, then adjust each skill below.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {SCORE_PRESETS.map((preset) => {
                const isActive = SKILLS.every(
                  (skill) => scores[skill.key] === preset.scores[skill.key]
                );
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.scores)}
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

          {/* Overall Band Summary Card */}
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

      {/* RIGHT COLUMN: Search, Filters & University Results */}
      <div className="space-y-4">
        {/* Search & Filter Header Panel */}
        <div className={`${PANEL} p-4 sm:p-5 shadow-xs`}>
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative min-w-0 flex-1" ref={searchBoxRef}>
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                role="combobox"
                aria-expanded={suggestionsOpen && suggestions.length > 0}
                aria-controls="university-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={
                  activeSuggestion >= 0 ? `university-suggestion-${activeSuggestion}` : undefined
                }
                autoComplete="off"
                placeholder="Search university, city or country (e.g. Sheffield, Australia)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="h-10 w-full rounded-xl border border-[#e4e2f0] bg-white pl-9 pr-9 text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-colors hover:border-[#5a63df]/40 focus:border-[#5a63df] focus:outline-none focus:ring-2 focus:ring-[#5a63df]/20 dark:border-white/10 dark:bg-[#18171f] dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestionsOpen(false);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Autosuggest dropdown */}
              {suggestionsOpen && suggestions.length > 0 && (
                <ul
                  id="university-suggestions"
                  role="listbox"
                  aria-label="University suggestions"
                  className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#e4e2f0] bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#18171f]"
                >
                  {suggestions.map((suggestion, index) => {
                    const { entry } = suggestion.result;
                    const suggestionMeta =
                      OUTCOME_META[suggestion.result.outcome] || OUTCOME_META.unknown;
                    const isActive = index === activeSuggestion;
                    return (
                      <li key={entry.id} role="none">
                        <button
                          type="button"
                          id={`university-suggestion-${index}`}
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveSuggestion(index)}
                          onClick={() => chooseSuggestion(suggestion)}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-[#f2f0ff] dark:bg-white/[0.07]'
                              : 'hover:bg-[#f8f8fe] dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">
                              {entry.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                              {[entry.city, countryByCode(entry.country)?.name]
                                .filter(Boolean)
                                .join(' · ')}
                              {/* No country suffix: the country is already printed above it. */}
                              {suggestion.matchedOn === 'city' ? ' · matched on city' : ''}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${suggestionMeta.badgeText}`}
                          >
                            {suggestionMeta.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Results Match Count */}
            <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span
                className={`${NUM} rounded-md bg-[#5a63df]/10 px-2 py-1 text-[#5a63df] dark:text-violet-300`}
              >
                {qualifyingCount} of {comparableCount}
              </span>
              <span>meet your score</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07]">
            <span className={`${MICRO} ${MUTED} mr-1`}>Filter:</span>

            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeFilter === 'all'
                  ? 'bg-[#5a63df] text-white shadow-xs dark:bg-[#5a63df] dark:text-white dark:shadow-[0_2px_10px_rgba(90,99,223,0.35)]'
                  : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
              }`}
            >
              All Universities
              <span className={`${NUM} opacity-75`}>({allResults.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('meets')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeFilter === 'meets'
                  ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-600 dark:text-white dark:shadow-[0_2px_10px_rgba(16,185,129,0.35)]'
                  : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
              Meets ({qualifyingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('short')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeFilter === 'short'
                  ? 'bg-amber-600 text-white shadow-xs dark:bg-amber-600 dark:text-white dark:shadow-[0_2px_10px_rgba(217,119,6,0.35)]'
                  : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
              }`}
            >
              <AlertCircle className="h-3 w-3 stroke-[2.5]" />
              Shortfall ({shortCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('presessional')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeFilter === 'presessional'
                  ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-600 dark:text-white dark:shadow-[0_2px_10px_rgba(79,70,229,0.35)]'
                  : 'bg-[#f4f3fb] text-slate-600 hover:bg-[#e8eaf6] dark:border dark:border-white/10 dark:bg-[#16151e] dark:text-slate-300 dark:hover:bg-[#1f1e29]'
              }`}
            >
              Pre-sessional ({preSessionalCount})
            </button>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length === 0 ? (
          <div className={`${PANEL} p-10 text-center`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-slate-800 dark:text-white">
              No matching universities found
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Try clearing your search query or selecting a different filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-xs font-bold text-[#5a63df] transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredResults.map((result) => (
              <ResultCard
                key={result.entry.id}
                result={result}
                learnerOverall={overall}
                learnerLowest={lowestSkill.value}
                level={level}
                onSwitchLevel={() =>
                  setLevel(level === 'postgraduate' ? 'undergraduate' : 'postgraduate')
                }
              />
            ))}
          </ul>
        )}

        {/* Informative Authority Note */}
        <div className={`${PANEL} p-4 sm:p-5 text-slate-600 dark:text-slate-400`}>
          <p className="text-xs font-medium leading-relaxed">
            <strong className="font-bold text-slate-800 dark:text-slate-200">
              Official authority notice:{' '}
            </strong>
            Requirements change between academic intakes and differ across specialised departments
            (such as Medicine, Law, and Nursing). Every figure on this page links directly to the
            university’s official website. Always verify on the official course page before
            submitting your UCAS or postgraduate application.
          </p>
        </div>

        {/* Gap CTA Banner */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            onClick={handlePrimaryCta}
            className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ded9ff] bg-linear-to-r from-[#f2f0ff] to-[#f8f7ff] p-4 text-left transition-all duration-200 hover:border-[#5a63df]/40 hover:shadow-sm dark:border-violet-500/25 dark:from-violet-950/40 dark:to-indigo-950/20 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#5e50ee] dark:text-violet-300">
                Close The Band Gap
              </span>
              <p className="mt-0.5 text-sm font-extrabold text-[#07142f] dark:text-white">
                Short on a skill? Grade your Writing & Speaking against official examiner rubrics.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#5a63df] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-xs transition-transform duration-200 group-hover:translate-x-0.5">
              Start Free Practice
              <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          </button>
        </m.div>
      </div>
    </div>
  );
}
