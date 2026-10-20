import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/cn';
import { GRAMMAR_GUIDES, GRAMMAR_GUIDE_KITS } from '../data/grammarGuideCatalog';
import {
  buildRecommendationMap,
  getCourseSummary,
  getNextGuide,
  getPartProgress,
} from '../data/courseProgress';
import SkillVisual from './SkillVisual';
import { skillLabel } from '../constants';
import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import ContentStatusBadge from '@/features/subscription/components/ContentStatusBadge';
import { IconChip, MUTED } from '@/features/dashboard/components/primitives';
import RecommendationBadge from '@/features/recommendations/RecommendationBadge';

const SKILL_VISUALS = {
  grammar_sentence_boundaries: {
    panelClass: 'from-[#fdfcff] to-[#f3efff]',
    cardClass: 'hover:border-violet-200',
  },
  grammar_verb_forms: {
    panelClass: 'from-[#fcfeff] to-[#edf5ff]',
    cardClass: 'hover:border-blue-200',
  },
  grammar_agreement_number: {
    panelClass: 'from-[#fcfffd] to-[#edf9f3]',
    cardClass: 'hover:border-emerald-200',
  },
  grammar_articles_determiners: {
    panelClass: 'from-[#fffefd] to-[#fff3e9]',
    cardClass: 'hover:border-orange-200',
  },
  grammar_clause_control: {
    panelClass: 'from-[#fcfeff] to-[#eaf8fb]',
    cardClass: 'hover:border-cyan-200',
  },
  grammar_word_forms: {
    panelClass: 'from-[#fffdfd] to-[#fff0f8]',
    cardClass: 'hover:border-pink-200',
  },
};
const REFERENCE_VISUAL = {
  panelClass: 'from-[#fdfdff] to-[#f4f5fb]',
  cardClass: 'hover:border-indigo-200',
};

function panelSubtitle({
  recommendations,
  recommendationMap,
  hasObservedRecommendedSkill,
  resultEvidenceCount,
  recommendedSkill,
}) {
  if (recommendations.length) {
    return `${recommendations.length} guide${recommendations.length === 1 ? ' is' : 's are'} tagged Recommended, based on ${resultEvidenceCount || 'your'} completed result${resultEvidenceCount === 1 ? '' : 's'} and Grammar Lab answers.`;
  }
  if (recommendationMap.size && hasObservedRecommendedSkill) {
    return `The guide tagged Recommended covers ${skillLabel(recommendedSkill.skillCode).toLowerCase()}, based on your saved answers.`;
  }
  if (recommendationMap.size) {
    return 'Start with the guide tagged Recommended, then take the level check for a result-based plan.';
  }
  return 'Short lessons with an exercise in each. Go in order, or jump to the rule you need.';
}

