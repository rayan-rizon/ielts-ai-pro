import React, { useMemo, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Award from 'lucide-react/icons/award';
import BadgeCheck from 'lucide-react/icons/badge-check';
import BarChart3 from 'lucide-react/icons/bar-chart-3';
import BookOpen from 'lucide-react/icons/book-open';
import Calendar from 'lucide-react/icons/calendar';
import Sparkles from 'lucide-react/icons/sparkles';
import Target from 'lucide-react/icons/target';
import Trophy from 'lucide-react/icons/trophy';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Brain from 'lucide-react/icons/brain';

import CookieConsent from '@/components/shared/CookieConsent';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';

// Eagerly loaded components (Top of the page)
import Navbar from '@/features/core/components/landing/Navbar';
import HeroSection from '@/features/core/components/landing/HeroSection';

// Lazy loaded sections
const Footer = lazy(() => import('@/features/core/components/landing/Footer'));
const SocialProofSection = lazy(
  () => import('@/features/core/components/landing/SocialProofSection')
);
const ProblemSection = lazy(() => import('@/features/core/components/landing/ProblemSection'));
const FeaturesSection = lazy(() => import('@/features/core/components/landing/FeaturesSection'));
const FeatureShowcase = lazy(() => import('@/features/core/components/landing/FeatureShowcase'));
const ModulesSection = lazy(() => import('@/features/core/components/landing/ModulesSection'));
const HowItWorksSection = lazy(
  () => import('@/features/core/components/landing/HowItWorksSection')
);
const ResultsSection = lazy(() => import('@/features/core/components/landing/ResultsSection'));
const FAQSection = lazy(() => import('@/features/core/components/landing/FAQSection'));
const PricingSection = lazy(() => import('@/features/core/components/landing/PricingSection'));
const CTABanner = lazy(() => import('@/features/core/components/landing/CTABanner'));

const PrimaryGlow = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-oid="psa390_"
    >
      <div
        className="absolute -left-24 top-[-140px] h-[420px] w-[420px] rounded-full bg-primary/10 blur-[80px] transform-gpu"
        data-oid="nfg8_-1"
      />

      <div
        className="absolute right-[-180px] top-[140px] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[90px] transform-gpu"
        data-oid="anvd_8w"
      />

      <div
        className="absolute left-[30%] bottom-[-240px] h-[520px] w-[520px] rounded-full bg-blue-500/5 blur-[100px] transform-gpu"
        data-oid="a92tn3j"
      />
    </div>
  );
};

/**
 * LazySection - Performance Optimization Wrapper
 * Uses Suspense for code-splitting but renders immediately for SEO.
 */
