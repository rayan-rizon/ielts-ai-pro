import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck,
  Check,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  Compass,
  FileText,
  Loader2,
  PenLine,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  MICRO,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';
import { AI_COACH_ENABLED, isRtlLanguage, takeCoachDraft } from '../config';
import {
  bootstrapCoach,
  checkCoachExercise,
  confirmCoachAction,
  deleteCoachConversation,
  executeConfirmedClientAction,
  loadCoachHistory,
  sendCoachMessage,
} from '../services/aiCoachService';

const STARTERS = [
  {
    icon: Compass,
    kicker: 'NEXT 15 MINUTES',
    label: 'Build a short practice plan',
    message: 'What should I practise in my next 15 minutes?',
  },
  {
    icon: FileText,
    kicker: 'LATEST RESULT',
    label: 'Explain my main gap',
    message: 'Explain the main issue in my latest result.',
  },
  {
    icon: ChartNoAxesCombined,
    kicker: 'RECENT SIGNALS',
    label: 'Show what is improving',
    message: 'What has improved in my recent practice?',
  },
  {
    icon: PenLine,
    kicker: 'QUICK PRACTICE',
    label: 'Give me one short exercise',
    message: 'Give me one short IELTS exercise.',
  },
];

const AVA_INTROS = [
  { lang: 'en', before: 'Meet ', accent: 'Ava' },
  { lang: 'bn', accent: 'আভার', after: ' সঙ্গে পরিচিত হোন' },
  { lang: 'hi', accent: 'एवा', after: ' से मिलिए' },
  { lang: 'ur', dir: 'rtl', accent: 'ایوا', after: ' سے ملیں' },
  { lang: 'ar', dir: 'rtl', before: 'تعرّف على ', accent: 'آفا' },
  { lang: 'zh-CN', before: '认识 ', accent: 'Ava' },
  { lang: 'es', before: 'Conoce a ', accent: 'Ava' },
];

const QUICK_SUGGESTIONS = [
  'Review my latest result',
  'Give me a speaking topic',
  'Explain an IELTS question',
  'Create a short study plan',
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#100f15]';

const EXERCISE_RESULT_LABELS = {
  en: { correct: 'Correct.', incorrect: 'Not quite.' },
  bn: { correct: 'সঠিক।', incorrect: 'এখনো সঠিক হয়নি।' },
  hi: { correct: 'सही।', incorrect: 'अभी सही नहीं।' },
  ur: { correct: 'درست۔', incorrect: 'ابھی درست نہیں۔' },
  ar: { correct: 'صحيح.', incorrect: 'ليست صحيحة بعد.' },
  ne: { correct: 'सही।', incorrect: 'अझै सही छैन।' },
  zh: { correct: '正确。', incorrect: '还不正确。' },
  vi: { correct: 'Đúng.', incorrect: 'Chưa đúng.' },
  es: { correct: 'Correcto.', incorrect: 'Aún no es correcto.' },
  tr: { correct: 'Doğru.', incorrect: 'Henüz doğru değil.' },
};

const formatReset = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(value))
    : '00:00 UTC';

const sortCoachMessages = (items = []) =>
  [...items].sort((a, b) => {
    const aTime = Date.parse(a.created_at || a.createdAt || '') || 0;
    const bTime = Date.parse(b.created_at || b.createdAt || '') || 0;
    if (aTime !== bTime) return aTime - bTime;
    if (a.role !== b.role) return a.role === 'user' ? -1 : 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

function CoachAvatar({ size = 'md', className, decorative = false }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-28 w-28 sm:h-36 sm:w-36',
    hero: 'h-44 w-44 sm:h-56 sm:w-56',
  };
  return (
    <span
      className={cn(
        'ai-coach-avatar relative inline-flex shrink-0',
        sizes[size] || sizes.md,
        className
      )}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'IELTS AI Coach avatar'}
      aria-hidden={decorative ? true : undefined}
    >
      <img
        src="/assets/ai-coach/ava.webp"
        alt=""
        width="800"
        height="800"
        decoding="async"
        className="h-full w-full object-cover"
        draggable="false"
      />
    </span>
  );
}

