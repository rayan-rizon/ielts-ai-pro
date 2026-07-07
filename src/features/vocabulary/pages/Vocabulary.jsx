import React, { Suspense, lazy, useState, useEffect, useMemo } from 'react';
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
import VocabularyStudyView from '@/features/vocabulary/components/VocabularyStudyView';

import {
  SUPPORTED_LANGUAGES,
  saveLanguagePreference,
} from '@/features/vocabulary/services/translateService';
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
            data-oid="4jcnyai"
          />
          <module.MatchPairsModal
            isOpen={matchPairs.isMatchPairsOpen}
            onClose={matchPairs.closeGame}
            gameData={matchPairs.gameData}
            gameState={matchPairs.gameState}
            gameScore={matchPairs.gameScore}
            onCardClick={matchPairs.handleCardClick}
            onRestart={onRestartMatchPairs}
            data-oid="awuudbs"
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
  <div
    className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative"
    data-oid="l8.0yzd"
  >
    <div className="flex-1 space-y-4" data-oid="d2:o_2-">
      <div className="flex items-center gap-3" data-oid="ot18hv_">
        <Badge
          variant="outline"
          className="px-3 py-1 rounded-full bg-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider"
          data-oid="n6d-iw0"
        >
          Smart Vocabulary
        </Badge>
      </div>
      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-3 leading-tight italic"
        data-oid="963i93."
      >
        Vocab{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          Mastery
        </span>{' '}
        🧠
      </h1>
      <p
        className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium max-w-xl"
        data-oid="mn_n46j"
      >
        Master high-precision words and unlock an 8.0+ Band Score.
      </p>
    </div>
    <div className="w-full lg:w-auto flex justify-start lg:justify-end" data-oid="c0vzl5j">
      <VocabularyStats
        stats={stats}
        wordLimit={getWordLimit(user?.subscription_tier)}
        data-oid="nwe16ew"
      />
    </div>
  </div>
);

const BackgroundDecor = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    data-oid="chnv4zm"
  >
    <div
      className="absolute top-[-10%] left-[-10%] w-[70rem] h-[70rem] rounded-full bg-slate-200/30 dark:bg-indigo-950/20 blur-[120px]"
      data-oid="q5v6bkj"
    />
    <div
      className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] rounded-full bg-indigo-100/20 dark:bg-slate-900/10 blur-[120px]"
      data-oid="evk_.l3"
    />
    <div
      className="absolute top-[20%] right-[10%] w-[40rem] h-[40rem] rounded-full bg-slate-200/10 dark:bg-slate-900/15 blur-[80px]"
      data-oid="-pu1p9d"
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
      data-oid=":lx4mdl"
    />
    <div
      className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]"
      data-oid="zzl442g"
    />
    <div
      className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
      data-oid="s7g.tim"
    />
  </div>
);

const LoadingSkeleton = () => (
  <div
    className="min-h-screen bg-slate-50 dark:bg-[#020617] p-8 space-y-8"
    data-oid="skeleton-loader"
  >
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex justify-between items-start gap-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-6 w-96 rounded-lg" />
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-32 w-80 rounded-3xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  </div>
);

const AlertDialog = ({ config, setConfig }) => (
  <Dialog
    open={config.open}
    onOpenChange={(open) => setConfig((prev) => ({ ...prev, open }))}
    data-oid="i_0c5q6"
  >
    <DialogContent
      className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-none shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-3xl p-10 overflow-hidden"
      data-oid="ib78nab"
    >
      <div
        className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px]"
        data-oid="kn:_g7d"
      />
      <div
        className="flex flex-col items-center text-center gap-6 relative z-10"
        data-oid="cngf3i-"
      >
        <div
          className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner group transition-transform hover:scale-110"
          data-oid="3wfd3kk"
        >
          <AlertCircle
            className="w-8 h-8 group-hover:rotate-12 transition-transform"
            data-oid=".jhaq33"
          />
        </div>
        <div className="space-y-2" data-oid="kaz6ldb">
          <DialogTitle
            className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wide"
            data-oid="9py22_u"
          >
            {config.title}
          </DialogTitle>
          <p
            className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
            data-oid="vc:nusu"
          >
            {config.message}
          </p>
        </div>
        <Button
          className="bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white h-14 rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-[10px] w-full shadow-xl shadow-amber-500/10 active:scale-95 transition-all"
          onClick={() => setConfig((prev) => ({ ...prev, open: false }))}
          data-oid="p7sms.g"
        >
          Verify & Close
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
  <div
    className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/50 dark:border-white/[0.12] transition-all duration-300 relative z-20"
    data-oid="fvej1td"
  >
    <div
      className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.12] flex flex-col xl:flex-row xl:items-center justify-between gap-5"
      data-oid="x3oyikf"
    >
      <div className="space-y-0.5" data-oid="2hgdqsb">
        <h3
          className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2"
          data-oid="7lumcwf"
        >
          <div
            className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
            data-oid="4h01zqy"
          >
            <BookOpen className="w-3.5 h-3.5" data-oid="y1brrrm" />
          </div>
          Personal Word Bank
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium" data-oid="n_19477">
          Review your saved words and track your mastery progress.
        </p>
      </div>

      <div
        className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full xl:w-auto"
        data-oid="1.:amm1"
      >
        <div className="relative group w-full sm:w-64" data-oid="9qbioq:">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            data-oid="y588ntb"
          />
          <Input
            placeholder="Filter by term..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-white/[0.12] h-10 rounded-xl focus:ring-blue-500/20 transition-all font-medium"
            data-oid="dusi_wc"
          />
        </div>

        <Select
          value={targetLanguage}
          onValueChange={(val) => {
            setTargetLanguage(val);
            saveLanguagePreference(val);
          }}
          data-oid="05fu28m"
        >
          <SelectTrigger
            className="w-[130px] h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-white/[0.12] text-sm font-bold"
            data-oid="t18rko7"
          >
            <Languages className="w-4 h-4 mr-2 text-indigo-500" data-oid="pb8-xz." />
            <SelectValue placeholder="Language" data-oid="xgz10jd" />
          </SelectTrigger>
          <SelectContent className="rounded-xl" data-oid="-ksaote">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem
                key={lang.code}
                value={lang.code}
                className="font-medium"
                data-oid="dvj5diy"
              >
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative" data-oid="51q1sut">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200/60 dark:border-white/[0.12] bg-white dark:bg-slate-950 transition-all hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            data-oid="wheit8b"
          >
            <MoreVertical
              className="w-4 h-4 text-slate-600 dark:text-slate-300"
              data-oid="tnx0rt2"
            />
          </Button>

          <AnimatePresence data-oid="4_3ndk1">
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/[0.12] z-50 overflow-hidden"
                data-oid="vjt-wvd"
              >
                <div className="p-1.5" data-oid="qnsf9iu">
                  <button
                    onClick={handleExportWords}
                    className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center gap-3 group"
                    data-oid="9io5for"
                  >
                    <BookOpen
                      className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform"
                      data-oid="bg2e9fu"
                    />{' '}
                    Export Library
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2" data-oid="pzqiqfs" />
                  <button
                    onClick={handleClearAllWords}
                    className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all flex items-center gap-3 group"
                    data-oid="v1blxrj"
                  >
                    <Trash2
                      className="w-4 h-4 text-red-500 group-hover:animate-bounce"
                      data-oid="5dcxyk0"
                    />{' '}
                    Wipe Data
                  </button>
                </div>
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
      data-oid="uho3no2"
    />
  </div>
);

