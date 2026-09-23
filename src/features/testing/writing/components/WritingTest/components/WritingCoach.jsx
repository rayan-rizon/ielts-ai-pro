import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';
import { PANEL, WELL, MICRO, NUM } from '@/features/dashboard/components/primitives';
import {
  plainWritingText,
  sourceForFeedback,
} from '@/features/testing/writing/utils/writingCoaching';
import {
  guardTask1Transformation,
  sentences as splitCoachSentences,
} from '../../../../../../../supabase/functions/_shared/writingCoachValidation.ts';

const buttonClass =
  'rounded-lg border border-[#d5d5ea] bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#5a63df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a63df] dark:border-white/15 dark:bg-[#191820] dark:text-slate-100';
const primaryClass =
  'rounded-lg bg-[#5a63df] px-3 py-2 text-xs font-bold text-white hover:bg-[#4953cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a63df] disabled:opacity-50';

function highlightChanges(source, revision) {
  const tokenize = (value) =>
    value.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu) || [];
  const left = tokenize(source);
  const right = tokenize(revision);
  const count = (tokens) => {
    const result = new Map();
    for (const token of tokens)
      if (/^[\p{L}\p{N}]/u.test(token)) {
        const key = token.toLowerCase();
        result.set(key, (result.get(key) || 0) + 1);
      }
    return result;
  };
  const leftCounts = count(left);
  const rightCounts = count(right);
  const changed = (tokens, otherCounts) =>
    tokens.map((token, index) => {
      if (!/^[\p{L}\p{N}]/u.test(token)) return token;
      const key = token.toLowerCase();
      const remaining = otherCounts.get(key) || 0;
      if (remaining > 0) {
        otherCounts.set(key, remaining - 1);
        return token;
      }
      return (
        <mark
          key={index}
          className="rounded bg-indigo-100 px-0.5 text-inherit dark:bg-indigo-400/20"
        >
          {token}
        </mark>
      );
    });
  return { original: changed(left, rightCounts), example: changed(right, leftCounts) };
}

function conciseLimitation(note) {
  if (/task (?:1 )?visuals?.*(?:not checked|not rechecked)/i.test(note))
    return 'The visual was not rechecked. Check factual details against the original visual.';
  return note;
}

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