function CoachPulse({ compact = false }) {
  return (
    <div className={cn('ai-coach-pulse', compact && 'ai-coach-pulse--compact')} aria-hidden="true">
      <span className="ai-coach-pulse__ring ai-coach-pulse__ring--one" />
      <span className="ai-coach-pulse__ring ai-coach-pulse__ring--two" />
      <span className="ai-coach-pulse__dot ai-coach-pulse__dot--one" />
      <span className="ai-coach-pulse__dot ai-coach-pulse__dot--two" />
    </div>
  );
}

function CoachLoadingSkeleton() {
  return (
    <main
      className="ai-coach-canvas min-h-full p-3 text-slate-900 dark:text-white md:p-5"
      aria-busy="true"
      aria-label="Loading Ava coach"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-stretch gap-3">
        <aside
          className={cn(PANEL, 'order-3 col-span-12 flex min-h-[72vh] flex-col p-3 lg:col-span-3')}
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]"
              />
            ))}
          </div>
          <div className={cn(TILE, 'mt-auto h-24 animate-pulse')} />
        </aside>
        <section
          className={cn(
            PANEL,
            'relative order-2 col-span-12 flex min-h-[72vh] flex-col overflow-hidden lg:col-span-9'
          )}
        >
          <div className="flex items-center justify-between border-b border-[#e4e2f0] px-3 py-3 dark:border-white/[0.07] sm:px-5">
            <div className="flex items-center gap-3">
              <CoachAvatar size="sm" decorative />
              <div className="space-y-1.5">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
              </div>
            </div>
            <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
          </div>
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="flex w-full max-w-xl flex-col items-center gap-4">
              <div className="relative grid h-40 w-40 place-items-center">
                <CoachPulse compact />
                <CoachAvatar size="lg" decorative />
              </div>
              <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
              <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
            </div>
          </div>
          <div className="border-t border-[#e4e2f0] p-3 dark:border-white/[0.07] sm:p-4">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/[0.06]" />
          </div>
        </section>
      </div>
    </main>
  );
}

function AvaWelcome({ available, onSelect }) {
  return (
    <div className="ava-welcome mx-auto flex w-full max-w-4xl flex-col items-center text-center">
      <Pill tone="accent">PERSONAL IELTS COACH</Pill>
      <h2
        className="ava-display ava-greeting mt-3 text-3xl text-[#11163d] dark:text-white sm:text-5xl"
        aria-label="Meet Ava"
      >
        <span className="ava-greeting__stage" aria-hidden="true">
          {AVA_INTROS.map((intro, index) => (
            <span
              key={intro.lang}
              lang={intro.lang}
              dir={intro.dir || 'ltr'}
              className={cn(
                'ava-greeting__line',
                intro.lang === 'zh-CN' ? 'ava-greeting__line--cjk' : 'ava-greeting__line--spaced'
              )}
              style={{ '--ava-language-index': index }}
            >
              {intro.before}
              <span className="text-[#5a63df] dark:text-[#aeb3ff]">{intro.accent}</span>
              {intro.after}
            </span>
          ))}
        </span>
      </h2>
      <p className="mt-1 text-base font-semibold text-slate-500 dark:text-slate-400 sm:text-xl">
        Your personal IELTS coach
      </p>

      <div className="ava-welcome__stage">
        <CoachPulse />
        {STARTERS.map((starter, index) => {
          const Icon = starter.icon;
          const content = (
            <>
              <span className="ava-prompt__icon" aria-hidden="true">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>{starter.label}</span>
            </>
          );
          return available ? (
            <button
              type="button"
              key={starter.label}
              onClick={() => onSelect(starter.message)}
              className={cn(FOCUS_RING, `ava-prompt ava-prompt--${index + 1} ai-coach-starter`)}
              style={{
                '--coach-stagger': `${index * 80}ms`,
                '--coach-float-delay': `${index * -1.15}s`,
              }}
            >
              {content}
            </button>
          ) : (
            <div
              key={starter.label}
              className={`ava-prompt ava-prompt--${index + 1} ai-coach-starter`}
              style={{
                '--coach-stagger': `${index * 80}ms`,
                '--coach-float-delay': `${index * -1.15}s`,
              }}
            >
              {content}
            </div>
          );
        })}
        <div className="ava-welcome__portrait">
          <CoachAvatar size="hero" decorative />
          <span className="ava-spark ava-spark--one" aria-hidden="true">
            ✦
          </span>
          <span className="ava-spark ava-spark--two" aria-hidden="true">
            ✦
          </span>
        </div>
      </div>

      <p className={cn(MICRO, 'ava-welcome__motto text-[#59618a] dark:text-[#aeb3cf]')}>
        Ask <span aria-hidden="true">•</span> Practise <span aria-hidden="true">•</span> Improve
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e4e2f0] bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        Advice is linked to your learning evidence when available
      </div>
    </div>
  );
}

