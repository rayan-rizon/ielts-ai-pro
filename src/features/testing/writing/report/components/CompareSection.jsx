import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2, PenLine, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives.jsx';
import {
  countWords,
  segmentModelParagraph,
} from '../../../../../../supabase/functions/_shared/writingBandModels';
import { CRITERIA } from '../../utils/writingReportModel';
import { paragraphName } from './paragraphName';
import {
  BODY,
  ENGLISH,
  HAIRLINE,
  HEADING,
  PRIMARY_BUTTON,
  QUIET_BUTTON,
  TEXT_BUTTON,
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
        'min-w-0 rounded-xl p-3 @md:p-4',
        tone === 'model'
          ? 'border border-[#5a63df]/30 bg-[#f6f5fe] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.07]'
          : 'bg-[#f6f5fb] dark:bg-white/[0.04]'
      )}
    >
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-extrabold text-slate-900 dark:text-white">{title}</span>
        <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
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
      className="mt-2 font-serif text-[15px] leading-[1.85] text-slate-900 dark:text-slate-100"
      {...ENGLISH}
    >
      {segmentModelParagraph(paragraph.model, paragraph.notes).map((segment, index) =>
        segment.n ? (
          <mark
            key={index}
            className="rounded bg-[#5a63df]/[0.14] box-decoration-clone px-0.5 text-inherit"
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

function Notes({ t, notes, taskType, translated }) {
  return (
    <div>
      <h4 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white">
        {t('whyHigher')}
      </h4>
      {t.language !== 'en' && !translated && (
        <p className="mt-1 text-[12px] text-[rgb(var(--signal-warn))]">{t('notesEnglish')}</p>
      )}
      <ol className="mt-2 grid gap-2 @2xl:grid-cols-2">
        {notes.map((note) => (
          <li
            key={note.n}
            className="flex gap-2.5 rounded-lg bg-[#f4f3fb] p-3 dark:bg-white/[0.06]"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#5a63df] font-mono text-[11px] font-bold text-white">
              {note.n}
            </span>
            <span className="min-w-0">
              <bdi
                className="block text-[12.5px] font-bold text-slate-900 dark:text-white"
                {...ENGLISH}
              >
                {criterionName(note.criterion, taskType)}
              </bdi>
              <span
                className="block text-[13px] leading-snug text-slate-700 dark:text-slate-200"
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

function Request({ t, band, entry, onLoad }) {
  if (entry?.status === 'loading')
    return (
      <p
        className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300"
        role="status"
      >
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {t('writingBand', { band })}
      </p>
    );
  if (entry?.status === 'failed')
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-800 dark:text-slate-100"
      >
        <span>{t(ERROR_TEXT[entry.code] || 'compareFailed')}</span>
        <button type="button" className={QUIET_BUTTON} onClick={() => onLoad(band)}>
          {t('tryAgain')}
        </button>
      </div>
    );
  return (
    <button type="button" className={PRIMARY_BUTTON} onClick={() => onLoad(band)}>
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {t('showBand', { band })}
    </button>
  );
}

function Controls({
  t,
  paragraphs,
  essayMap,
  position,
  onPositionChange,
  bands,
  band,
  onBandChange,
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 border-t pt-3', HAIRLINE)}>
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
          options={bands.map((value) => ({ value, label: `Band ${value}` }))}
        />
      )}
    </div>
  );
}

/** The reasons, the warning against copying and a way back to the draft. */
function Reasons({ t, rewritten, taskType, translated, onRevise }) {
  return (
    <>
      <Notes t={t} notes={rewritten.notes} taskType={taskType} translated={translated} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {onRevise && (
          <button type="button" className={TEXT_BUTTON} onClick={onRevise}>
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            {t('reviseAnswer')}
          </button>
        )}
        <p className="text-[12.5px] text-slate-600 dark:text-slate-300">{t('studyPattern')}</p>
      </div>
    </>
  );
}

const rewrittenFor = (entry, paragraph) =>
  entry?.data?.paragraphs.find((item) => item.index === paragraph.index);

/** One paragraph at one band: the learner's text beside the stronger version. */
function Pair({
  t,
  taskType,
  paragraph,
  segments,
  band,
  models,
  onRevise,
  direction,
  reducedMotion,
}) {
  const entry = models.entry(band);
  const rewritten = rewrittenFor(entry, paragraph);
  return (
    // A new paragraph or band eases in directionally; nothing waits for the old one.
    <motion.div
      initial={
        reducedMotion ? false : { opacity: 0, x: direction * 14, y: direction === 0 ? 4 : 0 }
      }
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-3"
    >
      <div className={cn('grid gap-3', rewritten && '@2xl:grid-cols-2')}>
        <Column t={t} title={t('yourParagraph')} words={countWords(paragraph.text)}>
          <MarkedText segments={segments} className="mt-2 text-[15px]" />
        </Column>
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
      {rewritten ? (
        <Reasons
          t={t}
          rewritten={rewritten}
          taskType={taskType}
          translated={entry.data.notesTranslated}
          onRevise={onRevise}
        />
      ) : (
        <Request t={t} band={band} entry={entry} onLoad={models.load} />
      )}
    </motion.div>
  );
}

const markedPieces = (marked, paragraph) =>
  marked[paragraph.index] || [{ text: paragraph.text, kind: null }];

export function CompareSection({ t, paragraphs, bands, position, ...rest }) {
  const [band, setBand] = useState(bands[0]);
  const chosen = Math.min(position, paragraphs.length - 1);
  const selected = paragraphs[chosen];
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
    <section
      className={cn(PANEL, '@container scroll-mt-3 space-y-3 p-4')}
      aria-labelledby="writing-compare-title"
    >
      <div>
        <h2 id="writing-compare-title" className={HEADING}>
          {t('compareTitle')}
        </h2>
        <p className={cn('mt-0.5', BODY)}>{t(selected ? 'compareIntro' : 'needParagraphs')}</p>
      </div>
      {selected && (
        <>
          <Controls
            t={t}
            paragraphs={paragraphs}
            essayMap={rest.essayMap}
            position={chosen}
            onPositionChange={rest.onPositionChange}
            bands={bands}
            band={band}
            onBandChange={setBand}
          />
          <Pair
            key={`${selected.index}-${band}`}
            t={t}
            taskType={rest.taskType}
            paragraph={selected}
            segments={markedPieces(rest.marked, selected)}
            band={band}
            models={rest.models}
            onRevise={rest.onRevise}
            direction={nav.dir}
            reducedMotion={reducedMotion}
          />
        </>
      )}
    </section>
  );
}
