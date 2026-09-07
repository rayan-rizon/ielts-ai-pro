import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import { pairedRequest, roomLobbyPath } from './pairedApi';

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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-5 sm:px-6 sm:py-7">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={`/${type}`}>
            <ArrowLeft className="h-4 w-4" /> Back to {type} tests
          </Link>
        </Button>

        <section className={cn(PANEL, 'overflow-hidden border-[#5a63df]/25')}>
          <div className="border-t-2 border-[#5a63df] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <IconChip icon={type === 'listening' ? Headphones : Users} tone="accent" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn(MICRO, 'text-[#5a63df] dark:text-[#afb5ff]')}>
                    {testLabel(type)} · practice together
                  </p>
                  <Pill tone="accent" className="px-1.5 py-0 text-[8px]">
                    2 students
                  </Pill>
                </div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                  {preview?.title || 'Test with a friend'}
                </h1>
                <p className={cn(MUTED, 'mt-1 text-sm leading-relaxed')}>
                  Invite one friend, start together, and compare scores after both finish.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                [Clock3, 'Shared start'],
                [LockKeyhole, 'Private answers'],
                [Users, 'Compare scores'],
              ].map(([Icon, label]) => (
                <span
                  key={label}
                  className={cn(
                    TILE,
                    'inline-flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold'
                  )}
                >
                  <Icon className="h-3 w-3 text-[#5a63df]" /> {label}
                </span>
              ))}
            </div>

            <div className="my-5 border-t border-[#eceafa] dark:border-white/[0.07]" />

            <h2 className={cn(TITLE, 'text-sm')}>
              {invitation ? 'Join this private test' : 'Create a private room'}
            </h2>
            <p className={cn(MUTED, 'mt-1 text-xs leading-relaxed')}>
              Your friend sees your final band, correct total, and skill breakdown. Your answers
              stay private.
            </p>

            <ol className="mt-3 grid gap-1.5 sm:grid-cols-3" aria-label="How paired practice works">
              {['Invite a friend', 'Take the test', 'Compare results'].map((label, index) => (
                <li key={label} className={cn(TILE, 'flex items-center gap-2 px-2.5 py-2')}>
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#5a63df]/10 text-[9px] font-bold text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#afb5ff]">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                </li>
              ))}
            </ol>

            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[#e4e2f0] px-3 py-2.5 transition-colors hover:border-[#5a63df]/35 dark:border-white/[0.07]">
              <input
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#5a63df]"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                I agree to share my final results with my study partner.
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-lg border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.08)] px-3 py-2 text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-warn))]" />
                <span>{error}</span>
              </div>
            )}

            {preview && !preview.can_access ? (
              <p className="mt-3 text-xs">
                Your account needs access to this test before joining.{' '}
                <Link
                  className="font-semibold text-[#5a63df] underline underline-offset-2"
                  to="/pricing"
                >
                  View plans
                </Link>
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  disabled={busy || loading || !consent || (!!invitation && !preview)}
                  onClick={proceed}
                >
                  {busy ? 'Preparing…' : invitation ? 'Join test' : 'Create invitation'}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>
                {loading && <span className={cn(MICRO, MUTED)}>Checking availability…</span>}
              </div>
            )}
          </div>
        </section>

        {!invitation && !loading && history.length > 0 && (
          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <p className={cn(MICRO, MUTED)}>Recent paired tests</p>
            <ul className="mt-2 space-y-1.5">
              {history.map((room) => (
                <li key={room.id} className={cn(TILE, 'px-3 py-2')}>
                  <Link
                    className="flex items-center justify-between gap-3 text-xs"
                    to={`/${type}-test/${id}?room=${room.id}`}
                  >
                    <span className="truncate font-semibold">{room.title}</span>
                    <Pill tone={room.state === 'complete' ? 'ok' : 'neutral'}>{room.state}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
