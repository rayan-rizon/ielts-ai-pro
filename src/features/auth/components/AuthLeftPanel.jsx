import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/shared/Logo';
import { Sparkles, CheckCircle2, Brain, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/cn';

const studentImages = [
  'https://images.unsplash.com/photo-1544168190-79c17527004f?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1548810020-ea2f1da35cff?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1558499932-9609acb6f443?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop&crop=face',
];

export function AuthLeftPanel() {
  const [animationStep, setAnimationStep] = useState(0);

  // Cycle through the AI analysis animation steps every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="hidden lg:flex flex-col h-full bg-gradient-to-br from-[#030712] via-[#0b0f19] to-[#0f172a] p-12 lg:col-span-3 justify-between relative overflow-hidden"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      data-oid="auth-left-panel"
    >
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[550px] h-[550px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] bg-indigo-600/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay for tech aesthetic */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="space-y-8 relative z-20">
        {/* Brand Logo Integration */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Logo size="lg" iconOnly={false} variant="dark" />
        </motion.div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="pb-1 text-[2.6rem] font-black tracking-tight text-white leading-[1.15]">
            Achieve Band 7.5+ with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-indigo-300">
              Personalized AI Feedback
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed font-medium">
            Unlock instant IELTS assessment for Writing & Speaking. Practice with timed mock exams,
            track your specific skill gaps, and follow a customized roadmap to success.
          </p>
        </div>

        {/* Interactive Dashboard / Assessment Preview Sandbox */}
        <div className="relative mt-2" data-oid="sandbox-container">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-lg opacity-75" />

          <div className="relative bg-zinc-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-2xl shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)] min-h-[290px] flex flex-col justify-between">
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase ml-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                  AI Writing Assistant v2.0
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-white/5 border border-white/10 rounded-full">
                Task 2 Essay
              </div>
            </div>

            {/* Content Switcher based on step */}
            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {animationStep === 0 && (
                  <motion.div
                    key="step-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Submitted Response:</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-slate-300 font-mono leading-relaxed relative">
                      "In my opinion, universities{' '}
                      <span className="relative inline-block px-1 rounded bg-yellow-500/20 text-yellow-300 border-b border-yellow-400">
                        must focusing
                      </span>{' '}
                      on practical skills rather than academic theories only."
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="inline-block w-1.5 h-3.5 bg-blue-400 ml-1.5 align-middle"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-blue-400/90 font-semibold animate-pulse mt-2">
                      <Brain className="w-3.5 h-3.5 animate-spin duration-3000" />
                      <span>AI running linguistic assessment...</span>
                    </div>
                  </motion.div>
                )}

                {animationStep === 1 && (
                  <motion.div
                    key="step-grammar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Grammar Analysis:</span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2.5">
                        <span className="text-red-400 font-bold mt-0.5">Original:</span>
                        <p className="line-through opacity-70">"...must focusing..."</p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold mt-0.5">Suggested:</span>
                        <div className="space-y-1">
                          <p className="font-bold">"...must focus..."</p>
                          <p className="text-[10px] text-slate-400 leading-normal font-sans">
                            The modal verb <strong>'must'</strong> should be followed by the base
                            form of the verb.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {animationStep === 2 && (
                  <motion.div
                    key="step-score"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-5 gap-4 items-center"
                  >
                    {/* Radial progress ring */}
                    <div className="col-span-2 flex flex-col items-center justify-center relative">
                      <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 112 112">
                        <circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="6"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="56"
                          cy="56"
                          r="46"
                          stroke="url(#progress-gradient)"
                          strokeWidth="6"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 46}
                          initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - 8.5 / 9) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient
                            id="progress-gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#818CF8" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-2xl font-black text-white leading-none"
                        >
                          8.5
                        </motion.span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">
                          Band Score
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Parameters */}
                    <div className="col-span-3 space-y-2">
                      {[
                        { label: 'Grammar Accuracy', score: 8.5, color: 'bg-emerald-500' },
                        { label: 'Lexical Resource', score: 8.0, color: 'bg-blue-500' },
                        { label: 'Coherence/Cohesion', score: 8.5, color: 'bg-indigo-500' },
                      ].map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{item.label}</span>
                            <span className="text-white">{item.score}</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.score / 9) * 100}%` }}
                              transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                              className={cn('h-full rounded-full', item.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dots navigation to represent steps */}
            <div className="flex justify-center gap-1.5 border-t border-white/5 pt-3.5 mt-3">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setAnimationStep(i)}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-300',
                    animationStep === i ? 'bg-blue-500 w-3' : 'bg-slate-700 hover:bg-slate-600'
                  )}
                  aria-label={`Go to animation step ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Footer Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex items-center justify-between pt-6 border-t border-white/10 relative z-20"
      >
        <div className="flex items-center space-x-4">
          <div className="flex -space-x-2.5">
            {studentImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="student avatar"
                className="w-9 h-9 rounded-full border-2 border-[#0f172a] shadow-lg ring-1 ring-white/10 object-cover"
              />
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-[#0f172a] bg-blue-600/90 backdrop-blur-md flex items-center justify-center text-[9px] font-black text-white ring-1 ring-white/10 shadow-lg">
              +15k
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-white font-black text-xs tracking-wide">Trusted worldwide</p>
            <div className="flex items-center text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Live: <span className="text-slate-300 ml-1">1,248 active online</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
          <span>Cambridge Standards</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500/80" />
        </div>
      </motion.div>
    </motion.div>
  );
}