function NextUp({ nextGuide, recommendation }) {
  if (!nextGuide) return null;
  return (
    <Link
      to={`/grammar/guides/${nextGuide.slug}`}
      className="group mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#5a63df]/30 bg-[#5a63df]/[0.05] p-3.5 transition hover:border-[#5a63df]/55 hover:bg-[#5a63df]/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] dark:border-indigo-400/30 dark:bg-indigo-500/10"
    >
      <div className="flex min-w-0 items-center gap-3">
        <IconChip icon={BookOpenText} size="lg" />
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df] dark:text-indigo-300">
            Up next
          </div>
          <div className="mt-0.5 text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
            {nextGuide.label}: {nextGuide.title}
          </div>
          <div className={cn('mt-0.5 text-xs font-medium', MUTED)}>
            {recommendation?.reason || `${nextGuide.estimated_minutes} min · ${nextGuide.summary}`}
          </div>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#5a63df] px-3.5 py-2 text-xs font-extrabold text-white transition group-hover:bg-[#4a52c9]">
        Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function GuideCard({ guide, user, isCompleted, recommendation }) {
  const visual = SKILL_VISUALS[guide.skill_code] || REFERENCE_VISUAL;
  const isLocked = !hasContentAccess(user, guide.access_tier);
  return (
    <Link
      to={`/grammar/guides/${guide.slug}`}
      className={cn(
        'group flex min-h-[168px] flex-col justify-between rounded-xl border bg-linear-to-br/srgb p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:from-white/[0.035] dark:to-white/1.5 dark:focus-visible:ring-offset-[#100f15]',
        recommendation
          ? 'border-[#5a63df]/40 shadow-xs dark:border-[#8f97ff]/40'
          : 'border-[#eceafa] dark:border-white/10',
        visual.panelClass,
        visual.cardClass
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          {guide.unit_number ? (
            <SkillVisual
              skillCode={guide.skill_code}
              unitNumber={guide.unit_number}
              slug={guide.slug}
              compact
            />
          ) : (
            <IconChip icon={FileText} size="lg" />
          )}
          <ContentStatusBadge
            user={user}
            requiredTier={guide.access_tier}
            completed={isCompleted}
            className="shrink-0"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {recommendation && <RecommendationBadge recommendation={recommendation} />}
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#5a63df]">
            {guide.skill_code ? skillLabel(guide.skill_code) : guide.label}
          </span>
        </div>
        <h3 className="mt-1 text-xs font-extrabold leading-4 text-slate-900 dark:text-white">
          {guide.unit_number ? `${guide.unit_number}. ` : ''}
          {guide.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
          {guide.summary}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3 w-3" /> {guide.estimated_minutes} min
        </span>
        <span className="inline-flex items-center gap-0.5 text-[#5a63df]">
          {isLocked ? 'Unlock' : isCompleted ? 'Review' : 'Open'}
          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function PartHeader({ kit, progress, canPractise, noAllowance, isStarting, onStart }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df] dark:text-indigo-300">
          {kit.eyebrow}
          <span className="font-bold tracking-normal text-slate-400">
            {progress.completed}/{progress.total} done
          </span>
        </div>
        <h3 className="mt-0.5 text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
          {kit.title}
        </h3>
        <p className={cn('mt-0.5 max-w-2xl text-xs font-medium leading-5', MUTED)}>
          {kit.description}
        </p>
      </div>
      {canPractise && (
        <button
          type="button"
          aria-label={`Practise ${kit.title}`}
          onClick={() => onStart({ mode: 'practice', targetSkills: kit.skills, questionCount: 5 })}
          disabled={isStarting || noAllowance}
          title={
            noAllowance
              ? 'Your free questions for today are used. They reset tomorrow.'
              : 'Five questions on the skills in this part'
          }
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-[#5a63df]/30 bg-white px-3 text-[11px] font-bold text-[#5a63df] transition hover:bg-[#5a63df]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] disabled:cursor-not-allowed disabled:opacity-45 dark:border-indigo-400/30 dark:bg-white/5 dark:text-indigo-300"
        >
          {isStarting ? (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
          )}
          Practise this part
        </button>
      )}
    </div>
  );
}

export default function GrammarGuidesPanel({
  guideProgressUnavailable,
  user,
  access,
  isStarting = false,
  onStart,
  completedGuideSlugs = [],
  recommendedSkill,
  recommendations = [],
  resultEvidenceCount = 0,
}) {
  const [query, setQuery] = useState('');
  const recommendationMap = useMemo(
    () => buildRecommendationMap({ recommendations, recommendedSkill, completedGuideSlugs }),
    [completedGuideSlugs, recommendations, recommendedSkill]
  );
  const hasObservedRecommendedSkill =
    Number(recommendedSkill?.observations || 0) > 0 &&
    Number.isFinite(Number(recommendedSkill?.mastery));
  const noAllowance = Boolean(access) && !access.isPaid && Number(access.dailyRemaining || 0) <= 0;
  const summary = getCourseSummary(completedGuideSlugs);
  const nextGuide = getNextGuide(completedGuideSlugs, user, recommendationMap);

  const normalizedQuery = query.trim().toLowerCase();
  const parts = useMemo(
    () =>
      GRAMMAR_GUIDE_KITS.map((kit) => ({
        kit,
        guides: GRAMMAR_GUIDES.filter(
          (guide) =>
            guide.kit === kit.title &&
            (!normalizedQuery ||
              `${guide.title} ${guide.summary} ${guide.skill_code ? skillLabel(guide.skill_code) : ''}`
                .toLowerCase()
                .includes(normalizedQuery))
        ),
      })).filter((part) => part.guides.length),
    [normalizedQuery]
  );

  return (
    <section id="grammar-guides" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df]">
            <BookOpenText className="h-3.5 w-3.5" />
            Grammar course
          </div>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Learn it, then practise it
          </h2>
          <p className={cn('mt-1 max-w-2xl text-xs font-medium leading-5', MUTED)}>
            {panelSubtitle({
              recommendations,
              recommendationMap,
              hasObservedRecommendedSkill,
              resultEvidenceCount,
              recommendedSkill,
            })}
          </p>
        </div>
        <div className="w-full max-w-[220px] sm:text-right">
          <div className="flex items-baseline gap-1 sm:justify-end">
            <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
              {summary.completedUnits}
            </span>
            <span className="text-xs font-bold text-slate-400">
              of {summary.totalUnits} units done
            </span>
          </div>
          <Progress
            aria-label="Units completed"
            value={(summary.completedUnits / summary.totalUnits) * 100}
            className="mt-1.5 h-1.5 bg-[#eceef8] dark:bg-white/10"
            indicatorClassName="bg-emerald-500"
          />
          <div className="mt-1 text-[10px] font-semibold text-slate-400">
            Start guide, Units 1–3 and the study plan are free.
          </div>
        </div>
      </div>

      {!normalizedQuery && (
        <NextUp
          nextGuide={nextGuide}
          recommendation={nextGuide ? recommendationMap.get(nextGuide.slug) : null}
        />
      )}

      {guideProgressUnavailable && (
        <p role="status" className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
          Guide completion is temporarily unavailable. You can still read and practise.
        </p>
      )}

      <div className="relative mt-4 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a rule, e.g. articles"
          aria-label="Search grammar guides"
          className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 text-xs font-semibold dark:border-white/10 dark:bg-[#10131f]"
        />
      </div>

      {parts.length ? (
        <div className="mt-5 space-y-6">
          {parts.map(({ kit, guides }) => (
            <div key={kit.slug}>
              <PartHeader
                kit={kit}
                progress={getPartProgress(kit, completedGuideSlugs)}
                canPractise={kit.kind === 'practice' && Boolean(onStart)}
                noAllowance={noAllowance}
                isStarting={isStarting}
                onStart={onStart}
              />
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {guides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    guide={guide}
                    user={user}
                    isCompleted={completedGuideSlugs.includes(guide.slug)}
                    recommendation={recommendationMap.get(guide.slug)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e5f2] px-5 py-10 text-center">
          <Search className="mx-auto h-5 w-5 text-slate-400" />
          <div className="mt-2 text-sm font-extrabold text-slate-800 dark:text-white">
            No matching guide
          </div>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5a63df]"
          >
            Show all guides <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {summary.completedUnits === summary.totalUnits && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> You have finished every unit. Keep practising to lock
          it in.
        </p>
      )}
    </section>
  );
}
