import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Link,
  CheckSquare,
  ListOrdered,
  HelpCircle,
  MapPin,
  Network,
  Table2,
} from 'lucide-react';
import { QUESTION_TYPE_LABELS } from './utils';

const TYPE_ICONS = {
  note_completion: FileText,
  notes_completion: FileText,
  sentence_completion: FileText,
  summary_completion: FileText,
  gap_fill: FileText,
  matching: Link,
  matching_features: Link,
  matching_headings: Link,
  true_false_not_given: CheckSquare,
  yes_no_not_given: CheckSquare,
  multiple_choice: ListOrdered,
  map_labeling: MapPin,
  flowchart: Network,
  flow_chart_completion: Network,
  diagram_completion: Network,
  table_completion: Table2,
};

const TYPE_COLORS = [
  {
    bg: 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]',
    bar: 'bg-[#5a63df]',
  },
];

export function QuestionTypeBreakdown({ testResults }) {
  const typeStats = testResults?.typeStats;

  const typeEntries = React.useMemo(() => {
    if (!typeStats) return [];
    return Object.entries(typeStats)
      .filter(([, s]) => s.total > 0)
      .map(([type, s]) => {
        const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
        const label =
          QUESTION_TYPE_LABELS[type] ||
          type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        const Icon = TYPE_ICONS[type] || HelpCircle;
        return { type, label, correct: s.correct, total: s.total, accuracy, Icon };
      });
  }, [typeStats]);

  if (typeEntries.length === 0) return null;

  const desktopColumns =
    typeEntries.length >= 6
      ? 'lg:grid-cols-6'
      : typeEntries.length === 5
        ? 'lg:grid-cols-5'
        : 'lg:grid-cols-4';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] border border-[#e4e2f0] dark:border-white/[0.07] shadow-2xs space-y-3"
    >
      <h3 className="text-sm font-black text-slate-950 dark:text-white uppercase tracking-wider">
        Question Type Breakdown
      </h3>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${desktopColumns} gap-2.5`}>
        {typeEntries.map((item, idx) => {
          const colorTheme = TYPE_COLORS[idx % TYPE_COLORS.length];
          const IconComponent = item.Icon;

          return (
            <div
              key={item.type}
              className="p-3 rounded-xl bg-white/90 dark:bg-white/5 border border-[#e4e2f0] dark:border-white/[0.07] flex flex-col justify-between space-y-2.5 transition-all shadow-2xs hover:border-[#5a63df]/50 hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl ${colorTheme.bg} flex items-center justify-center shrink-0 shadow-2xs border border-current/10`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="min-h-[24px] text-xs font-extrabold text-slate-950 dark:text-white leading-tight line-clamp-2">
                    {item.label}
                  </h4>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <p className="text-xs font-black text-slate-950 dark:text-white leading-none">
                  {item.correct}{' '}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    / {item.total}
                  </span>
                </p>
                <span className="text-xs font-black text-[#5a63df] dark:text-[#a9afff]">
                  {item.accuracy}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.accuracy}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                  className={`h-full rounded-full ${colorTheme.bar}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default QuestionTypeBreakdown;
