import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, PenLine, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ITEM_VARIANTS } from '../constants';

const MODULE_CONFIG = {
  writing: {
    icon: PenLine,
    color: 'text-violet-500',
    gradientFrom: 'from-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    label: 'Writing score areas',
  },
  speaking: {
    icon: Mic2,
    color: 'text-rose-500',
    gradientFrom: 'from-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Speaking score areas',
  },
};

const CRITERION_EXPLANATIONS = {
  'Task Achievement': 'How fully and accurately you answer Task 1',
  'Task Response': 'How fully and clearly you develop your Task 2 answer',
  'Coherence & Cohesion': 'How clearly your ideas connect and flow',
  'Lexical Resource': 'Your range and accuracy of vocabulary',
  'Grammatical Range & Accuracy': 'Your range and accuracy of sentence structures',
  'Fluency & Coherence': 'How smoothly and clearly you speak',
  Pronunciation: 'How easy your speech is to understand',
};

function CriteriaBar({ label, score, sampleCount, color, index }) {
  const pct = score != null ? Math.round((score / 9) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground/80">{label}</span>
          {CRITERION_EXPLANATIONS[label] ? (
            <p className="text-[10px] font-medium text-muted-foreground">
              {CRITERION_EXPLANATIONS[label]}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground">
            {sampleCount > 0
              ? `${sampleCount} evaluation${sampleCount === 1 ? '' : 's'}`
              : 'Unavailable'}
          </span>
          <span
            className={cn(
              'text-sm font-black tabular-nums',
              score == null ? 'text-muted-foreground/40' : 'text-foreground'
            )}
          >
            {score != null ? score.toFixed(1) : '—'}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full bg-muted/30 dark:bg-white/[0.03] rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: index * 0.06 + 0.1, duration: 0.65, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r shadow-[0_0_8px_rgba(99,102,241,0.2)]',
            color
          )}
          style={{ minWidth: pct > 0 ? '4px' : '0' }}
        />
      </div>
    </motion.div>
  );
}

/**
 * CriteriaBreakdownCard
 *
 * Displays the per-criteria average scores for Writing or Speaking.
 * Shows a clean empty state when criteria data doesn't exist yet.
 */
export default function CriteriaBreakdownCard({ module, criteria, labels }) {
  const config = MODULE_CONFIG[module];
  if (!config) return null;

  const Icon = config.icon;
  const hasData = criteria?.hasData;

  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full">
      <Card className="flex h-full flex-col justify-between rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative">
        <CardHeader className="px-5 pt-4.5 pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'flex h-8.5 w-8.5 items-center justify-center rounded-xl shadow-xs',
                  module === 'writing'
                    ? 'bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300'
                    : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/70 dark:bg-rose-500/20 dark:text-rose-300'
                )}
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
              </div>
              <CardTitle className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                {config.label}
              </CardTitle>
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">
              IELTS avg / 9.0
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-center px-5 pb-5 relative z-10">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center my-auto">
              <div
                className={cn('w-9 h-9 rounded-2xl flex items-center justify-center', config.bg)}
              >
                <Info className={cn('w-4.5 h-4.5', config.color)} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
                Complete a {module} test with AI feedback to see these score areas.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {Object.entries(labels).map(([key, label], idx) => (
                <CriteriaBar
                  key={key}
                  label={label}
                  score={criteria[key]}
                  sampleCount={criteria.sampleCounts?.[key] || 0}
                  color={
                    module === 'writing'
                      ? 'from-[#5661e9] to-[#818cf8]'
                      : 'from-rose-500 to-amber-500'
                  }
                  index={idx}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
