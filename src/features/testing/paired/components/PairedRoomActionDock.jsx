import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MICRO } from '@/features/dashboard/components/primitives.jsx';
import {
  ReiconArrowRight,
  ReiconBookOpen,
  ReiconCheck,
  ReiconPlay,
  ReiconRefresh,
} from '@/components/ui/reicon';
import { cn } from '@/lib/cn';
import { testRoomPath } from '../pairedApi';

function getNextActionTitle(bothComplete, room, mine, partner, isHost) {
  if (bothComplete) return 'Keep the momentum going';
  if (room.state === 'lobby') {
    if (room.members.length < 2) return 'Invite your friend to continue';
    if (!mine.ready) return 'Mark yourself ready';
    if (!partner?.ready) return 'Waiting for your partner to get ready';
    return isHost ? 'Both ready — start the test' : 'Both ready — waiting for the host';
  }
  if (room.state === 'running') return 'Continue your test';
  return 'Your comparison is almost ready';
}

export default function PairedRoomActionDock({
  room,
  bothComplete,
  mine,
  partner,
  busy,
  ready,
  run,
}) {
  const navigate = useNavigate();
  const isHost = room.host_id === room.actor_id;
  const nextActionTitle = getNextActionTitle(bothComplete, room, mine, partner, isHost);
  const canStart =
    !busy && room.members.length === 2 && room.members.every((member) => member.ready);

  if ((room.state === 'running' && mine.submitted_at) || room.state === 'grading') return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e4e2f0] bg-white p-3.5 sm:p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#121118] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={cn(MICRO, 'flex items-center gap-1.5 text-slate-500 dark:text-slate-400')}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
          Next action
        </p>
        <p className="mt-0.5 truncate text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          {nextActionTitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {room.state === 'lobby' && (
          <>
            {room.members.length === 2 && (
              <Button
                disabled={busy}
                onClick={ready}
                className={cn(
                  'gap-1.5 font-semibold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]',
                  mine.ready
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                    : 'bg-[#5a63df] text-white hover:bg-[#4d55c7]'
                )}
              >
                {busy ? (
                  'Checking…'
                ) : mine.ready ? (
                  <>
                    <ReiconCheck className="h-4 w-4" /> Ready · undo
                  </>
                ) : room.test_type === 'listening' ? (
                  'Check audio & ready'
                ) : (
                  'I’m ready'
                )}
              </Button>
            )}

            {isHost && room.members.length === 2 && (
              <Button
                variant="secondary"
                disabled={!canStart}
                onClick={() => run('start')}
                className="gap-1.5 font-semibold active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
              >
                <ReiconPlay className="h-3.5 w-3.5" /> Start together
              </Button>
            )}

            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => run('leave')}
              className="active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
            >
              Leave room
            </Button>
          </>
        )}

        {room.state === 'running' && !mine.submitted_at && (
          <Button
            onClick={() => navigate(testRoomPath(room))}
            className="gap-1.5 bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          >
            Open test <ReiconArrowRight className="h-4 w-4" />
          </Button>
        )}

        {bothComplete && (
          <>
            <Button
              asChild
              className="bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.99] shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121118]"
            >
              <Link to={`${testRoomPath(room)}&review=true&view-results=true`}>
                My private review
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="gap-1.5 border-[#e4e2f0] hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/[0.04] active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121118]"
            >
              <Link to={`/${room.test_type}`}>
                <ReiconRefresh className="h-4 w-4" /> Take another together
              </Link>
            </Button>
          </>
        )}

        {(room.state === 'lobby' || bothComplete) && (
          <Button
            asChild
            variant="ghost"
            className="gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]"
          >
            <Link to={`/${room.test_type}`}>
              <ReiconBookOpen className="h-4 w-4" /> Browse tests
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
