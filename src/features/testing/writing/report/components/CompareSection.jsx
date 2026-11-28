import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  countWords,
  segmentModelParagraph,
} from '../../../../../../supabase/functions/_shared/writingBandModels';
import { CRITERIA } from '../../utils/writingReportModel';
import { bandGoal } from '../bandGoals';
import { paragraphName } from './paragraphName';
import {
  BODY,
  ENGLISH,
  ESSAY_FONT,
  HAIRLINE,
  HEADING,
  MUTED_TEXT,
  PRIMARY_BUTTON,
  QUIET_BUTTON,
} from './reportStyles';
import { Segmented } from './reportUi';
import { MarkedText } from './MarkedText';

const MODEL_CRITERION = { task: 0, coherence: 1, vocabulary: 2, grammar: 3 };

const criterionName = (id, taskType) => {
  const { label } = CRITERIA[MODEL_CRITERION[id]];
  return typeof label === 'object' ? label[taskType] : label;
};

const ERROR_TEXT = { rate_limited: 'rateLimited', no_comparable_paragraph: 'needParagraphs' };

function Column({ title, words, t, children, tone }) {
  return (
    <figure
      className={cn(
        // The learner's side is a quiet well; only the stronger version is outlined.
        'min-w-0 rounded-xl p-4 @2xl:p-5',
        tone === 'model'
          ? 'border-[1.5px] border-[#c9ccf3] bg-white dark:border-[#8f97ff]/35 dark:bg-transparent'
          : 'bg-[#f4f3fb] dark:bg-white/[0.04]'
      )}
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span
          className={cn(
            'text-[13px] font-extrabold',
            tone === 'model'
              ? 'text-[#4b53c9] dark:text-[#c3c7ff]'
              : 'text-[#12142b] dark:text-white'
          )}
        >
          {title}
        </span>
        <span className={cn('font-mono text-[12px]', MUTED_TEXT)}>
          {t('wordsCount', { count: words })}
        </span>
      </figcaption>
      {children}
    </figure>
  );
}

