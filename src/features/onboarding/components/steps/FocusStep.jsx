import React from 'react';
import { BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WELL } from '@/features/dashboard/components/primitives';
import OnboardingChoice from '../OnboardingChoice';

const MODULES = [
  {
    id: 'writing',
    title: 'Writing',
    icon: PenTool,
    description: 'Task 1 & 2 practice with AI feedback',
  },
  {
    id: 'speaking',
    title: 'Speaking',
    icon: Mic,
    description: 'Build fluency and confidence',
  },
  {
    id: 'reading',
    title: 'Reading',
    icon: BookOpen,
    description: 'Practice comprehension and timing',
  },
  {
    id: 'listening',
    title: 'Listening',
    icon: Headphones,
    description: 'Train your ear with exam-style audio',
  },
];

export default function FocusStep({ weakArea, onChangeWeakArea }) {
  const selected = MODULES.find((item) => item.id === weakArea);
  return (
    <div className="onboarding-focus">
      <div className="onboarding-choice-grid">
        {MODULES.map((item, index) => (
          <OnboardingChoice
            key={item.id}
            {...item}
            index={index}
            selected={weakArea === item.id}
            onClick={() => onChangeWeakArea(item.id)}
          />
        ))}
      </div>
      <div
        className={cn(WELL, 'onboarding-note mt-4')}
        role="status"
        data-rise
        style={{ '--i': 7 }}
      >
        {selected ? (
          <span key={selected.id} className="onboarding-swap">
            We'll start with a <strong>{selected.title.toLowerCase()} level check</strong>, then
            build practice around your results.
          </span>
        ) : (
          <span>
            Choose where you'd like to start. Your plan will still include all four skills.
          </span>
        )}
      </div>
    </div>
  );
}
