import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { institutionRequest } from '../services/institutions';
import InstitutionLayout from '../components/InstitutionLayout';
import { PANEL, MUTED } from '@/features/dashboard/components/primitives';
export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { refreshProfile } = useAuth();
  const accept = async () => {
    setBusy(true);
    try {
      const result = await institutionRequest('accept', { token: params.get('token') });
      await cache.invalidateQueries({ queryKey: ['user'] });
      await refreshProfile();
      navigate(
        result.kind === 'owner'
          ? `/institution?institution=${result.institution_id}`
          : '/settings?tab=subscription'
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <InstitutionLayout navigation={false}>
      <section className={`${PANEL} mx-auto my-6 max-w-lg space-y-4 p-6`}>
        <h1 className="text-xl font-extrabold">Accept your institution invitation</h1>
        <p className={`${MUTED} text-sm`}>
          Sign in with the invited email. Student access starts when you accept, or waits until
          existing paid access ends. Personal subscriptions are never cancelled automatically.
        </p>
        {error && (
          <p role="alert" className="text-sm text-[rgb(var(--signal-fault))]">
            {error}
          </p>
        )}
        <button
          className="rounded bg-[#5a63df] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          disabled={busy || !params.get('token')}
          onClick={accept}
        >
          {busy ? 'Accepting…' : 'Accept invitation'}
        </button>
        <Link to="/dashboard" className="ml-3 text-sm text-[#5a63df]">
          Dashboard
        </Link>
      </section>
    </InstitutionLayout>
  );
}
