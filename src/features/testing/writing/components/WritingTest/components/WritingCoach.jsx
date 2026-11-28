import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';
import { MUTED, NUM, PANEL, Pill, WELL } from '@/features/dashboard/components/primitives';
import { QUIET_BUTTON } from '@/features/testing/writing/report/components/reportStyles';
import { revisionSummary } from '@/features/testing/writing/revision/revisionChecks';
import {
  RevisionChanges,
  RevisionResult,
} from '@/features/testing/writing/revision/RevisionResult';
import { RevisionSubmit } from '@/features/testing/writing/revision/RevisionSubmit';
import {
  plainWritingText,
  sourceForFeedback,
} from '@/features/testing/writing/utils/writingCoaching';

/** Each answer gets one checked revision; the server enforces the same limit. */
const revisionUsed = (record) => (record?.revision_history?.length || 0) >= 1;

function useCoachingRecord(sessionId, taskType, feedback, originalHtml) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!sessionId || !feedback) return;
    let active = true;
    setRecord(null);
    setError('');
    setUnavailable(false);
    setLoading(true);
    supabase
      .from('writing_practice_coaching')
      .select('*')
      .eq('session_id', sessionId)
      .eq('task_type', taskType)
      .maybeSingle()
      .then(({ data, error: readError }) => {
        if (!active) return;
        if (readError) {
          if (readError.code === 'PGRST205' || readError.code === '42P01') {
            setUnavailable(true);
          } else {
            setError('Saved coaching could not be loaded. Please refresh this page.');
          }
        } else setRecord(data);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId, taskType, feedback]);

  useEffect(() => {
    if (
      (record?.transformation_status !== 'generating' && record?.revision_status !== 'checking') ||
      !sessionId
    )
      return undefined;
    const timer = setInterval(async () => {
      const { data } = await supabase
        .from('writing_practice_coaching')
        .select('*')
        .eq('session_id', sessionId)
        .eq('task_type', taskType)
        .maybeSingle();
      if (data) setRecord(data);
    }, 4000);
    return () => clearInterval(timer);
  }, [record?.transformation_status, record?.revision_status, sessionId, taskType]);

  const ensureRecord = useCallback(
    async (sessionUserId) => {
      if (record) return record;
      const { data, error: insertError } = await supabase
        .from('writing_practice_coaching')
        .insert({
          session_id: sessionId,
          user_id: sessionUserId,
          task_type: taskType,
          original_text: originalHtml,
          revision_text: originalHtml,
        })
        .select('*')
        .single();
      if (insertError) {
        const { data: existing, error: readError } = await supabase
          .from('writing_practice_coaching')
          .select('*')
          .eq('session_id', sessionId)
          .eq('task_type', taskType)
          .maybeSingle();
        if (readError || !existing) throw insertError;
        setRecord(existing);
        return existing;
      }
      setRecord(data);
      return data;
    },
    [record, sessionId, taskType, originalHtml]
  );

  return { record, setRecord, loading, error, setError, unavailable, setUnavailable, ensureRecord };
}

/** Practice estimates compare only when the same marking version made both. */
function checkedFeedback(record, feedback) {
  const checked = record?.revision_feedback;
  const comparable =
    Number(checked?.overallBand) > 0 &&
    Boolean(feedback.evaluationVersion) &&
    feedback.evaluationVersion === checked.evaluationVersion;
  return comparable ? checked : null;
}

