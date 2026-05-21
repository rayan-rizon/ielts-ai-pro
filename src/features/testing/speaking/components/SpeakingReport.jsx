import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Zap,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Home,
  ArrowLeft,
  Mic2,
  BookOpen,
  Brain,
  Bot,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import SpeakingAnalysis from './SpeakingAnalysis';
import XPNotification from '@/components/XPNotification';

import { callEdgeFunction } from '@/utils/api';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  loadingMessage, // Receive loadingMessage from parent
}) {
  const { width, height } = useWindowSize();

  // Deep Dive State — parent owns generation; local state used only for fallback manual retry
  const [isGeneratingDetailedLocal, setIsGeneratingDetailedLocal] = useState(false);
  const isGeneratingDetailed = isGeneratingDetailedProp ?? isGeneratingDetailedLocal;
  const [expandedQuestion, setExpandedQuestion] = useState(0); // Open first question by default
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // Aggregate pronunciation breakdown data from per-turn audio analysis
  const pronunciationBreakdown = useMemo(() => {
    if (!allPartsPronunciation) return null;
    const sounds = new Set();
    const wordIssues = [];
    const clarityNotes = [];
    for (const scores of Object.values(allPartsPronunciation)) {
      if (!Array.isArray(scores)) continue;
      for (const s of scores) {
        if (Array.isArray(s.problematicSounds)) {
          s.problematicSounds.forEach((sound) => sounds.add(sound));
        }
        if (Array.isArray(s.wordLevelFeedback)) {
          wordIssues.push(...s.wordLevelFeedback);
        }
        if (s.overallClarity) {
          clarityNotes.push(s.overallClarity);
        }
      }
    }
    if (sounds.size === 0 && wordIssues.length === 0) return null;
    // Deduplicate word issues by word
    const seen = new Set();
    const uniqueWordIssues = wordIssues.filter((w) => {
      if (seen.has(w.word)) return false;
      seen.add(w.word);
      return true;
    });
    return {
      problematicSounds: [...sounds],
      wordIssues: uniqueWordIssues,
      clarityNotes,
    };
  }, [allPartsPronunciation]);

  // Handle bulk expand/collapse
  const toggleExpandAll = () => {
    if (!detailedFeedback) return;
    setIsAllExpanded(!isAllExpanded);
    setExpandedQuestion(null); // Clear single expansion state
  };

  // Fallback: self-contained retry used when parent doesn't provide onRetryDeepDive
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

  // Helper to get band score level and easier-to-understand description
  const getBandInfo = (score) => {
    if (score >= 8.5)
      return {
        label: 'Expert Level',
        description: 'You speak like a native with total confidence.',
      };
    if (score >= 7.5)
      return {
        label: 'Advanced Level',
        description: 'You are highly fluent and can talk about almost anything clearly.',
      };
    if (score >= 6.5)
      return {
        label: 'Good Level',
        description: 'You can express yourself effectively in most situations.',
      };
    if (score >= 5.5)
      return {
        label: 'Intermediate Level',
        description: 'You can hold a conversation, though you still make some mistakes.',
      };
    if (score >= 4.5)
      return {
        label: 'Basic Level',
        description: 'You can talk about simple topics and personal information.',
      };
    return {
      label: 'Beginner Level',
      description: 'You are just starting to use the language for basic needs.',
    };
  };

  if (isEvaluating) {
    return <SpeakingAnalysis loadingMessage={loadingMessage} />;
  }

  if (evaluationError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Analysis Failed</h2>
          <p className="text-muted-foreground font-medium max-w-xs mx-auto">
            We encountered an error while processing your speaking test. {evaluationError}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onRetryEvaluation}
            size="lg"
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-500/20 rounded-2xl h-14 px-8 font-bold flex items-center gap-2 order-1 sm:order-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </Button>
          <div className="flex gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              asChild
              className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Link to="/speaking">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tests
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-14 px-6 rounded-2xl font-bold border-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!finalEvaluation) return null;

  const overallScore = Number(finalEvaluation.overallBand) || 0;
  const notes = finalEvaluation.criterionNotes || {};
  const legacy = finalEvaluation.analysis || {};

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
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {/* ─── Top Score Section (Side-by-Side) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Overall Score Ring - Left Side */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 p-5 rounded-[2.5rem] border-2 border-border/80 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group/score shadow-xl shadow-rose-500/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.08] dark:from-rose-500/[0.12] via-transparent to-transparent opacity-100" />

                  <p className="text-muted-foreground dark:text-zinc-300 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
                    Overall Band Score
                  </p>

                  <div className="relative inline-flex items-center justify-center group/ring">
                    {/* Dynamic Glow */}
                    <div className="absolute inset-0 bg-rose-500 blur-[60px] opacity-10 group-hover/ring:opacity-25 transition-opacity duration-700" />

                    <svg className="w-36 h-36 transform -rotate-90 drop-shadow-[0_0_25px_rgba(225,29,72,0.3)]">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#9f1239" />
                          <stop offset="50%" stopColor="#e11d48" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                      </defs>
                      <circle
                        className="text-rose-500/10 dark:text-rose-400/10"
                        strokeWidth="16"
                        stroke="currentColor"
                        fill="transparent"
                        r="64"
                        cx="72"
                        cy="72"
                      />
                      <motion.circle
                        stroke="url(#scoreGradient)"
                        strokeWidth="16"
                        strokeDasharray="402.1"
                        initial={{ strokeDashoffset: 402.1 }}
                        animate={{ strokeDashoffset: 402.1 * (1 - overallScore / 9) }}
                        transition={{ duration: 1.8, ease: 'circOut', delay: 0.5 }}
                        strokeLinecap="round"
                        fill="transparent"
                        r="64"
                        cx="72"
                        cy="72"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                        className="text-6xl font-black text-foreground tracking-tighter cursor-default"
                      >
                        {overallScore % 1 === 0 ? overallScore : overallScore.toFixed(1)}
                      </motion.span>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10 px-4">
                    <p className="text-2xl font-black text-foreground dark:text-white leading-none tracking-tight">
                      {getBandInfo(overallScore).label}
                    </p>
                    <p className="text-[13px] text-muted-foreground dark:text-zinc-300 font-semibold tracking-tight leading-relaxed max-w-[200px] mx-auto">
                      {getBandInfo(overallScore).description}
                    </p>
                  </div>
                </div>

                {/* Score Breakdown - Right Side */}
                <div className="lg:col-span-8 p-6 bg-white dark:bg-zinc-900 border-2 border-border/80 dark:border-white/10 rounded-[2.5rem] flex flex-col justify-center shadow-xl shadow-rose-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Target className="w-32 h-32 text-rose-500" />
                  </div>

                  <h3 className="text-xs font-black text-rose-600/80 dark:text-rose-400 mb-6 uppercase tracking-[0.4em] flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Performance Metrics
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {[
                      {
                        label: 'Fluency & Coherence',
                        icon: MessageSquare,
                        value: finalEvaluation.fluency,
                        color: 'from-rose-500 to-rose-600',
                        bg: 'bg-rose-500/5',
                      },
                      {
                        label: 'Lexical Resource',
                        icon: BookOpen,
                        value: finalEvaluation.lexical,
                        color: 'from-orange-500 to-rose-500',
                        bg: 'bg-orange-500/5',
                      },
                      {
                        label: 'Grammar Range',
                        icon: Brain,
                        value: finalEvaluation.grammar,
                        color: 'from-indigo-500 to-rose-500',
                        bg: 'bg-indigo-500/5',
                      },
                      {
                        label: 'Pronunciation',
                        icon: Mic2,
                        value: finalEvaluation.pronunciation,
                        color: 'from-rose-600 to-rose-800',
                        bg: 'bg-rose-600/5',
                      },
                    ].map((score) => (
                      <div
                        key={score.label}
                        className={`p-4 rounded-2xl border border-border/50 dark:border-white/10 ${score.bg} dark:bg-zinc-800/50 transition-all duration-300 hover:border-rose-500/20 dark:hover:border-rose-500/40 group/metric shadow-sm`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg bg-white dark:bg-zinc-900 shadow-sm border border-border/50 dark:border-white/20 text-rose-500 group-hover/metric:scale-110 transition-transform duration-300`}
                            >
                              <score.icon className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black text-foreground/70 dark:text-zinc-100 uppercase tracking-widest leading-tight max-w-[100px]">
                              {score.label}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none">
                              {score.value}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground dark:text-zinc-200 uppercase">
                              / 9.0
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted/30 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(score.value / 9) * 100}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: 1 }}
                            className={`h-full bg-gradient-to-r ${score.color} relative`}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted-foreground dark:text-zinc-500 text-center leading-relaxed">
                    Pronunciation is assessed from audio analysis and transcript context. Ensure
                    clear audio recording quality for best results.
                  </p>
                </div>
              </div>

              {/* ─── Part-by-Part Evaluation (Themed Cards) ─── */}
              {finalEvaluation.partScores && Object.keys(finalEvaluation.partScores).length > 0 && (
                <div className="p-5 bg-zinc-50 dark:bg-black/40 rounded-[2.5rem] border-2 border-border/60">
                  <div className="relative mb-5 text-center px-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-border/60"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-zinc-50 dark:bg-[#121212] px-6 text-[10px] font-black text-foreground uppercase tracking-[0.4em] shadow-sm py-1 rounded-full border border-border">
                        Part-by-Part Performance
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        key: 'part1',
                        label: 'Part 1',
                        subtitle: 'Intro',
                        icon: MessageSquare,
                        theme:
                          'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/20 dark:border-blue-500/40 text-blue-700 dark:text-blue-300',
                        accent: 'bg-blue-500',
                      },
                      {
                        key: 'part2',
                        label: 'Part 2',
                        subtitle: 'Long Turn',
                        icon: Mic2,
                        theme:
                          'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/20 dark:border-amber-500/40 text-amber-700 dark:text-amber-300',
                        accent: 'bg-amber-500',
                      },
                      {
                        key: 'part3',
                        label: 'Part 3',
                        subtitle: 'Discussion',
                        icon: Brain,
                        theme:
                          'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20 dark:border-rose-500/40 text-rose-700 dark:text-rose-300',
                        accent: 'bg-rose-500',
                      },
                    ]
                      .filter((p) => finalEvaluation.partScores[p.key])
                      .map((part) => {
                        const data = finalEvaluation.partScores[part.key];
                        const Icon = part.icon;
                        return (
                          <div
                            key={part.key}
                            className={`p-4 border-2 rounded-[1.5rem] flex flex-col items-center text-center space-y-2.5 transition-all hover:shadow-lg hover:scale-[1.02] duration-300 ${part.theme}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl ${part.accent}/20 flex items-center justify-center shrink-0 shadow-sm`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                {part.label}
                              </p>
                              <p className="text-3xl font-black text-foreground">{data.band}</p>
                              <p className="text-[10px] font-black opacity-80">{part.subtitle}</p>
                            </div>

                            {data.keyObservation && (
                              <p className="text-[13px] text-foreground font-bold leading-snug mt-1 pt-3 border-t border-current/10 w-full italic">
                                {data.keyObservation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ─── Feedback & Criterion Notes (Large Grid) ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Examiner's Feedback - Large Feature */}
                {finalEvaluation.feedback && (
                  <div className="lg:col-span-12 p-8 bg-zinc-900 border border-white/5 text-zinc-100 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 blur-[100px] opacity-[0.15] -mr-32 -mt-32" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/90 mb-4 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Professional Summary
                    </h4>
                    <p className="text-lg md:text-xl font-bold leading-snug italic relative z-10 selection:bg-rose-500/30">
                      "{finalEvaluation.feedback}"
                    </p>
                  </div>
                )}

                {/* Criterion Notes - Columns */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  {[
                    {
                      title: 'Fluency & Coherence',
                      analysis: notes.fluency || legacy.fluencyAnalysis,
                      icon: 'FC',
                      color: 'from-rose-500 to-orange-500',
                      bgColor: 'bg-rose-500/5',
                      borderColor: 'border-rose-500/20',
                    },
                    {
                      title: 'Lexical Resource',
                      analysis: notes.lexical || legacy.lexicalAnalysis,
                      icon: 'LR',
                      color: 'from-orange-500 to-amber-500',
                      bgColor: 'bg-orange-500/5',
                      borderColor: 'border-orange-500/20',
                    },
                    {
                      title: 'Grammatical Range',
                      analysis: notes.grammar || legacy.grammarAnalysis,
                      icon: 'GRA',
                      color: 'from-amber-500 to-yellow-500',
                      bgColor: 'bg-amber-500/5',
                      borderColor: 'border-amber-500/20',
                    },
                    {
                      title: 'Pronunciation',
                      analysis: notes.pronunciation || legacy.pronunciationAnalysis,
                      icon: 'P',
                      color: 'from-rose-500 to-pink-500',
                      bgColor: 'bg-pink-500/5',
                      borderColor: 'border-pink-500/20',
                    },
                  ]
                    .filter((c) => c.analysis)
                    .map((criterion) => (
                      <div
                        key={criterion.title}
                        className={`p-5 ${criterion.bgColor} ${criterion.borderColor} border rounded-2xl flex flex-col h-full`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${criterion.color} flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-rose-500/10`}
                          >
                            {criterion.icon}
                          </div>
                          <h5 className="text-[11px] font-black text-foreground dark:text-zinc-100 uppercase tracking-widest leading-none">
                            {criterion.title}
                          </h5>
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed font-medium">
                          {criterion.analysis}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* ─── Pronunciation Breakdown (Pro/Premium Only) ─── */}
              {pronunciationBreakdown && (
                <div className="mt-4 p-5 bg-rose-500/[0.02] dark:bg-rose-950/20 border-2 border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-rose-500" />
                    <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.3em]">
                      Pronunciation Breakdown
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[8px] border-rose-500/30 text-rose-500 ml-auto"
                    >
                      Enhanced Analysis
                    </Badge>
                  </div>

                  {pronunciationBreakdown.problematicSounds.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Problematic Sounds
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {pronunciationBreakdown.problematicSounds.map((sound, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-lg text-xs font-mono font-bold border border-rose-500/20"
                          >
                            {sound}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {pronunciationBreakdown.wordIssues.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Word-Level Issues
                      </p>
                      <div className="space-y-1.5">
                        {pronunciationBreakdown.wordIssues.slice(0, 10).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-rose-500/10 dark:border-rose-500/20"
                          >
                            <span
                              className={cn(
                                'w-2 h-2 rounded-full shrink-0',
                                item.severity === 'major'
                                  ? 'bg-red-500'
                                  : item.severity === 'moderate'
                                    ? 'bg-amber-500'
                                    : 'bg-yellow-400'
                              )}
                            />
                            <span className="text-xs font-bold text-foreground dark:text-zinc-100">
                              &ldquo;{item.word}&rdquo;
                            </span>
                            <span className="text-[11px] text-muted-foreground dark:text-zinc-400">
                              {item.issue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pronunciationBreakdown.problematicSounds.length > 0 && (
                    <div className="pt-2 border-t border-rose-500/10">
                      <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                        Practice Tip
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed">
                        Focus on minimal pairs to improve these sounds. For example,{' '}
                        {pronunciationBreakdown.problematicSounds[0]?.includes('/θ/')
                          ? 'practice: think/sink, three/free, bath/bass'
                          : pronunciationBreakdown.problematicSounds[0]?.includes('/r/')
                            ? 'practice: right/light, red/led, row/low'
                            : pronunciationBreakdown.problematicSounds[0]?.includes('/v/')
                              ? 'practice: very/berry, vest/best, vine/wine'
                              : 'record yourself reading aloud and compare with native speakers'}
                        . Repeat daily for best results.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Strengths & Development Areas (2 Columns) ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Key Strengths */}
                {finalEvaluation.strengths && finalEvaluation.strengths.length > 0 && (
                  <div className="p-6 bg-emerald-500/[0.02] dark:bg-emerald-950/20 border-2 border-emerald-500/20 dark:border-emerald-500/30 rounded-[2rem] space-y-4 shadow-lg shadow-emerald-500/[0.02]">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Key Strengths
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      {finalEvaluation.strengths.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-emerald-500/10 dark:border-emerald-500/20 flex gap-3 items-start shadow-sm shadow-emerald-500/5 group/item transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="mt-1 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500/20 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <p className="text-sm font-semibold dark:text-zinc-200 leading-relaxed">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Development Areas */}
                {finalEvaluation.improvements && finalEvaluation.improvements.length > 0 && (
                  <div className="p-6 bg-rose-500/[0.02] dark:bg-rose-950/20 border-2 border-rose-500/20 dark:border-rose-500/30 rounded-[2rem] space-y-4 shadow-lg shadow-rose-500/[0.02]">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Development Areas
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      {finalEvaluation.improvements.map((item, idx) => {
                        const title =
                          typeof item === 'string'
                            ? 'Improvement'
                            : item.criterion || item.area || 'Development Area';
                        const content =
                          typeof item === 'string'
                            ? item
                            : item.feedback || item.tip || item.suggestion || '';
                        return (
                          <div
                            key={idx}
                            className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-rose-500/10 dark:border-rose-500/20 space-y-1.5 shadow-sm shadow-rose-500/5 group/area transition-all duration-300 hover:scale-[1.02]"
                          >
                            <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide group-hover/area:translate-x-1 transition-transform">
                              {title}
                            </h4>
                            <p className="text-[13px] text-muted-foreground dark:text-zinc-300 font-medium leading-relaxed">
                              {content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Band 9 Strategy (Full Width Below) ─── */}
              {finalEvaluation.targetBandTips && (
                <div className="bg-zinc-900 dark:bg-zinc-950 p-6 md:p-8 rounded-[1.5rem] text-white relative overflow-hidden group/strategy border-2 border-white/5 mt-6">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover/strategy:rotate-0 transition-transform duration-500">
                    <Zap className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-rose-500">
                      <Bot className="w-5 h-5" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-400">
                        Band 9 Strategy
                      </h3>
                    </div>
                    <p className="text-xl md:text-2xl font-black leading-tight tracking-tight italic text-zinc-100">
                      "{finalEvaluation.targetBandTips}"
                    </p>
                  </div>
                </div>
              )}

              {/* ─── Question-by-Question Deep Dive ─── */}
              <div className="mt-10 mb-6">
                <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
                  <h3 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-orange-500" />
                    </div>
                    Question Deep Dive
                  </h3>
                  <div className="flex items-center gap-3">
                    {detailedFeedback && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpandAll}
                        className="text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-600 transition-colors hidden md:flex"
                      >
                        {isAllExpanded ? (
                          <>
                            <ChevronUp className="w-3 h-3 mr-1.5" /> Collapse All
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 mr-1.5" /> Expand All
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Deep Dive Section */}
                {isGeneratingDetailed && (
                  <div className="p-12 md:p-16 text-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-[2.5rem] border-2 border-rose-500/20 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-rose-500/20 rounded-full blur-[60px] animate-pulse" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl mx-auto flex items-center justify-center border border-rose-500/20 shadow-lg">
                        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black tracking-tight text-foreground">
                          Generating Deep Dive Analysis
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed max-w-sm mx-auto">
                          Reviewing every question and response. Your detailed feedback will appear
                          here shortly.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500/70">
                          <Sparkles className="w-3 h-3" /> Auto-generating analysis
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {deepDiveError && !isGeneratingDetailed && !detailedFeedback && (
                  <div className="p-8 text-center rounded-[2rem] border border-red-500/20 bg-red-500/5">
                    <p className="text-sm text-muted-foreground mb-3">
                      Deep dive analysis could not be generated.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryDeepDive}
                      className="text-xs font-bold"
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" /> Retry
                    </Button>
                  </div>
                )}

                {detailedFeedback && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    {[1, 2, 3].map((partNumber) => {
                      const partQuestions = detailedFeedback.filter((q) => q.part === partNumber);
                      if (partQuestions.length === 0) return null;

                      const partThemes = {
                        1: {
                          name: 'Part 1: Introduction',
                          color: 'text-blue-600 dark:text-blue-400',
                          bg: 'bg-blue-500/5',
                          border: 'border-blue-500/10',
                          icon: MessageSquare,
                          accent: 'bg-blue-500',
                        },
                        2: {
                          name: 'Part 2: Long Turn',
                          color: 'text-amber-600 dark:text-amber-400',
                          bg: 'bg-amber-500/5',
                          border: 'border-amber-500/10',
                          icon: Mic2,
                          accent: 'bg-amber-500',
                        },
                        3: {
                          name: 'Part 3: Discussion',
                          color: 'text-rose-600 dark:text-rose-400',
                          bg: 'bg-rose-500/5',
                          border: 'border-rose-500/10',
                          icon: Brain,
                          accent: 'bg-rose-500',
                        },
                      };
                      const theme = partThemes[partNumber];

                      return (
                        <div key={partNumber} className="space-y-4">
                          <div className="flex items-center gap-3 px-2">
                            <div
                              className={`w-8 h-8 rounded-lg ${theme.bg} flex items-center justify-center border ${theme.border}`}
                            >
                              <theme.icon className={`w-4 h-4 ${theme.color}`} />
                            </div>
                            <h4
                              className={`text-[11px] font-black uppercase tracking-[0.3em] ${theme.color}`}
                            >
                              {theme.name}
                            </h4>
                            <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent ml-2" />
                          </div>

                          <div className="space-y-3">
                            {partQuestions.map((item, localIdx) => {
                              const globalIdx = detailedFeedback.indexOf(item);
                              const isExpanded = isAllExpanded || expandedQuestion === globalIdx;

                              return (
                                <motion.div
                                  key={globalIdx}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: globalIdx * 0.05 }}
                                  className={cn(
                                    'group/card bg-white dark:bg-zinc-950 border border-border/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 rounded-[1.2rem] overflow-hidden transition-all duration-300',
                                    isExpanded
                                      ? 'shadow-xl shadow-rose-500/5 ring-1 ring-rose-500/20'
                                      : 'shadow-sm'
                                  )}
                                >
                                  <button
                                    onClick={() => {
                                      if (isAllExpanded) {
                                        setIsAllExpanded(false);
                                        setExpandedQuestion(globalIdx);
                                      } else {
                                        setExpandedQuestion(
                                          expandedQuestion === globalIdx ? null : globalIdx
                                        );
                                      }
                                    }}
                                    className="w-full text-left p-4 md:p-5 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                  >
                                    <div
                                      className={cn(
                                        'w-9 h-9 rounded-xl font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm border transition-all duration-500',
                                        isExpanded
                                          ? 'bg-rose-600 text-white border-rose-500 scale-110 shadow-lg shadow-rose-500/20'
                                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800'
                                      )}
                                    >
                                      <span className="text-[13px]">Q{localIdx + 1}</span>
                                    </div>
                                    <div className="flex-1 pt-1.5 flex items-center justify-between">
                                      <h4
                                        className={cn(
                                          'font-bold text-[14px] md:text-[15px] leading-snug pr-4 transition-colors duration-300',
                                          isExpanded
                                            ? 'text-rose-600 dark:text-rose-400'
                                            : 'text-foreground'
                                        )}
                                      >
                                        {item.question}
                                      </h4>
                                      <div
                                        className={cn(
                                          'shrink-0 p-1 rounded-full transition-all duration-500',
                                          isExpanded
                                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 rotate-180'
                                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                                        )}
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
                                        className="overflow-hidden bg-gradient-to-b from-zinc-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950"
                                      >
                                        <div className="p-5 md:p-6 pt-2 space-y-6 border-t border-border/50">
                                          {/* Candidate Answer */}
                                          <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                Your Response
                                              </span>
                                            </div>
                                            <p className="text-[14px] text-foreground font-medium bg-white dark:bg-zinc-900/80 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] leading-relaxed">
                                              {item.candidateAnswer}
                                            </p>
                                          </div>

                                          {/* Topic Drift Warning */}
                                          {item.topicDrift && item.topicDrift !== 'null' && (
                                            <div className="space-y-2.5 relative group/drift mt-4">
                                              <div className="flex items-center gap-2">
                                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                                                  Topic Drift Detected
                                                </span>
                                              </div>
                                              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-500/20 dark:border-amber-500/20">
                                                <p className="text-[13px] text-amber-900 dark:text-amber-100 font-medium leading-relaxed">
                                                  {item.topicDrift}
                                                </p>
                                              </div>
                                            </div>
                                          )}

                                          {/* Grammatical Errors */}
                                          {item.grammaticalErrors &&
                                            item.grammaticalErrors.length > 0 && (
                                              <div className="space-y-3 mt-4">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                                                    Grammar & Vocabulary Errors (
                                                    {item.grammaticalErrors.length})
                                                  </span>
                                                </div>
                                                <div className="space-y-2">
                                                  {item.grammaticalErrors.map((err, errIdx) => (
                                                    <div
                                                      key={errIdx}
                                                      className="bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-500/20 flex flex-col gap-1.5"
                                                    >
                                                      <div className="flex items-start gap-2">
                                                        <span className="line-through text-rose-500/70 text-[13px] font-medium decoration-rose-500/50 break-words">
                                                          {err.incorrect}
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                                        <span className="text-emerald-600 dark:text-emerald-400 text-[13px] font-bold break-words">
                                                          {err.correct}
                                                        </span>
                                                      </div>
                                                      <p className="text-[12px] text-muted-foreground/80 dark:text-zinc-400 italic">
                                                        {err.explanation}
                                                      </p>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                          {/* Sample & Feedback Split */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                            <div className="space-y-2.5 relative group/suggest">
                                              <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                                  Band 9.0 sample
                                                </span>
                                              </div>
                                              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 relative group-hover/suggest:border-emerald-500/40 transition-colors">
                                                <p className="text-[13px] md:text-[14px] text-emerald-950 dark:text-emerald-50 font-semibold leading-relaxed">
                                                  {item.suggestedAnswer}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="space-y-2.5 relative group/feedback">
                                              <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
                                                  Examiner Feedback
                                                </span>
                                              </div>
                                              <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-500/20 dark:border-rose-500/20 relative group-hover/feedback:border-rose-500/40 transition-colors">
                                                <p className="text-[13px] text-foreground/80 dark:text-rose-50/80 font-medium italic leading-relaxed">
                                                  {item.feedback}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

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
