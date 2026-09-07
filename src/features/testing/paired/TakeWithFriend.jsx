import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Pill, TILE } from '@/features/dashboard/components/primitives';

export default function TakeWithFriend({ test, type, isLocked = false, compact = false }) {
  const totalQuestions = Number(test?.total_questions ?? test?.question_count ?? 40);
  const testType = type || test?.test_type;
  if (
    isLocked ||
    !test?.id ||
    !['reading', 'listening'].includes(testType) ||
    totalQuestions !== 40
  )
    return null;

  const destination = `/${testType}-test/${test.id}?together=true`;

  if (compact) {
    return (
      <Link
        to={destination}
        aria-label={`Take ${test.title || 'this test'} with a friend`}
        title="Take with a friend"
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-[#5a63df]/25 bg-[#5a63df]/[0.06] px-2 text-[10px] font-bold text-[#4f57cf] transition-colors hover:border-[#5a63df]/45 hover:bg-[#5a63df]/[0.11] dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.08] dark:text-[#b4b9ff]"
      >
        <Users className="h-3 w-3" />
        <span className="hidden sm:inline">Together</span>
      </Link>
    );
  }

  return (
    <div className="mt-2 border-t border-[#eceafa] pt-2 dark:border-white/[0.07]">
      <Link
        to={destination}
        aria-label="Take with a friend"
        className={cn(
          TILE,
          'group flex min-h-9 items-center gap-2 border-[#5a63df]/20 bg-[#5a63df]/[0.045] px-2.5 py-1.5 transition-colors hover:border-[#5a63df]/40 hover:bg-[#5a63df]/[0.085] dark:border-[#8f97ff]/20 dark:bg-[#8f97ff]/[0.06] dark:hover:bg-[#8f97ff]/[0.10]'
        )}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#5a63df] text-white">
          <Users className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-slate-800 dark:text-white">
          Test with a friend
        </span>
        <Pill tone="accent" className="px-1.5 py-0 text-[8px]">
          New
        </Pill>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#5a63df] transition-transform group-hover:translate-x-0.5 dark:text-[#aeb4ff]" />
      </Link>
    </div>
  );
}
