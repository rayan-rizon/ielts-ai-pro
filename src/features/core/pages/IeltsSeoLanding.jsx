import { Link, useLocation } from 'react-router-dom';
import ArrowRight from 'lucide-react/icons/arrow-right';
import BarChart3 from 'lucide-react/icons/bar-chart-3';
import BookOpenCheck from 'lucide-react/icons/book-open-check';
import Check from 'lucide-react/icons/check';
import Headphones from 'lucide-react/icons/headphones';
import Mic2 from 'lucide-react/icons/mic-2';
import PenLine from 'lucide-react/icons/pen-line';
import Sparkles from 'lucide-react/icons/sparkles';

import CookieConsent from '@/components/shared/CookieConsent';
import DocumentHead from '@/components/shared/DocumentHead';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';

const SITE_URL = 'https://www.ieltsai.pro';

const PAGE_CONFIG = {
  speaking: {
    path: '/ielts-speaking-practice-ai',
    title: 'AI IELTS Speaking Practice with Feedback',
    description:
      'Practise IELTS Speaking Parts 1–3 with an AI simulator, estimated band guidance, and focused feedback on fluency, vocabulary, grammar, and pronunciation.',
    keywords:
      'AI IELTS speaking practice, IELTS speaking simulator, IELTS speaking questions, IELTS speaking feedback, IELTS speaking practice online',
    eyebrow: 'AI speaking practice',
    heading: 'Practise IELTS Speaking with feedback you can act on',
    answer:
      'IELTS Ai Pro simulates Speaking Parts 1–3, records your response, and turns the available speech and transcript evidence into estimated criterion-level feedback. You get a clear next step instead of a single unexplained score.',
    primaryCta: 'Start speaking practice',
    primaryHref: '/signup',
    secondaryCta: 'Explore speaking guides',
    secondaryHref: '/blog?category=Speaking',
    heroAlt: 'Adult IELTS learner practising a speaking response with a laptop',
    accent: 'from-indigo-600 to-violet-500',
    icon: Mic2,
    proof: [
      ['Parts 1–3', 'Realistic question flow'],
      ['4 criteria', 'Focused practice feedback'],
      ['One report', 'Prioritised next steps'],
    ],
    features: [
      {
        icon: Mic2,
        title: 'Real speaking flow',
        text: 'Move from short personal questions to a two-minute response and deeper Part 3 discussion.',
      },
      {
        icon: BarChart3,
        title: 'Criterion-level guidance',
        text: 'Review fluency, vocabulary, grammar, and pronunciation evidence with transparent limitations.',
      },
      {
        icon: Sparkles,
        title: 'A useful next drill',
        text: 'Turn the report into one focused action for your next answer instead of repeating the full test blindly.',
      },
    ],
    steps: [
      [
        'Choose a speaking test',
        'Select a realistic Part 1–3 practice set and prepare your microphone.',
      ],
      [
        'Answer naturally',
        'Speak at normal pace without memorising a script or forcing advanced words.',
      ],
      [
        'Review and repeat',
        'Use the strongest evidence in the report to plan one measurable improvement.',
      ],
    ],
    faqs: [
      {
        q: 'Can AI accurately score IELTS Speaking?',
        a: 'AI can provide useful practice estimates and pattern-based feedback, but it cannot issue an official IELTS result. IELTS Ai Pro labels practice estimates and explains when pronunciation evidence is limited.',
      },
      {
        q: 'Does the practice cover all three IELTS Speaking parts?',
        a: 'Yes. Practice sets can include short Part 1 questions, a Part 2 cue-card response, and more analytical Part 3 follow-up questions.',
      },
      {
        q: 'How should I use the feedback?',
        a: 'Choose one priority from the report, practise it in a shorter drill, then record another answer and compare the evidence. Small focused repetitions are more useful than chasing a score after every response.',
      },
    ],
  },
  practice: {
    path: '/cambridge-ielts-practice-tests',
    title: 'Cambridge IELTS Practice Tests Online',
    description:
      'Take Cambridge-style IELTS Reading and Listening practice tests online, review answers, estimate band scores, and track the mistakes that affect your result.',
    keywords:
      'Cambridge IELTS practice test, free IELTS practice test, IELTS mock test online, IELTS reading practice test, IELTS listening practice test',
    eyebrow: 'Online IELTS practice tests',
    heading: 'Cambridge-style IELTS practice with a review loop',
    answer:
      'IELTS Ai Pro gives you timed Reading and Listening practice in a computer-based workspace, then helps you review question-level mistakes and estimated band progress. Use a full mock test to diagnose; use focused sets to improve.',
    primaryCta: 'Start a free practice test',
    primaryHref: '/signup',
    secondaryCta: 'Calculate your band',
    secondaryHref: '/ielts-band-score-calculator',
    heroAlt: 'Adult IELTS learner reviewing a computer-based practice test',
    accent: 'from-emerald-500 to-indigo-600',
    icon: BookOpenCheck,
    proof: [
      ['Reading', 'Timed question sets'],
      ['Listening', 'Cambridge-style practice'],
      ['Review', 'Answers and progress'],
    ],
    features: [
      {
        icon: BookOpenCheck,
        title: 'Reading practice',
        text: 'Work through common IELTS question types in a focused, computer-based test workspace.',
        id: 'reading',
      },
      {
        icon: Headphones,
        title: 'Listening practice',
        text: 'Practise following the question sequence, predicting answer forms, and recovering after a missed answer.',
        id: 'listening',
      },
      {
        icon: PenLine,
        title: 'Review that changes the next test',
        text: 'Use answer evidence and progress analytics to separate knowledge gaps from timing and question-type errors.',
      },
    ],
    steps: [
      [
        'Take a diagnostic set',
        'Complete one realistic section without pausing or checking answers.',
      ],
      [
        'Classify every error',
        'Label the cause: vocabulary, evidence, spelling, timing, or question technique.',
      ],
      [
        'Repeat a focused drill',
        'Practise the weakest pattern before taking another complete mock test.',
      ],
    ],
    faqs: [
      {
        q: 'Are these official Cambridge IELTS tests?',
        a: 'No. IELTS Ai Pro is an independent preparation platform and is not affiliated with Cambridge, IELTS, IDP, or the British Council. The practice experience is designed around familiar IELTS-style skills and question formats.',
      },
      {
        q: 'Can I practise IELTS Reading and Listening for free?',
        a: 'A free account provides access to selected practice. Availability and limits can vary by plan, and the app shows the current allowance before you begin.',
      },
      {
        q: 'Should I take a full mock test every day?',
        a: 'Usually not. Use full tests to measure readiness, then spend more time on short drills that target the exact question types and error causes found in your review.',
      },
    ],
  },
};

