import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Layers3,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DocumentHead from '@/components/shared/DocumentHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/context/AuthContext';
import VocabularyStudyView from '@/features/vocabulary/components/VocabularyStudyView';
import { KitVisual } from '@/features/vocabulary/components/WordGroupList';
import { useVocabularyData, useVocabularyMutations } from '@/features/vocabulary/hooks';
import {
  VOCABULARY_KITS,
  VOCABULARY_KIT_CATEGORIES,
  getVocabularyKit,
} from '@/features/vocabulary/data/vocabularyKits';
import { cn } from '@/lib/cn';

const CATEGORY_TONES = {
  'Speaking vocabulary': {
    panel: 'from-[#fcfffd] to-[#edf9f3]',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
    hover: 'hover:border-emerald-200',
  },
  'Reading vocabulary': {
    panel: 'from-[#fcfeff] to-[#edf5ff]',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300',
    hover: 'hover:border-blue-200',
  },
  'Writing vocabulary': {
    panel: 'from-[#fdfcff] to-[#f3efff]',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300',
    hover: 'hover:border-violet-200',
  },
  'Vocabulary by target band': {
    panel: 'from-[#fffefd] to-[#fff3e9]',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300',
    hover: 'hover:border-amber-200',
  },
  'Topic vocabulary': {
    panel: 'from-[#fffdfd] to-[#fff0f8]',
    icon: 'bg-pink-100 text-pink-700 dark:bg-pink-400/10 dark:text-pink-300',
    hover: 'hover:border-pink-200',
  },
};

