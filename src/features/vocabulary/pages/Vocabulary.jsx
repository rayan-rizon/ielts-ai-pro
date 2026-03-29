import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VocabularyItem } from '@/entities';
import { supabase } from '@/lib/supabase';

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
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  BookOpen,
  Clock,
  Star,
  MoreVertical,
  Trash2,
  AlertCircle,
  X,
  Languages,
  Zap,
  Lock,
  Plus,
  Check,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Resource } from '@/entities';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import VocabularyList from '@/features/vocabulary/components/VocabularyList';
import ReviewSession from '@/features/vocabulary/components/ReviewSession';
import VocabularyStats from '@/features/vocabulary/components/VocabularyStats';
import ReviewBanner from '@/features/vocabulary/components/ReviewBanner';
import VocabularySidebar from '@/features/vocabulary/components/VocabularySidebar';
import QuickAddCard from '@/features/vocabulary/components/QuickAddCard';
import WordGroupList from '@/features/vocabulary/components/WordGroupList';
import { SpeedQuizModal, MatchPairsModal } from '@/features/vocabulary/components/GameModals';
import {
  translateText,
  SUPPORTED_LANGUAGES,
  saveLanguagePreference,
  getLanguageName,
} from '@/features/vocabulary/services/translateService';
import {
  useVocabularyMutations,
  useReviewSession,
  useSpeedQuiz,
  useMatchPairs,
} from '@/features/vocabulary/hooks';

// SRS algorithm is now handled inside useReviewSession hook

// Vocabulary limits by subscription tier
const VOCABULARY_LIMITS = {
  free: 100,
  pro: 300,
  premium: Infinity,
};

const getWordLimit = (subscriptionTier) => {
  const tier = (subscriptionTier || 'free').toLowerCase();
  return VOCABULARY_LIMITS[tier] || VOCABULARY_LIMITS.free;
};

