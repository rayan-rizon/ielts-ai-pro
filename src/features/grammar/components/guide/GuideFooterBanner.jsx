import React from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function getFooterBannerSubtitle(guideProgressUnavailable, isCompleted) {
  if (guideProgressUnavailable) {
    return 'Your guide progress is temporarily unavailable. You can still read and practise.';
  }
  if (isCompleted) {
    return 'Great progress! Reinforce this rule in practice, or advance to the next unit.';
  }
  return 'Mark it complete to record your progress in Grammar Lab.';
}

function UnitNavigationLinks({ previousGuide, nextGuide }) {
  if (!previousGuide && !nextGuide) return null;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-[#eceafa] pt-4 dark:border-white/10">
      {previousGuide ? (
        <Link
          to={`/grammar/guides/${previousGuide.slug}`}
          className="group inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 transition hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
          <span>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Previous
            </span>
            Unit {previousGuide.unit_number}: {previousGuide.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {nextGuide && (
        <Link
          to={`/grammar/guides/${nextGuide.slug}`}
          className="group inline-flex items-center gap-2 text-right text-xs font-extrabold text-[#5a63df] transition hover:text-[#4a52c9] dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <span>
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Next Unit
            </span>
            Unit {nextGuide.unit_number}: {nextGuide.title}
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function GuideFooterBanner({
  skillCode,
  isCompleted,
  guideProgressUnavailable,
  isStarting,
  previousGuide,
  nextGuide,
  onPractice,
}) {
  const subtitle = getFooterBannerSubtitle(guideProgressUnavailable, isCompleted);

  return (
    <div className="mt-6 rounded-xl border border-[#e4e2f0] bg-linear-to-br from-white to-[#faf9ff] p-4 sm:p-5 dark:border-white/10 dark:from-[#141319] dark:to-[#100f15]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> {isCompleted ? 'Guide completed' : 'End of guide'}
          </div>
          <h3 className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {isCompleted ? 'You completed this unit!' : 'Finished reading this guide?'}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => onPractice(skillCode)}
            disabled={isStarting}
            className="rounded-xl bg-[#5a63df] text-xs font-extrabold text-white shadow-xs transition hover:bg-[#4a52c9] active:scale-[0.99]"
          >
            Start practice set <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <UnitNavigationLinks previousGuide={previousGuide} nextGuide={nextGuide} />
    </div>
  );
}
