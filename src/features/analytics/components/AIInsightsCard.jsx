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
  InfoTip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  PanelFootnote,
  PanelTitle,
  Pill,
  TILE,
  Tip,
} from '@/features/dashboard/components/primitives';
import { ITEM_VARIANTS, MODULE_META } from '../constants';
import { createPageUrl } from '@/utils';

/**
 * Trims the boilerplate the recommendation text arrives wrapped in.
 *
 * It no longer hard-truncates at 54 characters: this card sits in a narrow
 * column, so a mid-word ellipsis on top of the CSS clamp below meant the
 * advice was being cut twice and often finished as "…from …". The clamp owns
 * overflow now; this only strips the filler.
 */
function compactRecommendation(text, fallback) {
  const cleaned = String(text || '')
    .replace(/^Try\s+/i, '')
    .replace(/\s+to boost your score\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || fallback;
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

/**
 * Confirmed / provisional / not-checked split, as a single segmented bar.
 *
 * This is the only place the evidence counts appear now. A second panel used to
 * print the same three numbers as three mini tiles further down the page, which
 * made a learner scrolling past believe there were two separate measurements.
 */
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
          <InfoTip>
            How much of your skill data comes from enough graded answers to trust, versus an early
            hunch or a skill not touched yet.
          </InfoTip>
        </span>
        <span className={cn(NUM, 'text-[10px] font-bold text-[#5a63df] dark:text-[#a9afff]')}>
          {measuredPct}% confirmed
        </span>
      </div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/6">
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
          {
            label: 'Confirmed',
            value: measured,
            hint: 'Enough graded answers on this skill to act on with confidence.',
          },
          {
            label: 'Provisional',
            value: early,
            hint: 'A few graded answers so far — an early signal, not yet a confirmed priority.',
          },
          {
            label: 'Not checked',
            value: diagnostic,
            hint: 'No graded answers on this skill yet — a diagnostic guess, not measured.',
          },
        ].map((item) => (
          <Tip key={item.label} content={item.hint}>
            <div className="text-center">
              <p className={cn(NUM, 'text-xs font-extrabold text-slate-900 dark:text-slate-50')}>
                {item.value}
              </p>
              <p className={cn(MICRO, MUTED, 'truncate')}>{item.label}</p>
            </div>
          </Tip>
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
        'group flex items-start justify-between gap-2 p-2.5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:hover:border-white/12'
      )}
    >
      {/* The title used to share one line with the tag pill and be `truncate`d,
          which in this narrow column left every entry reading "Reading — Matchi…".
          The pill and the mastery figure moved to their own row underneath, so
          the title gets the full width and wraps to a second line if it needs it. */}
      <div className="flex min-w-0 items-start gap-2.5">
        <IconChip icon={Icon} tone="accent" size="md" className="mt-0.5" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] font-extrabold leading-snug text-slate-800 dark:text-slate-100">
            {title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Pill tone={tagTone}>{tag}</Pill>
            {mastery != null ? (
              <span className={cn(NUM, 'text-[10px] font-bold text-[#5a63df] dark:text-[#a9afff]')}>
                {mastery}% mastery
              </span>
            ) : null}
          </div>
          <p className={cn(MICRO, MUTED, 'mt-1 line-clamp-2 leading-snug')}>{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#5a63df] dark:text-slate-500" />
    </Link>
  );
}

/**
 * What to practise next, and how much evidence is behind that call.
 *
 * The target-progress ring that used to head this card drew the same
 * current-versus-target ratio as the meter in the headline band tile, two rows
 * above it. It is gone; the card now only carries what nothing else does.
 */
export default function AIInsightsCard({ stats, aiLoading }) {
  const suggestions = stats?.insights?.aiSuggestions;
  const primaryFocus = suggestions?.recommended_focus_areas?.[0];
  const grammarSignal =
    stats?.evidenceSummary?.grammar?.measuredPriorities?.length > 0 ||
    stats?.evidenceSummary?.grammar?.earlySignals?.length > 0 ||
    stats?.evidenceSummary?.grammar?.criterionSignals?.length > 0;
  const moduleRec = stats?.insights?.recommendations?.[0];
  const moduleRecMeta = moduleRec ? MODULE_META.find((item) => item.key === moduleRec.type) : null;

  return (
    <m.div variants={ITEM_VARIANTS} className="h-full w-full">
      <section className={cn(PANEL, 'flex h-full flex-col p-4')}>
        <PanelTitle
          label="Practise next"
          accent
          tip="Personalised from your saved results, weighted toward skills with the most evidence behind them."
          action={<Pill tone="ok">Active</Pill>}
        />

        <div className="flex h-full flex-1 flex-col gap-2.5">
          {aiLoading ? (
            <InsightsLoadingSkeleton />
          ) : suggestions ? (
            <>
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

        <PanelFootnote>Ranked by graded evidence, refreshed after every scored test.</PanelFootnote>
      </section>
    </m.div>
  );
}

function InsightsLoadingSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-2.5">
      <div className={cn(TILE, 'h-[52px] p-2.5')} />
      <div className={cn(TILE, 'h-[52px] p-2.5')} />
      <div className={cn(TILE, 'h-[76px] p-2.5')} />
    </div>
  );
}
