import React from 'react';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

import ConfettiCelebration from '@/components/ConfettiCelebration';

// Tab components
import { OverviewTab } from './test-results-modal/OverviewTab';
import { DetailedAnalysisTab } from './test-results-modal/DetailedAnalysisTab';
import { normalizeTestResults } from './test-results-modal/normalizeTestResults';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';

function getAssessmentMessage(score) {
  if (score >= 8.5) return 'Unstoppable! You are mastering this exam.';
  if (score >= 7.5) return 'Fantastic work! You are well on your way.';
  if (score >= 6.5) return 'Good job! Keep pushing to reach the top.';
  if (score >= 5.5) return 'Solid effort. Focus on your weak spots to improve.';
  return 'Keep practicing. Consistency is key to improvement.';
}

function calculateCelebrationParams(score) {
  if (score >= 8.0) return { count: 110, theme: 'gold' };
  if (score >= 7.0) return { count: 78, theme: 'default' };
  if (score >= 6.0) return { count: 54, theme: 'default' };
  if (score >= 5.0) return { count: 36, theme: 'silver' };
  if (score >= 4.0) return { count: 24, theme: 'bronze' };
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
  <div className="px-4 sm:px-5 py-2.5 bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] border-t border-[#e4e2f0] dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-2.5 z-50">
    <div className="flex items-center gap-3">
      {!isPremium ? (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleUpgrade}>
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform border border-amber-200/60">
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
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 border border-emerald-200/60">
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
        className="flex-1 sm:flex-none h-9 rounded-xl font-bold text-xs border-[#e4e2f0] dark:border-white/[0.07] bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-white transition-all shadow-2xs"
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
        className="flex-1 sm:min-w-[180px] h-9 rounded-xl font-bold text-xs bg-[#5a63df] text-white hover:bg-[#4a52c9] active:scale-[0.98] transition-all shadow-xs"
      >
        Review Mistakes
      </Button>
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:min-w-[130px] h-9 rounded-xl font-bold text-xs border-[#e4e2f0] dark:border-white/[0.07] bg-white/90 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-white transition-all shadow-2xs"
      >
        Close
      </Button>
    </div>
  </div>
);

const ModalHeader = ({ testType, testMode, children }) => (
  <header className="px-4 sm:px-5 pr-14 py-2.5 min-h-[62px] flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center gap-2.5 shrink-0 z-10 bg-gradient-to-b from-white to-[#faf9ff] dark:from-[#131315] dark:to-[#131315] border-b border-[#e4e2f0] dark:border-white/[0.07]">
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-[#5a63df]/10 border border-[#5a63df]/20 dark:bg-[#5a63df]/20 dark:border-[#5a63df]/30 text-[#5a63df] dark:text-[#a9afff] flex items-center justify-center shrink-0 shadow-2xs">
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
        <p className="text-[9px] font-black uppercase tracking-wider text-[#5a63df] dark:text-[#a9afff]">
          {testMode === 'exam' ? 'Exam Mode' : 'Practice Mode'}
        </p>
      </div>
    </div>
    {children}
    <div className="hidden md:block" aria-hidden="true" />
  </header>
);

const TabsNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'analysis', label: 'Deep Analysis', icon: Brain },
  ];

  return (
    <div className="w-full md:w-[340px] shrink-0 z-10">
      <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-[#f4f3fb] dark:bg-white/[0.04] border border-[#e4e2f0] dark:border-white/[0.07] rounded-xl shadow-2xs relative">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.value;
          return (
            <TabsTrigger
              key={t.value}
              value={t.value}
              onClick={() => setActiveTab?.(t.value)}
              className={cn(
                'relative flex items-center justify-center gap-2 h-8 px-3 text-xs rounded-lg transition-colors z-10 cursor-pointer select-none font-bold',
                isActive
                  ? 'text-white font-extrabold data-[state=active]:bg-transparent data-[state=active]:text-white shadow-none'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeModalTabIndicator"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-[#5a63df] rounded-lg shadow-xs -z-10"
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
};

// Main TestResultsModal component
function useCelebration(showResults, testResults, celebrate) {
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [particleCount, setParticleCount] = React.useState(0);
  const [celebrationTheme, setCelebrationTheme] = React.useState('default');
  const hasCelebrated = React.useRef(false);
  const score = Number.parseFloat(testResults?.bandScore);

  React.useEffect(() => {
    if (!showResults) {
      hasCelebrated.current = false;
      setShowCelebration(false);
      return;
    }

    if (!celebrate || hasCelebrated.current || !Number.isFinite(score)) return;

    hasCelebrated.current = true;
    const { count, theme } = calculateCelebrationParams(score);
    if (count > 0) {
      setParticleCount(count);
      setCelebrationTheme(theme);
      setShowCelebration(true);
    }
  }, [celebrate, score, showResults]);

  return { showCelebration, particleCount, celebrationTheme, setShowCelebration };
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
    // The app has no global TooltipProvider (the dashboard mounts its own), so
    // the modal supplies one — the panel primitives used inside render Radix
    // tooltips for their metric explainers and throw without it.
    <TooltipProvider delayDuration={150}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative bg-white dark:bg-slate-950 border border-[#e4e2f0] dark:border-white/[0.07] rounded-[22px] shadow-lg w-full max-w-[1480px] max-h-[96vh] flex flex-col overflow-hidden"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-4 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-950 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors shadow-sm h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="relative flex-1 overflow-hidden bg-[#f8f8fb] dark:bg-[#08080a] flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ModalHeader testType={testType} testMode={testMode}>
              <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
            </ModalHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <TabsContent
                    value="overview"
                    forceMount
                    className="m-0 focus-visible:outline-none"
                  >
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
                  <TabsContent
                    value="analysis"
                    forceMount
                    className="m-0 focus-visible:outline-none"
                  >
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
    </TooltipProvider>
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
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const normalizedResults = React.useMemo(
    () => normalizeTestResults(testResults, testType),
    [testResults, testType]
  );

  const isPremium = hasPaidAccess(user);

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
