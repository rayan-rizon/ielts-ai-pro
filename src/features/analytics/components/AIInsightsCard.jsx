import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Star,
  ChevronRight,
  ArrowRight,
  Zap,
  BookCheck,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ITEM_VARIANTS, MODULE_META } from '../constants';
import { createPageUrl } from '@/utils';
import { formatBand } from '../utils';

const LearningRoadmap = React.memo(function LearningRoadmap({ targetScore, currentScore }) {
  const current = Number(currentScore) || 0;
  const target = Number(targetScore) || 0;
  const targetReached = target > 0 && current >= target;
  const progressVal = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="w-full rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-slate-50/40 to-indigo-50/30 p-3.5 shadow-xs dark:border-indigo-900/40 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-indigo-950/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              {currentScore || '0.0'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Practice Avg
            </span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {target > 0 ? formatBand(target) : '—'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600/80 dark:text-indigo-400/80">
              Saved Target
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 rounded-full border border-indigo-200/80 bg-white px-2.5 py-1 shadow-2xs dark:border-indigo-800/60 dark:bg-slate-900">
          <TrendingUp className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {targetReached ? 'Target reached' : 'Progress to target'}
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {progressVal}%
          </span>
        </div>
      </div>

      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressVal}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-xs"
        />
      </div>
    </div>
  );
});

