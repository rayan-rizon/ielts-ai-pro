import React from 'react';
import { ArrowRight, BookOpen, Headphones, Mic2, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MUTED,
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives.jsx';

const SUBJECTS = [
  {
    key: 'reading',
    title: 'Reading',
    icon: BookOpen,
    tone: 'emerald',
    detail: 'Understand passages and answer different question types.',
  },
  {
    key: 'listening',
    title: 'Listening',
    icon: Headphones,
    tone: 'sky',
    detail: 'Listen for key information and practise following conversations.',
  },
  {
    key: 'writing',
    title: 'Writing',
    icon: PenLine,
    tone: 'rose',
    detail: 'Get feedback on your ideas, structure, vocabulary, and grammar.',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    icon: Mic2,
    tone: 'amber',
    detail: 'Record your answers and get feedback on your speaking.',
  },
];

export default function FirstTestPanel({
  navigate,
  hasPreviousTests = false,
  awaitingScore = false,
}) {
  return (
    <section
      className={cn(PANEL, 'mx-auto max-w-4xl p-5 sm:p-7')}
      aria-labelledby="first-test-title"
    >
      <Pill tone="accent">Your Learning Path</Pill>
      <h1
        id="first-test-title"
        className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white"
      >
        {awaitingScore
          ? 'Your plan starts with your scored result'
          : hasPreviousTests
            ? 'Take a new test to update your study plan'
            : 'Start with a test. Build a plan around your results.'}
      </h1>
      <p className={cn('mt-2 max-w-2xl text-sm leading-relaxed', MUTED)}>
        {awaitingScore
          ? 'Your recent test does not have a completed score yet. Once your result is ready, we can use it to build your plan.'
          : hasPreviousTests
            ? 'We need a usable scored result from the last 90 days. A new test will help us plan from your current level.'
            : 'Your study plan is based on your actual IELTS test results. Complete a test in Practice Mode so we can recommend what to work on next.'}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SUBJECTS.map(({ key, title, icon, tone, detail }) => (
          <button
            key={key}
            type="button"
            onClick={() => navigate(`/${key}?mode=practice`)}
            className={cn(
              TILE,
              'group flex min-w-0 items-start gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]'
            )}
          >
            <IconChip icon={icon} tone={tone} />
            <span className="min-w-0 flex-1">
              <span className={cn(TITLE, 'block')}>{title}</span>
              <span className={cn('mt-1 block text-xs leading-relaxed', MUTED)}>{detail}</span>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#5a63df] dark:text-[#afb5ff]">
                Start {title.toLowerCase()} practice{' '}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className={cn('mt-4 text-xs leading-relaxed', MUTED)}>
        Choose any subject to begin. Your first scored test starts your plan; results from more
        subjects make it more complete. Start with feedback in Practice Mode. As you build
        experience, your plan will introduce Exam Mode to check your progress under test conditions.
      </p>
    </section>
  );
}
