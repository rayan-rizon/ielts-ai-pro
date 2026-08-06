import React, { useState } from 'react';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Headphones,
  History,
  Mic2,
  PenLine,
} from 'lucide-react';
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
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  TILE,
  Tip,
} from '@/features/dashboard/components/primitives';
import PracticeResultDialog from './PracticeResultDialog';

const MODULE_ICONS = {
  reading: BookOpen,
  writing: PenLine,
  listening: Headphones,
  speaking: Mic2,
};

function formatPracticeDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * One attempt.
 *
 * Walk-aways get a "Not sat" pill instead of "Band 0.0" — printing a band for a
 * test the learner left after three minutes tells them something false about
 * their reading, and it is the same distortion that used to poison the average.
 */
function PracticeSessionRow({ session, onViewResult }) {
  const Icon = MODULE_ICONS[session.type] || BookOpen;
  const band = session.score == null ? null : formatBand(session.score);

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
      className={cn(
        TILE,
        'group flex cursor-pointer select-none items-center justify-between gap-2.5 p-2.5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.995]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50',
        'dark:hover:border-white/12'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <IconChip icon={Icon} tone={session.abandoned ? 'neutral' : 'accent'} size="md" />
        <div className="min-w-0">
          <p
            className="truncate text-[11px] font-extrabold leading-snug text-slate-800 dark:text-slate-100"
            title={session.title}
          >
            {session.title}
          </p>
          <p className={cn(MICRO, MUTED, 'mt-0.5')}>
            {formatPracticeDate(session.date)}
            {session.durationMinutes ? (
              <>
                {' · '}
                <span className={NUM}>{session.durationMinutes}</span>m
              </>
            ) : null}
            {session.accuracy != null ? (
              <>
                {' · '}
                <span className={NUM}>{session.accuracy}</span>% correct
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {session.abandoned ? (
          <Tip content="Left within the first 5 minutes — excluded from your band averages.">
            <span>
              <Pill tone="neutral">Not sat</Pill>
            </span>
          </Tip>
        ) : band != null ? (
          <span className={cn(NUM, 'text-sm font-bold text-slate-900 dark:text-slate-50')}>
            {band}
          </span>
        ) : (
          <span className={cn(MICRO, MUTED)}>unscored</span>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-600" />
      </div>
    </div>
  );
}

export default function RecentPracticeHistory({ sessions = [], user }) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  // Full-width row, so six attempts in two columns fill it instead of four
  // stretched rows leaving half the panel blank.
  const recentSessions = sessions.slice(0, 6);
  const abandonedCount = sessions.filter((session) => session.abandoned).length;

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
      <m.div variants={ITEM_VARIANTS} className="h-full">
        <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
          {/* No `tip` here: this panel is rendered standalone in tests without a
              TooltipProvider mounted (see recent-practice-history.test.jsx). */}
          <PanelTitle
            label="Practice log"
            action={
              sessions.length ? (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className={cn(
                    MICRO,
                    'inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[#5a63df] transition-colors',
                    'hover:bg-[#5a63df]/[0.07] dark:text-[#a9afff]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
                  )}
                >
                  All {sessions.length}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : null
            }
          />

          {recentSessions.length ? (
            <div
              className="grid gap-2 md:grid-cols-2 xl:grid-cols-3"
              data-testid="recent-practice-mobile-list"
            >
              {recentSessions.map((session) => (
                <PracticeSessionRow key={session.id} session={session} onViewResult={viewResult} />
              ))}
            </div>
          ) : (
            <Empty icon={History} className="flex-1 content-center">
              No completed practice in this period. Try a wider timeframe.
            </Empty>
          )}

          {/* The attempt total is already the "Tests Counted" tile at the top of
              the page, so this only carries what that tile cannot: which of
              them were walk-aways and therefore kept out of every average. */}
          {sessions.length > 0 && abandonedCount > 0 ? (
            <PanelFootnote>
              <span className={cn(NUM, 'font-bold')}>{abandonedCount}</span> of{' '}
              <span className={cn(NUM, 'font-bold')}>{sessions.length}</span> were left early and
              are excluded from your averages.
            </PanelFootnote>
          ) : null}
        </section>
      </m.div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-3xl gap-0 overflow-hidden rounded-xl border border-[#e4e2f0] bg-white p-0 dark:border-white/10 dark:bg-[#131315]">
          <DialogHeader className="border-b border-[#eceafa] px-5 py-4 pr-14 text-left dark:border-white/[0.07]">
            <DialogTitle className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              Practice log
            </DialogTitle>
            <DialogDescription className={cn(MICRO, MUTED)}>
              {sessions.length} completed attempt{sessions.length === 1 ? '' : 's'} in this
              timeframe
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
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
