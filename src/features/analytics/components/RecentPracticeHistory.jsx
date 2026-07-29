import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Eye, Headphones, History, Mic2, PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';
import { formatBand } from '../utils';
import PracticeResultDialog from './PracticeResultDialog';

const MODULE_UI = {
  reading: {
    label: 'Reading',
    icon: BookOpen,
    soft: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-200/70',
  },
  writing: {
    label: 'Writing',
    icon: PenLine,
    soft: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-200/70',
  },
  listening: {
    label: 'Listening',
    icon: Headphones,
    soft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-200/70',
  },
  speaking: {
    label: 'Speaking',
    icon: Mic2,
    soft: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 ring-1 ring-fuchsia-200/70',
  },
};

function formatPracticeDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PracticeSessionRow({ session, onViewResult }) {
  const config = MODULE_UI[session.type] || MODULE_UI.reading;
  const Icon = config.icon;
  const band = session.score == null ? '—' : formatBand(session.score);

  return (
    <div
      role="button"
      aria-label={`View result for ${session.title}`}
      tabIndex={0}
      onClick={() => onViewResult(session)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewResult(session);
        }
      }}
      className="group flex items-center justify-between gap-2.5 rounded-xl border border-indigo-100/80 dark:border-white/10 bg-[#faf9ff] dark:bg-slate-900/80 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs cursor-pointer select-none"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs',
            config.soft
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p
            className="truncate text-xs font-black text-slate-950 dark:text-white leading-snug"
            title={session.title}
          >
            {session.title}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">
            {formatPracticeDate(session.date)}
            {session.durationMinutes ? ` · ${session.durationMinutes}m` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="rounded-full bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20 px-2.5 py-0.5 text-[10.5px] font-black">
          Band {band}
        </span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 group-hover:bg-[#efedff] group-hover:text-[#5661e9] dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-300 transition-all"
          title="View result details"
        >
          <Eye className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

export default function RecentPracticeHistory({ sessions = [], user }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const recentSessions = sessions.slice(0, 4);

  const viewResult = (session) => {
    setShowAll(false);

    if (session?.type === 'writing' && session?.id) {
      navigate(`/writing-task?sessionId=${session.id}&view=true`);
      return;
    }

    setSelectedSession(session);
  };

  return (
    <>
      <motion.div variants={ITEM_VARIANTS} className="h-full">
        <Card className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
          <CardHeader className="px-4 pb-2 pt-4 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
                  <History className="h-4.5 w-4.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                    Recent Practice History
                  </CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-400 truncate">
                    Latest completed sessions in this period
                  </CardDescription>
                </div>
              </div>
              {sessions.length ? (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#5661e9] transition-colors hover:text-indigo-700 dark:text-indigo-300 cursor-pointer"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-2.5 sm:px-4.5">
            {recentSessions.length ? (
              <div className="space-y-2" data-testid="recent-practice-mobile-list">
                {recentSessions.map((session) => (
                  <PracticeSessionRow
                    key={session.id}
                    session={session}
                    onViewResult={viewResult}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center text-center">
                <History className="mb-2 h-7 w-7 text-[#5661e9]" />
                <p className="font-black text-slate-950 dark:text-white text-sm">
                  No completed practice here yet
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Try a wider timeframe or complete another module.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-4xl gap-0 overflow-hidden rounded-[24px] border border-[#e0e4f1] bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 px-5 py-5 pr-14 text-left dark:border-white/10 sm:px-7">
            <DialogTitle className="text-xl font-black text-slate-950 dark:text-white">
              Practice History
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500">
              {sessions.length} completed session{sessions.length === 1 ? '' : 's'} in this
              timeframe
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto p-4 sm:p-6 space-y-2 max-h-[60vh]">
            {sessions.map((session) => (
              <PracticeSessionRow key={session.id} session={session} onViewResult={viewResult} />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <PracticeResultDialog
        session={selectedSession}
        user={user}
        onClose={() => setSelectedSession(null)}
      />
    </>
  );
}
