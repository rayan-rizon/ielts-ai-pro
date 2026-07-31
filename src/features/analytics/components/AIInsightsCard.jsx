import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Brain,
  ChevronRight,
  BookCheck,
  ShieldCheck,
  Headphones,
  BookOpen,
  PenTool,
  Mic2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  Empty,
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  Ring,
  TILE,
} from '@/features/dashboard/components/primitives';
import { ITEM_VARIANTS, MODULE_META } from '../constants';
import { createPageUrl } from '@/utils';
import { formatBand } from '../utils';
import LockedFeature from './PerformanceTrends/LockedFeature';

function compactRecommendation(text, fallback) {
  const cleaned = String(text || '')
    .replace(/^Try\s+/i, '')
    .replace(/\s+to boost your score\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return fallback;
  return cleaned.length > 54 ? `${cleaned.slice(0, 51).trim()}…` : cleaned;
}

const MODULE_ICON = { listening: Headphones, reading: BookOpen, writing: PenTool, speaking: Mic2 };

function getModuleInfo(item) {
  const mod = String(item?.skillModule || '').toLowerCase();
  const code = String(item?.skillCode || '').toLowerCase();
  const matched = Object.keys(MODULE_ICON).find((name) => mod === name || code.startsWith(name));
  return {
    name: matched ? matched.charAt(0).toUpperCase() + matched.slice(1) : 'Grammar',
    icon: MODULE_ICON[matched] || BookCheck,
  };
}

/** Compact target-progress ring, reusing the same Ring primitive as the dashboard. */
function TargetRing({ targetScore, currentScore }) {
  const current = Number(currentScore) || 0;
  const target = Number(targetScore) || 0;
  const targetReached = target > 0 && current >= target;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className={cn(TILE, 'flex items-center gap-3 p-2.5')}>
      <Ring value={pct} size={44} stroke={5} label={`${pct}%`} />
      <div className="min-w-0">
        <p className={cn(MICRO, MUTED)}>
          {targetReached ? 'Target reached' : 'Progress to target'}
        </p>
        <p className="mt-0.5 flex items-baseline gap-1.5">
          <span className={cn(NUM, 'text-sm font-extrabold text-slate-900 dark:text-slate-50')}>
            {currentScore || '0.0'}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          <span className={cn(NUM, 'text-sm font-extrabold text-[#5a63df] dark:text-[#a9afff]')}>
            {target > 0 ? formatBand(target) : '—'}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Confirmed / provisional / not-checked split, as a single segmented bar. */
function EvidenceSummary({ counts }) {
  const measured = counts?.measured || 0;
  const early = counts?.early || 0;
  const diagnostic = counts?.diagnostic || 0;
  const total = measured + early + diagnostic || 1;
  const measuredPct = Math.round((measured / total) * 100);
  const earlyPct = Math.round((early / total) * 100);

  return (
    <div className={cn(TILE, 'space-y-2 p-2.5')}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn(MICRO, MUTED, 'flex items-center gap-1.5')}>
          <ShieldCheck className="h-3 w-3 text-[#5a63df] dark:text-[#a9afff]" />
          Evidence quality
        </span>
        <span className={cn(NUM, 'text-[10px] font-bold text-[#5a63df] dark:text-[#a9afff]')}>
          {measuredPct}% confirmed
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/[0.06]">
        <div
          className="h-full bg-[#5a63df] transition-all duration-700"
          style={{ width: `${measuredPct}%` }}
        />
        <div
          className="h-full bg-[#5a63df]/40 transition-all duration-700"
          style={{ width: `${earlyPct}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Confirmed', value: measured },
          { label: 'Provisional', value: early },
          { label: 'Not checked', value: diagnostic },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <p className={cn(NUM, 'text-xs font-extrabold text-slate-900 dark:text-slate-50')}>
              {item.value}
            </p>
            <p className={cn(MICRO, MUTED, 'truncate')}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusAreaLink({ to, icon: Icon, title, tag, tagTone = 'accent', subtitle, mastery }) {
  return (
    <Link
      to={to}
      className={cn(
        TILE,
        'group flex items-center justify-between gap-2.5 p-2.5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/[0.12]'
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <IconChip icon={Icon} tone="accent" size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
              {title}
            </span>
            <Pill tone={tagTone}>{tag}</Pill>
          </div>
          <p className={cn(MICRO, MUTED, 'mt-0.5 truncate')}>{subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {mastery != null ? (
          <span className={cn(NUM, 'text-xs font-bold text-[#5a63df] dark:text-[#a9afff]')}>
            {mastery}%
          </span>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-600" />
      </div>
    </Link>
  );
}

export default function AIInsightsCard({ stats, aiLoading, isPremium }) {
  const suggestions = stats?.insights?.aiSuggestions;
  const primaryFocus = suggestions?.recommended_focus_areas?.[0];
  const grammarSignal =
    stats?.evidenceSummary?.grammar?.measuredPriorities?.length > 0 ||
    stats?.evidenceSummary?.grammar?.earlySignals?.length > 0 ||
    stats?.evidenceSummary?.grammar?.criterionSignals?.length > 0;
  const moduleRec = stats?.insights?.recommendations?.[0];
  const moduleRecMeta = moduleRec ? MODULE_META.find((m) => m.key === moduleRec.type) : null;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full w-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Your next study focus"
          accent
          tip="Personalised from your saved results, weighted toward skills with the most evidence behind them."
          action={!isPremium ? <Pill tone="amber">Pro</Pill> : <Pill tone="ok">Active</Pill>}
        />

        <LockedFeature isLocked={!isPremium} compact className="flex-1">
          <div className="flex h-full flex-col gap-2.5">
            {aiLoading ? (
              <InsightsLoadingSkeleton />
            ) : suggestions ? (
              <>
                <TargetRing
                  targetScore={stats?.targetScore}
                  currentScore={stats?.avgScore || '0.0'}
                />

                <div className="space-y-2">
                  {primaryFocus
                    ? (() => {
                        const info = getModuleInfo(primaryFocus);
                        const isMeasured = primaryFocus.evidenceClass === 'measured_priority';
                        const raw = primaryFocus.module || 'Focus area';
                        const title = !raw.toLowerCase().startsWith(info.name.toLowerCase())
                          ? `${info.name} — ${raw}`
                          : raw;
                        const mastery = Number.isFinite(primaryFocus.mastery)
                          ? Math.round(primaryFocus.mastery * 100)
                          : null;
                        return (
                          <FocusAreaLink
                            to={createPageUrl('LearningPath')}
                            icon={info.icon}
                            title={title}
                            tag={isMeasured ? 'Confirmed' : 'Needs results'}
                            tagTone={isMeasured ? 'ok' : 'neutral'}
                            subtitle={`${Number(primaryFocus.observations || 0).toLocaleString()} graded answers`}
                            mastery={mastery}
                          />
                        );
                      })()
                    : null}

                  {grammarSignal ? (
                    <FocusAreaLink
                      to="/grammar"
                      icon={BookCheck}
                      title="Grammar & Vocabulary"
                      tag="Diagnostic"
                      tagTone="neutral"
                      subtitle="Level check recommended"
                    />
                  ) : null}

                  {moduleRec ? (
                    <FocusAreaLink
                      to={moduleRecMeta?.href || createPageUrl('Dashboard')}
                      icon={moduleRecMeta?.icon || ChevronRight}
                      title={moduleRecMeta?.title || 'Practice'}
                      tag="Recommended"
                      subtitle={compactRecommendation(moduleRec.text, 'Focused passage practice')}
                    />
                  ) : null}
                </div>

                <div className="mt-auto">
                  <EvidenceSummary counts={stats?.evidenceSummary?.counts} />
                </div>
              </>
            ) : stats?.avgScore > 0 ? (
              <Empty icon={Sparkles} className="flex-1 content-center">
                Complete a scored test to refresh these priorities.
              </Empty>
            ) : (
              <Empty icon={Brain} className="flex-1 content-center">
                Complete one practice test to see your first priorities.
              </Empty>
            )}
          </div>
        </LockedFeature>

        <PanelFootnote>Ranked by graded evidence, refreshed after every scored test.</PanelFootnote>
      </section>
    </m.div>
  );
}

function InsightsLoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-2.5">
      <div className={cn(TILE, 'h-[60px] p-2.5')} />
      <div className={cn(TILE, 'h-[52px] p-2.5')} />
      <div className={cn(TILE, 'h-[52px] p-2.5')} />
    </div>
  );
}
