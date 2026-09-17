import React from 'react';
import { BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { MUTED, PANEL } from '@/features/dashboard/components/primitives';

export function GuideNotFoundState({ onBack }) {
  return (
    <section className={cn(PANEL, 'mx-auto max-w-3xl p-8 text-center')}>
      <BookOpenText className="mx-auto h-8 w-8 text-[#5a63df]" />
      <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
        Guide not found
      </h1>
      <p className={cn('mt-2 text-sm font-medium', MUTED)}>
        This Grammar Lab guide is not available.
      </p>
      <Button onClick={onBack} variant="outline" className="mt-5 rounded-lg font-bold">
        Back to Grammar Lab
      </Button>
    </section>
  );
}
