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
  MessageCircle,
  Mic2,
  PenLine,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Headphones,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MICRO, NUM, PANEL, Pill, TILE } from '@/features/dashboard/components/primitives';
import { AI_COACH_ENABLED, isRtlLanguage, takeCoachDraft } from '../config';
import { EvidenceRefs } from '../components/EvidenceRefs.jsx';
import WavingCoachArtwork from '../components/WavingCoachArtwork.jsx';
import {
  coachFollowUps,
  coachTopic,
  groupCoachConversations,
} from '../utils/coachConversationUi.js';
import {
  bootstrapCoach,
  checkCoachExercise,
  confirmCoachAction,
  deleteCoachConversation,
  executeConfirmedClientAction,
  getCoachSourcePreview,
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

const CONVERSATION_TOPICS = {
  writing: { icon: PenLine, description: 'Continue your writing practice' },
  speaking: { icon: Mic2, description: 'Continue your speaking practice' },
  reading: { icon: BookOpenCheck, description: 'Continue your reading practice' },
  listening: { icon: Headphones, description: 'Continue your listening practice' },
  plan: { icon: Compass, description: 'Continue your study plan' },
  general: { icon: MessageCircle, description: 'Continue this conversation' },
};

const conversationTime = (value, today = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(
    undefined,
    today ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' }
  ).format(date);
};

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

function CoachAvatar({ size = 'md', className, decorative = false, waving = false }) {
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
      {waving ? (
        <WavingCoachArtwork hero />
      ) : (
        <img
          src="/assets/ai-coach/ava.webp"
          alt=""
          width="800"
          height="800"
          decoding="async"
          className="h-full w-full object-cover"
          draggable="false"
        />
      )}
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
      <div className="ai-coach-layout mx-auto grid w-full max-w-[1680px] grid-cols-12 items-stretch gap-3">
        <aside className={cn(PANEL, 'order-3 col-span-12 flex min-h-[72vh] flex-col p-3')}>
          <div className="h-11 w-full animate-pulse rounded-xl bg-[#5a63df]/20" />
          <div className="mt-5 flex items-center justify-between">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex h-16 items-center gap-2.5 rounded-xl p-2">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
                  <div className="h-2.5 w-3/5 animate-pulse rounded bg-slate-100 dark:bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
          <div className={cn(TILE, 'mt-auto h-24 animate-pulse')} />
        </aside>
        <section
          className={cn(
            PANEL,
            'relative order-2 col-span-12 flex h-[calc(100dvh-1.5rem)] min-h-[36rem] flex-col overflow-hidden'
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
          <CoachAvatar size="hero" decorative waving />
          <span className="ava-welcome__wave-mark" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none">
              <path d="M5 19c4-2 6-5 7-9M13 22c5-3 8-7 9-13" />
            </svg>
          </span>
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
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return (
          <strong key={`${part}-${index}`} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      if (part.startsWith('*') && part.endsWith('*')) {
        const value = part.slice(1, -1);
        return value.endsWith(':') ? (
          <strong key={`${part}-${index}`} className="font-semibold text-slate-900 dark:text-white">
            {value}
          </strong>
        ) : (
          <em key={`${part}-${index}`} className="font-medium">
            {value}
          </em>
        );
      }
      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
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

  const lines = clean.split(/\r?\n/);
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      const nextLine =
        lines
          .slice(index + 1)
          .find((candidate) => candidate.trim())
          ?.trim() || '';
      const nextIsSameList =
        (list?.type === 'ol' && /^(?:\d+[.)]|\d\uFE0F?\u20E3)\s+/u.test(nextLine)) ||
        (list?.type === 'ul' && /^[-•]\s+/u.test(nextLine));
      if (nextIsSameList) return;
      finishList();
      return;
    }
    const bullet = line.match(/^[-•]\s+(.+)/u);
    const numbered = line.match(/^(?:\d+[.)]|\d\uFE0F?\u20E3)\s+(.+)/u);
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
    const heading = line.match(/^(?:#{1,3}\s+(.+)|\*\*([^*]+)\*\*)$/u);
    blocks.push(
      heading ? { type: 'heading', text: heading[1] || heading[2] } : { type: 'p', text: line }
    );
  });
  finishList();

  return (
    <div className="coach-answer space-y-2.5">
      {blocks.map((block, index) => {
        if (block.type === 'heading')
          return (
            <h3
              key={`${block.text}-${index}`}
              className="pt-1 text-sm font-bold text-slate-900 dark:text-white"
            >
              {inlineCoachText(block.text)}
            </h3>
          );
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

function LearnerAvatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user?.avatar_url || user?.user_metadata?.avatar_url;
  const name = user?.full_name || user?.user_metadata?.full_name || user?.username || 'You';
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="mt-5 grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-[#dcdcff] bg-[#eeeeff] text-xs font-extrabold text-[#4a52c9] dark:border-[#777deb]/30 dark:bg-[#5a63df]/20 dark:text-[#c3c7ff]"
    >
      {avatarUrl && !imageFailed ? (
        <img
          src={avatarUrl}
          alt=""
          width="32"
          height="32"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}

function CoachMessage({ message, onAction, actionBusy, user }) {
  const assistant = message.role === 'assistant';
  const rtl = assistant && isRtlLanguage(message.responseLanguage || message.response_language);
  const refs = message.evidenceRefs || message.evidence_refs || [];
  const sentAt = message.created_at || message.createdAt;
  return (
    <article
      className={cn('flex items-start gap-2.5', assistant ? 'justify-start' : 'justify-end')}
    >
      {assistant ? <CoachAvatar size="sm" className="mt-5" decorative /> : null}
      <div
        className={cn(
          'flex min-w-0 max-w-[min(88%,48rem)] flex-col gap-1',
          !assistant && 'items-end'
        )}
      >
        <span className={cn(MICRO, 'px-1 text-slate-400 dark:text-slate-500')}>
          {assistant ? 'Ava' : 'You'}
        </span>
        <div
          className={cn(
            'ai-coach-message w-fit max-w-full rounded-2xl border px-4 py-3 text-sm leading-6',
            assistant
              ? 'border-[#e4e2f0] bg-[#f7f7fc] text-slate-700 dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-slate-200'
              : 'border-[#dcdcff] bg-[#eeeeff] text-[#252b67] dark:border-[#777deb]/30 dark:bg-[#5a63df]/20 dark:text-[#e3e5ff]'
          )}
          dir={rtl ? 'rtl' : 'auto'}
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
                <ActionButton
                  key={action.id}
                  action={action}
                  onSelect={onAction}
                  busy={actionBusy}
                />
              ))}
            </div>
          ) : null}
        </div>
        {sentAt ? (
          <time className={cn(NUM, 'px-1 text-[10px] text-slate-400')} dateTime={sentAt}>
            {conversationTime(sentAt, true)}
          </time>
        ) : null}
      </div>
      {!assistant ? (
        <LearnerAvatar
          key={user?.avatar_url || user?.user_metadata?.avatar_url || 'initials'}
          user={user}
        />
      ) : null}
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
  const { user } = useAuth();
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
  const [historySearch, setHistorySearch] = useState('');
  const [showHistorySearch, setShowHistorySearch] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [preview, setPreview] = useState(null);
  const chatScrollRef = useRef(null);
  const chatPanelRef = useRef(null);
  const historyPanelRef = useRef(null);
  const recoveryRef = useRef(null);
  const composerRef = useRef(null);
  const conversationCacheRef = useRef(new Map());
  const historyRequestRef = useRef(0);
  // The exact text of an app-written English draft. Sent unedited, it follows the
  // learner's saved language instead of the language of its wording.
  const cannedDraftRef = useRef(null);

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
          cannedDraftRef.current = savedDraft.canned ? savedDraft.message || '' : null;
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
    const scrollToLatest = () => {
      if (chatScrollRef.current)
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    };
    const frame = requestAnimationFrame(scrollToLatest);
    const timer = window.setTimeout(scrollToLatest, 300);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [messages, sending, switchingConversation]);

  // A deterministic summary of the attached result, with questions worth asking.
  // It needs no AI call and no reply from the daily allowance.
  useEffect(() => {
    if (!sourceReference?.id || !AI_COACH_ENABLED) {
      setPreview(null);
      return undefined;
    }
    let active = true;
    getCoachSourcePreview(sourceReference.id)
      .then((data) => active && setPreview(data?.preview || null))
      .catch(() => active && setPreview(null));
    return () => {
      active = false;
    };
  }, [sourceReference?.id]);

  const selectConversation = async (id) => {
    if (!id || id === conversationId) return;
    if (window.matchMedia?.('(max-width: 899px)').matches) {
      requestAnimationFrame(() => chatPanelRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
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

  const sendMessage = async (messageText, { canned = false, questionNumber = null } = {}) => {
    const text = messageText.trim();
    if (!text || sending || switchingConversation || !canSend) return;
    const useSavedLanguage = canned || cannedDraftRef.current === text;
    cannedDraftRef.current = null;
    setDraft('');
    setSending(true);
    setStreamingText('');
    conversationCacheRef.current.delete(conversationId);
    const recovery = recoveryRef.current?.text === text ? recoveryRef.current : null;
    const requestId = recovery?.requestId || crypto.randomUUID();
    const optimisticId = `local-${requestId}`;
    const sentAt = new Date().toISOString();
    setMessages((current) => [
      ...current,
      { id: optimisticId, role: 'user', content: text, createdAt: sentAt },
    ]);
    try {
      const result = await sendCoachMessage({
        requestId,
        conversationId,
        message: text,
        preferredLanguage: state.preferredLanguage,
        sourceReference:
          sourceReference && questionNumber
            ? { ...sourceReference, questionNumber }
            : sourceReference,
        languageHint: useSavedLanguage ? 'preference' : undefined,
        onDelta: (segment) => setStreamingText((current) => current + segment),
        onReset: () => setStreamingText(''),
      });
      const nextConversationId = result.conversationId || conversationId;
      setConversationId(nextConversationId);
      recoveryRef.current = null;
      setStreamingText('');
      const assistantMessage = {
        id: result.messageId,
        role: 'assistant',
        content: result.answer,
        responseLanguage: result.responseLanguage,
        evidenceRefs: result.evidenceRefs,
        exercise: result.exercise,
        actions: result.actions || [],
        followUps: result.followUps || [],
        createdAt: new Date().toISOString(),
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
      setStreamingText('');
      setDraft(text);
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const submit = (event) => {
    event?.preventDefault();
    sendMessage(draft);
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
  const followUps = coachFollowUps(messages);
  const matchingConversations = state.conversations.filter((item) =>
    (item.title || '').toLocaleLowerCase().includes(historySearch.trim().toLocaleLowerCase())
  );
  const conversationGroups = groupCoachConversations(matchingConversations);
  const viewMotion = reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.2, 0, 0, 1] };
  const prepareDraft = (message) => {
    cannedDraftRef.current = message;
    setDraft(message);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  if (state.loading) return <CoachLoadingSkeleton />;

  return (
    <main className="ai-coach-canvas min-h-full p-3 text-slate-900 dark:text-white md:p-5">
      <div className="ai-coach-layout mx-auto grid w-full max-w-[1680px] grid-cols-12 items-stretch gap-3">
        <aside
          ref={historyPanelRef}
          className={cn(PANEL, 'order-3 col-span-12 flex h-full min-w-0 flex-col p-3')}
        >
          <button
            type="button"
            onClick={() => {
              historyRequestRef.current += 1;
              setConversationId(null);
              setMessages([]);
              setNextBefore(null);
              setSwitchingConversation(false);
              if (window.matchMedia?.('(max-width: 899px)').matches) {
                requestAnimationFrame(() =>
                  chatPanelRef.current?.scrollIntoView({ behavior: 'smooth' })
                );
              }
              requestAnimationFrame(() => composerRef.current?.focus());
            }}
            className={cn(
              FOCUS_RING,
              'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5a63df] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#4d56d4] active:scale-[0.99]'
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New conversation
          </button>
          <div className="mt-5 flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Saved conversations
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowHistorySearch((current) => !current);
                setHistorySearch('');
              }}
              aria-label={showHistorySearch ? 'Close conversation search' : 'Search conversations'}
              aria-expanded={showHistorySearch}
              className={cn(
                FOCUS_RING,
                'grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/[0.07]'
              )}
            >
              {showHistorySearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
          {showHistorySearch ? (
            <input
              type="search"
              autoFocus
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search recent chats"
              aria-label="Search recent conversations"
              className={cn(
                FOCUS_RING,
                'mt-2 h-9 w-full rounded-lg border border-[#e4e2f0] bg-white px-3 text-xs outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-white/[0.04]'
              )}
            />
          ) : null}
          <div className="mt-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {conversationGroups.length ? (
              conversationGroups.map((group) => (
                <div key={group.label}>
                  <h3 className={cn(MICRO, 'mb-2 px-2 text-slate-400 dark:text-slate-500')}>
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const topic = CONVERSATION_TOPICS[coachTopic(item.title)];
                      const Icon = topic.icon;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'group flex min-w-0 items-start gap-1 rounded-xl border transition-colors',
                            conversationId === item.id
                              ? 'border-[#5a63df]/20 bg-[#5a63df]/[0.07] dark:bg-[#5a63df]/[0.14]'
                              : 'border-transparent hover:border-[#e4e2f0] hover:bg-[#f7f6fc] dark:hover:border-white/10 dark:hover:bg-white/[0.04]'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => selectConversation(item.id)}
                            aria-label={`Open ${item.title || 'untitled conversation'}`}
                            aria-current={conversationId === item.id ? 'page' : undefined}
                            className={cn(
                              FOCUS_RING,
                              'flex min-w-0 flex-1 items-start gap-2.5 rounded-xl px-2.5 py-3 text-left'
                            )}
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e4e2f0] bg-white text-[#5a63df] dark:border-white/10 dark:bg-white/[0.06]">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100"
                                title={item.title}
                              >
                                {item.title || 'Untitled conversation'}
                              </span>
                              <span className="mt-1 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {topic.description}
                              </span>
                            </span>
                            <time
                              className={cn(NUM, 'shrink-0 text-[10px] text-slate-400')}
                              dateTime={item.last_message_at}
                            >
                              {conversationTime(item.last_message_at, group.label === 'Today')}
                            </time>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeConversation(item.id)}
                            className={cn(
                              FOCUS_RING,
                              'mr-1 mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 opacity-0 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100'
                            )}
                            aria-label={`Delete ${item.title || 'conversation'}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="px-2 py-4 text-xs text-slate-500">
                {historySearch
                  ? 'No recent conversations match your search.'
                  : 'Your saved conversations will appear here.'}
              </p>
            )}
          </div>
        </aside>

        <section
          ref={chatPanelRef}
          className={cn(
            PANEL,
            'relative order-2 col-span-12 flex h-[calc(100dvh-1.5rem)] min-h-[36rem] flex-col overflow-hidden'
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
              <button
                type="button"
                onClick={() => historyPanelRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className={cn(
                  FOCUS_RING,
                  'inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] px-2.5 py-1.5 text-[11px] font-bold text-[#4a52c9] min-[900px]:hidden dark:border-white/10 dark:text-[#c3c7ff]'
                )}
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Chats
              </button>
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
            ref={chatScrollRef}
            className={cn(
              'relative flex-1 space-y-4 overflow-y-auto p-3 sm:p-5',
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
                      user={user}
                    />
                  ))}
                  {followUps.length ? (
                    <div
                      className="ai-coach-follow-ups pl-10"
                      role="group"
                      aria-label="Suggested follow-up questions"
                    >
                      <p
                        className={cn(
                          MICRO,
                          'mb-2 flex items-center gap-1.5 text-[#5a63df] dark:text-[#b9bdff]'
                        )}
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Keep going
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {followUps.map((question) => (
                          <button
                            key={question}
                            type="button"
                            dir="auto"
                            onClick={() => sendMessage(question)}
                            disabled={!canSend || sending || switchingConversation}
                            className={cn(
                              FOCUS_RING,
                              'rounded-full border border-[#dedcec] bg-white px-3 py-2 text-left text-xs font-semibold text-[#4b5681] transition-colors hover:border-[#5a63df]/45 hover:bg-[#f3f2ff] hover:text-[#4049bb] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]'
                            )}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
            {switchingConversation ? (
              <div className="ai-coach-switching-indicator" role="status" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin text-[#5a63df]" />
                Opening conversation…
              </div>
            ) : null}
            {sending && streamingText ? (
              <div className="space-y-4" aria-live="polite">
                <CoachMessage
                  message={{ id: 'streaming', role: 'assistant', content: streamingText }}
                  onAction={executeAction}
                  actionBusy
                  user={user}
                />
              </div>
            ) : sending ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-[#5a63df]" />
                Checking your learning evidence…
              </div>
            ) : null}
          </div>
          <form
            onSubmit={submit}
            className="border-t border-[#e4e2f0] bg-white p-3 dark:border-white/[0.07] dark:bg-[#121116] sm:p-4"
          >
            {sourceReference && preview ? (
              <div className={cn(TILE, 'mb-2 p-3')} aria-label="Attached result summary">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
                    <span className={cn(MICRO, 'flex items-center gap-1.5 text-[#5a63df]')}>
                      <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      {preview.title}
                    </span>
                    {preview.facts.map((fact) => (
                      <span
                        key={fact.label}
                        className="text-[11px] text-slate-500 dark:text-slate-400"
                      >
                        <span className="font-semibold">{fact.label}</span>{' '}
                        <span className={cn(NUM, 'font-bold text-slate-700 dark:text-slate-200')}>
                          {fact.value}
                        </span>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSourceReference(null)}
                    aria-label="Remove result"
                    className={cn(
                      FOCUS_RING,
                      'shrink-0 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {preview.suggestions.length ? (
                  <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {preview.suggestions.map((suggestion) => (
                      <button
                        key={suggestion.message}
                        type="button"
                        onClick={() =>
                          sendMessage(suggestion.message, {
                            canned: true,
                            questionNumber: suggestion.questionNumber ?? null,
                          })
                        }
                        disabled={!canSend || sending || switchingConversation}
                        className={cn(
                          FOCUS_RING,
                          'shrink-0 whitespace-nowrap rounded-full border border-[#dedcec] bg-white px-3 py-1.5 text-left text-[11px] font-bold text-[#4a52c9] transition-colors hover:border-[#5a63df]/45 hover:bg-[#f3f2ff] disabled:cursor-not-allowed disabled:opacity-45 sm:whitespace-normal dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-[#c3c7ff]'
                        )}
                      >
                        {suggestion.message}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : sourceReference ? (
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
                  onChange={(event) => {
                    cannedDraftRef.current = null;
                    setDraft(event.target.value.slice(0, 2000));
                  }}
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
            {state.status?.enabled && messages.length === 0 && !sourceReference ? (
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
