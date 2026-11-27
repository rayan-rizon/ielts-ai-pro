import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives.jsx';
import { cleanFeedbackText } from '../../utils/feedbackFormatting';
import { minimumWordsFor } from '../../utils/writingReportModel';
import { buildLadder } from '../reportViewModel';
import { ENGLISH, formatBand } from './reportStyles';

const SOFT = 'text-[#c9ccf3]';
const FAINT = 'text-[#a9addb]';
// Label, track and score line up in three columns once the card is wide enough.
const COLUMNS = '@md:grid-cols-[minmax(0,14.5rem)_minmax(0,1fr)_2.25rem]';

function Legend({ t, hasTarget }) {
  return (
    <div className={cn('flex flex-wrap gap-x-3 gap-y-1 text-[11px]', SOFT)} aria-hidden="true">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
        {t('legendYou')}
      </span>
      {hasTarget && (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[#9aa1ff]" />
          {t('legendTarget')}
        </span>
      )}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 border-l-2 border-dashed border-[#f0b54a]" />
        {t('legendBand8')}
      </span>
    </div>
  );
}

/** One criterion on the shared scale. The track is a number line, so always left to right. */
function LadderTrack({ row, ladder, label }) {
  const at = (value) => ({ left: `${value}%` });
  return (
    <span
      className="relative col-span-2 mx-2 block h-4 @md:col-span-1 @md:h-9"
      role="img"
      aria-label={label}
      dir="ltr"
    >
      <span className="absolute inset-x-0 top-1/2 -mt-px h-0.5 rounded bg-white/10" />
      {/* Full height, so the rows form one continuous Band 8 guide. */}
      <span
        className="absolute inset-y-0 border-l-2 border-dashed border-[#f0b54a]/55"
        style={at(ladder.eightAt)}
      />
      {ladder.targetAt !== null && (
        <>
          <span
            className="absolute top-1/2 -mt-px h-0.5 bg-[#9aa1ff]/60"
            style={{
              left: `${Math.min(row.at, ladder.targetAt)}%`,
              width: `${Math.abs(ladder.targetAt - row.at)}%`,
            }}
          />
          <span
            className="absolute top-1/2 -ml-[7px] -mt-[7px] h-3.5 w-3.5 rounded-full border-2 border-[#9aa1ff]"
            style={at(ladder.targetAt)}
          />
        </>
      )}
      <span
        className={cn(
          'absolute top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full ring-2 ring-[#17183d]',
          row.isLowest ? 'bg-[#f0b54a]' : row.atTarget ? 'bg-[#7fe0bb]' : 'bg-white'
        )}
        style={at(row.at)}
      />
    </span>
  );
}

const rowStatus = (row) => (row.isLowest ? 'lowestArea' : row.atTarget ? 'atTarget' : null);
const rowTone = (row) =>
  row.isLowest ? 'text-[#f0b54a]' : row.atTarget ? 'text-[#7fe0bb]' : 'text-white';

function LadderRow({ t, row, ladder, label }) {
  const status = rowStatus(row);
  return (
    <li
      data-criterion={row.id}
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-0.5 @md:py-0',
        COLUMNS
      )}
    >
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 @md:block">
        <bdi className="text-[12.5px] font-bold leading-4 @md:block" {...ENGLISH}>
          {row.label}
        </bdi>
        {status && (
          <span className={cn('text-[10.5px] font-bold leading-[14px] @md:block', rowTone(row))}>
            {t(status)}
          </span>
        )}
      </span>
      {/* Beside the label on phones; the last column once there is room. */}
      <span className={cn(NUM, 'text-end text-[13.5px] font-extrabold @md:order-1', rowTone(row))}>
        {formatBand(row.score)}
      </span>
      <LadderTrack row={row} ladder={ladder} label={label} />
    </li>
  );
}

