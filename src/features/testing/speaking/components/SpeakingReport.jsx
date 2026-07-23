import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Download,
  GraduationCap,
  Home,
  LoaderCircle,
  MessageCircleMore,
} from 'lucide-react';
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
  const testDateFormatted = new Date().toLocaleDateString('en-GB', {
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
      className="custom-scrollbar relative isolate h-full min-h-0 overflow-y-auto overscroll-contain bg-slate-50/70 px-4 py-4 dark:bg-[#080808] sm:px-6 sm:py-6 lg:px-8 lg:py-8"
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
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-rose-950/5 dark:border-white/10 dark:bg-zinc-950">
          {/* Header Banner */}
          <header className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 px-5 pb-7 pt-5 text-white sm:px-8 lg:px-10 lg:pb-8 lg:pt-6">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border-[34px] border-white/[0.07]" />
              <div className="absolute right-32 top-8 h-44 w-44 rounded-full border border-white/15" />
              <div className="absolute right-12 top-10 h-28 w-28 rounded-full border border-white/15" />
              <div className="absolute bottom-0 left-1/3 h-28 w-96 bg-white/15 blur-[80px]" />
            </div>

            <div className="relative mb-6 flex items-center justify-between gap-4">
              <Button
                asChild
                variant="ghost"
                className="-ml-3 h-9 rounded-full px-4 text-xs font-extrabold text-white hover:bg-white/15 hover:text-white backdrop-blur-md transition-all"
              >
                <Link to="/speaking">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to speaking
                </Link>
              </Button>

              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="h-10 rounded-xl border border-white/30 bg-white/95 px-4 text-xs font-black text-rose-700 shadow-xl shadow-rose-950/20 hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-70 transition-all sm:px-5"
              >
                {isDownloadingPdf ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </span>
                <span className="sm:hidden">{isDownloadingPdf ? 'Preparing' : 'PDF'}</span>
              </Button>
            </div>

            <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Speaking Report
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-extrabold backdrop-blur-md shadow-sm">
                    <GraduationCap className="h-4 w-4 text-rose-100" />
                    {testTitle || 'IELTS Academic'}
                  </span>
                  <span className="text-xs font-semibold text-rose-100">
                    Test Date: {testDateFormatted}
                  </span>
                </div>
              </div>

              <div className="hidden justify-self-end lg:block" aria-hidden="true">
                <div className="relative flex h-24 w-40 items-center justify-center rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur-md">
                  <MessageCircleMore className="h-12 w-12 text-white" />
                  <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-white/90 animate-ping" />
                  <span className="absolute right-5 top-5 h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <SpeakingReportSummary
              finalEvaluation={finalEvaluation}
              pronunciationBreakdown={pronunciationBreakdown}
            />

            <SpeakingReportDeepDive
              detailedFeedback={detailedFeedback}
              isGeneratingDetailed={isGeneratingDetailed}
              deepDiveError={deepDiveError}
              handleRetryDeepDive={handleRetryDeepDive}
            />

            {/* Bottom Footer Actions Bar */}
            <div className="flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 dark:border-white/10 sm:flex-row sm:items-center">
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-slate-200 px-6 text-xs font-black uppercase tracking-wider hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 transition-all"
              >
                <Link to="/speaking">
                  <BookOpen className="mr-2.5 h-4 w-4" />
                  Speaking Library
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 rounded-xl bg-rose-600 px-8 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all"
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