function KitCard({ kit, index }) {
  const tone = CATEGORY_TONES[kit.category] || CATEGORY_TONES['Writing vocabulary'];

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.985, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: 6 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.018, 0.12) }}
      className="h-full"
    >
      <Link
        to={`/vocabulary/kits/${kit.slug}`}
        aria-label={`Open ${kit.title}, ${kit.category}`}
        className={cn(
          'group flex h-full min-h-[132px] flex-col justify-between rounded-2xl border border-[#eceafa] bg-gradient-to-br p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-24px_rgba(59,70,150,0.65)] dark:border-white/10 dark:from-white/[0.035] dark:to-white/[0.015]',
          tone.panel,
          tone.hover
        )}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                'flex h-10 w-11 items-center justify-center rounded-xl shadow-sm',
                tone.icon
              )}
            >
              <KitVisual id={kit.id} />
            </div>
            <span className="rounded-full bg-white/80 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
              {kit.word_count} items
            </span>
          </div>
          <h2 className="mt-3 line-clamp-2 text-xs font-extrabold leading-4 text-slate-900 transition group-hover:text-[#5661e9] dark:text-white dark:group-hover:text-indigo-300">
            {kit.title}
          </h2>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {Math.max(6, Math.ceil(kit.word_count * 0.55))} min
          </span>
          <ArrowRight className="h-4 w-4 text-[#5661e9] transition group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.article>
  );
}

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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All kits');

  const visibleKits = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return VOCABULARY_KITS.filter((kit) => {
      const categoryMatches = category === 'All kits' || kit.category === category;
      const queryMatches =
        !normalizedQuery ||
        `${kit.title} ${kit.description} ${kit.category}`.toLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  return (
    <>
      <DocumentHead
        title="IELTS Vocabulary Kits | IELTS Ai Pro"
        description="Study curated IELTS vocabulary kits for Speaking, Reading, Writing, target bands, and common exam topics."
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f7f8fc] pb-20 dark:bg-[#020617]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.09),transparent_30%)]" />

        <main className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/vocabulary"
            className="ml-12 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-white hover:text-indigo-700 dark:hover:bg-white/5 dark:hover:text-white sm:ml-0"
          >
            <ArrowLeft className="h-4 w-4" /> Vocabulary Mastery
          </Link>

          <section className="mt-3 overflow-hidden rounded-[30px] border border-indigo-100 bg-[linear-gradient(120deg,#eef2ff_0%,#faf5ff_47%,#eff6ff_100%)] px-5 py-6 shadow-[0_30px_80px_-58px_rgba(79,70,229,0.45)] sm:px-8 sm:py-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600">
                  <Sparkles className="h-3.5 w-3.5" /> Curated from two complete IELTS banks
                </div>
                <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.045em] text-slate-800 sm:text-4xl">
                  Vocabulary Kits
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                  Focused IELTS phrases in context — ready to save to your personal word bank.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  [VOCABULARY_KITS.length, 'focused kits'],
                  [VOCABULARY_KITS.reduce((sum, kit) => sum + kit.word_count, 0), 'entries'],
                  [5, 'learning paths'],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/80 bg-white/70 p-3 text-center shadow-sm"
                  >
                    <div className="text-xl font-black text-indigo-700">{value}</div>
                    <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="sticky top-3 z-30 mt-5 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative xl:w-80">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search kits and topics..."
                  className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm font-semibold dark:border-white/10 dark:bg-slate-950"
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
                      <motion.button
                        key={item}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setCategory(item)}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          'relative whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-extrabold transition-colors',
                          isActive
                            ? 'text-white'
                            : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-white/5 dark:text-slate-400'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="vocabulary-kit-active-category"
                            className="absolute inset-0 rounded-xl bg-[#5661e9] shadow-[0_8px_18px_-12px_rgba(65,76,210,0.85)]"
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
          </section>

          <div className="mt-5 flex items-center justify-between px-1">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                {category}
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                {visibleKits.length} {visibleKits.length === 1 ? 'kit' : 'kits'} available
              </p>
            </div>
          </div>

          {visibleKits.length ? (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6"
              >
                {visibleKits.map((kit, index) => (
                  <KitCard key={kit.id} kit={kit} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900">
              <Search className="mx-auto h-7 w-7 text-slate-400" />
              <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">
                No matching kits
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Try a broader search or choose another learning path.
              </p>
            </div>
          )}
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
      <div className="min-h-screen bg-[#f7f8fc] pb-20 dark:bg-[#020617]">
        <main ref={pageTopRef} className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/vocabulary/kits"
            className="ml-12 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-extrabold text-slate-500 transition hover:bg-white hover:text-indigo-700 dark:hover:bg-white/5 dark:hover:text-white sm:ml-0"
          >
            <ArrowLeft className="h-4 w-4" /> All Vocabulary Kits
          </Link>

          <section className="relative mt-3 overflow-hidden rounded-[30px] border border-indigo-100 bg-white px-5 py-7 shadow-[0_24px_70px_-50px_rgba(48,58,128,0.7)] dark:border-white/10 dark:bg-slate-900 sm:px-8 sm:py-9">
            <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(99,102,241,0.16),transparent_55%)] lg:block" />
            <div className="relative max-w-3xl">
              <Badge className="border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-300">
                {kit.category}
              </Badge>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] text-slate-800 dark:text-white sm:text-4xl">
                {kit.title}
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
                {kit.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-extrabold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  <Layers3 className="h-3.5 w-3.5 text-indigo-500" />
                  {kit.word_count} entries
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savedCount} saved
                </span>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
            <article className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_18px_55px_-44px_rgba(48,58,128,0.7)] dark:border-white/10 dark:bg-slate-950">
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

            <aside className="space-y-4 lg:sticky lg:top-5">
              <section className="rounded-3xl border border-indigo-100 bg-[linear-gradient(145deg,#f8f8ff,#eef1ff)] p-5 dark:border-indigo-400/20 dark:bg-none dark:bg-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300">
                  <Target className="h-5 w-5" />
                </div>
                <h2 className="mt-3 text-base font-black text-slate-800 dark:text-white">
                  Study this kit well
                </h2>
                <ol className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                  <li>1. Read the phrase and its precise meaning.</li>
                  <li>2. Notice the natural collocation or model use.</li>
                  <li>3. Save one item or add every new item to your word bank.</li>
                </ol>
                <Button asChild className="mt-4 w-full rounded-xl bg-indigo-600 font-extrabold">
                  <Link to="/vocabulary">
                    Open my word bank <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <BookOpenText className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-sm font-black text-slate-800 dark:text-white">Source bank</h2>
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
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
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-20 dark:bg-[#020617]">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-900">
        <BookOpenText className="mx-auto h-8 w-8 text-indigo-500" />
        <h1 className="mt-3 text-xl font-black text-slate-800 dark:text-white">Kit not found</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          This Vocabulary Kit is not available.
        </p>
        <Button asChild className="mt-5 rounded-xl bg-indigo-600 font-extrabold">
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