function BandLadder({ t, criteria, targetBand }) {
  const ladder = buildLadder(criteria, targetBand);
  const labelFor = (row) =>
    t(ladder.target === null ? 'ladderAria' : 'ladderAriaTarget', {
      criterion: row.label,
      score: formatBand(row.score),
      target: formatBand(ladder.target),
    });
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="text-[12.5px] font-bold">{t('ladderTitle')}</h3>
        <Legend t={t} hasTarget={ladder.target !== null} />
      </div>
      <ul className="mt-1.5">
        {ladder.rows.map((row) => (
          <LadderRow key={row.id} t={t} row={row} ladder={ladder} label={labelFor(row)} />
        ))}
      </ul>
      <div className={cn('grid grid-cols-1 gap-x-2', COLUMNS)} aria-hidden="true">
        <span className="hidden @md:block" />
        <span className="relative mx-2 block h-3.5" dir="ltr">
          {ladder.ticks.map((tick) => (
            <span
              key={tick}
              className={cn(NUM, 'absolute -translate-x-1/2 text-[10px] leading-[14px]', FAINT)}
              style={{ left: `${((tick - ladder.low) / (ladder.high - ladder.low)) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** What each criterion checks, the examiner's reason when saved, and how it was marked. */
function ScoreDetails({ t, criteria, marking }) {
  if (!criteria.length && !marking) return null;
  return (
    <details className="group mt-2 border-t border-white/[0.12]">
      <summary
        className={cn(
          'flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded text-[12px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1ff] [&::-webkit-details-marker]:hidden',
          SOFT
        )}
      >
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 ease-out group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
        {t('scoreDetails')}
      </summary>
      <dl className="grid gap-x-5 gap-y-2.5 pb-1 @lg:grid-cols-2">
        {criteria.map((criterion) => (
          <div key={criterion.id}>
            <dt className="text-[12px] font-bold">
              <bdi {...ENGLISH}>{criterion.label}</bdi>
            </dt>
            <dd className={cn('text-[12px] leading-snug', FAINT)}>{criterion.help}</dd>
            {criterion.note && (
              <dd className="mt-0.5 text-[12.5px] leading-snug text-[#e4e5f7]">{criterion.note}</dd>
            )}
          </div>
        ))}
      </dl>
      {marking && <p className={cn('mt-1 text-[11.5px]', FAINT)}>{marking}</p>}
    </details>
  );
}

function WordCount({ t, feedback, taskType }) {
  const count = Number(feedback.wordCount);
  if (!Number.isFinite(count) || count <= 0) return null;
  const minimum = minimumWordsFor(taskType);
  const short = Boolean(feedback.isBelowMinimumWordCount) || count < minimum;
  return (
    <p className="text-[11.5px] font-semibold">
      <span>{t('wordsCount', { count })}</span>{' '}
      <span className={short ? 'text-[#f0b54a]' : 'text-[#7fe0bb]'}>
        {t(short ? 'wordsUnder' : 'wordsOk', { min: minimum })}
      </span>
    </p>
  );
}

/** The band beside what it means: task, length and the examiner's one-line reason. */
function Headline({ t, feedback, taskType, combinedBand }) {
  const summary = cleanFeedbackText(feedback.summary);
  const band = formatBand(feedback.overallBand);
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-3">
        <div
          className={cn(
            'self-start rounded-xl bg-white/[0.07] px-2.5 py-2 text-center',
            summary && '@md:row-span-2'
          )}
        >
          <p
            className={cn(NUM, 'text-[34px] font-extrabold leading-none @md:text-[42px]')}
            role="img"
            aria-label={t('bandOutOf9Aria', { band })}
          >
            {band}
          </p>
          <p className={cn('mt-0.5 text-[10.5px] font-semibold', FAINT)} aria-hidden="true">
            {t('outOf9')}
          </p>
        </div>
        <div className="min-w-0 self-center @md:flex @md:flex-wrap @md:items-baseline @md:gap-x-2 @md:self-start">
          <h2 id="writing-result-title" className="text-[14px] font-extrabold">
            {t('resultHeading', { task: taskType })}
          </h2>
          <WordCount t={t} feedback={feedback} taskType={taskType} />
        </div>
        {/* Full width on phones: beside the band it would wrap to twice as many lines. */}
        {summary && (
          <div className="col-span-2 mt-2 min-w-0 @md:col-span-1 @md:col-start-2 @md:mt-1">
            <h3 className={cn('text-[11.5px] font-bold', SOFT)}>{t('whyYouGot', { band })}</h3>
            <p className="text-[13.5px] leading-snug text-[#f2f2fb]">{summary}</p>
          </div>
        )}
      </div>
      {combinedBand && (
        <p className="mt-2 text-[12px] leading-snug">
          <span className="font-bold">{t('combinedBand')}:</span>{' '}
          <span className={cn(NUM, 'font-extrabold')}>{formatBand(combinedBand)}</span>{' '}
          <span className={cn('text-[11px]', FAINT)}>{t('combinedHint')}</span>
        </p>
      )}
    </div>
  );
}

export function ResultSlip({ t, feedback, taskType, criteria, targetBand, marking, combinedBand }) {
  return (
    <section
      className="rounded-2xl bg-[#17183d] px-3.5 pb-1 pt-3.5 text-white @md:px-4 @md:pt-4 dark:border dark:border-white/10"
      aria-labelledby="writing-result-title"
    >
      {/* Two columns only when each still has room for its longest line. */}
      <div className="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @4xl:items-center @4xl:gap-6">
        <Headline t={t} feedback={feedback} taskType={taskType} combinedBand={combinedBand} />
        {criteria.length > 0 && (
          <div className="@container min-w-0 border-t border-white/[0.12] pt-2.5 @4xl:border-s @4xl:border-t-0 @4xl:ps-5 @4xl:pt-0">
            <BandLadder t={t} criteria={criteria} targetBand={targetBand} />
          </div>
        )}
      </div>
      <ScoreDetails t={t} criteria={criteria} marking={marking} />
    </section>
  );
}
