import React, { useEffect, useMemo, useState } from 'react';
import { AudioLines, CheckCircle2, Pause, Radio, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';
import { formatIeltsQuestion } from '../utils/speakingTestUtils';

function cleanMessageText(text = '', formatQuestion = false) {
  return (formatQuestion ? formatIeltsQuestion(text) : String(text))
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
        className="h-8 w-8 rounded-lg bg-muted object-cover ring-1 ring-black/10 dark:ring-white/10 sm:h-9 sm:w-9"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white ring-1 ring-black/10 dark:ring-white/10 sm:h-9 sm:w-9">
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
      return 'rounded-xl rounded-tl-sm border border-rose-100 bg-linear-to-br/srgb from-rose-50 to-pink-50/70 text-left font-medium text-slate-800 dark:border-rose-500/20 dark:from-[#161516] dark:via-[#131315] dark:to-[#161516] dark:text-slate-100';
    }
    // Regular examiner — quiet panel tile
    return 'rounded-xl rounded-tl-sm border border-[#ebeaf7] bg-[#fbfbfe] text-left font-medium text-slate-800 dark:border-white/10 dark:bg-white/4 dark:text-slate-100';
  }

  // User error
  if (entry.error) {
    return 'rounded-2xl rounded-tr-sm border border-red-200 bg-red-50 text-right font-medium italic text-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300';
  }

  // User live/draft transcript — soft lavender
  if (entry.isLive || entry.isTranscriptDraft) {
    return 'rounded-xl rounded-tr-sm border border-rose-100 bg-linear-to-br/srgb from-rose-50 via-white to-red-50/60 text-left font-medium text-slate-800 dark:border-rose-500/20 dark:from-[#171416] dark:via-[#131315] dark:to-[#171416] dark:text-slate-100';
  }

  // Completed user message — soft red pastel
  return 'rounded-xl rounded-tr-sm border border-rose-100/80 bg-linear-to-br/srgb from-rose-50 via-pink-50 to-red-50/80 text-left font-medium text-rose-950 dark:border-rose-500/20 dark:from-[#191416] dark:via-[#151315] dark:to-[#191416] dark:text-rose-100';
}

function LoadingText({ speaker, isPractice }) {
  const label =
    speaker === 'ai'
      ? isPractice
        ? 'Coach responding'
        : 'Examiner responding'
      : 'Preparing transcript';

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 motion-safe:animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 motion-safe:animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 motion-safe:animate-bounce [animation-delay:300ms]" />
      </div>
      <span className={cn(MICRO, MUTED, 'tracking-widest motion-safe:animate-pulse')}>{label}</span>
    </div>
  );
}

