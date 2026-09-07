import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  ROW_CHEVRON,
  ROW_HOVER,
  TILE,
} from '@/features/dashboard/components/primitives.jsx';
import {
  ReiconAlertCircle,
  ReiconArrowLeft,
  ReiconArrowRight,
  ReiconChevronRight,
  ReiconClock,
  ReiconHeadphones,
  ReiconLock,
  ReiconRefresh,
  ReiconTrophy,
  ReiconUsers,
} from '@/components/ui/reicon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/cn';
import { pairedRequest, roomLobbyPath } from './pairedApi';

const stateCopy = {
  lobby: { label: 'Lobby open', tone: 'accent' },
  running: { label: 'In progress', tone: 'warn' },
  grading: { label: 'Locking scores', tone: 'warn' },
  complete: { label: 'Results ready', tone: 'ok' },
};

function testLabel(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatErrorMessage(raw) {
  if (!raw) return 'Unable to connect to the study room service. Please try again.';
  const msg = String(raw).toLowerCase();
  if (msg.includes('origin')) {
    return 'Unable to reach the paired study service from this address. Check your connection or retry.';
  }
  if (msg.includes('sign in')) {
    return 'Please sign in to start or join a paired test session.';
  }
  if (msg.includes('not available')) {
    return 'Paired practice is temporarily unavailable. Please check back shortly.';
  }
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('reach')) {
    return 'Network timeout connecting to study room. Check your connection and retry.';
  }
  return raw;
}

