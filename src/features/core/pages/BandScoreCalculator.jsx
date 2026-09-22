import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import Calculator from 'lucide-react/icons/calculator';
import Repeat from 'lucide-react/icons/repeat';
import Sparkles from 'lucide-react/icons/sparkles';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Zap from 'lucide-react/icons/zap';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Plus from 'lucide-react/icons/plus';
import Minus from 'lucide-react/icons/minus';
import HelpCircle from 'lucide-react/icons/help-circle';
import Headphones from 'lucide-react/icons/headphones';
import Check from 'lucide-react/icons/check';
import Target from 'lucide-react/icons/target';
import LineChart from 'lucide-react/icons/line-chart';
import Star from 'lucide-react/icons/star';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import DocumentHead from '@/components/shared/DocumentHead';
import CookieConsent from '@/components/shared/CookieConsent';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import OverallBandCalculator from '@/features/core/components/calculator/OverallBandCalculator';
import RawScoreConverter from '@/features/core/components/calculator/RawScoreConverter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PANEL, NUM, MICRO, MUTED } from '@/features/dashboard/components/primitives.jsx';

const Footer = lazy(() => import('@/features/core/components/landing/Footer'));

const faqs = [
  {
    q: 'How is the overall IELTS band score calculated?',
    a: 'It is the average of Listening, Reading, Writing, and Speaking, rounded to the nearest half band — 6.25 rounds up to 6.5, and 6.75 rounds up to 7.0.',
  },
  {
    q: 'How many correct answers yield Band 7.0 in Listening & Reading?',
    a: 'Around 30 of 40 for Listening and Academic Reading. General Training Reading needs about 34.',
  },
  {
    q: 'Is this IELTS band score calculator official?',
    a: 'No. It applies official Cambridge rounding for practice estimates. Only authorized test centres issue real result certificates.',
  },
  {
    q: 'How are Writing and Speaking band scores decided?',
    a: 'Examiners score Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammar. IELTS Ai Pro grades the same four criteria in real time.',
  },
];

function SectionHeading({ icon: Icon, index, eyebrow, title, description }) {
  return (
    <div className="mb-6 border-b border-[#e6e8f5] pb-4 dark:border-white/8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ded9ff] bg-[#f2f0ff] text-[#5a63df] dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
          <Icon className="h-3.5 w-3.5 stroke-2" />
        </span>
        <span className={`${MICRO} ${MUTED}`}>
          {index} · {eyebrow}
        </span>
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5 md:flex-row md:items-baseline md:justify-between md:gap-8">
        <h2 className="text-xl font-black tracking-tight text-[#07142f] dark:text-white sm:text-2xl lg:text-[1.85rem]">
          {title}
        </h2>
        <p className="max-w-[460px] text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">
          {description}
        </p>
      </div>
    </div>
  );
}

function BandScoreCalculatorHead({ faqs }) {
  return (
    <DocumentHead
      title="IELTS Band Score Calculator | IELTS Ai Pro"
      description="Free IELTS band score calculator: turn your Listening, Reading, Writing and Speaking scores into an overall band, plus raw score conversion."
      canonicalUrl="https://www.ieltsai.pro/ielts-band-score-calculator"
      keywords="IELTS band score calculator, IELTS score calculator, IELTS band calculator, IELTS test band calculator, IELTS score and band calculator, calculate IELTS score, IELTS reading score conversion, IELTS raw score conversion"
      structuredData={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'IELTS Band Score Calculator',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            url: 'https://www.ieltsai.pro/ielts-band-score-calculator',
            description:
              'Calculate your overall IELTS band score from four skill scores using official rounding rules, and convert Listening and Reading raw scores to bands.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.ieltsai.pro/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'IELTS Band Score Calculator',
                item: 'https://www.ieltsai.pro/ielts-band-score-calculator',
              },
            ],
          },
        ],
      }}
    />
  );
}