function getConfig(pathname) {
  return pathname === PAGE_CONFIG.speaking.path ? PAGE_CONFIG.speaking : PAGE_CONFIG.practice;
}

function createStructuredData(config) {
  const canonical = `${SITE_URL}${config.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: config.title,
        description: config.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'SoftwareApplication',
        name: config.title,
        url: canonical,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: config.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: config.faqs.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: config.title, item: canonical },
        ],
      },
    ],
  };
}

function Hero({ config }) {
  const Icon = config.icon;
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-[#f7f8ff] pt-28 dark:border-white/10 dark:bg-[#08080a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.14),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.12),transparent_28%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pb-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-indigo-700 shadow-sm dark:border-indigo-400/20 dark:bg-white/5 dark:text-indigo-300">
            <Icon className="h-4 w-4" /> {config.eyebrow}
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.15rem] dark:text-white">
            {config.heading}
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 dark:text-slate-300">
            {config.answer}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={config.primaryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"
            >
              {config.primaryCta} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={config.secondaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white/80 px-6 py-3 text-sm font-extrabold text-slate-800 transition hover:border-indigo-400 hover:text-indigo-700 dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              {config.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            className={`absolute -inset-4 rounded-[2.2rem] bg-gradient-to-br ${config.accent} opacity-15 blur-2xl`}
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-[0_30px_80px_-32px_rgba(30,41,59,.45)] dark:border-white/10 dark:bg-slate-900">
            <img
              src="/ielts-hero-student.webp"
              alt={config.heroAlt}
              width="1200"
              height="900"
              fetchPriority="high"
              className="aspect-[4/3] w-full rounded-[1.45rem] object-cover"
            />
            <div className="grid gap-2 p-2 pt-4 sm:grid-cols-3">
              {config.proof.map(([value, label]) => (
                <div key={value} className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-white/5">
                  <strong className="block text-sm font-black text-slate-950 dark:text-white">
                    {value}
                  </strong>
                  <span className="mt-1 block text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ config }) {
  return (
    <section className="bg-white py-20 dark:bg-[#0b0b0e]">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-slate-950 sm:text-4xl dark:text-white">
            Practice that ends with a decision
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {config.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                id={feature.id}
                className="scroll-mt-28 rounded-3xl border border-slate-200 bg-slate-50/70 p-7 transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-950/5 dark:border-white/10 dark:bg-white/[.035]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {feature.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection({ config }) {
  return (
    <section className="border-y border-slate-200/70 bg-[#f7f8ff] py-20 dark:border-white/10 dark:bg-[#08080a]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-600 dark:text-emerald-400">
            A better review loop
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-slate-950 sm:text-4xl dark:text-white">
            Diagnose, focus, repeat
          </h2>
          <p className="mt-4 max-w-lg text-base font-medium leading-7 text-slate-600 dark:text-slate-300">
            A score is useful only when it changes what you practise next. Keep the loop small
            enough to repeat consistently.
          </p>
        </div>
        <ol className="space-y-4">
          {config.steps.map(([title, text], index) => (
            <li
              key={title}
              className="grid grid-cols-[3rem_1fr] gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[.04]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                0{index + 1}
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FaqSection({ config }) {
  return (
    <section className="bg-white py-20 dark:bg-[#0b0b0e]">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        <p className="text-center text-xs font-extrabold uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-400">
          Clear answers
        </p>
        <h2 className="mt-3 text-center text-3xl font-black tracking-[-.035em] text-slate-950 sm:text-4xl dark:text-white">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-4">
          {config.faqs.map((item) => (
            <article
              key={item.q}
              className="rounded-2xl border border-slate-200 p-6 dark:border-white/10 dark:bg-white/[.025]"
            >
              <h3 className="flex gap-3 text-lg font-black text-slate-950 dark:text-white">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                {item.q}
              </h3>
              <p className="mt-3 pl-8 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                {item.a}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function IeltsSeoLanding() {
  const { pathname } = useLocation();
  const config = getConfig(pathname);
  return (
    <div className="min-h-screen bg-white font-sans text-slate-950 dark:bg-[#08080a] dark:text-white">
      <DocumentHead
        title={config.title}
        description={config.description}
        canonicalUrl={`${SITE_URL}${config.path}`}
        image={`${SITE_URL}/ielts-hero-student.webp`}
        imageAlt={config.heroAlt}
        imageWidth={1200}
        imageHeight={900}
        keywords={config.keywords}
        structuredData={createStructuredData(config)}
      />
      <PublicNavbar />
      <main>
        <Hero config={config} />
        <FeatureSection config={config} />
        <ProcessSection config={config} />
        <FaqSection config={config} />
        <section className="bg-slate-950 py-16 text-white dark:bg-indigo-950/40">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-6">
            <Sparkles className="h-7 w-7 text-emerald-300" />
            <h2 className="mt-4 text-3xl font-black tracking-[-.035em] sm:text-4xl">
              Turn the next practice session into evidence
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
              Start free, review what changed, and use the result to choose the next focused drill.
            </p>
            <Link
              to={config.primaryHref}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-100"
            >
              {config.primaryCta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
