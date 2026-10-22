import React from 'react';
import { BookOpenText } from 'lucide-react';
import { IconChip } from '@/features/dashboard/components/primitives';
import { GuideBlock } from './GuideBlock';
import { InteractiveAnswerCheck } from './InteractiveAnswerCheck';
import { isAnswerSection } from './grammarGuideParser';

function SectionHeader({ title }) {
  if (!title) return null;

  return (
    <div className="mb-3 flex items-start gap-2.5">
      <IconChip icon={BookOpenText} size="md" />
      <div>
        <h2 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
    </div>
  );
}

export function GuideSection({ section, guideSlug }) {
  if (isAnswerSection(section)) {
    return (
      <section id={section.id} className="scroll-mt-24 pb-1">
        <InteractiveAnswerCheck
          section={section}
          storageKey={`${guideSlug}:${section.practiceContext?.id || section.id}`}
        />
      </section>
    );
  }

  if (!section.title && !section.blocks.length) {
    return null;
  }

  return (
    <section
      id={section.id}
      className="scroll-mt-24 border-b border-[#eceafa]/60 pb-5 last:border-0 dark:border-white/10"
    >
      <SectionHeader title={section.title} />
      <div className="space-y-3">
        {section.blocks.map((block, index) => (
          <GuideBlock key={`${section.id}-${block.type}-${index}`} block={block} index={index} />
        ))}
      </div>
    </section>
  );
}
