import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import Calculator from 'lucide-react/icons/calculator';
import Repeat from 'lucide-react/icons/repeat';
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
    a: 'Your overall band is the average of your Listening, Reading, Writing, and Speaking bands, rounded to the nearest half band. An average of 6.25 rounds up to 6.5, and 6.75 rounds up to 7.0, while 6.125 rounds down to 6.0.',
  },
  {
    q: 'How many correct answers do I need for Band 7 in Listening?',
    a: 'Typically 30–31 correct answers out of 40 in IELTS Listening gives Band 7.0. For Academic Reading it is usually 30–32, and for General Training Reading around 34–35. Exact thresholds vary slightly between test versions.',
  },
  {
    q: 'Is this IELTS band score calculator official?',
    a: 'No. It uses the published IELTS averaging rules and typical raw-score conversion tables for practice estimation. Official scores come only from authorized IELTS test providers.',
  },
  {
    q: 'How are Writing and Speaking band scores decided?',
    a: 'Examiners score Writing and Speaking against four criteria each, awarding a band for every criterion; the skill band is the average. On IELTS Ai Pro you can practice both skills and get AI feedback organized around the same criteria.',
  },
];

function SectionLabel({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-8">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#d7deeb] bg-white px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#4f46e5] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
      <h2 className="mt-4 text-[clamp(1.5rem,3.5vw,2rem)] font-extrabold tracking-[-0.03em] text-[#07142f] dark:text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-[620px] text-[15px] leading-7 text-[#515d74] dark:text-slate-300">
        {description}
      </p>
    </div>
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
    <div className="min-h-screen bg-[#fcfdff] text-foreground transition-colors duration-300 dark:bg-[#070912]">
      <DocumentHead
        title="IELTS Band Score Calculator (Overall + Raw Score) | IELTS Ai Pro"
        description="Free IELTS band score calculator: get your overall band from Listening, Reading, Writing and Speaking scores, plus raw score to band conversion for Listening and Reading."
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

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-28 sm:pt-32">
        {/* Page hero — the single page title */}
        <section className="mx-auto max-w-[900px] px-5 text-center md:px-8">
          <span className="inline-flex items-center rounded-full border border-[#d7deeb] bg-[#eef2ff] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#4f46e5] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
            Free IELTS tool
          </span>
          <h1 className="mt-6 text-[clamp(2.1rem,7vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#07142f] dark:text-white">
            IELTS Band Score Calculator
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-base leading-7 text-[#515d74] dark:text-slate-300 sm:text-[17px]">
            Estimate your overall IELTS band from your four skill scores using the official rounding
            rules, set a target band, and convert Listening and Reading raw scores (out of 40) into
            band scores.
          </p>
        </section>

        {/* Tool 1: overall band */}
        <section className="mx-auto max-w-[1180px] px-5 pt-16 md:px-8">
          <SectionLabel
            icon={Calculator}
            eyebrow="Overall band"
            title="Estimate your overall band score"
            description="Move the sliders to match your latest practice results. The overall band updates live with the official IELTS averaging and rounding rules, and the target tracker shows exactly how far you are from your goal."
          />
          <OverallBandCalculator handlePrimaryCta={handlePrimaryCta} />
        </section>

        {/* Tool 2: raw score converter */}
        <section className="mx-auto max-w-[1180px] px-5 pt-20 md:px-8">
          <SectionLabel
            icon={Repeat}
            eyebrow="Raw score converter"
            title="Convert correct answers to a band score"
            description="Listening and Reading have 40 questions each with no penalty for wrong answers. Pick your test section, enter how many you got right, and see the equivalent band with the full conversion table."
          />
          <RawScoreConverter />
        </section>

        {/* Supporting content + FAQ */}
        <section className="mx-auto max-w-[820px] px-5 pb-20 pt-20 md:px-8">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-[#07142f] dark:text-white">
            How the overall IELTS band score is calculated
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#515d74] dark:text-slate-300">
            Your overall band is the average of your Listening, Reading, Writing, and Speaking
            bands, rounded to the nearest whole or half band. If the average ends in .25 it rounds
            up to the next half band, and if it ends in .75 it rounds up to the next whole band. For
            example, 6.5 + 6.5 + 6.0 + 6.0 gives an average of 6.25, which becomes an overall band
            of 6.5.
          </p>
          <h2 className="mt-10 text-2xl font-extrabold tracking-[-0.02em] text-[#07142f] dark:text-white">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <summary className="cursor-pointer text-[15px] font-bold text-[#07142f] dark:text-white">
                  {item.q}
                </summary>
                <p className="mt-3 text-[15px] leading-7 text-[#515d74] dark:text-slate-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
