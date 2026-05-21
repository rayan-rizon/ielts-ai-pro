import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Eye,
  Brain,
  Search,
  BookOpen,
  HelpCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

/**
 * SkillGapRadar
 *
 * Displays skill breakdown.
 * Light theme to match existing cards.
 */

interface SkillGaps {
  detailRetention: number;
  paraphrasingRecognition: number;
  logicalReasoning: number;
  scanningEfficiency: number;
  globalComprehension: number;
}

interface TypeStats {
  [key: string]: { correct: number; total: number };
}

interface SkillGapRadarProps {
  skillGaps: SkillGaps | null;
  typeStats?: TypeStats;
  testType?: 'reading' | 'listening';
}

const TooltipContentAny = TooltipContent as any;

const SKILL_CONFIG = {
  detailRetention: {
    label: 'Finding Facts',
    shortLabel: 'Facts',
    description: 'How well you find specific details and names in the text.',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    barColor: 'bg-blue-500',
  },
  paraphrasingRecognition: {
    label: 'Matching Meaning',
    shortLabel: 'Synonyms',
    description: 'Spotting words that mean the same thing but look different.',
    icon: Target,
    color: 'from-purple-500 to-indigo-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    barColor: 'bg-purple-500',
  },
  logicalReasoning: {
    label: 'Logical Thinking',
    shortLabel: 'Logic',
    description: 'Deciding if ideas are true, false, or not mentioned.',
    icon: Brain,
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    barColor: 'bg-amber-500',
  },
  scanningEfficiency: {
    label: 'Quick Scanning',
    shortLabel: 'Speed',
    description: 'Moving your eyes fast to find specific words or numbers.',
    icon: Search,
    color: 'from-emerald-500 to-teal-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    barColor: 'bg-emerald-500',
  },
  globalComprehension: {
    label: 'Main Ideas',
    shortLabel: 'Overall',
    description: 'Understanding the big picture and purpose of each paragraph.',
    icon: BookOpen,
    color: 'from-rose-500 to-pink-500',
    textColor: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    barColor: 'bg-rose-500',
  },
};

const TYPE_TO_SKILL: Record<string, keyof SkillGaps> = {
  gap_fill: 'detailRetention',
  table_completion: 'detailRetention',
  sentence_completion: 'detailRetention',
  summary_completion: 'detailRetention',
  note_completion: 'detailRetention',
  notes_completion: 'detailRetention',
  short_answer: 'detailRetention',
  matching: 'paraphrasingRecognition',
  matching_features: 'paraphrasingRecognition',
  true_false_not_given: 'logicalReasoning',
  yes_no_not_given: 'logicalReasoning',
  multiple_choice: 'scanningEfficiency',
  map_labeling: 'scanningEfficiency',
  diagram_completion: 'scanningEfficiency',
  flow_chart_completion: 'scanningEfficiency',
  flowchart: 'scanningEfficiency',
  matching_headings: 'globalComprehension',
};

