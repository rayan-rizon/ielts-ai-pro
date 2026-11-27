import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookmarkPlus, Check, Loader2, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives.jsx';
import AskAiCoachButton from '@/features/ai-coach/components/AskAiCoachButton';
import {
  normalizeVocabularyTerm,
  useWritingVocabularySave,
} from '../../hooks/useWritingVocabularySave';
import { drillText } from '../drillText';
import { DRILL_MINUTES } from '../planAdditions';
import { AddToPlan } from './AddToPlan';
import { BODY, ENGLISH, HEADING, PRIMARY_BUTTON, QUIET_BUTTON } from './reportStyles';

/** The marker's stronger words, each one saveable to the learner's list. */
function WordSwaps({ t, words, source, saver }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {words.map((entry) => {
        const word = entry.alternatives[0];
        const key = normalizeVocabularyTerm(word);
        const saved = saver.savedVocabularyTerms.has(key);
        const saving = saver.savingVocabularyTerms.has(key);
        const context = source.find((item) => item?.original === entry.original)?.context;
        return (
          <li
            key={entry.original}
            // The phrase gets the full width on phones; Save sits under it.
            className="grid items-center gap-x-3 rounded-lg bg-[#f7f6fd] py-1.5 pe-1.5 ps-3 @md:grid-cols-[minmax(0,1fr)_auto] dark:bg-white/[0.04]"
          >
            <span
              className="min-w-0 font-serif text-[13.5px] leading-snug text-slate-800 [overflow-wrap:anywhere] dark:text-slate-100"
              {...ENGLISH}
            >
              <span className="text-slate-500 dark:text-slate-400">{entry.original}</span>
              {' → '}
              <span className="font-semibold">{entry.alternatives.join(' / ')}</span>
            </span>
            <button
              type="button"
              aria-label={`${t(saved ? 'savedWord' : 'saveWord')} ${word}`}
              disabled={saved || saving}
              onClick={() =>
                saver.onSaveVocabularyWord({ word, original: entry.original, context })
              }
              className="inline-flex min-h-9 items-center gap-1 justify-self-end rounded-md px-2 text-[12px] font-bold text-[#4b53c9] cursor-pointer transition-[background-color,scale] duration-150 hover:bg-[#5a63df]/10 active:scale-[0.97] disabled:cursor-default disabled:text-[rgb(var(--signal-ok))] dark:text-[#afb5ff]"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : saved ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {t(saved ? 'savedWord' : 'saveWord')}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DrillAction({ t, drill, text, onRevise, onCompare }) {
  if (drill.id === 'rewrite') {
    if (!drill.action) return null;
    const revise = drill.action === 'revise';
    return (
      <button
        type="button"
        className={QUIET_BUTTON}
        onClick={() => (revise ? onRevise() : onCompare(drill.paragraph.index))}
      >
        {revise && <PenLine className="h-3.5 w-3.5" aria-hidden="true" />}
        {t(revise ? 'drillRewriteStart' : 'drillRewriteCompare')}
      </button>
    );
  }
  if (!drill.to || !text.link) return null;
  return (
    <Link to={drill.to} className={QUIET_BUTTON}>
      {text.link}
      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}

/**
 * How the report ends: up to three drills taken from this essay, most useful
 * first (hence numbered), then what to do next.
 */
export function PracticeNext({
  t,
  drills,
  vocabularySource,
  user,
  coachSession,
  onRevise,
  onCompare,
  sessionId,
  taskType,
}) {
  const saver = useWritingVocabularySave(user);
  return (
    <section
      className="@container rounded-xl border border-[#d8d9f7] bg-[#f3f2fd] p-4 dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/[0.06]"
      aria-labelledby="writing-practise-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div>
          <h2 id="writing-practise-title" className={HEADING}>
            {t('practiseTitle')}
          </h2>
          {drills.length > 0 && <p className={cn('mt-0.5', BODY)}>{t('practiseSub')}</p>}
        </div>
        <AddToPlan t={t} drills={drills} sessionId={sessionId} taskType={taskType} />
      </div>
      {drills.length > 0 && (
        <>
          <ol className="mt-3 space-y-2">
            {drills.map((drill, index) => {
              const text = drillText(t, drill);
              return (
                <li
                  key={drill.id}
                  className="rounded-lg bg-white p-3 ring-1 ring-[#e4e2f0] dark:bg-[#141319] dark:ring-white/[0.07]"
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 @lg:grid-cols-[auto_minmax(0,1fr)_auto] @lg:items-center">
                    <span
                      className={cn(
                        NUM,
                        'grid h-7 w-7 place-items-center rounded-lg text-[13px] font-extrabold',
                        index === 0
                          ? 'bg-[#5a63df] text-white'
                          : 'bg-[#efeef8] text-slate-700 dark:bg-white/10 dark:text-slate-200'
                      )}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold leading-snug text-slate-900 dark:text-white">
                        {text.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-slate-600 dark:text-slate-300">
                        {text.why}
                      </p>
                      <p className={cn(NUM, 'mt-1 text-[11px] text-slate-500 dark:text-slate-400')}>
                        {t('aboutMinutes', { n: DRILL_MINUTES[drill.id] })}
                      </p>
                    </div>
                    <div className="col-start-2 @lg:col-start-3">
                      <DrillAction
                        t={t}
                        drill={drill}
                        text={text}
                        onRevise={onRevise}
                        onCompare={onCompare}
                      />
                    </div>
                  </div>
                  {drill.words && (
                    <div className="@lg:ps-10">
                      <WordSwaps
                        t={t}
                        words={drill.words}
                        source={vocabularySource}
                        saver={saver}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
      <div className="mt-3 flex flex-col-reverse gap-2 @md:flex-row @md:items-center @md:justify-end">
        {coachSession?.id && (
          <span {...(t.language === 'en' ? {} : { dir: t.rtl ? 'rtl' : 'ltr' })}>
            <AskAiCoachButton
              compact
              showAvatar
              label={t('askAva')}
              draft="Explain my Writing feedback and the one change that would raise my band most."
              sourceReference={{ type: 'test_session', id: coachSession.id }}
              className="h-10 w-full @md:w-auto"
            />
          </span>
        )}
        <Link to="/writing" className={PRIMARY_BUTTON}>
          {t('writeAnother')}
        </Link>
      </div>
    </section>
  );
}
