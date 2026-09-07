import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MICRO, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives.jsx';
import { ReiconArrowLeft, ReiconHeadphones, ReiconLock, ReiconUsers } from '@/components/ui/reicon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/cn';
import { pairedRequest, roomLobbyPath } from './pairedApi';
import { getMemberAvatarUrl } from './utils/avatar';
import PairedEntryDuoPreview from './components/PairedEntryDuoPreview';
import PairedEntrySteps from './components/PairedEntrySteps';
import PairedEntryConsentAndCta from './components/PairedEntryConsentAndCta';
import PairedEntryHistory from './components/PairedEntryHistory';

function testLabel(type) {
  return type === 'listening' ? 'Listening' : 'Reading';
}

const ERROR_PATTERNS = [
  {
    test: (m) => m.includes('origin'),
    message:
      'Unable to reach the paired study service from this address. Check your connection or retry.',
  },
  {
    test: (m) => m.includes('sign in'),
    message: 'Please sign in to start or join a paired test session.',
  },
  {
    test: (m) => m.includes('not available'),
    message: 'Paired practice is temporarily unavailable. Please check back shortly.',
  },
  {
    test: (m) => /timeout|network|reach/.test(m),
    message: 'Network timeout connecting to study room. Check your connection and retry.',
  },
];

function formatErrorMessage(raw) {
  if (!raw) return 'Unable to connect to the study room service. Please try again.';
  const msg = String(raw).toLowerCase();
  const matched = ERROR_PATTERNS.find(({ test }) => test(msg));
  return matched ? matched.message : raw;
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
  const studentAvatarUrl = getMemberAvatarUrl({ display_name: studentName }, true, userProfile);

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
            <PairedEntryDuoPreview
              studentName={studentName}
              studentAvatarUrl={studentAvatarUrl}
              invitation={invitation}
            />

            {/* How It Works - Themed Step Strip */}
            <PairedEntrySteps invitation={invitation} />

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
            <PairedEntryConsentAndCta
              consent={consent}
              setConsent={setConsent}
              consentError={consentError}
              setConsentError={setConsentError}
              error={error}
              busy={busy}
              loading={loading}
              invitation={invitation}
              preview={preview}
              proceed={proceed}
            />
          </div>
        </section>

        {/* Previous Paired Sessions List */}
        {!invitation && <PairedEntryHistory history={history} type={type} passageId={id} />}
      </div>
    </main>
  );
}