export function SkillGapRadar({ skillGaps, typeStats, testType = 'reading' }: SkillGapRadarProps) {
  // Calculate skills from typeStats if skillGaps not provided
  const computedSkills = useMemo(() => {
    if (skillGaps) {
      return skillGaps;
    }

    if (!typeStats) {
      return null;
    }

    // Calculate from typeStats
    const skillCalc: Record<keyof SkillGaps, { correct: number; total: number }> = {
      detailRetention: { correct: 0, total: 0 },
      paraphrasingRecognition: { correct: 0, total: 0 },
      logicalReasoning: { correct: 0, total: 0 },
      scanningEfficiency: { correct: 0, total: 0 },
      globalComprehension: { correct: 0, total: 0 },
    };

    Object.entries(typeStats).forEach(([qType, stats]) => {
      const skill = TYPE_TO_SKILL[qType];
      if (skill && skillCalc[skill]) {
        skillCalc[skill].correct += stats.correct;
        skillCalc[skill].total += stats.total;
      }
    });

    const result: SkillGaps = {
      detailRetention:
        skillCalc.detailRetention.total > 0
          ? Math.round((skillCalc.detailRetention.correct / skillCalc.detailRetention.total) * 100)
          : -1,
      paraphrasingRecognition:
        skillCalc.paraphrasingRecognition.total > 0
          ? Math.round(
              (skillCalc.paraphrasingRecognition.correct /
                skillCalc.paraphrasingRecognition.total) *
                100
            )
          : -1,
      logicalReasoning:
        skillCalc.logicalReasoning.total > 0
          ? Math.round(
              (skillCalc.logicalReasoning.correct / skillCalc.logicalReasoning.total) * 100
            )
          : -1,
      scanningEfficiency:
        skillCalc.scanningEfficiency.total > 0
          ? Math.round(
              (skillCalc.scanningEfficiency.correct / skillCalc.scanningEfficiency.total) * 100
            )
          : -1,
      globalComprehension:
        skillCalc.globalComprehension.total > 0
          ? Math.round(
              (skillCalc.globalComprehension.correct / skillCalc.globalComprehension.total) * 100
            )
          : -1,
    };

    return result;
  }, [skillGaps, typeStats]);

  // Don't show if no data
  if (!computedSkills || Object.values(computedSkills).every((v) => v === -1)) {
    return null;
  }

  // Convert skill gaps to sorted array (weakest first)
  const skillEntries = Object.entries(computedSkills)
    .filter(([_, score]) => score >= 0)
    .map(([key, score]) => ({
      key: key as keyof SkillGaps,
      score,
      config: SKILL_CONFIG[key as keyof typeof SKILL_CONFIG],
    }))
    .sort((a, b) => a.score - b.score);

  // Only show "Needs Focus" if the weakest skill score is below threshold and has actual data
  const weakest = skillEntries[0]?.score < 60 ? skillEntries[0] : null;
  // Only show "Strong Skill" if the strongest skill score is >= 60%
  const strongest = skillEntries[skillEntries.length - 1];

  const chartData = Object.keys(SKILL_CONFIG).map((key) => {
    const entry = skillEntries.find((e) => e.key === key);
    return {
      subject: SKILL_CONFIG[key as keyof typeof SKILL_CONFIG].shortLabel,
      A: entry ? entry.score : 0,
      fullMark: 100,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full p-5 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden flex flex-col group"
      data-oid="g.qofcw"
    >
      {/* Background Decorative Gradients */}
      <div
        className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none group-hover:bg-violet-500/15 transition-all duration-700"
        data-oid="-ua06-c"
      />

      <div
        className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full -ml-16 -mb-16 pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"
        data-oid="y-uepju"
      />

      {/* Header Area */}
      <div className="flex items-center justify-between mb-5 relative z-10" data-oid="_uj_zju">
        <div className="flex items-center gap-3" data-oid="s-m366m">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform group-hover:scale-110 transition-transform duration-500"
            data-oid="0i8-ig:"
          >
            <Brain className="w-5 h-5 text-white" data-oid="pi2qi6d" />
          </div>
          <div data-oid="5in056k">
            <h3
              className="text-base font-black text-slate-900 dark:text-white tracking-tight"
              data-oid="sb5p6b8"
            >
              Skill Breakdown
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5" data-oid="4s7wm6h">
              <span
                className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"
                data-oid="9crzg5r"
              />

              <p
                className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]"
                data-oid="6-zrmwq"
              >
                Holistic Analysis
              </p>
            </div>
          </div>
        </div>

        <TooltipProvider data-oid="3i:yf7c">
          <Tooltip data-oid="87e6lo.">
            <TooltipTrigger asChild data-oid="iu_e6rd">
              <button
                className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                data-oid="tyo7p9b"
              >
                <HelpCircle className="w-3.5 h-3.5" data-oid="j7je_vm" />
              </button>
            </TooltipTrigger>
            <TooltipContentAny
              side="left"
              className="bg-slate-900 text-white border-none p-3 max-w-[200px] rounded-xl text-xs font-bold shadow-2xl"
              data-oid="-m4is:2"
            >
              Visual breakdown of your performance across core competencies.
            </TooltipContentAny>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Radar Chart Display - Reduced Height */}
      <div className="h-[210px] w-full relative z-10 mb-4 px-2" data-oid="f8gsbk3">
        <ResponsiveContainer width="100%" height="100%" data-oid="cjwufqq">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData} data-oid="7.72vxh">
            <PolarGrid stroke="#94a3b8" strokeOpacity={0.15} data-oid="vgdv4bm" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: '#94a3b8',
                fontSize: 10,
                fontWeight: 800,
                transform: 'translate(0, 3)',
              }}
              data-oid="srxam6a"
            />

            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              data-oid="tptyayi"
            />

            <Radar
              name="Skill Level"
              dataKey="A"
              stroke="#6366f1"
              strokeWidth={3}
              fill="#6366f1"
              fillOpacity={0.15}
              animationDuration={1500}
              data-oid="yu0aosh"
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Center visual hit for the radar */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/20 pointer-events-none"
          data-oid="q-78d4t"
        />
      </div>

      {/* Insights Section - Improved Layout Consistency */}
      <div className="grid grid-cols-2 gap-3 relative z-10" data-oid="7_sredo">
        {weakest && (
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 flex flex-col items-start gap-0.5 group/item"
            data-oid="tvymbly"
          >
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1"
              data-oid="wh621kk"
            >
              <TrendingDown className="w-2.5 h-2.5" data-oid="4tsj5b_" />
              Focus
            </div>
            <span
              className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate w-full"
              data-oid="4detjs9"
            >
              {weakest.config.shortLabel}
            </span>
            <div className="flex items-end gap-1.5" data-oid="gl2z6ps">
              <span
                className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none"
                data-oid="lfgt2pp"
              >
                {weakest.score}%
              </span>
              <span className="text-[8px] font-bold text-rose-400 mb-0.5" data-oid="c976u9w">
                Critical
              </span>
            </div>
          </motion.div>
        )}

        {strongest && strongest.score >= 60 ? (
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 flex flex-col items-start gap-0.5 group/item"
            data-oid="sxr8:qt"
          >
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1"
              data-oid="rt.va.e"
            >
              <TrendingUp className="w-2.5 h-2.5" data-oid="u6.b8.p" />
              Strength
            </div>
            <span
              className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate w-full"
              data-oid="czk2k4p"
            >
              {strongest.config.shortLabel}
            </span>
            <div className="flex items-end gap-1.5" data-oid="b44yf4o">
              <span
                className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none"
                data-oid="tz3fuzb"
              >
                {strongest.score}%
              </span>
              <span className="text-[8px] font-bold text-emerald-400 mb-0.5" data-oid="6_7x215">
                Expert
              </span>
            </div>
          </motion.div>
        ) : (
          <div
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 border-dashed flex items-center justify-center"
            data-oid="7.::dno"
          >
            <p
              className="text-[9px] font-bold text-slate-400 italic text-center"
              data-oid="q4heqg9"
            >
              More data needed <br data-oid="ixv9-y9" />
              for insights.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Footer Details */}
      <div
        className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between"
        data-oid="p.y0e64"
      >
        <p
          className="text-[9px] text-slate-400 font-bold uppercase tracking-wider"
          data-oid="q-_bi90"
        >
          Balanced Performance
        </p>
        <div
          className="flex items-center gap-1 text-[9px] font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"
          data-oid="i-h2iju"
        >
          <Target className="w-2.5 h-2.5 text-indigo-500" data-oid="-82f1s7" />
          8.5+ Target
        </div>
      </div>
    </motion.div>
  );
}

export default SkillGapRadar;
