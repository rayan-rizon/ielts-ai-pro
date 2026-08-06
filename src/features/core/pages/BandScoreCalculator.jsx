import React, { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import Calculator from 'lucide-react/icons/calculator';
import Repeat from 'lucide-react/icons/repeat';
import Sparkles from 'lucide-react/icons/sparkles';
import ChevronDown from 'lucide-react/icons/chevron-down';
import FileQuestion from 'lucide-react/icons/file-question';
import HelpCircle from 'lucide-react/icons/help-circle';
import Navbar from '@/features/core/components/landing/Navbar';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import OverallBandCalculator from '@/features/core/components/calculator/OverallBandCalculator';
import RawScoreConverter from '@/features/core/components/calculator/RawScoreConverter';

const Footer = lazy(() => import('@/features/core/components/landing/Footer'));

const faqs = [
  {
    q: 'How is the overall IELTS band score calculated?',
    a: 'Your overall band is the average of Listening, Reading, Writing, and Speaking, rounded to the nearest half band. A 6.25 average rounds up to 6.5, and 6.75 rounds up to 7.0.',
  },
  {
    q: 'How many correct answers yield Band 7.0 in Listening & Reading?',
    a: 'Typically 30 out of 40 correct answers earns Band 7.0 in Listening and Academic Reading. General Training Reading requires around 34 correct answers.',
  },
  {
    q: 'Is this IELTS band score calculator official?',
    a: 'No. It uses official Cambridge rounding rules for practice estimation. Official result certificates are issued exclusively by authorized IELTS test centers.',
  },
  {
    q: 'How are Writing and Speaking band scores decided?',
    a: 'Examiners evaluate Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammar. IELTS Ai Pro evaluates these exact criteria in real-time.',
  },
];

function SectionLabel({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-8">
      <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-linear-to-r/srgb from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:border-indigo-500/30 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-900/90 dark:text-indigo-300 shadow-sm backdrop-blur-xl">
        <Icon className="h-3.5 w-3.5 text-indigo-500" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.4rem)] font-black tracking-tight leading-tight text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-2.5 max-w-[640px] text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
        {description}
      </p>
    </div>
  );
}

function BandScoreCalculatorHead({ faqs }) {
  return (
    <DocumentHead
      title="IELTS Band Score Calculator (Overall + Raw Score) | IELTS Ai Pro"
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
    <main className="pt-20 sm:pt-24 pb-16 relative z-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <BandScoreCalculatorHero />
      </m.div>

      {/* Tool 1: overall band */}
      <m.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1240px] px-6 pt-10 md:px-8"
      >
        <SectionLabel
          icon={Calculator}
          eyebrow="Overall band"
          title="Estimate your overall band score"
          description="Move the sliders to match your latest practice results. The overall band updates live with official IELTS averaging and rounding rules, and the target tracker shows exactly how far you are from your goal."
        />
        <OverallBandCalculator handlePrimaryCta={handlePrimaryCta} />
      </m.section>

      {/* Tool 2: raw score converter */}
      <m.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1240px] px-6 pt-14 md:px-8"
      >
        <SectionLabel
          icon={Repeat}
          eyebrow="Raw score converter"
          title="Convert correct answers to a band score"
          description="Listening and Reading have 40 questions each with no penalty for wrong answers. Pick your test section, enter how many you got right, and see the equivalent band with the full conversion table."
        />
        <RawScoreConverter />
      </m.section>

      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <BandScoreCalculatorFaq faqs={faqs} />
      </m.div>
    </main>
  );
}

export default function BandScoreCalculator() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('SignUp'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-[#08080a] text-foreground transition-colors duration-300 overflow-x-hidden">
      <BandScoreCalculatorHead faqs={faqs} />

      {/* Ambient Decorative Lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-136 w-136 rounded-full bg-blue-200/20 blur-[130px] dark:bg-[#5a63df]/10" />
        <div className="absolute -right-40 top-8 h-152 w-152 rounded-full bg-indigo-500/10 blur-[140px] dark:bg-[#5a63df]/8" />
      </div>

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <BandScoreCalculatorTools handlePrimaryCta={handlePrimaryCta} />

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

function BandScoreCalculatorHero() {
  return (
    <section className="mx-auto max-w-[920px] px-6 text-center md:px-8 pt-4 sm:pt-6">
      <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-linear-to-r/srgb from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:border-indigo-500/30 dark:from-indigo-950/80 dark:via-purple-950/60 dark:to-slate-900/90 dark:text-indigo-300 shadow-sm backdrop-blur-xl">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Free IELTS Tool
      </span>

      <h1 className="mt-6 text-balance text-[clamp(2.35rem,5vw,3.85rem)] font-black leading-[1.04] tracking-tight text-slate-950 dark:text-white">
        <span className="block">IELTS Band Score</span>
        <span className="relative inline-block font-handwritten mt-2.5 bg-linear-to-r/srgb from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text pb-3 text-[1.02em] leading-[1.08] tracking-tight text-transparent">
          Calculator
          <svg
            className="absolute bottom-0 left-0 w-full h-3 text-[#7384f8]"
            viewBox="0 0 200 10"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M2 3C60 7 140 7 198 3"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>

      <p className="mx-auto mt-6 max-w-[650px] text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[17px] font-medium">
        Estimate your overall IELTS band from your four skill scores using official rounding rules,
        set a target band, and convert Listening and Reading raw scores (out of 40) into band
        scores.
      </p>
    </section>
  );
}

function BandScoreCalculatorFaq({ faqs }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 px-6 relative border-t border-slate-200/60 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/2 mt-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Everything you need to know about official IELTS band calculations and raw score
            conversions.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:to-[#131315] border border-slate-200/80 dark:border-white/10 rounded-[28px] p-6 md:p-8 shadow-sm dark:shadow-none backdrop-blur-md dark:backdrop-blur-none">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.q}
                className="border-b border-slate-200/60 dark:border-white/10 py-4 last:border-none"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between text-left font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2 text-base group"
                >
                  <span className="flex items-center gap-3">
                    <FileQuestion className="w-4 h-4 text-indigo-500 shrink-0" />
                    {faq.q}
                  </span>
                  <m.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400 shrink-0 ml-4 group-hover:text-indigo-500"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </m.span>
                </button>
                <m.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 pt-2 pb-3 font-medium pl-7">
                    {faq.a}
                  </p>
                </m.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
