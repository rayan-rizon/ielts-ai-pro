import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clock3,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  Users,
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
  TILE,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import { pairedRequest, roomLobbyPath } from './pairedApi';
import { RoomLoading } from './PairedRoomView';

function testLabel(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

export default function PairedTestEntry({ type, invitation }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setPreview(null);
    setConsent(false);
    const job = invitation
      ? pairedRequest('preview', null, { token: invitation })
      : pairedRequest('list');
    job
      .then((data) => {
        if (!live) return;
        if (invitation) {
          if (!data.preview) navigate(roomLobbyPath(data), { replace: true });
          else setPreview(data);
        } else setHistory(data.filter((room) => room.test_type === type));
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [invitation, navigate, type]);

  const proceed = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await pairedRequest(
        invitation ? 'join' : 'create',
        null,
        invitation ? { token: invitation, consent } : { passage_id: id, consent }
      );
      navigate(roomLobbyPath(result), { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-full w-full bg-[#f7f7fb] dark:bg-[#0b0b0e]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <header className={cn(PANEL, 'overflow-hidden')}>
          <div className="border-t-2 border-[#5a63df] p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <IconChip
                  icon={type === 'listening' ? Headphones : Users}
                  tone="accent"
                  size="md"
                />
                <div className="min-w-0">
                  <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                    {testLabel(type)} · paired practice
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {preview?.title || 'Take this test together'}
                  </h1>
                  <p className={cn(MUTED, 'mt-2 max-w-2xl text-sm leading-relaxed')}>
                    Invite one study partner, start from the same countdown, and turn one practice
                    test into a shared next step.
                  </p>
                </div>
              </div>
              <Pill tone="accent">Two students</Pill>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className={cn(TILE, 'p-3')}>
                <Clock3 className="h-4 w-4 text-[#5a63df]" />
                <p className={cn(MICRO, 'mt-2')}>Shared start</p>
                <p className="mt-0.5 text-xs font-semibold">One countdown</p>
              </div>
              <div className={cn(TILE, 'p-3')}>
                <Users className="h-4 w-4 text-[#5a63df]" />
                <p className={cn(MICRO, 'mt-2')}>Capacity</p>
                <p className={cn(NUM, 'mt-0.5 text-xs')}>2 students</p>
              </div>
              <div className={cn(TILE, 'p-3')}>
                <LockKeyhole className="h-4 w-4 text-slate-500" />
                <p className={cn(MICRO, 'mt-2')}>Privacy</p>
                <p className="mt-0.5 text-xs font-semibold">Answers private</p>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className={cn(
              TILE,
              'flex items-start gap-2 border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.08)] p-3 text-sm'
            )}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--signal-warn))]" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <RoomLoading />
        ) : (
          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <PanelTitle
              label={invitation ? 'Review the invitation' : 'Create your private room'}
              accent
            />
            <p className={cn(MUTED, 'max-w-2xl text-sm leading-relaxed')}>
              Both students use their own account and access. When both attempts are locked, you
              will share estimated bands, correct-answer totals, and skill breakdowns. Submitted
              answers never appear to your partner.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ['01', 'Join the lobby', 'Use a private invite link.'],
                ['02', 'Take it separately', 'Your answers stay yours.'],
                ['03', 'Review together', 'Compare skills at the end.'],
              ].map(([number, title, copy]) => (
                <div key={number} className={cn(TILE, 'flex gap-3 p-3')}>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#5a63df]/10 text-[10px] font-bold text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]">
                    {number}
                  </span>
                  <div>
                    <p className={TITLE}>{title}</p>
                    <p className={cn(MUTED, 'mt-0.5 text-xs')}>{copy}</p>
                  </div>
                </div>
              ))}
            </div>

            <label
              className={cn(
                TILE,
                'mt-5 flex cursor-pointer items-start gap-3 p-3 transition-colors hover:border-[#5a63df]/35'
              )}
            >
              <input
                className="mt-0.5 h-4 w-4 accent-[#5a63df]"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  I agree to share my results with my study partner.
                </span>
                <span className={cn(MUTED, 'mt-1 block text-xs')}>
                  This includes estimated band, total correct, and section/question-type breakdowns
                  only.
                </span>
              </span>
            </label>

            {preview && !preview.can_access ? (
              <p className="mt-4 text-sm">
                Your account needs access to this test before joining.{' '}
                <Link
                  className="font-semibold text-[#5a63df] underline underline-offset-2"
                  to="/pricing"
                >
                  View plans
                </Link>
              </p>
            ) : (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button disabled={busy || !consent || (!!invitation && !preview)} onClick={proceed}>
                  {busy
                    ? 'Preparing test…'
                    : invitation
                      ? 'Join private test'
                      : 'Create invitation'}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>
                <Button asChild variant="ghost">
                  <Link to={`/${type}`}>Back to {type} tests</Link>
                </Button>
              </div>
            )}
          </section>
        )}

        {!invitation && !loading && (
          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <PanelTitle label="Your paired attempts" />
            {history.length === 0 ? (
              <div className={cn(WELL, 'flex items-center gap-3 rounded-lg p-4')}>
                <Check className="h-4 w-4 text-slate-400" />
                <p className={cn(MUTED, 'text-sm')}>
                  Your first paired {type} attempt starts here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {history.map((room) => (
                  <li key={room.id} className={cn(TILE, 'p-3')}>
                    <Link
                      className="flex items-center justify-between gap-3 text-sm"
                      to={`/${type}-test/${id}?room=${room.id}`}
                    >
                      <span className="truncate font-semibold">{room.title}</span>
                      <Pill tone={room.state === 'complete' ? 'ok' : 'neutral'}>{room.state}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
