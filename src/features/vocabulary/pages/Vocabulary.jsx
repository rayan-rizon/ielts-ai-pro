import React, { Suspense, lazy, useState, useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, MoreVertical, Trash2, AlertCircle, Languages } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

import VocabularyList from '@/features/vocabulary/components/VocabularyList';
import VocabularyStats from '@/features/vocabulary/components/VocabularyStats';
import ReviewBanner from '@/features/vocabulary/components/ReviewBanner';
import VocabularySidebar from '@/features/vocabulary/components/VocabularySidebar';
import QuickAddCard from '@/features/vocabulary/components/QuickAddCard';
import WordGroupList from '@/features/vocabulary/components/WordGroupList';
import WordDetailDialog from '@/features/vocabulary/components/WordDetailDialog';

import {
  SUPPORTED_LANGUAGES,
  saveLanguagePreference,
} from '@/features/vocabulary/services/translateService';
import { generateAdaptiveLearningPath } from '@/utils/api';
import { completeVocabularyLearningActivity } from '@/features/vocabulary/services/vocabularyRetention';
import {
  useVocabularyMutations,
  useReviewSession,
  useSpeedQuiz,
  useMatchPairs,
  useVocabularyData,
} from '@/features/vocabulary/hooks';
import { IconChip, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';

const ReviewSession = lazy(() => import('@/features/vocabulary/components/ReviewSession'));
const GameModals = lazy(() =>
  import('@/features/vocabulary/components/GameModals').then((module) => ({
    default: function VocabularyGameModals({ speedQuiz, matchPairs, onRestartMatchPairs }) {
      return (
        <>
          <module.SpeedQuizModal
            isOpen={speedQuiz.isSpeedQuizOpen}
            onClose={speedQuiz.closeGame}
            gameData={speedQuiz.gameData}
            gameState={speedQuiz.gameState}
            gameScore={speedQuiz.gameScore}
            onAnswer={speedQuiz.handleQuizAnswer}
          />
          <module.MatchPairsModal
            isOpen={matchPairs.isMatchPairsOpen}
            onClose={matchPairs.closeGame}
            gameData={matchPairs.gameData}
            gameState={matchPairs.gameState}
            gameScore={matchPairs.gameScore}
            onCardClick={matchPairs.handleCardClick}
            onRestart={onRestartMatchPairs}
          />
        </>
      );
    },
  }))
);

const VOCABULARY_LIMITS = { free: 100, pro: 300, premium: Infinity };
const getWordLimit = (subscriptionTier) =>
  VOCABULARY_LIMITS[(subscriptionTier || 'free').toLowerCase()] || VOCABULARY_LIMITS.free;

const PageHeader = ({ stats, user }) => (
  <div className="flex flex-col gap-4 border-b border-[#eeedf7] pb-4 dark:border-white/[0.07] xl:flex-row xl:items-end xl:justify-between">
    <div className="max-w-2xl space-y-1.5">
      <Pill tone="accent">IELTS Vocabulary Engine</Pill>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Vocabulary Mastery
      </h1>
      <p className={cn('text-sm font-medium', MUTED)}>
        Master high-precision vocabulary, active recall flashcards, and topic word lists for IELTS
        Band 8.0+.
      </p>
    </div>

    <div className="flex w-full min-w-0 justify-start xl:w-auto xl:justify-end">
      <VocabularyStats
        stats={stats}
        wordLimit={getWordLimit(user?.subscription_tier)}
        dueCount={stats?.dueForReviewCount || 0}
      />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen space-y-4 bg-[#f8f8fb] p-4 dark:bg-[#0b0a10] sm:p-6 md:p-8">
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-5 w-96 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
        <div className="space-y-3 lg:col-span-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

const AlertDialog = ({ config, setConfig }) => (
  <Dialog open={config.open} onOpenChange={(open) => setConfig((prev) => ({ ...prev, open }))}>
    <DialogContent className="max-w-md rounded-xl border-[#e2e5f2] bg-white p-6 dark:border-white/10 dark:bg-[#131218]">
      <div className="flex flex-col items-center gap-3 text-center">
        <IconChip icon={AlertCircle} tone="amber" size="lg" />
        <div className="space-y-1">
          <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
            {config.title}
          </DialogTitle>
          <p className={cn('text-xs font-medium leading-relaxed', MUTED)}>{config.message}</p>
        </div>
        <button
          type="button"
          className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#5a63df] text-xs font-bold text-white transition-all hover:bg-[#4a52c9] active:scale-95"
          onClick={() => setConfig((prev) => ({ ...prev, open: false }))}
        >
          Close
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

const PersonalWordBank = ({
  searchTerm,
  setSearchTerm,
  targetLanguage,
  setTargetLanguage,
  isDropdownOpen,
  setIsDropdownOpen,
  handleExportWords,
  handleClearAllWords,
  filteredWords,
  hasMoreItems,
  isLoadingMore,
  setViewingWord,
  handleToggleMastery,
  handleDeleteWord,
  handleLoadMore,
}) => (
  <div className={cn(PANEL, 'space-y-4 p-4 sm:p-5')}>
    <div className="flex flex-col gap-3">
      {/* Title section - full width to ensure text never squashes or breaks awkwardly */}
      <div className="w-full space-y-1">
        <h3 className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
          <IconChip icon={BookOpen} />
          <span>My Saved Words</span>
        </h3>
        <p className={cn('text-xs font-medium leading-relaxed', MUTED)}>
          Review saved words, track memory strength, and translate definitions.
        </p>
      </div>

      {/* Controls row - search input on left, language & actions on right */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="group relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#5a63df]" />
          <Input
            placeholder="Search saved words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border-[#e2e5f2] bg-[#fbfbfe] pl-9 text-xs font-semibold dark:border-white/10 dark:bg-white/[0.04]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={targetLanguage}
            onValueChange={(val) => {
              setTargetLanguage(val);
              saveLanguagePreference(val);
            }}
          >
            <SelectTrigger className="h-9 w-[130px] shrink-0 rounded-lg border-[#e2e5f2] bg-[#fbfbfe] text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
              <Languages className="mr-1.5 h-3.5 w-3.5 shrink-0 text-[#5a63df]" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs font-semibold">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[#e2e5f2] bg-white dark:border-white/10 dark:bg-white/[0.04]"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <MoreVertical className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
            </Button>

            <AnimatePresence>
              {isDropdownOpen && (
                <m.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-[#e2e5f2] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#131218]"
                >
                  <button
                    onClick={handleExportWords}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-700 transition-all hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#5a63df]" /> Export Library
                  </button>
                  <div className="my-1 h-px bg-[#eeedf7] dark:bg-white/10" />
                  <button
                    onClick={handleClearAllWords}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-[rgb(var(--signal-fault))] transition-all hover:bg-[rgba(var(--signal-fault),0.08)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear All Words
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>

    <VocabularyList
      filteredWords={filteredWords}
      hasMore={hasMoreItems}
      isLoadingMore={isLoadingMore}
      onViewWord={setViewingWord}
      onToggleMastery={handleToggleMastery}
      onDeleteWord={handleDeleteWord}
      onLoadMore={handleLoadMore}
      targetLanguage={targetLanguage}
    />
  </div>
);

export default function Vocabulary() {
  const { user } = useAuth();
  const learningPathContext = useMemo(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    return {
      activityId: params.get('activityId'),
      reviewRequested: params.get('mode') === 'review',
    };
  }, []);
  const reviewSessionSize = useRef(0);
  const autoStartedReview = useRef(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewingWord, setViewingWord] = useState(null);
  const [retentionRefreshKey, setRetentionRefreshKey] = useState(0);

  const [targetLanguage, setTargetLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vocabularyTargetLanguage') || 'en';
    }
    return 'en';
  });

  const {
    allVocabulary,
    setAllVocabulary,
    dueForReview,
    setDueForReview,
    isLoading,
    stats: rawStats,
    hasMoreItems,
    isLoadingMore,
    handleLoadMore,
    loadItems,
  } = useVocabularyData(user);

  const stats = useMemo(
    () => ({
      ...rawStats,
      dueForReviewCount: dueForReview.length,
    }),
    [rawStats, dueForReview]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.relative')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocabularyTargetLanguage', targetLanguage);
    }
  }, [targetLanguage]);

  const {
    isAdding,
    handleAddWord: hookAddWord,
    handleDeleteWord: hookDeleteWord,
    handleToggleMastery: hookToggleMastery,
    handleClearAllWords: hookClearAllWords,
    handleExportWords: hookExportWords,
  } = useVocabularyMutations({
    user,
    allVocabulary,
    setAllVocabulary,
    loadItems,
  });

  const handleDeleteWord = async (id) => {
    const previousDueForReview = dueForReview;
    setDueForReview((prev) => prev.filter((item) => item.id !== id));
    const result = await hookDeleteWord(id);
    if (!result.success) {
      setDueForReview(previousDueForReview);
      alert('Failed to delete word');
    }
  };

  const handleToggleMastery = async (id, currentLevel) => {
    const result = await hookToggleMastery(id, currentLevel);
    if (!result.success) {
      alert('Failed to update mastery status.');
    }
  };

  const handleExportWords = () => {
    const result = hookExportWords();
    if (!result.success) alert(result.error || 'No words to export');
    setIsDropdownOpen(false);
  };

  const handleClearAllWords = async () => {
    if (!confirm('Are you sure you want to delete all words? This action cannot be undone.'))
      return;
    const result = await hookClearAllWords();
    if (result.success) {
      setDueForReview([]);
      setIsDropdownOpen(false);
    } else {
      alert('Failed to clear words: ' + (result.error || 'Unknown error'));
    }
  };

  const {
    isReviewSessionOpen,
    currentReviewItem,
    isFlipped,
    startReviewSession: hookStartReviewSession,
    handleReviewSubmit,
    closeReviewSession,
    flipCard,
  } = useReviewSession({
    dueForReview,
    setDueForReview,
    setAllVocabulary,
    user,
    onReviewRecorded: () => setRetentionRefreshKey((key) => key + 1),
    onSessionComplete: async () => {
      if (learningPathContext.activityId) {
        await completeVocabularyLearningActivity(
          learningPathContext.activityId,
          reviewSessionSize.current
        ).catch((error) =>
          console.warn('Vocabulary review completed; path activity update was deferred:', error)
        );
      }
      if (['pro', 'premium'].includes(String(user?.subscription_tier || '').toLowerCase())) {
        await generateAdaptiveLearningPath({
          trigger: 'vocabulary_completed',
          module: 'vocabulary',
        }).catch((error) =>
          console.warn('Vocabulary evidence was saved; Learning Path refresh was deferred:', error)
        );
      }
    },
  });

  const startReviewSession = () => {
    if (dueForReview.length === 0) {
      setAlertConfig({
        open: true,
        title: 'No Words Due',
        message: 'You have no words due for review right now. Great job!',
      });
      return;
    }
    reviewSessionSize.current = dueForReview.length;
    hookStartReviewSession();
  };

  useEffect(() => {
    if (
      learningPathContext.reviewRequested &&
      !isLoading &&
      dueForReview.length > 0 &&
      !autoStartedReview.current
    ) {
      autoStartedReview.current = true;
      reviewSessionSize.current = dueForReview.length;
      hookStartReviewSession();
    }
  }, [dueForReview.length, hookStartReviewSession, isLoading, learningPathContext.reviewRequested]);

  const handleStartGame = (startFn, title, minWords) => {
    const result = startFn();
    if (!result.success) {
      setAlertConfig({
        open: true,
        title: 'Not Enough Words',
        message: `You need at least ${minWords} words to play ${title}! Add more words to start playing.`,
      });
    }
  };

  const speedQuiz = useSpeedQuiz({ allVocabulary });
  const startSpeedQuiz = () => handleStartGame(speedQuiz.startSpeedQuiz, 'Speed Quiz', 4);

  const matchPairs = useMatchPairs({ allVocabulary });
  const startMatchPairs = () => handleStartGame(matchPairs.startMatchPairs, 'Match Pairs', 4);

  const filteredWords = useMemo(() => {
    if (!searchTerm) return allVocabulary.filter(Boolean);
    return allVocabulary.filter(
      (item) => item && item.word && item.word.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allVocabulary, searchTerm]);

  if (isLoading && !allVocabulary.length) return <LoadingSkeleton />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f8fb] pb-20 text-slate-950 transition-colors duration-300 dark:bg-[#0b0a10] dark:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(#5a63df_1.5px,transparent_1.5px)] bg-[size:24px_24px] opacity-[0.12] dark:opacity-[0.16]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-0 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(210,204,255,0.55),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(90,99,223,0.16),transparent_70%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-[1600px] space-y-4 p-4 sm:p-6 md:p-8"
      >
        <PageHeader stats={stats} user={user} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {/* Hero Card: Daily Review Queue + Featured Flashcard */}
            <ReviewBanner
              dueForReview={dueForReview}
              totalWords={allVocabulary.length}
              onStartReview={startReviewSession}
              onAddWord={hookAddWord}
            />

            {/* Mobile Quick Add */}
            <div className="block lg:hidden w-full">
              <QuickAddCard
                onAddWord={hookAddWord}
                isAdding={isAdding}
                user={user}
                allVocabularyCount={allVocabulary.length}
                onShowAlert={setAlertConfig}
                onSuccess={() => loadItems()}
              />
            </div>

            {/* Topic Word Lists */}
            <WordGroupList allVocabulary={allVocabulary} user={user} />

            {/* My Saved Words (Table & Cards View) */}
            <PersonalWordBank
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              targetLanguage={targetLanguage}
              setTargetLanguage={setTargetLanguage}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              handleExportWords={handleExportWords}
              handleClearAllWords={handleClearAllWords}
              filteredWords={filteredWords}
              hasMoreItems={hasMoreItems}
              isLoadingMore={isLoadingMore}
              setViewingWord={setViewingWord}
              handleToggleMastery={handleToggleMastery}
              handleDeleteWord={handleDeleteWord}
              handleLoadMore={handleLoadMore}
            />
          </div>

          {/* Sidebar Column (4 cols) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col space-y-5">
            <VocabularySidebar
              user={user}
              allVocabularyCount={allVocabulary.length}
              isAdding={isAdding}
              onAddWord={hookAddWord}
              onShowAlert={setAlertConfig}
              onSuccess={() => loadItems()}
              onStartSpeedQuiz={startSpeedQuiz}
              onStartMatchPairs={startMatchPairs}
              onStartReview={startReviewSession}
              retentionRefreshKey={retentionRefreshKey}
              dueForReview={dueForReview}
              allVocabulary={allVocabulary}
            />
          </div>
        </div>

        {/* Modals */}
        {isReviewSessionOpen && (
          <Suspense fallback={null}>
            <ReviewSession
              isOpen={isReviewSessionOpen}
              onOpenChange={(open) => !open && closeReviewSession()}
              currentItem={currentReviewItem}
              isFlipped={isFlipped}
              onFlip={flipCard}
              onSubmit={handleReviewSubmit}
            />
          </Suspense>
        )}

        {(speedQuiz.isSpeedQuizOpen || matchPairs.isMatchPairsOpen) && (
          <Suspense fallback={null}>
            <GameModals
              speedQuiz={speedQuiz}
              matchPairs={matchPairs}
              onRestartMatchPairs={() => {
                matchPairs.closeGame();
                setTimeout(() => startMatchPairs(), 200);
              }}
            />
          </Suspense>
        )}

        <AlertDialog config={alertConfig} setConfig={setAlertConfig} />

        <WordDetailDialog
          viewingWord={viewingWord}
          setViewingWord={setViewingWord}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          handleDeleteWord={handleDeleteWord}
        />
      </m.div>
    </div>
  );
}
