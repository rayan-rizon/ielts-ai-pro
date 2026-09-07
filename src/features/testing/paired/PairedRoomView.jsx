import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ReiconLock } from '@/components/ui/reicon';
import { TITLE } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import { invitationPath } from './pairedApi';
import { preloadListeningAudios } from './utils/audioPreloader';

import PairedRoomHeader from './components/PairedRoomHeader';
import PairedRoomInviteHero from './components/PairedRoomInviteHero';
import ParticipantCard from './components/ParticipantCard';
import WaitingPartnerCard from './components/WaitingPartnerCard';
import PairedRoomComparison from './components/PairedRoomComparison';
import PairedRoomActionDock from './components/PairedRoomActionDock';

export { default as RoomLoading } from './components/RoomLoading';

export default function PairedRoomView({ room, act, error, onlineCount = 0 }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const mine = room.members.find((member) => member.user_id === room.actor_id) || room.members[0];
  const partner =
    room.members.find((member) => member.user_id !== room.actor_id) || room.members[1];
  const partnerName = partner
    ? (partner.display_name || 'Partner').replace(/[()]/g, '').trim()
    : 'Partner';

  const mineBand = mine?.summary?.bandScore ?? 0;
  const partnerBand = partner?.summary?.bandScore ?? 0;
  const bandDelta = Number((mineBand - partnerBand).toFixed(1));
  const correctDelta =
    (mine?.summary?.correctAnswers ?? 0) - (partner?.summary?.correctAnswers ?? 0);
  const bothComplete = room.state === 'complete';

  useEffect(() => {
    if (bothComplete) {
      setNotice('');
    }
  }, [bothComplete]);

  const summaries = useMemo(
    () => room.members.map((member) => member.summary).filter(Boolean),
    [room.members]
  );

  const commonWeak = useMemo(() => {
    if (summaries.length !== 2) return [];
    return Object.keys(summaries[0].typeStats || {}).filter((type) =>
      summaries.every(
        (summary) =>
          summary.typeStats?.[type]?.total > 0 &&
          summary.typeStats[type].correct / summary.typeStats[type].total < 0.6
      )
    );
  }, [summaries]);

  const run = async (action, data = {}) => {
    setBusy(true);
    setNotice('');
    try {
      await act(action, data);
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  const ready = async () => {
    setBusy(true);
    setNotice('');
    try {
      if (room.test_type === 'listening' && !mine?.ready && Array.isArray(room.audio_sources)) {
        await preloadListeningAudios(room.audio_sources);
      }
      await act('ready', { ready: !mine?.ready });
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitationPath(room)}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      // Graceful fallback if clipboard API is restricted
    }
  };

  return (
    <main className="min-h-full w-full bg-[#f4f3fb] dark:bg-[#08080a] py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:gap-3.5">
        <PairedRoomHeader room={room} onlineCount={onlineCount} bothComplete={bothComplete} />

        {room.state === 'lobby' && (
          <PairedRoomInviteHero room={room} copied={copied} copyInvitation={copyInvitation} />
        )}

        {(error || (!bothComplete && notice)) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] p-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-warn))]" />
            <span className="flex-1">{error || notice}</span>
          </div>
        )}

        <section>
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {bothComplete ? 'Your shared result' : 'Ready when you are'}
              </h2>
            </div>
            {!bothComplete && (
              <div className="flex items-center gap-1.5 rounded-md border border-[#e4e2f0] bg-white px-2 py-0.5 shadow-2xs dark:border-white/[0.08] dark:bg-[#15141d]">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    room.members.length === 2 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  )}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {room.members.length === 2 ? 'Both students joined' : 'Waiting for one student'}
                </span>
              </div>
            )}
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            {room.members.map((member) => (
              <ParticipantCard
                key={member.user_id}
                member={member}
                isMine={member.user_id === room.actor_id}
                complete={bothComplete}
              />
            ))}
            {room.members.length === 1 && !bothComplete && (
              <WaitingPartnerCard copyInvitation={copyInvitation} copied={copied} />
            )}
          </div>
        </section>

        {bothComplete && (
          <PairedRoomComparison
            room={room}
            mine={mine}
            partner={partner}
            partnerName={partnerName}
            bandDelta={bandDelta}
            correctDelta={correctDelta}
            commonWeak={commonWeak}
          />
        )}

        {room.state === 'running' && mine?.submitted_at && (
          <div
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 sm:p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20"
            role="status"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <ReiconLock className="h-4 w-4" />
            </div>
            <div>
              <p className={cn(TITLE, 'text-emerald-900 dark:text-emerald-200')}>
                Your answers are locked
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Waiting for your partner or the deadline.
              </p>
            </div>
          </div>
        )}

        <PairedRoomActionDock
          room={room}
          bothComplete={bothComplete}
          mine={mine}
          busy={busy}
          ready={ready}
          run={run}
        />
      </div>
    </main>
  );
}
