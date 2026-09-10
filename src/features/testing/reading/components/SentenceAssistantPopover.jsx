import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  Languages,
  Lightbulb,
  LoaderCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, MUTED, NUM, PANEL, TILE, TITLE } from '@/features/dashboard/components/primitives';
import { READING_TRANSLATION_LANGUAGES } from '@/features/testing/reading/services/readingAiLanguages';

function TranslateAiIcon({ className }) {
  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <Languages className={className} />
      <Sparkles className="absolute -top-1 -right-1 size-2 text-[#5a63df] dark:text-[#afb5ff]" />
    </span>
  );
}

// Only these two are metered; Simplify and word lookups are unlimited.
const QUOTA_LABELS = { translate: 'Translations', breakdown: 'Breakdowns' };

const ACTIONS = [
  { id: 'simplify', label: 'Simplify', icon: Lightbulb },
  { id: 'translate', label: 'Translate', icon: TranslateAiIcon },
  { id: 'breakdown', label: 'Breakdown', icon: BrainCircuit },
];

const RTL_LANGUAGES = new Set(['ar', 'fa', 'ur']);

const PASSAGE_SELECTORS = [
  '[data-testid="passage-panel"]',
  '[data-passage-body]',
  '.passage-content',
  '#passage-container',
];

const SIDEBAR_SELECTORS = ['[data-sidebar="sidebar"]', 'aside', '[data-slot="sidebar"]'];

function isVisibleLeftRail(rect) {
  if (!rect) return false;
  const isPositiveWidth = rect.right > 0;
  const isOnScreen = rect.left >= 0;
  const isLeftHalf = rect.right < window.innerWidth / 2;
  return isPositiveWidth && isOnScreen && isLeftHalf;
}

function resolvePanelBounds(assistant) {
  const selectionBounds = assistant.selection?.panelBounds;
  if (selectionBounds) return selectionBounds;
  if (typeof document === 'undefined') return null;

  for (const selector of PASSAGE_SELECTORS) {
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }
  }
  return null;
}

function resolveSidebarRight() {
  if (typeof document === 'undefined') return 0;

  for (const selector of SIDEBAR_SELECTORS) {
    const sidebar = document.querySelector(selector);
    if (sidebar) {
      const rect = sidebar.getBoundingClientRect();
      if (isVisibleLeftRail(rect)) {
        return rect.right;
      }
    }
  }
  return 0;
}

function calculatePopoverWidth(bounds) {
  if (!bounds) return 352;
  const availableWidth = bounds.right - bounds.left - 24;
  return Math.min(352, Math.max(160, availableWidth));
}

function desktopPosition(assistant) {
  const bounds = resolvePanelBounds(assistant);
  const sidebarRight = resolveSidebarRight();
  const width = calculatePopoverWidth(bounds);

  const minSafeLeft = Math.max(12, sidebarRight + 12);
  const panelLeft = (bounds?.left ?? 0) + 12;
  const minLeft = Math.max(minSafeLeft, panelLeft);

  const panelRight = bounds?.right ?? window.innerWidth;
  const maxLeft = Math.max(minLeft, panelRight - width - 12);
  const desiredLeft = assistant.position.x - width / 2;

  const minSafeTop = bounds ? Math.max(12, bounds.top + 8) : 12;
  const maxSafeTop = window.innerHeight - 380;
  const desiredTop = assistant.position.y + 10;

  return {
    width,
    left: Math.round(Math.min(maxLeft, Math.max(minLeft, desiredLeft))),
    top: Math.round(Math.max(minSafeTop, Math.min(maxSafeTop, desiredTop))),
  };
}

function SentenceResultCard({ title, text, language }) {
  const isRtl = language ? RTL_LANGUAGES.has(language) : false;
  return (
    <div
      dir={isRtl ? 'rtl' : 'auto'}
      className="rounded-lg border border-[#e4e2f0] bg-[#f8f7fd] p-3 dark:border-white/[0.08] dark:bg-white/[0.035]"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles className="size-2.5 text-[#5a63df] dark:text-[#afb5ff]" />
        <span className={cn(MICRO, MUTED, 'text-[8.5px] tracking-wider')}>{title}</span>
      </div>
      <p className="text-[13px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">
        {text}
      </p>
    </div>
  );
}

