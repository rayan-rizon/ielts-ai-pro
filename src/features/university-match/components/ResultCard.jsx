import React from 'react';
import MapPin from 'lucide-react/icons/map-pin';
import ShieldCheck from 'lucide-react/icons/shield-check';
import TriangleAlert from 'lucide-react/icons/triangle-alert';
import AlertCircle from 'lucide-react/icons/alert-circle';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import ArrowRight from 'lucide-react/icons/arrow-right';
import ExternalLink from 'lucide-react/icons/external-link';

import { WELL, NUM, MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { skillMinimum } from '../universityMatch';
import { countryByCode } from '../universityData';
import { SKILLS, OUTCOME_META, formatBand } from './matchToolConstants';

function computeCardFloorState(requirement, learnerLowest) {
  if (!requirement) {
    return { hasComponentFloor: false, uniformFloor: null, clearsComponents: false };
  }
  const definedFloors = SKILLS.map((skill) => skillMinimum(requirement, skill.key)).filter(
    (value) => value !== null
  );
  const hasComponentFloor = definedFloors.length > 0;
  const isUniform = hasComponentFloor && definedFloors.every((val) => val === definedFloors[0]);
  const uniformFloor = isUniform ? definedFloors[0] : null;
  const clearsComponents = uniformFloor !== null && learnerLowest >= uniformFloor;

  return { hasComponentFloor, uniformFloor, clearsComponents };
}

function getFloorDescription(uniformFloor, hasComponentFloor) {
  if (uniformFloor !== null) {
    return { label: `≥ ${formatBand(uniformFloor)}`, subtext: 'each skill' };
  }
  if (hasComponentFloor) {
    return { label: 'Varies', subtext: 'by skill — see below' };
  }
  return { label: 'Not stated', subtext: 'check course' };
}

function CardHeader({ entry, meta }) {
  const OutcomeIcon = meta.icon;
  const entryCountry = countryByCode(entry.country);
  const countryDisplay = entryCountry ? `${entryCountry.flag} ${entryCountry.name}` : entry.country;

  return (
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
          <span>{countryDisplay}</span>
          {entry.preSessional && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#5a63df] dark:text-violet-300">Pre-sessional Available</span>
            </>
          )}
        </div>
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-black uppercase tracking-[0.08em] transition-transform duration-200 ease-smooth-out group-hover:scale-[1.02] ${meta.badgeText}`}
      >
        <OutcomeIcon className="h-3.5 w-3.5 stroke-[2.5]" />
        {meta.label}
      </span>
    </div>
  );
}

function OverallComparisonTile({ reqOverall, learnerOverall, clearsOverall }) {
  return (
    <div className={`${WELL} flex items-center justify-between rounded-xl p-2.5 px-3.5`}>
      <div>
        <span className={`${MICRO} ${MUTED} block`}>Overall Band</span>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`${NUM} text-lg font-black text-slate-900 dark:text-white`}>
            {formatBand(reqOverall)}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">required</span>
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
  );
}

function ComponentFloorTile({ uniformFloor, hasComponentFloor, learnerLowest, clearsComponents }) {
  const { label, subtext } = getFloorDescription(uniformFloor, hasComponentFloor);

  let textColor = 'text-slate-600 dark:text-slate-300';
  if (uniformFloor !== null) {
    textColor = clearsComponents
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-amber-600 dark:text-amber-400';
  }

  return (
    <div className={`${WELL} flex items-center justify-between rounded-xl p-2.5 px-3.5`}>
      <div>
        <span className={`${MICRO} ${MUTED} block`}>Component Floor</span>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className={`${NUM} text-lg font-black text-slate-900 dark:text-white`}>
            {label}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {subtext}
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className={`${MICRO} ${MUTED} block`}>Your Lowest</span>
        <span
          className={`${NUM} mt-0.5 inline-flex items-center gap-1 text-sm font-extrabold ${textColor}`}
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
  );
}

function RequirementSection({ requirement, learnerOverall, learnerLowest }) {
  if (!requirement) return null;
  const reqOverall = requirement.overall ?? null;
  const clearsOverall = reqOverall !== null && learnerOverall >= reqOverall;
  const { hasComponentFloor, uniformFloor, clearsComponents } = computeCardFloorState(
    requirement,
    learnerLowest
  );

  return (
    <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      <OverallComparisonTile
        reqOverall={reqOverall}
        learnerOverall={learnerOverall}
        clearsOverall={clearsOverall}
      />
      <ComponentFloorTile
        uniformFloor={uniformFloor}
        hasComponentFloor={hasComponentFloor}
        learnerLowest={learnerLowest}
        clearsComponents={clearsComponents}
      />
    </div>
  );
}

function RequirementGapAlert({ shortfalls }) {
  if (!shortfalls || shortfalls.length === 0) return null;

  return (
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
  );
}

function UnknownOutcomeNotice({ level, otherLevelAvailable, onSwitchLevel }) {
  const currentLevelLabel = level === 'postgraduate' ? 'postgraduate' : 'undergraduate';
  const otherLevelLabel = level === 'postgraduate' ? 'An undergraduate' : 'A postgraduate';
  const targetLevelLabel = level === 'postgraduate' ? 'Undergraduate' : 'Postgraduate';

  return (
    <div className={`${WELL} mt-3 rounded-xl p-3`}>
      <p className="text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
        No {currentLevelLabel} requirement is published for this university yet, so your score
        cannot be compared against it.
        {otherLevelAvailable && ` ${otherLevelLabel} figure is available.`}
      </p>
      {otherLevelAvailable && onSwitchLevel && (
        <button
          type="button"
          onClick={onSwitchLevel}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#5a63df] transition-colors hover:border-[#5a63df]/40 hover:bg-[#f4f3fb] dark:border-white/10 dark:bg-white/5 dark:text-violet-300 dark:hover:bg-white/10"
        >
          Switch to {targetLevelLabel}
          <ArrowRight className="h-3 w-3 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}

function CourseRangeNotice({ range, outcome, clearsWholeRange }) {
  if (!range) return null;

  return (
    <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
      <span className="font-bold text-slate-800 dark:text-slate-200">Course range: </span>
      Different programmes require between{' '}
      <strong className="text-slate-900 dark:text-white">{formatBand(range.min)}</strong> and{' '}
      <strong className="text-slate-900 dark:text-white">{formatBand(range.max)}</strong>.
      {outcome !== 'unknown' && clearsWholeRange === false && (
        <span className="ml-1 text-amber-700 dark:text-amber-300">
          Your band clears typical courses, but competitive departments ask for higher.
        </span>
      )}
    </p>
  );
}

function NotesNotice({ notes }) {
  if (!notes) return null;
  return (
    <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
      {notes}
    </p>
  );
}

function CardFooter({ entry, verification }) {
  return (
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
  );
}

export function ResultCard({ result, learnerOverall, learnerLowest, level, onSwitchLevel }) {
  const { entry, outcome, requirement, shortfalls, verification, clearsWholeRange } = result;
  const meta = OUTCOME_META[outcome] ?? OUTCOME_META.unknown;

  const isUnknown = outcome === 'unknown';
  const otherLevel = level === 'postgraduate' ? 'undergraduate' : 'postgraduate';
  const otherLevelAvailable = isUnknown && Boolean(entry.requirements?.[otherLevel]);

  return (
    <li className="group relative rounded-2xl border border-[#e4e2f0] bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-250 ease-smooth-out transform-gpu will-change-transform [backface-visibility:hidden] hover:-translate-y-0.5 hover:border-[#5a63df]/45 hover:bg-[#fcfbff] hover:shadow-[0_10px_25px_-5px_rgba(90,99,223,0.12),0_8px_10px_-6px_rgba(90,99,223,0.08)] active:scale-[0.995] active:translate-y-0 dark:border-white/[0.08] dark:bg-[#14131a] dark:shadow-none dark:hover:border-violet-400/35 dark:hover:bg-[#181723] dark:hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
      <CardHeader entry={entry} meta={meta} />

      <RequirementSection
        requirement={requirement}
        learnerOverall={learnerOverall}
        learnerLowest={learnerLowest}
      />

      <RequirementGapAlert shortfalls={shortfalls} />

      {isUnknown && (
        <UnknownOutcomeNotice
          level={level}
          otherLevelAvailable={otherLevelAvailable}
          onSwitchLevel={onSwitchLevel}
        />
      )}

      <CourseRangeNotice
        range={requirement?.range}
        outcome={outcome}
        clearsWholeRange={clearsWholeRange}
      />

      <NotesNotice notes={entry.notes} />

      <CardFooter entry={entry} verification={verification} />
    </li>
  );
}

export default ResultCard;