function Priorities({ items }) {
  if (!items.length) return null;
  return (
    <div className={`${WELL} p-3`}>
      <h3 className="text-[12.5px] font-extrabold">Work on these in your draft</h3>
      <ol className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-[13px] leading-snug">
            <span
              className={`${NUM} grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#5a63df]/10 text-[11px] font-bold text-[#4b53c9] dark:text-[#afb5ff]`}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span>
              {item.action}
              {item.criterion && (
                <span className={`block text-[11.5px] ${MUTED}`}>{item.criterion}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Older answers could be checked more than once; one check needs no history. */
function EarlierChecks({ history = [] }) {
  if (history.length < 2) return null;
  return (
    <details className={`${PANEL} p-4 text-xs`}>
      <summary className="cursor-pointer text-[13px] font-extrabold">Earlier checks</summary>
      <ul className="mt-2 space-y-2">
        {history.map((entry) => (
          <li key={entry.version} className={`${WELL} p-2.5`}>
            <p className="font-bold">
              Revision {entry.version}: estimated Band{' '}
              <span className={NUM}>{entry.feedback?.overallBand || '-'}</span>
            </p>
            <p className="mt-1.5 whitespace-pre-wrap font-serif leading-6">
              {plainWritingText(entry.text)}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** After the one check: the result first, then the words that earned it. */
function CheckedRevision({ record, original, feedback }) {
  const checked = checkedFeedback(record, feedback);
  return (
    <>
      {checked ? (
        <RevisionResult feedback={feedback} checked={checked} />
      ) : (
        <p className={`${PANEL} p-4 text-[13px] ${MUTED}`}>
          This revision was checked with a different marking version, so the two estimates cannot be
          compared.
        </p>
      )}
      <RevisionChanges
        original={original}
        draft={plainWritingText(record.revision_scored_text || record.revision_text)}
      />
      <EarlierChecks history={record.revision_history} />
    </>
  );
}

const CHECK_TIMEOUT_MS = 5 * 60 * 1000;

const isChecking = (record) =>
  record?.revision_status === 'checking' &&
  Date.now() - Date.parse(record?.revision_check_started_at || '') < CHECK_TIMEOUT_MS;

/** The draft: what changed, saving it as it is typed, and spending the check. */
function useRevisionDraft({ record, ensureRecord, session, taskType, original, setRecord }) {
  const [text, setText] = useState(plainWritingText(record?.revision_text || original));
  const [busy, setBusy] = useState(false);
  const [revisionError, setRevisionError] = useState('');
  const saveQueue = useRef(Promise.resolve());
  const originalPlain = plainWritingText(original);
  const summary = useMemo(
    () => revisionSummary(originalPlain, plainWritingText(text), taskType),
    [originalPlain, text, taskType]
  );
  const { changed } = summary;
  const used = revisionUsed(record);
  const checkingActive = isChecking(record);
  const save = useCallback(
    (nextText) => {
      saveQueue.current = saveQueue.current
        .catch(() => {})
        .then(async () => {
          const row = await ensureRecord(session.user_id);
          const { data, error } = await supabase
            .from('writing_practice_coaching')
            .update({ revision_text: nextText, updated_at: new Date().toISOString() })
            .eq('id', row.id)
            .select('*')
            .single();
          if (error) throw error;
          setRecord(data);
          setRevisionError('');
          return data;
        });
      return saveQueue.current;
    },
    [ensureRecord, session.user_id, setRecord]
  );
  useEffect(() => {
    if (!changed || text === record?.revision_text || !session?.id) return undefined;
    const timeout = setTimeout(
      () =>
        save(text).catch(() =>
          setRevisionError('Draft could not be saved. Copy your changes before leaving.')
        ),
      1000
    );
    return () => clearTimeout(timeout);
  }, [text, changed, record?.revision_text, session?.id, save]);
  const recheck = async () => {
    if ([!changed, summary.unfinished, busy, checkingActive, used].some(Boolean)) return;
    setBusy(true);
    setRevisionError('');
    try {
      await save(text);
      const result = await callEdgeFunction('writing-coach', {
        operation: 'recheck',
        sessionId: session.id,
        taskType,
      });
      setRecord(result.data);
    } catch (error) {
      setRevisionError(error.message || 'Could not check this revision.');
    } finally {
      setBusy(false);
    }
  };

  return {
    text,
    setText,
    busy,
    revisionError,
    originalPlain,
    summary,
    used,
    checkingActive,
    recheck,
  };
}

function RevisionStudio({ feedback, ...draftProps }) {
  const { record } = draftProps;
  const draft = useRevisionDraft(draftProps);
  const { text, setText, busy, revisionError, originalPlain, summary, used } = draft;
  const { checkingActive, recheck } = draft;

  return (
    <div id="writing-revise" className="space-y-3">
      <section className={`${PANEL} space-y-3 p-4`} aria-labelledby="revision-title">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 id="revision-title" className="text-base font-extrabold">
              Revise your answer
            </h2>
            <p className={`mt-0.5 text-[12.5px] ${MUTED}`}>
              {used
                ? 'You have used the one check for this answer. Try a new question to practise again.'
                : 'Write a better draft from your feedback. Your original score stays the same.'}
            </p>
          </div>
          <Pill tone="accent">
            <span className={NUM}>Original Band {feedback.overallBand || '-'}</span>
          </Pill>
        </div>
        {!used && (
          <>
            <Priorities items={(feedback?.priorities || []).slice(0, 3)} />
            <textarea
              aria-label="Your revised answer"
              value={text}
              onChange={(event) => setText(event.target.value)}
              lang="en"
              dir="ltr"
              className="min-h-[360px] w-full max-h-[70vh] resize-y rounded-lg border border-[#e4e2f0] bg-white p-3.5 font-serif text-[15px] leading-8 text-slate-900 transition-[border-color,box-shadow] duration-150 focus-visible:border-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/30 sm:min-h-[44vh] dark:border-white/[0.07] dark:bg-[#16151b] dark:text-slate-100"
            />
            <RevisionSubmit
              summary={summary}
              draft={text}
              busy={busy}
              checking={checkingActive}
              onCheck={recheck}
            />
          </>
        )}
        {revisionError && (
          <p role="alert" className="text-[12.5px] text-[rgb(var(--signal-fault))]">
            {revisionError}
          </p>
        )}
      </section>
      {used && <CheckedRevision record={record} original={originalPlain} feedback={feedback} />}
    </div>
  );
}

export function WritingRevisionEditor({ session, taskType, feedback, originalHtml, onBack }) {
  const { record, setRecord, loading, error, unavailable, ensureRecord } = useCoachingRecord(
    session?.id,
    taskType,
    feedback,
    originalHtml
  );
  const original = sourceForFeedback(feedback, originalHtml);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 pb-4">
      <button type="button" className={`${QUIET_BUTTON} w-fit`} onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to editor
      </button>
      {loading ? (
        <p role="status" className="flex items-center gap-2 p-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading saved revision…
        </p>
      ) : unavailable ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        >
          Revision practice is temporarily unavailable.
        </p>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
          <RevisionStudio
            key={`${session?.id}:${taskType}`}
            record={record}
            ensureRecord={ensureRecord}
            session={session}
            taskType={taskType}
            original={original}
            feedback={feedback}
            setRecord={setRecord}
          />
        </>
      )}
    </div>
  );
}