function BandScoreCalculatorHero() {
  const trustPoints = [
    { icon: ShieldCheck, label: 'Official Cambridge rounding' },
    { icon: Zap, label: 'Live results · no sign-up' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 pt-3 sm:px-6 lg:px-8">
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
        {/* Left Column (Centered on mobile/tablet, left-aligned on desktop) */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#5e50ee] dark:border-violet-500/25 dark:bg-violet-950/40 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-2" aria-hidden="true" />
            Free IELTS tool
          </span>

          <h1 className="mt-4 text-[clamp(2.15rem,3.6vw,3.35rem)] font-black leading-[1.03] tracking-[-0.045em] text-[#07142f] dark:text-white">
            <span className="block">IELTS Band Score</span>
            <span className="mt-1 block">
              <span className="relative inline-block font-handwritten text-[#5262ef] dark:text-violet-300">
                Calculator
                <svg
                  className="absolute -bottom-1 left-0 h-2.5 w-full text-[#7086f6] opacity-70 dark:text-violet-400"
                  viewBox="0 0 200 10"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 3C60 7 140 7 198 3"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15.5px]">
            Turn four skill scores into an overall band with official rounding, then convert
            Listening and Reading raw scores out of 40.
          </p>

          {/* Trust badges on mobile (< lg) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 lg:hidden">
            {trustPoints.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <Icon className="h-3.5 w-3.5 text-[#5a63df] dark:text-violet-400" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right Dock on desktop (lg:) */}
        <div className="hidden lg:flex flex-col gap-2 rounded-2xl border border-[#e4e2f0] bg-white p-4 shadow-2xs dark:border-white/[0.07] dark:bg-[#141319]">
          <span className={`${MICRO} ${MUTED} px-1`}>Calculation Standards</span>
          {trustPoints.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl bg-[#f9f8fe] px-3 py-2 text-xs font-extrabold text-slate-700 dark:bg-white/[0.03] dark:text-slate-200"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-violet-400" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BandScoreCalculatorFaq({ faqs, handlePrimaryCta }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="border-t border-[#e6e8f5] pt-10 dark:border-white/8">
        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
          {/* Left Column */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <span className={`${MICRO} text-[#5a63df] dark:text-violet-300`}>03 · FAQ</span>
            <h2 className="mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-black leading-tight tracking-tight text-[#07142f] dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[13px]">
              How official band calculations, rounding thresholds, and raw scores work.
            </p>

            <div className="mt-6 rounded-2xl border border-[#ded9ff] bg-linear-to-br from-[#f2f0ff]/80 to-[#f8f7ff] p-4 dark:border-violet-500/20 dark:from-violet-950/30 dark:to-indigo-950/20">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                  <Headphones className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Need Personal Guidance?
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Get examiner-level rubric feedback.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5a63df] px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-[#4a53cf] active:scale-[0.98]"
              >
                Start Practice Assessment
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Accordion Column */}
          <div>
            <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.q}
                  value={`item-${index}`}
                  className={`${PANEL} border px-4 py-1 text-left transition-all duration-200 sm:px-5`}
                >
                  <AccordionTrigger className="group py-4 text-left hover:no-underline [&>svg]:hidden">
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-[14px] font-extrabold tracking-tight text-slate-900 group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-violet-300 sm:text-[14.5px]">
                        {faq.q}
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f4f3fb] text-slate-500 transition-colors group-hover:bg-[#5a63df]/10 group-hover:text-[#5a63df] dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-white/10 dark:group-hover:text-white">
                        <Plus className="h-3.5 w-3.5 group-data-[state=open]:hidden" />
                        <Minus className="hidden h-3.5 w-3.5 group-data-[state=open]:block" />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[13px]">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

function BandScoreCalculatorCta({ handlePrimaryCta }) {
  const learnerAvatars = [33, 47, 12, 32, 5];

  const benefits = [
    {
      icon: Target,
      title: 'Target Calibration',
      desc: 'Calculate exact skill scores required.',
    },
    {
      icon: LineChart,
      title: 'Examiner-Grade Rubrics',
      desc: 'Instant diagnostic feedback on 4 criteria.',
    },
    {
      icon: Star,
      title: 'Bridge Weak Skills',
      desc: 'Raise your lowest component fastest.',
    },
  ];

  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl border border-[#ded9ff] bg-linear-to-br from-white via-[#f9f8ff] to-[#f2f0ff] p-6 shadow-sm dark:border-violet-500/25 dark:from-[#141319] dark:via-[#131218] dark:to-[#100f15] sm:p-8 lg:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Left Column */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5 text-[#6256ef] dark:text-violet-300" />
              Stop Estimating
            </span>

            <h2 className="text-balance text-[clamp(1.8rem,3.2vw,2.8rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              Know your score.{' '}
              <span className="font-handwritten text-[#5a63df] dark:text-violet-300">
                Now prepare with real feedback.
              </span>
            </h2>

            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              IELTS Ai Pro grades your writing and speaking on official examiner criteria (Task
              Response, Coherence & Cohesion, Lexical Resource, Grammar) to pinpoint the exact skill
              holding your band back.
            </p>

            {/* Benefit Row */}
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
              {benefits.map((b) => {
                const BIcon = b.icon;
                return (
                  <div key={b.title} className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                      <BIcon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {b.title}
                      </h4>
                      <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500 dark:text-slate-400">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Action Card */}
          <div className="flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="group relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#ded9ff] bg-white text-left shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-violet-500/30 dark:bg-[#181722]"
            >
              {/* Card Header Banner */}
              <div className="relative overflow-hidden bg-[#5a63df] p-5 text-white">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  Free Diagnostic Included
                </span>

                <h3 className="mt-2.5 text-lg font-black tracking-tight leading-tight">
                  Test Your True IELTS Band
                </h3>

                <p className="mt-1 text-xs font-medium text-indigo-100 leading-relaxed">
                  Real examiner rubrics for Writing & Speaking with instant score feedback.
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-white/90">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <Check className="h-3 w-3" /> Band 0-9 Estimate
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <Check className="h-3 w-3" /> No Credit Card
                  </span>
                </div>
              </div>

              {/* Card Footer with Avatars */}
              <div className="flex items-center justify-between border-t border-[#e4e2f0] bg-[#fbfbfe] px-5 py-3.5 dark:border-white/10 dark:bg-[#141319]">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2" aria-hidden="true">
                    {learnerAvatars.slice(0, 3).map((avatar) => (
                      <img
                        key={avatar}
                        src={`/hero-learners/avatar-${avatar}.webp`}
                        alt="Learner"
                        width="26"
                        height="26"
                        className="h-6 w-6 rounded-full border border-white object-cover dark:border-slate-800"
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                    Trusted by 10,000+
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#5a63df] dark:text-violet-300">
                  Start Free
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BandScoreCalculatorTools({ handlePrimaryCta }) {
  return (
    <main className="relative z-10 pb-14 pt-[76px] sm:pt-20">
      <BandScoreCalculatorHero />

      {/* Tool 1: overall band */}
      <section
        id="overall-band-calculator"
        className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 lg:px-8"
      >
        <SectionHeading
          icon={Calculator}
          index="01"
          eyebrow="Overall band"
          title="Estimate your overall band score"
          description="Set your four skill scores. The overall band updates live using official IELTS averaging and rounding."
        />
        <OverallBandCalculator handlePrimaryCta={handlePrimaryCta} />
      </section>

      {/* Tool 2: raw score converter */}
      <section id="raw-score-converter" className="mx-auto max-w-7xl px-5 pt-14 sm:px-6 lg:px-8">
        <SectionHeading
          icon={Repeat}
          index="02"
          eyebrow="Raw score converter"
          title="Convert correct answers to a band"
          description="40 questions each, no penalty for wrong answers. Pick a section and set how many you got right."
        />
        <RawScoreConverter />
      </section>

      <BandScoreCalculatorFaq faqs={faqs} handlePrimaryCta={handlePrimaryCta} />

      <BandScoreCalculatorCta handlePrimaryCta={handlePrimaryCta} />
    </main>
  );
}

export default function BandScoreCalculator() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('SignUp'));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfdff] text-foreground transition-colors duration-300 dark:bg-[#08080a]">
      <BandScoreCalculatorHead faqs={faqs} />

      {/* Ambient decorative lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-136 w-136 rounded-full bg-[#d8ddff]/50 blur-[130px] dark:bg-[#5a63df]/10" />
        <div className="absolute -right-40 top-8 h-152 w-152 rounded-full bg-[#c9f3eb]/45 blur-[140px] dark:bg-[#5a63df]/8" />
      </div>

      <PublicNavbar />

      <BandScoreCalculatorTools handlePrimaryCta={handlePrimaryCta} />

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <CookieConsent />
    </div>
  );
}
