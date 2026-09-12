import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import Calculator from 'lucide-react/icons/calculator';
import Repeat from 'lucide-react/icons/repeat';
import Sparkles from 'lucide-react/icons/sparkles';
import ChevronDown from 'lucide-react/icons/chevron-down';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Zap from 'lucide-react/icons/zap';
import ArrowRight from 'lucide-react/icons/arrow-right';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import DocumentHead from '@/components/shared/DocumentHead';
import CookieConsent from '@/components/shared/CookieConsent';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import OverallBandCalculator from '@/features/core/components/calculator/OverallBandCalculator';
import RawScoreConverter from '@/features/core/components/calculator/RawScoreConverter';
import { railLabelClass } from '@/features/core/components/calculator/calculatorStyles';

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

function SectionLabel({ icon: Icon, index, eyebrow, title, description }) {
  return (
    <div className="mb-5 border-b border-[#e6e8f5] pb-4 dark:border-white/8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-[#ded9ff] bg-[#f2f0ff] text-[#6256ef] dark:border-violet-400/15 dark:bg-violet-500/[0.07] dark:text-violet-300">
          <Icon className="h-3.5 w-3.5 stroke-2" />
        </span>
        <span className={railLabelClass}>
          {index} · {eyebrow}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
        <h2 className="text-[clamp(1.5rem,2.6vw,1.95rem)] font-black leading-[1.1] tracking-[-0.04em] text-[#07142f] dark:text-white">
          {title}
        </h2>
        <p className="max-w-[520px] text-[13px] font-medium leading-5 text-[#5c6687] dark:text-slate-400">
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
      keywords="IELTS band score calculator, IELTS overall band score, IELTS raw score conversion, IELTS band calculator, calculate IELTS score"
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

function BandScoreCalculatorTools({ handlePrimaryCta }) {
  return (
    <main className="relative z-10 pb-14 pt-[76px] sm:pt-20">
      <m.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <BandScoreCalculatorHero />
      </m.div>

      {/* Tool 1: overall band */}
      <m.section
        id="overall-band-calculator"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 lg:px-8"
      >
        <SectionLabel
          icon={Calculator}
          index="01"
          eyebrow="Overall band"
          title="Estimate your overall band score"
          description="Set your four skill scores. The overall band updates live using official IELTS averaging and rounding."
        />
        <OverallBandCalculator handlePrimaryCta={handlePrimaryCta} />
      </m.section>

      {/* Tool 2: raw score converter */}
      <m.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-5 pt-12 sm:px-6 lg:px-8"
      >
        <SectionLabel
          icon={Repeat}
          index="02"
          eyebrow="Raw score converter"
          title="Convert correct answers to a band"
          description="40 questions each, no penalty for wrong answers. Pick a section and set how many you got right."
        />
        <RawScoreConverter />
      </m.section>

      <m.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <BandScoreCalculatorFaq faqs={faqs} />
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <BandScoreCalculatorCta handlePrimaryCta={handlePrimaryCta} />
      </m.div>
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

function BandScoreCalculatorHero() {
  const trustPoints = [
    { icon: ShieldCheck, label: 'Official Cambridge rounding' },
    { icon: Zap, label: 'Live results · no sign-up' },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 pt-3 sm:px-6 lg:px-8">
      <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff] px-3.5 py-1.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-[#5e50ee] dark:border-violet-500/25 dark:bg-violet-950/40 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 shrink-0 stroke-2" aria-hidden="true" />
            Free IELTS tool
          </span>

          <h1 className="mt-4 text-balance text-[clamp(2.1rem,4.6vw,3.35rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#07142f] dark:text-white">
            IELTS Band Score{' '}
            <span className="font-handwritten relative inline-block tracking-[-0.03em] text-[#5262ef] dark:text-violet-300">
              Calculator
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-[4%] h-[3px] w-[92%] -rotate-1 rounded-full bg-[#7086f6] opacity-60"
              />
            </span>
          </h1>

          <p className="mt-4 max-w-[610px] text-[14.5px] font-medium leading-6 text-[#59657a] dark:text-slate-300 sm:text-[15.5px]">
            Turn four skill scores into an overall band with official rounding, then convert
            Listening and Reading raw scores out of 40.
          </p>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:gap-2.5 md:pb-1.5">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-[12px] font-bold text-[#5c6687] dark:text-slate-400"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 stroke-[2.5] text-[#6256ef] dark:text-violet-400" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BandScoreCalculatorFaq({ faqs }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="mx-auto mt-14 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="border-t border-[#e6e8f5] pt-10 dark:border-white/8">
        <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-12">
          <div className="md:sticky md:top-24 md:self-start">
            <span className={railLabelClass}>03 · FAQ</span>
            <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,1.95rem)] font-black leading-[1.1] tracking-[-0.04em] text-[#07142f] dark:text-white">
              Frequently asked questions
            </h2>
            <p className="mt-2.5 text-[13px] font-medium leading-5 text-[#5c6687] dark:text-slate-400">
              How official band calculations and raw conversions work.
            </p>
          </div>

          <div className="divide-y divide-[#eceef8] border-y border-[#eceef8] dark:divide-white/8 dark:border-white/8">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-4 py-3.5 text-left text-[14px] font-extrabold tracking-[-0.015em] text-[#0b1230] transition-colors duration-150 hover:text-[#6256ef] dark:text-slate-100 dark:hover:text-violet-300"
                  >
                    {faq.q}
                    <m.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-[#9aa2ba] group-hover:text-[#6256ef] dark:text-slate-500"
                    >
                      <ChevronDown className="h-4 w-4 stroke-[2.5]" />
                    </m.span>
                  </button>
                  <m.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[640px] pb-4 pr-8 text-[13px] font-medium leading-6 text-[#5c6687] dark:text-slate-400">
                      {faq.a}
                    </p>
                  </m.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function BandScoreCalculatorCta({ handlePrimaryCta }) {
  return (
    <section className="mx-auto mt-14 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-[26px] bg-[#5246ea] px-6 py-8 text-white sm:px-10 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="max-w-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-200">
            Stop estimating
          </span>
          <h2 className="mt-2.5 text-[clamp(1.5rem,2.6vw,1.95rem)] font-black leading-[1.1] tracking-[-0.04em]">
            Get a real band score on your own writing and speaking.
          </h2>
          <p className="mt-2.5 text-[13.5px] font-medium leading-6 text-indigo-100">
            IELTS Ai Pro grades the same four examiner criteria and shows what to fix next.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrimaryCta}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-white px-7 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-[#4438dd] transition-colors duration-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5246ea]"
        >
          Start free
          <ArrowRight className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>
    </section>
  );
}
