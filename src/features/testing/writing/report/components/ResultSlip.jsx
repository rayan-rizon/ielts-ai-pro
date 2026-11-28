import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { cleanFeedbackText } from '../../utils/feedbackFormatting';
import { minimumWordsFor } from '../../utils/writingReportModel';
import { bandReason, buildLadder } from '../reportViewModel';
import { compareWithLast, reportDate, timeUsed } from '../resultFacts';
import { ENGLISH, formatBand } from './reportStyles';

const SOFT = 'text-[#c9ccf3]';
const FAINT = 'text-[#a9addb]';
// Label and track sit side-by-side once the chart column reaches 20rem (320px).
const COLUMNS =
  '@[20rem]:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] @md:grid-cols-[minmax(0,11.25rem)_minmax(0,1fr)]';
const TRACK_COL = 'col-span-2 @[20rem]:col-span-1';
const TABULAR = 'tabular-nums tracking-tight';
/** Scores on the chart and in the facts line up like readings on a scale. */
const READING = 'font-mono tabular-nums tracking-[-0.02em]';
/** The value over a dot: a criterion's, then the larger overall one. */
const VALUE_SIZE = ['text-[12px]', 'text-[13px]'];
const EASE_OUT = [0.23, 1, 0.32, 1];

function Legend({ t, target }) {
  return (
    <div className={cn('flex flex-wrap gap-x-3.5 gap-y-1 text-[12px]', SOFT)} aria-hidden="true">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
        <span>{t('legendYou')}</span>
      </span>
      {target !== null && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[#9aa1ff]" />
          <span>{t('legendTarget')}</span>
          <span className={cn(TABULAR, 'font-bold text-white')}>{formatBand(target)}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 border-l-2 border-dashed border-[#f0b54a]" />
        <span>{t('legendBand8')}</span>
      </span>
    </div>
  );
}

const pointToneClass = (row, isHovered) => {
  if (row.isLowest) {
    return isHovered ? 'bg-[#f0b54a] shadow-[0_0_0_5px_rgba(240,181,74,0.26)]' : 'bg-[#f0b54a]';
  }
  if (row.atTarget) {
    return isHovered ? 'bg-[#7fe0bb] shadow-[0_0_0_5px_rgba(127,224,187,0.26)]' : 'bg-[#7fe0bb]';
  }
  return isHovered ? 'bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.22)]' : 'bg-white';
};

const connectorToneClass = (row, isHovered) =>
  cn(
    'bg-gradient-to-r to-[#9aa1ff]/60',
    row.isLowest ? 'from-[#f0b54a]' : 'from-white',
    isHovered ? 'brightness-110' : 'brightness-75'
  );

/** Keeps a score label inside the track near either end. */
function alignScore(at) {
  if (at <= 8) return { left: '0%', transform: 'translateX(0)' };
  if (at >= 92) return { left: '100%', transform: 'translateX(-100%)' };
  return { left: `${at}%`, transform: 'translateX(-50%)' };
}

/** The score above its dot; its background keeps the guide lines off the digits. */
function ScoreValue({ row, isOverall, hidden, delay, reducedMotion }) {
  const align = alignScore(row.at);
  return (
    <motion.span
      aria-hidden="true"
      initial={reducedMotion ? false : { left: '0%', opacity: 0 }}
      animate={{ left: align.left, opacity: hidden ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, delay, ease: EASE_OUT }}
      style={{ transform: align.transform }}
      className={cn(
        READING,
        VALUE_SIZE[Number(isOverall)],
        'pointer-events-none absolute top-0 z-10 rounded bg-[#17183d] px-1 font-bold leading-none transition-opacity duration-100',
        rowTone(row)
      )}
    >
      {formatBand(row.score)}
    </motion.span>
  );
}

/** One criterion on the shared scale. The track is a number line, so always left to right. */
function LadderTrack({
  t,
  row,
  ladder,
  label,
  index,
  isOverall = false,
  isRowHovered,
  isPointHovered,
  instantTooltip,
  onPointEnter,
  onPointLeave,
  reducedMotion,
}) {
  const at = (value) => ({ left: `${value}%` });
  const rowDelay = reducedMotion ? 0 : 0.08 + index * 0.045;
  const connectorOriginX = row.at <= (ladder.targetAt ?? row.at) ? 0 : 1;
  const tooltipAlign =
    row.at <= 15
      ? { style: { left: 0, transformOrigin: 'bottom left' }, className: '' }
      : row.at >= 85
        ? { style: { right: 0, transformOrigin: 'bottom right' }, className: '' }
        : {
            style: { ...at(row.at), transformOrigin: 'bottom center' },
            className: '-translate-x-1/2',
          };

  return (
    <span className={cn('relative mx-2 block pt-[16px]', TRACK_COL)} dir="ltr">
      <ScoreValue
        row={row}
        isOverall={isOverall}
        hidden={isPointHovered}
        delay={rowDelay}
        reducedMotion={reducedMotion}
      />
      <span className="relative block h-[20px]" role="img" aria-label={label}>
        <span
          className={cn(
            'absolute inset-x-0 top-1/2 -mt-px h-0.5 rounded-full transition-colors duration-150',
            isRowHovered || isPointHovered ? 'bg-white/25' : 'bg-white/10'
          )}
        />
        {ladder.targetAt !== null && (
          <span
            className="absolute -top-[18px] bottom-0 border-l border-[#9aa1ff]/35"
            style={at(ladder.targetAt)}
          />
        )}
        {/* Full height, so the rows form one continuous Band 8 guide. */}
        <span
          className="absolute -top-[18px] bottom-0 border-l-2 border-dashed border-[#f0b54a]/55"
          style={at(ladder.eightAt)}
        />
        {ladder.targetAt !== null && (
          <>
            <motion.span
              initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.28,
                delay: reducedMotion ? 0 : rowDelay + 0.16,
                ease: EASE_OUT,
              }}
              className={cn(
                'absolute top-1/2 -mt-0.5 h-1 rounded-full transition-[filter] duration-150',
                connectorToneClass(row, isPointHovered)
              )}
              style={{
                left: `${Math.min(row.at, ladder.targetAt)}%`,
                width: `${Math.abs(ladder.targetAt - row.at)}%`,
                transformOrigin: connectorOriginX === 0 ? 'left center' : 'right center',
              }}
            />
            <span
              className={cn(
                'absolute top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full border-2 border-[#9aa1ff] bg-[#17183d] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                isPointHovered && 'scale-115 bg-[#252762]'
              )}
              style={at(ladder.targetAt)}
            />
          </>
        )}
        <motion.span
          tabIndex={0}
          onMouseEnter={onPointEnter}
          onMouseLeave={onPointLeave}
          onFocus={onPointEnter}
          onBlur={onPointLeave}
          initial={reducedMotion ? false : { left: '0%', scale: 0.7, opacity: 0 }}
          animate={{ left: `${row.at}%`, scale: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.4, delay: rowDelay, ease: EASE_OUT }}
          className="group/point absolute top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1ff]"
        >
          <span
            className={cn(
              'rounded-full shadow-[0_0_0_3px_#17183d] transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
              isOverall ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5',
              pointToneClass(row, isPointHovered),
              isPointHovered && 'scale-[1.3]'
            )}
          />
        </motion.span>
        <AnimatePresence>
          {isPointHovered && (
            <motion.span
              initial={reducedMotion || instantTooltip ? false : { opacity: 0, y: 3, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 2, scale: 0.97 }}
              transition={{
                duration: reducedMotion || instantTooltip ? 0 : 0.125,
                ease: EASE_OUT,
              }}
              style={tooltipAlign.style}
              className={cn(
                'pointer-events-none absolute bottom-full z-20 mb-1 whitespace-nowrap rounded-lg border border-white/15 bg-[#0d0e28] px-2.5 py-1 text-[11px] font-semibold text-white shadow-md',
                tooltipAlign.className
              )}
            >
              <span className={FAINT}>{t('legendYou')}: </span>
              <span className={cn(TABULAR, 'font-extrabold', rowTone(row))}>
                {formatBand(row.score)}
              </span>
              {ladder.target !== null && (
                <>
                  <span className="mx-1.5 text-white/25">·</span>
                  <span className={FAINT}>{t('legendTarget')}: </span>
                  <span className={cn(TABULAR, 'font-bold text-[#c9ccf3]')}>
                    {formatBand(ladder.target)}
                  </span>
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

const rowStatus = (row) => (row.isLowest ? 'lowestArea' : row.atTarget ? 'atTarget' : null);
const rowTone = (row) =>
  row.isLowest ? 'text-[#f0b54a]' : row.atTarget ? 'text-[#7fe0bb]' : 'text-white';

function LadderRow({
  t,
  row,
  ladder,
  label,
  index,
  isPointHovered,
  instantTooltip,
  onPointEnter,
  onPointLeave,
  reducedMotion,
}) {
  const [isRowHovered, setIsRowHovered] = useState(false);
  const status = rowStatus(row);
  return (
    <motion.li
      data-criterion={row.id}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.24,
        delay: reducedMotion ? 0 : 0.05 + index * 0.045,
        ease: EASE_OUT,
      }}
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-lg px-1.5 py-1 transition-colors duration-150 @[20rem]:-mx-1.5 @[20rem]:py-0.5',
        isRowHovered && 'bg-white/[0.03]',
        COLUMNS
      )}
    >
      <span className="min-w-0 @[20rem]:pt-[17px]">
        <bdi
          className="block text-[13px] font-semibold leading-[18px] text-[#dfe0f6] @md:text-[13.5px]"
          {...ENGLISH}
        >
          {row.label}
        </bdi>
        {status && (
          <span className={cn('block text-[11px] font-bold leading-[15px]', rowTone(row))}>
            {t(status)}
          </span>
        )}
      </span>
      <LadderTrack
        t={t}
        row={row}
        ladder={ladder}
        label={label}
        index={index}
        isRowHovered={isRowHovered}
        isPointHovered={isPointHovered}
        instantTooltip={instantTooltip}
        onPointEnter={onPointEnter}
        onPointLeave={onPointLeave}
        reducedMotion={reducedMotion}
      />
    </motion.li>
  );
}

function BandLadder({ t, criteria, overallBand, targetBand, reducedMotion }) {
  const ladder = buildLadder(criteria, targetBand);
  const [hoveredId, setHoveredId] = useState(null);
  const [hasHovered, setHasHovered] = useState(false);
  const [instantTooltip, setInstantTooltip] = useState(false);
  const [overallHovered, setOverallHovered] = useState(false);

  const overallScore = Number(overallBand);
  const hasOverall = Number.isFinite(overallScore) && overallScore > 0;
  const overallAt = hasOverall
    ? Math.min(100, Math.max(0, ((overallScore - ladder.low) / (ladder.high - ladder.low)) * 100))
    : 0;
  const overallRow = hasOverall
    ? {
        id: 'overall',
        score: overallScore,
        at: overallAt,
        isLowest: false,
        atTarget: ladder.target !== null && overallScore >= ladder.target,
      }
    : null;

  const labelFor = (row) =>
    t(ladder.target === null ? 'ladderAria' : 'ladderAriaTarget', {
      criterion: row.label,
      score: formatBand(row.score),
      target: formatBand(ladder.target),
    });

  return (
    <div
      className="min-w-0"
      onMouseLeave={() => {
        setHoveredId(null);
        setHasHovered(false);
        setInstantTooltip(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-white">{t('ladderTitle')}</h3>
        <Legend t={t} target={ladder.target} />
      </div>
      {overallRow && (
        <div
          onMouseEnter={() => setOverallHovered(true)}
          onMouseLeave={() => setOverallHovered(false)}
          className={cn(
            'mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2.5 border-b border-white/[0.12] pb-1.5',
            COLUMNS
          )}
        >
          <span className="text-[13.5px] font-extrabold leading-[20px] text-white @[20rem]:pt-[16px] @md:text-[14px]">
            {t('ladderOverall')}
          </span>
          <LadderTrack
            t={t}
            row={overallRow}
            ladder={ladder}
            label={labelFor({ label: t('ladderOverall'), score: overallScore })}
            index={0}
            isOverall
            isRowHovered={overallHovered}
            isPointHovered={hoveredId === 'overall'}
            instantTooltip={instantTooltip}
            onPointEnter={() => {
              setInstantTooltip(hasHovered);
              setHoveredId('overall');
              setHasHovered(true);
            }}
            onPointLeave={() => {
              setHoveredId((prev) => (prev === 'overall' ? null : prev));
            }}
            reducedMotion={reducedMotion}
          />
        </div>
      )}
      <ul className="mt-2 space-y-1">
        {ladder.rows.map((row, index) => (
          <LadderRow
            key={row.id}
            t={t}
            row={row}
            ladder={ladder}
            label={labelFor(row)}
            index={index + (overallRow ? 1 : 0)}
            isPointHovered={hoveredId === row.id}
            instantTooltip={instantTooltip}
            onPointEnter={() => {
              setInstantTooltip(hasHovered);
              setHoveredId(row.id);
              setHasHovered(true);
            }}
            onPointLeave={() => {
              setHoveredId((prev) => (prev === row.id ? null : prev));
            }}
            reducedMotion={reducedMotion}
          />
        ))}
      </ul>
      <div className={cn('mt-0.5 grid grid-cols-1 gap-x-2.5', COLUMNS)} aria-hidden="true">
        <span className="hidden @[20rem]:block" />
        <span className="relative mx-2 block h-4" dir="ltr">
          {ladder.ticks.map((tick) => (
            <span
              key={tick}
              className={cn(READING, 'absolute -translate-x-1/2 text-[11px] leading-4', FAINT)}
              style={{ left: `${((tick - ladder.low) / (ladder.high - ladder.low)) * 100}%` }}
            >
              {formatBand(tick)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** What each criterion checks, the examiner's reason when saved, and how it was marked. */
function ScoreDetails({ t, criteria, marking, reducedMotion }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  if (!criteria.length && !marking) return null;

  const toggle = (event) => {
    event.preventDefault();
    if (open) {
      setExpanded(false);
      if (reducedMotion) setOpen(false);
    } else {
      setOpen(true);
      if (reducedMotion) {
        setExpanded(true);
      } else {
        requestAnimationFrame(() => setExpanded(true));
      }
    }
  };

  return (
    <details open={open} className="group mt-2.5 border-t border-white/[0.08]">
      <summary
        onClick={toggle}
        className={cn(
          'flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded py-1 text-[12px] font-bold transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1ff] [&::-webkit-details-marker]:hidden',
          SOFT
        )}
      >
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
            expanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
        {t('scoreDetails')}
      </summary>
      <div
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && !expanded) setOpen(false);
        }}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <dl className="grid gap-x-5 gap-y-2.5 pb-2 pt-1 @lg:grid-cols-2">
            {criteria.map((criterion) => (
              <div key={criterion.id}>
                <dt className="text-[12px] font-bold">
                  <bdi {...ENGLISH}>{criterion.label}</bdi>
                </dt>
                <dd className={cn('text-[12px] leading-snug', FAINT)}>{criterion.help}</dd>
                {criterion.note && (
                  <dd className="mt-0.5 text-[12.5px] leading-snug text-[#e4e5f7]">
                    {criterion.note}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          {marking && <p className={cn('pb-2 text-[11.5px]', FAINT)}>{marking}</p>}
        </div>
      </div>
    </details>
  );
}

/** The task, what kind of writing it is, and when it was marked. */
function ReportMeta({ t, taskType, markedAt }) {
  const parts = [
    taskType,
    t(taskType === 'Task 1' ? 'kindReport' : 'kindEssay'),
    reportDate(markedAt, t.language),
  ].filter(Boolean);
  return <p className={cn('mt-0.5 text-[13px]', FAINT)}>{parts.join(' · ')}</p>;
}

const MOVE_LOOK = {
  1: { icon: ArrowUp, tone: 'text-[#7fe0bb]' },
  0: { icon: Minus, tone: SOFT },
  [-1]: { icon: ArrowDown, tone: 'text-[#f0b54a]' },
};

function SinceLast({ t, task, band, previous }) {
  const move = compareWithLast(band, previous);
  if (!move) return null;
  const { icon: Icon, tone } = MOVE_LOOK[move.direction];
  return (
    <p className={cn('flex items-start gap-1.5 text-[13px] font-semibold leading-snug', tone)}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      <span>
        {t(move.key, {
          task,
          delta: move.delta,
          band: formatBand(previous.band),
          date: reportDate(previous.at, t.language),
        })}
      </span>
    </p>
  );
}

function wordsFact(t, feedback, taskType) {
  const count = Number(feedback.wordCount);
  if (!(count > 0)) return null;
  const minimum = minimumWordsFor(taskType);
  const short = Boolean(feedback.isBelowMinimumWordCount) || count < minimum;
  return {
    id: 'words',
    label: t('statWords'),
    value: count,
    note: t(short ? 'statUnder' : 'statOver', { min: minimum }),
    noteTone: short ? 'text-[#f0b54a]' : 'text-[#7fe0bb]',
  };
}

/** The grid for one, two or three facts. */
const FACT_COLUMNS = ['grid-cols-1', 'grid-cols-2', 'grid-cols-2 @sm:grid-cols-3'];

/** Length, time and the band for both tasks: only what this attempt has. */
function Facts({ t, feedback, taskType, seconds, combinedBand }) {
  const facts = [
    wordsFact(t, feedback, taskType),
    timeUsed(seconds) && { id: 'time', label: t('statTime'), value: timeUsed(seconds) },
    combinedBand && { id: 'both', label: t('statBoth'), value: formatBand(combinedBand) },
  ].filter(Boolean);
  if (!facts.length) return null;
  const cols = FACT_COLUMNS[facts.length - 1];
  return (
    <div>
      <dl className={cn('grid overflow-hidden rounded-xl border border-white/[0.12]', cols)}>
        {facts.map((fact, index) => (
          <div
            key={fact.id}
            className={cn(
              'min-w-0 border-white/[0.12] px-3 py-2.5',
              index > 0 && 'border-s',
              facts.length === 3 &&
                index === 2 &&
                'col-span-2 border-s-0 border-t @sm:col-span-1 @sm:border-s @sm:border-t-0'
            )}
          >
            <dt className={cn('text-[11.5px] leading-tight', FAINT)}>{fact.label}</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[15px] font-bold leading-tight">
              <span className={READING}>{fact.value}</span>
              {fact.note && (
                <span className={cn('text-[11.5px] font-semibold', fact.noteTone)}>
                  {fact.note}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {combinedBand && <p className={cn('mt-1.5 text-[11.5px]', FAINT)}>{t('combinedHint')}</p>}
    </div>
  );
}

/** The band, the facts about this attempt and the examiner's one-line reason. */
function Headline({ t, feedback, original, taskType, combinedBand, attempt, reducedMotion }) {
  const summary = cleanFeedbackText(bandReason(original, feedback));
  const band = formatBand(feedback.overallBand);
  return (
    <div className="flex min-w-0 flex-col gap-3 @md:gap-3.5">
      <div>
        <h2 id="writing-result-title" className={cn('text-[14px] font-bold @md:text-[15px]', SOFT)}>
          {t('resultTitle')}
        </h2>
        <ReportMeta t={t} taskType={taskType} markedAt={feedback.generatedAt} />
      </div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.28,
          delay: reducedMotion ? 0 : 0.04,
          ease: EASE_OUT,
        }}
        className="flex flex-wrap items-end gap-x-3.5 gap-y-2"
      >
        <p
          className={cn(
            TABULAR,
            'text-[56px] font-extrabold leading-[0.84] tracking-[-0.045em] text-white @md:text-[84px]'
          )}
          role="img"
          aria-label={t('bandOutOf9Aria', { band })}
        >
          {band}
        </p>
        <div className="min-w-0 flex-1 basis-40 space-y-1 pb-0.5">
          <p className="text-[13.5px] font-bold leading-tight text-white @md:text-[14px]">
            {t('taskBand', { task: taskType })}
          </p>
          <SinceLast
            t={t}
            task={taskType}
            band={feedback.overallBand}
            previous={attempt.previous}
          />
        </div>
      </motion.div>
      <Facts
        t={t}
        feedback={feedback}
        taskType={taskType}
        seconds={attempt.seconds}
        combinedBand={combinedBand}
      />
      {summary && (
        <div className="border-t border-white/[0.12] pt-3">
          <h3 className={cn('text-[13px] font-bold @md:text-[13.5px]', SOFT)}>
            {t('whyYouGot', { band })}
          </h3>
          <p className="mt-1 max-w-[58ch] text-[14px] leading-[1.55] text-[#f2f2fb] @md:text-[15px] @md:leading-[1.6]">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

const NO_ATTEMPT = {};

export function ResultSlip({
  t,
  feedback,
  taskType,
  criteria,
  targetBand,
  marking,
  combinedBand,
  attempt = NO_ATTEMPT,
  original = feedback,
}) {
  const reducedMotion = Boolean(useReducedMotion());
  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_OUT }}
      className="rounded-[20px] bg-[#17183d] px-4 pb-1.5 pt-4 text-white @md:px-6 @md:pt-5 @3xl:px-7 @3xl:pt-6"
      aria-labelledby="writing-result-title"
    >
      {/* Two columns once the report is wide enough for the chart to breathe. */}
      <div className="grid gap-5 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] @3xl:items-start @3xl:gap-10">
        <Headline
          t={t}
          feedback={feedback}
          original={original}
          taskType={taskType}
          combinedBand={combinedBand}
          attempt={attempt}
          reducedMotion={reducedMotion}
        />
        {criteria.length > 0 && (
          <div className="@container min-w-0 border-t border-white/[0.12] pt-4 @3xl:border-t-0 @3xl:pt-0">
            <BandLadder
              t={t}
              criteria={criteria}
              overallBand={feedback.overallBand}
              targetBand={targetBand}
              reducedMotion={reducedMotion}
            />
          </div>
        )}
      </div>
      <ScoreDetails t={t} criteria={criteria} marking={marking} reducedMotion={reducedMotion} />
    </motion.section>
  );
}
