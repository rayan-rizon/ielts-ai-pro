import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const isGeneratingDetailed = isGeneratingDetailedProp ?? isGeneratingDetailedLocal;
  const pronunciationBreakdown = usePronunciationBreakdown(allPartsPronunciation);

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
    <div className="min-h-screen py-12 px-4 md:px-6 relative isolate">
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        key="report"
        className="max-w-5xl mx-auto relative"
      >
        <Card className="glass-card-premium border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 dark:from-rose-900 dark:via-rose-950 dark:to-zinc-950 dark:border-b dark:border-white/5 text-white pt-4 pb-3 md:pt-7 md:pb-5 transition-colors duration-500">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-white/20 dark:bg-rose-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 dark:border-rose-500/30">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl md:text-5xl font-black tracking-tight mb-2">
              Speaking Report
            </CardTitle>
            <div className="pt-6">
              <CardDescription className="text-white font-black text-xs md:text-sm uppercase tracking-wider bg-black/10 dark:bg-white/10 inline-block px-5 py-2 rounded-xl border border-white/10 dark:border-white/20 backdrop-blur-sm shadow-sm dark:text-rose-100 max-w-[85%] mx-auto">
                {testTitle || 'IELTS Academic'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 space-y-6">
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

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-8 border-t border-border/50">
              <Button
                asChild
                variant="outline"
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 hover:bg-muted"
              >
                <Link to="/speaking">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Speaking Library
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20"
              >
                <Link to="/dashboard">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
