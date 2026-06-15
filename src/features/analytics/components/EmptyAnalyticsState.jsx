import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import {
  Lock,
  BookOpen,
  TrendingUp,
  Brain,
  Sparkles,
  Award,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';

function CompactState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 h-full min-h-[200px] w-full relative overflow-hidden rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 border border-dashed border-slate-200/50 dark:border-white/[0.05]',
        className
      )}
    >
      <div className="relative mb-3 flex-shrink-0">
        <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full scale-125 animate-pulse" />
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-500/20 dark:from-indigo-500/20 dark:to-violet-600/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-500/30">
          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <div className="space-y-1 max-w-[280px] select-none">
        <h4 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-normal">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-3 w-full max-w-[185px] flex-shrink-0">{action}</div>}
    </div>
  );
}

function MockStatCards() {
  const stats = [
    {
      label: 'Overall Band Score',
      value: '7.5',
      sub: '+0.5 this week',
      icon: Award,
      color: 'text-indigo-500',
    },
    {
      label: 'Target Band Score',
      value: '8.5',
      sub: '1.0 band to go',
      icon: Target,
      color: 'text-rose-500',
    },
    {
      label: 'Practice Tests',
      value: '12',
      sub: '3 modules completed',
      icon: BookOpen,
      color: 'text-blue-500',
    },
    {
      label: 'Study Time',
      value: '24.5h',
      sub: 'Daily goal met',
      icon: Clock,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {stat.sub}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <stat.icon className={cn('w-6 h-6', stat.color)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockContentRows() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Mock Chart Area */}
      <div className="col-span-12 xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Band Score Progress
            </h4>
            <p className="text-xs text-slate-400 font-bold uppercase">Performance History</p>
          </div>
          <div className="w-24 h-6 rounded bg-slate-100 dark:bg-slate-850" />
        </div>
        {/* Fake wave path SVG */}
        <div className="w-full h-32 flex items-end">
          <svg
            className="w-full h-full text-indigo-500/20"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,15 C20,10 40,20 60,8 C80,2 90,14 100,5 L100,20 L0,20 Z"
              fill="currentColor"
            />
            <path
              d="M0,15 C20,10 40,20 60,8 C80,2 90,14 100,5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-indigo-500"
            />
          </svg>
        </div>
      </div>

      {/* Mock AI Recommendations */}
      <div className="col-span-12 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            AI Study Advisor
          </h4>
          <p className="text-xs text-slate-400 font-bold uppercase">
            Immediate Focus Recommendations
          </p>
        </div>
        <div className="space-y-3 mt-4">
          {[
            'Practice Writing Task 2 coherence techniques.',
            'Review vocabulary synonyms for Speaking.',
            'Focus on distraction-free Listening tests.',
          ].map((rec, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1" />
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-850 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div
      className="absolute inset-0 w-full space-y-8 opacity-[0.15] dark:opacity-[0.06] blur-[3px] select-none pointer-events-none transition-all duration-500 scale-95"
      aria-hidden="true"
      data-oid="mock-db-bg"
    >
      <MockStatCards />
      <MockContentRows />
    </div>
  );
}

function BenefitItem({ benefit, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.08 }}
      className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-white/[0.03] hover:bg-slate-100/50 dark:hover:bg-slate-900/70 transition-all duration-300"
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm border border-white/10',
          benefit.color
        )}
      >
        <benefit.icon className="w-5 h-5" />
      </div>
      <div className="space-y-0.5 min-w-0">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
          {benefit.title}
        </h4>
        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-450 leading-normal">
          {benefit.desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function EmptyAnalyticsState({
  icon: Icon = Lock,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  const benefits = [
    {
      icon: TrendingUp,
      title: 'Score Projections & Progress Paths',
      desc: 'Interactive history tracking mapping your overall and module-wise score trajectory.',
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-500 dark:text-indigo-400',
    },
    {
      icon: BarChart3,
      title: 'Granular Assessment Criteria',
      desc: 'Detailed grammar, vocabulary, lexical resource, and fluency band breakdowns.',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500 dark:text-purple-400',
    },
    {
      icon: Brain,
      title: 'Advanced AI-Driven Coaching',
      desc: 'Instant focus area insights and study suggestions tailored to your weak points.',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-500 dark:text-amber-400',
    },
  ];

  if (compact) {
    return (
      <CompactState
        icon={Icon}
        title={title}
        description={description}
        action={action}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative w-full max-w-[1600px] mx-auto min-h-[70vh] flex items-center justify-center overflow-hidden',
        className
      )}
      data-oid="37mle7o"
    >
      <MockDashboard />

      {/* ─── Premium Glassmorphic Foreground Centerpiece ─── */}
      <div className="relative z-10 px-4 py-8 w-full max-w-2xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl p-6 sm:p-10 rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.08] w-full shadow-2xl shadow-slate-900/10 dark:shadow-black/60 text-center flex flex-col items-center gap-7"
          data-oid="empty-glass-card"
        >
          {/* Animated Central Icon with Orbiting Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 border border-dashed border-indigo-500/30 dark:border-indigo-500/20 rounded-full pointer-events-none"
            />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25 flex items-center justify-center border border-white/20">
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Unlock a comprehensive, diagnostic view of your IELTS performance. Your dashboard will
              feature:
            </p>
          </div>

          {/* Structured Premium Benefits */}
          <div className="w-full grid grid-cols-1 gap-3 py-1 text-left">
            {benefits.map((benefit, i) => (
              <BenefitItem key={i} benefit={benefit} index={i} />
            ))}
          </div>

          {/* Call to Action Button */}
          {action && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="w-full mt-1.5"
            >
              {action}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
