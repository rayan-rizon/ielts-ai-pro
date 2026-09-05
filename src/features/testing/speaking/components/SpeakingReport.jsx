import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Download, GraduationCap, Home, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import SpeakingAnalysis from './SpeakingAnalysis';
import XPNotification from '@/components/XPNotification';
import { callEdgeFunction } from '@/utils/api';

import SpeakingReportErrorState from './SpeakingReportErrorState';
import SpeakingReportSummary from './SpeakingReportSummary';
import SpeakingReportDeepDive from './SpeakingReportDeepDive';
import usePronunciationBreakdown from '../hooks/usePronunciationBreakdown';
import { HeaderWaveBackground, SpeechBubbleGraphic } from './SpeakingReportHeaderGraphic';

export default function SpeakingReport({
  finalEvaluation,
  isEvaluating,
  evaluationError,
  onRetryEvaluation,
  showConfetti,
  onConfettiComplete,
  showXPNotification,
  earnedXP,
  onXPComplete,
  testTitle,
  testDate,
  testId,
  allPartsConversation,
  allPartsPronunciation,
  detailedFeedback,
  isGeneratingDetailed: isGeneratingDetailedProp,
  deepDiveError,
  onRetryDeepDive,
  loadingMessage,
}) {
  const { width, height } = useWindowSize();
  const [isGeneratingDetailedLocal, setIsGeneratingDetailedLocal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const isGeneratingDetailed = isGeneratingDetailedProp ?? isGeneratingDetailedLocal;
  const pronunciationBreakdown = usePronunciationBreakdown(allPartsPronunciation);
  const reportDate = new Date(testDate || finalEvaluation?.generatedAt || NaN);
  const testDateFormatted = Number.isNaN(reportDate.getTime())
    ? 'Unavailable'
    : reportDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  const handleGenerateDetailed = async () => {
    if (!testId || !allPartsConversation) {
      toast.error('Missing transcript data');
      return;
    }

    setIsGeneratingDetailedLocal(true);
    try {
      const response = await callEdgeFunction('generateDetailedSpeakingFeedback', {
        testId,
        allPartsConversation,
      });
      if (response.success && response.detailedAnalysis) {
        toast.success('Detailed feedback generated!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate deep dive analysis', {
        description: 'Please try again later.',
      });
    } finally {
      setIsGeneratingDetailedLocal(false);
    }
  };

  const handleRetryDeepDive = onRetryDeepDive || handleGenerateDetailed;

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    try {
      const { downloadSpeakingReportPdf } = await import('../utils/speakingReportPdf');
      downloadSpeakingReportPdf({ finalEvaluation, testTitle });
      toast.success('Speaking report downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Could not download the PDF', {
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isEvaluating) {
    return <SpeakingAnalysis loadingMessage={loadingMessage} />;
  }

  if (evaluationError) {
    return (
      <SpeakingReportErrorState
        evaluationError={evaluationError}
        onRetryEvaluation={onRetryEvaluation}
      />
    );
  }

  if (!finalEvaluation) return null;

  return (
    <div
      data-testid="speaking-report-scroll"
      className="custom-scrollbar relative isolate h-full min-h-0 overflow-y-auto overscroll-contain bg-[#f8f8fb] px-3 py-3 dark:bg-[#08080a] sm:px-4 sm:py-4 lg:px-5 lg:py-5"
    >
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={200}
          recycle={false}
          onConfettiComplete={onConfettiComplete}
          colors={['#e11d48', '#fb7185', '#f43f5e', '#ffffff']}
          style={{ pointerEvents: 'none', zIndex: 200 }}
        />
      )}

      <XPNotification
        show={showXPNotification}
        xp={earnedXP?.xp || 0}
        bonus={earnedXP?.bonus || 0}
        streak={earnedXP?.streak || 0}
        onComplete={onXPComplete}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        key="report"
        className="relative mx-auto w-full max-w-[1280px]"
      >
        <section className="overflow-hidden rounded-xl border border-[#e4e2f0] bg-white shadow-lg shadow-rose-950/5 dark:border-white/10 dark:bg-[#131315]">
          {/* Header Banner */}
          <header className="relative overflow-hidden bg-linear-to-r/srgb from-rose-500 via-rose-500 to-rose-600 px-4 pb-4 pt-3 text-white sm:px-6 sm:pb-5 lg:px-7 lg:pb-5 lg:pt-4">
            <HeaderWaveBackground />

            <div className="relative mb-2.5 flex items-center justify-between gap-4">
              <Button
                asChild
                variant="ghost"
                className="-ml-3 h-8 rounded-full px-3.5 text-xs font-extrabold text-white hover:bg-white/15 hover:text-white backdrop-blur-md transition-all"
              >
                <Link to="/speaking">
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                  Back to speaking
                </Link>
              </Button>

              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="h-9 rounded-xl border border-white/30 bg-white/95 px-3.5 text-xs font-extrabold text-rose-700 shadow-lg shadow-rose-950/20 hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-70 transition-all sm:px-4.5"
              >
                {isDownloadingPdf ? (
                  <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-2 h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </span>
                <span className="sm:hidden">{isDownloadingPdf ? 'Preparing' : 'PDF'}</span>
              </Button>
            </div>

            <div className="relative grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-end">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  Speaking Report
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur-md shadow-sm">
                    <GraduationCap className="h-4 w-4 text-white" />
                    {testTitle || 'IELTS Academic'}
                  </span>
                  <span className="text-xs font-bold text-white/90">
                    Test Date: {testDateFormatted}
                  </span>
                </div>
              </div>

              <div className="hidden justify-self-end lg:block" aria-hidden="true">
                <SpeechBubbleGraphic />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="space-y-3 p-3 sm:p-4 lg:p-5">
            <SpeakingReportSummary
              finalEvaluation={finalEvaluation}
              pronunciationBreakdown={pronunciationBreakdown}
            />

            {finalEvaluation.assessmentStatus !== 'insufficient_evidence' && (
              <SpeakingReportDeepDive
                detailedFeedback={detailedFeedback}
                isGeneratingDetailed={isGeneratingDetailed}
                deepDiveError={deepDiveError}
                handleRetryDeepDive={handleRetryDeepDive}
              />
            )}

            {/* Bottom Footer Actions Bar */}
            <div className="flex flex-col justify-between gap-3 border-t border-[#e4e2f0] pt-4 dark:border-white/[0.07] sm:flex-row sm:items-center">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-[#e4e2f0] px-6 text-xs font-extrabold uppercase tracking-wider hover:bg-[#f4f3fb] dark:border-white/[0.07] dark:hover:bg-white/6 transition-all"
              >
                <Link to="/speaking">
                  <BookOpen className="mr-2.5 h-4 w-4" />
                  Speaking Library
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 rounded-xl bg-rose-600 px-8 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all"
              >
                <Link to="/dashboard">
                  <Home className="mr-2.5 h-4 w-4" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
