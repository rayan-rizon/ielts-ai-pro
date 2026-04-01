import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, PenLine, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
            <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
              Focus area
            </span>
          )}
          <span
            className={cn(
              'text-[13px] font-black tabular-nums',
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
      <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: index * 0.06 + 0.1, duration: 0.6, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r to-transparent', color)}
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
          'rounded-2xl border bg-card/90 backdrop-blur-md shadow-sm transition-shadow duration-300 hover:shadow-lg overflow-hidden',
          config.border
        )}
      >
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn('p-1.5 rounded-lg', config.bg)}>
                <Icon className={cn('w-3.5 h-3.5', config.color)} />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">{config.label}</CardTitle>
            </div>
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              IELTS avg / 9.0
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
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
                  color={`${config.gradientFrom} via-${module === 'writing' ? 'violet' : 'rose'}-400`}
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