const LiveWaveform = React.memo(function LiveWaveform({ active, tone }) {
  const colors = {
    rose: 'bg-linear-to-t/srgb from-rose-500 to-pink-400',
    red: 'bg-linear-to-t/srgb from-red-600 to-rose-400',
  };

  return (
    <span
      className={`flex h-4 items-end gap-[2px] ${active ? '' : 'opacity-40'}`}
      aria-hidden="true"
    >
      {[3, 7, 11, 7, 5, 9, 3].map((h, bar) => (
        <span
          key={bar}
          className={`w-[2px] rounded-full ${colors[tone] || colors.rose} transition-[height,opacity] duration-150 ${active ? 'motion-safe:animate-pulse' : ''}`}
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
    ? 'Paused'
    : entry.autoFinishCountdown
      ? `Sending in ${entry.autoFinishCountdown}s`
      : isLive && entry.text
        ? 'Hearing you'
        : isLive
          ? 'Waiting for speech'
          : 'Refining transcript';

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center justify-between gap-3',
          entry.text && 'border-b border-rose-400/15 pb-1'
        )}
      >
        <span className="flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">
          {isPaused ? (
            <Pause className="h-3 w-3 fill-current" aria-hidden="true" />
          ) : isLive ? (
            <AudioLines className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <Sparkles className="h-3 w-3 motion-safe:animate-pulse" aria-hidden="true" />
          )}
          {status}
        </span>
        <LiveWaveform active={isLive && !isPaused} tone="rose" />
      </div>
      {(entry.text || !isPaused) && (
        <p className="max-h-11 overflow-y-auto whitespace-pre-wrap pr-1 text-[12.5px] leading-[1.45] text-foreground/90 sm:text-[13px]">
          {cleanMessageText(entry.text) ||
            (isLive ? 'Start speaking when ready.' : 'Preparing transcript…')}
        </p>
      )}
    </div>
  );
}

function FinalTranscript({ entry }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 border-b border-rose-400/15 pb-1">
        <span className="flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Captured transcript
        </span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-rose-500/75 dark:text-rose-300/75">
          Ready
        </span>
      </div>
      <p className="whitespace-pre-wrap text-[13.5px] leading-snug text-rose-950 dark:text-rose-100 sm:text-[14.5px]">
        {cleanMessageText(entry.text)}
      </p>
    </div>
  );
}

function ExaminerLiveTranscript({ entry, isPractice }) {
  const cleanText = useMemo(() => cleanMessageText(entry.text, true), [entry.text]);
  const words = useMemo(() => cleanText.split(/\s+/).filter(Boolean), [cleanText]);
  const isPreparing = entry.isExaminerPreparing && !entry.isExaminerSpeaking;
  const hasAudioProgress = Number.isFinite(entry.speechProgress);
  const [visibleWordCount, setVisibleWordCount] = useState(
    entry.isExaminerSpeaking ? 1 : words.length
  );

  useEffect(() => {
    if (!entry.isExaminerSpeaking) {
      return undefined;
    }
    setVisibleWordCount(1);
    return undefined;
  }, [entry.isExaminerSpeaking]);

  const audioWordCount = hasAudioProgress
    ? Math.max(1, Math.min(words.length, Math.ceil(entry.speechProgress * words.length)))
    : 1;

  useEffect(() => {
    if (!entry.isExaminerSpeaking) {
      setVisibleWordCount(words.length);
      return undefined;
    }
    setVisibleWordCount(audioWordCount);
    return undefined;
  }, [audioWordCount, entry.isExaminerSpeaking, words.length]);

  // Transcript progress is driven only by real playback progress. A synthetic
  // word clock made the text run ahead of audio on slower devices.
  const renderedWordCount = entry.isExaminerSpeaking
    ? Math.min(visibleWordCount, audioWordCount)
    : words.length;
  const visibleText = words.slice(0, renderedWordCount).join(' ');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 border-b border-rose-400/15 pb-1">
        <span className="flex items-center gap-1.5 text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300">
          {entry.isExaminerSpeaking ? (
            <AudioLines className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden="true" />
          ) : (
            <Radio className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden="true" />
          )}
          {entry.isExaminerSpeaking
            ? isPractice
              ? 'AI coach · live'
              : 'British examiner · live'
            : isPractice
              ? 'Preparing coach audio'
              : 'Preparing examiner audio'}
        </span>
        <LiveWaveform active={entry.isExaminerSpeaking} tone="rose" />
      </div>
      <p className="min-h-4 whitespace-pre-wrap text-[12.5px] leading-snug text-foreground/90 sm:text-[13px]">
        {isPreparing
          ? `Getting the ${isPractice ? 'coach' : 'examiner'} voice ready…`
          : visibleText}
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

function MessageBody({ entry, isPractice }) {
  if (entry.speaker === 'ai' && entry.isExaminerLive) {
    return <ExaminerLiveTranscript entry={entry} isPractice={isPractice} />;
  }

  if (entry.isLoading) {
    if (entry.speaker === 'user') {
      if (entry.isTranscriptDraft || entry.isLive) return <DraftTranscript entry={entry} />;
    }
    return <LoadingText speaker={entry.speaker} isPractice={isPractice} />;
  }

  if (entry.speaker === 'user' && entry.isTranscript) {
    return <FinalTranscript entry={entry} />;
  }

  return (
    <p className="whitespace-pre-wrap">{cleanMessageText(entry.text, entry.speaker === 'ai')}</p>
  );
}

const ConversationMessage = React.memo(({ entry, index: _index, authUser, speakingMode }) => {
  const isPractice = speakingMode === 'practice';
  const isCompactTranscript = entry.speaker === 'user' && (entry.isLive || entry.isTranscriptDraft);
  const isExaminerTranscript = entry.speaker === 'ai' && entry.isExaminerLive;
  const isExaminerMessage = entry.speaker === 'ai';
  const isUserMessage = entry.speaker === 'user';
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className={`flex items-end gap-2 sm:gap-2.5 ${isUserMessage ? 'flex-row-reverse' : ''}`}
    >
      <MessageAvatar entry={entry} authUser={authUser} />

      <div
        className={`min-w-0 space-y-1 ${
          isCompactTranscript || isExaminerTranscript
            ? 'w-full max-w-[92%] sm:max-w-[78%] lg:max-w-[72%]'
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
            {entry.speaker === 'ai'
              ? isPractice
                ? 'AI coach'
                : 'Examiner'
              : authUser?.full_name || 'Candidate'}
          </span>
          {entry.timestamp && (
            <span className="shrink-0 font-mono text-[9px] text-slate-400/70 dark:text-slate-500/50 sm:text-[10px]">
              {entry.timestamp}
            </span>
          )}
        </div>

        {/* Bubble */}
        <motion.div
          // Size is animated for the examiner's stream, which only ever grows.
          // The candidate's live captions are revised several times a second
          // and routinely get shorter, so animating them meant the bubble was
          // permanently mid-transition — the "glitchy" grow/shrink.
          layout={!prefersReducedMotion && isExaminerTranscript ? 'size' : false}
          transition={{ layout: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
          className={`overflow-hidden text-left tracking-normal ${
            isCompactTranscript || isExaminerTranscript
              ? 'px-3 py-2'
              : isExaminerMessage
                ? 'px-4 py-2 text-[13px] leading-snug sm:px-4.5 sm:py-2.5 sm:text-sm'
                : 'px-4 py-2 text-[13.5px] leading-snug sm:px-4.5 sm:py-2.5 sm:text-[14.5px]'
          } ${getBubbleClass(entry)}`}
        >
          <MessageBody entry={entry} isPractice={isPractice} />
        </motion.div>
      </div>
    </motion.div>
  );
});

ConversationMessage.displayName = 'ConversationMessage';

export default ConversationMessage;
