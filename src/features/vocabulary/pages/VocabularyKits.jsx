import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Layers3,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DocumentHead from '@/components/shared/DocumentHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/context/AuthContext';
import VocabularyStudyView from '@/features/vocabulary/components/VocabularyStudyView';
import { useVocabularyData, useVocabularyMutations } from '@/features/vocabulary/hooks';
import {
  VOCABULARY_KITS,
  VOCABULARY_KIT_CATEGORIES,
  getVocabularyKit,
} from '@/features/vocabulary/data/vocabularyKits';
import { cn } from '@/lib/cn';
import KitCard from '@/features/vocabulary/components/KitCard';
import { getVocabularyKitProgress } from '@/features/vocabulary/utils/kitProgress';
import { useResultRecommendations } from '@/features/recommendations/useResultRecommendations';
import {
  IconChip,
  MUTED,
  PANEL,
  Pill,
  Stat,
  TILE,
} from '@/features/dashboard/components/primitives';

function scrollVocabularyPageToTop(pageElement) {
  let scrollParent = pageElement?.parentElement;
  while (scrollParent) {
    const { overflowY } = window.getComputedStyle(scrollParent);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      scrollParent.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }
    scrollParent = scrollParent.parentElement;
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function KitsLibrary() {
  const { user } = useAuth();
  const vocabulary = useVocabularyData(user);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All kits');
  const completedVocabularySlugs = useMemo(
    () =>
      VOCABULARY_KITS.filter(
        (kit) => getVocabularyKitProgress(kit, vocabulary.allVocabulary || []).isComplete
      ).map((kit) => kit.slug),
    [vocabulary.allVocabulary]
  );
  const resultRecommendations = useResultRecommendations({
    user,
    completedVocabularySlugs,
    vocabularyKits: VOCABULARY_KITS,
  });
  const recommendationMap = useMemo(
    () =>
      new Map(
        resultRecommendations.vocabulary.map((item, index) => [item.slug, { ...item, rank: index }])
      ),
    [resultRecommendations.vocabulary]
  );

  const visibleKits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = VOCABULARY_KITS.filter((kit) => {
      const categoryMatches = category === 'All kits' || kit.category === category;
      const queryMatches =
        !normalizedQuery ||
        `${kit.title} ${kit.description} ${kit.category}`.toLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
    if (category !== 'All kits' || normalizedQuery) return filtered;
    return [...filtered].sort((a, b) => {
      const aRank = recommendationMap.get(a.slug)?.rank;
      const bRank = recommendationMap.get(b.slug)?.rank;
      return (aRank ?? Number.MAX_SAFE_INTEGER) - (bRank ?? Number.MAX_SAFE_INTEGER);
    });
  }, [category, query, recommendationMap]);

  return (
    <>
      <DocumentHead
        title="IELTS Vocabulary Kits | IELTS Ai Pro"
        description="Study curated IELTS vocabulary kits for Speaking, Reading, Writing, target bands, and common exam topics."
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-20 text-slate-950 dark:bg-[#08080a] dark:text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 z-0 h-112 w-112 rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
        />

        <main className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/vocabulary"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Vocabulary Mastery
          </Link>

          <section className={cn(PANEL, 'mt-3 p-5 sm:p-6')}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <Pill tone="accent">
                  <Sparkles className="h-3 w-3" /> Curated from two complete IELTS banks
                </Pill>
                <h1 className="mt-3 max-w-3xl text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Vocabulary Kits
                </h1>
                <p className={cn('mt-2 max-w-2xl text-sm font-medium', MUTED)}>
                  Focused IELTS phrases in context — ready to save to your personal word bank.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat size="sm" tone="accent" label="Focused kits" value={VOCABULARY_KITS.length} />
                <Stat
                  size="sm"
                  tone="emerald"
                  label="Entries"
                  value={VOCABULARY_KITS.reduce((sum, kit) => sum + kit.word_count, 0)}
                />
                <Stat size="sm" tone="sky" label="Learning paths" value={5} />
              </div>
            </div>
          </section>

          <section id="vocabulary-kits-catalog" className={cn(PANEL, 'mt-4 p-4 sm:p-5')}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative xl:w-80">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search kits and topics..."
                  className="h-10 rounded-lg border-[#e2e5f2] bg-white pl-10 text-sm font-semibold dark:border-white/10 dark:bg-white/4"
                />
              </div>
              <LayoutGroup id="vocabulary-kit-category-tabs">
                <div
                  role="tablist"
                  aria-label="Vocabulary Kit categories"
                  className="flex gap-1.5 overflow-x-auto pb-1 xl:pb-0"
                >
                  {VOCABULARY_KIT_CATEGORIES.map((item) => {
                    const isActive = category === item;
                    return (
                      <m.button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setCategory(item)}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'relative whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-extrabold transition-colors',
                          isActive
                            ? 'text-white'
                            : 'bg-white text-slate-500 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:bg-white/5 dark:text-slate-400'
                        )}
                      >
                        {isActive && (
                          <m.span
                            layoutId="vocabulary-kit-active-category"
                            className="absolute inset-0 rounded-lg bg-[#5a63df]"
                            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                          />
                        )}
                        <span className="relative">{item}</span>
                      </m.button>
                    );
                  })}
                </div>
              </LayoutGroup>
            </div>

            <div className="mt-4 flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {category}
                </h2>
                <p className={cn('mt-0.5 text-xs font-semibold', MUTED)}>
                  {visibleKits.length} {visibleKits.length === 1 ? 'kit' : 'kits'} available
                  {resultRecommendations.vocabulary.length > 0 &&
                    ` · ${resultRecommendations.vocabulary.length} recommended from ${resultRecommendations.evidence.resultCount} recent result${resultRecommendations.evidence.resultCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {visibleKits.length ? (
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={category}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
                >
                  {visibleKits.map((kit, index) => (
                    <KitCard
                      key={kit.id}
                      kit={kit}
                      index={index}
                      user={user}
                      allVocabulary={vocabulary.allVocabulary}
                      recommendation={recommendationMap.get(kit.slug)}
                    />
                  ))}
                </m.div>
              </AnimatePresence>
            ) : (
              <div className={cn(TILE, 'mt-5 border-dashed px-6 py-16 text-center')}>
                <Search className="mx-auto h-7 w-7 text-slate-400" />
                <h2 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
                  No matching kits
                </h2>
                <p className={cn('mt-1 text-sm font-medium', MUTED)}>
                  Try a broader search or choose another learning path.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

function KitDetail({ kit }) {
  const pageTopRef = useRef(null);
  const { user } = useAuth();
  const vocabulary = useVocabularyData(user);
  const mutations = useVocabularyMutations({
    user,
    allVocabulary: vocabulary.allVocabulary,
    setAllVocabulary: vocabulary.setAllVocabulary,
    loadItems: vocabulary.loadItems,
  });
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(null);
  const savedCount = kit.words.filter((item) =>
    vocabulary.allVocabulary.some((saved) => saved?.word?.toLowerCase() === item.word.toLowerCase())
  ).length;
  useLayoutEffect(() => {
    scrollVocabularyPageToTop(pageTopRef.current);
  }, [kit.slug]);
  const handleAddAll = async (items) => {
    if (!items.length || isAddingAll) return;

    const tier = (user?.subscription_tier || 'free').toLowerCase();
    const limits = { free: 100, pro: 300, premium: Infinity };
    const remainingSlots = Math.max(
      0,
      (limits[tier] || limits.free) - vocabulary.allVocabulary.length
    );
    const itemsToAdd = items.slice(0, remainingSlots);

    if (!itemsToAdd.length) {
      setBulkStatus({
        type: 'error',
        message: `Your ${tier} word-bank limit is reached. Remove a saved word or upgrade to add more.`,
      });
      return;
    }

    setIsAddingAll(true);
    setBulkStatus(null);
    let added = 0;
    let failed = 0;
    for (const item of itemsToAdd) {
      const result = await mutations.handleAddWord({
        word: item.word,
        definition: item.definition,
        example: item.example,
        source: 'Vocabulary Kit',
      });
      if (result.success) added += 1;
      else failed += 1;
    }
    setIsAddingAll(false);
    const wasLimited = itemsToAdd.length < items.length;
    setBulkStatus({
      type: failed || wasLimited ? 'error' : 'success',
      message:
        failed && wasLimited
          ? `${added} of ${items.length} new items saved. Some could not be saved, and your plan has no room for the rest.`
          : failed
            ? `${added} new items saved. ${failed} could not be saved — please try the remaining items again.`
            : wasLimited
              ? `${added} of ${items.length} new items saved. Your plan has no room for the rest.`
              : `${added} new ${added === 1 ? 'item' : 'items'} added to your saved words.`,
    });
  };

  return (
    <>
      <DocumentHead title={`${kit.title} | IELTS Ai Pro`} description={kit.description} />
      <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-20 text-slate-950 dark:bg-[#08080a] dark:text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
        />
        <main
          ref={pageTopRef}
          className="relative z-10 mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8"
        >
          <Link
            to="/vocabulary/kits"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All Vocabulary Kits
          </Link>

          <section className={cn(PANEL, 'relative mt-3 overflow-hidden p-4 sm:p-5')}>
            <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(90,99,223,0.14),transparent_55%)] lg:block" />
            <div className="relative max-w-3xl">
              <Pill tone="accent">{kit.category}</Pill>
              <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {kit.title}
              </h1>
              <p className={cn('mt-1.5 max-w-2xl text-[13px] font-medium leading-5', MUTED)}>
                {kit.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="neutral">
                  <Layers3 className="h-3 w-3 text-[#5a63df]" />
                  {kit.word_count} entries
                </Pill>
                <Pill tone="emerald">
                  <CheckCircle2 className="h-3 w-3" />
                  {savedCount} saved
                </Pill>
              </div>
            </div>
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
            <article className={cn(PANEL, 'overflow-hidden')}>
              <VocabularyStudyView
                resource={kit}
                user={user}
                onAddWord={mutations.handleAddWord}
                onAddAll={handleAddAll}
                isAddingAll={isAddingAll}
                bulkStatus={bulkStatus}
                allVocabulary={vocabulary.allVocabulary}
                showHeader={false}
              />
            </article>

            <aside className="space-y-3 lg:sticky lg:top-5">
              <section className={cn(PANEL, 'p-4 sm:p-5')}>
                <IconChip icon={Target} size="lg" />
                <h2 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
                  Study this kit well
                </h2>
                <ol className={cn('mt-3 space-y-2 text-xs font-semibold leading-5', MUTED)}>
                  <li>1. Read the phrase and its precise meaning.</li>
                  <li>2. Notice the natural collocation or model use.</li>
                  <li>3. Save one item or add every new item to your word bank.</li>
                </ol>
                <Button
                  asChild
                  className="mt-4 w-full rounded-lg bg-[#5a63df] font-bold hover:bg-[#4a52c9]"
                >
                  <Link to="/vocabulary">
                    Open my word bank <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>

              <section className={cn(PANEL, 'p-4 sm:p-5')}>
                <div className="flex items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-[#5a63df]" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Source bank
                  </h2>
                </div>
                <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>
                  {kit.source}. Entries are presented as phrases and collocations so learners can
                  practise accurate use instead of memorising isolated words.
                </p>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

function MissingKit() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] px-4 py-20 dark:bg-[#08080a]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] bg-size-[20px_20px] opacity-[0.10] dark:opacity-[0.14]"
      />
      <section className={cn(PANEL, 'relative z-10 mx-auto max-w-xl p-8 text-center')}>
        <BookOpenText className="mx-auto h-8 w-8 text-[#5a63df]" />
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
          Kit not found
        </h1>
        <p className={cn('mt-2 text-sm font-medium', MUTED)}>
          This Vocabulary Kit is not available.
        </p>
        <Button asChild className="mt-5 rounded-lg bg-[#5a63df] font-bold hover:bg-[#4a52c9]">
          <Link to="/vocabulary/kits">Browse all kits</Link>
        </Button>
      </section>
    </div>
  );
}

export default function VocabularyKits() {
  const { kitSlug } = useParams();
  if (!kitSlug) return <KitsLibrary />;

  const kit = getVocabularyKit(kitSlug);
  return kit ? <KitDetail kit={kit} /> : <MissingKit />;
}
