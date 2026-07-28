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

const LearningRoadmap = React.memo(function LearningRoadmap({ phase, milestone, currentScore }) {
  const Icon = phase.Icon || TrendingUp;
  return (
    <div
      className="w-full rounded-xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50/50 via-slate-50/40 to-indigo-50/30 px-3.5 py-3 dark:border-indigo-800/50 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-indigo-950/20"
      data-oid="c7hzh8d"
    >
      <div className="flex items-center justify-between gap-3" data-oid="p6n1twc">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            {currentScore || '0.0'}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            practice avg
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-300">
            {formatBand(milestone.target)}
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            next step
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" data-oid="96fl6t_">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white shadow-xs"
            data-oid="85cy27f"
          >
            <Icon className="h-3.5 w-3.5" data-oid="bki5g06" />
          </div>
          <span
            className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200"
            data-oid="vs7tywo"
          >
            {phase.label}
          </span>
          <span
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-300"
            data-oid="d8cj6yp"
          >
            {Math.round(phase.progress)}%
          </span>
        </div>
      </div>

      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${phase.progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
          data-oid="0_1.12g"
        />
      </div>
    </div>
  );
});

const EvidenceSummary = React.memo(function EvidenceSummary({ counts }) {
  const evidence = [
    { label: 'Measured', value: counts?.measured || 0, tone: 'bg-emerald-500' },
    { label: 'Early', value: counts?.early || 0, tone: 'bg-indigo-600' },
    { label: 'To confirm', value: counts?.diagnostic || 0, tone: 'bg-slate-400 dark:bg-slate-500' },
  ];

  return (
    <section
      className="w-full rounded-xl border border-slate-200/70 bg-gradient-to-r from-indigo-50/30 to-slate-50/50 px-3.5 py-2.5 dark:border-white/10 dark:from-indigo-950/20 dark:to-slate-900/40"
      aria-label="Learning Path evidence quality"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-[9.5px] font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
            Evidence Quality
          </span>
        </div>
        <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
          From scored practice
        </span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {evidence.map((item) => (
          <div key={item.label} className="flex min-w-0 items-center gap-1.5">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.tone)} />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              {item.value}
            </span>
            <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
});

const FocusArea = React.memo(function FocusArea({ area, idx }) {
  const isMeasured = area.evidenceClass === 'measured_priority';
  const observationLabel = `${Number(area.observations || 0).toLocaleString()} answers`;
  const mastery = Number.isFinite(area.mastery) ? `${Math.round(area.mastery * 100)}%` : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * idx }}
      className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-white/10 dark:bg-slate-900/50"
      data-oid="7qhmpuf"
    >
      <div className="flex items-start gap-3" data-oid="vhar_y7">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          data-oid="rkbonte"
        >
          <Zap className="h-4 w-4" data-oid="09542tv" />
        </div>
        <div className="min-w-0 flex-1" data-oid="d_p:vud">
          <div className="flex items-center justify-between gap-2">
            <p
              className="truncate text-xs font-extrabold text-slate-900 dark:text-white"
              data-oid="vv.e_x_"
            >
              {area.module || 'Focus Area'}
            </p>
            {mastery && (
              <span className="shrink-0 text-sm font-black text-indigo-600 dark:text-indigo-300">
                {mastery}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={cn(
                'text-[9px] font-black uppercase tracking-wide',
                isMeasured
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-indigo-700 dark:text-indigo-300'
              )}
            >
              {isMeasured ? 'Measured' : 'Early signal'}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {observationLabel}
            </span>
          </div>
        </div>
      </div>
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
    <div
      className="relative group/locked min-h-[160px] h-full w-full overflow-hidden"
      data-oid="mft:nej"
    >
      <div
        className="blur-[10px] select-none pointer-events-none opacity-20 transition-all duration-500 w-full"
        data-oid="o-uolu:"
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center p-3 sm:p-5 w-full"
        data-oid=".32my93"
      >
        <div
          className="w-full max-w-[320px] rounded-2xl border border-amber-300 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 shadow-lg shadow-amber-500/10 dark:border-amber-500/30 ring-1 ring-amber-400/20"
          data-oid="bh9z.-d"
        >
          <div className="flex flex-col items-center text-center gap-3.5" data-oid="gotmz4_">
            <div
              className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20"
              data-oid="nd1v8qm"
            >
              <Star className="w-5 h-5 fill-white" data-oid="pjfbfep" />
            </div>

            <div className="space-y-1" data-oid="1-_ungq">
              <div
                className="text-base font-black text-slate-900 dark:text-white tracking-tight"
                data-oid="-rnssvn"
              >
                Unlock AI Roadmap
              </div>
              <p
                className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px] mx-auto"
                data-oid="qou.wzv"
              >
                Personalized study paths, band predictions, and specific strategies to hit your{' '}
                <span className="text-amber-600 dark:text-amber-400 font-black" data-oid="-f_qc8z">
                  9.0 target
                </span>{' '}
                faster.
              </p>
            </div>

            <div className="w-full pt-0.5" data-oid="l_am97w">
              <Button
                asChild
                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white border-0 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Link to="/settings/subscription">Upgrade Now</Link>
              </Button>
            </div>

            <div
              className="pt-2.5 border-t border-slate-100 dark:border-slate-800 w-full"
              data-oid="0t-f_wj"
            >
              <div className="flex flex-col items-center gap-1.5" data-oid="zonshi8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar
                      key={i}
                      className="w-5 h-5 border-2 border-white dark:border-slate-900 shadow-xs"
                      data-oid={`avatar-${i}`}
                    >
                      <AvatarImage
                        src={`https://i.pravatar.cc/100?u=ielts_student_${i}`}
                        alt="Student"
                      />
                      <AvatarFallback className="bg-amber-100 text-[9px] font-black text-amber-700">
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
    <div
      className="flex flex-col items-center justify-center text-center p-5 space-y-3 my-auto min-h-[240px] relative z-10 w-full"
      data-oid="compact-empty-state"
    >
      <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <Icon className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="space-y-1 max-w-[220px]">
        <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h4>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function AIInsightsCard({
  stats,
  aiLoading,
  isPremium,
  learningPhase,
  nextMilestone,
}) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full w-full" data-oid="uwa-quf">
      <Card
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950"
        data-oid="xikm8:d"
      >
        <CardHeader
          className="border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/60"
          data-oid="6cub8:6"
        >
          <div className="flex items-center justify-between gap-3" data-oid="8i64fmx">
            <div>
              <CardTitle
                className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"
                data-oid="h7i.tnz"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs"
                  data-oid="w-.6ht4"
                >
                  <Brain className="h-4 w-4" data-oid=".gsd50e" />
                </div>
                Learning Path Signals
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5" data-oid="xsaj8ol">
              {!isPremium && (
                <Badge className="rounded-full border-0 bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                  Pro
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full border-0 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
                  isPremium
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                )}
                data-oid="iy2ikht"
              >
                {isPremium ? 'Active' : 'Locked'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-3.5 w-full" data-oid="4bw-hw:">
          <LockedFeature isLocked={!isPremium} data-oid="996nby3">
            <div className="flex h-full w-full flex-col" data-oid="sq_34xw">
              {aiLoading ? (
                <InsightsLoadingSkeleton data-oid="xf-mj53" />
              ) : stats?.insights?.aiSuggestions ? (
                <div className="space-y-2.5 w-full">
                  <LearningRoadmap
                    phase={learningPhase}
                    milestone={nextMilestone}
                    currentScore={stats?.avgScore || '0.0'}
                    data-oid="zztm6zz"
                  />

                  {stats.insights.aiSuggestions.recommended_focus_areas?.length > 0 && (
                    <section aria-labelledby="priority-evidence-heading" className="w-full">
                      <div className="mb-1.5 flex items-center justify-between">
                        <h3
                          id="priority-evidence-heading"
                          className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                        >
                          Focus First
                        </h3>
                        <Link
                          to={createPageUrl('LearningPath')}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        >
                          See all <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <div className="space-y-1.5 w-full" data-oid="j8hpckz">
                        {stats.insights.aiSuggestions.recommended_focus_areas
                          .slice(0, 1)
                          .map((focus, i) => (
                            <FocusArea key={i} area={focus} idx={i} data-oid="pvb4b-a" />
                          ))}
                      </div>
                    </section>
                  )}

                  {(stats?.evidenceSummary?.grammar?.measuredPriorities?.length > 0 ||
                    stats?.evidenceSummary?.grammar?.earlySignals?.length > 0 ||
                    stats?.evidenceSummary?.grammar?.criterionSignals?.length > 0) && (
                    <Link
                      to="/grammar"
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3.5 py-2.5 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-800/40 dark:bg-indigo-950/40"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                          <BookCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                            Grammar
                          </div>
                          <div className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {stats.evidenceSummary.grammar.measuredPriorities.length
                              ? `${stats.evidenceSummary.grammar.measuredPriorities[0].module} · measured`
                              : stats.evidenceSummary.grammar.earlySignals.length
                                ? `${stats.evidenceSummary.grammar.earlySignals[0].module} · early`
                                : 'Diagnostic recommended'}
                            {stats.evidenceSummary.grammar.dueReviews
                              ? ` · ${stats.evidenceSummary.grammar.dueReviews} due`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    </Link>
                  )}

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

              {stats?.insights?.recommendations?.length > 0 && (
                <section
                  className="mt-2.5 border-t border-slate-200/80 pt-2.5 dark:border-white/10 w-full"
                  aria-labelledby="next-actions-heading"
                  data-oid="5s:lwz7"
                >
                  <h3 id="next-actions-heading" className="sr-only" data-oid="4q5myjb">
                    Next Action
                  </h3>
                  <div className="w-full" data-oid=":r.cwew">
                    {stats.insights.recommendations.slice(0, 1).map((rec, idx) => {
                      const meta = MODULE_META.find((m) => m.key === rec.type);
                      return (
                        <Link
                          key={`${rec.type}-${idx}`}
                          to={meta?.href || createPageUrl('Dashboard')}
                          className="w-full group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-white/10 dark:bg-slate-900/50"
                          data-oid="02rvrq."
                        >
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold',
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
                            data-oid="pn8rha_"
                          >
                            {meta ? (
                              <meta.icon className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1" data-oid="8yy7h1n">
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {meta?.title || 'Practice'}
                            </div>
                            <div
                              className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400"
                              data-oid="vqp-mrs"
                            >
                              {compactRecommendation(rec.text, 'Focused practice')}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                        </Link>
                      );
                    })}
                  </div>
                </section>
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
    <div className="space-y-2.5 animate-pulse w-full" data-oid="jvv0gx6">
      {/* Growth Path skeleton */}
      <div
        className="rounded-xl border border-indigo-200/50 bg-indigo-50/50 p-3"
        data-oid="_ig2:a:"
      >
        <div className="flex items-center gap-2 mb-2" data-oid=":u-w-d_">
          <div className="w-4 h-4 rounded bg-indigo-200 animate-pulse" data-oid="9tmgva4" />
          <div className="h-2.5 w-16 rounded bg-indigo-200 animate-pulse" data-oid="wzf2a0y" />
        </div>
        <div className="space-y-1.5" data-oid="ydn4s7m">
          <div className="h-2 w-full rounded bg-slate-200 animate-pulse" data-oid="18xmvj." />
          <div className="h-2 w-5/6 rounded bg-slate-200 animate-pulse" data-oid=".6znhha" />
        </div>
      </div>

      {/* Recommended focus areas skeleton (grid) */}
      <div className="grid grid-cols-2 gap-2 w-full" data-oid="zp:t38o">
        <div
          className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 h-11 flex flex-col justify-center animate-pulse"
          data-oid="skel-focus-1"
        >
          <div className="h-2 w-12 rounded bg-slate-200 animate-pulse mb-1" />
          <div className="h-1.5 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
        <div
          className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 h-11 flex flex-col justify-center animate-pulse"
          data-oid="skel-focus-2"
        >
          <div className="h-2 w-12 rounded bg-slate-200 animate-pulse mb-1" />
          <div className="h-1.5 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