export default function PairedTestEntry({ type, invitation }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [loading, setLoading] = useState(true);

  const studentName = userProfile?.full_name || userProfile?.display_name || 'You';

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setPreview(null);
    setConsent(false);
    setConsentError(false);

    if (invitation) {
      pairedRequest('preview', null, { token: invitation })
        .then((data) => {
          if (!live) return;
          if (!data.preview) navigate(roomLobbyPath(data), { replace: true });
          else setPreview(data);
        })
        .catch((e) => {
          if (live) setError(formatErrorMessage(e.message));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    } else {
      setLoading(false);
      pairedRequest('list')
        .then((data) => {
          if (live && Array.isArray(data)) {
            setHistory(data.filter((room) => room.test_type === type));
          }
        })
        .catch(() => {
          // Quietly degrade history on background network error
        });
    }

    return () => {
      live = false;
    };
  }, [invitation, navigate, type]);

  const proceed = async () => {
    if (!consent) {
      setConsentError(true);
      return;
    }
    setBusy(true);
    setError('');
    setConsentError(false);
    try {
      const result = await pairedRequest(
        invitation ? 'join' : 'create',
        null,
        invitation ? { token: invitation, consent: true } : { passage_id: id, consent: true }
      );
      navigate(roomLobbyPath(result), { replace: true });
    } catch (e) {
      setError(formatErrorMessage(e.message));
    } finally {
      setBusy(false);
    }
  };

  const steps = [
    {
      step: '01',
      title: invitation ? 'Join lobby' : 'Create & invite',
      desc: invitation ? 'Enter room with partner' : 'Get private room link',
      icon: ReiconUsers,
      current: true,
    },
    {
      step: '02',
      title: 'Start together',
      desc: 'Synced timer & questions',
      icon: ReiconClock,
      current: false,
    },
    {
      step: '03',
      title: 'Compare scores',
      desc: 'Band score & breakdown',
      icon: ReiconTrophy,
      current: false,
    },
  ];

  return (
    <main className="min-h-full w-full bg-[#f4f3fb] dark:bg-[#08080a] py-6 sm:py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-3.5">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Link to={`/${type}`}>
              <ReiconArrowLeft className="h-3.5 w-3.5" /> Back to {testLabel(type)} tests
            </Link>
          </Button>
        </div>

        {/* Main Themed Panel */}
        <section
          className={cn(
            PANEL,
            'overflow-hidden border-[#5a63df]/25 shadow-sm dark:border-white/[0.08]'
          )}
        >
          <div className="border-t-2 border-[#5a63df] p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start gap-3.5 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#5a63df]/12 text-[#5a63df] ring-4 ring-[#5a63df]/5 dark:bg-[#8f97ff]/20 dark:text-[#afb5ff] dark:ring-[#8f97ff]/10">
                {type === 'listening' ? (
                  <ReiconHeadphones className="h-6 w-6" />
                ) : (
                  <ReiconUsers className="h-6 w-6" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                    {testLabel(type).toUpperCase()} · PRACTICE TOGETHER
                  </span>
                  <Pill tone="accent" className="px-1.5 py-0 text-[8px]">
                    2 Students
                  </Pill>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {preview?.title || 'Test with a friend'}
                </h1>
                <p className={cn(MUTED, 'mt-1 text-xs sm:text-sm leading-relaxed')}>
                  {invitation
                    ? 'Your study partner invited you to take this test together in real time.'
                    : 'Invite a study partner, start simultaneously, and compare scores after both finish.'}
                </p>
              </div>
            </div>

            {/* Live 2-Seat Duo Room Preview */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#e4e2f2] bg-[#f8f7fd] p-2 dark:border-white/[0.08] dark:bg-white/[0.03]">
              {/* Slot 1: You */}
              <div className="flex items-center gap-2.5 rounded-lg border border-[#e2dff2] bg-white p-2.5 shadow-2xs dark:border-white/10 dark:bg-[#15141c]">
                <div className="relative">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#5a63df]/15 text-[11px] font-bold text-[#5a63df] dark:bg-[#8f97ff]/20 dark:text-[#afb5ff]">
                    {initials(studentName)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[rgb(var(--signal-ok))] ring-2 ring-white dark:ring-[#15141c]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {studentName}
                  </p>
                  <p className={cn(MICRO, 'text-[8px] text-[#5a63df] dark:text-[#afb5ff]')}>
                    {invitation ? 'Ready to join' : 'Host (You)'}
                  </p>
                </div>
              </div>

              {/* Slot 2: Study Partner */}
              <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-300 bg-white/60 p-2.5 dark:border-white/15 dark:bg-white/[0.02]">
                <div className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-slate-300 text-slate-400 dark:border-white/20">
                  <ReiconUsers className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {invitation ? 'Inviting Partner' : 'Study Partner'}
                  </p>
                  <p className={cn(MICRO, MUTED, 'text-[8px]')}>
                    {invitation ? 'Waiting in lobby' : 'Awaiting invite link'}
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works - Themed Step Strip */}
            <div className="mt-2.5 rounded-xl border border-[#e8e6f5] bg-[#f8f7fd] p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5a63df]" />
                  <span className={cn(MICRO, MUTED, 'text-[9px] tracking-wider')}>
                    Session steps
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-[#e4e2f2] bg-white/90 px-1.5 py-0.5 shadow-2xs dark:border-white/[0.08] dark:bg-[#15141d]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[9px] font-semibold text-slate-600 dark:text-slate-300">
                    40 Questions · Real-time Sync
                  </span>
                </div>
              </div>

              <ol className="grid grid-cols-3 gap-2" aria-label="How paired practice works">
                {steps.map(({ step, title, desc, icon: Icon, current }) => (
                  <li
                    key={step}
                    className={cn(
                      'group relative flex flex-col justify-between rounded-lg border p-2 transition-all duration-200',
                      current
                        ? 'border-[#5a63df]/45 bg-white shadow-xs ring-1 ring-[#5a63df]/20 dark:border-[#5a63df]/50 dark:bg-[#15141d]'
                        : 'border-[#e4e2f2] bg-white/80 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-[#131218]/80 dark:hover:bg-[#16151f]'
                    )}
                  >
                    <div>
                      {/* Step Number + Icon Header */}
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn(
                            NUM,
                            'inline-flex h-4 px-1 items-center justify-center rounded text-[8.5px] font-extrabold tracking-tight',
                            current
                              ? 'bg-[#5a63df] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
                          )}
                        >
                          {step}
                        </span>
                        <div
                          className={cn(
                            'grid h-4 w-4 place-items-center rounded transition-colors',
                            current
                              ? 'text-[#5a63df] dark:text-[#afb5ff]'
                              : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                      </div>

                      {/* Step Title */}
                      <h2 className="text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                        {title}
                      </h2>

                      {/* Step Description */}
                      <p className="mt-0.5 text-[9.5px] leading-tight text-slate-500 text-balance dark:text-slate-400">
                        {desc}
                      </p>
                    </div>

                    {/* Step Stage Tag */}
                    <div className="mt-1.5 flex items-center gap-1 border-t border-[#eceafa] pt-1 dark:border-white/[0.06]">
                      <span
                        className={cn(
                          'h-1 w-1 rounded-full',
                          current ? 'bg-[#5a63df]' : 'bg-slate-300 dark:bg-slate-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-mono text-[7.5px] font-bold uppercase tracking-wider',
                          current
                            ? 'text-[#5a63df] dark:text-[#afb5ff]'
                            : 'text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {current ? 'Active' : step === '02' ? 'In test' : 'Results'}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Privacy Trust Note */}
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#e8e6f5] bg-white/70 px-2.5 py-1.5 text-xs text-slate-600 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-300">
              <ReiconLock className="h-3.5 w-3.5 shrink-0 text-[#5a63df] dark:text-[#afb5ff]" />
              <p className="text-[10.5px] leading-snug text-balance">
                <strong className="font-semibold text-slate-700 dark:text-slate-200">
                  Answers stay private:
                </strong>{' '}
                Your partner only sees final band score, correct total, and skill breakdown.
              </p>
            </div>

            {/* Consent & Launch Area */}
            <div className="mt-4 space-y-3 pt-3.5 border-t border-[#eceafa] dark:border-white/[0.07]">
              {/* Consent Card */}
              <label
                htmlFor="paired-consent"
                className={cn(
                  'group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                  consent
                    ? 'border-[#5a63df]/40 bg-[#5a63df]/[0.05] dark:border-[#8f97ff]/35 dark:bg-[#8f97ff]/[0.08]'
                    : 'border-[#e4e2f0] bg-[#fbfbfe] hover:border-[#5a63df]/35 hover:bg-[#f7f6fd] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]',
                  consentError &&
                    !consent &&
                    'border-[rgb(var(--signal-fault)/0.6)] bg-[rgb(var(--signal-fault)/0.04)]',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#5a63df] has-[:focus-visible]:ring-offset-2'
                )}
              >
                <input
                  id="paired-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setConsentError(false);
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#5a63df] accent-[#5a63df] cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <span className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                    I agree to share my final test results with my study partner
                  </span>
                  <span className={cn(MUTED, 'block text-[11px] mt-0.5 leading-normal')}>
                    Required to generate the shared scoreboard and compare performance breakdown.
                  </span>
                  {consentError && !consent && (
                    <span className="mt-1 block text-[11px] font-semibold text-[rgb(var(--signal-fault))]">
                      Please check this box to agree before continuing.
                    </span>
                  )}
                </div>
              </label>

              {/* Error recovery alert */}
              {error && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[rgb(var(--signal-fault)/0.35)] bg-[rgb(var(--signal-fault)/0.08)] text-xs text-[rgb(var(--signal-fault))] dark:bg-[rgb(var(--signal-fault)/0.14)]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ReiconAlertCircle className="h-4 w-4 shrink-0 text-[rgb(var(--signal-fault))]" />
                    <span className="leading-snug">{error}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => proceed()}
                    disabled={busy}
                    className="h-7 shrink-0 gap-1.5 border-[rgb(var(--signal-fault)/0.4)] bg-white px-2.5 text-xs font-semibold text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] dark:bg-[#1c1a22]"
                  >
                    <ReiconRefresh className={cn('h-3 w-3', busy && 'animate-spin')} />
                    Try again
                  </Button>
                </div>
              )}

              {/* CTA Button */}
              {preview && !preview.can_access ? (
                <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] text-xs dark:border-amber-400/25 dark:bg-amber-400/[0.08]">
                  <p className="text-slate-700 dark:text-slate-200">
                    Your account needs access to this test before joining.{' '}
                    <Link
                      className="font-bold text-[#5a63df] underline underline-offset-2 dark:text-[#afb5ff]"
                      to="/pricing"
                    >
                      View plans
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="pt-1">
                  <Button
                    disabled={busy || loading || (!!invitation && !preview)}
                    onClick={proceed}
                    className="w-full h-11 text-xs font-bold gap-2 rounded-xl bg-[#5a63df] hover:bg-[#4a52c9] text-white shadow-xs hover:shadow transition-all active:scale-[0.99]"
                  >
                    {busy ? (
                      <>
                        <ReiconRefresh className="h-3.5 w-3.5 animate-spin" />
                        {invitation ? 'Joining room…' : 'Creating room…'}
                      </>
                    ) : (
                      <>
                        {invitation ? 'Join study room' : 'Create room & invite'}
                        <ReiconArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                  <p className="mt-2 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    {invitation
                      ? 'You will enter the synchronized waiting room once joined.'
                      : 'Generates an instant 24-hour private invitation link for your study partner.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Previous Paired Sessions List */}
        {!invitation && history.length > 0 && (
          <section
            className={cn(PANEL, 'mt-4 overflow-hidden border-[#e4e2f0] dark:border-white/[0.08]')}
          >
            <div className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className={cn(MICRO, MUTED)}>Recent paired sessions</p>
                <Pill tone="neutral" className="px-1.5 py-0 text-[8px]">
                  {history.length} {history.length === 1 ? 'room' : 'rooms'}
                </Pill>
              </div>
              <ul className="space-y-1.5">
                {history.map((room) => {
                  const stateInfo = stateCopy[room.state] || { label: room.state, tone: 'neutral' };
                  return (
                    <li key={room.id}>
                      <Link
                        to={`/${type}-test/${id}?room=${room.id}`}
                        className={cn(
                          TILE,
                          ROW_HOVER,
                          'group flex items-center justify-between gap-3 p-3 text-xs rounded-lg'
                        )}
                      >
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {room.title || `${testLabel(type)} Practice`}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <Pill tone={stateInfo.tone}>{stateInfo.label}</Pill>
                          <ReiconChevronRight className={cn(ROW_CHEVRON, 'h-3.5 w-3.5')} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
