import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PANEL } from '@/features/dashboard/components/primitives';
import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import { skillMeta } from '../constants';
import { getGrammarGuide } from '../data/grammarGuideCatalog';
import { buildTableOfContents, parseGrammarGuide } from './guide/grammarGuideParser';
import { useActiveHeading } from './guide/useActiveHeading';
import { GuideNotFoundState } from './guide/GuideNotFoundState';
import { GuideLockedState } from './guide/GuideLockedState';
import { GuideHero } from './guide/GuideHero';
import { GuideSection } from './guide/GuideSection';
import { GuideFooterBanner } from './guide/GuideFooterBanner';
import { GuideSidebar } from './guide/GuideSidebar';

export default function GrammarGuidePage({
  resource,
  user,
  isStarting,
  isCompleted = false,
  guideProgressUnavailable = false,
  isUpdatingCompletion = false,
  onSetCompletion,
  onBack,
  onPractice,
}) {
  const sections = useMemo(
    () => (resource?.content_markdown ? parseGrammarGuide(resource.content_markdown) : []),
    [resource?.content_markdown]
  );

  const tableOfContents = useMemo(() => buildTableOfContents(sections), [sections]);

  const activeHeadingId = useActiveHeading(tableOfContents);

  if (!resource) {
    return <GuideNotFoundState onBack={onBack} />;
  }

  if (!hasContentAccess(user, resource.access_tier)) {
    return <GuideLockedState accessTier={resource.access_tier} onBack={onBack} />;
  }

  const meta = skillMeta(resource.skill_code);
  const previousGuide = getGrammarGuide(resource.previous_slug);
  const nextGuide = getGrammarGuide(resource.next_slug);

  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-extrabold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Grammar Lab
      </button>

      <GuideHero resource={resource} isCompleted={isCompleted} />

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <article className={cn(PANEL, 'space-y-5 px-4 py-5 sm:px-6 sm:py-6')}>
          {sections.map((section) => (
            <GuideSection key={section.id} section={section} />
          ))}

          <GuideFooterBanner
            skillCode={resource.skill_code}
            isCompleted={isCompleted}
            guideProgressUnavailable={guideProgressUnavailable}
            isStarting={isStarting}
            previousGuide={previousGuide}
            nextGuide={nextGuide}
            onPractice={onPractice}
          />
        </article>

        <GuideSidebar
          tableOfContents={tableOfContents}
          activeHeadingId={activeHeadingId}
          outcomeText={meta.guideOutcome || meta.transferHint}
          skillCode={resource.skill_code}
          isStarting={isStarting}
          isCompleted={isCompleted}
          guideProgressUnavailable={guideProgressUnavailable}
          isUpdatingCompletion={isUpdatingCompletion}
          previousGuide={previousGuide}
          nextGuide={nextGuide}
          onPractice={onPractice}
          onSetCompletion={onSetCompletion}
        />
      </div>
    </div>
  );
}
