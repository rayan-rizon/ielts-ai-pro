import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Info,
  RefreshCw,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

import { useWritingTestStore } from '@/features/testing/writing/store/useWritingTestStore';

/**
 * FeedbackPanel
 *
 * Premium AI feedback display with tabs and scoring gauges.
 */
export function FeedbackPanel({
  feedback,
  isAnalyzing,
  feedbackError,
  handleGetFeedback,
  loadingMessage,
}) {
  const activeType = useWritingTestStore((state) => state.activeType);
  const writing = useWritingTestStore((state) => state.drafts[activeType] || '');
  const setDraft = useWritingTestStore((state) => state.setDraft);

  const setWriting = React.useCallback(
    (content) => setDraft(activeType, content),
    [activeType, setDraft]
  );
  if (!feedback && !isAnalyzing && !feedbackError) return null;

  return (
    <div
      id="feedback-section"
      className="h-full flex flex-col bg-[#F8FAFC] dark:bg-[#05060B] relative"
      data-oid="qk_:zx8"
    >
      <AnimatePresence mode="wait" data-oid="._:6688">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#05060B] relative overflow-hidden"
            data-oid="-vbf2bx"
          >
            {/* Premium Background Elements */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none"
              data-oid="vbwftqt"
            >
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] animate-pulse"
                data-oid="jt7.dfd"
              ></div>
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[80px] animate-pulse [animation-delay:1s]"
                data-oid="q5azi6h"
              ></div>
            </div>

            <div
              className="relative z-10 w-full max-w-sm space-y-10 flex flex-col items-center"
              data-oid="f2kuyz4"
            >
              {/* Dynamic AI Orb Animation */}
              <div className="relative w-32 h-32" data-oid="5z0su3z">
                {/* Outer Rotating Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500/30 dark:border-indigo-400/20"
                  data-oid="7ypmvgc"
                />

                {/* Inner Counter-Rotating Ring */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border-r-2 border-l-2 border-blue-500/40 dark:border-blue-400/30"
                  data-oid="9s3uwco"
                />

                {/* Central Glowing Orb */}
                <div
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                  data-oid="y56p9l:"
                >
                  <Sparkles
                    className="w-8 h-8 text-indigo-500 dark:text-indigo-400 animate-pulse"
                    data-oid="sjz:qnk"
                  />
                </div>

                {/* Orbiting Particles */}
                {[0, 120, 240].map((angle, i) => (
                  <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0"
                    data-oid="wdd1kgb"
                  >
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.8)]"
                      style={{ transformOrigin: 'center 64px' }}
                      data-oid="wu8g6w6"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Status Information */}
              <div className="text-center space-y-4" data-oid="s1-5jnx">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                  data-oid="4suy_jg"
                >
                  AI{' '}
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400"
                    data-oid="ln_lqyc"
                  >
                    Analysis
                  </span>{' '}
                  in Progress
                </motion.h3>

                <div className="h-6 relative overflow-hidden" data-oid="7wz-vmi">
                  <AnimatePresence mode="wait" data-oid="n-x_9zt">
                    <motion.p
                      key={loadingMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]"
                      data-oid="e9psoa8"
                    >
                      {loadingMessage || 'Orchestrating AI Pipeline...'}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Step Progress Indicator */}
              <div className="w-full space-y-3 px-4" data-oid="ltjhmb0">
                {[
                  { label: 'Grammar & Spelling', key: 'grammar' },
                  { label: 'Lexical Complexity', key: 'vocab' },
                  { label: 'Coherence & Logic', key: 'logic' },
                  { label: 'Final Band Calculation', key: 'score' },
                ].map((step, idx) => {
                  // Determine if this step is "current" or "completed" based on the index and a simple timer simulation
                  const messages = [
                    'Checking grammar and spelling...',
                    'Analyzing vocabulary usage...',
                    'Evaluating coherence and cohesion...',
                    'Assessing task achievement...',
                    'Calculating band score...',
                  ];

                  const currentMsgIdx = messages.indexOf(loadingMessage);
                  const isCompleted = idx < currentMsgIdx;
                  const isCurrent = idx === currentMsgIdx;

                  return (
                    <div key={idx} className="flex items-center gap-3" data-oid="l-q.5d5">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 border',
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : isCurrent
                              ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_0_10px_rgba(79,70,229,0.2)]'
                              : 'border-slate-200 dark:border-white/5 bg-transparent'
                        )}
                        data-oid=":y0z.26"
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3" data-oid="39yvf.:" />
                        ) : isCurrent ? (
                          <RefreshCw
                            className="w-2.5 h-2.5 text-indigo-500 animate-spin"
                            data-oid="qpxinlo"
                          />
                        ) : (
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800"
                            data-oid="yx.rocr"
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-bold tracking-wide transition-colors duration-500',
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isCurrent
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-600'
                        )}
                        data-oid="7lbrnu."
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar Footer */}
              <div className="w-full space-y-2" data-oid="2hj60mt">
                <div
                  className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden"
                  data-oid="o3gimfc"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 rounded-full"
                    animate={{
                      width: ['10%', '90%'],
                      backgroundPosition: ['0% 50%', '100% 50%'],
                    }}
                    transition={{
                      width: { duration: 15, ease: 'linear' },
                      backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
                    }}
                    data-oid="vht_37e"
                  />
                </div>
                <p
                  className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest"
                  data-oid="trfv9p."
                >
                  Estimated time: ~15 seconds
                </p>
              </div>
            </div>
          </motion.div>
        ) : feedbackError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
            data-oid="izxtr:a"
          >
            {/* Error Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none"
              data-oid="d9v8szp"
            ></div>

            <div
              className="relative z-10 flex flex-col items-center space-y-6 max-w-sm"
              data-oid="zd8lv_n"
            >
              <div
                className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center border border-rose-100 dark:border-rose-500/20 shadow-sm"
                data-oid="qtk.zrj"
              >
                <AlertTriangle className="w-10 h-10 text-rose-500" data-oid="1hn-hm0" />
              </div>

              <div className="space-y-2" data-oid="h_qivx8">
                <h3
                  className="text-xl font-black text-slate-900 dark:text-white tracking-tight"
                  data-oid="wn83.8_"
                >
                  {feedbackError?.includes('connect') ||
                  feedbackError?.includes('network') ||
                  feedbackError?.includes('internet')
                    ? 'Connection Issue'
                    : feedbackError?.includes('rate') || feedbackError?.includes('Too many')
                      ? 'Please Slow Down'
                      : feedbackError?.includes('log in') || feedbackError?.includes('session')
                        ? 'Session Expired'
                        : 'AI Service Temporarily Unavailable'}
                </h3>
                <p
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed"
                  data-oid="t.l93df"
                >
                  {feedbackError?.includes('connect') ||
                  feedbackError?.includes('network') ||
                  feedbackError?.includes('internet')
                    ? 'Please check your internet connection and try again.'
                    : feedbackError?.includes('Worker failed to boot')
                      ? "We're having trouble connecting to our specialized IELTS analysis engine. This is usually temporary—please try again after a few seconds."
                      : feedbackError?.includes('rate') || feedbackError?.includes('Too many')
                        ? "You've made too many requests. Please wait a moment before trying again."
                        : feedbackError?.includes('log in') || feedbackError?.includes('session')
                          ? 'Your session has expired. Please log in again to continue.'
                          : feedbackError ||
                            'Our AI systems encountered an unexpected hurdle while evaluating your work.'}
                </p>
              </div>

              <Button
                onClick={handleGetFeedback}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 h-12 px-8 rounded-2xl font-bold shadow-lg shadow-slate-900/10 dark:shadow-white/5 transition-all active:scale-95 gap-3"
                data-oid="uv2iwgl"
              >
                <RefreshCw className="w-4 h-4" data-oid="zzfd76h" />
                Resume Analysis
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
            data-oid="8ga_8ox"
          >
            {/* 1. New Feedback Header Design */}
            <div
              className="shrink-0 z-10 sticky top-0 bg-[#F8FAFC] dark:bg-[#05060B]"
              data-oid="g5o8l-f"
            >
              {/* Dark Navy Card */}
              <div
                className="mx-2 sm:mx-4 mt-2 rounded-2xl sm:rounded-3xl bg-[#0F1035] dark:bg-[#0B0C24] p-4 sm:p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/5"
                data-oid="yn3:fmk"
              >
                {/* Background Glows */}
                <div
                  className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-indigo-500/20 rounded-full blur-2xl sm:blur-3xl -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 pointer-events-none"
                  data-oid="-pz.7os"
                ></div>
                <div
                  className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-blue-500/10 rounded-full blur-2xl sm:blur-3xl -ml-5 sm:-ml-10 -mb-5 sm:-mb-10 pointer-events-none"
                  data-oid=":y8l:b6"
                ></div>

                <div
                  className="relative z-10 flex items-center justify-between gap-4"
                  data-oid="wqo09mq"
                >
                  {/* Left Side: Title & Badge */}
                  <div
                    className="flex flex-col items-start gap-2 sm:gap-4 min-w-0"
                    data-oid="qhx257m"
                  >
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
                      data-oid=".fivh.3"
                    >
                      <Sparkles
                        className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-400"
                        data-oid="zehudlb"
                      />
                      <span
                        className="text-[8px] sm:text-[10px] font-bold tracking-widest uppercase text-white/90"
                        data-oid="dw2l3ig"
                      >
                        AI Analysis Complete
                      </span>
                    </div>
                    <div className="min-w-0" data-oid="xnfcvr_">
                      <h2
                        className="text-xl sm:text-3xl font-black tracking-tight text-white mb-0.5 sm:mb-1 truncate"
                        data-oid="ygkc.p7"
                      >
                        Task {feedback.writing?.taskType === 'task2' ? '2' : '1'} Feedback
                      </h2>
                      <p
                        className="text-[10px] sm:text-sm font-medium text-slate-400"
                        data-oid="1f4q-h1"
                      >
                        IELTS Band Descriptor Analysis
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Big Ring Gauge */}
                  <div
                    className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0"
                    data-oid=":kgvuf1"
                  >
                    <svg className="w-full h-full transform -rotate-90" data-oid="g.lj:g7">
                      {/* Track */}
                      <circle
                        cx="50%"
                        cy="50%"
                        r="42%"
                        className="stroke-slate-700/50"
                        strokeWidth="10"
                        fill="transparent"
                        data-oid="gr93cm6"
                      />

                      {/* Gradient Def */}
                      <defs data-oid="3cp20ol">
                        <linearGradient
                          id="scoreGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                          data-oid="r-mggq5"
                        >
                          <stop offset="0%" stopColor="#fbbf24" data-oid="wppugyw" />
                          <stop offset="100%" stopColor="#f59e0b" data-oid="x0ca9oq" />
                        </linearGradient>
                      </defs>

                      {/* Progress */}
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="42%"
                        stroke="url(#scoreGradient)"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray="264"
                        initial={{ strokeDashoffset: 264 }}
                        animate={{
                          strokeDashoffset: 264 - (264 * (feedback.overallBand || 0)) / 9,
                        }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        data-oid="39s82r_"
                      />
                    </svg>
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center pt-0.5 sm:pt-1"
                      data-oid="2rcm7ia"
                    >
                      <span
                        className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0 sm:mb-0.5"
                        data-oid="jrg6jgr"
                      >
                        BAND
                      </span>
                      <span
                        className="text-3xl sm:text-5xl font-black text-white leading-none tracking-tighter"
                        data-oid="h2r:9g_"
                      >
                        {feedback.overallBand}
                      </span>
                      <span
                        className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-0.5 sm:mt-1 dark:text-slate-400"
                        data-oid="4r.sk0x"
                      >
                        of 9.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Criteria Cards Grid */}
              <div
                className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3"
                data-oid="5:lz1dz"
              >
                {Object.entries(feedback.criteriaScores || {}).map(([key, score], idx) => {
                  let label = key
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .toUpperCase();
                  const words = label.split(' ');

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="bg-white dark:bg-[#0B0C24]/60 dark:backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 hover:shadow-md transition-all duration-300 min-h-[100px] sm:min-h-[120px]"
                      data-oid="ndrqbqa"
                    >
                      {/* Single Circle Score */}
                      <div
                        className="w-10 h-10 sm:w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                        data-oid="8r6tcox"
                      >
                        <span
                          className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-300 pt-0.5"
                          data-oid="hav6ny-"
                        >
                          {score}
                        </span>
                      </div>

                      {/* Label */}
                      <div className="flex flex-col items-center leading-none" data-oid="o.4tckq">
                        {words.map((w, i) => (
                          <span
                            key={i}
                            className="text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-300/80 tracking-wider"
                            data-oid="0:e8ea_"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2. Scrollable Body */}
            <div
              className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
              data-oid="548_1in"
            >
              {/* Action Plan / Top Issues */}
              {feedback.corrections && feedback.corrections.length > 0 && (
                <section data-oid="yk_3d0v">
                  <h3
                    className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3"
                    data-oid="zv0x-h:"
                  >
                    <Target className="w-3.5 h-3.5" data-oid="2tp96qy" />
                    Key Corrections
                  </h3>
                  <div className="space-y-3" data-oid="f4f1d.3">
                    {feedback.corrections.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-[#0D0E1A] p-4 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-200"
                        data-oid="p93yi-4"
                      >
                        <div className="flex flex-col gap-3" data-oid="1rcgo7y">
                          {/* Comparison View */}
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-50 dark:border-slate-800/50"
                            data-oid="t6itzie"
                          >
                            <div className="space-y-1" data-oid="aq6:b50">
                              <span
                                className="text-[10px] font-bold text-rose-500 uppercase tracking-wider"
                                data-oid="9z8:d-c"
                              >
                                Original
                              </span>
                              <p
                                className="text-sm text-slate-500 line-through decoration-rose-300 dark:decoration-rose-700/50 decoration-2"
                                data-oid="oj7owmz"
                              >
                                {item.original}
                              </p>
                            </div>
                            <div
                              className="space-y-1 sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-3"
                              data-oid="6wn3rem"
                            >
                              <span
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider"
                                data-oid="9ys:4.z"
                              >
                                Better
                              </span>
                              <p
                                className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
                                data-oid="_xdgqx:"
                              >
                                {item.correction}
                              </p>
                            </div>
                          </div>

                          {/* Explanation */}
                          <div
                            className="flex items-start gap-2 bg-slate-50/50 dark:bg-indigo-500/5 p-2 rounded-lg border border-transparent dark:border-indigo-500/10"
                            data-oid="i4ks.jn"
                          >
                            <Info
                              className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0"
                              data-oid="td09bof"
                            />

                            <p
                              className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                              data-oid="hum9c2i"
                            >
                              {item.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Detailed Review - Moved to Left Pane */}
              {/* <section>...</section> */}

              {/* Next Steps / Strengths */}
              <div className="grid grid-cols-1 gap-4" data-oid="o.mv23b">
                {feedback.strengths && (
                  <section data-oid="mkqk:q2">
                    <h3
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2 px-1"
                      data-oid="gki2zb8"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-500" data-oid="3xolxy-" />
                      What You Did Well
                    </h3>
                    <div className="grid gap-2" data-oid="kio5y_v">
                      {feedback.strengths.slice(0, 4).map((str, i) => {
                        const match = str.match(/^\*\*(.*?)\*\*(.*)/);
                        return (
                          <div
                            key={i}
                            className="group flex items-start gap-2.5 text-[12px] text-slate-600 dark:text-slate-300 leading-normal bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:shadow-sm transition-all duration-300"
                            data-oid="gu9.ac6"
                          >
                            <div
                              className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0"
                              data-oid="w4s61.e"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                data-oid="8rikdha"
                              ></div>
                            </div>
                            <div data-oid="0bl9gt1">
                              {match ? (
                                <>
                                  <span
                                    className="font-bold text-slate-900 dark:text-white mr-1"
                                    data-oid="ifag3gw"
                                  >
                                    {match[1]}
                                  </span>
                                  <span
                                    className="text-slate-600 dark:text-slate-400"
                                    data-oid="cnikc0e"
                                  >
                                    {match[2]}
                                  </span>
                                </>
                              ) : (
                                <span
                                  className="text-slate-600 dark:text-slate-400"
                                  data-oid="bml68:x"
                                >
                                  {str}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {feedback.suggestions && (
                  <section data-oid="wgjok6z">
                    <h3
                      className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2 px-1"
                      data-oid="ce8hjdq"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-500" data-oid="pyftcx9" />
                      Tips for Next Time
                    </h3>
                    <div className="grid gap-2" data-oid="c.siyys">
                      {feedback.suggestions.slice(0, 4).map((sugg, i) => {
                        const match = sugg.match(/^\*\*(.*?)\*\*(.*)/);
                        return (
                          <div
                            key={i}
                            className="group flex items-start gap-2.5 text-[12px] text-slate-600 dark:text-slate-300 leading-normal bg-white dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:shadow-sm transition-all duration-300"
                            data-oid="rmnzi6x"
                          >
                            <div
                              className="mt-0.5 w-4 h-4 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0"
                              data-oid="1iho01y"
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full bg-amber-500"
                                data-oid="4m2ul4i"
                              ></div>
                            </div>
                            <div data-oid="cnak38z">
                              {match ? (
                                <>
                                  <span
                                    className="font-bold text-slate-900 dark:text-white mr-1"
                                    data-oid="fuva3t3"
                                  >
                                    {match[1]}
                                  </span>
                                  <span
                                    className="text-slate-600 dark:text-slate-400"
                                    data-oid="3hjhe.z"
                                  >
                                    {match[2]}
                                  </span>
                                </>
                              ) : (
                                <span
                                  className="text-slate-600 dark:text-slate-400"
                                  data-oid="ronjize"
                                >
                                  {sugg}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
