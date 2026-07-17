import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const modulesData = [
  {
    id: 'reading',
    icon: BookOpen,
    label: 'Reading Lab',
    sub: 'Active reading & highlights',
    colorColor: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    activeBorder:
      'border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-500/10 ring-1 ring-blue-500/20 shadow-md shadow-blue-500/5',
    content: (
      <div className="flex flex-col gap-4 w-full h-full justify-center">
        <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" /> Academic Reading
        </h3>
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-200/50 dark:bg-blue-500/20" />
          </div>
          <div className="h-4 w-[90%] bg-slate-100 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-[95%] bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
            <div className="absolute top-0 right-10 h-full w-1/4 bg-amber-200/50 dark:bg-amber-500/20" />
          </div>
          <div className="h-4 w-[80%] bg-slate-100 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-slate-900 border border-blue-100 dark:border-blue-800/50 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-4 w-4" /> Matching Headings Strategy
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            AI highlights the exact sentence containing the answer justification.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'listening',
    icon: Headphones,
    label: 'Listening Studio',
    sub: 'Full audio & transcripts',
    colorColor: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    activeBorder:
      'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-500/10 ring-1 ring-emerald-500/20 shadow-md shadow-emerald-500/5',
    content: (
      <div className="flex flex-col gap-4 w-full h-full justify-center">
        <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
          <Headphones className="h-5 w-5 text-emerald-500" /> Section 3 Dialogue
        </h3>
        <div className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30">
            <PlayCircle className="h-5 w-5 text-white fill-emerald-500" />
          </div>
          <div className="flex-grow">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full w-[45%] bg-emerald-500 rounded-full" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground">
              <span>01:12</span>
              <span>04:30</span>
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-2">
          <div className="flex gap-3 items-start">
            <div className="text-xs font-black text-slate-400 mt-0.5">M</div>
            <div className="text-sm font-medium text-foreground bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl rounded-tl-sm">
              So, regarding the assignment...
            </div>
          </div>
          <div className="flex gap-3 items-start flex-row-reverse">
            <div className="text-xs font-black text-emerald-400 mt-0.5">F</div>
            <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-xl rounded-tr-sm">
              Yes, I've gathered the data.
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'writing',
    icon: PenTool,
    label: 'Writing Coach',
    sub: 'Instant band scoring',
    colorColor: 'text-violet-500 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    activeBorder:
      'border-violet-500 text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-500/10 ring-1 ring-violet-500/20 shadow-md shadow-violet-500/5',
    content: (
      <div className="flex flex-col gap-4 w-full h-full justify-center">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-xl font-black text-foreground flex items-center gap-2">
            <PenTool className="h-5 w-5 text-violet-500" /> Task 2 Essay
          </h3>
          <div className="px-3 py-1 bg-violet-500 text-white text-sm font-black rounded-lg shadow-lg shadow-violet-500/30">
            Band 7.5
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium leading-relaxed relative">
          The chart illustrates the{' '}
          <span className="underline decoration-red-400 decoration-wavy cursor-help">
            amount of
          </span>{' '}
          <span className="absolute -top-3 left-32 text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded shadow-sm border border-red-200">
            proportion of
          </span>{' '}
          people visiting the museum. Overall, there was a significant increase in...
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/50">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Lexical Resource
            </div>
            <div className="h-1.5 w-full bg-violet-200 dark:bg-violet-900 rounded-full overflow-hidden">
              <div className="h-full w-[80%] bg-violet-500 rounded-full" />
            </div>
          </div>
          <div className="p-3 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/50">
            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Task Response
            </div>
            <div className="h-1.5 w-full bg-violet-200 dark:bg-violet-900 rounded-full overflow-hidden">
              <div className="h-full w-[90%] bg-violet-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'speaking',
    icon: Mic,
    label: 'Speaking Drills',
    sub: 'Fluency & pronunciation',
    colorColor: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    activeBorder:
      'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 shadow-md shadow-amber-500/5',
    content: (
      <div className="flex flex-col items-center justify-center gap-6 w-full h-full text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-20 animate-pulse" />
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30 relative z-10">
            <Mic className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
            Part 2: Long Turn
          </h4>
          <p className="text-lg font-black text-foreground">
            Describe a memorable journey you made...
          </p>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-1 rounded-full bg-amber-500 animate-pulse`}
              style={{
                height: `${Math.max(10, Math.random() * 30 + 10)}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    ),
  },
];

export default function ModulesSection({ handlePrimaryCta, viewport }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section
      id="modules"
      className="scroll-mt-24 py-16 md:py-24 bg-slate-50/50 dark:bg-slate-950/20 border-y border-border/40 overflow-hidden relative"
      data-oid="xhcshp:"
    >
      {/* Background Decorators */}
      <div className="absolute -left-60 -top-60 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-[85rem] px-6 relative z-10" data-oid="gk-5:wg">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="text-center max-w-3xl mx-auto mb-16"
          data-oid="5d47la3"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-5 py-2 text-[11px] font-black uppercase tracking-widest mb-6 shadow-sm"
            data-oid="968ti3y"
          >
            Complete Coverage
          </Badge>
          <m.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-black tracking-tighter"
            data-oid="dzz6rpa"
          >
            Interactive practice for{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500"
              data-oid="5a8:3ol"
            >
              Every Module
            </span>
          </m.h2>
          <m.p
            variants={itemVariants}
            className="mt-6 text-lg font-medium text-muted-foreground max-w-2xl mx-auto"
            data-oid="mql.uc8"
          >
            Stop guessing your score. Experience realistic mock tests with targeted AI feedback for
            Reading, Listening, Writing, and Speaking.
          </m.p>
        </m.div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          {/* Tabs Navigation */}
          <m.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewport}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-[45%] flex flex-col gap-3"
          >
            {modulesData.map((mod, idx) => {
              const isActive = activeTab === idx;
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    'w-full text-left flex items-center gap-4 rounded-xl p-4 transition-all duration-300 border',
                    isActive
                      ? mod.activeBorder
                      : 'border-transparent hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-border/50 text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 shadow-inner',
                      isActive ? 'bg-background shadow-sm' : mod.bgColor
                    )}
                  >
                    <Icon
                      className={cn('h-6 w-6', isActive ? mod.colorColor : 'text-foreground/70')}
                    />
                  </div>
                  <div>
                    <div className="text-lg font-black tracking-tight">{mod.label}</div>
                    <div
                      className={cn(
                        'text-[13px] font-semibold',
                        isActive ? mod.colorColor : 'text-muted-foreground'
                      )}
                    >
                      {mod.sub}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="mt-8 ml-2">
              <Button
                size="lg"
                className="h-14 w-full sm:w-auto rounded-2xl px-8 font-black shiny-button shadow-xl shadow-primary/20 bg-gradient-to-b from-primary to-primary/90 text-[15px]"
                onClick={handlePrimaryCta}
                data-oid="u1e1k_8"
              >
                Start Practicing Free <ArrowRight className="ml-2 h-5 w-5" data-oid="gob:imf" />
              </Button>
            </div>
          </m.div>

          {/* Interactive Preview Pane */}
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewport}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-[55%] h-[450px] lg:h-[500px] relative"
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] border border-white/40 dark:border-white/10 shadow-2xl overflow-hidden p-10 flex items-center justify-center">
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

              <AnimatePresence mode="wait">
                <m.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full h-full max-w-md mx-auto relative z-10"
                >
                  {modulesData[activeTab].content}
                </m.div>
              </AnimatePresence>
            </div>

            {/* Background Glow */}
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[4rem] z-0 pointer-events-none" />
          </m.div>
        </div>
      </div>
    </section>
  );
}
