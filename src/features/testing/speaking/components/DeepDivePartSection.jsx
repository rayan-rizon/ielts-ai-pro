import React from 'react';
import { MessageSquare, Mic2, Brain } from 'lucide-react';
import QuestionAccordionItem from './QuestionAccordionItem';

const PART_THEMES = {
  1: {
    name: 'Part 1: Introduction',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/10',
    icon: MessageSquare,
  },
  2: {
    name: 'Part 2: Long Turn',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/10',
    icon: Mic2,
  },
  3: {
    name: 'Part 3: Discussion',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/10',
    icon: Brain,
  },
};

export default function DeepDivePartSection({
  partNumber,
  partQuestions,
  detailedFeedback,
  isAllExpanded,
  expandedQuestion,
  onToggleQuestion,
}) {
  if (partQuestions.length === 0) return null;

  const theme = PART_THEMES[partNumber];
  const ThemeIcon = theme.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-2">
        <div
          className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center border ${theme.border}`}
        >
          <ThemeIcon className={`w-4 h-4 ${theme.color}`} />
        </div>
        <h4 className={`text-[11px] font-extrabold uppercase tracking-[0.3em] ${theme.color}`}>
          {theme.name}
        </h4>
        <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent ml-2" />
      </div>

      <div className="space-y-2.5">
        {partQuestions.map((item, localIdx) => {
          const globalIdx = detailedFeedback.indexOf(item);
          const isExpanded = isAllExpanded || expandedQuestion === globalIdx;

          return (
            <QuestionAccordionItem
              key={globalIdx}
              item={item}
              localIdx={localIdx}
              globalIdx={globalIdx}
              isExpanded={isExpanded}
              onToggle={() => onToggleQuestion(globalIdx)}
            />
          );
        })}
      </div>
    </div>
  );
}
