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
  { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', bar: 'bg-blue-600' },
  { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  { bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
  { bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
  { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-blue-200/80 dark:border-slate-800 shadow-sm space-y-3"
    >
      <h3 className="text-sm font-black text-slate-900 dark:text-white">Question Type Breakdown</h3>

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${desktopColumns} gap-2.5`}>
        {typeEntries.map((item, idx) => {
          const colorTheme = TYPE_COLORS[idx % TYPE_COLORS.length];
          const IconComponent = item.Icon;

          return (
            <div
              key={item.type}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2.5 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl ${colorTheme.bg} flex items-center justify-center shrink-0`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="min-h-[24px] text-xs font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {item.label}
                  </h4>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                  {item.correct}{' '}
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">/ {item.total}</span>
                </p>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {item.accuracy}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-slate-200/70 dark:bg-slate-700/60 rounded-full overflow-hidden">
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
