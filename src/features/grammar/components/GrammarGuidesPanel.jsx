import { useMemo, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { ArrowRight, BookOpenText, ChevronRight, Clock3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { GRAMMAR_GUIDES, GRAMMAR_GUIDE_CATEGORIES } from '../data/grammarGuideCatalog';
import SkillVisual from './SkillVisual';
import { skillLabel } from '../constants';
import { hasContentAccess } from '@/features/subscription/config/contentAccess';
import ContentStatusBadge from '@/features/subscription/components/ContentStatusBadge';
import { MUTED } from '@/features/dashboard/components/primitives';
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

export default function GrammarGuidesPanel({
  resources,
  resourcesUnavailable,
  guideProgressUnavailable,
  user,
  completedGuideSlugs = [],
  recommendedSkill,
  recommendations = [],
  resultEvidenceCount = 0,
}) {
  const [category, setCategory] = useState('All guides');
  const [query, setQuery] = useState('');
  const recommendationMap = useMemo(() => {
    const map = new Map(
      recommendations.map((item, index) => [item.slug, { ...item, rank: index }])
    );

    // Cross-test recommendations are more specific, so they always win. When one is
    // unavailable, the dashboard's existing selected Grammar skill must still have a
    // visible, actionable destination instead of only changing the sort order.
    if (map.size || !recommendedSkill?.skillCode) return map;

    const nextGuide = GRAMMAR_GUIDES.find(
      (guide) =>
        guide.skill_code === recommendedSkill.skillCode && !completedGuideSlugs.includes(guide.slug)
    );
    if (!nextGuide) return map;

    const mastery = Number(recommendedSkill.mastery);
    const observations = Number(recommendedSkill.observations || 0);
    const hasObservedResult = observations > 0 && Number.isFinite(mastery);
    map.set(nextGuide.slug, {
      slug: nextGuide.slug,
      rank: 0,
      reason: hasObservedResult
        ? `Your Grammar Lab result shows ${Math.round(mastery * 100)}% mastery in ${String(recommendedSkill.label || nextGuide.kit).toLowerCase()}.`
        : 'Start here, then complete the Grammar Lab diagnostic for a result-based recommendation.',
      sources: [hasObservedResult ? 'grammar-lab' : 'grammar-lab-diagnostic'],
    });
    return map;
  }, [completedGuideSlugs, recommendations, recommendedSkill]);
  const hasObservedRecommendedSkill =
    Number(recommendedSkill?.observations || 0) > 0 &&
    Number.isFinite(Number(recommendedSkill?.mastery));
  const visibleGuides = useMemo(() => {
    const sourceGuides = GRAMMAR_GUIDES.length ? GRAMMAR_GUIDES : resources || [];
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = sourceGuides.filter((resource) => {
      const categoryMatches = category === 'All guides' || resource.kit === category;
      const queryMatches =
        !normalizedQuery ||
        `${resource.title} ${resource.summary} ${skillLabel(resource.skill_code)}`
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
    if (category !== 'All guides' || normalizedQuery) {
      return filtered;
    }
    return [...filtered].sort((a, b) => {
      const aRank = recommendationMap.get(a.slug)?.rank;
      const bRank = recommendationMap.get(b.slug)?.rank;
      if (aRank !== undefined || bRank !== undefined) {
        return (aRank ?? Number.MAX_SAFE_INTEGER) - (bRank ?? Number.MAX_SAFE_INTEGER);
      }
      return (
        Number(b.skill_code === recommendedSkill?.skillCode) -
        Number(a.skill_code === recommendedSkill?.skillCode)
      );
    });
  }, [category, query, recommendationMap, recommendedSkill?.skillCode, resources]);

  return (
    <section id="grammar-guides" className="scroll-mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df]">
            <BookOpenText className="h-3.5 w-3.5" />
            Complete workbook
          </div>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            IELTS grammar guides
          </h2>
          <p className={cn('mt-1 max-w-2xl text-xs font-medium leading-5', MUTED)}>
            {recommendations.length
              ? `${recommendations.length} focused guides appear first, based on ${resultEvidenceCount || 'your'} completed result${resultEvidenceCount === 1 ? '' : 's'} and Grammar Lab evidence.`
              : recommendationMap.size && hasObservedRecommendedSkill
                ? `Guides for ${skillLabel(recommendedSkill.skillCode).toLowerCase()} appear first, based on your saved evidence.`
                : recommendationMap.size
                  ? 'Start with the tagged foundation, then complete a Grammar Lab diagnostic for a result-based recommendation.'
                  : 'Follow all 18 units in order, or choose the exact rule you need before a practice set.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
            {GRAMMAR_GUIDES.length}
          </div>
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">
            focused units
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] p-3 dark:border-white/10 dark:bg-white/2.5 xl:flex-row xl:items-center">
        <div className="relative xl:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search grammar guides..."
            aria-label="Search grammar guides"
            className="h-9 rounded-lg border-[#e2e5f2] bg-white pl-9 text-xs font-semibold dark:border-white/10 dark:bg-[#10131f]"
          />
        </div>
        <LayoutGroup id="grammar-guide-category-tabs">
          <div className="flex gap-1.5 overflow-x-auto pb-1 xl:pb-0">
            {GRAMMAR_GUIDE_CATEGORIES.map((item) => {
              const isActive = category === item;
              return (
                <motion.button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'relative whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-extrabold transition-colors',
                    isActive
                      ? 'text-white'
                      : 'bg-white text-slate-500 hover:bg-[#f0f1fd] hover:text-[#5a63df] dark:bg-white/5 dark:text-slate-300'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="grammar-guide-active-category"
                      className="absolute inset-0 rounded-lg bg-[#5a63df]"
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span className="relative">{item}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {resourcesUnavailable && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          Your 18 essential guides are ready. Supplementary online guides are temporarily
          unavailable.
        </div>
      )}
      {guideProgressUnavailable && (
        <p role="status" className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
          Guide completion is temporarily unavailable. You can still read and practise.
        </p>
      )}

      {visibleGuides.length ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {visibleGuides.map((resource) => {
            const visual = SKILL_VISUALS[resource.skill_code] || SKILL_VISUALS.grammar_word_forms;
            const isLocked = !hasContentAccess(user, resource.access_tier);
            const isCompleted = completedGuideSlugs.includes(resource.slug);
            const recommendation = recommendationMap.get(resource.slug);
            return (
              <Link
                key={resource.id}
                to={`/grammar/guides/${resource.slug}`}
                className={cn(
                  'group flex min-h-[174px] flex-col justify-between rounded-xl border bg-linear-to-br/srgb p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:from-white/[0.035] dark:to-white/1.5 dark:focus-visible:ring-offset-[#100f15]',
                  recommendation
                    ? 'border-[#5a63df]/40 shadow-xs dark:border-[#8f97ff]/40'
                    : 'border-[#eceafa] dark:border-white/10',
                  visual.panelClass,
                  visual.cardClass
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <SkillVisual
                      skillCode={resource.skill_code}
                      unitNumber={resource.unit_number}
                      slug={resource.slug}
                      compact
                    />
                    <ContentStatusBadge
                      user={user}
                      requiredTier={resource.access_tier}
                      completed={isCompleted}
                      className="shrink-0"
                    />
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {recommendation && <RecommendationBadge recommendation={recommendation} />}
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#5a63df]">
                      {skillLabel(resource.skill_code)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-xs font-extrabold leading-4 text-slate-900 dark:text-white">
                    {resource.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
                    {resource.summary}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" /> {resource.estimated_minutes} min
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[#5a63df]">
                    {isLocked ? 'Preview' : 'Open'}{' '}
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e5f2] px-5 py-10 text-center">
          <Search className="mx-auto h-5 w-5 text-slate-400" />
          <div className="mt-2 text-sm font-extrabold text-slate-800 dark:text-white">
            No matching guide
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('All guides');
            }}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5a63df]"
          >
            Show all guides <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
