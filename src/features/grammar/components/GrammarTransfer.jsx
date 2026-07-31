import { useMemo, useState } from 'react';
import { ArrowLeft, FilePenLine, Loader2, LockKeyhole, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import { skillLabel, TRANSFER_PROMPTS } from '../constants';
import { IconChip, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';

const WRITING_CONTEXTS = {
  task_1:
    'Academic Writing Task 1: The proportion of commuters using cars rose from 55% to 68%, while rail use increased only slightly. Write one overview or comparison paragraph.',
  task_2:
    'Academic Writing Task 2: Some people think cities should restrict private cars in their centres. Present one clear position with a reason and example.',
};

export default function GrammarTransfer({
  isPaid,
  recommendedSkill,
  requestedTarget,
  recentSpeakingSessions,
  isStarting,
  isEvaluating,
  onStart,
  onEvaluate,
  onExit,
}) {
  const [transferType, setTransferType] = useState(requestedTarget || 'writing');
  const [taskType, setTaskType] = useState('task_2');
  const [writingText, setWritingText] = useState('');
  const [speakingSessionId, setSpeakingSessionId] = useState('');
  const [attemptId, setAttemptId] = useState(null);
  const [error, setError] = useState('');
  const targetSkill = recommendedSkill?.skillCode || 'grammar_clause_control';

  const selectedSpeaking = useMemo(
    () => recentSpeakingSessions.find((session) => session.id === speakingSessionId),
    [recentSpeakingSessions, speakingSessionId]
  );

  const submit = async () => {
    if (transferType === 'writing' && writingText.trim().length < 80) {
      setError('Write at least 80 characters so the evaluator has enough exact text evidence.');
      return;
    }
    if (transferType === 'speaking' && !speakingSessionId) {
      setError('Choose one existing Speaking response.');
      return;
    }
    setError('');
    try {
      let currentAttemptId = attemptId;
      if (!currentAttemptId) {
        const started = await onStart({
          mode: 'transfer',
          targetSkills: [targetSkill],
          questionCount: 0,
        });
        currentAttemptId = started.attempt.id;
        setAttemptId(currentAttemptId);
      }
      await onEvaluate({
        attemptId: currentAttemptId,
        transferType,
        writingText: transferType === 'writing' ? writingText.trim() : undefined,
        taskContext: transferType === 'writing' ? WRITING_CONTEXTS[taskType] : undefined,
        speakingSessionId: transferType === 'speaking' ? speakingSessionId : undefined,
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={onExit}
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Grammar Lab
      </button>

      <section className={cn(PANEL, 'overflow-hidden')}>
        <div className="border-b border-[#eeedf7] bg-[#fbfbfe] px-6 py-5 dark:border-white/[0.07] dark:bg-white/[0.025]">
          <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#5a63df]">
            IELTS transfer task
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Apply {skillLabel(targetSkill).toLowerCase()} in production
          </h1>
          <p className={cn('mt-2 max-w-3xl text-sm font-medium leading-6', MUTED)}>
            Repair work becomes useful only when it transfers into Writing or Speaking. Transfer
            evidence is stored separately and does not directly change Grammar skill progress.
          </p>
        </div>

        <div className="p-6">
          <div role="tablist" aria-label="Transfer type" className="grid gap-3 sm:grid-cols-2">
            {[
              { key: 'writing', label: 'Academic Writing', icon: FilePenLine },
              { key: 'speaking', label: 'Speaking transcript', icon: Mic2 },
            ].map((option) => {
              const isActive = transferType === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setTransferType(option.key);
                    setAttemptId(null);
                    setError('');
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-4 text-left transition',
                    isActive
                      ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.08] text-[#5a63df] ring-2 ring-[#5a63df]/10 dark:bg-indigo-400/10 dark:text-indigo-200'
                      : 'border-[#e2e5f2] bg-white text-slate-700 hover:border-[#c9cdf3] dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200'
                  )}
                >
                  <option.icon className="h-5 w-5" />
                  <span className="text-sm font-extrabold">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className={cn(TILE, 'mt-5 p-4')}>
            <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#5a63df]">
              Transfer prompt
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
              {TRANSFER_PROMPTS[transferType]}
            </p>
          </div>

          {!isPaid ? (
            <div
              className={cn(
                PANEL,
                'mt-5 border-[#5a63df]/25 bg-[#5a63df]/[0.05] p-5 dark:bg-indigo-400/10'
              )}
            >
              <div className="flex items-start gap-3">
                <IconChip icon={LockKeyhole} size="lg" />
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    AI evaluation is available on Pro and Premium
                  </h2>
                  <p className={cn('mt-1 text-xs font-medium leading-5', MUTED)}>
                    You can use the prompt now. Upgrading adds exact, grounded correction and uses
                    the existing Writing or Speaking AI quota.
                  </p>
                  <Button
                    asChild
                    className="mt-3 rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
                  >
                    <Link to="/upgrade">View upgrade options</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : transferType === 'writing' ? (
            <div className="mt-5 space-y-4">
              <div role="tablist" aria-label="Writing task" className="grid gap-2 sm:grid-cols-2">
                {Object.entries(WRITING_CONTEXTS).map(([key, value]) => {
                  const isActive = taskType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTaskType(key)}
                      className={cn(
                        'rounded-lg border p-3 text-left text-xs font-semibold leading-5 transition',
                        isActive
                          ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.08] text-[#5a63df] dark:bg-indigo-400/10 dark:text-indigo-200'
                          : 'border-[#e2e5f2] text-slate-600 hover:border-[#c9cdf3] dark:border-white/10 dark:text-slate-300'
                      )}
                    >
                      <span className="mb-1 block font-extrabold uppercase tracking-[0.1em]">
                        {key === 'task_1' ? 'Task 1' : 'Task 2'}
                      </span>
                      {value}
                    </button>
                  );
                })}
              </div>
              <div>
                <label
                  htmlFor="grammar-transfer-writing"
                  className="mb-2 block text-xs font-extrabold text-slate-700 dark:text-slate-200"
                >
                  Your paragraph
                </label>
                <Textarea
                  id="grammar-transfer-writing"
                  value={writingText}
                  onChange={(event) => setWritingText(event.target.value)}
                  rows={9}
                  maxLength={5000}
                  placeholder="Write your Academic IELTS paragraph here…"
                  className="resize-y rounded-lg border-[#e2e5f2] bg-[#fbfbfe] p-4 font-medium leading-6 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-white/[0.025]"
                />
                <div className="mt-2 text-right text-[11px] font-semibold text-slate-400">
                  {writingText.trim().split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold leading-5 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                Speaking feedback is transcript-based. Punctuation, capitalization, spelling, and
                likely transcription errors will not be treated as spoken grammar evidence.
              </div>
              <div className="mt-4 space-y-2">
                {recentSpeakingSessions.length ? (
                  recentSpeakingSessions.map((session) => {
                    const isActive = speakingSessionId === session.id;
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSpeakingSessionId(session.id)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg border p-3 text-left transition',
                          isActive
                            ? 'border-[#5a63df]/50 bg-[#5a63df]/[0.08] dark:bg-indigo-400/10'
                            : 'border-[#e2e5f2] hover:border-[#c9cdf3] dark:border-white/10'
                        )}
                      >
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {session.passage?.cambridge_title ||
                              session.passage?.title ||
                              'IELTS Speaking response'}
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {new Date(
                              session.completed_at || session.created_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#5a63df]">
                          {isActive ? 'Selected' : 'Choose'}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[#e2e5f2] p-4 text-xs font-medium leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">
                    No completed Speaking transcript is available.{' '}
                    <Link to="/speaking" className="font-extrabold text-[#5a63df]">
                      Complete Speaking practice first.
                    </Link>
                  </div>
                )}
              </div>
              {selectedSpeaking && (
                <p className="mt-2 text-[11px] font-semibold text-slate-400">
                  The evaluator will load this saved transcript directly; you cannot edit it here.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {error}
            </div>
          )}

          {isPaid && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={submit}
                disabled={isStarting || isEvaluating}
                className="rounded-lg bg-[#5a63df] px-5 font-bold text-white hover:bg-[#4a52c9]"
              >
                {(isStarting || isEvaluating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Evaluate transfer
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
