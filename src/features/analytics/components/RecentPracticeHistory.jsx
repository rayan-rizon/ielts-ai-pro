import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Eye, Headphones, History, Mic2, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  writing: {
    label: 'Writing',
    icon: PenLine,
    soft: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  },
  listening: {
    label: 'Listening',
    icon: Headphones,
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
  speaking: {
    label: 'Speaking',
    icon: Mic2,
    soft: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300',
  },
};

function formatPracticeDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PracticeType({ type }) {
  const config = MODULE_UI[type] || MODULE_UI.reading;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold',
        config.soft
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ResultButton({ session, onViewResult, compact = false }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onViewResult(session)}
      className={cn(
        'gap-1.5 rounded-lg font-extrabold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-500/10',
        compact ? 'h-8 px-2 text-[10px]' : 'h-9 px-3 text-xs'
      )}
      aria-label={`View result for ${session.title}`}
    >
      <Eye className="h-3.5 w-3.5" /> View result
    </Button>
  );
}

function MobileRows({ sessions, onViewResult }) {
  return (
    <div className="space-y-2 md:hidden" data-testid="recent-practice-mobile-list">
      {sessions.map((session) => (
        <article
          key={session.id}
          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-white/5 dark:bg-white/[0.03]"
        >
          <div className="flex items-center justify-between gap-3">
            <PracticeType type={session.type} />
            <span className="text-[10px] font-bold text-slate-400">
              {formatPracticeDate(session.date)}
            </span>
          </div>
          <h3 className="mt-2 text-xs font-extrabold text-slate-900 dark:text-white">
            {session.title}
          </h3>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ['Band', session.score == null ? '—' : formatBand(session.score)],
              ['Accuracy', session.accuracy == null ? '—' : `${session.accuracy}%`],
              ['Time', session.durationMinutes == null ? '—' : `${session.durationMinutes}m`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-white px-2 py-2 shadow-sm dark:bg-slate-900"
              >
                <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {label}
                </dt>
                <dd className="mt-0.5 text-xs font-black text-slate-800 dark:text-slate-100">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex justify-end">
            <ResultButton session={session} onViewResult={onViewResult} compact />
          </div>
        </article>
      ))}
    </div>
  );
}

function DesktopTable({ sessions, onViewResult, testId = 'recent-practice-table' }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5 md:block">
      <table className="w-full border-collapse text-left" data-testid={testId}>
        <thead className="bg-slate-50/80 dark:bg-white/[0.03]">
          <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <th className="px-2.5 py-2.5">Module</th>
            <th className="px-2.5 py-2.5">Practice</th>
            <th className="px-2 py-2.5 text-center">Band</th>
            <th className="px-2 py-2.5 text-center">Date</th>
            <th className="px-2.5 py-2.5 text-right">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="text-xs transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-500/[0.04]"
            >
              <td className="px-2.5 py-2">
                <PracticeType type={session.type} />
              </td>
              <td
                className="max-w-[180px] truncate px-2.5 py-2 font-bold text-slate-800 dark:text-slate-200"
                title={session.title}
              >
                {session.title}
              </td>
              <td className="px-2 py-2 text-center font-black text-slate-950 dark:text-white">
                {session.score == null ? '—' : formatBand(session.score)}
              </td>
              <td className="px-2 py-2 text-center text-[11px] font-semibold text-slate-500">
                {formatPracticeDate(session.date)}
              </td>
              <td className="px-2.5 py-1.5 text-right">
                <ResultButton session={session} onViewResult={onViewResult} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecentPracticeHistory({ sessions = [], user }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const recentSessions = sessions.slice(0, 5);

  const viewResult = (session) => {
    setShowAll(false);
    setSelectedSession(session);
  };

  return (
    <>
      <motion.div variants={ITEM_VARIANTS} className="h-full">
        <Card className="flex h-full flex-col justify-between overflow-hidden rounded-[22px] border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950">
          <CardHeader className="px-4 pb-1 pt-3.5 sm:px-4.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <History className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                    Recent practice history
                  </CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-500 truncate">
                    Latest completed sessions in this period
                  </CardDescription>
                </div>
              </div>
              {sessions.length ? (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-300"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between px-3.5 pb-3.5 pt-1 sm:px-4.5">
            {recentSessions.length ? (
              <>
                <MobileRows sessions={recentSessions} onViewResult={viewResult} />
                <DesktopTable sessions={recentSessions} onViewResult={viewResult} />
              </>
            ) : (
              <div className="flex h-[220px] flex-col items-center justify-center text-center">
                <History className="mb-2 h-7 w-7 text-indigo-200" />
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  No completed practice here yet
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Try a wider timeframe or complete another module.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-6xl gap-0 overflow-hidden rounded-[24px] border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 px-5 py-5 pr-14 text-left dark:border-white/10 sm:px-7">
            <DialogTitle className="text-xl font-extrabold text-slate-950 dark:text-white">
              Practice results
            </DialogTitle>
            <DialogDescription>
              {sessions.length} completed session{sessions.length === 1 ? '' : 's'} in this
              timeframe
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto p-4 sm:p-6" style={{ contentVisibility: 'auto' }}>
            <MobileRows sessions={sessions} onViewResult={viewResult} />
            <DesktopTable
              sessions={sessions}
              onViewResult={viewResult}
              testId="all-practice-results-table"
            />
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