const EvidenceSummary = React.memo(function EvidenceSummary({ counts }) {
  const evidence = [
    { label: 'Confirmed', value: counts?.measured || 0, tone: 'bg-emerald-500' },
    { label: 'Need results', value: counts?.early || 0, tone: 'bg-indigo-600' },
    {
      label: 'Not checked',
      value: counts?.diagnostic || 0,
      tone: 'bg-slate-400 dark:bg-slate-500',
    },
  ];

  return (
    <div className="mt-auto pt-2 w-full">
      <div className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              How sure we are
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            From scored practice
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {evidence.map((item) => (
            <div key={item.label} className="flex min-w-0 items-center gap-1.5">
              <span className={cn('h-2 w-2 shrink-0 rounded-full', item.tone)} />
              <span className="text-xs font-bold text-slate-900 dark:text-white">{item.value}</span>
              <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const FocusArea = React.memo(function FocusArea({ area, idx }) {
  const isMeasured = area.evidenceClass === 'measured_priority';
  const observationLabel = `${Number(area.observations || 0).toLocaleString()} answers`;
  const mastery = Number.isFinite(area.mastery) ? `${Math.round(area.mastery * 100)}%` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer dark:border-white/10 dark:bg-slate-900/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          <Zap className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
            {area.module || 'Focus Area'}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={cn(
                'text-[9.5px] font-bold uppercase tracking-wider',
                isMeasured
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              )}
            >
              {isMeasured ? 'Confirmed focus' : 'Needs more results'}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              · {observationLabel}
            </span>
          </div>
        </div>
      </div>

      {mastery && (
        <span className="shrink-0 text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {mastery}
        </span>
      )}
    </motion.div>
  );
});

function compactRecommendation(text, fallback) {
  const cleaned = String(text || '')
    .replace(/^Try\s+/i, '')
    .replace(/\s+to boost your score\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return fallback;
  return cleaned.length > 54 ? `${cleaned.slice(0, 51).trim()}…` : cleaned;
}

const LockedFeature = React.memo(function LockedFeature({ isLocked, children }) {
  if (!isLocked) return children;

  return (
    <div className="relative group/locked min-h-[160px] h-full w-full overflow-hidden">
      <div className="blur-[10px] select-none pointer-events-none opacity-20 transition-all duration-500 w-full">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 w-full">
        <div className="w-full max-w-[320px] rounded-2xl border border-amber-300 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 shadow-lg shadow-amber-500/10 dark:border-amber-500/30 ring-1 ring-amber-400/20">
          <div className="flex flex-col items-center text-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Star className="w-5 h-5 fill-white" />
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Unlock AI Roadmap
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                Personalized next tasks and clear study priorities based on your saved results.
              </p>
            </div>

            <div className="w-full pt-0.5">
              <Button
                asChild
                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Link to="/settings/subscription">Upgrade Now</Link>
              </Button>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 w-full">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar
                      key={i}
                      className="w-5 h-5 border-2 border-white dark:border-slate-900 shadow-xs"
                    >
                      <AvatarImage
                        src={`https://i.pravatar.cc/100?u=ielts_student_${i}`}
                        alt="Student"
                      />
                      <AvatarFallback className="bg-amber-100 text-[9px] font-bold text-amber-700">
                        {i}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Join 2,500+ successful students
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function CompactEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-5 space-y-3 my-auto min-h-[240px] relative z-10 w-full">
      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <Icon className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="space-y-1 max-w-[220px]">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{title}</h4>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AIInsightsCard({ stats, aiLoading, isPremium }) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full w-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-slate-950">
        <CardHeader className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2.5 text-base font-bold text-slate-950 dark:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Brain className="h-4 w-4" />
                </div>
                Your next study focus
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {!isPremium && (
                <Badge className="rounded-full border-0 bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Pro
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full border-0 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                  isPremium
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}
              >
                {isPremium ? 'Active' : 'Locked'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-3.5 w-full">
          <LockedFeature isLocked={!isPremium}>
            <div className="flex h-full w-full flex-col gap-2.5">
              {aiLoading ? (
                <InsightsLoadingSkeleton />
              ) : stats?.insights?.aiSuggestions ? (
                <div className="flex flex-col flex-1 gap-2.5 w-full">
                  <LearningRoadmap
                    targetScore={stats?.targetScore}
                    currentScore={stats?.avgScore || '0.0'}
                  />

                  {/* Focus First Section */}
                  <section
                    aria-labelledby="priority-evidence-heading"
                    className="w-full space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        id="priority-evidence-heading"
                        className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        Focus First
                      </h3>
                      <Link
                        to={createPageUrl('LearningPath')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        See all <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="space-y-1.5 w-full">
                      {stats.insights.aiSuggestions.recommended_focus_areas
                        ?.slice(0, 1)
                        .map((focus, i) => (
                          <FocusArea key={i} area={focus} idx={i} />
                        ))}

                      {(stats?.evidenceSummary?.grammar?.measuredPriorities?.length > 0 ||
                        stats?.evidenceSummary?.grammar?.earlySignals?.length > 0 ||
                        stats?.evidenceSummary?.grammar?.criterionSignals?.length > 0) && (
                        <Link
                          to="/grammar"
                          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:border-indigo-300 hover:bg-slate-50/50 dark:border-white/10 dark:bg-slate-900/60"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              <BookCheck className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                Grammar
                              </div>
                              <div className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {stats.evidenceSummary.grammar.measuredPriorities.length
                                  ? `${stats.evidenceSummary.grammar.measuredPriorities[0].module} · confirmed focus`
                                  : stats.evidenceSummary.grammar.earlySignals.length
                                    ? `${stats.evidenceSummary.grammar.earlySignals[0].module} · needs more results`
                                    : 'Level check recommended'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                        </Link>
                      )}

                      {stats?.insights?.recommendations?.slice(0, 1).map((rec, idx) => {
                        const meta = MODULE_META.find((m) => m.key === rec.type);
                        return (
                          <Link
                            key={`${rec.type}-${idx}`}
                            to={meta?.href || createPageUrl('Dashboard')}
                            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-all duration-200 hover:border-indigo-300 hover:bg-slate-50/50 dark:border-white/10 dark:bg-slate-900/60"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold',
                                  rec.type === 'reading'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                    : rec.type === 'listening'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                      : rec.type === 'writing'
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                        : rec.type === 'speaking'
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                                )}
                              >
                                {meta ? (
                                  <meta.icon className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white">
                                  {meta?.title || 'Practice'}
                                </div>
                                <div className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                  {compactRecommendation(rec.text, 'Focused practice')}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  {/* Evidence Quality Footer Bar */}
                  <EvidenceSummary counts={stats?.evidenceSummary?.counts} />
                </div>
              ) : stats?.avgScore > 0 ? (
                <CompactEmptyState
                  icon={Sparkles}
                  title="Refresh Your Plan"
                  description="Complete a scored test to update these signals."
                />
              ) : (
                <CompactEmptyState
                  icon={Target}
                  title="Build Your Baseline"
                  description="Complete one practice test to see priorities."
                />
              )}
            </div>
          </LockedFeature>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InsightsLoadingSkeleton() {
  return (
    <div className="space-y-2.5 animate-pulse w-full">
      <div className="rounded-xl border border-indigo-200/50 bg-indigo-50/50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded bg-indigo-200 animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-indigo-200 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded bg-slate-200 animate-pulse" />
          <div className="h-2 w-5/6 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 h-11 flex flex-col justify-center animate-pulse">
          <div className="h-2 w-12 rounded bg-slate-200 animate-pulse mb-1" />
          <div className="h-1.5 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 h-11 flex flex-col justify-center animate-pulse">
          <div className="h-2 w-12 rounded bg-slate-200 animate-pulse mb-1" />
          <div className="h-1.5 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
