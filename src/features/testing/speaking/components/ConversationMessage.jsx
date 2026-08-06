import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Pause, Radio, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';

function cleanMessageText(text = '') {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');
}

function MessageAvatar({ entry, authUser }) {
  if (entry.speaker === 'ai') {
    return null;
  }

  if (authUser?.avatar_url) {
    return (
      <img
        src={authUser.avatar_url}
        alt={authUser?.full_name || 'User'}
        className="h-8 w-8 rounded-xl bg-muted object-cover ring-2 ring-white/80 shadow-sm dark:ring-white/10 sm:h-9 sm:w-9"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-white/80 dark:ring-white/10 sm:h-9 sm:w-9">
      <span className="text-xs font-bold">
        {(authUser?.full_name || 'C').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function getBubbleClass(entry) {
  // Examiner live / speaking — light rose blush
  if (entry.speaker !== 'user') {
    if (entry.isExaminerLive) {
      return 'rounded-2xl rounded-tl-sm border border-rose-100 bg-linear-to-br from-rose-50 to-pink-50/70 text-left font-medium text-slate-800 shadow-sm dark:border-rose-500/20 dark:from-[#161516] dark:via-[#131315] dark:to-[#161516] dark:text-slate-100';
    }
    // Regular examiner — quiet panel tile
    return 'rounded-2xl rounded-tl-sm border border-[#ebeaf7] bg-[#fbfbfe] text-left font-medium text-slate-800 shadow-[0_1px_6px_-2px_hsl(220_15%_50%/0.10)] dark:border-white/10 dark:bg-white/4 dark:text-slate-100';
  }

  // User error
  if (entry.error) {
    return 'rounded-2xl rounded-tr-sm border border-red-200 bg-red-50 text-right font-medium italic text-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300';
  }

  // User live/draft transcript — soft lavender
  if (entry.isLive || entry.isTranscriptDraft) {
    return 'rounded-2xl rounded-tr-sm border border-rose-100 bg-linear-to-br from-rose-50 via-white to-red-50/60 text-left font-medium text-slate-800 shadow-sm dark:border-rose-500/20 dark:from-[#171416] dark:via-[#131315] dark:to-[#171416] dark:text-slate-100';
  }

  // Completed user message — soft red pastel
  return 'rounded-2xl rounded-tr-sm border border-rose-100/80 bg-linear-to-br from-rose-50 via-pink-50 to-red-50/80 text-left font-medium text-rose-950 shadow-sm dark:border-rose-500/20 dark:from-[#191416] dark:via-[#151315] dark:to-[#191416] dark:text-rose-100';
}

function LoadingText({ speaker }) {
  const label = speaker === 'ai' ? 'Examiner responding' : 'Preparing transcript';

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className={cn(MICRO, MUTED, 'tracking-widest animate-pulse')}>{label}</span>
    </div>
  );
}

const LiveWaveform = React.memo(function LiveWaveform({ active, tone }) {
  const colors = {
    rose: 'bg-linear-to-t from-rose-500 to-pink-400',
    red: 'bg-linear-to-t from-red-600 to-rose-400',
  };

  return (
    <span
      className={`flex h-4 items-end gap-[2px] ${active ? '' : 'opacity-40'}`}
      aria-hidden="true"
    >
      {[3, 7, 11, 7, 5, 9, 3].map((h, bar) => (
        <span
          key={bar}
          className={`w-[2px] rounded-full ${colors[tone] || colors.rose} transition-all duration-150`}
          style={{
            height: active ? `${h}px` : '3px',
            animationDelay: `${bar * 60}ms`,
          }}
        />
      ))}
    </span>
  );
});

function DraftTranscript({ entry }) {
  const isPaused = entry.autoSubmitPaused;
  const isLive = entry.isLive;
  const status = isPaused
    ? 'Auto-send paused'
    : entry.autoFinishCountdown
      ? `Sending in ${entry.autoFinishCountdown}s`
      : isLive
        ? 'Listening live'
        : 'Refining transcript';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 border-b border-rose-400/15 pb-1.5">
        <span className="flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">
          {isPaused ? (
            <Pause className="h-3 w-3 fill-current" aria-hidden="true" />
          ) : isLive ? (
            <AudioLines className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3 w-3 animate-pulse" aria-hidden="true" />
          )}
          {status}
        </span>
        <LiveWaveform active={isLive && !isPaused} tone="rose" />
      </div>
      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/90 sm:text-[13px]">
        {cleanMessageText(entry.text) ||
          (isLive ? 'Start speaking when you are ready.' : 'Preparing your transcript…')}
        {isLive && entry.text && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[14px] w-0.5 translate-y-0.5 animate-pulse rounded-full bg-rose-500"
          />
        )}
      </p>
      {(isPaused || entry.autoFinishCountdown || !isLive) && (
        <p className="text-[9px] font-medium leading-3 text-muted-foreground/75">
          {isPaused
            ? 'Silence will not send this answer.'
            : entry.autoFinishCountdown
              ? 'Keep speaking to cancel the countdown.'
              : 'Finalising your wording…'}
        </p>
      )}
    </div>
  );
}

function ExaminerLiveTranscript({ entry }) {
  const cleanText = useMemo(() => cleanMessageText(entry.text), [entry.text]);
  const words = useMemo(() => cleanText.split(/\s+/).filter(Boolean), [cleanText]);
  const isPreparing = entry.isExaminerPreparing && !entry.isExaminerSpeaking;
  const hasAudioProgress = Number.isFinite(entry.speechProgress);
  const [fallbackWordCount, setFallbackWordCount] = useState(
    entry.isExaminerSpeaking ? 1 : words.length
  );
  const [visibleWordCount, setVisibleWordCount] = useState(
    entry.isExaminerSpeaking ? 1 : words.length
  );

  useEffect(() => {
    if (!entry.isExaminerSpeaking) {
      setFallbackWordCount(words.length);
      return undefined;
    }
    if (hasAudioProgress) return undefined;

    setFallbackWordCount(1);
    const revealInterval = Math.max(105, Math.min(210, 3200 / Math.max(words.length, 1)));
    const timer = setInterval(() => {
      setFallbackWordCount((count) => {
        if (count >= words.length) {
          clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, revealInterval);

    return () => clearInterval(timer);
  }, [entry.isExaminerSpeaking, hasAudioProgress, words]);

  const targetWordCount = hasAudioProgress
    ? Math.max(1, Math.min(words.length, Math.ceil(entry.speechProgress * words.length)))
    : fallbackWordCount;

  useEffect(() => {
    if (!entry.isExaminerSpeaking) {
      setVisibleWordCount(words.length);
      return undefined;
    }

    setVisibleWordCount((current) => Math.min(current, targetWordCount));
    return undefined;
  }, [entry.isExaminerSpeaking, targetWordCount, words.length]);

  useEffect(() => {
    if (!entry.isExaminerSpeaking) return undefined;

    const timer = setInterval(() => {
      setVisibleWordCount((current) => {
        const next = Math.min(targetWordCount, current + 1);
        if (next >= targetWordCount) clearInterval(timer);
        return next;
      });
    }, 68);

    return () => clearInterval(timer);
  }, [entry.isExaminerSpeaking, targetWordCount]);

  const visibleText = words.slice(0, visibleWordCount).join(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 border-b border-rose-400/15 pb-1.5">
        <span className="flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">
          {entry.isExaminerSpeaking ? (
            <AudioLines className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          ) : (
            <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
          )}
          {entry.isExaminerSpeaking ? 'British examiner · live' : 'Preparing examiner audio'}
        </span>
        <LiveWaveform active={entry.isExaminerSpeaking} tone="rose" />
      </div>
      <p className="min-h-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-foreground/90 sm:text-[13px]">
        {isPreparing ? 'Getting the examiner voice ready…' : visibleText}
        {entry.isExaminerSpeaking && visibleWordCount < words.length && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-[14px] w-0.5 translate-y-0.5 animate-pulse rounded-full bg-rose-500"
          />
        )}
      </p>
    </div>
  );
}

function MessageBody({ entry }) {
  if (entry.speaker === 'ai' && entry.isExaminerLive) {
    return <ExaminerLiveTranscript entry={entry} />;
  }

  if (entry.isLoading) {
    if (entry.speaker === 'user') {
      if (entry.isTranscriptDraft || entry.isLive) return <DraftTranscript entry={entry} />;
    }
    return <LoadingText speaker={entry.speaker} />;
  }

  return <p className="whitespace-pre-wrap">{cleanMessageText(entry.text)}</p>;
}

/**
 * Holds a live bubble at its tallest so far.
 *
 * Web Speech revises its interim guess constantly, and a shorter revision
 * shrinks the bubble — which pushes everything below it up and undoes the
 * scroll position mid-sentence. Growing is fine; shrinking is what reads as a
 * glitch. The floor is released once the turn is no longer live.
 */
function useMonotonicHeight(elementRef, isLive, text) {
  const [minHeight, setMinHeight] = useState(0);

  useLayoutEffect(() => {
    if (!isLive) {
      setMinHeight((current) => (current === 0 ? current : 0));
      return;
    }
    const measured = elementRef.current?.getBoundingClientRect().height ?? 0;
    setMinHeight((current) => (measured > current ? measured : current));
  }, [elementRef, isLive, text]);

  return isLive ? minHeight : 0;
}

const ConversationMessage = React.memo(({ entry, index: _index, authUser }) => {
  const bubbleRef = useRef(null);
  const isCompactTranscript = entry.speaker === 'user' && (entry.isLive || entry.isTranscriptDraft);
  const isExaminerTranscript = entry.speaker === 'ai' && entry.isExaminerLive;
  const isExaminerMessage = entry.speaker === 'ai';
  const isUserMessage = entry.speaker === 'user';
  const prefersReducedMotion = useReducedMotion();
  const liveMinHeight = useMonotonicHeight(bubbleRef, isCompactTranscript, entry.text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 sm:gap-3 ${isUserMessage ? 'flex-row-reverse' : ''}`}
    >
      <MessageAvatar entry={entry} authUser={authUser} />

      <div
        className={`min-w-0 space-y-1 ${
          isCompactTranscript || isExaminerTranscript
            ? 'max-w-[88%] sm:max-w-[72%] lg:max-w-[65%]'
            : isUserMessage
              ? 'max-w-[78%] sm:max-w-[68%]'
              : 'max-w-[88%] sm:max-w-[80%]'
        } ${isUserMessage ? 'text-right' : ''}`}
      >
        {/* Label row */}
        <div
          className={`flex items-center gap-1.5 px-1 ${isUserMessage ? 'flex-row-reverse' : ''}`}
        >
          <span className={cn(MICRO, MUTED, 'truncate sm:text-[10px]')}>
            {entry.speaker === 'ai' ? 'Examiner' : authUser?.full_name || 'Candidate'}
          </span>
          {entry.timestamp && (
            <span className="shrink-0 font-mono text-[9px] text-slate-400/70 dark:text-slate-500/50 sm:text-[10px]">
              {entry.timestamp}
            </span>
          )}
        </div>

        {/* Bubble */}
        <motion.div
          ref={bubbleRef}
          style={liveMinHeight ? { minHeight: liveMinHeight } : undefined}
          // Size is animated for the examiner's stream, which only ever grows.
          // The candidate's live captions are revised several times a second
          // and routinely get shorter, so animating them meant the bubble was
          // permanently mid-transition — the "glitchy" grow/shrink.
          layout={!prefersReducedMotion && isExaminerTranscript ? 'size' : false}
          transition={{ layout: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
          className={`overflow-hidden text-left tracking-normal ${
            isCompactTranscript || isExaminerTranscript
              ? 'px-3 py-2.5'
              : isExaminerMessage
                ? 'px-4 py-2.5 text-[13px] leading-relaxed sm:px-4.5 sm:py-3 sm:text-sm'
                : 'px-4 py-2.5 text-[13.5px] leading-relaxed sm:px-4.5 sm:py-3 sm:text-[14.5px]'
          } ${getBubbleClass(entry)}`}
        >
          <MessageBody entry={entry} />
        </motion.div>
      </div>
    </motion.div>
  );
});

ConversationMessage.displayName = 'ConversationMessage';

export default ConversationMessage;
