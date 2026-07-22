import React from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Brain, Crown, BarChart3, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import ConfettiCelebration from '@/components/ConfettiCelebration';

// Tab components
import { OverviewTab } from './test-results-modal/OverviewTab';
import { DetailedAnalysisTab } from './test-results-modal/DetailedAnalysisTab';
import { normalizeTestResults } from './test-results-modal/normalizeTestResults';

function getAssessmentMessage(score) {
  if (score >= 8.5) return 'Unstoppable! You are mastering this exam.';
  if (score >= 7.5) return 'Fantastic work! You are well on your way.';
  if (score >= 6.5) return 'Good job! Keep pushing to reach the top.';
  if (score >= 5.5) return 'Solid effort. Focus on your weak spots to improve.';
  return 'Keep practicing. Consistency is key to improvement.';
}

function calculateCelebrationParams(score) {
  if (score >= 8.0) return { count: 150, theme: 'gold' };
  if (score >= 7.0) return { count: 100, theme: 'default' };
  if (score >= 6.0) return { count: 60, theme: 'default' };
  if (score >= 5.0) return { count: 40, theme: 'silver' };
  if (score >= 4.0) return { count: 25, theme: 'bronze' };
  return { count: 0, theme: 'default' };
}

const ModalFooter = ({ isPremium, handleUpgrade, onReviewAnswers, onClose }) => (
  <div className="px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-50">
    <div className="flex items-center gap-3">
      {!isPremium ? (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleUpgrade}>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400 leading-tight">
              Pro Analysis
            </p>
            <p className="text-[10px] font-semibold text-slate-500 leading-tight">
              Unlock all insights
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 leading-tight">
              Premium Active
            </p>
            <p className="text-[10px] font-semibold text-slate-500 leading-tight">
              Full analysis visible
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="flex items-center gap-2.5 w-full sm:w-auto">
      <Button
        onClick={onReviewAnswers}
        className="flex-1 sm:min-w-[180px] h-9 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-500/20"
      >
        Review Mistakes
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:min-w-[130px] h-9 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
      >
        Close
      </Button>
    </div>
  </div>
);

const ModalHeader = ({ testType, children }) => (
  <header className="px-4 sm:px-5 pr-14 py-2.5 min-h-[62px] flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center gap-2.5 shrink-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/50 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <BookOpen className="w-4 h-4" />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight truncate"
      >
        IELTS {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Result
      </motion.h2>
    </div>
    {children}
    <div className="hidden md:block" aria-hidden="true" />
  </header>
);

const TabsNav = () => (
  <div className="w-full md:w-[360px] shrink-0 z-10">
    <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
      <TabsTrigger
        value="overview"
        className="gap-2 h-8 px-3 text-xs font-bold rounded-lg transition-all text-slate-500 data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
      >
        <BarChart3 className="w-4 h-4" />
        Overview
      </TabsTrigger>
      <TabsTrigger
        value="analysis"
        className="gap-2 h-8 px-3 text-xs font-bold rounded-lg transition-all text-slate-500 data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-950 data-[state=active]:shadow-sm"
      >
        <Brain className="w-4 h-4" />
        Deep Analysis
      </TabsTrigger>
    </TabsList>
  </div>
);

// Main TestResultsModal component
function useCelebration(showResults, testResults, celebrate) {
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [particleCount, setParticleCount] = React.useState(0);
  const [celebrationTheme, setCelebrationTheme] = React.useState('default');

  React.useEffect(() => {
    if (celebrate && showResults && testResults?.bandScore) {
      const score = parseFloat(testResults.bandScore);
      const { count, theme } = calculateCelebrationParams(score);
      if (count > 0) {
        setParticleCount(count);
        setCelebrationTheme(theme);
        setShowCelebration(true);
      }
    }
  }, [celebrate, showResults, testResults]);

  return { showCelebration, particleCount, celebrationTheme, setShowCelebration };
}

function checkIsPremium(user, isAdmin) {
  const subscriptionTier = (user?.subscription_tier || 'free').toLowerCase();
  return subscriptionTier === 'premium' || subscriptionTier === 'pro' || isAdmin;
}

// Helper component to display inner modal content to keep complexity low
const ModalContent = React.memo(
  ({
    testResults,
    isPremium,
    testType,
    activeTab,
    setActiveTab,
    handleUpgrade,
    onReviewAnswers,
    onNavigateToQuestion,
    onClose,
  }) => (
    <motion.div
      initial={{ scale: 0.96, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.96, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[22px] shadow-2xl w-full max-w-[1480px] max-h-[96vh] flex flex-col overflow-hidden"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-3 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-950 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm h-8 w-8"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="relative flex-1 overflow-hidden bg-[#f6f8fc] dark:bg-[#0B1120] flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <ModalHeader testType={testType}>
            <TabsNav />
          </ModalHeader>

          <div key={activeTab} className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <TabsContent value="overview" forceMount className="m-0 focus-visible:outline-none">
                  <OverviewTab
                    testResults={testResults}
                    isLocked={!isPremium}
                    onUpgrade={handleUpgrade}
                    getAssessmentMessage={getAssessmentMessage}
                    onReviewAnswers={onReviewAnswers}
                    onNavigateToQuestion={onNavigateToQuestion}
                    testType={testType}
                  />
                </TabsContent>
              )}
              {activeTab === 'analysis' && (
                <TabsContent value="analysis" forceMount className="m-0 focus-visible:outline-none">
                  <DetailedAnalysisTab
                    testResults={testResults}
                    isLocked={!isPremium}
                    onUpgrade={handleUpgrade}
                    isPremium={isPremium}
                    testType={testType}
                    totalTimeSeconds={
                      testResults?.timeMetrics?.totalTimeSpent ||
                      testResults?.durationMinutes * 60 ||
                      0
                    }
                  />
                </TabsContent>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      <ModalFooter
        isPremium={isPremium}
        handleUpgrade={handleUpgrade}
        onReviewAnswers={onReviewAnswers}
        onClose={onClose}
      />
    </motion.div>
  )
);

ModalContent.displayName = 'ModalContent';

export default function TestResultsModal({
  showResults,
  testResults,
  _testData,
  _earnedXP,
  user,
  onClose,
  onReviewAnswers,
  onNavigateToQuestion,
  testType = 'reading', // 'reading' or 'listening'
  celebrate = true,
  _dashboardUrl = '/dashboard',
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const normalizedResults = React.useMemo(
    () => normalizeTestResults(testResults, testType),
    [testResults, testType]
  );

  const isPremium = checkIsPremium(user, isAdmin);

  const handleUpgrade = React.useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  const { showCelebration, particleCount, celebrationTheme, setShowCelebration } = useCelebration(
    showResults,
    normalizedResults,
    celebrate
  );

  if (!showResults || !normalizedResults) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto"
      >
        <ConfettiCelebration
          show={showCelebration}
          particleCount={particleCount}
          theme={celebrationTheme}
          onComplete={() => setShowCelebration(false)}
        />

        <ModalContent
          testResults={normalizedResults}
          isPremium={isPremium}
          testType={testType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleUpgrade={handleUpgrade}
          onReviewAnswers={onReviewAnswers}
          onNavigateToQuestion={onNavigateToQuestion}
          onClose={onClose}
        />
      </motion.div>
    </AnimatePresence>
  );
}
