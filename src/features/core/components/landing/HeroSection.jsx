import React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import ArrowRight from 'lucide-react/icons/arrow-right';
import CalendarDays from 'lucide-react/icons/calendar-days';
import Check from 'lucide-react/icons/check';
import CirclePlay from 'lucide-react/icons/circle-play';
import Mic from 'lucide-react/icons/mic';
import PenLine from 'lucide-react/icons/pen-line';
import Quote from 'lucide-react/icons/quote';
import Sparkles from 'lucide-react/icons/sparkles';
import Star from 'lucide-react/icons/star';
import Bot from 'lucide-react/icons/bot';
import TrendingUp from 'lucide-react/icons/trending-up';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const reveal = {
  hidden: { opacity: 0, y: 18, filter: 'blur(5px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

function FloatingCard({ className, delay = 0, children, label }) {
  const reducedMotion = useReducedMotion();

  return (
    <m.div
      aria-label={label}
      initial={{ opacity: 0, scale: 0.92, y: 18 }}
      animate={
        reducedMotion
          ? { opacity: 1, scale: 1, y: 0 }
          : { opacity: 1, scale: 1, y: [0, -7, 0], rotate: [0, -0.45, 0] }
      }
      transition={
        reducedMotion
          ? { delay, duration: 0.4 }
          : {
              opacity: { delay, duration: 0.5 },
              scale: { delay, duration: 0.5 },
              y: { delay: delay + 0.45, duration: 4.6, repeat: Infinity, ease: 'easeInOut' },
              rotate: {
                delay: delay + 0.45,
                duration: 4.6,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
      }
      className={cn(
        'absolute z-30 rounded-2xl border border-white/40 bg-white/70 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/5',
        className
      )}
    >
      {children}
    </m.div>
  );
}

function CardHeading({ icon: Icon, title, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/20',
    green:
      'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20',
    violet:
      'bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/20',
  };

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn('flex h-8 w-8 items-center justify-center rounded-xl shadow-sm', tones[tone])}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-[11px] font-extrabold tracking-tight text-[#142344] dark:text-white sm:text-xs">
        {title}
      </p>
    </div>
  );
}

function SpeakingCard() {
  return (
    <FloatingCard
      label="Speaking feedback preview"
      delay={0.55}
      className="left-0 sm:-left-4 lg:-left-8 xl:-left-10 top-[50px] w-[174px] p-3 sm:w-[205px] sm:p-4 lg:top-[64px]"
    >
      <CardHeading icon={Mic} title="Speaking Feedback" tone="green" />
      <div className="mt-3 rounded-xl bg-[#fbfdfd]/60 p-3 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-slate-800 dark:text-white">7.0</span>
          <span className="bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
            Good
          </span>
        </div>
        <p className="mt-2 text-[9px] font-medium leading-relaxed text-[#59657a] dark:text-slate-400 sm:text-[10px]">
          Great ideas! Work on fluency and pronunciation.
        </p>
      </div>
      <span className="w-full mt-3 justify-center inline-flex items-center gap-1 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all duration-200 cursor-pointer">
        View Feedback <ArrowRight className="ml-1 h-3 w-3" />
      </span>
    </FloatingCard>
  );
}

function ProgressCard() {
  return (
    <FloatingCard
      label="Overall progress preview"
      delay={0.72}
      className="right-0 sm:-right-6 lg:-right-12 xl:-right-16 top-4 w-[176px] p-3 sm:top-8 sm:w-[222px] sm:p-4"
    >
      <CardHeading icon={TrendingUp} title="Overall Progress" tone="blue" />
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-3xl font-black tracking-tight text-[#315ee9] dark:text-blue-400">
            7.0
          </p>
          <p className="mt-1 text-[10px] font-extrabold text-[#238b78] bg-emerald-100/50 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
            Target 7.5
          </p>
        </div>
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="rgba(0, 0, 0, 0.05)"
              strokeWidth="3"
              className="dark:stroke-white/5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="3"
              strokeDasharray="78 22"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="progressGrad" x1="0" y1="0" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xs font-black text-[#315ee9] dark:text-blue-400">78%</span>
        </div>
      </div>
      <svg viewBox="0 0 170 42" className="mt-3 h-9 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hero-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6483ff" stopOpacity=".24" />
            <stop offset="100%" stopColor="#6483ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M2 34 C18 17,28 31,43 21 S66 31,78 18 S98 25,113 14 S139 17,168 5 L168 42 L2 42 Z"
          fill="url(#hero-chart-fill)"
        />
        <path
          d="M2 34 C18 17,28 31,43 21 S66 31,78 18 S98 25,113 14 S139 17,168 5"
          fill="none"
          stroke="#4f6cf0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="168" cy="5" r="4" fill="#4f6cf0" stroke="white" strokeWidth="2" />
      </svg>
    </FloatingCard>
  );
}

function StudyPlanCard() {
  const tasks = [
    { name: 'Listening Practice', status: 'done' },
    { name: 'Reading Strategy', status: 'done' },
    { name: 'Writing Task 2', status: 'in-progress', progress: '75%' },
    { name: 'Speaking Practice', status: 'pending' },
  ];

  return (
    <FloatingCard
      label="Personalized study plan preview"
      delay={0.88}
      className="bottom-[86px] right-0 sm:-right-8 lg:-right-16 xl:-right-22 w-[190px] p-3 sm:bottom-[116px] sm:w-[238px] sm:p-4"
    >
      <CardHeading icon={CalendarDays} title="Personalized Study Plan" tone="violet" />
      <div className="mt-3 rounded-xl bg-[#fcfbff]/60 p-3 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
        <p className="text-[10px] font-bold text-[#35415c] dark:text-slate-200">
          Study 30 mins daily
        </p>
        <div className="mt-2.5 space-y-2">
          {tasks.map((task) => (
            <div
              key={task.name}
              className="flex items-center justify-between gap-2 text-[9px] font-semibold text-[#526079] dark:text-slate-300 sm:text-[10px]"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full',
                    task.status === 'done' && 'bg-[#58c98a] text-white',
                    task.status === 'in-progress' && 'bg-[#58c98a] text-white',
                    task.status === 'pending' && 'border-2 border-[#7153dc]'
                  )}
                >
                  {task.status !== 'pending' ? <Check className="h-2.5 w-2.5" /> : null}
                </span>
                {task.name}
              </span>
              {task.status === 'done' && <Check className="h-3.5 w-3.5 text-[#58c98a]" />}
              {task.status === 'in-progress' && (
                <span className="rounded bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 text-[8px] font-extrabold text-[#7153dc] dark:text-violet-300">
                  {task.progress}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <span className="w-full mt-3 justify-center inline-flex items-center gap-1 bg-violet-500/5 hover:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all duration-200 cursor-pointer">
        View Full Plan <ArrowRight className="ml-1 h-3 w-3" />
      </span>
    </FloatingCard>
  );
}

function WritingCard() {
  return (
    <FloatingCard
      label="Writing evaluation preview"
      delay={1.02}
      className="bottom-14 left-0 sm:-left-8 lg:-left-12 xl:-left-16 hidden w-[222px] p-3 sm:p-3.5 sm:block"
    >
      <CardHeading icon={PenLine} title="Writing Evaluation" tone="blue" />
      <div className="mt-2.5 space-y-2">
        {[
          ['Task Achievement', '6.5'],
          ['Coherence & Cohesion', '6.5'],
          ['Lexical Resource', '7.0'],
          ['Grammatical Range', '6.5'],
        ].map(([label, score]) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-[#526079] dark:text-slate-300">
              <span>{label}</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">{score}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500/70 rounded-full"
                style={{ width: `${(parseFloat(score) / 9) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <span className="w-full mt-3 justify-center inline-flex items-center gap-1 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 rounded-lg px-2.5 py-1.2 text-[10px] font-bold transition-all duration-200 cursor-pointer">
        View Full Report <ArrowRight className="ml-1 h-3 w-3" />
      </span>
    </FloatingCard>
  );
}

function StudentVisual() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative mx-auto min-h-[500px] w-full max-w-[760px] overflow-visible sm:min-h-[590px] lg:min-h-[650px]"
      aria-label="IELTS AI Pro learning experience preview"
    >
      <m.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={
          reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -4, 0] }
        }
        transition={
          reducedMotion
            ? { duration: 0.45 }
            : {
                opacity: { duration: 0.75, delay: 0.18 },
                scale: { duration: 0.75, delay: 0.18 },
                y: { duration: 6.4, delay: 1, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="absolute bottom-12 left-6 right-6 top-14 overflow-hidden rounded-[2rem] border-2 border-white bg-[#eef2ff] shadow-[0_34px_80px_-30px_rgba(54,75,140,0.45)] dark:border-slate-800 dark:bg-slate-900 sm:bottom-8 sm:left-12 sm:right-10 sm:top-8 lg:left-14"
      >
        <img
          src="/ielts-hero-student.webp"
          alt="IELTS learner studying with a laptop"
          className="h-full w-full object-cover object-[53%_center]"
          width="1200"
          height="900"
          loading="eager"
          data-oid="hero-student-img"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#6c79ef]/10 via-transparent to-white/15" />
      </m.div>

      <SpeakingCard />
      <ProgressCard />
      <WritingCard />
      <StudyPlanCard />

      <FloatingCard
        label="AI tutor preview"
        delay={1.14}
        className="bottom-0 left-6 flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4 sm:bottom-2 sm:left-auto sm:right-12"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#4b6cf0] to-[#7d58eb] text-white shadow-lg">
          <Bot className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 animate-pulse" />
        </span>
        <div>
          <p className="text-[10px] font-extrabold text-[#142344] dark:text-white">
            Hi! I’m your AI tutor.
          </p>
          <p className="mt-0.5 hidden text-[9px] font-medium text-[#67738b] sm:block">
            Ask me anything about IELTS!
          </p>
        </div>
      </FloatingCard>
    </div>
  );
}

function LearnerProof() {
  const studentImages = [
    'https://images.unsplash.com/photo-1544168190-79c17527004f?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1548810020-ea2f1da35cff?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1558499932-9609acb6f443?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop&crop=face',
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex -space-x-2.5" aria-label="IELTS learners worldwide">
          {studentImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="IELTS learner avatar"
              className="h-11 w-11 rounded-full border-[3px] border-white object-cover shadow-sm dark:border-slate-950"
            />
          ))}
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-[#eef1ff] text-[11px] font-extrabold text-[#4d64e9] dark:border-slate-950 dark:bg-blue-950">
            10K+
          </span>
        </div>
        <div>
          <div className="flex gap-1 text-[#ffb21d]">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <p className="mt-1 text-xs font-semibold text-[#536079] dark:text-slate-400">
            Loved by 10,000+ IELTS learners
          </p>
          <p className="text-[10px] font-medium text-[#8a94a8]">from 130+ countries</p>
        </div>
      </div>

      <div className="mt-6 max-w-[560px] rounded-2xl border border-[#e4eaf7] bg-white/80 px-5 py-4 shadow-[0_18px_40px_-30px_rgba(40,65,120,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex gap-4">
          <Quote className="mt-1 h-7 w-7 shrink-0 fill-[#bcb0f3] text-[#bcb0f3]" />
          <div>
            <p className="text-[11px] font-medium leading-5 text-[#4d5971] dark:text-slate-300 sm:text-xs">
              “IELTS AI Pro helped me improve from Band 6.5 to 7.5 in just 8 weeks. The feedback is
              detailed and easy to understand.”
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#536079] dark:text-slate-400">
              <span>— Ananya, India</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[#238b78] dark:bg-emerald-500/10 dark:text-emerald-300">
                Band 7.5 Overall
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ handlePrimaryCta, handlePricing, isSignedIn }) {
  return (
    <header className="relative bg-[#fcfdff] pb-16 pt-28 dark:bg-[#070912] lg:pb-20 lg:pt-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-[34rem] w-[34rem] rounded-full bg-blue-200/20 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-8 h-[38rem] w-[38rem] rounded-full bg-violet-200/20 blur-[140px] dark:bg-violet-600/10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f3f7ff]/50 to-transparent dark:from-slate-950/40" />
      </div>

      <div className="relative mx-auto grid max-w-[1540px] items-center gap-12 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 xl:px-12 2xl:px-16">
        <m.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="relative z-10 min-w-0 lg:py-5"
        >
          <m.div
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-[#bfe9df] bg-[#f2fbf8] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#218b75] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 sm:text-[11px]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#9bd9cb] text-[#218b75] dark:text-emerald-300">
              <Sparkles className="h-3 w-3" />
            </span>
            AI-powered. Human-focused.
          </m.div>

          <m.h1
            variants={reveal}
            className="mt-6 text-[3.3rem] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#07142f] dark:text-white sm:text-[4rem] lg:text-[3.65rem] xl:text-[4.15rem] 2xl:text-[4.45rem]"
          >
            Smarter Practice.
            <br />
            Higher Scores.
            <span
              className="relative mt-2 block w-fit pr-7 text-[0.84em] font-black italic leading-[1.05] tracking-[-0.035em] text-[#5262ef]"
              style={{
                fontFamily: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
                WebkitTextStroke: '1px #5262ef',
              }}
            >
              Your Dream, Closer.
              <svg
                className="absolute -bottom-3 left-[35%] h-3 w-[38%] text-[#8dc9f2]"
                viewBox="0 0 180 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 11 C44 5, 103 3, 177 8"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                className="absolute -right-7 -top-2.5 h-6 w-6 text-[#2cc2a0]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 10l12-5" />
                <path d="M2 14h16" />
                <path d="M4 18l12 5" />
              </svg>
            </span>
          </m.h1>

          <m.p
            variants={reveal}
            className="mt-9 max-w-[560px] text-base font-medium leading-7 text-[#515d74] dark:text-slate-300 sm:text-[17px]"
          >
            IELTS AI Pro gives you personalized feedback, a smart study plan, and real-time support
            so you can learn faster, stay motivated, and reach your target band with confidence.
          </m.p>

          <m.div variants={reveal} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handlePrimaryCta}
              size="lg"
              className="h-14 rounded-xl bg-gradient-to-r from-[#3f6df1] to-[#6256ed] px-7 text-base font-bold text-white shadow-[0_15px_32px_-14px_rgba(66,88,232,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-14px_rgba(66,88,232,0.72)]"
            >
              {isSignedIn ? 'Continue Learning' : 'Start Free Test'}
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
            <Button
              onClick={handlePricing}
              size="lg"
              variant="outline"
              className="h-14 rounded-xl border-[#d7deeb] bg-white/80 px-6 text-base font-bold text-[#17223d] shadow-sm backdrop-blur-sm hover:border-[#5365ee]/40 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              Explore Features <CirclePlay className="ml-3 h-5 w-5 text-[#5262ef]" />
            </Button>
          </m.div>

          <m.div variants={reveal}>
            <LearnerProof />
          </m.div>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="relative z-10 min-w-0 overflow-visible"
        >
          <StudentVisual />
        </m.div>
      </div>
    </header>
  );
}
