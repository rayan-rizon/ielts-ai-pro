import React, { useState, memo, useEffect, useRef } from 'react';
import { m, AnimatePresence, useInView } from 'framer-motion';
import {
  PenTool,
  Mic,
  BookOpen,
  Headphones,
  Zap,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Play,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const tabs = [
  {
    id: 'writing',
    label: 'Writing',
    icon: PenTool,
    color: 'orange',
    title: 'Master IELTS Writing with AI Feedback',
    desc: 'Get instant, examiner-grade feedback on your Task 1 & 2 essays. We pinpoint grammar gaps and vocabulary fixes to help you reach Band 7.5+.',
    accent: 'from-orange-500/20 to-red-500/20',
    features: ['Instant Band 7+ Assessment', 'Smart Grammar & Vocab Fixes'],
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: Mic,
    color: 'rose',
    title: 'Speak Confidently with AI Coaching',
    desc: 'Simulate real IELTS Speaking interviews. Our AI examiner analyzes your fluency, pronunciation, and flow to help you sound like a native speaker.',
    accent: 'from-rose-500/20 to-purple-500/20',
    features: ['Real-time Fluency Analysis', 'Pronunciation Correction'],
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    color: 'blue',
    title: 'Boost Reading Speed & Vocabulary',
    desc: 'Practice with official-style Reading passages. Get instant definitions and smart vocabulary tips without breaking your focus during the test.',
    accent: 'from-blue-500/20 to-indigo-500/20',
    features: ['One-tap Word Definitions', 'Exam-Real Practice Mode'],
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    color: 'purple',
    title: 'Ace the Listening Test with AI',
    desc: 'Train with authentic IELTS Listening tracks and interactive transcripts. Focus on tricky areas and improve your accuracy for a perfect Band 9.',
    accent: 'from-purple-500/20 to-pink-500/20',
    features: ['Interactive Smart Transcripts', 'Focus on High-Band Vocab'],
  },
];

const AUTOPLAY_INTERVAL = 6000; // 6 seconds

function FeatureShowcase({ viewport }) {
  const [activeTab, setActiveTab] = useState('writing');
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setActiveTab((prev) => {
        const currentIndex = tabs.findIndex((t) => t.id === prev);
        return tabs[(currentIndex + 1) % tabs.length].id;
      });
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [isInView, activeTab]);

  return (
    <section
      id="showcase"
      ref={containerRef}
      className="scroll-mt-24 pt-2 md:pt-4 pb-8 md:pb-12 relative overflow-hidden bg-background"
      data-oid="ty8dijo"
    >
      <div className="mx-auto max-w-7xl px-6" data-oid="hkq.wty">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="mb-10 text-center max-w-3xl mx-auto"
          data-oid="g8f-6jc"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest mb-6"
            data-oid="dq42xk4"
          >
            Smart Prep Tools
          </Badge>
          <m.h2 variants={itemVariants} className="heading-lg" data-oid="hd7zs80">
            AI-Powered Practice for <br data-oid="9k1abno" />{' '}
            <span className="text-gradient-primary" data-oid="87i7_2u">
              Every IELTS Skill
            </span>
          </m.h2>
        </m.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8" data-oid="p4_2rs4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 font-black text-sm uppercase tracking-wider relative overflow-hidden ${
                activeTab === tab.id
                  ? 'text-primary dark:text-blue-300 shadow-xl shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-oid="cs61btk"
            >
              {activeTab === tab.id && (
                <>
                  <m.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-2xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    data-oid="r6z54q8"
                  />

                  {/* Animated Progress Bar */}
                  <m.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    key={`progress-${activeTab}`}
                    transition={{ duration: AUTOPLAY_INTERVAL / 1000, ease: 'linear' }}
                    className="absolute bottom-0 left-0 h-1 bg-primary/30 rounded-b-2xl origin-left"
                    data-oid="ma_13hb"
                  />
                </>
              )}
              <tab.icon
                className={`h-5 w-5 relative z-10 ${activeTab === tab.id ? 'text-primary dark:text-blue-300' : 'text-muted-foreground'}`}
                data-oid="scsm_zh"
              />

              <span className="relative z-10" data-oid="3p5eb-8">
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        <div
          className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[400px]"
          data-oid="bs0x43:"
        >
          {/* Content Side */}
          <AnimatePresence mode="wait" data-oid="acwlgkr">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              data-oid="5w_zo.s"
            >
              {tabs.map(
                (tab) =>
                  tab.id === activeTab && (
                    <div key={tab.id} className="max-w-xl" data-oid="juk.nah">
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tab.accent} flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10`}
                        data-oid="rgc8-p2"
                      >
                        <tab.icon className="h-6 w-6 text-foreground" data-oid="sg7ah9a" />
                      </div>
                      <h3 className="heading-md mb-4 text-3xl font-black" data-oid="lauts1x">
                        {tab.title}
                      </h3>
                      <p
                        className="body-base mb-6 leading-relaxed font-medium text-muted-foreground"
                        data-oid="zgb9mm:"
                      >
                        {tab.desc}
                      </p>

                      <div className="space-y-4" data-oid="5so0br9">
                        {tab.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3" data-oid="1_u.5nm">
                            <div
                              className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                              data-oid="gkjpu4h"
                            >
                              {idx === 0 ? (
                                <CheckCircle2
                                  className="h-4 w-4 text-emerald-500"
                                  data-oid="oxldnlz"
                                />
                              ) : (
                                <Zap className="h-4 w-4 text-primary" data-oid="e7axbr1" />
                              )}
                            </div>
                            <span
                              className="text-sm font-black text-foreground uppercase tracking-tight"
                              data-oid="t.u1ku5"
                            >
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </m.div>
          </AnimatePresence>

          {/* Interactive Mockup Side */}
          <AnimatePresence mode="wait" data-oid="pyx4lwi">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotate: -2 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
              data-oid="m1b7.jw"
            >
              <div
                className="absolute inset-0 bg-primary/10 blur-[100px] rounded-[3rem]"
                data-oid="5c-kmcu"
              />

              {/* WRITING MOCKUP */}
              {activeTab === 'writing' && (
                <div
                  className="rounded-[1.5rem] p-6 lg:p-8 relative z-10 overflow-hidden border border-black/[0.1] dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl shadow-xl dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)]"
                  data-oid=".1sje6o"
                >
                  <div
                    className="flex justify-between items-center mb-6 border-b border-border/20 pb-4"
                    data-oid="c7hqhum"
                  >
                    <div className="flex items-center gap-3" data-oid="cpbl2h8">
                      <div
                        className="h-10 w-10 bg-orange-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20"
                        data-oid="5oo9irq"
                      >
                        8.0
                      </div>
                      <div data-oid="-24b4a8">
                        <p
                          className="text-[10px] font-black uppercase text-muted-foreground"
                          data-oid="sxya8nc"
                        >
                          Estimated Score
                        </p>
                        <p className="text-sm font-black text-foreground" data-oid="0stq0-s">
                          Advanced Academic
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="bg-emerald-500/10 text-emerald-900 dark:text-emerald-400 border-emerald-500/20"
                      data-oid="v1xe-g9"
                    >
                      PASSED
                    </Badge>
                  </div>
                  <div className="space-y-4" data-oid="7zd1nrj">
                    <m.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="p-4 bg-gradient-to-br from-red-500/5 to-red-500/8 dark:from-red-500/10 dark:to-[#1a0a0a] rounded-xl border border-red-500/15 dark:border-red-500/10 shadow-sm"
                      data-oid="vqgwffw"
                    >
                      <div
                        className="flex items-center gap-2 mb-2 text-[10px] font-black text-red-500 uppercase tracking-widest"
                        data-oid="v2od8pe"
                      >
                        <XCircle className="h-3 w-3" data-oid="77bajc7" /> Grammar Error
                      </div>
                      <p
                        className="text-sm text-foreground/80 line-through decoration-red-500"
                        data-oid="1qvgjym"
                      >
                        He go to the school everyday.
                      </p>
                      <p className="text-sm font-black text-foreground mt-1" data-oid="cp3kcei">
                        He{' '}
                        <span className="text-emerald-500 font-bold" data-oid="y6wg_s8">
                          goes
                        </span>{' '}
                        to school everyday.
                      </p>
                    </m.div>
                    <m.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-gradient-to-br from-primary/5 to-primary/8 dark:from-blue-500/10 dark:to-[#0a101a] rounded-xl border border-primary/15 dark:border-blue-500/10 shadow-sm"
                      data-oid="tvhrgb-"
                    >
                      <div
                        className="flex items-center gap-2 mb-2 text-[10px] font-black text-primary uppercase tracking-widest"
                        data-oid="_vnfi:g"
                      >
                        <TrendingUp className="h-3 w-3" data-oid="nhf5tb5" /> Vocabulary Lift
                      </div>
                      <p className="text-sm text-foreground" data-oid="wh22cmu">
                        "It is{' '}
                        <span className="bg-primary/20 px-1 rounded" data-oid="5x_5vdk">
                          important
                        </span>{' '}
                        for students..."
                      </p>
                      <p className="text-sm font-black text-foreground mt-1" data-oid="6f2qk2r">
                        Better:{' '}
                        <span className="text-primary italic" data-oid="y5w3q3l">
                          "It is crucial..."
                        </span>{' '}
                        or{' '}
                        <span className="text-primary italic" data-oid="6_hpupv">
                          "paramount..."
                        </span>
                      </p>
                    </m.div>
                  </div>
                </div>
              )}

              {/* SPEAKING MOCKUP */}
              {activeTab === 'speaking' && (
                <div
                  className="rounded-[1.5rem] p-5 lg:p-8 shadow-2xl relative z-10 overflow-hidden flex flex-col items-center border border-black/[0.1] dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)]"
                  data-oid="qb7eii_"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1.5 bg-rose-500/20"
                    data-oid="dv1lo7y"
                  >
                    <m.div
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      className="h-full bg-rose-500"
                      transition={{ duration: 2 }}
                      data-oid="zpx8a9y"
                    />
                  </div>
                  <div
                    className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 relative"
                    data-oid=".hyqxo4"
                  >
                    <m.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-rose-500/20 rounded-full"
                      data-oid="8ig9fuu"
                    />

                    <Mic className="h-9 w-9 text-rose-500 relative z-10" data-oid="prn0zho" />
                  </div>
                  <div className="w-full space-y-3 mb-6" data-oid="aec1pp.">
                    <div
                      className="bg-gradient-to-br from-muted/40 to-muted/60 dark:from-zinc-900/60 dark:to-zinc-900/40 p-3 rounded-t-xl rounded-br-xl text-sm font-medium text-foreground/80 dark:text-gray-300 max-w-[80%] border border-border/30 dark:border-white/5 shadow-sm"
                      data-oid="vc_qtbo"
                    >
                      "Tell me about your hometown, what do you like most about it?"
                    </div>
                    <div
                      className="bg-gradient-to-br from-rose-500 to-rose-600 p-3 rounded-t-xl rounded-bl-xl text-sm font-black text-white max-w-[80%] ml-auto shadow-lg shadow-rose-500/20 border border-rose-400/20"
                      data-oid="xg:qrsl"
                    >
                      "I come from Dhaka, which is the capital city. What I love most is the vibrant
                      culture..."
                    </div>
                  </div>
                  <div className="flex gap-4" data-oid="504:y6j">
                    <div className="text-center" data-oid="ks3f10t">
                      <p
                        className="text-[10px] font-black uppercase text-muted-foreground mb-1"
                        data-oid="3abyryd"
                      >
                        Fluency
                      </p>
                      <div className="text-lg font-black text-foreground" data-oid="17yh6.e">
                        7.5
                      </div>
                    </div>
                    <div className="w-px bg-border/40 h-8 mt-2" data-oid="4puvngq" />
                    <div className="text-center" data-oid="buen8su">
                      <p
                        className="text-[10px] font-black uppercase text-muted-foreground mb-1"
                        data-oid="6kio:13"
                      >
                        Pronunciation
                      </p>
                      <div className="text-lg font-black text-foreground" data-oid="icgpywd">
                        8.0
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* READING MOCKUP */}
              {activeTab === 'reading' && (
                <div
                  className="rounded-[1.5rem] p-8 lg:p-10 shadow-2xl relative z-10 overflow-hidden border border-black/[0.1] dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)]"
                  data-oid="mnjaozs"
                >
                  <div
                    className="font-serif text-lg leading-[1.8] text-foreground"
                    data-oid="3be24m."
                  >
                    "The study of{' '}
                    <m.span
                      whileHover={{ backgroundColor: 'hsla(var(--primary)/20%)' }}
                      className="bg-primary/10 border-b-2 border-primary px-1 font-bold text-foreground cursor-help transition-colors"
                      data-oid="1y_:_:k"
                    >
                      astrophysics
                    </m.span>{' '}
                    has revealed much about the early universe and the formation of celestial
                    bodies..."
                  </div>
                  <m.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 bg-white dark:bg-[#1a1c21] text-foreground p-6 rounded-2xl shadow-xl border border-border/40 dark:border-white/10 max-w-[300px] relative"
                    data-oid="xxomkvh"
                  >
                    <div className="flex items-center gap-2 mb-3" data-oid="mk-jc5y">
                      <BookOpen className="h-4 w-4 text-primary" data-oid="pn2-u15" />
                      <span
                        className="text-[10px] font-black uppercase tracking-widest text-primary"
                        data-oid="py0ks0e"
                      >
                        Vocabulary Insight
                      </span>
                    </div>
                    <div className="text-base font-black mb-1" data-oid="jqcx1ir">
                      astrophysics
                    </div>
                    <p
                      className="text-[10px] font-bold text-muted-foreground mb-3 italic"
                      data-oid="2.f51hx"
                    >
                      noun • /ˌæs.trəʊˈfɪz.ɪks/
                    </p>
                    <p
                      className="text-xs font-medium text-muted-foreground leading-relaxed mb-4"
                      data-oid="a0a1nc-"
                    >
                      The branch of astronomy dealing with the physics and chemistry of celestial
                      objects and the universe.
                    </p>
                    <div className="h-px bg-border/20 w-full mb-3" data-oid="90eazkq" />
                    <div
                      className="flex items-center gap-2 text-[10px] font-black text-primary hover:gap-3 transition-all cursor-pointer"
                      data-oid="t2fbu.8"
                    >
                      ADD TO VOCAB LAB <ChevronRight className="h-3 w-3" data-oid="fs9pskw" />
                    </div>
                  </m.div>
                </div>
              )}

              {/* LISTENING MOCKUP */}
              {activeTab === 'listening' && (
                <div
                  className="rounded-[1.5rem] p-6 lg:p-8 shadow-2xl relative z-10 overflow-hidden border border-black/[0.1] dark:border-white/10 bg-white/60 dark:bg-[#0f1115]/80 backdrop-blur-3xl dark:shadow-[0_0_40px_-10px_rgba(37,99,235,0.2)]"
                  data-oid="-cj5pc2"
                >
                  <div className="flex items-center gap-4 mb-8" data-oid="st-uweb">
                    <m.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30"
                      data-oid="7jo8-ns"
                    >
                      <Play className="h-6 w-6 ml-1" data-oid="uuph_9r" />
                    </m.button>
                    <div className="flex-1" data-oid="g0ectle">
                      <div
                        className="h-2 w-full bg-muted rounded-full overflow-hidden"
                        data-oid="85-4ccy"
                      >
                        <m.div
                          initial={{ width: 0 }}
                          animate={{ width: '42%' }}
                          className="h-full bg-primary"
                          transition={{ duration: 1.5 }}
                          data-oid="dkalv:i"
                        />
                      </div>
                      <div
                        className="flex justify-between mt-2 text-[10px] font-black text-muted-foreground font-mono"
                        data-oid="vzkqrj7"
                      >
                        <span data-oid="ercrdld">04:12</span>
                        <span data-oid="3fn6kcz">12:45</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 font-black" data-oid="lufo0t4">
                    <p
                      className="text-sm text-muted-foreground italic leading-relaxed"
                      data-oid="..2l5xj"
                    >
                      "...and that brings us to the main topic of today's lecture."
                    </p>
                    <m.p
                      animate={{
                        backgroundColor: [
                          'rgba(59,130,246,0)',
                          'rgba(59,130,246,0.1)',
                          'rgba(59,130,246,0)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-base text-foreground bg-primary/10 p-4 rounded-2xl border-l-[6px] border-primary leading-relaxed shadow-sm"
                      data-oid=":1_xxe8"
                    >
                      "The most significant change in the 19th century was the complete
                      restructuring of the urban transport system."
                    </m.p>
                    <p
                      className="text-sm text-muted-foreground italic leading-relaxed"
                      data-oid="wko89rs"
                    >
                      "This allowed for greater expansion into the suburbs..."
                    </p>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default memo(FeatureShowcase);
