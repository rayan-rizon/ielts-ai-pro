import React from 'react';
import { Headphones, Mic } from 'lucide-react';
import { NUM } from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';

const waveformBarHeights = [8, 14, 18, 12, 20, 16, 10, 19, 14, 8, 16, 20, 11, 7, 15];

function ReadingSkillDemo() {
  return (
    <div className="space-y-2.5 w-full" aria-hidden="true">
      <div className="rounded-lg bg-white dark:bg-white/5 p-2.5 border border-[#e4e2f0]/70 dark:border-white/10 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-[#5a63df] dark:text-[#a9afff]">Academic Passage 2</span>
          <span className={cn(NUM, 'text-slate-500 dark:text-slate-400')}>Q 14–26</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
          The study observed a marked shift in{' '}
          <span className="bg-sky-500/15 border-b border-sky-500 font-semibold text-sky-700 dark:text-sky-300 px-0.5 rounded-xs">
            rapid urban transition
          </span>{' '}
          across modern metropolitan sectors.
        </p>
      </div>
      <div className="flex items-center justify-between text-[10px] px-1 font-semibold text-slate-600 dark:text-slate-400">
        <span>Target: Band 7.5+</span>
        <span className="text-emerald-600 dark:text-emerald-400">38/40 Correct</span>
      </div>
    </div>
  );
}

function ListeningSkillDemo() {
  return (
    <div className="space-y-2.5 w-full" aria-hidden="true">
      <div className="rounded-lg bg-white dark:bg-white/5 p-2.5 border border-[#e4e2f0]/70 dark:border-white/10 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5a63df]/15 text-[#5a63df] dark:bg-[#5a63df]/25 dark:text-[#a9afff]">
          <Headphones className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Section 3: Audio Track
            </span>
            <span className={cn(NUM, 'text-slate-500 dark:text-slate-400')}>02:45 / 04:30</span>
          </div>
          <div className="flex items-end gap-1 h-5 pt-1">
            {waveformBarHeights.map((height, i) => (
              <span
                key={i}
                style={{ height: `${height}px` }}
                className="il-wave-bar flex-1 bg-[#5a63df]/70 dark:bg-[#8f97ff]/70 rounded-xs"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] px-1 font-semibold text-slate-600 dark:text-slate-400">
        <span>Interactive Transcripts</span>
        <span className="text-[#5a63df] dark:text-[#8f97ff]">Cambridge Standard</span>
      </div>
    </div>
  );
}

function WritingSkillDemo() {
  return (
    <div className="space-y-2.5 w-full" aria-hidden="true">
      <div className="rounded-lg bg-white dark:bg-white/5 p-2.5 border border-[#e4e2f0]/70 dark:border-white/10 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Criterion Rubric</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            Band 7.5 Est.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[9px] font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex justify-between rounded bg-slate-50 dark:bg-white/[0.03] px-1.5 py-0.5">
            <span>Task Resp:</span>
            <b className="font-mono text-slate-900 dark:text-white">7.5</b>
          </div>
          <div className="flex justify-between rounded bg-slate-50 dark:bg-white/[0.03] px-1.5 py-0.5">
            <span>Coherence:</span>
            <b className="font-mono text-slate-900 dark:text-white">8.0</b>
          </div>
          <div className="flex justify-between rounded bg-slate-50 dark:bg-white/[0.03] px-1.5 py-0.5">
            <span>Lexical:</span>
            <b className="font-mono text-slate-900 dark:text-white">7.5</b>
          </div>
          <div className="flex justify-between rounded bg-slate-50 dark:bg-white/[0.03] px-1.5 py-0.5">
            <span>Grammar:</span>
            <b className="font-mono text-slate-900 dark:text-white">7.0</b>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] px-1 font-semibold text-slate-600 dark:text-slate-400">
        <span>Instant AI Corrections</span>
        <span className="text-emerald-600 dark:text-emerald-400">Task 1 & Task 2</span>
      </div>
    </div>
  );
}

function SpeakingSkillDemo() {
  return (
    <div className="space-y-2.5 w-full" aria-hidden="true">
      <div className="rounded-lg bg-white dark:bg-white/5 p-2.5 border border-[#e4e2f0]/70 dark:border-white/10 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-amber-600 dark:text-amber-400">Acoustic Analysis</span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">Band 8.0</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300">
            <Mic className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[9px] font-semibold text-slate-600 dark:text-slate-400">
              <span>Fluency & Coherence</span>
              <span>92%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] px-1 font-semibold text-slate-600 dark:text-slate-400">
        <span>Part 1, 2 & 3 Topics</span>
        <span className="text-amber-600 dark:text-amber-400">Model Responses</span>
      </div>
    </div>
  );
}

export default function SkillVisual({ index }) {
  if (index === 0) return <ReadingSkillDemo />;
  if (index === 1) return <ListeningSkillDemo />;
  if (index === 2) return <WritingSkillDemo />;
  return <SpeakingSkillDemo />;
}