export function BandComparison({
  transformation,
  taskType,
  original,
  generate,
  busy,
  status,
  attempts = 0,
  error,
  disabledReason,
}) {
  const [showFull, setShowFull] = useState(false);
  const isVisualTask = taskType === 'Task 1';
  const exampleTitle = isVisualTask ? 'Language ideas for Task 1' : 'Band 8.0 example';
  if (!transformation)
    return (
      <section className={`${PANEL} mx-auto max-w-2xl space-y-3 p-5`}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#5a63df]" />
          <h2 className="text-base font-bold">{exampleTitle}</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isVisualTask
            ? 'Review language ideas. Data-bearing statements are retained when the visual is not rechecked.'
            : 'Compare your sentences with an AI example aiming for Band 8.0 features.'}
        </p>
        <p className="text-xs text-slate-500">
          This is a learning example, not an examiner-certified score. Each saved answer can request
          one example when the service is available.
        </p>
        {status === 'failed' && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            The example service could not prepare this answer. Your writing and feedback are saved.
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}
        {disabledReason && (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
            {disabledReason}
          </p>
        )}
        <button
          type="button"
          className={primaryClass}
          onClick={generate}
          disabled={Boolean(disabledReason) || busy || status === 'generating' || attempts >= 2}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />
              Preparing example…
            </>
          ) : status === 'generating' ? (
            'Preparing example…'
          ) : status === 'failed' ? (
            isVisualTask ? (
              'Retry language ideas'
            ) : (
              'Retry Band 8.0 example'
            )
          ) : isVisualTask ? (
            'Show language ideas'
          ) : (
            'Show Band 8.0 example'
          )}
        </button>
      </section>
    );
  const sentences = transformation.sourceSentences || splitCoachSentences(original);
  const safeTransformation =
    taskType === 'Task 1' ? guardTask1Transformation(transformation, sentences) : transformation;
  return (
    <section className="mx-auto max-w-6xl space-y-3">
      <div className={`${PANEL} p-4`}>
        <h2 className="text-base font-bold">
          {isVisualTask ? 'Your answer and language ideas' : 'Your answer and Band 8.0 example'}
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {isVisualTask
            ? 'Compare language choices. Check every data claim against the visual before using it.'
            : 'Compare your sentence with the Band 8.0 example. Each change has a reason.'}
        </p>
        {isVisualTask && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            The visual was not available for this language example. Check factual details against
            it.
          </p>
        )}
        {!isVisualTask && safeTransformation.limitations?.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {safeTransformation.limitations.map(conciseLimitation).join(' ')}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`${WELL} hidden px-4 py-2 text-xs font-bold md:block`}>Your answer</div>
        <div className={`${WELL} hidden px-4 py-2 text-xs font-bold md:block`}>
          {isVisualTask ? 'Language idea' : 'Band 8.0 example'}
        </div>
        {safeTransformation.segments.map((segment, index) => {
          const sourceSentence =
            segment.sourceSentenceIds
              .map((id) => sentences[id - 1]?.source)
              .filter(Boolean)
              .join(' ') || original;
          const highlights = highlightChanges(sourceSentence, segment.revisedText);
          const tag =
            segment.changeTags?.join(' · ') ||
            (segment.shortReason?.includes('visual was not rechecked')
              ? 'Visual detail unverified'
              : sourceSentence === segment.revisedText
                ? 'Already effective'
                : 'Suggested change');
          return (
            <React.Fragment key={index}>
              <div className={`${PANEL} min-w-0 p-4 md:rounded-r-none`}>
                <p className={MICRO}>Your answer · {segment.sourceSentenceIds.join(', ')}</p>
                <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-6">
                  {highlights.original}
                </p>
              </div>
              <div className={`${PANEL} min-w-0 p-4 md:rounded-l-none`}>
                <p className={MICRO}>{isVisualTask ? 'Language idea' : 'Band 8.0 example'}</p>
                <p className="mt-2 whitespace-pre-wrap break-words font-serif text-sm leading-6">
                  {highlights.example}
                </p>
                <p className="mt-3 border-t border-[#e4e2f0] pt-2 text-xs text-slate-600 dark:border-white/[0.07] dark:text-slate-300">
                  <span className="font-bold text-[#5a63df] dark:text-indigo-300">{tag}</span>
                  {segment.shortReason ? ` — ${segment.shortReason}` : ''}
                </p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className={`${PANEL} p-4`}>
        <button
          type="button"
          className={buttonClass}
          aria-expanded={showFull}
          onClick={() => setShowFull((value) => !value)}
        >
          {showFull
            ? isVisualTask
              ? 'Hide full language draft'
              : 'Hide complete Band 8.0 example'
            : isVisualTask
              ? 'Read full language draft'
              : 'Read complete Band 8.0 example'}
        </button>
        {showFull && (
          <div className="mt-3 space-y-3 font-serif text-sm leading-7">
            {Object.entries(
              safeTransformation.segments.reduce((groups, segment) => {
                const paragraph = sentences[segment.sourceSentenceIds[0] - 1]?.paragraph ?? 0;
                (groups[paragraph] ||= []).push(segment.revisedText);
                return groups;
              }, {})
            ).map(([paragraph, parts]) => (
              <p key={paragraph}>{parts.join(' ')}</p>
            ))}
          </div>
        )}
      </div>
      {safeTransformation.languageNotes?.length > 0 && (
        <div className={`${PANEL} p-4`}>
          <h3 className="text-sm font-bold">Language notes</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
            {safeTransformation.languageNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RevisionStudio({
  record,
  ensureRecord,
  session,
  taskType,
  original,
  feedback,
  setRecord,
}) {
  const [text, setText] = useState(plainWritingText(record?.revision_text || original));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [revisionError, setRevisionError] = useState('');
  const saveQueue = useRef(Promise.resolve());
  const originalPlain = plainWritingText(original);
  const changed = plainWritingText(text) !== originalPlain;
  const checkingActive =
    record?.revision_status === 'checking' &&
    Date.now() - Date.parse(record?.revision_check_started_at || '') < 5 * 60 * 1000;
  const priorities = (feedback?.priorities || []).slice(0, 3);
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
    if (
      !changed ||
      busy ||
      checkingActive ||
      record?.revision_scored_text === text ||
      (record?.revision_history?.length || 0) >= 5
    )
      return;
    setBusy(true);
    setMessage('');
    setRevisionError('');
    try {
      await save(text);
      const result = await callEdgeFunction('writing-coach', {
        operation: 'recheck',
        sessionId: session.id,
        taskType,
      });
      setRecord(result.data);
      setMessage('Revision checked. Your original score is unchanged.');
    } catch (error) {
      setRevisionError(error.message || 'Could not recheck this revision.');
    } finally {
      setBusy(false);
    }
  };
  const revisionBand = Number(record?.revision_feedback?.overallBand || 0);
  const comparableVersions = Boolean(
    feedback.evaluationVersion &&
    record?.revision_feedback?.evaluationVersion &&
    feedback.evaluationVersion === record.revision_feedback.evaluationVersion
  );
  return (
    <section id="writing-revise" className={`${PANEL} space-y-3 p-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold">Revise your answer</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Make a new draft from your feedback. Your original score stays the same.
          </p>
        </div>
        <span className={`${NUM} shrink-0 text-xs text-slate-500`}>
          Original estimate: Band {feedback.overallBand || '—'}
        </span>
      </div>
      {priorities.length > 0 && (
        <div className={`${WELL} p-3 text-xs`}>
          <h3 className="font-bold">Use these priorities</h3>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {priorities.map((item, i) => (
              <li key={i}>{item.action}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <textarea
          aria-label="Your revised answer"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-[420px] w-full max-h-[75vh] resize-y rounded-lg border border-[#e4e2f0] bg-white p-3 font-serif text-sm leading-7 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5a63df] sm:min-h-[520px] lg:min-h-[48vh] dark:border-white/[0.07] dark:bg-[#16151b] dark:text-slate-100"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${NUM} text-xs text-slate-500`}>
            {plainWritingText(text).match(/\S+/g)?.length || 0} words
          </span>
          <button
            type="button"
            onClick={recheck}
            disabled={
              !changed ||
              busy ||
              checkingActive ||
              record?.revision_scored_text === text ||
              (record?.revision_history?.length || 0) >= 5
            }
            className={primaryClass}
          >
            {busy ? (
              <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
            )}
            {checkingActive ? 'Checking revision…' : 'Recheck revision'}
          </button>
        </div>
        {message && (
          <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">
            {message}
          </p>
        )}
        {revisionError && (
          <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
            {revisionError}
          </p>
        )}
        {(record?.revision_history?.length || 0) >= 5 && (
          <p className="text-xs text-slate-500">Five checks used. Try a new question.</p>
        )}
        {revisionBand > 0 &&
          comparableVersions &&
          plainWritingText(record?.revision_scored_text) === plainWritingText(text) && (
            <div className={`${WELL} space-y-2 p-3 text-xs`}>
              <p>
                AI-estimated original <span className={NUM}>{feedback.overallBand}</span>{' '}
                <ArrowRight className="mx-1 inline h-3 w-3" /> assisted revision{' '}
                <span className={NUM}>{revisionBand}</span>. This does not measure independent
                progress.
              </p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {Object.entries(record.revision_feedback.criteriaScores || {}).map(
                  ([criterion, score]) => (
                    <li key={criterion}>
                      {criterion.replace(/([a-z])([A-Z])/g, '$1 $2')}:{' '}
                      <span className={NUM}>
                        {feedback.criteriaScores?.[criterion] ?? '—'} → {score}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        {revisionBand > 0 && !comparableVersions && (
          <p className="text-xs text-slate-500">
            The marking version changed, so the two band estimates cannot be compared directly. Your
            checked revision remains saved below.
          </p>
        )}
        {record?.revision_history?.length > 0 && (
          <div className={`${WELL} p-3 text-xs`}>
            <h3 className="font-bold">Saved revision checks</h3>
            <div className="mt-2 space-y-2">
              {record.revision_history.map((entry) => (
                <details
                  key={entry.version}
                  className="rounded border border-[#e4e2f0] bg-white p-2 dark:border-white/10 dark:bg-[#16151b]"
                >
                  <summary className="cursor-pointer font-bold">
                    Revision {entry.version} · estimated Band{' '}
                    <span className={NUM}>{entry.feedback?.overallBand || '—'}</span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap font-serif leading-6">
                    {plainWritingText(entry.text)}
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    {(entry.feedback?.priorities || [])
                      .slice(0, 2)
                      .map((item) => item.action)
                      .join(' · ')}
                  </p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function WritingCoach({ session, taskType, feedback, originalHtml }) {
  const { record, setRecord, loading, error, setError, unavailable, setUnavailable } =
    useCoachingRecord(session?.id, taskType, feedback, originalHtml);
  const [busy, setBusy] = useState(false);
  const original = sourceForFeedback(feedback, originalHtml);
  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await callEdgeFunction('writing-coach', {
        operation: 'generate',
        sessionId: session.id,
        taskType,
      });
      setRecord(result.data);
    } catch (err) {
      if (err.status === 404 && /function was not found/i.test(err.message || '')) {
        setUnavailable(true);
      } else {
        setError(err.message || 'Could not prepare the example.');
      }
      const { data: latest } = await supabase
        .from('writing_practice_coaching')
        .select('*')
        .eq('session_id', session.id)
        .eq('task_type', taskType)
        .maybeSingle();
      if (latest) setRecord(latest);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3 border-t border-[#e4e2f0] pt-4 text-slate-900 dark:border-white/[0.07] dark:text-slate-100">
      {loading ? (
        <p role="status" className="flex items-center gap-2 p-2 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Band 8.0 example…
        </p>
      ) : (
        <>
          <BandComparison
            transformation={record?.transformation}
            taskType={taskType}
            original={original}
            generate={generate}
            busy={busy}
            status={record?.transformation_status}
            attempts={record?.transformation_attempts}
            error={error}
            disabledReason={
              unavailable
                ? 'Band 8.0 examples are temporarily unavailable. Your scored feedback is still ready to use.'
                : undefined
            }
          />
        </>
      )}
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-2">
      <button type="button" className={`${buttonClass} w-fit`} onClick={onBack}>
        <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Back to editor
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
