import React, { lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
const FeaturesSection = lazy(() => import('@/features/core/components/landing/FeaturesSection'));
const HowItWorksSection = lazy(
  () => import('@/features/core/components/landing/HowItWorksSection')
);
const FAQSection = lazy(() => import('@/features/core/components/landing/FAQSection'));
const PricingSection = lazy(() => import('@/features/core/components/landing/PricingSection'));
const CTABanner = lazy(() => import('@/features/core/components/landing/CTABanner'));
const ComparisonSection = lazy(
  () => import('@/features/core/components/landing/ComparisonSection')
);
const viewport = { once: true, amount: 0.12 };

const faqs = [
  {
    q: 'What can I practice for free?',
    a: 'The Free plan includes IELTS Reading and Listening practice, Cambridge test sets available to free learners, one AI Writing evaluation per month, vocabulary tools, and basic progress analytics. Current limits are always shown on the pricing page.',
  },
  {
    q: 'How does the IELTS Writing feedback work?',
    a: 'After a practice task, IELTS Ai Pro returns an estimated practice band with feedback across Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. The report also highlights specific corrections and next steps.',
  },
  {
    q: 'What does the Speaking report assess?',
    a: 'Speaking reports organize practice feedback around Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. When acoustic pronunciation evidence is unavailable, the product identifies transcript-based estimates instead of presenting them as measured pronunciation scores.',
  },
  {
    q: 'Are AI band scores official IELTS results?',
    a: 'No. AI band scores are practice estimates designed to help you find patterns and choose what to improve next. Official IELTS results are issued only by authorized IELTS test providers and trained examiners.',
  },
  {
    q: 'How is the AI learning path personalized?',
    a: 'For eligible plans, the learning path uses completed practice, skill performance, target band, and study schedule to recommend focused activities. You can review progress in the analytics dashboard and continue directly into the suggested module.',
  },
  {
    q: 'Does IELTS Ai Pro cover all four IELTS skills?',
    a: 'Yes. The app includes Reading, Listening, Writing, and Speaking practice, plus Cambridge test sets, vocabulary review, study resources, progress analytics, and an adaptive learning path for eligible plans.',
  },
];

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

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('SignUp'));
  const handlePricing = () => {
    // /pricing is auth-gated; anonymous visitors compare plans on the landing page itself
    if (user && !authLoading) {
      navigate(createPageUrl('Pricing'));
      return;
    }
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <DocumentHead
        title="Free AI IELTS Practice, Band Scores & Mock Tests | IELTS Ai Pro"
        description="Get instant AI band scores for IELTS Writing & Speaking, plus free Cambridge-style Reading and Listening mock tests. Track progress and start free today."
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
            'Web-based IELTS practice platform with Reading and Listening tests, AI-assisted Writing and Speaking feedback, progress analytics, vocabulary review, and adaptive study planning.',
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

            <LazySection id="features" className="scroll-mt-28" data-oid="5f-ve:-">
              <FeaturesSection viewport={viewport} data-oid="ddzrln_" />
            </LazySection>

            <LazySection id="how-it-works" className="scroll-mt-28" data-oid="8.voqxh">
              <HowItWorksSection viewport={viewport} data-oid="jorp6_8" />
            </LazySection>

            <LazySection id="comparison" className="scroll-mt-28">
              <ComparisonSection viewport={viewport} handlePrimaryCta={handlePrimaryCta} />
            </LazySection>

            <LazySection id="pricing" className="scroll-mt-28" minHeight="800px" data-oid="txw9f10">
              <PricingSection
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="zr_aidp"
              />
            </LazySection>

            <LazySection id="faq" className="scroll-mt-28" minHeight="300px" data-oid="j:lurzc">
              <FAQSection faqs={faqs} viewport={viewport} data-oid="cw9om1r" />
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

          <LazySection minHeight="auto" data-oid="2hv100n-wrap">
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
