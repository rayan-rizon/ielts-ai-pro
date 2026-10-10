import React, { useEffect, useRef } from 'react';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Check from 'lucide-react/icons/check';
import CirclePlay from 'lucide-react/icons/circle-play';
import Sparkles from 'lucide-react/icons/sparkles';
import Star from 'lucide-react/icons/star';
import { Button } from '@/components/ui/button';
import { WordByWordTextCSS } from '@/components/ui/word-by-word-text-css';

// The hero film is rendered with HyperFrames from the local hero-loop/ project
// (gitignored, like launch-video/) and served from
// /public/videos. It is muted and loops; visitors who ask for reduced motion
// get the poster frame instead of autoplay.
function HeroVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      video.pause();
      return;
    }
    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      className="block h-full w-full object-cover"
      width="1440"
      height="810"
      poster="/videos/hero-loop-poster.webp"
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="IELTS Ai Pro product tour: Reading assistant, Listening review, Writing corrections and Speaking report"
      data-oid="hero-video"
    >
      <source src="/videos/hero-loop.mp4" type="video/mp4" />
    </video>
  );
}

function StudentVisual() {
  return (
    <div
      className="animate-hero-enter relative mx-auto w-full max-w-[760px] transform-gpu"
      style={{ '--hero-enter-delay': '120ms' }}
      data-motion-entry="hero-visual"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#e4e2f0] bg-[#f7f6fd] shadow-[0_24px_60px_-30px_rgba(90,99,223,0.35)] dark:border-white/10 dark:bg-slate-900">
        <HeroVideo />
      </div>
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
    </div>
  );
}

