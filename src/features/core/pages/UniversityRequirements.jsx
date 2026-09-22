import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import GraduationCap from 'lucide-react/icons/graduation-cap';
import Sparkles from 'lucide-react/icons/sparkles';
import ArrowRight from 'lucide-react/icons/arrow-right';
import Check from 'lucide-react/icons/check';
import Star from 'lucide-react/icons/star';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import Layers from 'lucide-react/icons/layers';
import BookOpen from 'lucide-react/icons/book-open';
import Headphones from 'lucide-react/icons/headphones';
import Plus from 'lucide-react/icons/plus';
import Minus from 'lucide-react/icons/minus';
import Target from 'lucide-react/icons/target';
import LineChart from 'lucide-react/icons/line-chart';

import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import DocumentHead from '@/components/shared/DocumentHead';
import CookieConsent from '@/components/shared/CookieConsent';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import {
  PANEL,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  IconChip,
  Pill,
} from '@/features/dashboard/components/primitives';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import UniversityMatchTool from '@/features/university-match/components/UniversityMatchTool';
import { TOTAL_VERIFIED_ENTRIES } from '@/features/university-match/universityData';

const Footer = lazy(() => import('@/features/core/components/landing/Footer'));

const CANONICAL = 'https://www.ieltsai.pro/ielts-university-requirements';

const faqs = [
  {
    q: 'What IELTS score do I need for university admission?',
    a: 'Many universities set a common baseline of 6.0 to 6.5 overall with a minimum in each skill, while competitive courses may require 7.0 or higher. The exact IELTS university requirement depends on the country, institution, course, and study level.',
  },
  {
    q: 'Why does the overall band matter less than my weakest skill?',
    a: 'Almost every university sets a strict floor for each of the four skills alongside the overall band. A 6.5 overall with 5.5 in Writing fails a 6.0 component minimum, so the application is rejected even though the overall band meets or exceeds the headline requirement.',
  },
  {
    q: 'Do all universities publish a single IELTS requirement?',
    a: 'No. Requirements often vary by country, course, department, and study level. Universities may publish a range or tiered levels instead of one figure, so this page shows the available requirement and links to the official university source.',
  },
  {
    q: 'How current is this data?',
    a: 'Every entry shows the date a person last checked it against the university’s own page and links directly to that page. Entries older than a year are flagged as pending annual review rather than presented as verified current.',
  },
  {
    q: 'What if I am half a band short?',
    a: 'Many universities run pre-sessional English courses (typically 6 to 10 weeks over summer) that admit applicants who are 0.5 below the requirement. Lifting a single weak skill with targeted practice is also often faster than re-sitting the entire test.',
  },
];

