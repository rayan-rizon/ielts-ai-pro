import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Headphones,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelTitle,
  Pill,
  SectionLabel,
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import { testRoomPath, invitationPath } from './pairedApi';

const stateCopy = {
  lobby: { label: 'Lobby open', tone: 'accent', step: 1 },
  running: { label: 'In progress', tone: 'warn', step: 2 },
  grading: { label: 'Locking scores', tone: 'warn', step: 3 },
  complete: { label: 'Results ready', tone: 'ok', step: 4 },
};

function displayType(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

function displayQuestionType(type) {
  return type.replaceAll('_', ' ');
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function memberState(member) {
  if (member.submitted_at) return { label: 'Submitted', tone: 'ok', icon: CheckCircle2 };
  if (member.ready) return { label: 'Ready', tone: 'accent', icon: Check };
  return { label: 'Not ready', tone: 'neutral', icon: UserRound };
}

function SessionSteps({ state }) {
  const activeStep = stateCopy[state]?.step || 1;
  const steps = [
    ['01', 'Join lobby'],
    ['02', 'Take test'],
    ['03', 'Compare'],
  ];
  return (
    <div className={cn(TILE, 'grid grid-cols-3 gap-2 p-2 sm:p-3')} aria-label="Session progress">
      {steps.map(([number, label], index) => {
        const step = index + 1;
        const complete = activeStep > step;
        const current = activeStep === step;
        return (
          <div
            key={label}
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-md px-2 py-2 transition-colors sm:px-3',
              current && 'bg-[#5a63df]/[0.08] dark:bg-[#8f97ff]/[0.12]',
              complete && 'text-[rgb(var(--signal-ok))]'
            )}
          >
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold',
                complete && 'border-[rgb(var(--signal-ok)/0.35)] bg-[rgb(var(--signal-ok)/0.1)]',
                current && 'border-[#5a63df]/35 bg-[#5a63df] text-white',
                !complete && !current && 'border-slate-200 text-slate-400 dark:border-white/10'
              )}
            >
              {complete ? <Check className="h-3 w-3" /> : number}
            </span>
            <span
              className={cn(
                MICRO,
                'truncate',
                current ? 'text-[#5a63df] dark:text-[#afb5ff]' : MUTED
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ParticipantCard({ member, isMine, complete }) {
  const status = memberState(member);
  const StatusIcon = status.icon;
  return (
    <section
      className={cn(PANEL, 'p-4 sm:p-5', isMine && 'border-[#5a63df]/30 dark:border-[#8f97ff]/30')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold',
              isMine
                ? 'bg-[#5a63df] text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200'
            )}
            aria-hidden="true"
          >
            {initials(member.display_name)}
          </div>
          <div className="min-w-0">
            <h2 className={cn(TITLE, 'truncate')}>
              {member.display_name}
              {isMine ? <span className={cn(MUTED, 'ml-1 font-normal')}>(you)</span> : null}
            </h2>
            <p className={cn(MICRO, 'mt-1 flex items-center gap-1.5', MUTED)}>
              <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
              {isMine ? 'Your private attempt' : 'Study partner'}
            </p>
          </div>
        </div>
        <Pill tone={status.tone}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Pill>
      </div>

      {complete && member.summary ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className={cn(WELL, 'rounded-lg p-3')}>
            <p className={cn(MICRO, MUTED)}>estimated band</p>
            <p className={cn(NUM, 'mt-1 text-3xl font-bold text-slate-900 dark:text-white')}>
              {member.summary.bandScore.toFixed(1)}
            </p>
          </div>
          <div className={cn(WELL, 'rounded-lg p-3')}>
            <p className={cn(MICRO, MUTED)}>Correct answers</p>
            <p className={cn(NUM, 'mt-1 text-3xl font-bold text-slate-900 dark:text-white')}>
              {member.summary.correctAnswers}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/40</span>
            </p>
          </div>
        </div>
      ) : (
        <div className={cn(TILE, 'mt-5 flex items-center gap-3 p-3')}>
          <IconChip icon={status.icon} tone={status.tone === 'neutral' ? 'neutral' : 'accent'} />
          <div>
            <p className={TITLE}>
              {member.submitted_at
                ? 'Attempt locked'
                : member.ready
                  ? 'Ready to start'
                  : 'Waiting for readiness'}
            </p>
            <p className={cn(MUTED, 'mt-0.5 text-xs')}>
              {member.submitted_at
                ? 'Your answers are safely saved.'
                : member.ready
                  ? 'You will start on the shared countdown.'
                  : 'This student has not joined the start line yet.'}
            </p>
          </div>
        </div>
      )}

      {member.interrupted && (
        <p className="mt-3 text-xs text-[rgb(var(--signal-warn))]">
          Connection or playback was interrupted.
        </p>
      )}
      {member.finish_reason === 'deadline' && (
        <p className="mt-3 text-xs text-[rgb(var(--signal-warn))]">
          Time expired. Last server-saved answers were submitted.
        </p>
      )}
      {member.finish_reason === 'left' && (
        <p className="mt-3 text-xs text-slate-500">Left before finishing.</p>
      )}
    </section>
  );
}

function Breakdown({ member }) {
  const summary = member.summary;
  if (!summary) return null;
  return (
    <section className={cn(PANEL, 'p-4 sm:p-5')}>
      <PanelTitle label={`${member.display_name}'s skill breakdown`} accent />
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionLabel accent>By part</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {summary.sectionStats.map((section, index) => {
              const percent = section.total
                ? Math.round((section.correct / section.total) * 100)
                : 0;
              return (
                <div key={`${section.title}-${index}`}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-slate-600 dark:text-slate-300">
                      {section.title}
                    </span>
                    <span className={cn(NUM, 'shrink-0 text-slate-700 dark:text-slate-200')}>
                      {section.correct}/{section.total}
                    </span>
                  </div>
                  <div className={cn(WELL, 'mt-1.5 h-1.5 overflow-hidden rounded-full')}>
                    <div
                      className="h-full rounded-full bg-[#5a63df] transition-all duration-500 dark:bg-[#8f97ff]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <SectionLabel>By question type</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {Object.entries(summary.typeStats).map(([type, score]) => {
              const percent = score.total ? Math.round((score.correct / score.total) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate capitalize text-slate-600 dark:text-slate-300">
                      {displayQuestionType(type)}
                    </span>
                    <span className={cn(NUM, 'shrink-0 text-slate-700 dark:text-slate-200')}>
                      {score.correct}/{score.total}
                    </span>
                  </div>
                  <div className={cn(WELL, 'mt-1.5 h-1.5 overflow-hidden rounded-full')}>
                    <div
                      className="h-full rounded-full bg-slate-400 transition-all duration-500 dark:bg-slate-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RoomLoading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 p-4 sm:p-6" aria-label="Loading study room">
      <div className={cn(PANEL, 'h-44 animate-pulse')} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className={cn(PANEL, 'h-56 animate-pulse')} />
        <div className={cn(PANEL, 'h-56 animate-pulse')} />
      </div>
    </div>
  );
}

export default function PairedRoomView({ room, act, error, onlineCount = 0 }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const mine = room.members.find((member) => member.user_id === room.actor_id) || room.members[0];
  const state = stateCopy[room.state] || stateCopy.lobby;
  const bothComplete = room.state === 'complete';
  const summaries = room.members.map((member) => member.summary).filter(Boolean);
  const commonWeak = useMemo(() => {
    if (summaries.length !== 2) return [];
    return Object.keys(summaries[0].typeStats).filter((type) =>
      summaries.every(
        (summary) =>
          summary.typeStats[type]?.total > 0 &&
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
      if (room.test_type === 'listening' && !mine.ready) {
        await Promise.all(
          room.audio_sources.map(
            (src) =>
              new Promise((resolve, reject) => {
                const audio = new Audio(src);
                audio.preload = 'auto';
                audio.muted = true;
                const timeout = setTimeout(
                  () => done(new Error('Audio is taking too long to load. Try again.')),
                  15000
                );
                function done(err) {
                  clearTimeout(timeout);
                  audio.pause();
                  audio.removeAttribute('src');
                  audio.load();
                  err ? reject(err) : resolve();
                }
                audio.oncanplay = () => {
                  audio.oncanplay = null;
                  audio
                    .play()
                    .then(() => done())
                    .catch(() => done(new Error('Enable audio in your browser, then try again.')));
                };
                audio.onerror = () => done(new Error('One audio part could not load. Try again.'));
              })
          )
        );
      }
      await act('ready', { ready: !mine.ready });
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitationPath(room)}`);
      setNotice('Invitation copied. It expires after 24 hours.');
    } catch {
      setNotice('Clipboard unavailable. Copy the invitation below.');
    }
  };

  return (
    <main className="min-h-full w-full bg-[#f7f7fb] dark:bg-[#0b0b0e]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className={cn(PANEL, 'overflow-hidden')}>
          <div className="border-t-2 border-[#5a63df] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <IconChip
                  icon={room.test_type === 'listening' ? Headphones : BookOpen}
                  tone="accent"
                  size="md"
                />
                <div className="min-w-0">
                  <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                    Study partners · {displayType(room.test_type)}
                  </p>
                  <h1 className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {room.title}
                  </h1>
                  <p className={cn(MUTED, 'mt-2 max-w-2xl text-sm leading-relaxed')}>
                    Work independently, start together, and compare the skills that matter. Your
                    submitted answers stay private.
                  </p>
                </div>
              </div>
              <Pill tone={state.tone}>{state.label}</Pill>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className={cn(TILE, 'flex items-center gap-2 p-3')}>
                <Clock3 className="h-4 w-4 text-[#5a63df]" />
                <div>
                  <p className={MICRO}>Duration</p>
                  <p className={cn(NUM, 'mt-0.5 text-sm')}>
                    {Math.ceil(room.duration_seconds / 60)} min
                  </p>
                </div>
              </div>
              <div className={cn(TILE, 'flex items-center gap-2 p-3')}>
                <Users className="h-4 w-4 text-[#5a63df]" />
                <div>
                  <p className={MICRO}>Room</p>
                  <p className={cn(NUM, 'mt-0.5 text-sm')}>{room.members.length}/2 joined</p>
                </div>
              </div>
              <div className={cn(TILE, 'flex items-center gap-2 p-3')}>
                <Wifi className="h-4 w-4 text-[rgb(var(--signal-ok))]" />
                <div>
                  <p className={MICRO}>Live now</p>
                  <p className={cn(NUM, 'mt-0.5 text-sm')}>{onlineCount} connected</p>
                </div>
              </div>
              <div className={cn(TILE, 'flex items-center gap-2 p-3')}>
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <div>
                  <p className={MICRO}>Privacy</p>
                  <p className="mt-0.5 text-xs font-semibold">Answers private</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <SessionSteps state={room.state} />

        {(error || notice) && (
          <div
            role="alert"
            className={cn(
              TILE,
              'flex items-start gap-2 border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.08)] p-3 text-sm'
            )}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-warn))]" />
            <span>{notice || error}</span>
          </div>
        )}

        <section>
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div>
              <p className={MICRO}>Participants</p>
              <h2 className={cn(TITLE, 'mt-1 text-base')}>
                {bothComplete ? 'Your shared result' : 'Ready when you are'}
              </h2>
            </div>
            {!bothComplete && (
              <p className={cn(MICRO, MUTED)}>
                {room.members.length === 2 ? 'Both students joined' : 'Waiting for one student'}
              </p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {room.members.map((member) => (
              <ParticipantCard
                key={member.user_id}
                member={member}
                isMine={member.user_id === room.actor_id}
                complete={bothComplete}
              />
            ))}
          </div>
        </section>

        {room.members.length === 1 && room.state === 'lobby' && (
          <div className={cn(TILE, 'flex items-center gap-3 p-4')}>
            <IconChip icon={Users} tone="accent" />
            <div>
              <p className={TITLE}>Your lobby is ready</p>
              <p className={cn(MUTED, 'mt-0.5 text-xs')}>
                Share the private invitation so your friend can join this exact test.
              </p>
            </div>
          </div>
        )}

        {bothComplete && (
          <>
            <section className={cn(PANEL, 'p-4 sm:p-5')}>
              <PanelTitle label="At a glance" accent />
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {room.members.map((member) => (
                  <div key={member.user_id} className={cn(TILE, 'p-3')}>
                    <p className={cn(MICRO, 'truncate')}>
                      {member.user_id === room.actor_id
                        ? 'Your band'
                        : `${member.display_name}'s band`}
                    </p>
                    <p
                      className={cn(NUM, 'mt-1 text-2xl font-bold text-slate-900 dark:text-white')}
                    >
                      {member.summary?.bandScore?.toFixed(1) || '—'}
                    </p>
                  </div>
                ))}
                <div className={cn(TILE, 'p-3')}>
                  <p className={MICRO}>Your accuracy</p>
                  <p className={cn(NUM, 'mt-1 text-2xl font-bold text-slate-900 dark:text-white')}>
                    {mine.summary?.percentage ?? '—'}
                    <span className="text-sm font-normal">%</span>
                  </p>
                </div>
                <div className={cn(TILE, 'p-3')}>
                  <p className={MICRO}>Room status</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[rgb(var(--signal-ok))]">
                    <CheckCircle2 className="h-4 w-4" /> Complete
                  </p>
                </div>
              </div>
            </section>
            <div className="grid gap-4 lg:grid-cols-2">
              {room.members.map((member) => (
                <Breakdown key={member.user_id} member={member} />
              ))}
            </div>
            {commonWeak.length > 0 && (
              <section className={cn(PANEL, 'border-[#5a63df]/20 p-4 sm:p-5')}>
                <div className="flex items-start gap-3">
                  <IconChip icon={Sparkles} tone="accent" size="md" />
                  <div>
                    <p className={MICRO}>Shared practice signal</p>
                    <h2 className={cn(TITLE, 'mt-1 text-base')}>Practice these together next</h2>
                    <p className={cn(MUTED, 'mt-1 text-sm')}>
                      Both of you scored below 60% in{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {commonWeak.map(displayQuestionType).join(', ')}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {room.state === 'running' && mine.submitted_at && (
          <div className={cn(TILE, 'flex items-center gap-3 p-4')} role="status">
            <IconChip icon={LockKeyhole} tone="ok" />
            <div>
              <p className={TITLE}>Your answers are locked</p>
              <p className={cn(MUTED, 'mt-0.5 text-xs')}>
                Waiting for your partner or the deadline.
              </p>
            </div>
          </div>
        )}

        {room.state === 'lobby' && room.invite_token && (
          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <div className="flex items-start gap-3">
              <IconChip icon={Clipboard} tone="accent" size="md" />
              <div className="min-w-0 flex-1">
                <p className={MICRO}>Private invitation</p>
                <h2 className={cn(TITLE, 'mt-1')}>Send this link to your study partner</h2>
                <p className={cn(MUTED, 'mt-1 text-xs')}>
                  It expires after 24 hours and can only be used once.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="paired-invitation-link">
                Private invitation link
              </label>
              <input
                id="paired-invitation-link"
                aria-label="Private invitation link"
                readOnly
                className={cn(
                  TILE,
                  'min-w-0 flex-1 px-3 py-2.5 text-xs text-slate-600 outline-none dark:text-slate-300'
                )}
                value={`${window.location.origin}${invitationPath(room)}`}
                onFocus={(event) => event.target.select()}
              />
              <Button variant="outline" onClick={copyInvitation}>
                <Clipboard className="h-4 w-4" /> Copy link
              </Button>
            </div>
          </section>
        )}

        <div
          className={cn(
            PANEL,
            'flex flex-col gap-3 bg-white p-3 dark:bg-[#141319] sm:flex-row sm:items-center sm:justify-between sm:p-4'
          )}
        >
          <div className="min-w-0">
            <p className={MICRO}>Next action</p>
            <p className={cn(TITLE, 'mt-1 truncate')}>
              {bothComplete
                ? 'Keep the momentum going'
                : room.state === 'lobby'
                  ? 'Get both students ready'
                  : room.state === 'running'
                    ? 'Stay focused on your attempt'
                    : 'Your comparison is almost ready'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {room.state === 'lobby' && (
              <>
                <Button disabled={busy} onClick={ready}>
                  {busy
                    ? 'Checking…'
                    : mine.ready
                      ? 'Not ready'
                      : room.test_type === 'listening'
                        ? 'Check audio & ready'
                        : 'Ready'}
                </Button>
                {room.host_id === room.actor_id && (
                  <Button
                    variant="secondary"
                    disabled={
                      busy ||
                      room.members.length !== 2 ||
                      room.members.some((member) => !member.ready)
                    }
                    onClick={() => run('start')}
                  >
                    <Play className="h-4 w-4" /> Start together
                  </Button>
                )}
                <Button variant="ghost" disabled={busy} onClick={() => run('leave')}>
                  Leave room
                </Button>
              </>
            )}
            {room.state === 'running' && !mine.submitted_at && (
              <Button onClick={() => navigate(testRoomPath(room))}>
                Open test <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {bothComplete && (
              <>
                <Button asChild>
                  <Link to={`${testRoomPath(room)}&review=true&view-results=true`}>
                    My private review
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/${room.test_type}`}>
                    <RotateCcw className="h-4 w-4" /> Take another together
                  </Link>
                </Button>
              </>
            )}
            <Button asChild variant="ghost">
              <Link to={`/${room.test_type}`}>
                <BookOpen className="h-4 w-4" /> Browse tests
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
