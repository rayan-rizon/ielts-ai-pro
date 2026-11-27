import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { cleanFeedbackText } from '../../utils/feedbackFormatting';
import { minimumWordsFor } from '../../utils/writingReportModel';
import { buildLadder } from '../reportViewModel';
import { ENGLISH, formatBand } from './reportStyles';

const SOFT = 'text-[#c9ccf3]';
const FAINT = 'text-[#9aa0d4]';
// Label and track sit side-by-side as soon as the chart column is at least 21rem wide.
const COLUMNS = '@[21rem]:grid-cols-[minmax(0,11.25rem)_minmax(0,1fr)]';
const TRACK_COL = 'col-span-2 @[21rem]:col-span-1';
const TABULAR = 'tabular-nums tracking-tight';
const EASE_OUT = [0.23, 1, 0.32, 1];

function Legend({ t, target }) {
  return (
    <div className={cn('flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px]', SOFT)} aria-hidden="true">
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

const connectorToneClass = (row, isHovered) => {
  if (row.isLowest) {
    return isHovered
      ? 'bg-gradient-to-r from-[#f0b54a] to-[#9aa1ff]'
      : 'bg-gradient-to-r from-[#f0b54a]/85 to-[#9aa1ff]/75';
  }
  return isHovered
    ? 'bg-gradient-to-r from-white to-[#9aa1ff]'
    : 'bg-gradient-to-r from-white/75 to-[#9aa1ff]/70';
};

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
    <span className={cn('relative mx-2 block pt-3.5', TRACK_COL)} dir="ltr">
      {/* Score value sits right above its dot, matching the reference chart. */}
      <motion.span
        aria-hidden="true"
        initial={reducedMotion ? false : { left: '0%', opacity: 0 }}
        animate={{ left: `${row.at}%`, opacity: isPointHovered ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.4, delay: rowDelay, ease: EASE_OUT }}
        className={cn(
          TABULAR,
          'pointer-events-none absolute top-0 -translate-x-1/2 text-[11.5px] font-bold leading-none transition-opacity duration-100',
          rowTone(row)
        )}
      >
        {formatBand(row.score)}
      </motion.span>
      <span className="relative block h-5" role="img" aria-label={label}>
        <span
          className={cn(
            'absolute inset-x-0 top-1/2 -mt-px h-px transition-colors duration-150',
            isRowHovered || isPointHovered ? 'bg-white/25' : 'bg-white/12'
          )}
        />
        {ladder.targetAt !== null && (
          <span
            className="absolute inset-y-0 border-l border-[#9aa1ff]/25"
            style={at(ladder.targetAt)}
          />
        )}
        {/* Full height, so the rows form one continuous Band 8 guide. */}
        <span
          className="absolute inset-y-0 border-l-2 border-dashed border-[#f0b54a]/50"
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
                'absolute top-1/2 -mt-[1.25px] h-[2.5px] rounded-full transition-opacity duration-150',
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
                'absolute top-1/2 -ml-[7px] -mt-[7px] h-3.5 w-3.5 rounded-full border-2 border-[#9aa1ff] bg-[#141536] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
                isPointHovered && 'scale-115 bg-[#202255]'
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
              'rounded-full transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
              isOverall ? 'h-3.5 w-3.5' : 'h-3 w-3',
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
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-1.5 py-0.5 transition-colors duration-150 @[21rem]:-mx-1.5',
        isRowHovered && 'bg-white/[0.03]',
        COLUMNS
      )}
    >
      <span className="min-w-0 self-end pb-0.5">
        <bdi className="block text-[12px] font-medium leading-4 text-[#e4e5f7]" {...ENGLISH}>
          {row.label}
        </bdi>
        {status && (
          <span className={cn('block text-[10.5px] font-semibold leading-[13px]', rowTone(row))}>
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
        <h3 className="text-[14px] font-bold tracking-[-0.01em] text-white">{t('ladderTitle')}</h3>
        <Legend t={t} target={ladder.target} />
      </div>
      {overallRow && (
        <div
          onMouseEnter={() => setOverallHovered(true)}
          onMouseLeave={() => setOverallHovered(false)}
          className={cn(
            'mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 border-b border-white/[0.08] pb-1.5',
            COLUMNS
          )}
        >
          <span className="self-end pb-0.5 text-[12.5px] font-bold text-white">
            {t('bandLabel')}
          </span>
          <LadderTrack
            t={t}
            row={overallRow}
            ladder={ladder}
            label={labelFor({ label: t('bandLabel'), score: overallScore })}
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
      <ul className="mt-1 space-y-0.5">
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
        <span className="hidden @[21rem]:block" />
        <span className="relative mx-2 block h-4" dir="ltr">
          {ladder.ticks.map((tick) => (
            <span
              key={tick}
              className={cn(TABULAR, 'absolute -translate-x-1/2 text-[10.5px] leading-4', FAINT)}
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

function WordCount({ t, feedback, taskType }) {
  const count = Number(feedback.wordCount);
  if (!Number.isFinite(count) || count <= 0) return null;
  const minimum = minimumWordsFor(taskType);
  const short = Boolean(feedback.isBelowMinimumWordCount) || count < minimum;
  return (
    <p className={cn('mt-0.5 text-[12px]', FAINT)}>
      <span>{t('wordsCount', { count })}</span>
      <span className="mx-1.5 text-white/30" aria-hidden="true">
        ·
      </span>
      <span className={cn('font-semibold', short ? 'text-[#f0b54a]' : 'text-[#7fe0bb]')}>
        {t(short ? 'wordsUnder' : 'wordsOk', { min: minimum })}
      </span>
    </p>
  );
}

/** The band beside what it means: task, length and the examiner's one-line reason. */
function Headline({ t, feedback, taskType, combinedBand, reducedMotion }) {
  const summary = cleanFeedbackText(feedback.summary);
  const band = formatBand(feedback.overallBand);
  return (
    <div className="min-w-0">
      <div>
        <h2
          id="writing-result-title"
          className="text-[15px] font-bold tracking-[-0.01em] text-white"
        >
          {t('resultHeading', { task: taskType })}
        </h2>
        <WordCount t={t} feedback={feedback} taskType={taskType} />
      </div>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.28,
          delay: reducedMotion ? 0 : 0.04,
          ease: EASE_OUT,
        }}
        className="mt-3 flex items-center gap-3.5"
      >
        <p
          className={cn(
            TABULAR,
            'text-[52px] font-extrabold leading-[0.9] tracking-[-0.04em] text-white @md:text-[58px]'
          )}
          role="img"
          aria-label={t('bandOutOf9Aria', { band })}
        >
          {band}
        </p>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold leading-tight text-white" aria-hidden="true">
            {t('bandLabel')}
          </p>
          <p
            className={cn('mt-0.5 text-[11.5px] font-medium leading-tight', FAINT)}
            aria-hidden="true"
          >
            {t('outOf9')}
          </p>
          {combinedBand && (
            <p className="mt-1 text-[11.5px] leading-snug">
              <span className={FAINT}>{t('combinedBand')}:</span>{' '}
              <span className={cn(TABULAR, 'font-bold text-[#7fe0bb]')}>
                {formatBand(combinedBand)}
              </span>
            </p>
          )}
        </div>
      </motion.div>
      {combinedBand && <p className={cn('mt-1.5 text-[11px]', FAINT)}>{t('combinedHint')}</p>}
      {summary && (
        <div className="mt-3 border-t border-white/[0.09] pt-2.5">
          <h3 className="text-[12.5px] font-bold text-white">{t('whyYouGot', { band })}</h3>
          <p className="mt-1 text-[13px] leading-[1.48] text-[#c9ccf3]">{summary}</p>
        </div>
      )}
    </div>
  );
}

export function ResultSlip({ t, feedback, taskType, criteria, targetBand, marking, combinedBand }) {
  const reducedMotion = Boolean(useReducedMotion());
  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_OUT }}
      className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#16173e] to-[#111231] px-4 pb-1 pt-4 text-white @md:px-5 @md:pt-4"
      aria-labelledby="writing-result-title"
    >
      {/* Two columns on desktop split-view (@2xl+) matching the speaking result layout. */}
      <div className="grid gap-4 @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)] @2xl:items-start @2xl:gap-6">
        <Headline
          t={t}
          feedback={feedback}
          taskType={taskType}
          combinedBand={combinedBand}
          reducedMotion={reducedMotion}
        />
        {criteria.length > 0 && (
          <div className="@container min-w-0 border-t border-white/[0.08] pt-3.5 @2xl:border-t-0 @2xl:pt-0">
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