export default function HeroSection({ handlePrimaryCta, handlePricing, isSignedIn }) {
  return (
    <section
      className="relative bg-linear-to-b/srgb from-[#f8f5fe]/80 via-[#fcfaff] to-white dark:from-[#08080a] dark:via-[#08080a] dark:to-[#08080a] pb-12 pt-24 sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32 overflow-hidden"
      aria-label="Hero"
      data-hero-root
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden dark:bg-[radial-gradient(#5a63df_1.2px,transparent_1.2px)] dark:bg-size-[20px_20px] dark:opacity-[0.14]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-landing-orb absolute -left-32 top-6 h-152 w-152 rounded-full bg-violet-200/20 blur-[140px] dark:bg-[#5a63df]/10 transform-gpu" />
        <div className="animate-landing-orb absolute -right-32 top-2 h-168 w-168 rounded-full bg-purple-200/15 blur-[150px] dark:bg-[#5a63df]/8 transform-gpu [--landing-orb-delay:-7s]" />
        <div className="animate-landing-orb absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-fuchsia-100/15 blur-[130px] dark:bg-transparent transform-gpu [--landing-orb-delay:-13s]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t/srgb from-white to-transparent dark:from-[#08080a]" />
      </div>

      <div className="relative mx-auto grid max-w-[1540px] items-center gap-10 sm:gap-12 px-5 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 xl:px-12 2xl:px-16">
        <div className="relative z-10 min-w-0 flex flex-col items-center text-center lg:items-start lg:text-left lg:py-5">
          <div
            className="animate-hero-enter inline-flex items-center gap-2.5 rounded-full border border-violet-200/80 bg-white/90 dark:border-violet-500/30 dark:bg-violet-950/40 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-[#5c44c2] dark:text-violet-200 shadow-[0_4px_20px_-6px_rgba(109,85,238,0.18)] backdrop-blur-md transition-all [transition-duration:300ms] hover:scale-[1.02] hover:border-violet-300/90 dark:hover:border-violet-400/50 mx-auto lg:mx-0"
            style={{ '--hero-enter-delay': '0ms' }}
            data-motion-entry="eyebrow"
          >
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr/srgb from-[#6d55e8] to-[#8b5cf6] text-white shadow-sm">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
            <span className="tracking-tight font-bold text-[#5c44c2] dark:text-violet-200">
              Focused IELTS practice with clear feedback
            </span>
          </div>

          <h1
            className="animate-hero-enter mt-5 text-[2.65rem] min-[480px]:text-[3rem] sm:text-[3.5rem] lg:text-[3.45rem] xl:text-[4rem] 2xl:text-[4.4rem] font-extrabold leading-[1.02] tracking-tighter text-[#07142f] dark:text-white"
            style={{ '--hero-enter-delay': '70ms' }}
            data-motion-entry="headline"
          >
            <span className="block">
              <WordByWordTextCSS text="IELTS Practice." delay={0.07} startIndex={0} />
            </span>
            <span className="font-handwritten relative mt-2.5 sm:mt-3 inline-block w-fit max-w-full whitespace-nowrap text-[0.8em] min-[480px]:text-[0.86em] sm:text-[0.9em] lg:text-[0.88em] xl:text-[0.92em] leading-[1.08] tracking-[-0.035em] text-[#6d55e8] pr-6 sm:pr-7">
              <WordByWordTextCSS text="Smarter with AI." delay={0.07} startIndex={2} />
              <svg
                className="animate-word-enter absolute -bottom-2 sm:-bottom-2.5 left-[24%] h-2.5 sm:h-3 w-[52%] text-[#b89eff]"
                style={{ '--word-delay': '450ms' }}
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
                className="animate-word-enter absolute -right-1 sm:-right-2 top-0 sm:-top-1 h-5 w-5 sm:h-6 sm:w-6 text-[#2cc2a0]"
                style={{ '--word-delay': '520ms' }}
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

          <p
            className="animate-hero-enter mt-5 sm:mt-6 max-w-[560px] text-sm sm:text-base lg:text-[17px] font-medium leading-relaxed text-[#515d74] dark:text-slate-300 text-center lg:text-left mx-auto lg:mx-0"
            style={{ '--hero-enter-delay': '140ms' }}
            data-motion-entry="description"
          >
            Practice Reading, Listening, Writing, and Speaking in one workspace. Review estimated
            band feedback, track recurring weaknesses, and follow a study plan based on the work you
            actually complete.
          </p>

          <div
            className="animate-hero-enter mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-3.5 w-full sm:w-auto justify-center lg:justify-start items-center sm:items-stretch max-w-sm sm:max-w-none mx-auto lg:mx-0"
            style={{ '--hero-enter-delay': '210ms' }}
            data-motion-entry="actions"
          >
            <Button
              onClick={handlePrimaryCta}
              size="lg"
              className="group relative overflow-hidden w-full sm:w-auto h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#6256ef] hover:bg-[#5246e0] px-6 sm:px-7.5 text-sm sm:text-base font-black text-white shadow-[0_12px_28px_-8px_rgba(98,86,239,0.4)] transition-all duration-200 active:scale-[0.98] justify-center cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {isSignedIn ? 'Continue Learning' : 'Start Free Test'}
                <ArrowRight className="h-4.5 w-4.5 sm:h-5 sm:w-5 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
              </span>
            </Button>
            <Button
              onClick={handlePricing}
              size="lg"
              variant="outline"
              className="group w-full sm:w-auto h-12 sm:h-14 rounded-xl sm:rounded-2xl border-violet-200/90 bg-white/90 px-6 sm:px-7 text-sm sm:text-base font-extrabold text-[#0f172a] shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-[0_10px_24px_-8px_rgba(109,85,238,0.18)] active:translate-y-0 active:scale-[0.98] dark:border-white/15 dark:bg-slate-900/80 dark:text-white dark:hover:bg-violet-950/40 dark:hover:border-violet-400/40 justify-center cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                Compare Plans
                <CirclePlay className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#6256ef] dark:text-violet-300 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
              </span>
            </Button>
          </div>

          {!isSignedIn && (
            <p
              className="animate-hero-enter mt-4 flex items-center justify-center lg:justify-start gap-2 text-[13px] font-semibold text-[#66738c] dark:text-slate-400 text-center lg:text-left"
              style={{ '--hero-enter-delay': '270ms' }}
              data-motion-entry="free-plan"
            >
              <Check className="h-4 w-4 text-[#6256ef]" aria-hidden="true" />
              Free plan available — no credit card required
            </p>
          )}

          <div
            className="animate-hero-enter w-full"
            style={{ '--hero-enter-delay': '330ms' }}
            data-motion-entry="proof"
          >
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
