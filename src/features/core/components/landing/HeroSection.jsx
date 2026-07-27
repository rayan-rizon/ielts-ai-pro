import React from 'react';
import ArrowRight from 'lucide-react/icons/arrow-right';
import CalendarDays from 'lucide-react/icons/calendar-days';
import Check from 'lucide-react/icons/check';
import CirclePlay from 'lucide-react/icons/circle-play';
import Mic from 'lucide-react/icons/mic';
import PenLine from 'lucide-react/icons/pen-line';
import Quote from 'lucide-react/icons/quote';
import Sparkles from 'lucide-react/icons/sparkles';
import Star from 'lucide-react/icons/star';
import TrendingUp from 'lucide-react/icons/trending-up';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

const HeroMotionEffects = React.lazy(() => import('./HeroMotionEffects'));

function FloatingCard({ className, delay = 0, children, label }) {
  return (
    <div
      aria-label={label}
      style={{ '--hero-float-delay': `${delay}s` }}
      data-hero-motion="float"
      className={cn(
        'hero-floating-card absolute z-30 rounded-2xl border border-violet-200/70 bg-white/85 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1),0_0_0_1px_rgba(109,85,238,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)] transition-shadow duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 scale-[0.68] min-[400px]:scale-[0.78] sm:scale-100 transform-gpu',
        className
      )}
    >
      {children}
    </div>
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
      className="hidden sm:block left-0 sm:left-4 top-4 sm:top-[64px] w-[165px] sm:w-[205px] p-3 sm:p-4 origin-top-left"
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
      className="-top-6 right-[-8px] sm:right-4 sm:top-8 w-[165px] p-3 sm:w-[222px] sm:p-4 origin-top-right"
    >
      <CardHeading icon={TrendingUp} title="Overall Progress" tone="blue" />
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-3xl font-black tracking-tight text-[#315ee9] dark:text-blue-400">
            7.0
          </p>
          <p className="mt-1 rounded-md bg-emerald-100/50 px-1.5 py-0.5 text-[10px] font-extrabold text-[#238b78] dark:bg-emerald-500/20">
            Target 7.5
          </p>
        </div>
        <div className="relative flex h-14 w-14 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="rgba(0,0,0,.05)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray="78 22"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs font-black text-[#315ee9] dark:text-blue-400">78%</span>
        </div>
      </div>
      <svg viewBox="0 0 170 42" className="mt-3 h-9 w-full" aria-hidden="true">
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
      className="hidden sm:block bottom-[86px] sm:bottom-[116px] right-[-16px] sm:right-4 w-[190px] p-3 sm:w-[238px] sm:p-4 origin-bottom-right"
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
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[8px] font-extrabold text-[#6643cb] dark:bg-violet-950/30 dark:text-violet-300">
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
      className="bottom-14 left-0 hidden w-[222px] p-3 sm:block sm:p-3.5"
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
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
              <div
                className="h-full rounded-full bg-blue-500/70"
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

function AiTutorCard() {
  return (
    <FloatingCard
      label="AI Tutor chat bubble"
      delay={1.15}
      className="bottom-0 sm:bottom-3 right-0 sm:right-8 w-[235px] sm:w-[270px] p-2.5 sm:p-3.5 origin-bottom-right"
    >
      <div className="flex items-center gap-3">
        {/* Robot Avatar */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-650 shadow-md overflow-hidden">
          {/* Animated glow background inside the avatar */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-transparent animate-pulse" />
          <svg viewBox="0 0 40 40" className="relative z-10 h-7 w-7 text-white" fill="none">
            {/* Robot Head */}
            <rect x="10" y="14" width="20" height="13" rx="4" fill="currentColor" />
            {/* Screen */}
            <rect x="12" y="16" width="16" height="9" rx="2" fill="#0f172a" />
            {/* Eyes */}
            <circle cx="17" cy="20.5" r="1.5" fill="#38bdf8" className="animate-pulse" />
            <circle cx="23" cy="20.5" r="1.5" fill="#38bdf8" className="animate-pulse" />
            {/* Mouth */}
            <path
              d="M17 23.5 Q20 25 23 23.5"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Antenna */}
            <line
              x1="20"
              y1="14"
              x2="20"
              y2="9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="20" cy="8" r="1.5" fill="#f43f5e" />
          </svg>
        </div>

        {/* Text Area */}
        <div className="text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <b className="whitespace-nowrap text-[11px] font-black tracking-tight text-[#0d1932] dark:text-white sm:text-xs">
              Hi! I'm your AI tutor.
            </b>
            <Sparkles className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400 animate-pulse" />
          </div>
          <p className="mt-0.5 whitespace-nowrap text-[9px] font-semibold text-[#59667b] dark:text-slate-400 sm:text-[10px]">
            Ask me anything about IELTS!
          </p>
        </div>
      </div>
    </FloatingCard>
  );
}

function StudentVisual() {
  return (
    <div
      className="relative mx-auto min-h-[500px] w-full max-w-[760px] overflow-visible sm:min-h-[590px] lg:min-h-[650px] transform-gpu"
      aria-label="IELTS AI Pro learning experience preview"
    >
      <div className="absolute bottom-12 left-6 right-6 top-14 overflow-hidden rounded-[2rem] border border-violet-200/80 bg-[#eef2ff] shadow-[0_30px_75px_-20px_rgba(109,85,238,0.22)] dark:border-violet-500/30 dark:bg-slate-900 sm:bottom-8 sm:left-12 sm:right-10 sm:top-8 lg:left-14 transform-gpu">
        <picture className="block h-full w-full">
          <source media="(max-width: 767px)" srcSet="/ielts-hero-student-640.webp" />
          <source
            media="(max-width: 1599px)"
            srcSet="/ielts-hero-student-640.webp 640w, /ielts-hero-student-960.webp 960w"
            sizes="45vw"
          />
          <img
            src="/ielts-hero-student.webp"
            alt="IELTS learner studying with a laptop"
            className="h-full w-full object-cover object-[53%_center]"
            width="1200"
            height="900"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            data-oid="hero-student-img"
          />
        </picture>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#6c79ef]/10 via-transparent to-white/15" />
      </div>

      <SpeakingCard />
      <ProgressCard />
      <WritingCard />
      <StudyPlanCard />
      <AiTutorCard />
    </div>
  );
}

function LearnerProof() {
  const learnerAvatars = [33, 47, 12, 32, 5];

  return (
    <div className="mt-8 max-w-[620px] space-y-4 mx-auto lg:mx-0 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4.5 text-center sm:text-left">
        <div className="flex items-center shrink-0" role="img" aria-label="IELTS learners">
          <div className="flex -space-x-2.5 sm:-space-x-2" aria-hidden="true">
            {learnerAvatars.map((avatar) => (
              <img
                key={avatar}
                src={`/hero-learners/avatar-${avatar}.webp`}
                alt="IELTS learner avatar"
                width="40"
                height="40"
                className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm dark:border-slate-900 ring-1 ring-slate-900/5 transform-gpu transition-all duration-200 hover:scale-110 hover:z-20 cursor-pointer"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-start gap-0.5">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
            ))}
            <span className="ml-1 text-xs font-black text-[#07142f] dark:text-white">4.9/5</span>
          </div>
          <p className="text-xs font-bold text-[#536078] dark:text-slate-300">
            Built for focused IELTS learners worldwide
          </p>
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-[#e2e8f3] bg-white/80 px-4 py-3 shadow-[0_18px_45px_-34px_rgba(31,52,106,.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 transition-all hover:border-violet-300/60 dark:hover:border-white/20 text-left max-w-lg mx-auto lg:mx-0">
        <Quote className="mt-0.5 h-5 w-5 shrink-0 fill-violet-100 text-[#7c3aed]" />
        <div>
          <p className="text-[11.5px] font-medium leading-5 text-[#526079] dark:text-slate-300">
            Review focused feedback between practice sessions and choose a clear next step.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection({ handlePrimaryCta, handlePricing, isSignedIn }) {
  const [motionReady, setMotionReady] = React.useState(false);

  React.useEffect(() => {
    const enableMotion = () => setMotionReady(true);
    let timer;

    const scheduleMotion = () => {
      timer = window.setTimeout(enableMotion, 8000);
    };

    if (document.readyState === 'complete') scheduleMotion();
    else window.addEventListener('load', scheduleMotion, { once: true });

    window.addEventListener('pointerdown', enableMotion, { once: true, passive: true });
    window.addEventListener('keydown', enableMotion, { once: true });

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('load', scheduleMotion);
      window.removeEventListener('pointerdown', enableMotion);
      window.removeEventListener('keydown', enableMotion);
    };
  }, []);

  return (
    <section
      className="relative bg-gradient-to-b from-[#f8f5fe]/80 via-[#fcfaff] to-white dark:from-[#0d091e] dark:via-[#090716] dark:to-[#070914] pb-12 pt-24 sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32 overflow-hidden"
      aria-label="Hero"
      data-hero-root
    >
      {motionReady ? (
        <React.Suspense fallback={null}>
          <HeroMotionEffects />
        </React.Suspense>
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-6 h-[38rem] w-[38rem] rounded-full bg-violet-200/20 blur-[140px] dark:bg-violet-600/10 transform-gpu" />
        <div className="absolute -right-32 top-2 h-[42rem] w-[42rem] rounded-full bg-purple-200/15 blur-[150px] dark:bg-purple-600/10 transform-gpu" />
        <div className="absolute left-1/3 top-1/4 h-[24rem] w-[24rem] rounded-full bg-fuchsia-100/15 blur-[130px] dark:bg-fuchsia-600/10 transform-gpu" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent dark:from-[#070914]" />
      </div>

      <div className="relative mx-auto grid max-w-[1540px] items-center gap-10 sm:gap-12 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 xl:px-12 2xl:px-16">
        <div className="relative z-10 min-w-0 flex flex-col items-center text-center lg:items-start lg:text-left lg:py-5">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-violet-200/80 bg-white/90 dark:border-violet-500/30 dark:bg-violet-950/40 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#5c44c2] dark:text-violet-200 shadow-[0_4px_20px_-6px_rgba(109,85,238,0.18)] backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-violet-300/90 dark:hover:border-violet-400/50 mx-auto lg:mx-0">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6d55e8] to-[#8b5cf6] text-white shadow-sm">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
            <span className="tracking-tight font-bold text-[#5c44c2] dark:text-violet-200">
              Focused IELTS practice with clear feedback
            </span>
          </div>

          <h1 className="mt-5 text-[2.45rem] xs:text-[2.75rem] sm:text-[3.2rem] lg:text-[3.1rem] xl:text-[3.6rem] 2xl:text-[4rem] font-extrabold leading-[1.05] sm:leading-[1.04] tracking-[-0.045em] text-[#07142f] dark:text-white">
            <span className="block">AI-Powered</span>
            <span className="block">IELTS Practice</span>
            <span className="font-handwritten relative mt-2 sm:mt-2.5 inline-block w-fit max-w-full whitespace-nowrap text-[0.82em] xs:text-[0.88em] sm:text-[0.94em] lg:text-[0.95em] xl:text-[1.02em] leading-[1.08] tracking-[-0.03em] text-[#6d55e8] pr-6 sm:pr-7">
              for a higher band score.
              <svg
                className="absolute -bottom-2 sm:-bottom-2.5 left-[32%] sm:left-[35%] h-2.5 sm:h-3 w-[42%] text-[#b89eff]"
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
                className="absolute -right-1 sm:-right-2 top-0 sm:-top-1 h-5 w-5 sm:h-6 sm:w-6 text-[#2cc2a0]"
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
          </h1>

          <p className="mt-5 sm:mt-6 max-w-[560px] text-sm sm:text-base lg:text-[17px] font-medium leading-relaxed text-[#515d74] dark:text-slate-300 text-center lg:text-left mx-auto lg:mx-0">
            Practice Reading, Listening, Writing, and Speaking in one workspace. Review estimated
            band feedback, track recurring weaknesses, and follow a study plan based on the work you
            actually complete.
          </p>

          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-3.5 w-full sm:w-auto justify-center lg:justify-start items-center sm:items-stretch max-w-sm sm:max-w-none mx-auto lg:mx-0">
            <Button
              onClick={handlePrimaryCta}
              size="lg"
              className="group relative overflow-hidden w-full sm:w-auto h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] px-6 sm:px-7.5 text-sm sm:text-base font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(99,85,238,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-8px_rgba(99,85,238,0.55)] active:translate-y-0 active:scale-[0.98] justify-center"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {isSignedIn ? 'Continue Learning' : 'Start Free Test'}
                <ArrowRight className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              </span>
              <span className="absolute inset-0 z-0 bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6d28d9] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Button>
            <Button
              onClick={handlePricing}
              size="lg"
              variant="outline"
              className="group w-full sm:w-auto h-12 sm:h-14 rounded-xl sm:rounded-2xl border-violet-200/90 bg-white/90 px-6 sm:px-7 text-sm sm:text-base font-extrabold text-[#0f172a] shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-[0_10px_24px_-8px_rgba(109,85,238,0.18)] active:translate-y-0 active:scale-[0.98] dark:border-white/15 dark:bg-slate-900/80 dark:text-white dark:hover:bg-violet-950/40 dark:hover:border-violet-400/40 justify-center"
            >
              <span className="flex items-center gap-2.5">
                Compare Plans
                <CirclePlay className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#6d55e8] dark:text-violet-300 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </span>
            </Button>
          </div>

          {!isSignedIn && (
            <p className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-[13px] font-semibold text-[#66738c] dark:text-slate-400 text-center lg:text-left">
              <Check className="h-4 w-4 text-[#2cc2a0]" aria-hidden="true" />
              Free plan available — no credit card required
            </p>
          )}

          <div className="w-full">
            <LearnerProof />
          </div>
        </div>

        <div className="relative z-10 min-w-0 overflow-visible transform-gpu">
          <StudentVisual />
        </div>
      </div>
    </section>
  );
}