export default function Vocabulary() {
  const [allVocabulary, setAllVocabulary] = useState([]);
  const [dueForReview, setDueForReview] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [curatedLists, setCuratedLists] = useState([]);

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState({ open: false, title: '', message: '' });

  // Dropdown menu state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Stats are now computed reactively from allVocabulary using useMemo below

  // Stats are now computed reactively from allVocabulary using useMemo below

  const { user } = useAuth();
  const [viewingWord, setViewingWord] = useState(null);
  const allVocabLengthRef = React.useRef(0);

  useEffect(() => {
    allVocabLengthRef.current = allVocabulary.length;
  }, [allVocabulary.length]);

  // Pagination State - now server-side
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Translation State
  const [targetLanguage, setTargetLanguage] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vocabularyTargetLanguage') || 'en';
    }
    return 'en';
  });
  const [translatedWord, setTranslatedWord] = useState('');
  const [translatedDefinition, setTranslatedDefinition] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedCuratedList, setSelectedCuratedList] = useState(null);

  const loadItems = useCallback(async () => {
    if (!user?.id) return;

    // Only show full loading state if we don't have data yet
    // This prevents flickering on silent updates
    setIsLoading((prev) => prev && allVocabLengthRef.current === 0);

    try {
      // Parallel fetch for all required data
      const [curatedRes, vocabularyRes, dueResult] = await Promise.all([
        // 1. Curated Lists
        // Pass includeContent=true (5th parameter) to explicitly fetch the words JSON payload
        Resource.list(
          { content_type: 'vocabulary', is_published: true },
          '-created_at',
          20,
          1,
          true
        ).catch((err) => {
          console.error('Failed to load curated lists:', err);
          return { data: [] };
        }),

        // 2. Vocabulary Items
        VocabularyItem.list(
          { user_id: user.id },
          '-created_at',
          100,
          1,
          ITEMS_PER_PAGE,
          'id, word, definition, example, last_reviewed, next_review_date, mastery_level, created_at'
        ).catch((err) => {
          console.error('Failed to load vocabulary items:', err);
          return { data: [], count: 0 };
        }),

        // 3. Due Items (RPC)
        (async () => {
          try {
            return await supabase.rpc('get_due_vocabulary', {
              p_limit: 50,
            });
          } catch {
            console.warn('[Vocab] RPC unavailable, calculating client-side');
            return { data: null };
          }
        })(),
      ]);

      // Process Curated Lists
      if (curatedRes.data) setCuratedLists(curatedRes.data);

      // Process Vocabulary Items
      let allItems = [];
      if (vocabularyRes.data) {
        allItems = vocabularyRes.data;
        setTotalCount(vocabularyRes.count || vocabularyRes.data.length);
      } else if (Array.isArray(vocabularyRes)) {
        allItems = vocabularyRes;
        setTotalCount(vocabularyRes.length);
      }
      setAllVocabulary(allItems);

      // Process Due Items
      if (dueResult.data && Array.isArray(dueResult.data) && dueResult.data.length > 0) {
        setDueForReview(dueResult.data);
      } else {
        // Fallback: Calculate client-side
        const now = new Date();
        const dueItems = allItems.filter(
          (item) => !item.next_review_date || new Date(item.next_review_date) <= now
        );
        setDueForReview(dueItems);
      }

      setCurrentPage(1);
    } catch (error) {
      console.error('Load items error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Reverted to avoid loop, using ref for length check

  const calculateReviewStreak = useCallback((items) => {
    const reviewDates = [
      ...new Set(
        items
          .filter((item) => item && item.last_reviewed)
          .map((item) => new Date(item.last_reviewed).toDateString())
      ),
    ].sort((a, b) => new Date(b) - new Date(a)); // Sort descending

    if (reviewDates.length === 0) return 0;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let streak = 0;
    // Check if reviewed today
    if (reviewDates[0] === today) {
      streak = 1;
      // Count backwards
      for (let i = 1; i < reviewDates.length; i++) {
        const prevDate = new Date(reviewDates[i - 1]);
        const currDate = new Date(reviewDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 3600 * 24);
        if (diffDays === 1) streak++;
        else break;
      }
    } else if (reviewDates[0] === yesterday) {
      streak = 1; // Streak still alive from yesterday
      for (let i = 1; i < reviewDates.length; i++) {
        const prevDate = new Date(reviewDates[i - 1]);
        const currDate = new Date(reviewDates[i]);
        const diffDays = (prevDate - currDate) / (1000 * 3600 * 24);
        if (diffDays === 1) streak++;
        else break;
      }
    }

    return streak;
  }, []);

  // Memoized stats calculation - reacts to changes in allVocabulary
  const stats = useMemo(() => {
    const masteredWords = allVocabulary.filter((item) => (item.mastery_level || 0) >= 4).length;
    const streak = calculateReviewStreak(allVocabulary);
    const retentionRate =
      allVocabulary.length > 0 ? Math.round((masteredWords / allVocabulary.length) * 100) : 0;

    return {
      totalWords: allVocabulary.length,
      masteredWords,
      streak,
      retention: retentionRate,
    };
  }, [allVocabulary, calculateReviewStreak]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.relative')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Save language preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocabularyTargetLanguage', targetLanguage);
    }
  }, [targetLanguage]);

  // Translate word when viewing or language changes
  useEffect(() => {
    const translateCurrentWord = async () => {
      if (!viewingWord || targetLanguage === 'en') {
        setTranslatedWord('');
        setTranslatedDefinition('');
        return;
      }

      setIsTranslating(true);
      try {
        const [wordTrans, defTrans] = await Promise.all([
          translateText(viewingWord.word, targetLanguage, 'en'),
          translateText(viewingWord.definition || '', targetLanguage, 'en'),
        ]);
        setTranslatedWord(wordTrans);
        setTranslatedDefinition(defTrans);
      } catch (error) {
        console.error('Translation failed:', error);
        setTranslatedWord('');
        setTranslatedDefinition('');
      } finally {
        setIsTranslating(false);
      }
    };

    translateCurrentWord();
  }, [viewingWord, targetLanguage]);

  // ========================================
  // VOCABULARY MUTATIONS HOOK INTEGRATION
  // ========================================
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

  // Wrapper for handleDeleteWord - also updates dueForReview state
  const handleDeleteWord = async (id) => {
    // Save copy for potential rollback of dueForReview
    const previousDueForReview = dueForReview;

    // Optimistically update dueForReview
    setDueForReview((prev) => prev.filter((item) => item.id !== id));

    const result = await hookDeleteWord(id);

    if (!result.success) {
      // Revert dueForReview on failure
      setDueForReview(previousDueForReview);
      alert('Failed to delete word');
    }
  };

  // Wrapper for handleToggleMastery - adds error handling for schema issues
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

  // Wrapper for handleExportWords
  const handleExportWords = () => {
    const result = hookExportWords();
    if (!result.success) {
      alert(result.error || 'No words to export');
    }
    setIsDropdownOpen(false);
  };

  // Wrapper for handleClearAllWords
  const handleClearAllWords = async () => {
    if (!confirm('Are you sure you want to delete all words? This action cannot be undone.')) {
      return;
    }

    const result = await hookClearAllWords();
    if (result.success) {
      setDueForReview([]);
      setIsDropdownOpen(false);
    } else {
      alert('Failed to clear words: ' + (result.error || 'Unknown error'));
    }
  };

  // ========================================
  // REVIEW SESSION HOOK INTEGRATION
  // ========================================
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
  });

  // Wrapper for startReviewSession
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

  // ========================================
  // SPEED QUIZ HOOK INTEGRATION
  // ========================================
  const speedQuiz = useSpeedQuiz({ allVocabulary });

  // Wrapper for startSpeedQuiz - shows alert if not enough words
  const startSpeedQuiz = () => {
    const result = speedQuiz.startSpeedQuiz();
    if (!result.success) {
      setAlertConfig({
        open: true,
        title: 'Not Enough Words',
        message:
          'You need at least 4 words to play Speed Quiz! Add more words to your vocabulary list to unlock this game.',
      });
    }
  };

  // ========================================
  // MATCH PAIRS HOOK INTEGRATION
  // ========================================
  const matchPairs = useMatchPairs({ allVocabulary });

  // Wrapper for startMatchPairs - shows alert if not enough words
  const startMatchPairs = () => {
    const result = matchPairs.startMatchPairs();
    if (!result.success) {
      setAlertConfig({
        open: true,
        title: 'Not Enough Words',
        message: 'You need at least 4 words to play Match Pairs! Add more words to start matching.',
      });
    }
  };

  // Memoized filtered words - filters loaded items by search term
  const filteredWords = useMemo(() => {
    if (!searchTerm) return allVocabulary.filter(Boolean);
    return allVocabulary.filter(
      (item) => item && item.word && item.word.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allVocabulary, searchTerm]);

  // Check if there are more items to load from server
  const hasMoreItems = allVocabulary.length < totalCount;

  // Load more items from server
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreItems) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await VocabularyItem.list(
        { user_id: user?.id },
        '-created_at',
        100,
        nextPage,
        ITEMS_PER_PAGE
      );

      if (result.data && result.data.length > 0) {
        setAllVocabulary((prev) => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreItems, currentPage, user?.id]);

  if (isLoading && !allVocabulary.length) {
    return (
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
  }

  return (
    <div
      className="relative min-h-screen pb-20 bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-hidden"
      data-oid="fzsba6k"
    >
      {/* Premium Dark Mode Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
        data-oid="chnv4zm"
      >
        {/* Soft Indigo/Slate Blobs for depth */}
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

        {/* Dark Mode Specific Center Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 dark:opacity-40 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)]"
          data-oid=":lx4mdl"
        />

        {/* Subtle Mono Mesh Gradient */}
        <div
          className="absolute inset-0 opacity-[0.2] dark:opacity-40 bg-[radial-gradient(at_top_left,rgba(71,85,105,0.05)_0%,transparent_50%),radial-gradient(at_bottom_right,rgba(30,41,59,0.05)_0%,transparent_50%)]"
          data-oid="zzl442g"
        />

        {/* Subtle Grid Pattern */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:48px_48px]"
          data-oid="s7g.tim"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="p-3 sm:p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 relative z-10"
        data-oid="04-8.zd"
      >
        {/* Header Section */}
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

          {/* Prominence Stats Bar */}
          <div className="w-full lg:w-auto flex justify-start lg:justify-end" data-oid="c0vzl5j">
            <VocabularyStats
              stats={stats}
              wordLimit={getWordLimit(user?.subscription_tier)}
              data-oid="nwe16ew"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" data-oid="thpedsw">
          <div className="lg:col-span-8 space-y-8" data-oid="g20156_">
            {/* Active Recall Banner */}
            <ReviewBanner
              dueForReview={dueForReview}
              totalWords={allVocabulary.length}
              onStartReview={startReviewSession}
              data-oid="npauksz"
            />

            {/* Mobile Quick Add (Appears before kits on mobile) */}
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

            {/* Repository Section */}
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
                  <p
                    className="text-xs text-slate-600 dark:text-slate-300 font-medium"
                    data-oid="n_19477"
                  >
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

                  {/* Language Selector */}
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

                    {/* Dropdown Menu */}
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
                              />
                              Export Library
                            </button>
                            <div
                              className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2"
                              data-oid="pzqiqfs"
                            />

                            <button
                              onClick={handleClearAllWords}
                              className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl transition-all flex items-center gap-3 group"
                              data-oid="v1blxrj"
                            >
                              <Trash2
                                className="w-4 h-4 text-red-500 group-hover:animate-bounce"
                                data-oid="5dcxyk0"
                              />
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
          </div>

          {/* Right Column (Sidebar) */}
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

        {/* Review Modal */}
        <ReviewSession
          isOpen={isReviewSessionOpen}
          onOpenChange={(open) => !open && closeReviewSession()}
          currentItem={currentReviewItem}
          isFlipped={isFlipped}
          onFlip={flipCard}
          onSubmit={handleReviewSubmit}
          data-oid="61wwuoy"
        />

        {/* Speed Quiz Modal */}
        <SpeedQuizModal
          isOpen={speedQuiz.isSpeedQuizOpen}
          onClose={speedQuiz.closeGame}
          gameData={speedQuiz.gameData}
          gameState={speedQuiz.gameState}
          gameScore={speedQuiz.gameScore}
          onAnswer={speedQuiz.handleQuizAnswer}
          data-oid="4jcnyai"
        />

        {/* Match Pairs Modal */}
        <MatchPairsModal
          isOpen={matchPairs.isMatchPairsOpen}
          onClose={matchPairs.closeGame}
          gameData={matchPairs.gameData}
          gameState={matchPairs.gameState}
          gameScore={matchPairs.gameScore}
          onCardClick={matchPairs.handleCardClick}
          onRestart={() => {
            matchPairs.closeGame();
            setTimeout(() => startMatchPairs(), 200);
          }}
          data-oid="awuudbs"
        />

        {/* Alert Modal */}
        <Dialog
          open={alertConfig.open}
          onOpenChange={(open) => setAlertConfig((prev) => ({ ...prev, open }))}
          data-oid="i_0c5q6"
        >
          <DialogContent
            className="max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-none shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-3xl p-10 overflow-hidden"
            data-oid="ib78nab"
          >
            {/* Background Glow */}
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
                  {alertConfig.title}
                </DialogTitle>
                <p
                  className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
                  data-oid="vc:nusu"
                >
                  {alertConfig.message}
                </p>
              </div>
              <Button
                className="bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white h-14 rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-[10px] w-full shadow-xl shadow-amber-500/10 active:scale-95 transition-all"
                onClick={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
                data-oid="p7sms.g"
              >
                Verify & Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Word Detail Dialog */}
        <Dialog
          open={!!viewingWord}
          onOpenChange={(open) => !open && setViewingWord(null)}
          data-oid=".dg5vna"
        >
          <DialogContent
            hideClose
            className="max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-none shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-0 overflow-hidden rounded-3xl"
            data-oid="t8t277p"
          >
            <DialogClose
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-all text-white/80 hover:text-white backdrop-blur-md z-[60] ring-1 ring-white/20"
              data-oid="300yw7t"
            >
              <X className="w-5 h-5" data-oid="ajvd.uo" />
              <span className="sr-only" data-oid="d3jqqib">
                Close
              </span>
            </DialogClose>
            {viewingWord && (
              <div className="flex flex-col italic" data-oid="fl2_w67">
                {/* Header with Title & Source */}
                <div
                  className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-8 pb-8 pt-14 pr-16 text-white relative group overflow-hidden"
                  data-oid="g5_6781"
                >
                  <div
                    className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"
                    data-oid="17yfw:k"
                  ></div>
                  <div
                    className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000"
                    data-oid=".-3y.tf"
                  >
                    <BookOpen className="w-32 h-32" data-oid="hybtvfg" />
                  </div>

                  <div className="relative z-10 space-y-3 max-w-[85%]" data-oid="cu4_dnd">
                    <div className="flex flex-wrap items-center gap-2" data-oid="5gv7t6f">
                      <Badge
                        className="bg-white/20 hover:bg-white/30 text-white border-white/10 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm"
                        data-oid="b3pleh8"
                      >
                        {viewingWord.source || 'Manual Record'}
                      </Badge>
                      {(viewingWord.mastery_level || 0) >= 4 && (
                        <Badge
                          className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm"
                          data-oid="rp0rp4d"
                        >
                          <Star className="w-3 h-3 fill-current" data-oid="g-yso:x" /> Mastery
                          Reached
                        </Badge>
                      )}
                    </div>
                    <h2
                      className="text-4xl font-black tracking-tighter drop-shadow-lg"
                      data-oid="r22zj8:"
                    >
                      {viewingWord.word}
                    </h2>
                    <div
                      className="flex items-center gap-6 text-[10px] text-white/70 font-black uppercase tracking-widest pt-2"
                      data-oid="bu72mu7"
                    >
                      <div className="flex items-center gap-2" data-oid="vmqlf8t">
                        <Clock className="w-3.5 h-3.5" data-oid="fwrhin:" /> Reviewed:{' '}
                        <span className="text-white" data-oid="hf6b89i">
                          {viewingWord.times_reviewed || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-2" data-oid="wn9xbds">
                        <Brain className="w-3.5 h-3.5" data-oid="i5e:ckg" /> Retention:{' '}
                        <span className="text-white" data-oid="5p:vn7g">
                          88%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-8 space-y-6" data-oid="wof-yw3">
                  {/* Language Selector */}
                  <div className="flex items-center justify-between" data-oid="e-hn8l0">
                    <h3
                      className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
                      data-oid="f6a9bo2"
                    >
                      <Languages className="w-4 h-4" data-oid="yfc6vb9" />
                      Translate to
                    </h3>
                    <Select
                      value={targetLanguage}
                      onValueChange={setTargetLanguage}
                      data-oid="yf27:l."
                    >
                      <SelectTrigger
                        className="w-[160px] h-9 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-sm font-bold"
                        data-oid="qx1qi5b"
                      >
                        <SelectValue placeholder="Select language" data-oid="0lghnaa" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl" data-oid="-5ul3ar">
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem
                            key={lang.code}
                            value={lang.code}
                            className="font-medium"
                            data-oid="ddqr1-p"
                          >
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Definition Section */}
                  <div className="space-y-3" data-oid="khy24rs">
                    <h3
                      className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
                      data-oid="dxt33y5"
                    >
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full" data-oid="vb.t8cj" />
                      Definition
                    </h3>
                    <p
                      className="text-xl text-slate-800 dark:text-slate-200 leading-snug font-serif italic border-l-4 border-indigo-500/20 pl-5 py-1"
                      data-oid="rf7dm40"
                    >
                      {viewingWord.definition || 'Definition unavailable.'}
                    </p>

                    {/* Translation Display */}
                    {targetLanguage !== 'en' && (
                      <div
                        className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/30"
                        data-oid="q7llcyv"
                      >
                        <div className="flex items-center gap-2 mb-2" data-oid="s20e-g1">
                          <Languages className="w-3.5 h-3.5 text-indigo-500" data-oid=".3.0p_m" />
                          <span
                            className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
                            data-oid="i9--.t6"
                          >
                            {getLanguageName(targetLanguage)} Translation
                          </span>
                          {isTranslating && (
                            <span
                              className="text-[9px] text-slate-400 animate-pulse"
                              data-oid="ao04sru"
                            >
                              Translating...
                            </span>
                          )}
                        </div>
                        {translatedWord && (
                          <p
                            className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-1"
                            data-oid="yanawqo"
                          >
                            {translatedWord}
                          </p>
                        )}
                        {translatedDefinition && (
                          <p
                            className="text-base text-slate-700 dark:text-slate-300 italic"
                            data-oid="3c_9s90"
                          >
                            {translatedDefinition}
                          </p>
                        )}
                        {!isTranslating && !translatedWord && !translatedDefinition && (
                          <p className="text-sm text-slate-500 italic" data-oid="ttgvuv7">
                            Translation unavailable
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Example Section */}
                  {(viewingWord.example || viewingWord.example_sentence) && (
                    <div className="space-y-4" data-oid="jyvsw0v">
                      <h3
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3"
                        data-oid="i41nev."
                      >
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full" data-oid="-d4zblp" />
                        Example
                      </h3>
                      <div
                        className="bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden group/context"
                        data-oid=":h.5sej"
                      >
                        <div
                          className="absolute top-0 right-0 p-4 opacity-5 group-hover/context:scale-110 transition-transform"
                          data-oid="qiygw_o"
                        >
                          <Zap className="w-12 h-12" data-oid="fb773-2" />
                        </div>
                        <p
                          className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed italic font-serif relative z-10"
                          data-oid="in1n94h"
                        >
                          "{viewingWord.example || viewingWord.example_sentence}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Operational Controls */}
                  <div
                    className="pt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5"
                    data-oid="hyg27po"
                  >
                    <Button
                      variant="ghost"
                      className="h-12 px-6 rounded-xl text-red-500 hover:bg-red-500/5 font-black uppercase tracking-widest text-[9px] group transition-all"
                      onClick={() => {
                        handleDeleteWord(viewingWord.id);
                        setViewingWord(null);
                      }}
                      data-oid="r01932v"
                    >
                      <Trash2
                        className="w-4 h-4 mr-3 group-hover:animate-bounce"
                        data-oid=":9wqekp"
                      />{' '}
                      Purge Entry
                    </Button>
                    <Button
                      type="button"
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-10 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
                      onClick={(e) => {
                        e.preventDefault();
                        setViewingWord(null);
                      }}
                      data-oid="rv0h_zf"
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Curated List Study Dialog */}
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

// Sub-component for structured study view of curated lists
const VocabularyStudyView = ({ resource, user, onAddWord, allVocabulary }) => {
  const words = JSON.parse(resource.content || '[]');
  const [addingWords, setAddingWords] = useState(new Set());

  const hasAccess = () => {
    if (resource.access_tier === 'free') return true;
    if (!user) return false;
    const tiers = { free: 0, pro: 1, premium: 2 };
    return tiers[user.subscription_tier || 'free'] >= tiers[resource.access_tier];
  };

  if (!hasAccess()) {
    return (
      <div className="p-8 sm:p-10 text-center space-y-6 max-w-lg mx-auto" data-oid="eg00wqs">
        <div
          className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-indigo-500/5"
          data-oid="zjcbk-c"
        >
          <Lock className="w-8 h-8 text-indigo-500" data-oid="b4ux9gm" />
        </div>
        <div className="space-y-2" data-oid="lv6dcn.">
          <h2
            className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight"
            data-oid="ar26jf."
          >
            Premium Content
          </h2>
          <p
            className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[280px] mx-auto"
            data-oid="5k46c88"
          >
            This {resource.access_tier} vocabulary list is locked. Upgrade your plan to access this
            and {resource.access_tier === 'pro' ? 'hundreds' : 'thousands'} of other curated
            materials.
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = '/pricing')}
          className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs"
          data-oid="t8.uvue"
        >
          View Pricing Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" data-oid="qb8im7q">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md p-6 border-b border-slate-100 dark:border-white/5"
        data-oid="smfe2e:"
      >
        <div className="flex justify-between items-start gap-6" data-oid="gn1hpje">
          <div className="space-y-1" data-oid="s79si9e">
            <Badge
              className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2"
              data-oid="bxwb_l4"
            >
              IELTS Vocabulary List
            </Badge>
            <h2
              className="text-2xl font-black text-slate-900 dark:text-white italic"
              data-oid="7ork.gw"
            >
              {resource.title}
            </h2>
            <p
              className="text-slate-500 dark:text-slate-400 font-medium text-xs"
              data-oid="xrt14_x"
            >
              {resource.description}
            </p>
          </div>
        </div>
      </div>

      {/* Word List */}
      <div className="p-6 md:p-8 space-y-4" data-oid="qo992m5">
        {words.map((item, i) => {
          const isAdded = allVocabulary?.some(
            (v) => v?.word?.toLowerCase() === item?.word?.toLowerCase()
          );
          const isAdding = addingWords.has(item.word);

          const handleAdd = async (e) => {
            e.stopPropagation();
            if (isAdded || isAdding) return;
            setAddingWords((prev) => new Set(prev).add(item.word));
            await onAddWord({
              word: item.word,
              definition: item.definition,
              example: item.example,
            });
          };

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all duration-300 relative"
              data-oid="ofv2gmw"
            >
              <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8"
                data-oid="_88eofd"
              >
                {/* Word & Definition */}
                <div className="space-y-1.5 md:w-5/12 flex-shrink-0" data-oid="atlde:s">
                  <h4
                    className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
                    data-oid="4l9ycln"
                  >
                    {item.word}
                  </h4>
                  <p
                    className="text-[14px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed"
                    data-oid="yog-thg"
                  >
                    {item.definition}
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="md:w-[2px] md:h-12 bg-slate-100 dark:bg-white/10 hidden md:block rounded-full"
                  data-oid="0jx.ygt"
                />

                {/* Example Sentence */}
                <div className="flex-1 md:w-5/12" data-oid="blsw1v7">
                  <p
                    className="text-[13px] text-slate-500 dark:text-slate-400 italic leading-relaxed"
                    data-oid="-euq59w"
                  >
                    &quot;{item.example}&quot;
                  </p>
                </div>

                {/* Action Button */}
                <div className="md:w-1/12 flex justify-end mt-4 md:mt-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isAdded || isAdding}
                    onClick={handleAdd}
                    className={cn(
                      'h-10 w-10 shrink-0 rounded-full transition-all duration-300',
                      isAdded
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 opacity-100'
                        : 'hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 text-slate-400'
                    )}
                    title={isAdded ? 'Already in your library' : 'Add to my library'}
                  >
                    {isAdded ? (
                      <Check className="w-5 h-5" />
                    ) : isAdding ? (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Helper component for icon
