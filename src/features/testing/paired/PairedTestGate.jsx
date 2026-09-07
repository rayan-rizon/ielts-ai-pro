import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PairedContext } from './PairedContext';
import { testRoomPath, roomLobbyPath } from './pairedApi';
import { usePairedRoom } from './usePairedRoom';
import PairedRoomView, { RoomLoading } from './PairedRoomView';
import PairedRoomError from './PairedRoomError';
import PairedTestEntry from './PairedTestEntry';
import ActiveGateHeader from './components/ActiveGateHeader';
import ActiveGateContent from './components/ActiveGateContent';

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
    const isRunning = room?.state === 'running';
    const ownSessionId = room?.own?.session_id;
    const isDifferentSession = Boolean(ownSessionId) && route.id !== ownSessionId;
    if (isRunning && isDifferentSession) {
      navigate(testRoomPath(room), { replace: true });
    }
  }, [room, route.id, navigate, type]);

  const { userProfile } = useAuth();

  useEffect(() => {
    if (review && room?.state === 'complete') {
      act('review').catch(() => {});
    }
  }, [review, room?.state, act]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const initial = useMemo(() => {
    if (!room?.snapshot || !room.own?.session_id) return null;
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
  }, [room?.own?.session_id, room?.state === 'complete', userProfile?.id]);

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

  if (!room) {
    if (error) {
      return <PairedRoomError error={error} act={act} type={type} />;
    }
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto">
        <RoomLoading />
      </div>
    );
  }

  if (room.test_type !== type) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto">
        <RoomLoading />
      </div>
    );
  }

  const isAwaitingSubmission = Boolean(room.own?.submitted_at);
  const isInActiveTest = room.state === 'running' || room.state === 'complete';
  const isLobbyOrPreparing = !isInActiveTest;
  const isWaiting = isAwaitingSubmission || isLobbyOrPreparing;

  const isCompleted = room.state === 'complete';
  const isReviewMode = review && isCompleted;
  const shouldRenderRoomView = (isWaiting || isCompleted) && !isReviewMode;

  if (shouldRenderRoomView) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto">
        <PairedRoomView {...state} />
      </div>
    );
  }

  const countdown = Math.max(0, Math.ceil((Date.parse(room.started_at) - now()) / 1000));
  const expired = room.state === 'running' && now() >= Date.parse(room.deadline);
  const partner = room.members.find((m) => m.user_id !== room.actor_id);
  const partnerSubmitted = Boolean(partner?.submitted_at);

  return (
    <PairedContext.Provider value={value}>
      <ActiveGateHeader
        type={type}
        onlineCount={state.onlineCount}
        connected={state.connected}
        partnerSubmitted={partnerSubmitted}
        review={review}
        tick={tick}
        onLeave={() => act('leave').catch(() => {})}
      />

      {error && (
        <div role="alert" className="p-2 text-sm text-[rgb(var(--signal-fault))] text-center">
          {error}
        </div>
      )}

      <ActiveGateContent
        conflict={conflict}
        countdown={countdown}
        expired={expired}
        initial={initial}
        onCheckResults={() => act('get').catch(() => {})}
      >
        {children}
      </ActiveGateContent>
    </PairedContext.Provider>
  );
}

export default function PairedTestGate({ children, type }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('room');
  const invitation = new URLSearchParams(location.hash.slice(1)).get('invite');
  const together = params.get('together') === 'true';

  const isPairedFlow = Boolean(id || invitation || together);
  if (!isPairedFlow) {
    return children;
  }

  if (!id) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto">
        <PairedTestEntry type={type} invitation={invitation} />
      </div>
    );
  }

  const isReview = params.get('review') === 'true';

  return (
    <ActiveGate key={id} id={id} type={type} review={isReview}>
      {children}
    </ActiveGate>
  );
}