function UniversityRequirementsHead() {
  return (
    <DocumentHead
      title="IELTS University Requirements by Country | IELTS Ai Pro"
      description="Check IELTS university requirements by country. Compare overall scores and section minimums, then see which universities your band meets before applying."
      canonicalUrl={CANONICAL}
      imageAlt="Student comparing IELTS university requirements by country"
      keywords="IELTS university requirements, IELTS requirements by university, IELTS score for university admission, minimum IELTS score for university, IELTS requirements by country, IELTS university entry requirements, university IELTS checker"
      structuredData={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'IELTS University Requirements Checker',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            url: CANONICAL,
            description:
              'Match your IELTS band scores against university entry requirements by country, course, and study level, including per-skill minimums and links to each official source page.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
                name: 'IELTS University Requirements',
                item: CANONICAL,
              },
            ],
          },
        ],
      }}
    />
  );
}

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
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
        <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-black leading-[1.1] tracking-tight text-[#07142f] dark:text-white">
          {title}
        </h2>
        <p className="max-w-[540px] text-[13.5px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function UniversityRequirementsHero() {
  const scrollToChecker = () => {
    document.getElementById('university-requirements-checker')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 pt-4 sm:px-6 lg:px-8">
      <div className={`${PANEL} relative overflow-hidden p-0`}>
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)]">
          {/* Left Column: Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-7 sm:px-8 sm:py-8 lg:items-start lg:text-left lg:pl-9 lg:pr-5 lg:py-9">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              Global university admissions
            </span>

            <h1 className="mt-4 text-[clamp(1.6rem,4.6vw,3.35rem)] font-black leading-[1.04] tracking-[-0.045em] text-[#07142f] dark:text-white">
              <span className="block">IELTS University</span>
              <span className="mt-1 block">
                Requirements{' '}
                <span className="relative inline-block font-handwritten text-[#5262ef] dark:text-violet-300">
                  by Country
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

            <p className="mt-4 max-w-lg text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15.5px]">
              Compare the score you need for university admission, then check your overall band{' '}
              <strong className="font-extrabold text-[#07142f] dark:text-white">
                and every component minimum
              </strong>{' '}
              before you apply.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={scrollToChecker}
                className="inline-flex items-center gap-2 rounded-xl bg-[#5a63df] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(90,99,223,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4a53cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-[#141319]"
              >
                Compare requirements
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </button>
              <a
                href="#university-requirements-journey"
                className="inline-flex items-center gap-2 rounded-xl border border-[#e4e2f0] bg-white px-5 py-2.5 text-xs font-extrabold text-slate-700 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/40 hover:text-[#5a63df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:text-violet-300 dark:focus-visible:ring-offset-[#141319]"
              >
                How matching works
              </a>
            </div>

            <div className="mt-6 grid w-full max-w-lg grid-cols-3 border-y border-[#e6e8f5] py-3 text-center dark:border-white/8">
              <div className="border-r border-[#e6e8f5] px-2 dark:border-white/8 lg:text-left lg:pl-0 lg:pr-3">
                <span
                  className={`${NUM} block text-xl font-black text-[#07142f] dark:text-white sm:text-2xl`}
                >
                  {TOTAL_VERIFIED_ENTRIES}
                </span>
                <span className={`${MICRO} ${MUTED} mt-0.5 block`}>Institutions</span>
              </div>
              <div className="border-r border-[#e6e8f5] px-2 dark:border-white/8 lg:text-left lg:px-3">
                <span
                  className={`${NUM} block text-xl font-black text-[#07142f] dark:text-white sm:text-2xl`}
                >
                  4
                </span>
                <span className={`${MICRO} ${MUTED} mt-0.5 block`}>Skill floors</span>
              </div>
              <div className="px-2 lg:text-left lg:pl-3 lg:pr-0">
                <span
                  className={`${NUM} block text-xl font-black text-[#07142f] dark:text-white sm:text-2xl`}
                >
                  0–9
                </span>
                <span className={`${MICRO} ${MUTED} mt-0.5 block`}>Band scale</span>
              </div>
            </div>
          </div>

          {/* Right Column: Properly Masked & Blended Image */}
          <div className="relative h-[280px] sm:h-[340px] lg:h-full lg:min-h-0 w-full overflow-hidden">
            <img
              src="/assets/university-requirements/university-requirements-campus-hero-v3.webp"
              alt="International student walking through a university campus with an admissions folder"
              width="1774"
              height="887"
              // React 18 drops the camel-cased `fetchPriority`, so the hint never
              // reaches the LCP image. Lowercase is the convention used by every
              // other hero here (see Logo.jsx).
              {...{ fetchpriority: 'high' }}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[58%_center] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_20%,black_100%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_20%,black_100%)]"
            />

            {/* Top Route Indicator */}
            <div className="absolute right-4 top-4 z-10 hidden sm:flex items-center gap-2 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-[#07142f] shadow-sm backdrop-blur-xs dark:border-white/10 dark:bg-[#141319]/90 dark:text-white">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden="true"
              />
              Your application route
            </div>

            {/* Bottom Floating Badge in Solid Area */}
            <div className="absolute bottom-4 right-4 z-10 hidden sm:flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-4 py-2.5 shadow-[0_10px_25px_-6px_rgba(15,23,42,0.15)] backdrop-blur-md dark:border-white/10 dark:bg-[#141319]/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                <GraduationCap className="h-4 w-4" />
              </span>
              <div className="text-left">
                <span className="block text-xs font-black tracking-tight text-slate-900 dark:text-white">
                  2026 Admissions Checked
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Overall band + 4 skill floors
                </span>
              </div>
              <Pill tone="ok" className="shrink-0 text-[9px] ml-1">
                Live Data
              </Pill>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UniversityRequirementsCheckerHeader() {
  return (
    <div className={`${PANEL} mb-6 overflow-hidden p-4 sm:p-5 lg:p-6`}>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left sm:gap-6 lg:gap-7">
        {/* 3D Journey Illustration */}
        <div className="relative mx-auto h-24 w-24 shrink-0 sm:mx-0 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
          <img
            src="/assets/university-requirements/university-requirements-journey-v1.png"
            alt="Passport, world map, graduation cap, and university application checklist"
            width="1254"
            height="1254"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#ded9ff] bg-[#f2f0ff] text-[#5a63df] dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300">
              <GraduationCap className="h-3.5 w-3.5 stroke-2" />
            </span>
            <span className={`${MICRO} text-[#5a63df] dark:text-violet-300`}>
              01 · Requirements Checker
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black tracking-tight text-[#07142f] dark:text-white sm:text-xl lg:text-2xl">
            Match Your Scores Against University Requirements
          </h2>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 sm:text-[13.5px]">
            Adjust your skill bands and choose your level. {TOTAL_VERIFIED_ENTRIES} verified
            institutions checked against official admission pages with direct source links.
          </p>
        </div>

        {/* 3 Quick Steps */}
        <div className="hidden border-l border-[#e6e8f5] pl-5 text-center dark:border-white/8 md:grid md:grid-cols-3 md:gap-3 md:w-[240px] lg:w-[260px] lg:pl-6">
          {[
            ['01', 'Compare'],
            ['02', 'Check'],
            ['03', 'Apply'],
          ].map(([step, label]) => (
            <div key={step}>
              <span className={`${NUM} text-sm font-black text-[#5a63df] dark:text-violet-300`}>
                {step}
              </span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UniversityRequirementsInsights() {
  const insights = [
    {
      icon: AlertTriangle,
      tone: 'amber',
      pill: 'Crucial Rule',
      pillTone: 'warn',
      title: 'The Component Minimum Trap',
      detail:
        'A candidate with Band 7.0 (L 7.5, R 7.5, S 7.0, W 5.5) will be rejected by universities demanding a 6.0 writing floor. Over 80% of preventable admission rejections stem from missing a single skill floor rather than the overall band.',
    },
    {
      icon: Layers,
      tone: 'accent',
      pill: 'Course Variation',
      pillTone: 'accent',
      title: 'Requirements Vary by Department',
      detail:
        'Requirements vary by country, institution, study level, and course. Professional programmes such as Law, Medicine, Nursing, and MBA degrees often demand Band 7.0–7.5, while other courses may accept 6.0–6.5.',
    },
    {
      icon: GraduationCap,
      tone: 'emerald',
      pill: 'Fast-Track Route',
      pillTone: 'ok',
      title: 'Pre-Sessional English Route',
      detail:
        'If your score is half a band (0.5) below a course requirement, check whether that institution offers a pre-sessional or pathway route. Availability and progression rules vary by country and university.',
    },
  ];

  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 lg:px-8">
      <SectionHeading
        icon={BookOpen}
        index="02"
        eyebrow="Key Admission Insights"
        title="3 Critical Rules of University IELTS Requirements"
        description="Knowing how admissions officers parse your test report form prevents unexpected rejections and saves months of application delays."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {insights.map((item) => (
          <div
            key={item.title}
            className={`${PANEL} group relative p-5 sm:p-6 transition-all duration-250 ease-smooth-out transform-gpu will-change-transform [backface-visibility:hidden] hover:-translate-y-0.5 hover:border-[#5a63df]/35 hover:shadow-[0_10px_25px_-5px_rgba(90,99,223,0.1),0_8px_10px_-6px_rgba(90,99,223,0.06)] dark:hover:border-violet-400/30 dark:hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]`}
          >
            <div className="flex items-center justify-between gap-3">
              <IconChip icon={item.icon} tone={item.tone} size="md" />
              <Pill tone={item.pillTone}>{item.pill}</Pill>
            </div>

            <h3
              className={`${TITLE} mt-4 text-[15px] font-black text-slate-900 transition-colors duration-200 ease-smooth-out group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-violet-300`}
            >
              {item.title}
            </h3>

            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function UniversityRequirementsFaq({ onStartPractice }) {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="border-t border-[#e6e8f5] pt-12 dark:border-white/8">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
          {/* Left Sticky Column */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div>
              <span className={`${MICRO} ${MUTED}`}>03 · FAQ</span>
              <h2 className="mt-2 text-[clamp(1.6rem,2.8vw,2.2rem)] font-black leading-tight tracking-tight text-[#07142f] dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Understand how university language minimums, component floors, and conditional
                offers actually work.
              </p>
            </div>

            {/* Help Card */}
            <div className={`${PANEL} p-5 text-left shadow-xs`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                  <Headphones className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Need Personal Guidance?
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Our team is here to help with your test prep.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onStartPractice}
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
                  className={`${PANEL} border px-4 py-1 text-left sm:px-5 transition-all duration-200`}
                >
                  <AccordionTrigger className="group py-4 text-left hover:no-underline [&>svg]:hidden">
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-[14.5px] font-extrabold tracking-tight text-slate-900 group-hover:text-[#5a63df] dark:text-white dark:group-hover:text-violet-300">
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

function UniversityRequirementsCta({ onStartPractice }) {
  const learnerAvatars = [33, 47, 12, 32, 5];

  const benefits = [
    { icon: Target, title: 'Target Calibration' },
    { icon: LineChart, title: 'Criterion-Level Scoring' },
    { icon: Star, title: 'Bridge Weak Skills' },
  ];

  return (
    <section className="mx-auto mt-16 max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="relative isolate overflow-hidden rounded-3xl border border-[#ded9ff] bg-linear-to-br from-white via-[#f9f8ff] to-[#f2f0ff] p-5 shadow-sm dark:border-violet-500/25 dark:from-[#141319] dark:via-[#131218] dark:to-[#100f15] sm:p-7 lg:p-8">
        <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Left Column */}
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-200">
              <Sparkles className="h-3.5 w-3.5 text-[#6256ef] dark:text-violet-300" />
              Take the Next Step
            </span>

            <h2 className="text-balance text-[clamp(1.5rem,2.6vw,2.2rem)] font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              Know the band you need.{' '}
              <span className="font-handwritten text-[#5a63df] dark:text-violet-300">
                Now find out the band you have.
              </span>
            </h2>

            <p className="max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              IELTS Ai Pro grades your writing and speaking against official examiner criteria to
              pinpoint the exact skill holding your application back.
            </p>

            {/* Benefit Row — one compact line, not three two-line blocks. The
                description under each title only restated the title, so it
                was height spent on repetition rather than new information. */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
              {benefits.map((b) => {
                const BIcon = b.icon;
                return (
                  <div key={b.title} className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#5a63df]/10 text-[#5a63df] dark:text-violet-300">
                      <BIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {b.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Action Card */}
          <div className="flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={onStartPractice}
              className="group relative block w-full max-w-full overflow-hidden rounded-2xl border border-[#ded9ff] bg-white text-left shadow-lg transition-all duration-250 ease-smooth-out transform-gpu will-change-transform [backface-visibility:hidden] hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-[#18171f] sm:max-w-[360px]"
            >
              {/* Card Header Banner */}
              <div className="relative overflow-hidden bg-[#5a63df] p-4 text-white">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                  <Sparkles className="h-3 w-3" />
                  Free Diagnostic Included
                </span>

                {/*
                  No supporting paragraph here — it only repeated the left
                  column's sentence in slightly different words. The badge,
                  heading, and feature pills already say what this does.
                */}
                <h3 className="mt-2 text-base font-black tracking-tight leading-tight">
                  Test Your True IELTS Band
                </h3>

                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-white/90">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <Check className="h-3 w-3" /> Band 0-9 Estimate
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5">
                    <Check className="h-3 w-3" /> No Credit Card
                  </span>
                </div>
              </div>

              {/* Card Footer with Avatars */}
              <div className="flex items-center justify-between border-t border-[#e4e2f0] bg-[#fbfbfe] px-4 py-3 dark:border-white/10 dark:bg-[#141319]">
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

export default function UniversityRequirements() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Practice CTAs on this page drive account creation: a signed-out visitor
  // goes to sign-up, a signed-in one goes straight back to their dashboard.
  const handleStartPractice = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('SignUp'));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfdff] text-foreground transition-colors duration-300 dark:bg-[#08080a]">
      <UniversityRequirementsHead />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-linear-to-b from-[#f3f5ff] via-[#fafbff] to-transparent dark:from-[#11121a] dark:via-[#0b0c11] dark:to-transparent"
      />

      <PublicNavbar />

      <main className="relative z-10 pb-16 pt-[76px] sm:pt-20">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <UniversityRequirementsHero />
        </m.div>

        {/* Requirements Matcher Tool Section */}
        <section
          id="university-requirements-checker"
          className="mx-auto max-w-7xl px-5 pt-6 sm:pt-8 sm:px-6 lg:px-8"
        >
          <UniversityRequirementsCheckerHeader />
          <UniversityMatchTool handlePrimaryCta={handleStartPractice} />
        </section>

        {/* 3 Critical Rules Section */}
        <m.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <UniversityRequirementsInsights />
        </m.div>

        {/* FAQ Section */}
        <m.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <UniversityRequirementsFaq onStartPractice={handleStartPractice} />
        </m.div>

        {/* Bottom CTA Banner */}
        <m.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <UniversityRequirementsCta onStartPractice={handleStartPractice} />
        </m.div>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <CookieConsent />
    </div>
  );
}
