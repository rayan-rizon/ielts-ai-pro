import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Zap,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  HelpCircle,
  MousePointer2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface ErrorPatterns {
  nearMissCount: number;
  troubleTypes: string[];
  unansweredCount: number;
  changedAnswers: number;
  totalAnswerChanges: number;
  confidenceIndex: number;
  indecisionScore: number;
}

interface CognitiveInsightsCardProps {
  errorPatterns: ErrorPatterns | null;
  totalQuestions: number;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  matching_headings: 'Matching Headings',
  table_completion: 'Table Completion',
  matching: 'Matching',
  matching_features: 'Matching Features',
  multiple_choice: 'Multiple Choice',
  true_false_not_given: 'True/False/NG',
  yes_no_not_given: 'Yes/No/NG',
  sentence_completion: 'Sentence Completion',
  summary_completion: 'Summary Completion',
  note_completion: 'Note Completion',
  notes_completion: 'Notes Completion',
  flow_chart_completion: 'Flow Chart',
  diagram_completion: 'Diagram',
  short_answer: 'Short Answer',
  gap_fill: 'Gap Fill',
  map_labeling: 'Map Labeling',
  flowchart: 'Flowchart',
};

export function CognitiveInsightsCard({
  errorPatterns,
  totalQuestions,
}: CognitiveInsightsCardProps) {
  if (!errorPatterns) return null;

  const {
    confidenceIndex,
    indecisionScore,
    totalAnswerChanges,
    changedAnswers,
    nearMissCount,
    unansweredCount,
    troubleTypes,
  } = errorPatterns;

  const getConfidenceLabel = (val: number) => {
    if (val >= 85) return { label: 'Sure', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (val >= 60) return { label: 'Steady', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (val >= 40) return { label: 'Shaky', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Unsure', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  };

  const conf = getConfidenceLabel(confidenceIndex);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
      data-oid="pr069cw"
    >
      {/* Background Glow */}
      <div
        className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/5 blur-[80px]"
        data-oid="too10t2"
      />

      <div
        className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-500/5 blur-[80px]"
        data-oid="lhsx0op"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4" data-oid="z4sdawj">
        <div className="flex items-center gap-2.5" data-oid=":r9df5r">
          <div
            className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500"
            data-oid="yq8alv-"
          >
            <Brain className="w-4.5 h-4.5" data-oid="t8cgqiq" />
          </div>
          <div data-oid="cqvodjl">
            <h3
              className="text-sm font-black text-slate-900 dark:text-white leading-none"
              data-oid="ipka7u0"
            >
              Thinking Patterns
            </h3>
            <p
              className="text-[9px] tracking-wider font-bold text-slate-400 mt-0.5"
              data-oid="66mh1sx"
            >
              Mental Performance
            </p>
          </div>
        </div>
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest',
            conf.bg,
            conf.color
          )}
          data-oid="2k62.17"
        >
          {conf.label}
        </div>
      </div>

      {/* Main Cognitive Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5" data-oid="pzzj9ga">
        <div
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
          data-oid="s:sgj15"
        >
          <div className="flex items-center justify-between mb-2" data-oid="ysldjf:">
            <span
              className="text-[9px] font-black text-slate-400 tracking-widest"
              data-oid="pjc66q6"
            >
              Choice Score
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" data-oid="bu8btbr" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white" data-oid="6jtbqhk">
            {confidenceIndex}
            <span className="text-xs font-bold ml-1 text-slate-400" data-oid="t8cyf9p">
              /100
            </span>
          </div>
          <div
            className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-[1px]"
            data-oid="o877eco"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidenceIndex}%` }}
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              data-oid="05js.vy"
            />
          </div>
        </div>

        <div
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
          data-oid="gg8.me7"
        >
          <div className="flex items-center justify-between mb-2" data-oid="stdx6p6">
            <span
              className="text-[9px] font-black text-slate-400 tracking-widest"
              data-oid="hizxwws"
            >
              Doubt Level
            </span>
            <Activity className="w-3.5 h-3.5 text-amber-500" data-oid="jwwalm_" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white" data-oid="vkq.tk-">
            {indecisionScore}
            <span className="text-xs font-bold ml-1 text-slate-400" data-oid="i:a1iu1">
              %
            </span>
          </div>
          <p
            className="mt-0.5 text-[9px] font-black text-slate-500 tracking-tight"
            data-oid="-2pwfn0"
          >
            Changed answers
          </p>
        </div>
      </div>

      {/* Behavioral Insights */}
      <div className="space-y-3 mb-4" data-oid="p:vn9k_">
        <div className="flex items-center justify-between px-1" data-oid="k3s9w_5">
          <div
            className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"
            data-oid="7e7o9yw"
          >
            <MousePointer2 className="w-3 h-3" data-oid="hukprca" /> Interaction Patterns
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2" data-oid="yc5hmq4">
          <div
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm hover:border-blue-500/20 transition-colors"
            data-oid="typnhn0"
          >
            <div className="text-sm font-black text-slate-900 dark:text-white" data-oid="rqldgqj">
              {totalAnswerChanges}
            </div>
            <div
              className="text-[8px] font-black text-slate-400 tracking-widest mt-0.5"
              data-oid="r6cg8-v"
            >
              Changes
            </div>
          </div>
          <div
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm hover:border-emerald-500/20 transition-colors"
            data-oid="iu_x4v1"
          >
            <div className="text-sm font-black text-slate-900 dark:text-white" data-oid="9:d3v26">
              {nearMissCount}
            </div>
            <div
              className="text-[8px] font-black text-slate-400 tracking-widest mt-0.5"
              data-oid="8jo:d.2"
            >
              Near Misses
            </div>
          </div>
          <div
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center shadow-sm hover:border-rose-500/20 transition-colors"
            data-oid="x6tafr5"
          >
            <div className="text-sm font-black text-slate-900 dark:text-white" data-oid="gt.0_ib">
              {unansweredCount}
            </div>
            <div
              className="text-[8px] font-black text-slate-400 tracking-widest mt-0.5"
              data-oid="mf_u5o8"
            >
              Blanks
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas - Question Types to Improve */}
      {troubleTypes && troubleTypes.length > 0 && (
        <div className="space-y-2 mb-4" data-oid="eo0r2mq">
          <div
            className="flex items-center gap-2 text-[9px] font-black text-slate-400 tracking-widest px-1"
            data-oid="9ossbm8"
          >
            <AlertTriangle className="w-3 h-3" data-oid="-aa8s9f" /> Focus Areas
          </div>
          <div className="flex flex-wrap gap-1.5" data-oid="_9_9xsq">
            {troubleTypes.slice(0, 3).map((type, idx) => (
              <span
                key={type}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-bold',
                  idx === 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                )}
                data-oid="1durv__"
              >
                {QUESTION_TYPE_LABELS[type] || type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Advice */}
      <div
        className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-2.5"
        data-oid="kpe8-rv"
      >
        <div
          className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0"
          data-oid="x2.jhe5"
        >
          <Zap className="w-3.5 h-3.5 text-blue-500" data-oid="zf2fp9y" />
        </div>
        <div className="space-y-0.5" data-oid="aq1n5bw">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400" data-oid="aqi.mmy">
            {indecisionScore > 30
              ? 'Trust Your Instincts'
              : confidenceIndex < 50
                ? 'Second Guessing Detected'
                : 'High Precision Mindset'}
          </p>
          <p
            className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed"
            data-oid="c7s2xoo"
          >
            {indecisionScore > 30
              ? 'You changed answers multiple times. Data shows your first instinct is often correct.'
              : confidenceIndex < 50
                ? 'Large number of blanks or changes lowering your score. Work on elimination techniques.'
                : 'Your decisiveness is a major asset. Focus on copy-pasting spelling more carefully.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default CognitiveInsightsCard;
