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
    label: 'Writing Criteria',
  },
  speaking: {
    icon: Mic2,
    color: 'text-rose-500',
    gradientFrom: 'from-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Speaking Criteria',
  },
};

function CriteriaBar({ label, score, color, index }) {
  const pct = score != null ? Math.round((score / 9) * 100) : 0;
  const isWeak = score != null && score < 6.0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="space-y-1"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
        <div className="flex items-center gap-1.5">
          {isWeak && (
            <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full animate-pulse-subtle uppercase tracking-wider">
              Focus area
            </span>
          )}
          <span
            className={cn(
              'text-[12px] font-black tabular-nums',
              score == null
                ? 'text-muted-foreground/40'
                : isWeak
                  ? 'text-amber-500'
                  : 'text-foreground'
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
    <motion.div variants={ITEM_VARIANTS}>
      <Card
        className={cn(
          'rounded-2xl border bg-white/80 dark:bg-slate-950/60 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden relative',
          config.border
        )}
      >
        {/* Decorative Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:12px_12px]"
          data-oid="criteria-grid"
        />

        <CardHeader className="px-4 pt-4 pb-2 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', config.bg)}>
                <Icon className={cn('w-3.5 h-3.5', config.color)} />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">{config.label}</CardTitle>
            </div>
            <span className="text-[9px] text-muted-foreground/60 font-semibold tracking-wider uppercase">
              IELTS avg / 9.0
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 relative z-10">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
              <div
                className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.bg)}
              >
                <Info className={cn('w-4 h-4', config.color)} />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground/60 max-w-[180px] leading-relaxed">
                Complete a {module} test with AI evaluation to see your criteria breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-1">
              {Object.entries(labels).map(([key, label], idx) => (
                <CriteriaBar
                  key={key}
                  label={label}
                  score={criteria[key]}
                  color={
                    module === 'writing'
                      ? 'from-violet-500 to-indigo-500'
                      : 'from-rose-500 to-orange-500'
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
