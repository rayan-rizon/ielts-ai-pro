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

/**
 * The marketing side of the login card. Deliberately a permanent dark surface
 * (the Logo's `variant="dark"` forces the light logotype for exactly this
 * case) regardless of site theme — a fixed brand panel next to a
 * theme-aware form is a normal pattern. What changed is the palette: this
 * used to run generic blue/indigo-500 with blurred rainbow orbs and a grain
 * texture, none of which exist anywhere else in the app. It now uses the
 * app's own dark card token (`#131315` on `#070913`-adjacent `#0d0e1a`) and
 * a neutral monochrome accent (white/slate, no brand color), with the same quiet dot-grid backdrop
 * the admin panel and dashboard already use instead of the mesh-orb glow.
 */
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
      className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#0d0e1a] p-8 lg:col-span-3 lg:flex"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      data-oid="auth-left-panel"
    >
      {/* Quiet instrument-panel backdrop — the same dot grid used behind the
          admin console, rather than a blurred rainbow mesh. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-size:22px_22px] bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.06)_1px,transparent_0)]"
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-white/[0.06] blur-[120px]" />

      <div className="relative z-20 space-y-6">
        {/* Brand Logo Integration */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Logo size="md" iconOnly={false} variant="dark" />
        </motion.div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h1 className="pb-1 text-3xl font-extrabold leading-[1.15] tracking-tight text-white">
            Achieve Band 7.5+ with <br />
            <span className="bg-gradient-to-r from-slate-300 to-white bg-clip-text text-transparent">
              Personalized AI Feedback
            </span>
          </h1>
          <p className="max-w-md text-sm font-medium leading-relaxed text-slate-400">
            Unlock instant IELTS assessment for Writing & Speaking. Practice with timed mock exams,
            track your specific skill gaps, and follow a customized roadmap to success.
          </p>
        </div>

        {/* Interactive Dashboard / Assessment Preview Sandbox */}
        <div className="relative mt-1" data-oid="sandbox-container">
          <div className="relative flex h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.10] bg-[#131315] p-5 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]">
            {/* Window header */}
            <div className="mb-3.5 flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                </div>
                <span className="ml-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <Sparkles className="h-3 w-3 animate-pulse text-slate-300" />
                  AI Writing Assistant v2.0
                </span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-slate-400">
                Task 2 Essay
              </div>
            </div>

            {/* Content Switcher based on step */}
            <div className="flex flex-1 flex-col justify-center">
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
                      <FileText className="h-4 w-4 text-slate-300" />
                      <span>Submitted Response:</span>
                    </div>
                    <div className="relative rounded-xl border border-white/[0.05] bg-white/[0.05] p-3 font-mono text-xs leading-relaxed text-slate-300">
                      "In my opinion, universities{' '}
                      <span className="relative inline-block rounded border-b border-amber-400 bg-amber-500/20 px-1 text-amber-300">
                        must focusing
                      </span>{' '}
                      on practical skills rather than academic theories only."
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="ml-1.5 inline-block h-3.5 w-1.5 align-middle bg-slate-300"
                      />
                    </div>
                    <div className="mt-2 flex animate-pulse items-center gap-2 text-[11px] font-semibold text-slate-300">
                      <Brain className="h-3.5 w-3.5" />
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
                      <MessageSquare className="h-4 w-4 text-slate-300" />
                      <span>Grammar Analysis:</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                        <span className="mt-0.5 font-bold text-rose-400">Original:</span>
                        <p className="opacity-70 line-through">"...must focusing..."</p>
                      </div>

                      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                        <span className="mt-0.5 font-bold text-emerald-400">Suggested:</span>
                        <div className="space-y-1">
                          <p className="font-bold">"...must focus..."</p>
                          <p className="font-sans text-[10px] font-normal leading-normal text-slate-400">
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
                    className="grid grid-cols-5 items-center gap-4"
                  >
                    {/* Radial progress ring */}
                    <div className="relative col-span-2 flex flex-col items-center justify-center">
                      <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 112 112">
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
                            <stop offset="0%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#e2e8f0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-2xl font-extrabold leading-none text-white"
                        >
                          8.5
                        </motion.span>
                        <span className="mt-1 text-[8px] font-bold uppercase leading-none tracking-widest text-slate-500">
                          Band Score
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Parameters */}
                    <div className="col-span-3 space-y-2">
                      {[
                        { label: 'Grammar Accuracy', score: 8.5, color: 'bg-emerald-500' },
                        { label: 'Lexical Resource', score: 8.0, color: 'bg-slate-400' },
                        { label: 'Coherence/Cohesion', score: 8.5, color: 'bg-slate-300' },
                      ].map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>{item.label}</span>
                            <span className="text-white">{item.score}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
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
            <div className="mt-3 flex justify-center gap-1.5 border-t border-white/[0.05] pt-3.5">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setAnimationStep(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    animationStep === i ? 'w-3 bg-white' : 'w-1.5 bg-slate-700 hover:bg-slate-600'
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
        className="relative z-20 flex items-center justify-between border-t border-white/[0.10] pt-5"
      >
        <div className="flex items-center space-x-4">
          <div className="flex -space-x-2.5">
            {studentImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="student avatar"
                className="h-9 w-9 rounded-full border-2 border-[#0d0e1a] object-cover shadow-lg ring-1 ring-white/10"
              />
            ))}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0d0e1a] bg-slate-700/90 text-[9px] font-extrabold text-white shadow-lg ring-1 ring-white/10">
              +15k
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-extrabold tracking-wide text-white">Trusted worldwide</p>
            <div className="flex items-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Live: <span className="ml-1 text-slate-300">1,248 active online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <span>Cambridge Standards</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400/80" />
        </div>
      </motion.div>
    </motion.div>
  );
}
