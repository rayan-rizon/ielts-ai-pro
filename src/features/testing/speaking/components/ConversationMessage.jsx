import React from 'react';
import { motion } from 'framer-motion';

function MessageAvatar({ entry, authUser }) {
  if (entry.speaker === 'ai') {
    return null;
  }

  if (authUser?.avatar_url) {
    return (
      <img
        src={authUser.avatar_url}
        alt={authUser?.full_name || 'User'}
        className="h-8 w-8 rounded-xl bg-muted object-cover shadow-sm sm:h-9 sm:w-9"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm sm:h-9 sm:w-9">
      <span className="text-xs font-bold">
        {(authUser?.full_name || 'C').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function getBubbleClass(entry) {
  if (entry.speaker !== 'user') {
    return 'rounded-2xl rounded-tl-md border border-rose-500/15 bg-rose-500/[0.055] text-left font-medium text-foreground dark:bg-rose-500/[0.09]';
  }

  if (entry.error) {
    return 'rounded-2xl rounded-tr-md border border-red-300 bg-red-100/80 text-right font-medium italic text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300';
  }

  return 'rounded-2xl rounded-tr-md border border-primary/10 bg-primary/[0.065] text-left font-medium text-foreground dark:bg-primary/[0.11]';
}

function LoadingText({ speaker }) {
  const label = speaker === 'ai' ? 'Examiner responding' : 'Preparing transcript';

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
        {label}
      </span>
    </div>
  );
}

function DraftTranscript({ entry }) {
  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap text-foreground">
        {entry.text?.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
      </p>
      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.13em] text-primary/70">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        Finalising transcript
      </div>
    </div>
  );
}

function MessageBody({ entry }) {
  if (entry.isLoading) {
    if (entry.speaker === 'user') {
      if (entry.isTranscriptDraft) return <DraftTranscript entry={entry} />;
    }
    return <LoadingText speaker={entry.speaker} />;
  }

  return (
    <p className="whitespace-pre-wrap">
      {entry.text?.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
    </p>
  );
}

const ConversationMessage = React.memo(({ entry, index, authUser }) => (
  <motion.div
    key={`${entry.speaker}-${index}`}
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className={`flex items-start gap-2.5 sm:gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
  >
    <MessageAvatar entry={entry} authUser={authUser} />

    <div
      className={`min-w-0 max-w-[91%] space-y-1.5 sm:max-w-[82%] ${entry.speaker === 'user' ? 'text-right' : ''}`}
    >
      <div
        className={`flex items-center gap-2 px-1 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
      >
        <span className="truncate text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px]">
          {entry.speaker === 'ai' ? 'Examiner' : authUser?.full_name || 'Candidate'}
        </span>
        {entry.timestamp && (
          <span className="flex-shrink-0 font-mono text-[9px] text-muted-foreground/50 sm:text-[10px]">
            {entry.timestamp}
          </span>
        )}
      </div>
      <div
        className={`px-4 py-3 text-left text-[14px] leading-6 tracking-normal shadow-sm sm:px-5 sm:py-3.5 sm:text-[15px] ${getBubbleClass(entry)}`}
      >
        <MessageBody entry={entry} />
      </div>
    </div>
  </motion.div>
));

ConversationMessage.displayName = 'ConversationMessage';

export default ConversationMessage;
