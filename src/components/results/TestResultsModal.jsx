import React from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Brain, Crown, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import ConfettiCelebration from '@/components/ConfettiCelebration';

// Tab components
import { OverviewTab } from './test-results-modal/OverviewTab';
import { DetailedAnalysisTab } from './test-results-modal/DetailedAnalysisTab';

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
  <div className="p-3 lg:p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-50">
    <div className="flex items-center gap-3">
      {!isPremium ? (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleUpgrade}>
          <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 leading-tight">
              Pro Analysis
            </p>
            <p className="text-xs font-bold text-slate-500 leading-tight">Unlock all insights</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 leading-tight">
              Premium Active
            </p>
            <p className="text-xs font-bold text-slate-500 leading-tight">Full analysis visible</p>
          </div>
        </div>
      )}
    </div>

    <div className="flex items-center gap-4 w-full sm:w-auto">
      <Button
        onClick={onReviewAnswers}
        className="flex-1 sm:min-w-[200px] h-11 rounded-xl font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20"
      >
        Review Mistakes
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:min-w-[160px] h-11 rounded-xl font-black text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
      >
        Close
      </Button>
    </div>
  </div>
);

const ModalHeader = ({ testType }) => (
  <div className="p-5 lg:p-6 pb-2 flex flex-col items-center text-center relative gap-2 shrink-0 z-10 bg-white/50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
    <motion.h2
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-xl font-black text-slate-800 dark:text-white tracking-tight"
    >
      IELTS {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Result
    </motion.h2>
  </div>
);

const TabsNav = () => (
  <div className="px-4 lg:px-6 pb-3 bg-white/50 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-10 flex justify-center">
    <TabsList className="grid w-full max-w-sm grid-cols-2 h-12 p-1 bg-slate-100/50 dark:bg-slate-900/50">
      <TabsTrigger
        value="overview"
        className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-blue-500/25"
      >
        <BarChart3 className="w-4 h-4" />
        Overview
      </TabsTrigger>
      <TabsTrigger
        value="analysis"
        className="gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-indigo-500/25"
      >
        <Brain className="w-4 h-4" />
        Deep Analysis
      </TabsTrigger>
    </TabsList>
  </div>
);

// Main TestResultsModal component
function useCelebration(showResults, testResults) {
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [particleCount, setParticleCount] = React.useState(0);
  const [celebrationTheme, setCelebrationTheme] = React.useState('default');

  React.useEffect(() => {
    if (showResults && testResults?.bandScore) {
      const score = parseFloat(testResults.bandScore);
      const { count, theme } = calculateCelebrationParams(score);
      if (count > 0) {
        setParticleCount(count);
        setCelebrationTheme(theme);
        setShowCelebration(true);
      }
    }
  }, [showResults, testResults]);

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
    onClose,
  }) => (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 30 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="relative bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden"
    >
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-blue-50/50 via-purple-50/30 to-transparent dark:from-blue-900/10 dark:via-purple-900/5 dark:to-transparent pointer-events-none" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-rose-500 hover:border-rose-500 rounded-full transition-all duration-300 hover:scale-105 shadow-lg h-10 w-10"
      >
        <X className="w-5 h-5" />
      </Button>

      <div className="relative flex-1 overflow-hidden bg-slate-50/50 dark:bg-[#0B1120] flex flex-col">
        <ModalHeader testType={testType} />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsNav />

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <TabsContent value="overview" forceMount className="m-0 focus-visible:outline-none">
                  <OverviewTab
                    testResults={testResults}
                    isLocked={!isPremium}
                    onUpgrade={handleUpgrade}
                    getAssessmentMessage={getAssessmentMessage}
                    onReviewAnswers={onReviewAnswers}
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
  testType = 'reading', // 'reading' or 'listening'
  _dashboardUrl = '/dashboard',
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');

  const isPremium = checkIsPremium(user, isAdmin);

  const handleUpgrade = React.useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  const { showCelebration, particleCount, celebrationTheme, setShowCelebration } = useCelebration(
    showResults,
    testResults
  );

  if (!showResults || !testResults) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <ConfettiCelebration
          show={showCelebration}
          particleCount={particleCount}
          theme={celebrationTheme}
          onComplete={() => setShowCelebration(false)}
        />

        <ModalContent
          testResults={testResults}
          isPremium={isPremium}
          testType={testType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleUpgrade={handleUpgrade}
          onReviewAnswers={onReviewAnswers}
          onClose={onClose}
        />
      </motion.div>
    </AnimatePresence>
  );
}
