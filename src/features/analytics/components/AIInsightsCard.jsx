import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  Star,
  ChevronRight,
  ArrowRight,
  BookCheck,
  ShieldCheck,
  TrendingUp,
  Headphones,
  BookOpen,
  PenTool,
  Mic2,
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

function compactRecommendation(text, fallback) {
  const cleaned = String(text || '')
    .replace(/^Try\s+/i, '')
    .replace(/\s+to boost your score\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return fallback;
  return cleaned.length > 54 ? `${cleaned.slice(0, 51).trim()}…` : cleaned;
}

function getModuleInfo(item) {
  const mod = String(item?.skillModule || '').toLowerCase();
  const code = String(item?.skillCode || '').toLowerCase();

  const brandStyle =
    'bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300';

  if (mod === 'listening' || code.startsWith('listening')) {
    return { name: 'Listening', icon: Headphones, style: brandStyle };
  }
  if (mod === 'reading' || code.startsWith('reading')) {
    return { name: 'Reading', icon: BookOpen, style: brandStyle };
  }
  if (mod === 'writing' || code.startsWith('writing')) {
    return { name: 'Writing', icon: PenTool, style: brandStyle };
  }
  if (mod === 'speaking' || code.startsWith('speaking')) {
    return { name: 'Speaking', icon: Mic2, style: brandStyle };
  }
  return { name: 'Grammar', icon: BookCheck, style: brandStyle };
}

const LearningRoadmap = React.memo(function LearningRoadmap({ targetScore, currentScore }) {
  const current = Number(currentScore) || 0;
  const target = Number(targetScore) || 0;
  const targetReached = target > 0 && current >= target;
  const progressVal = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="w-full rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-[#f5f4ff] dark:bg-indigo-950/40 p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2.5">
        {/* Radial Mini Gauge Ring */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <svg className="h-11 w-11 -rotate-90 transform" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-indigo-200/70 dark:stroke-indigo-900"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-[#5661e9] transition-all duration-700 ease-out"
                strokeWidth="4"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * progressVal) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[10.5px] font-black text-slate-950 dark:text-white">
              {progressVal}%
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">
              {targetReached ? 'Target Reached' : 'Progress To Target'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black tracking-tight text-slate-950 dark:text-white">
                {currentScore || '0.0'}
              </span>
              <ArrowRight className="h-3 w-3 text-[#5661e9] shrink-0" />
              <span className="text-sm font-black tracking-tight text-[#5661e9] dark:text-indigo-400">
                {target > 0 ? formatBand(target) : '—'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Target</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0 rounded-full border border-indigo-200/80 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-black text-[#5661e9] dark:text-indigo-300 shadow-2xs">
          <TrendingUp className="h-3.5 w-3.5 text-[#5661e9]" />
          <span>{progressVal}% Completed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100/80 dark:bg-indigo-950">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressVal}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-[#5661e9] dark:bg-indigo-400 shadow-2xs"
        />
      </div>
    </div>
  );
});

const EvidenceSummary = React.memo(function EvidenceSummary({ counts }) {
  const measured = counts?.measured || 0;
  const early = counts?.early || 0;
  const diagnostic = counts?.diagnostic || 0;
  const total = measured + early + diagnostic || 1;

  const measuredPct = Math.round((measured / total) * 100);
  const earlyPct = Math.round((early / total) * 100);

  const evidence = [
    { label: 'Confirmed', value: measured, pct: measuredPct, tone: 'bg-[#5661e9]' },
    { label: 'Need results', value: early, pct: earlyPct, tone: 'bg-[#818cf8]' },
    {
      label: 'Not checked',
      value: diagnostic,
      pct: 100 - measuredPct - earlyPct,
      tone: 'bg-slate-300',
    },
  ];

  return (
    <div className="mt-auto pt-1 w-full">
      <div className="w-full rounded-xl border border-slate-200/80 bg-[#f8f7ff] dark:bg-slate-900/60 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#5661e9] dark:text-indigo-400" />
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Confidence breakdown
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#5661e9] dark:text-indigo-300">
            {measuredPct}% Confirmed
          </span>
        </div>

        {/* Visual multi-segment progress bar */}
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-200/70 dark:bg-slate-800">
          <div
            className="bg-[#5661e9] h-full transition-all duration-700"
            style={{ width: `${measuredPct}%` }}
          />
          <div
            className="bg-[#818cf8] h-full transition-all duration-700"
            style={{ width: `${earlyPct}%` }}
          />
          <div className="bg-slate-300 dark:bg-slate-600 h-full flex-1" />
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {evidence.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-1.5 dark:border-white/5 dark:bg-slate-900/80 shadow-2xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', item.tone)} />
                <span className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {item.label}
                </span>
              </div>
              <span className="text-xs font-black text-slate-950 dark:text-white shrink-0">
                {item.value}
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
  const masteryVal = Number.isFinite(area.mastery) ? Math.round(area.mastery * 100) : null;
  const info = getModuleInfo(area);
  const Icon = info.icon;

  const rawModule = area.module || 'Focus Area';
  const displayTitle = !rawModule.toLowerCase().startsWith(info.name.toLowerCase())
    ? `${info.name} - ${rawModule}`
    : rawModule;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs cursor-pointer dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs',
            info.style
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-slate-950 dark:text-white">
            {displayTitle}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded-full bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider">
              {isMeasured ? 'Confirmed focus' : 'Needs results'}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 truncate">
              • {observationLabel}
            </span>
          </div>
        </div>
      </div>

      {masteryVal != null && (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-black text-[#5661e9] dark:text-indigo-300">
            {masteryVal}%
          </span>
          <div className="mt-0.5 h-1.5 w-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#5661e9]"
              style={{ width: `${Math.max(masteryVal, 5)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default function AIInsightsCard({ stats, aiLoading, isPremium }) {
  return (
    <motion.div variants={ITEM_VARIANTS} className="h-full w-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-white dark:bg-slate-950 shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)]">
        <CardHeader className="border-b border-slate-100 dark:border-white/10 px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2.5 text-base font-black tracking-tight text-slate-950 dark:text-white">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-xs">
                  <Brain className="h-4.5 w-4.5" strokeWidth={2.2} />
                </div>
                Your next study focus
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5">
              {!isPremium && (
                <Badge className="rounded-full border-0 bg-amber-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                  Pro
                </Badge>
              )}
              <Badge
                variant="secondary"
                className="rounded-full border-0 bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider"
              >
                {isPremium ? 'Active' : 'Locked'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 p-3.5 w-full space-y-2.5">
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
                  <section aria-labelledby="priority-evidence-heading" className="w-full space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <h3
                        id="priority-evidence-heading"
                        className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400"
                      >
                        Focus First
                      </h3>
                      <Link
                        to={createPageUrl('LearningPath')}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#5661e9] hover:text-indigo-700 dark:text-indigo-400"
                      >
                        See all <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="space-y-2 w-full">
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
                          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs dark:border-white/10 dark:bg-slate-900/70"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-2xs">
                              <BookCheck className="h-4 w-4" strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-950 dark:text-white">
                                  Grammar & Vocabulary
                                </span>
                                <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200/60 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider">
                                  Diagnostic
                                </span>
                              </div>
                              <div className="truncate text-[10px] font-semibold text-slate-400 mt-0.5">
                                Level check recommended
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
                        </Link>
                      )}

                      {stats?.insights?.recommendations?.slice(0, 1).map((rec, idx) => {
                        const meta = MODULE_META.find((m) => m.key === rec.type);
                        return (
                          <Link
                            key={`${rec.type}-${idx}`}
                            to={meta?.href || createPageUrl('Dashboard')}
                            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-100/80 bg-[#faf9ff] p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5661e9]/50 hover:bg-white hover:shadow-2xs dark:border-white/10 dark:bg-slate-900/70"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#efedff] text-[#5862df] ring-1 ring-[#5862df]/15 dark:bg-indigo-500/20 dark:text-indigo-300 shadow-2xs">
                                {meta ? (
                                  <meta.icon className="h-4 w-4" strokeWidth={2.2} />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-950 dark:text-white">
                                    {meta?.title || 'Practice'}
                                  </span>
                                  <span className="rounded-full bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 ring-1 ring-[#5661e9]/20 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider">
                                    Recommended
                                  </span>
                                </div>
                                <div className="truncate text-[10px] font-semibold text-slate-400 mt-0.5">
                                  {compactRecommendation(rec.text, 'Focused passage practice')}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#5661e9]" />
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
                  icon={Brain}
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

function CompactEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-5 space-y-3 my-auto min-h-[240px] relative z-10 w-full">
      <div className="w-11 h-11 rounded-2xl bg-[#efedff] text-[#5661e9] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center">
        <Icon className="w-5.5 h-5.5 text-[#5661e9] dark:text-indigo-300" />
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

function LockedFeature({ isLocked, children }) {
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
}
