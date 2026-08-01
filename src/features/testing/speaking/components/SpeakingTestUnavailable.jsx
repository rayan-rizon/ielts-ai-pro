import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

export default function SpeakingTestUnavailable({ error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6fd] p-6 dark:bg-[#0b0a0f]">
      <div className={cn(PANEL, 'w-full max-w-md rounded-2xl p-8 text-center')}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <AlertTriangle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-50">
          Test Not Available
        </h2>
        <p className={cn(MUTED, 'mb-6')}>{error}</p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to={createPageUrl('Speaking')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Link>
          </Button>
          <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white">
            <Link to={createPageUrl('Dashboard')}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
