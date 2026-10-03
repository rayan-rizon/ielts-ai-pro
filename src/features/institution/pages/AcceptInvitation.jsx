import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { institutionRequest } from '../services/institutions';
import InstitutionLayout from '../components/InstitutionLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AcceptInvitation() {
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const cache = useQueryClient();
  const { refreshProfile } = useAuth();

  const accept = async () => {
    setBusy(true);
    setError('');
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
      <Card className="mx-auto my-10 max-w-lg space-y-6 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
            <Building className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              Accept your institution invitation
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Use the email address this invitation was sent to. Owner invitations open the
              institution panel. Student invitations provide learning access, which waits until any
              existing paid access ends. Personal subscriptions continue normally.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Unable to accept invitation</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="default" disabled={busy || !params.get('token')} onClick={accept}>
            {busy ? 'Accepting…' : 'Accept invitation'}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="default">
            <Link to="/institution">Institution panel</Link>
          </Button>
        </div>
      </Card>
    </InstitutionLayout>
  );
}
