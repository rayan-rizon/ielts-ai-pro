import React from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Brain,
  Crown,
  BarChart3,
  Sparkles,
  BookOpen,
  Download,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

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

const ModalFooter = ({
  isPremium,
  handleUpgrade,
  onReviewAnswers,
  onClose,
  onDownloadPdf,
  isDownloadingPdf,
}) => (
  <div className="px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-50">
    <div className="flex items-center gap-3">
      {!isPremium ? (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleUpgrade}>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
            <Crown className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 leading-tight">
              Pro Analysis
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Unlock all insights
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight">
              Premium Active
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
              Full analysis visible
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="flex items-center gap-2.5 w-full sm:w-auto">
      <Button
        variant="outline"
        onClick={onDownloadPdf}
        disabled={isDownloadingPdf}
        className="flex-1 sm:flex-none h-9 rounded-xl font-bold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
      >
        {isDownloadingPdf ? (
          <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isDownloadingPdf ? 'Preparing...' : 'Download PDF'}
      </Button>
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

const ModalHeader = ({ testType, testMode, children }) => (
  <header className="px-4 sm:px-5 pr-14 py-2.5 min-h-[62px] flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center gap-2.5 shrink-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 dark:bg-blue-950/50 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <motion.h2
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="truncate text-base font-black tracking-tight text-slate-950 dark:text-white sm:text-lg"
        >
          IELTS {testType.charAt(0).toUpperCase() + testType.slice(1)} Test Result
        </motion.h2>
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
          {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
        </p>
      </div>
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
    testData,
    userId,
    sessionId,
    targetBand,
    isPremium,
    testType,
    testMode,
    activeTab,
    setActiveTab,
    handleUpgrade,
    onReviewAnswers,
    onNavigateToQuestion,
    onReviewQuestion,
    onClose,
    onDownloadPdf,
    isDownloadingPdf,
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
          <ModalHeader testType={testType} testMode={testMode}>
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
                    testData={testData}
                    userId={userId}
                    sessionId={sessionId}
                    targetBand={targetBand}
                    onUpgrade={handleUpgrade}
                    isPremium={isPremium}
                    testType={testType}
                    onReviewQuestion={onReviewQuestion}
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
        onDownloadPdf={onDownloadPdf}
        isDownloadingPdf={isDownloadingPdf}
      />
    </motion.div>
  )
);

ModalContent.displayName = 'ModalContent';

export default function TestResultsModal({
  showResults,
  testResults,
  testData,
  sessionId,
  _earnedXP,
  user,
  onClose,
  onReviewAnswers,
  onNavigateToQuestion,
  testType = 'reading', // 'reading' or 'listening'
  testMode = 'practice',
  celebrate = true,
  _dashboardUrl = '/dashboard',
}) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const normalizedResults = React.useMemo(
    () => normalizeTestResults(testResults, testType),
    [testResults, testType]
  );

  const isPremium = checkIsPremium(user, isAdmin);

  const handleUpgrade = React.useCallback(() => {
    navigate('/pricing');
  }, [navigate]);

  const handleReviewQuestion = React.useCallback(
    (questionNumber) => {
      onClose?.();
      if (onNavigateToQuestion) {
        onNavigateToQuestion(questionNumber);
      } else {
        onReviewAnswers?.();
      }
    },
    [onClose, onNavigateToQuestion, onReviewAnswers]
  );

  const handleDownloadPdf = React.useCallback(async () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      const { downloadTestResultPdf } = await import('./test-results-modal/testResultPdf');
      downloadTestResultPdf({
        testResults: normalizedResults,
        testType,
        testTitle: testData?.title || testData?.name,
      });
      toast.success('Test result downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Could not download the PDF', { description: 'Please try again in a moment.' });
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [isDownloadingPdf, normalizedResults, testData, testType]);

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
          testData={testData}
          userId={user?.id}
          sessionId={sessionId}
          targetBand={user?.target_band_score}
          isPremium={isPremium}
          testType={testType}
          testMode={testMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleUpgrade={handleUpgrade}
          onReviewAnswers={onReviewAnswers}
          onNavigateToQuestion={onNavigateToQuestion}
          onReviewQuestion={handleReviewQuestion}
          onClose={onClose}
          onDownloadPdf={handleDownloadPdf}
          isDownloadingPdf={isDownloadingPdf}
        />
      </motion.div>
    </AnimatePresence>
  );
}