function LazySection({ children, minHeight = 'auto', id = '', className = '' }) {
  return (
    <div id={id} style={{ minHeight }} className={`w-full ${className}`} data-oid="vy4_.1x">
      <Suspense fallback={<SectionSkeleton data-oid="kp:glno" />} data-oid="siy5l8e">
        {children}
      </Suspense>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, authCheckComplete } = useAuth();

  useEffect(() => {
    if (authCheckComplete && user && !authLoading) {
      if (user.onboarding_completed) {
        navigate(createPageUrl('Dashboard'));
      } else {
        navigate(createPageUrl('Onboarding'));
      }
    }
  }, [user, authLoading, authCheckComplete, navigate]);

  const viewport = useMemo(() => ({ once: true, amount: 0.15 }), []);

  const features = useMemo(
    () => [
      {
        icon: Sparkles,
        title: 'Instant AI Feedback',
        description:
          'Master IELTS Writing and Speaking with real-time fixes and band score guidance.',
        accent: 'bg-gradient-to-br from-primary/10 via-transparent to-transparent',
      },
      {
        icon: BookOpen,
        title: 'Realistic Mock Tests',
        description:
          'Practice with timed Reading and Listening modules that feel like the real exam.',
        accent: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent',
      },
      {
        icon: BarChart3,
        title: 'Band Score Analytics',
        description:
          'Track your growth and identify exactly where to focus to hit your target score.',
        accent: 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent',
      },
      {
        icon: Brain,
        title: 'AI Study Planner',
        description:
          'Get a personalized daily learning roadmap that adapts to your performance levels.',
        accent: 'bg-gradient-to-br from-violet-500/10 via-transparent to-transparent',
      },
      {
        icon: Trophy,
        title: 'Consistent Progress',
        description: 'Stay motivated with daily streaks, badges, and habit-focused learning loops.',
        accent: 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent',
      },
      {
        icon: ShieldCheck,
        title: 'Learn Anytime, Anywhere',
        description:
          'Study on any device with a lightning-fast interface designed for maximum focus.',
        accent: 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent',
      },
    ],

    []
  );

  const howItWorks = useMemo(
    () => [
      {
        icon: Target,
        title: 'Analyze Level',
        description:
          'Take a quick diagnostic test to pinpoint the exact sub-skills holding your score back.',
        accent: 'from-primary/20 via-primary/5 to-transparent',
      },
      {
        icon: Brain,
        title: 'AI Coaching',
        description:
          'Get instant feedback on Writing and Speaking with clear fixes and band score guidance.',
        accent: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
      },
      {
        icon: Trophy,
        title: 'Mock Exams',
        description:
          'Practice with full-length, exam-real modules to build speed and testing confidence.',
        accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      },
    ],

    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: 'Amina R.',
        meta: 'Academic · 6-week sprint',
        quote:
          'The IELTS Writing feedback is clear and actionable. I stopped guessing and started improving with intent.',
        metric: '+1.0 band',
        icon: Award,
      },
      {
        name: 'Daniel K.',
        meta: 'General Training · Busy schedule',
        quote:
          'The study plan kept me consistent. I always knew the next IELTS task, even with 20 minutes a day.',
        metric: 'Daily plan',
        icon: Calendar,
      },
      {
        name: 'Mei L.',
        meta: 'Academic · Target 7+',
        quote:
          'The practice feels like the real IELTS exam. Clean UI, great timing tools, and analytics that help.',
        metric: 'Exam-ready',
        icon: BadgeCheck,
      },
    ],

    []
  );

  const faqs = useMemo(
    () => [
      {
        q: 'Are the Cambridge IELTS tests free?',
        a: 'Yes! All Cambridge IELTS Reading and Listening practice tests are now completely free for all users.',
      },
      {
        q: 'Do I need a subscription for AI feedback?',
        a: 'While the tests are free, a Pro or Premium subscription is required for deep AI evaluations of your Writing and Speaking sessions.',
      },
      {
        q: 'How fast do I get my AI feedback?',
        a: 'It’s instantaneous. Our AI models analyze your writing and speaking responses in seconds, providing a detailed breakdown and an estimated band score immediately after you finish your task.',
      },
      {
        q: 'Can I track my band score progress over time?',
        a: 'Absolutely. Your personal Analytics Dashboard tracks every test and drill you take, visualizing your growth across all four modules and identifying exactly which band descriptors you need to work on.',
      },
      {
        q: 'How does the Speaking AI assess my pronunciation?',
        a: 'Our advanced speech recognition technology analyzes your recordings for fluency, intonation, and clarity. It follows official IELTS criteria to pinpoint pronunciation errors and suggests specific improvements to hit Band 7+.',
      },
    ],

    []
  );

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <>
      <DocumentHead
        title="AI IELTS Prep App With Feedback | IELTS Ai Pro"
        description="Prepare for IELTS with AI writing feedback, speaking practice, realistic mock tests, band score analytics, and personalized study plans for Band 7+ goals."
        canonicalUrl="https://www.ieltsai.pro/"
        keywords="AI IELTS preparation, IELTS writing checker, IELTS speaking practice AI, IELTS mock test online, IELTS band score feedback, free IELTS practice tests"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'IELTS Ai Pro',
          url: 'https://www.ieltsai.pro/',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description:
            'AI-powered IELTS preparation platform with instant writing and speaking feedback, realistic mock tests, and personalized AI coaching.',
          datePublished: '2025-10-15',
          dateModified: new Date().toISOString().split('T')[0],
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: '0',
            highPrice: '15.99',
            offerCount: '3',
          },
          featureList: [
            'Instant AI Writing Evaluation with Band Score',
            'AI Speaking Practice with Pronunciation Analysis',
            'Realistic IELTS Mock Tests',
            'Personalized AI Study Planner',
            'Band Score Analytics Dashboard',
            'Cambridge-style Practice Materials',
          ],
          author: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
        }}
        data-oid="r0p_zrs"
      />

      <div
        className="min-h-screen overflow-x-hidden font-sans antialiased text-foreground bg-background"
        data-oid="u8d7_ia"
      >
        <div className="relative" data-oid="gta.rl:">
          <PrimaryGlow data-oid="gcc789r" />

          <Navbar
            isDark={theme === 'dark'}
            setTheme={setTheme}
            handlePricing={handlePricing}
            handlePrimaryCta={handlePrimaryCta}
            isSignedIn={Boolean(user && !authLoading)}
            data-oid=":.wx3iw"
          />

          <main data-oid="ac5n:fg">
            <HeroSection
              handlePricing={handlePricing}
              handlePrimaryCta={handlePrimaryCta}
              isSignedIn={Boolean(user && !authLoading)}
              data-oid="fmlzvda"
            />

            <LazySection minHeight="140px" data-oid="6c:x1jw">
              <SocialProofSection data-oid="veq7adg" />
            </LazySection>

            <LazySection id="problem" className="scroll-mt-28" minHeight="650px" data-oid="1njgb:6">
              <ProblemSection viewport={viewport} data-oid="xs5pnxr" />
            </LazySection>

            <LazySection id="features" className="scroll-mt-28" data-oid="5f-ve:-">
              <FeaturesSection features={features} viewport={viewport} data-oid="ddzrln_" />
            </LazySection>

            <LazySection
              id="showcase"
              className="scroll-mt-28"
              minHeight="750px"
              data-oid="7nlwl3q"
            >
              <FeatureShowcase viewport={viewport} data-oid="d2cvnd5" />
            </LazySection>

            <LazySection id="modules" className="scroll-mt-28" minHeight="600px" data-oid="zc:cj9r">
              <ModulesSection
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="gixfpcy"
              />
            </LazySection>

            <LazySection id="how-it-works" className="scroll-mt-28" data-oid="8.voqxh">
              <HowItWorksSection howItWorks={howItWorks} viewport={viewport} data-oid="jorp6_8" />
            </LazySection>

            <LazySection id="results" className="scroll-mt-28" minHeight="400px" data-oid="yyqf3ji">
              <ResultsSection testimonials={testimonials} viewport={viewport} data-oid="l2bqgtl" />
            </LazySection>

            <LazySection id="faq" className="scroll-mt-28" minHeight="300px" data-oid="j:lurzc">
              <FAQSection faqs={faqs} viewport={viewport} data-oid="cw9om1r" />
            </LazySection>

            <LazySection id="pricing" className="scroll-mt-28" minHeight="800px" data-oid="txw9f10">
              <PricingSection
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="zr_aidp"
              />
            </LazySection>

            <LazySection minHeight="550px" data-oid="8sg2b2h">
              <CTABanner
                handlePricing={handlePricing}
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="fji.vdu"
              />
            </LazySection>
          </main>

          <LazySection minHeight="400px" data-oid="2hv100n-wrap">
            <Footer data-oid="2hv100n" />
          </LazySection>
        </div>
        <CookieConsent data-oid="cp1ushb" />
      </div>
    </>
  );
}

function SectionSkeleton() {
  return (
    <div className="py-24 flex items-center justify-center" data-oid=".soqiy5">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        data-oid="wap8bkl"
      />
    </div>
  );
}
