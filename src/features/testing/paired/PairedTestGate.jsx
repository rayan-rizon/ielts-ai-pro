import PairedTestEntry from './PairedTestEntry';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  IconChip,
  MICRO,
  MUTED,
  PANEL,
  Pill,
} from '@/features/dashboard/components/primitives.jsx';
import { Headphones, LockKeyhole, Wifi } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PairedContext } from './PairedContext';
import { pairedTestsEnabled, testRoomPath, roomLobbyPath } from './pairedApi';
import { usePairedRoom } from './usePairedRoom';
import PairedRoomView, { RoomLoading } from './PairedRoomView';

function ActiveGate({ id, review, children, type }) {
  const state = usePairedRoom(id);
  const navigate = useNavigate();
  const route = useParams();
  const { room, act, error, conflict, now } = state;
  useEffect(() => {
    if (room && room.test_type !== type) {
      navigate(roomLobbyPath(room), { replace: true });
      return;
    }
    if (room?.state === 'running' && room.own.session_id && route.id !== room.own.session_id) {
      navigate(testRoomPath(room), { replace: true });
    }
  }, [room, route.id, navigate, type]);

  const { userProfile } = useAuth();
  useEffect(() => {
    if (review && room?.state === 'complete') act('review').catch(() => {});
  }, [review, room?.state, act]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(timer);
  }, []);
  const initial = useMemo(() => {
    if (!room?.snapshot || !room.own.session_id) return null;
    return {
      testData: room.snapshot.testData,
      questions: room.snapshot.questions,
      user: userProfile,
      session: {
        id: room.own.session_id,
        user_id: room.actor_id,
        passage_id: room.passage_id,
        test_type: room.test_type,
        test_mode: 'mock',
        started_at: room.started_at,
        created_at: room.started_at,
        is_completed: room.state === 'complete',
        user_responses: room.own.answers,
        duration_minutes: Math.ceil(room.duration_seconds / 60),
        paired_room_id: room.id,
        content_data: {
          paired_room_id: room.id,
          duration_seconds: room.duration_seconds,
          audio_durations: room.audio_durations,
          review_seconds: 120,
        },
      },
    };
    // Freeze the initial restore snapshot; polling must never overwrite unsaved local input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.own.session_id, room?.state === 'complete', userProfile?.id]);
  const value = useMemo(
    () => ({
      room,
      initial,
      now,
      act,
      save: (answers) => act('save', { answers }),
      submit: (answers) => act('submit', { answers }),
    }),
    [room, initial, now, act]
  );
  if (!room)
    return (
      <>
        <RoomLoading />
        {error && (
          <div role="alert" className="p-4">
            {error}
            <Button onClick={() => act('get').catch(() => {})}>Retry</Button>
          </div>
        )}
      </>
    );
  if (room.test_type !== type) return <RoomLoading />;
  const waiting = room.own.submitted_at || !['running', 'complete'].includes(room.state);
  if ((waiting || room.state === 'complete') && !(review && room.state === 'complete'))
    return <PairedRoomView {...state} />;
  const countdown = Math.max(0, Math.ceil((Date.parse(room.started_at) - now()) / 1000));
  const expired = room.state === 'running' && now() >= Date.parse(room.deadline);
  return (
    <PairedContext.Provider value={value}>
      <div
        className={`${PANEL} shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 text-sm`}
        data-tick={tick % 2}
        role="status"
      >
        <div className="flex items-center gap-2">
          <IconChip icon={type === 'listening' ? Headphones : LockKeyhole} tone="accent" />
          <div>
            <p className={MICRO}>Study partners</p>
            <p className={cn(MUTED, 'text-xs')}>Shared test session</p>
          </div>
        </div>
        <span className="hidden h-7 w-px bg-slate-200 dark:bg-white/10 sm:block" />
        <span className={cn(MICRO, 'flex items-center gap-1.5')}>
          <Wifi className="h-3 w-3 text-[rgb(var(--signal-ok))]" />
          {state.onlineCount} connected
        </span>
        {!state.connected && (
          <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
            Reconnecting live updates
          </span>
        )}
        <Pill
          tone={
            room.members.find((m) => m.user_id !== room.actor_id)?.submitted_at ? 'ok' : 'neutral'
          }
        >
          {room.members.find((m) => m.user_id !== room.actor_id)?.submitted_at
            ? 'Partner submitted'
            : 'Partner is taking the test'}
        </Pill>
        {!review && (
          <Button size="sm" variant="ghost" onClick={() => act('leave').catch(() => {})}>
            Finish with saved answers & leave
          </Button>
        )}
      </div>
      {error && (
        <div role="alert" className="p-2 text-sm">
          {error}
        </div>
      )}
      {conflict ? (
        <div role="alert" className="p-4">
          This attempt changed in another tab. Reload to restore its latest saved answers.
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      ) : countdown > 0 ? (
        <div className="p-8 text-center" role="status">
          Starting together in {countdown}…
        </div>
      ) : expired ? (
        <div className="p-4" role="status">
          Time is up. Your last server-saved answers are being finalized.
          <Button onClick={() => act('get').catch(() => {})}>Check results</Button>
        </div>
      ) : initial ? (
        children
      ) : (
        <RoomLoading />
      )}
    </PairedContext.Provider>
  );
}
export default function PairedTestGate({ children, type }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('room');
  const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
  const together = params.get('together') === 'true';
  if (!id && !invitation && !together) return children;
  if (!pairedTestsEnabled) return <p className="p-6">Paired practice is not available yet.</p>;
  if (!id) return <PairedTestEntry type={type} invitation={invitation} />;
  return (
    <ActiveGate key={id} id={id} type={type} review={params.get('review') === 'true'}>
      {children}
    </ActiveGate>
  );
}