function StructureList({ structures }) {
  if (!structures || structures.length === 0) return null;
  return (
    <div className="space-y-2 pt-0.5">
      <div className="flex items-center gap-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="size-2.5 text-[#5a63df] dark:text-[#afb5ff]" />
          <span className={cn(MICRO, MUTED, 'shrink-0 text-[8.5px] tracking-wider')}>
            Parts explained
          </span>
        </div>
        <div className="h-px flex-1 bg-[#e4e2f0] dark:bg-white/[0.07]" />
      </div>
      <div className="space-y-1.5">
        {structures.map((structure, index) => (
          <div
            key={`${structure.fragment}-${index}`}
            className="rounded-lg border border-[#e4e2f0]/90 bg-white p-2.5 shadow-2xs transition-colors dark:border-white/[0.08] dark:bg-white/[0.035]"
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  NUM,
                  'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold leading-none',
                  'bg-[#f0effa] text-[#5a63df] dark:bg-white/[0.08] dark:text-[#afb5ff]'
                )}
              >
                0{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-900 dark:text-slate-100">
                  &ldquo;{structure.fragment}&rdquo;
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {structure.explanation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownResult({ result }) {
  return (
    <div className="space-y-2.5">
      {result.coreIdea ? (
        <div className="rounded-lg border border-[#e4e2f0] bg-[#f8f7fd] p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-2.5 text-[#5a63df] dark:text-[#afb5ff]" />
              <span className={cn(MICRO, MUTED, 'text-[8.5px] tracking-wider')}>
                In simple words
              </span>
            </div>
            {result.tone ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#5a63df]/20 bg-[#5a63df]/[0.06] px-2 py-0.5 text-[9.5px] font-medium text-[#5a63df] dark:border-[#afb5ff]/25 dark:bg-[#afb5ff]/10 dark:text-[#afb5ff]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Tone:
                </span>
                <span className="capitalize">{result.tone}</span>
              </span>
            ) : null}
          </div>
          <p className="text-[13px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">
            {result.coreIdea}
          </p>
        </div>
      ) : null}

      {result.tone && !result.coreIdea ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#e4e2f0] bg-[#f8f7fd] px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Tone</span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
            {result.tone}
          </span>
        </div>
      ) : null}

      <StructureList structures={result.structures} />
    </div>
  );
}

function Result({ action, result, language }) {
  if (!result) return null;
  if (action === 'simplify') {
    return <SentenceResultCard title="Simplified sentence" text={result.simplified} />;
  }
  if (action === 'translate') {
    return <SentenceResultCard title="Translation" text={result.translated} language={language} />;
  }
  return <BreakdownResult result={result} />;
}

function ActionTabs({ currentAction, onActionChange }) {
  return (
    <div className="border-b border-[#e4e2f0] p-2 dark:border-white/[0.07]">
      <div className="flex rounded-lg bg-[#f2f1fa] p-0.5 dark:bg-white/[0.06] border border-[#e4e2f0]/70 dark:border-white/[0.07]">
        {ACTIONS.map(({ id, label, icon: Icon }) => {
          const active = currentAction === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onActionChange(id)}
              aria-pressed={active}
              className={cn(
                'relative flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-1.5 text-[11px] font-semibold transition-colors duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] cursor-pointer select-none',
                active
                  ? 'text-[#5a63df] dark:text-[#afb5ff]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeSentenceAssistantPill"
                  className="absolute inset-0 rounded-md bg-white shadow-xs dark:bg-[#1e1d27]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Icon
                  className={cn(
                    'size-3.5 transition-colors duration-150',
                    active
                      ? 'text-[#5a63df] dark:text-[#afb5ff]'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <span>{label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageSelect({ language, onLanguageChange }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <label
        htmlFor="reading-translation-language"
        className={cn(MICRO, MUTED, 'text-[8.5px] shrink-0 select-none')}
      >
        To
      </label>
      <div className="relative inline-flex items-center">
        <select
          id="reading-translation-language"
          aria-label="Translate to"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="h-6.5 appearance-none rounded-md border border-[#e4e2f0] bg-white pl-2 pr-5 text-[11.5px] font-semibold text-slate-800 shadow-2xs transition-colors hover:border-[#5a63df]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5a63df] dark:border-white/10 dark:bg-[#1b1a23] dark:text-slate-200 cursor-pointer"
        >
          {READING_TRANSLATION_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-slate-400 dark:text-slate-500" />
      </div>
    </div>
  );
}

function QuotaBanner({ action, status }) {
  const meteredLabel = QUOTA_LABELS[action];
  if (!meteredLabel) return null;
  const remaining =
    typeof status?.remainingByAction?.[action] === 'number'
      ? status.remainingByAction[action]
      : status?.remainingDailyQuota;
  if (typeof remaining !== 'number') return null;
  const freeAllowance = status?.freeDailyAssists ?? 5;
  const isWarn = remaining <= 1;

  return (
    <div
      className={cn(
        'inline-flex h-6.5 items-center gap-1.5 rounded-md border px-2 text-[10.5px] font-medium leading-none shrink-0 select-none transition-colors',
        isWarn
          ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-300'
          : 'border-[#5a63df]/20 bg-[#5a63df]/[0.06] text-[#5a63df] dark:border-[#afb5ff]/25 dark:bg-[#afb5ff]/10 dark:text-[#afb5ff]'
      )}
      title={`${remaining} of ${freeAllowance} free ${meteredLabel.toLowerCase()} left today`}
    >
      <span className="flex items-center gap-0.5">
        <span className={cn(NUM, 'font-bold')}>{remaining}</span>
        <span className="text-[10px] opacity-40">/</span>
        <span className={cn(NUM, 'text-[10.5px] opacity-70')}>{freeAllowance}</span>
      </span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">free today</span>
      <span className="sr-only">
        {remaining} of {freeAllowance} free {meteredLabel} left today
      </span>
    </div>
  );
}

function AssistantLoadingView() {
  return (
    <div
      className={cn(
        TILE,
        'flex items-center gap-2.5 p-3 dark:border-white/[0.08] dark:bg-white/[0.035]'
      )}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-4 animate-spin text-[#5a63df]" />
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        Preparing a clear explanation…
      </span>
    </div>
  );
}

function AssistantErrorView({ error, quotaExceeded, action }) {
  if (quotaExceeded) {
    const isBreakdown = action === 'breakdown';
    const otherAction = isBreakdown ? 'Translate' : 'Breakdown';

    return (
      <div
        className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-2.5 text-xs dark:border-amber-400/20 dark:bg-amber-400/[0.05]"
        role="alert"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <Sparkles className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-[11.5px] font-bold">Daily free limit reached</span>
          </div>
          <span className={cn(NUM, 'text-[9.5px] text-slate-400 dark:text-slate-500 shrink-0')}>
            Resets 00:00 UTC
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
          You&apos;ve used today&apos;s free {isBreakdown ? 'Breakdown' : 'Translate'} assists.
          Upgrade for unlimited access, or switch to {otherAction}.
        </p>

        <Link
          to="/pricing"
          className="group flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#5a63df] px-3 text-[11.5px] font-bold text-white shadow-xs transition-all duration-150 hover:bg-[#4d55cc] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="size-3.5 text-[#dcdfff] transition-transform group-hover:scale-110" />
          <span>Upgrade for Unlimited Assists</span>
          <ArrowRight className="size-3.5 text-[#dcdfff] transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        TILE,
        'space-y-1.5 p-2.5 text-xs dark:border-white/[0.08] dark:bg-white/[0.035]'
      )}
      role="alert"
    >
      <p className="font-semibold text-rose-600 dark:text-rose-400">{error}</p>
    </div>
  );
}

function AssistantBodyContent({ assistant, language }) {
  if (assistant.loading) {
    return <AssistantLoadingView />;
  }
  if (assistant.error) {
    return (
      <AssistantErrorView
        error={assistant.error}
        quotaExceeded={assistant.quotaExceeded}
        action={assistant.action}
      />
    );
  }
  return <Result action={assistant.action} result={assistant.result} language={language} />;
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

  const position = isMobile ? undefined : desktopPosition(assistant);
  const containerStyle = isMobile
    ? undefined
    : { left: position.left, top: position.top, width: position.width };

  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 z-[205] cursor-default" onClick={onClose} />
      <section
        className={cn(
          PANEL,
          'fixed z-[210] overflow-hidden shadow-xl shadow-slate-900/12 dark:shadow-black/50 border border-[#e4e2f0] dark:border-white/[0.08]',
          isMobile ? 'inset-x-3 bottom-3 max-h-[70vh]' : 'max-h-[min(380px,calc(100vh-24px))]'
        )}
        style={containerStyle}
        role="dialog"
        aria-label="Reading assistant"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e2f0] px-3.5 py-2.5 dark:border-white/[0.07]">
          <div>
            <div className="flex items-center gap-1">
              <Sparkles className="size-2.5 text-[#5a63df] dark:text-[#afb5ff]" />
              <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>Reading assistant</p>
            </div>
            <h3 className={cn(TITLE, 'mt-0.5 text-sm font-extrabold')}>Understand this sentence</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 place-items-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close Reading assistant"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Inset Segmented Control Bar with sliding pill animation */}
        <ActionTabs currentAction={assistant.action} onActionChange={onActionChange} />

        {/* Content Body with smooth tab crossfade */}
        <div className="custom-scrollbar max-h-[250px] overflow-y-auto p-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={assistant.action}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {assistant.action === 'translate' ? (
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <LanguageSelect language={language} onLanguageChange={onLanguageChange} />
                  <QuotaBanner action={assistant.action} status={status} />
                </div>
              ) : assistant.action === 'breakdown' ? (
                <div className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit className="size-3 text-[#5a63df] dark:text-[#afb5ff]" />
                    <span className={cn(MICRO, MUTED, 'text-[8.5px] tracking-wider')}>
                      Sentence breakdown
                    </span>
                  </div>
                  <QuotaBanner action={assistant.action} status={status} />
                </div>
              ) : null}

              <AssistantBodyContent assistant={assistant} language={language} />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
