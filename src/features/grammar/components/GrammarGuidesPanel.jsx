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
  user,
  completedGuideSlugs = [],
  recommendedSkill,
}) {
  const [category, setCategory] = useState('All guides');
  const [query, setQuery] = useState('');
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
    if (category !== 'All guides' || normalizedQuery || !recommendedSkill?.skillCode) {
      return filtered;
    }
    return [...filtered].sort(
      (a, b) =>
        Number(b.skill_code === recommendedSkill.skillCode) -
        Number(a.skill_code === recommendedSkill.skillCode)
    );
  }, [category, query, recommendedSkill?.skillCode, resources]);

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
            {recommendedSkill?.skillCode
              ? `Guides for ${skillLabel(recommendedSkill.skillCode).toLowerCase()} appear first, based on your saved evidence.`
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

      {visibleGuides.length ? (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {visibleGuides.map((resource) => {
            const visual = SKILL_VISUALS[resource.skill_code] || SKILL_VISUALS.grammar_word_forms;
            const isLocked = !hasContentAccess(user, resource.access_tier);
            const isCompleted = completedGuideSlugs.includes(resource.slug);
            const isRecommended = resource.skill_code === recommendedSkill?.skillCode;
            return (
              <Link
                key={resource.id}
                to={`/grammar/guides/${resource.slug}`}
                className={cn(
                  'group flex min-h-[174px] flex-col justify-between rounded-xl border border-[#eceafa] bg-linear-to-br p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/10 dark:from-white/[0.035] dark:to-white/1.5',
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
                    />
                  </div>
                  <div className="mt-2.5 text-[9px] font-extrabold uppercase tracking-widest text-[#5a63df]">
                    {isRecommended ? 'Recommended · ' : ''}
                    {skillLabel(resource.skill_code)}
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
