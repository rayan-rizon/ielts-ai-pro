import React from 'react';
import { m, useScroll, useTransform } from 'framer-motion';
import Sparkles from 'lucide-react/icons/sparkles';
import ChevronRight from 'lucide-react/icons/chevron-right';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Users from 'lucide-react/icons/users';
import Shield from 'lucide-react/icons/shield';
import Star from 'lucide-react/icons/star';
import Zap from 'lucide-react/icons/zap';
import Mic from 'lucide-react/icons/mic';
import Target from 'lucide-react/icons/target';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import DashboardMockup from './DashboardMockup';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function TrustBadge({ icon: Icon, label, sub }) {
  return (
    <div
      className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-blue-50/50 dark:bg-blue-500/10 backdrop-blur-sm transition-all hover:bg-blue-50/80 dark:hover:bg-blue-500/20 cursor-default group border border-transparent hover:border-blue-100 dark:hover:border-blue-500/20 shadow-sm hover:shadow-md"
      data-oid="-z2a8bs"
    >
      <div
        className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300"
        data-oid="hwany7v"
      >
        <Icon
          className="h-4 w-4 text-blue-600 dark:text-blue-400 stroke-[2.5]"
          data-oid="kwoen4s"
        />
      </div>
      <div className="flex flex-col justify-center" data-oid="87jawsq">
        <p
          className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight"
          data-oid="56l7w59"
        >
          {label}
        </p>
        <p
          className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 group-hover:text-foreground transition-colors"
          data-oid="s7nv-z."
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

function FloatingBadge({ icon: Icon, text, subtext, className, delay = 0, animationClass }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'absolute z-30 hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background/80 dark:bg-[#0f1115]/90 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl scale-90 sm:scale-100 transform transition-transform hover:scale-105 duration-300',
        animationClass,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent rounded-xl" />
      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 border border-primary/20 dark:border-primary/30 flex items-center justify-center shadow-sm shrink-0">
        <Icon className="h-4 w-4 text-primary dark:text-blue-400" />
      </div>
      <div className="relative z-10">
        <p className="text-[8px] font-black uppercase text-muted-foreground dark:text-gray-400 leading-none mb-0.5">
          {text}
        </p>
        <p className="text-xs font-black text-foreground dark:text-white tracking-tight">
          {subtext}
        </p>
      </div>
    </m.div>
  );
}

export default function HeroSection({ handlePrimaryCta, handlePricing, isSignedIn }) {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -50]);

  return (
    <header className="relative pt-28 pb-12 lg:pt-36 lg:pb-24 overflow-hidden" data-oid="kb0rxxb">
      {/* Dynamic background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none" data-oid="h9mbr-i">
        <m.div
          style={{ y: y1 }}
          className="absolute top-[5%] left-[5%] w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[140px] opacity-30"
        />
        <m.div
          style={{ y: y2 }}
          className="absolute bottom-[0%] right-[5%] w-[45rem] h-[45rem] bg-indigo-500/20 rounded-full blur-[140px] opacity-30"
        />
        <div className="absolute top-[40%] left-[40%] w-[35rem] h-[35rem] bg-blue-400/15 rounded-full blur-[120px] opacity-20" />
      </div>

      <div
        className="mx-auto grid max-w-[85rem] grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8"
        data-oid="j_.sjtv"
      >
        <m.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-2xl"
          data-oid="vbjoldn"
        >
          <m.div
            variants={itemVariants}
            className="inline-flex flex-wrap items-center gap-3"
            data-oid="c4njzth"
          >
            <Badge
              className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-1.5"
              data-oid="oc5-4ak"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" data-oid="5:71p:g" />{' '}
              AI-Powered IELTS Coach
            </Badge>
            <div
              className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 px-3 py-1 text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              data-oid="kqenzeh"
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" data-oid="ydqhb4f" />
              4.9/5 Student Rating
            </div>
          </m.div>

          <h1 className="sr-only" data-oid="h1-seo">
            Master IELTS with AI-Powered Instant Feedback
          </h1>
          <m.h1
            variants={itemVariants}
            className="mt-6 text-5xl sm:text-6xl lg:text-[4.5rem] font-black tracking-tighter leading-[1.05]"
            data-oid="h07b3q9"
          >
            Master{' '}
            <span className="relative inline-block" data-oid="lgy18fi">
              <span className="relative z-10 text-primary">IELTS</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary/20 -rotate-2 -z-0 rounded-sm"></span>
            </span>{' '}
            with <br className="hidden lg:block" data-oid="x0mnclq" />
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-blue-500"
              data-oid="parsg11"
            >
              Instant AI Feedback
            </span>
          </m.h1>

          <m.p
            variants={itemVariants}
            className="mt-6 text-lg sm:text-xl font-medium text-muted-foreground leading-relaxed max-w-[90%]"
            data-oid="jmc_6ns"
          >
            Achieve your target band score faster. Get examiner-level grading, detailed corrections,
            and personalized daily study plans—all powered by advanced AI.
          </m.p>

          <m.div
            variants={itemVariants}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
            data-oid="ceul0gv"
          >
            <Button
              size="lg"
              className="h-14 rounded-2xl px-8 font-black text-lg shiny-button shadow-xl shadow-primary/25 border-t border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-b from-primary to-primary/90"
              onClick={handlePrimaryCta}
              data-oid="effhta_"
            >
              {isSignedIn ? 'Continue Learning' : 'Start Preparation Free'}{' '}
              <ChevronRight className="ml-2 h-5 w-5" data-oid="mpxvb:h" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 rounded-2xl border-2 border-border/50 bg-background/40 px-8 font-black text-lg backdrop-blur-md hover:bg-background/80 hover:border-primary/30 transition-all hover:-translate-y-1 shadow-sm"
              onClick={handlePricing}
              data-oid="rsndnfj"
            >
              View Pricing
            </Button>
          </m.div>

          <m.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4"
            data-oid="46fp3oi"
          >
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-400 group cursor-default hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all"
              data-oid="g2b4:y8"
            >
              <CheckCircle2 className="h-4 w-4" data-oid="95mhv7r" />
              <span
                className="text-[13px] font-bold text-emerald-900 dark:text-emerald-300"
                data-oid="2ygi_67"
              >
                Examiner-Level Scoring
              </span>
            </div>
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-400 group cursor-default hover:bg-blue-500/15 hover:border-blue-500/30 transition-all"
              data-oid="p.kri7d"
            >
              <Zap className="h-4 w-4" data-oid="pu21q1z" />
              <span
                className="text-[13px] font-bold text-blue-900 dark:text-blue-300"
                data-oid="3axxoyh"
              >
                Instant Results
              </span>
            </div>
          </m.div>

          <m.div variants={itemVariants} className="mt-12 flex flex-wrap gap-4" data-oid="kk.4mge">
            <TrustBadge
              icon={Users}
              label="10,000+ Users"
              sub="Global Community"
              data-oid="hj1ehcg"
            />
            <TrustBadge
              icon={Shield}
              label="Band 8.0+ Achievers"
              sub="Proven Success"
              data-oid="ja36yim"
            />
          </m.div>
        </m.div>

        <div className="relative z-10 lg:ml-auto w-full max-w-[600px] mt-10 lg:mt-0">
          <m.div
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glossy Backdrop for Mockup */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-indigo-500/30 rounded-[2.5rem] blur-2xl opacity-50 -z-10"></div>

            <DashboardMockup data-oid="c9jel10" />

            {/* Floating Elements connected to the Mockup context */}
            <FloatingBadge
              icon={Target}
              text="IELTS Goal"
              subtext="Target: Band 8.0"
              className="-top-6 -left-8"
              animationClass="animate-float-slow"
              delay={0.6}
            />

            <FloatingBadge
              icon={Mic}
              text="Speaking Fluency"
              subtext="Improved +1.5"
              className="top-1/3 -right-12"
              animationClass="animate-float-delayed"
              delay={0.8}
            />
          </m.div>
        </div>
      </div>
    </header>
  );
}
