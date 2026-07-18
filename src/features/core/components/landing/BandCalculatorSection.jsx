import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Headphones, BookOpen, PenTool, Mic, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeading, SoftSection } from './LandingSection';

function getRecommendation(score) {
  if (score >= 8.0) {
    return {
      level: 'Expert User',
      desc: 'You have a fully operational command of the language. Focus on keeping your skills sharp with full-length mock tests.',
      hours: '20–30 hours of practice',
      focus: 'Drill IELTS Writing Task 2 structure to maintain consistency.',
    };
  } else if (score >= 7.0) {
    return {
      level: 'Good User',
      desc: 'You have an operational command of the language with occasional inaccuracies. You are close to your peak performance.',
      hours: '40–60 hours of practice',
      focus: 'Work on advanced vocabulary range and speaking pronunciation details.',
    };
  } else if (score >= 6.0) {
    return {
      level: 'Competent User',
      desc: 'You have a generally effective command of the language despite some inaccuracies. This is the typical Band 6.5 bottleneck.',
      hours: '80–100 hours of practice',
      focus: 'Fix grammatical redundancies in Writing and practice complex sentences in Speaking.',
    };
  } else {
    return {
      level: 'Modest User',
      desc: 'You have a partial command of the language. Focus on build core grammar, sentence structure, and vocabulary.',
      hours: '120+ hours of practice',
      focus: 'Master basic IELTS templates and build core grammar before taking full tests.',
    };
  }
}

function BandSliderRow({ name, value, set, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none transition-all duration-300 hover:border-slate-200 dark:hover:border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <span className="font-extrabold text-[15px] text-slate-800 dark:text-slate-200">
            {name}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            Score
          </span>
          <strong className="text-xl font-black text-slate-900 dark:text-white">
            {value.toFixed(1)}
          </strong>
        </div>
      </div>

      <div className="relative flex items-center select-none">
        <input
          type="range"
          min="4.0"
          max="9.0"
          step="0.5"
          value={value}
          onChange={(e) => set(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-primary"
          style={{
            background: `linear-gradient(to right, #5262ef 0%, #5262ef ${((value - 4) / 5) * 100}%, #e2e8f0 ${((value - 4) / 5) * 100}%)`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        <span>Band 4.0</span>
        <span>Band 6.5</span>
        <span>Band 9.0</span>
      </div>
    </div>
  );
}

export default function BandCalculatorSection({ handlePrimaryCta, viewport }) {
  const [listening, setListening] = useState(6.0);
  const [reading, setReading] = useState(6.5);
  const [writing, setWriting] = useState(5.5);
  const [speaking, setSpeaking] = useState(6.0);

  // IELTS Rounding Logic: Round to nearest 0.5 (e.g. 6.25 -> 6.5, 6.75 -> 7.0)
  const average = (listening + reading + writing + speaking) / 4;
  const overallBand = Math.round(average * 2) / 2;

  const recommendation = getRecommendation(overallBand);

  const sections = [
    {
      name: 'Listening',
      value: listening,
      set: setListening,
      icon: Headphones,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      name: 'Reading',
      value: reading,
      set: setReading,
      icon: BookOpen,
      color: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      name: 'Writing',
      value: writing,
      set: setWriting,
      icon: PenTool,
      color: 'text-violet-500 bg-violet-500/10',
    },
    {
      name: 'Speaking',
      value: speaking,
      set: setSpeaking,
      icon: Mic,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
  ];

  return (
    <SoftSection
      id="calculator"
      className="scroll-mt-24 py-16 md:py-24 border-y border-[#e9eef8]/70 dark:border-white/5 bg-gradient-to-b from-transparent via-slate-50/30 to-transparent dark:via-slate-900/10"
    >
      <div className="relative z-10 mx-auto max-w-[1450px] px-5 md:px-8">
        <SectionHeading
          eyebrow="Interactive band estimator"
          title="Calculate your overall"
          script="IELTS Band score."
          description="Adjust the individual section sliders to see how your scores combine under official IELTS rules and get tailored preparation advice."
          viewport={viewport}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-12 items-center">
          {/* Sliders Container */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            {sections.map((sec) => (
              <BandSliderRow key={sec.name} {...sec} />
            ))}
          </m.div>

          {/* Results Display */}
          <m.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 h-full"
          >
            <div className="relative h-full flex flex-col justify-between overflow-hidden rounded-[32px] border border-white/50 bg-white/70 dark:border-white/10 dark:bg-slate-950/70 p-6 sm:p-8 shadow-[0_24px_55px_-30px_rgba(30,41,59,0.08)] backdrop-blur-md">
              {/* Glow background decoration */}
              <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-4">
                  Estimated Overall Band
                </span>

                {/* Score Circle Indicator */}
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-md mb-5">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="6"
                      className="dark:stroke-slate-800"
                    />
                    <m.circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#5262ef"
                      strokeWidth="6"
                      strokeDasharray="276.4"
                      animate={{ strokeDashoffset: 276.4 - (276.4 * (overallBand - 4)) / 5 }}
                      transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <strong className="text-[42px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    {overallBand.toFixed(1)}
                  </strong>
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-[11px] font-black text-primary uppercase tracking-widest mb-6 shadow-sm">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  {recommendation.level}
                </div>

                <p className="text-sm font-semibold text-slate-655 dark:text-slate-300 leading-relaxed max-w-[320px]">
                  {recommendation.desc}
                </p>
              </div>

              <div className="relative z-10 mt-8 space-y-4 pt-6 border-t border-slate-100 dark:border-white/5 text-left">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Priority Focus Area
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                    {recommendation.focus}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Recommended Study Time
                  </span>
                  <p className="mt-1 text-xs font-bold text-slate-800 dark:text-white">
                    {recommendation.hours}
                  </p>
                </div>

                <Button
                  onClick={handlePrimaryCta}
                  size="lg"
                  className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-primary to-[#6256ed] text-xs font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Start Focused Practice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </SoftSection>
  );
}
