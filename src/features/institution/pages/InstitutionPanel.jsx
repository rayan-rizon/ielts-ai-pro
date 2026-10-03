import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, PauseCircle, RefreshCw, MailCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { institutionRequest } from '../services/institutions';
import InstitutionWorkspace from '../components/InstitutionWorkspace';
import InstitutionLayout from '../components/InstitutionLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function InstitutionPanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-label="Loading your institution…">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* 4-Stat Band Skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-5 rounded-md" />
            </div>
            <Skeleton className="h-7 w-12" />
          </Card>
        ))}
      </div>

      {/* Main Panels Skeleton */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="col-span-12 lg:col-span-7 p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-3/4" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </Card>
        <Card className="col-span-12 lg:col-span-5 p-6 space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-24 rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

export default function InstitutionPanel() {
  const [params] = useSearchParams();
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

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
        <div role={error ? 'alert' : 'status'}>
          {error ? (
            <Card className="border-destructive/30 p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-destructive">Unable to load institution</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
              <div className="pt-1">
                <Button variant="default" size="sm" onClick={load}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Try again
                </Button>
              </div>
            </Card>
          ) : (
            <InstitutionPanelSkeleton />
          )}
        </div>
      ) : !data.enabled && !isAdmin && selected ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <PauseCircle className="h-6 w-6 shrink-0 text-amber-500 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold tracking-tight text-foreground">
                Institution access is paused
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Institution operations have not been enabled by the platform administrator. Contact
                support for help. You can still return to your learner dashboard.
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <Button asChild size="sm">
              <Link to="/dashboard">Return to learner dashboard</Link>
            </Button>
          </div>
        </Card>
      ) : !selected ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3.5">
            <MailCheck className="h-6 w-6 shrink-0 text-primary dark:text-[#afb5ff] mt-0.5" />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold tracking-tight text-foreground">
                Your institution panel
              </h1>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Accept the owner invitation sent by a platform administrator to start managing your
                institution, buying seat allocations, and inviting students.
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/institution/apply">Request institution access</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <InstitutionWorkspace key={selected.id} institutionId={selected.id} standalone />
      )}
    </InstitutionLayout>
  );
}