function ModelText({ paragraph }) {
  return (
    <p
      className={cn(
        ESSAY_FONT,
        'mt-2.5 text-[16px] leading-[1.9] text-[#1d2138] @2xl:text-[17px] dark:text-slate-100'
      )}
      {...ENGLISH}
    >
      {segmentModelParagraph(paragraph.model, paragraph.notes).map((segment, index) =>
        segment.n ? (
          <mark
            key={index}
            className="rounded bg-[#5a63df]/[0.13] box-decoration-clone px-0.5 py-px text-inherit dark:bg-[#8f97ff]/20"
          >
            {segment.text}
            <sup className="ms-0.5 font-mono text-[10px] font-bold text-[#4b53c9] dark:text-[#c3c7ff]">
              {segment.n}
            </sup>
          </mark>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      )}
    </p>
  );
}

function Notes({ t, band, notes, taskType, translated }) {
  return (
    <div>
      <h4 className="text-[14px] font-extrabold text-[#3a41ad] dark:text-[#c3c7ff]">
        {t('whatMakes', { band })}
      </h4>
      {t.language !== 'en' && !translated && (
        <p className="mt-1 text-[12px] text-[rgb(var(--signal-warn))]">{t('notesEnglish')}</p>
      )}
      <ol className="mt-2.5 grid gap-x-6 gap-y-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        {notes.map((note) => (
          <li key={note.n} className="flex items-baseline gap-2.5">
            <span className="w-3 shrink-0 font-mono text-[11px] font-bold text-[#4b53c9] dark:text-[#c3c7ff]">
              {note.n}
            </span>
            <span className="min-w-0">
              <bdi
                className="block text-[12.5px] font-extrabold text-[#1d2138] dark:text-white"
                {...ENGLISH}
              >
                {criterionName(note.criterion, taskType)}
              </bdi>
              <span
                className="block text-[14px] leading-[1.55] text-[#2a2f47] dark:text-slate-200"
                {...(translated || t.language === 'en' ? {} : ENGLISH)}
              >
                {note.why}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Line lengths of the paragraph that is on its way. */
const WAITING_LINES = ['w-full', 'w-[94%]', 'w-full', 'w-[88%]', 'w-[97%]', 'w-[62%]'];

/** The stronger version's place while it is written, or why it could not be. */
function Pending({ t, band, entry, onRetry }) {
  if (entry?.status === 'failed')
    return (
      <div
        role="alert"
        className="flex flex-wrap content-center items-center justify-center gap-x-3 gap-y-1 rounded-xl border-[1.5px] border-[#c9ccf3] p-5 text-center text-[13px] text-slate-800 dark:border-[#8f97ff]/35 dark:text-slate-100"
      >
        <span>{t(ERROR_TEXT[entry.code] || 'compareFailed')}</span>
        <button type="button" className={QUIET_BUTTON} onClick={() => onRetry(band)}>
          {t('tryAgain')}
        </button>
      </div>
    );
  return (
    <div className="rounded-xl border-[1.5px] border-[#c9ccf3] p-4 dark:border-[#8f97ff]/35">
      <p
        className="flex items-center gap-2 text-[13px] font-semibold text-[#3a41ad] dark:text-[#c3c7ff]"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t('writingBand', { band })}
      </p>
      <div className="mt-4 space-y-3.5" aria-hidden="true">
        {WAITING_LINES.map((width, line) => (
          <div
            key={line}
            className={cn(
              'h-2.5 animate-pulse rounded-full bg-[#ecedf9] motion-reduce:animate-none dark:bg-white/[0.07]',
              width
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** The learner's own target is named as theirs; otherwise the one to aim at next. */
function bandLabel(t, band, goal, target) {
  if (band === Number(target)) return t('bandYourTarget', { band });
  return band === goal ? t('bandTarget', { band }) : `Band ${band}`;
}

/**
 * The band on show: the learner's choice, else the one they are aiming at. Its
 * paragraph is fetched as soon as it is on show; a failure waits for a tap.
 */
function useShownBand({ bands, overallBand, target, paragraph, models }) {
  const [chosen, setChosen] = useState(null);
  const aim = bandGoal(overallBand, target);
  const goal = bands.includes(aim) ? aim : bands[0];
  const band = chosen ?? goal;
  const { load } = models;
  const missing = Boolean(paragraph) && !models.entry(band);
  useEffect(() => {
    if (missing) load(band);
  }, [missing, band, load]);
  return { band, goal, setBand: setChosen };
}

function Controls({
  t,
  paragraphs,
  essayMap,
  position,
  onPositionChange,
  bands,
  band,
  goal,
  target,
  onBandChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {paragraphs.length > 1 && (
        <Segmented
          label={t('yourParagraph')}
          value={position}
          onChange={onPositionChange}
          options={paragraphs.map((paragraph, index) => ({
            value: index,
            label: paragraphName(t, essayMap[paragraph.index]),
          }))}
        />
      )}
      {bands.length > 1 && (
        <Segmented
          label={t('compareWith')}
          value={band}
          onChange={onBandChange}
          options={bands.map((value) => ({
            value,
            label: bandLabel(t, value, goal, target),
          }))}
        />
      )}
    </div>
  );
}

/** The reasons, then the way back to the draft and the warning against copying. */
function Reasons({ t, band, rewritten, taskType, translated }) {
  return (
    <Notes t={t} band={band} notes={rewritten.notes} taskType={taskType} translated={translated} />
  );
}

function RewriteFooter({ t, onRevise }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-[18px]', HAIRLINE)}>
      {onRevise && (
        <button type="button" className={PRIMARY_BUTTON} onClick={onRevise}>
          <PenLine className="h-4 w-4" aria-hidden="true" />
          {t('rewriteSelf')}
        </button>
      )}
      <p className={cn('min-w-0 flex-[1_1_16rem] text-[13px]', MUTED_TEXT)}>{t('studyPattern')}</p>
    </div>
  );
}

const rewrittenFor = (entry, paragraph) =>
  entry?.data?.paragraphs.find((item) => item.index === paragraph.index);

/** One paragraph at one band: the learner's text beside the stronger version. */
const Pair = React.forwardRef(function Pair(
  { t, taskType, paragraph, segments, band, models, direction, reducedMotion },
  ref
) {
  const entry = models.entry(band);
  const rewritten = rewrittenFor(entry, paragraph);
  return (
    // A new paragraph or band eases in directionally; nothing waits for the old one.
    <motion.div
      ref={ref}
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              x: direction * 12,
              y: direction === 0 ? 4 : 0,
              filter: 'blur(1.5px)',
            }
      }
      animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      exit={
        reducedMotion
          ? undefined
          : {
              opacity: 0,
              x: -direction * 8,
              filter: 'blur(1px)',
              transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
            }
      }
      transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <div className="grid gap-3 @2xl:grid-cols-2">
        <Column t={t} title={t('yourParagraph')} words={countWords(paragraph.text)}>
          <MarkedText segments={segments} className="mt-2.5 text-[16px] @2xl:text-[17px]" />
        </Column>
        {!rewritten && <Pending t={t} band={band} entry={entry} onRetry={models.retry} />}
        {rewritten && (
          <Column
            t={t}
            tone="model"
            title={t('bandVersion', { band })}
            words={countWords(rewritten.model)}
          >
            <ModelText paragraph={rewritten} />
          </Column>
        )}
      </div>
      {rewritten && (
        <Reasons
          t={t}
          band={band}
          rewritten={rewritten}
          taskType={taskType}
          translated={entry.data.notesTranslated}
        />
      )}
    </motion.div>
  );
});

const markedPieces = (marked, paragraph) =>
  marked[paragraph.index] || [{ text: paragraph.text, kind: null }];

export function CompareSection({ t, paragraphs, bands, position, ...rest }) {
  const chosen = Math.min(position, paragraphs.length - 1);
  const selected = paragraphs[chosen];
  const { band, goal, setBand } = useShownBand({
    bands,
    overallBand: rest.overallBand,
    target: rest.target,
    paragraph: selected,
    models: rest.models,
  });
  const reducedMotion = Boolean(useReducedMotion());
  const [nav, setNav] = useState({ pos: chosen, band, dir: 0 });
  if (nav.pos !== chosen || nav.band !== band) {
    const dir =
      nav.pos !== chosen
        ? chosen > nav.pos
          ? 1
          : -1
        : bands.indexOf(band) > bands.indexOf(nav.band)
          ? 1
          : -1;
    setNav({ pos: chosen, band, dir });
  }

  return (
    <section className="scroll-mt-3 space-y-3.5" aria-labelledby="writing-compare-title">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <h3 id="writing-compare-title" className={cn(HEADING, 'min-w-0 flex-[1_1_17rem]')}>
          {t('compareTitle')}
        </h3>
        {selected && (
          <Controls
            t={t}
            paragraphs={paragraphs}
            essayMap={rest.essayMap}
            position={chosen}
            onPositionChange={rest.onPositionChange}
            bands={bands}
            band={band}
            goal={goal}
            target={rest.target}
            onBandChange={setBand}
          />
        )}
      </div>
      {!selected && <p className={BODY}>{t('needParagraphs')}</p>}
      {selected && (
        <div className="relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <Pair
              key={`${selected.index}-${band}`}
              t={t}
              taskType={rest.taskType}
              paragraph={selected}
              segments={markedPieces(rest.marked, selected)}
              band={band}
              models={rest.models}
              direction={nav.dir}
              reducedMotion={reducedMotion}
            />
          </AnimatePresence>
        </div>
      )}
      <RewriteFooter t={t} onRevise={rest.onRevise} />
    </section>
  );
}
