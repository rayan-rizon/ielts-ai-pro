import React, { Suspense, lazy, useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, MoreVertical, Trash2, AlertCircle, Languages } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-200/80 dark:border-slate-800">
    {/* Left Side: Bolder Title & Subtitle (No PREMIUM badge as requested) */}
    <div className="space-y-1.5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-wider"
        >
          IELTS Vocabulary Engine
        </Badge>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none sm:leading-tight">
        Vocabulary Mastery
      </h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-semibold leading-relaxed">
        Master high-precision vocabulary, active recall flashcards, and topic word lists for IELTS
        Band 8.0+.
      </p>
    </div>

    {/* Right Side: Header Stats Cluster */}
    <div className="w-full xl:w-auto flex justify-start xl:justify-end min-w-0">
      <VocabularyStats
        stats={stats}
        wordLimit={getWordLimit(user?.subscription_tier)}
        dueCount={stats?.dueForReviewCount || 0}
      />
    </div>
  </div>
);

const BackgroundDecor = () => (
  <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-indigo-500/10 blur-[130px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-purple-500/10 blur-[130px]" />
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8 space-y-8">
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-start gap-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-6 w-96 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  </div>
);

const AlertDialog = ({ config, setConfig }) => (
  <Dialog open={config.open} onOpenChange={(open) => setConfig((prev) => ({ ...prev, open }))}>
    <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-6">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {config.title}
          </DialogTitle>
          <p className="text-slate-600 dark:text-slate-300 font-semibold text-xs leading-relaxed">
            {config.message}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 rounded-xl px-8 font-black text-xs w-full shadow-md"
          onClick={() => setConfig((prev) => ({ ...prev, open: false }))}
        >
          Close
        </Button>
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
  <div className="rounded-[22px] border border-[#e0e4f1] dark:border-white/10 bg-gradient-to-br from-white via-[#faf9ff] to-[#f4f2ff] dark:from-[#10131f] dark:to-[#10131f] shadow-[0_20px_50px_-42px_rgba(48,58,128,0.72)] p-5 sm:p-6 space-y-4">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="space-y-0.5 min-w-0 shrink">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#efedff] text-[#5862df] dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center ring-1 ring-[#5862df]/15 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          My Saved Words
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
          Review saved words, track memory strength, and translate definitions.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-nowrap w-full md:w-auto shrink-0">
        <div className="relative group flex-1 min-w-[120px] md:w-56 md:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            placeholder="Search saved words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 h-9 rounded-xl font-semibold text-xs shadow-inner w-full"
          />
        </div>

        <Select
          value={targetLanguage}
          onValueChange={(val) => {
            setTargetLanguage(val);
            saveLanguagePreference(val);
          }}
        >
          <SelectTrigger className="w-[115px] md:w-[125px] h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 text-xs font-bold shrink-0">
            <Languages className="w-3.5 h-3.5 mr-1 text-indigo-500 shrink-0" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="font-semibold">
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm shrink-0 flex items-center justify-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <MoreVertical className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </Button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden p-1"
              >
                <button
                  onClick={handleExportWords}
                  className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Export Library
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                <button
                  onClick={handleClearAllWords}
                  className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Clear All Words
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
    <div className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 overflow-hidden">
      <BackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 relative z-10"
      >
        {/* Page Header (Bolder title, stats on top right, no PREMIUM badge) */}
        <PageHeader stats={stats} user={user} />

        {/* Main Dashboard Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Wide Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
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
      </motion.div>
    </div>
  );
}
