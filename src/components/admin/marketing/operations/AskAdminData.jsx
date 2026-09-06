import { useState } from 'react';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
import { AdminButton, TILE, TITLE, MICRO, MUTED } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { WindowSelect, ReportFacts } from './operationsShared';
import { inputClass, examples, shortDate, modelName, report } from './operationsConstants';

const SUGGESTION_LABELS = ['Message delivery', 'Learner feedback', 'Checkout status'];

function AskAdminSuggestions({ onSelect, disabled }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <span className={cn(MICRO, MUTED, 'mr-0.5 text-[9px]')}>Suggestions:</span>
      {examples.map((text, index) => (
        <button
          key={text}
          type="button"
          className="inline-flex items-center rounded-full border border-stone-200/80 bg-stone-50/70 px-2.5 py-0.5 text-[10px] font-semibold text-stone-600 transition-all hover:border-[#5a63df]/30 hover:bg-[#5a63df]/5 hover:text-[#5a63df] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-stone-300 dark:hover:border-[#5a63df]/40 dark:hover:bg-[#5a63df]/10 dark:hover:text-stone-100"
          onClick={() => onSelect(text)}
          disabled={disabled}
        >
          {SUGGESTION_LABELS[index]}
        </button>
      ))}
    </div>
  );
}

function AskAdminDataDetails({ answer }) {
  const modelSuffix = answer.fallback_used ? ' · fallback' : '';

  return (
    <details className="group mt-2 text-xs">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200">
        <ChevronRight
          className="h-3 w-3 transition-transform duration-150 group-open:rotate-90"
          aria-hidden="true"
        />
        Data details
      </summary>
      <div className={cn(TILE, 'mt-1.5 grid gap-2 p-2.5 sm:grid-cols-3 text-xs')}>
        <div>
          <span className={cn(MICRO, MUTED)}>Period</span>
          <p className="mt-0.5 font-medium text-stone-800 dark:text-stone-200">
            {shortDate(answer.window.since)}–{shortDate(answer.window.until)}
          </p>
        </div>
        <div>
          <span className={cn(MICRO, MUTED)}>Source</span>
          <p className="mt-0.5 break-all font-mono text-[11px] text-stone-800 dark:text-stone-200">
            {answer.source}
          </p>
        </div>
        <div title={`${answer.model} · ${answer.provider}`}>
          <span className={cn(MICRO, MUTED)}>Model</span>
          <p className="mt-0.5 font-medium text-stone-800 dark:text-stone-200">
            {modelName(answer.model)}
            {modelSuffix}
          </p>
        </div>
        <p className={cn(MUTED, 'text-[10px] sm:col-span-3')}>
          Server-calculated counts. Opens are signals, not confirmed reads.
        </p>
      </div>
    </details>
  );
}

function AskAdminAnswerView({ answer }) {
  if (!answer) return null;

  return (
    <div
      className="mt-3.5 rounded-lg border border-stone-200/80 bg-white p-3 dark:border-white/[0.07] dark:bg-[#131315]"
      aria-live="polite"
    >
      {answer.unsupported ? (
        <p className="text-xs text-stone-600 dark:text-stone-300">{answer.message}</p>
      ) : (
        <>
          <h4 className={cn(TITLE, 'text-[12.5px]')}>{answer.title}</h4>
          <ReportFacts facts={answer.facts} />
          <AskAdminDataDetails answer={answer} />
        </>
      )}
    </div>
  );
}

export function AskAdminData() {
  const [question, setQuestion] = useState('');
  const [days, setDays] = useState(30);
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ask = async (event) => {
    event.preventDefault();
    setAnswer(null);
    setError('');
    setBusy(true);

    try {
      setAnswer(await report('admin_ask', { question, days }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSelectSuggestion = (text) => {
    setQuestion(text);
    setAnswer(null);
  };

  const handleWindowChange = (value) => {
    setDays(value);
    setAnswer(null);
  };

  return (
    <section className="min-w-0">
      <label htmlFor="admin-question" className={cn(MICRO, MUTED, 'mb-1.5 block')}>
        Ask your admin data
      </label>
      <form onSubmit={ask} className="flex w-full flex-wrap items-center gap-2">
        <input
          id="admin-question"
          aria-label="Your question"
          className={cn(inputClass, 'basis-full flex-1 sm:basis-64')}
          placeholder="How are messages performing?"
          minLength={5}
          maxLength={500}
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={busy}
        />
        <WindowSelect value={days} id="ask-window" disabled={busy} onChange={handleWindowChange} />
        <AdminButton type="submit" loading={busy} className="h-8 shrink-0 rounded-lg">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Ask
        </AdminButton>
      </form>

      <AskAdminSuggestions onSelect={handleSelectSuggestion} disabled={busy} />

      {error && (
        <p role="alert" className="mt-2.5 text-xs font-semibold text-[rgb(var(--signal-fault))]">
          {error} Try asking again.
        </p>
      )}

      {busy && (
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <p role="status">Checking the figures…</p>
        </div>
      )}

      <AskAdminAnswerView answer={answer} />
    </section>
  );
}
