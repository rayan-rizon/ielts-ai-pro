import React from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AdminButton, BODY, PANEL, PanelHeader } from '@/components/admin/ui/primitives';

export function SecurityLoadingSkeleton() {
  return (
    <div className="grid max-w-6xl grid-cols-12 gap-3 animate-pulse">
      <div className="col-span-12 h-48 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
      <div className="col-span-12 lg:col-span-7 h-80 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
      <div className="col-span-12 lg:col-span-5 h-80 rounded-xl border border-stone-200 dark:border-white/[0.07] bg-stone-100 dark:bg-white/5" />
    </div>
  );
}

export function SecurityLoadErrorPanel({ error, onRetry, loading }) {
  return (
    <section className={cn(PANEL, 'max-w-6xl overflow-hidden')}>
      <PanelHeader
        label="Admin security"
        title="Security controls could not be loaded"
        description="No authenticator or session totals are shown until the live security state can be verified."
        accent="fault"
      />
      <div className="flex flex-wrap items-center gap-3 p-4">
        <CircleAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-300" />
        <p className={cn(BODY, 'min-w-0 flex-1 text-rose-700 dark:text-rose-200')}>{error}</p>
        <AdminButton onClick={onRetry} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </AdminButton>
      </div>
    </section>
  );
}