function EvidenceRefs({ refs = [] }) {
  if (!refs.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Evidence used">
      {refs.map((ref) => (
        <span
          key={`${ref.id}-${ref.claim}`}
          title={ref.claim}
          className="inline-flex max-w-full items-center gap-1 rounded-md border border-[#5a63df]/15 bg-[#5a63df]/[0.05] px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
        >
          <ShieldCheck className="h-3 w-3 shrink-0 text-[#5a63df]" />
          <span className="truncate">{ref.claim}</span>
        </span>
      ))}
    </div>
  );
}

function ActionButton({ action, onSelect, busy }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(action)}
      disabled={busy}
      className={cn(
        FOCUS_RING,
        'flex w-full items-center gap-2 rounded-lg border border-[#e4e2f0] bg-white px-3 py-2 text-left text-xs font-bold text-slate-700 transition-colors hover:border-[#5a63df]/35 hover:bg-[#faf9ff] disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.07]'
      )}
    >
      <ChevronRight className="h-3.5 w-3.5 text-[#5a63df]" />
      <span className="min-w-0 flex-1 truncate">{action.label}</span>
    </button>
  );
}

function inlineCoachText(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={`${part}-${index}`} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
      )
    );
}

function CoachAnswer({ content }) {
  const clean = String(content || '')
    .replace(/\s*【[\s\S]*?(?:】|\]\.)/gu, '')
    .replace(/```(?:markdown)?|```/giu, '')
    .trim();
  const blocks = [];
  let list = null;

  const finishList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  clean.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      finishList();
      return;
    }
    const bullet = line.match(/^[-•]\s+(.+)/u);
    const numbered = line.match(/^\d+[.)]\s+(.+)/u);
    if (bullet || numbered) {
      const type = numbered ? 'ol' : 'ul';
      if (list?.type !== type) {
        finishList();
        list = { type, items: [] };
      }
      list.items.push((bullet || numbered)[1]);
      return;
    }
    finishList();
    blocks.push({ type: 'p', text: line });
  });
  finishList();

  return (
    <div className="coach-answer space-y-2.5">
      {blocks.map((block, index) => {
        if (block.type === 'p')
          return <p key={`${block.text}-${index}`}>{inlineCoachText(block.text)}</p>;
        const List = block.type;
        return (
          <List
            key={`${block.type}-${index}`}
            className={cn('space-y-1.5 ps-5', block.type === 'ol' ? 'list-decimal' : 'list-disc')}
          >
            {block.items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`} className="ps-0.5 marker:text-[#5a63df]">
                {inlineCoachText(item)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

function CoachExercise({ exercise, messageId, responseLanguage }) {
  const [checking, setChecking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const multipleChoice = exercise.kind === 'multiple_choice' && exercise.options?.length;
  const resultLabels = EXERCISE_RESULT_LABELS[responseLanguage] || EXERCISE_RESULT_LABELS.en;

  const check = async (index) => {
    if (checking || result) return;
    setSelected(index);
    setChecking(true);
    try {
      setResult(await checkCoachExercise(messageId, index));
    } catch (error) {
      setSelected(null);
      toast.error(error.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={cn(TILE, 'mt-3 p-3')} dir="ltr">
      <span className={cn(MICRO, 'text-[#5a63df]')}>Try this</span>
      <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {exercise.prompt}
      </p>
      {multipleChoice ? (
        <div className="mt-2 space-y-1.5">
          {exercise.options.map((option, index) => (
            <button
              key={`${messageId}-${index}`}
              type="button"
              onClick={() => check(index)}
              disabled={checking || Boolean(result)}
              aria-pressed={selected === index}
              className={cn(
                FOCUS_RING,
                'block w-full rounded-lg border px-2.5 py-2 text-left text-xs font-semibold',
                selected === index
                  ? 'border-[#5a63df] bg-[#5a63df]/10'
                  : 'border-[#e4e2f0] bg-white dark:border-white/10 dark:bg-white/[0.03]'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Write your answer in the chat for coach feedback. This uses one reply.
        </p>
      )}
      {result ? (
        <div
          className={cn(
            'mt-2 rounded-lg px-2.5 py-2 text-xs font-semibold',
            result.correct
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200'
              : 'bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100'
          )}
          dir={isRtlLanguage(responseLanguage) ? 'rtl' : 'ltr'}
          role="status"
        >
          {result.correct ? resultLabels.correct : resultLabels.incorrect} {result.explanation}
        </div>
      ) : null}
    </div>
  );
}

function CoachMessage({ message, onAction, actionBusy }) {
  const assistant = message.role === 'assistant';
  const rtl = assistant && isRtlLanguage(message.responseLanguage || message.response_language);
  const refs = message.evidenceRefs || message.evidence_refs || [];
  return (
    <article className={cn('flex gap-2.5', assistant ? 'justify-start' : 'justify-end')}>
      {assistant ? <CoachAvatar size="sm" className="mt-1" decorative /> : null}
      <div
        className={cn(
          'ai-coach-message max-w-[min(88%,46rem)] rounded-xl border px-3.5 py-3 text-sm leading-6',
          assistant
            ? 'border-[#e4e2f0] bg-white text-slate-700 dark:border-white/[0.07] dark:bg-[#151419] dark:text-slate-200'
            : 'border-[#5a63df] bg-[#5a63df] text-white'
        )}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        {assistant ? (
          <CoachAnswer content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        {assistant && message.exercise ? (
          <CoachExercise
            exercise={message.exercise}
            messageId={message.id}
            responseLanguage={message.responseLanguage || message.response_language}
          />
        ) : null}
        {assistant ? <EvidenceRefs refs={refs} /> : null}
        {assistant && message.actions?.length ? (
          <div className="mt-3 space-y-1.5" dir="ltr">
            {message.actions.map((action) => (
              <ActionButton key={action.id} action={action} onSelect={onAction} busy={actionBusy} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ActionConfirmation({ action, onCancel, onConfirm, busy }) {
  if (!action || action.type === 'navigate') return null;
  const summary =
    action.type === 'save_vocabulary'
      ? `Save “${action.payload?.word}” to your vocabulary?`
      : `Move “${action.payload?.title || 'this activity'}” to ${action.payload?.scheduledDate || 'the suggested date'}?`;
  return (
    <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-[#5a63df]/25 bg-white p-3 dark:bg-[#151419]">
      <span className={cn(MICRO, 'text-[#5a63df]')}>Confirm change</span>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{summary}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            FOCUS_RING,
            'rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10'
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={cn(
            FOCUS_RING,
            'inline-flex items-center gap-1.5 rounded-lg bg-[#5a63df] px-3 py-2 text-xs font-bold text-white disabled:opacity-60'
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}{' '}
          Confirm
        </button>
      </div>
    </div>
  );
}

export default function AiCoach() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState({
    loading: true,
    error: null,
    status: null,
    conversations: [],
    preferredLanguage: 'en',
  });
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [draft, setDraft] = useState('');
  const [sourceReference, setSourceReference] = useState(null);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [switchingConversation, setSwitchingConversation] = useState(false);
  const endRef = useRef(null);
  const recoveryRef = useRef(null);
  const composerRef = useRef(null);
  const conversationCacheRef = useRef(new Map());
  const historyRequestRef = useRef(0);

  useEffect(() => {
    if (!AI_COACH_ENABLED) {
      setState((current) => ({
        ...current,
        loading: false,
        status: { enabled: false, budgetAvailable: true, remainingDailyReplies: null },
      }));
      return undefined;
    }
    let active = true;
    bootstrapCoach()
      .then((data) => {
        if (!active) return;
        setState({
          loading: false,
          error: null,
          status: data.status,
          conversations: data.conversations,
          preferredLanguage: data.preferredLanguage,
        });
        const savedDraft = takeCoachDraft();
        if (savedDraft) {
          setDraft(savedDraft.message || '');
          setSourceReference(savedDraft.sourceReference || null);
        }
      })
      .catch(
        (error) =>
          active && setState((current) => ({ ...current, loading: false, error: error.message }))
      );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const selectConversation = async (id) => {
    if (!id || id === conversationId) return;
    const requestId = ++historyRequestRef.current;
    setConversationId(id);
    const cached = conversationCacheRef.current.get(id);
    if (cached) {
      setMessages(cached.messages);
      setNextBefore(cached.nextBefore);
      setSwitchingConversation(false);
      return;
    }
    setSwitchingConversation(true);
    try {
      const data = await loadCoachHistory(id);
      if (requestId !== historyRequestRef.current) return;
      const orderedMessages = sortCoachMessages(data.messages || []);
      const nextCursor = data.nextBefore || null;
      conversationCacheRef.current.set(id, {
        messages: orderedMessages,
        nextBefore: nextCursor,
      });
      setMessages(orderedMessages);
      setNextBefore(nextCursor);
    } catch (error) {
      if (requestId === historyRequestRef.current) toast.error(error.message);
    } finally {
      if (requestId === historyRequestRef.current) setSwitchingConversation(false);
    }
  };

  const loadEarlier = async () => {
    if (!conversationId || !nextBefore) return;
    try {
      const data = await loadCoachHistory(conversationId, nextBefore);
      const earlierMessages = sortCoachMessages(data.messages || []);
      setMessages((current) => {
        const nextMessages = sortCoachMessages([...earlierMessages, ...current]);
        conversationCacheRef.current.set(conversationId, {
          messages: nextMessages,
          nextBefore: data.nextBefore || null,
        });
        return nextMessages;
      });
      setNextBefore(data.nextBefore || null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submit = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending || !state.status?.enabled) return;
    setDraft('');
    setSending(true);
    conversationCacheRef.current.delete(conversationId);
    const recovery = recoveryRef.current?.text === text ? recoveryRef.current : null;
    const requestId = recovery?.requestId || crypto.randomUUID();
    const optimisticId = `local-${requestId}`;
    setMessages((current) => [...current, { id: optimisticId, role: 'user', content: text }]);
    try {
      const result = await sendCoachMessage({
        requestId,
        conversationId,
        message: text,
        preferredLanguage: state.preferredLanguage,
        sourceReference,
      });
      const nextConversationId = result.conversationId || conversationId;
      setConversationId(nextConversationId);
      recoveryRef.current = null;
      setSourceReference(null);
      const assistantMessage = {
        id: result.messageId,
        role: 'assistant',
        content: result.answer,
        responseLanguage: result.responseLanguage,
        evidenceRefs: result.evidenceRefs,
        exercise: result.exercise,
        actions: result.actions || [],
      };
      setMessages((current) => {
        const nextMessages = [...current, assistantMessage];
        conversationCacheRef.current.set(nextConversationId, {
          messages: nextMessages,
          nextBefore,
        });
        return nextMessages;
      });
      setState((current) => ({
        ...current,
        status: {
          ...current.status,
          remainingDailyReplies: result.remainingDailyReplies,
          quotaResetsAt: result.quotaResetsAt || current.status?.quotaResetsAt,
        },
        conversations: current.conversations.some((item) => item.id === nextConversationId)
          ? current.conversations
          : [
              {
                id: nextConversationId,
                title: text.slice(0, 80),
                last_message_at: new Date().toISOString(),
              },
              ...current.conversations,
            ],
      }));
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      recoveryRef.current = error.requestOutcomeUnknown ? { requestId, text } : null;
      setDraft(text);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const executeAction = async (action) => {
    if (action.type !== 'navigate') {
      setPendingAction(action);
      return;
    }
    setActionBusy(true);
    try {
      const result = await confirmCoachAction(action.id);
      navigate(result.payload.route);
    } catch (error) {
      toast.error(error.message);
      setActionBusy(false);
    }
  };

  const confirmPending = async () => {
    setActionBusy(true);
    try {
      const result = await confirmCoachAction(pendingAction.id);
      await executeConfirmedClientAction(result);
      toast.success(
        result.action === 'save_vocabulary' ? 'Saved to Vocabulary' : 'Study activity rescheduled'
      );
      setPendingAction(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionBusy(false);
    }
  };

  const removeConversation = async (id) => {
    try {
      await deleteCoachConversation(id);
      conversationCacheRef.current.delete(id);
      setState((current) => ({
        ...current,
        conversations: current.conversations.filter((item) => item.id !== id),
      }));
      if (conversationId === id) {
        historyRequestRef.current += 1;
        setConversationId(null);
        setMessages([]);
        setNextBefore(null);
        setSwitchingConversation(false);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remaining =
    typeof state.status?.remainingDailyReplies === 'number'
      ? state.status.remainingDailyReplies
      : null;
  const canSend =
    state.status?.enabled && state.status?.budgetAvailable !== false && Number(remaining) > 0;
  const viewMotion = reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] };
  const prepareDraft = (message) => {
    setDraft(message);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  if (state.loading) return <CoachLoadingSkeleton />;

  return (
    <main className="ai-coach-canvas min-h-full p-3 text-slate-900 dark:text-white md:p-5">
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 items-stretch gap-3">
        <aside
          className={cn(
            PANEL,
            'order-3 col-span-12 flex h-full flex-col p-3 lg:col-span-3 lg:min-h-[72vh]'
          )}
        >
          <div className="flex items-center justify-between">
            <PanelTitle label="Saved conversations" />
            <button
              type="button"
              onClick={() => {
                historyRequestRef.current += 1;
                setConversationId(null);
                setMessages([]);
                setNextBefore(null);
                setSwitchingConversation(false);
              }}
              className={cn(
                FOCUS_RING,
                'grid h-8 w-8 place-items-center rounded-lg border border-[#e4e2f0] text-[#5a63df] dark:border-white/10'
              )}
              aria-label="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {state.conversations.length ? (
              state.conversations.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'group flex items-center rounded-lg',
                    conversationId === item.id
                      ? 'bg-[#5a63df]/10'
                      : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectConversation(item.id)}
                    className={cn(
                      FOCUS_RING,
                      'min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-left text-xs font-semibold'
                    )}
                  >
                    {item.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeConversation(item.id)}
                    className={cn(
                      FOCUS_RING,
                      'mr-1 grid h-7 w-7 place-items-center rounded-md text-slate-400 opacity-0 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100'
                    )}
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="px-2 py-4 text-xs text-slate-500">
                Your saved conversations will appear here.
              </p>
            )}
          </div>
          <div className={cn(TILE, 'mt-3 p-3')}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className={MICRO}>Evidence first</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Your coach uses completed results when they are relevant and says when evidence is
              missing.
            </p>
          </div>
        </aside>

        <section
          className={cn(
            PANEL,
            'relative order-2 col-span-12 flex h-full min-h-[72vh] flex-col overflow-hidden lg:col-span-9'
          )}
        >
          <div className="ava-coach-bar flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e2f0] px-3 py-3 dark:border-white/[0.07] sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <CoachAvatar size="sm" decorative />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="ava-display truncate text-base text-[#11163d] dark:text-white sm:text-lg">
                    Ava
                  </h1>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-[10px] font-bold',
                      state.status?.enabled
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-amber-700 dark:text-amber-300'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        state.status?.enabled ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                      aria-hidden="true"
                    />
                    {state.status?.enabled ? 'Online' : 'Getting ready'}
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Personal IELTS coach
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {state.status?.enabled ? (
                <>
                  {remaining === 0 ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                      title="Daily reply reset time"
                    >
                      <Clock3 className="h-3.5 w-3.5 text-[#5a63df]" aria-hidden="true" />
                      Resets {formatReset(state.status?.quotaResetsAt)}
                    </span>
                  ) : null}
                  <Pill tone={remaining > 2 ? 'emerald' : 'amber'} className="shrink-0">
                    {remaining} replies left
                  </Pill>
                </>
              ) : (
                <Pill tone="amber" className="shrink-0">
                  Not live yet
                </Pill>
              )}
            </div>
          </div>
          <div
            className={cn(
              'relative flex-1 space-y-4 overflow-y-auto p-3 [content-visibility:auto] sm:p-5',
              switchingConversation && 'ai-coach-conversation-switching'
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {state.error ? (
                <motion.div
                  key="coach-error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={viewMotion}
                  className="ai-coach-empty mx-auto flex max-w-xl flex-col items-center py-12 text-center"
                >
                  <div className="ai-coach-empty__stage">
                    <CoachPulse />
                    <CoachAvatar size="lg" decorative />
                  </div>
                  <span className={cn(MICRO, 'mt-5 text-rose-600 dark:text-rose-300')}>
                    TEMPORARILY UNAVAILABLE
                  </span>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                    Your coach needs a moment
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {state.error}
                  </p>
                </motion.div>
              ) : messages.length === 0 ? (
                <motion.div
                  key="coach-welcome"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.985, y: -8 }}
                  transition={viewMotion}
                  className="ai-coach-empty flex min-h-full items-center py-6 sm:py-8"
                >
                  <AvaWelcome available={Boolean(state.status?.enabled)} onSelect={prepareDraft} />
                </motion.div>
              ) : (
                <motion.div
                  key="coach-conversation"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={viewMotion}
                  className="space-y-4"
                >
                  {nextBefore ? (
                    <button
                      type="button"
                      onClick={loadEarlier}
                      className={cn(
                        FOCUS_RING,
                        'mx-auto block rounded-lg border border-[#e4e2f0] px-3 py-1.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300'
                      )}
                    >
                      Load earlier messages
                    </button>
                  ) : null}
                  {messages.map((message) => (
                    <CoachMessage
                      key={message.id}
                      message={message}
                      onAction={executeAction}
                      actionBusy={actionBusy}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {switchingConversation ? (
              <div className="ai-coach-switching-indicator" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin text-[#5a63df]" />
                Opening conversation…
              </div>
            ) : null}
            {sending ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#5a63df]" />
                Checking your learning evidence…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={submit}
            className="border-t border-[#e4e2f0] bg-white p-3 dark:border-white/[0.07] dark:bg-[#121116] sm:p-4"
          >
            {sourceReference ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#5a63df]/[0.07] px-2.5 py-2 text-xs font-semibold text-[#4a52c9] dark:text-[#c3c7ff]">
                <BookOpenCheck className="h-4 w-4" />
                <span className="flex-1">A completed result is attached for context.</span>
                <button
                  type="button"
                  onClick={() => setSourceReference(null)}
                  aria-label="Remove result"
                  className={cn(FOCUS_RING, 'rounded-md text-[#4a52c9] dark:text-[#c3c7ff]')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="ava-composer rounded-2xl border border-[#d9d7e7] bg-[#faf9ff] p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3 px-1 pb-1.5">
                <label
                  htmlFor="ava-coach-message"
                  className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#4a52c9] dark:text-[#b9bdff]"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  Ask Ava
                </label>
                <span className="text-[10px] font-semibold text-slate-400">
                  Replies in your language
                </span>
              </div>
              <div className="flex items-end gap-2 rounded-xl bg-white px-2 py-1.5 dark:bg-[#151419]">
                <textarea
                  ref={composerRef}
                  id="ava-coach-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  dir="auto"
                  rows={1}
                  maxLength={2000}
                  disabled={!canSend || sending}
                  aria-describedby="ava-language-note"
                  placeholder={
                    !state.status?.enabled
                      ? 'Ava will be available when the coach is enabled'
                      : canSend
                        ? 'Ask anything about your IELTS practice…'
                        : state.status?.budgetAvailable === false
                          ? 'AI replies are temporarily unavailable'
                          : 'Daily replies are unavailable'
                  }
                  className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-base leading-6 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !canSend || sending}
                  className={cn(
                    FOCUS_RING,
                    'ava-send-button grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#5a63df] text-white active:scale-95 disabled:opacity-40'
                  )}
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 translate-x-px" strokeWidth={2.2} />
                  )}
                </button>
              </div>
              <div
                id="ava-language-note"
                className="flex items-center justify-between gap-3 px-1 pt-1.5 text-[10px] font-medium text-slate-400"
              >
                <span>Ava detects your language. She will tell you if it is not supported.</span>
                <span className={cn(NUM, 'shrink-0')}>{draft.length}/2000</span>
              </div>
            </div>
            {state.status?.enabled ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 px-1">
                <span className="mr-1 text-[10px] font-bold text-slate-400">Try these:</span>
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => prepareDraft(suggestion)}
                    disabled={!canSend || sending}
                    className={cn(
                      FOCUS_RING,
                      'rounded-full border border-[#dedcec] bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-[#5a63df]/40 hover:bg-[#5a63df]/[0.05] hover:text-[#4a52c9] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.07]'
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-center text-[10px] font-medium text-slate-400">
              Chat practice does not change official IELTS scores. Check important decisions against
              your test instructions.
            </p>
          </form>
          <ActionConfirmation
            action={pendingAction}
            onCancel={() => setPendingAction(null)}
            onConfirm={confirmPending}
            busy={actionBusy}
          />
        </section>
      </div>
    </main>
  );
}