export default function Vocabulary() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewingWord, setViewingWord] = useState(null);
  const [selectedCuratedList, setSelectedCuratedList] = useState(null);

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
    curatedLists,
    stats,
    hasMoreItems,
    isLoadingMore,
    handleLoadMore,
    loadItems,
  } = useVocabularyData(user);

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
      if (result.error?.includes('column') || result.error?.includes('42703')) {
        alert(
          "⚠️ Database Schema Update Required: The 'mastery_level' column is missing. Please run the provided SQL script."
        );
      } else {
        alert('Failed to update mastery status.');
      }
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
  } = useReviewSession({ dueForReview, setDueForReview, setAllVocabulary, user });

  const startReviewSession = () => {
    if (dueForReview.length === 0) {
      setAlertConfig({
        open: true,
        title: 'No Words Due',
        message: 'You have no words due for review right now. Great job!',
      });
      return;
    }
    hookStartReviewSession();
  };

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
    <div
      className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden"
      data-oid="fzsba6k"
    >
      <BackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-3 sm:p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 relative z-10"
        data-oid="04-8.zd"
      >
        <PageHeader stats={stats} user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" data-oid="thpedsw">
          <div className="lg:col-span-8 space-y-8" data-oid="g20156_">
            <ReviewBanner
              dueForReview={dueForReview}
              totalWords={allVocabulary.length}
              onStartReview={startReviewSession}
              data-oid="npauksz"
            />

            <div className="block lg:hidden w-full mb-8">
              <QuickAddCard
                onAddWord={hookAddWord}
                isAdding={isAdding}
                user={user}
                allVocabularyCount={allVocabulary.length}
                onShowAlert={setAlertConfig}
                onSuccess={() => loadItems()}
              />
            </div>

            <WordGroupList
              curatedLists={curatedLists}
              user={user}
              onSelect={(list) => {
                setViewingWord(null);
                setSelectedCuratedList(list);
              }}
              onViewAll={() => (window.location.href = '/resources?type=vocabulary')}
            />

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

          <div className="hidden lg:flex lg:col-span-4 space-y-6 flex-col" data-oid="wec88t_">
            <VocabularySidebar
              user={user}
              allVocabularyCount={allVocabulary.length}
              isAdding={isAdding}
              onAddWord={hookAddWord}
              onShowAlert={setAlertConfig}
              onSuccess={() => loadItems()}
              onStartSpeedQuiz={startSpeedQuiz}
              onStartMatchPairs={startMatchPairs}
              stats={stats}
            />
          </div>
        </div>

        {isReviewSessionOpen && (
          <Suspense fallback={null}>
            <ReviewSession
              isOpen={isReviewSessionOpen}
              onOpenChange={(open) => !open && closeReviewSession()}
              currentItem={currentReviewItem}
              isFlipped={isFlipped}
              onFlip={flipCard}
              onSubmit={handleReviewSubmit}
              data-oid="61wwuoy"
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

        <Dialog
          open={!!selectedCuratedList}
          onOpenChange={(open) => !open && setSelectedCuratedList(null)}
          data-oid="vf_hnpl"
        >
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none p-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl"
            data-oid="8pmj:55"
          >
            {selectedCuratedList && (
              <VocabularyStudyView
                resource={selectedCuratedList}
                user={user}
                onClose={() => setSelectedCuratedList(null)}
                onAddWord={hookAddWord}
                allVocabulary={allVocabulary}
                data-oid="_kv.uwh"
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
