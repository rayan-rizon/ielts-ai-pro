import React from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';

function MessageAvatar({ entry, authUser }) {
  if (entry.speaker === 'ai') {
    return (
      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-rose-500 to-orange-500">
        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
    );
  }

  if (authUser?.avatar_url) {
    return (
      <img
        src={authUser.avatar_url}
        alt={authUser?.full_name || 'User'}
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg object-cover shadow-md bg-zinc-100"
      />
    );
  }

  return (
    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-500">
      <span className="text-white text-xs font-bold">
        {(authUser?.full_name || 'C').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function getBubbleClass(entry) {
  if (entry.speaker !== 'user') {
    return 'bg-gradient-to-br from-rose-600/10 to-rose-600/5 dark:from-rose-500/20 dark:to-rose-500/5 border border-rose-500/20 dark:border-rose-500/20 rounded-[1.25rem] rounded-tl-none text-left font-medium text-slate-800 dark:text-slate-200';
  }

  if (entry.error) {
    return 'bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-[1.25rem] rounded-tr-none text-red-700 dark:text-red-300 text-right italic font-medium';
  }

  return 'bg-gradient-to-br from-blue-500/10 to-indigo-500/5 dark:from-blue-500/20 dark:to-indigo-500/5 border border-blue-500/10 dark:border-blue-500/10 rounded-[1.25rem] rounded-tr-none text-right font-medium text-slate-800 dark:text-slate-200';
}

function LoadingText() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
        Transcribing
      </span>
    </div>
  );
}

function MessageBody({ entry }) {
  if (entry.isLoading) return <LoadingText />;

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
    className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
  >
    <MessageAvatar entry={entry} authUser={authUser} />

    <div
      className={`max-w-[90%] sm:max-w-[85%] ${entry.speaker === 'user' ? 'text-right' : ''} space-y-1.5 min-w-0`}
    >
      <div
        className={`flex items-center gap-2 px-1 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}
      >
        <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">
          {entry.speaker === 'ai' ? 'Examiner' : authUser?.full_name || 'Candidate'}
        </span>
        {entry.timestamp && (
          <span className="text-[9px] sm:text-[10px] text-muted-foreground/40 font-mono flex-shrink-0">
            {entry.timestamp}
          </span>
        )}
      </div>
      <div
        className={`px-3.5 py-2.5 sm:px-4 sm:py-3 text-[14px] sm:text-[15px] leading-relaxed tracking-normal shadow-sm ${getBubbleClass(entry)}`}
      >
        <MessageBody entry={entry} />
      </div>
    </div>
  </motion.div>
));

ConversationMessage.displayName = 'ConversationMessage';

export default ConversationMessage;
