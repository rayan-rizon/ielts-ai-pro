import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { institutionRequest } from '../services/institutions';
import InstitutionWorkspace from '../components/InstitutionWorkspace';
import InstitutionLayout from '../components/InstitutionLayout';
import { PANEL, MUTED } from '@/features/dashboard/components/primitives';
export default function InstitutionPanel() {
  const [params] = useSearchParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setError('');
      setData(await institutionRequest('list'));
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const selected =
    data?.institutions.find((i) => i.id === params.get('institution')) || data?.institutions[0];
  const available = Boolean(data && selected && (data.enabled || isAdmin));
  return (
    <InstitutionLayout
      institution={selected}
      institutions={data?.institutions}
      preview={isAdmin}
      navigation={available}
    >
      {!data ? (
        <div className={`${PANEL} p-5`} role={error ? 'alert' : 'status'}>
          {error || 'Loading your institution…'}
          {error && (
            <button className="ml-3 text-[#5a63df] underline" onClick={load}>
              Try again
            </button>
          )}
        </div>
      ) : !data.enabled && !isAdmin ? (
        <div className={`${PANEL} p-5`}>
          <h1 className="font-bold">Institution access is paused</h1>
          <p className={`${MUTED} mt-2 text-sm`}>
            Contact support for help. You can still return to your learner dashboard.
          </p>
        </div>
      ) : !selected ? (
        <div className={`${PANEL} p-5`}>
          <h1 className="font-bold">Your institution panel</h1>
          <p className={`${MUTED} mt-2 text-sm`}>
            Accept the owner invitation sent by a platform administrator to start managing your
            institution.
          </p>
        </div>
      ) : (
        <InstitutionWorkspace key={selected.id} institutionId={selected.id} standalone />
      )}
    </InstitutionLayout>
  );
}
