import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenCheck, Languages, Lightbulb, LoaderCircle, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, PANEL, Pill, TILE, TITLE } from '@/features/dashboard/components/primitives';
import { READING_TRANSLATION_LANGUAGES } from '@/features/testing/reading/services/readingAiLanguages';

const ACTIONS = [
  { id: 'simplify', label: 'Simplify', icon: Lightbulb },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'breakdown', label: 'Breakdown', icon: Search },
];

function desktopPosition(assistant) {
  const bounds = assistant.selection?.panelBounds;
  const availableWidth = bounds ? Math.max(160, bounds.right - bounds.left - 24) : 320;
  const width = Math.min(320, availableWidth);
  const minLeft = Math.max(12, (bounds?.left || 0) + 12);
  const maxLeft = Math.max(minLeft, (bounds?.right || window.innerWidth) - width - 12);
  const desiredLeft = assistant.position.x - width / 2;
  return {
    width,
    left: Math.round(Math.min(maxLeft, Math.max(minLeft, desiredLeft))),
    top: Math.round(Math.max(12, Math.min(window.innerHeight - 356, assistant.position.y + 10))),
  };
}

function Result({ action, result, language }) {
  if (!result) return null;
  if (action === 'simplify') return <p>{result.simplified}</p>;
  if (action === 'translate')
    return (
      <div dir={['ar', 'fa', 'ur'].includes(language) ? 'rtl' : 'auto'}>
        <p>{result.translated}</p>
      </div>
    );
  return (
    <div className="space-y-3">
      <div>
        <p className={cn(MICRO, MUTED, 'mb-1')}>Core idea</p>
        <p>{result.coreIdea}</p>
      </div>
      {result.structures?.map((structure, index) => (
        <div key={`${structure.fragment}-${index}`} className={cn(TILE, 'p-2.5')}>
          <p className="font-semibold text-slate-800 dark:text-slate-100">“{structure.fragment}”</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">{structure.explanation}</p>
        </div>
      ))}
      {result.tone ? (
        <div>
          <p className={cn(MICRO, MUTED, 'mb-1')}>Tone</p>
          <p>{result.tone}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function SentenceAssistantPopover({
  assistant,
  status,
  language,
  onLanguageChange,
  onActionChange,
  onClose,
  isMobile,
}) {
  useEffect(() => {
    if (!assistant) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [assistant, onClose]);

  if (!assistant) return null;
  const remaining = status?.remainingDailyQuota;
  const position = isMobile ? undefined : desktopPosition(assistant);
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-[205] cursor-default" onClick={onClose} />
      <section
        className={cn(
          PANEL,
          'fixed z-[210] overflow-hidden',
          isMobile ? 'inset-x-3 bottom-3 max-h-[70vh]' : 'max-h-[min(344px,calc(100vh-24px))]'
        )}
        style={
          isMobile ? undefined : { left: position.left, top: position.top, width: position.width }
        }
        role="dialog"
        aria-label="Reading assistant"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-[#eceafa] px-3 py-2.5 dark:border-white/[0.07]">
          <div>
            <p className={cn(MICRO, MUTED)}>Reading assistant</p>
            <h3 className={cn(TITLE, 'mt-0.5')}>Understand this sentence</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:hover:bg-white/[0.06]"
            aria-label="Close Reading assistant"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-[#eceafa] p-1.5 dark:border-white/[0.07]">
          {ACTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onActionChange(id)}
              aria-pressed={assistant.action === id}
              className={cn(
                'flex min-h-8 flex-1 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                assistant.action === id
                  ? 'bg-[#5a63df] text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="max-h-[234px] overflow-y-auto p-2.5">
          {assistant.action === 'translate' ? (
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className={cn(MICRO, MUTED)} htmlFor="reading-translation-language">
                Translate to
              </label>
              <select
                id="reading-translation-language"
                value={language}
                onChange={(event) => onLanguageChange(event.target.value)}
                className="min-h-9 rounded-md border border-[#e4e2f0] bg-white px-2 text-xs dark:border-white/[0.07] dark:bg-[#141319]"
              >
                {READING_TRANSLATION_LANGUAGES.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {typeof remaining === 'number' &&
          ['translate', 'breakdown'].includes(assistant.action) ? (
            <Pill tone={remaining > 1 ? 'accent' : 'warn'}>
              {remaining} of 5 free uses left today
            </Pill>
          ) : null}

          <div className="mt-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
            {assistant.loading ? (
              <div
                className={cn(TILE, 'flex items-center gap-2.5 p-3')}
                role="status"
                aria-live="polite"
              >
                <LoaderCircle className="size-4 animate-spin text-[#5a63df]" />
                <span>Preparing a clear explanation…</span>
              </div>
            ) : assistant.error ? (
              <div className={cn(TILE, 'space-y-2 p-3')} role="alert">
                <p>{assistant.error}</p>
                {assistant.quotaExceeded ? (
                  <Link
                    to="/upgrade"
                    className="inline-flex items-center gap-1 font-bold text-[#5a63df]"
                  >
                    <BookOpenCheck className="size-4" /> See upgrade options
                  </Link>
                ) : null}
              </div>
            ) : (
              <Result action={assistant.action} result={assistant.result} language={language} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
