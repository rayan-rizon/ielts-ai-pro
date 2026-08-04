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
const MotionProvider = lazy(() => import('@/components/shared/MotionProvider'));
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
 * Keeps below-the-fold modules out of the initial network and render work.
 * Equivalent semantic content remains available in index.html for crawlers.
 */
function LazySection({
  children,
  minHeight = 'auto',
  id = '',
  className = '',
  rootMargin = '0px',
}) {
  const sectionRef = React.useRef(null);
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={sectionRef}
      id={id}
      style={{ minHeight: shouldRender ? 'auto' : minHeight }}
      className={`w-full ${className}`}
      aria-busy={!shouldRender}
      data-oid="vy4_.1x"
    >
      {shouldRender ? (
        <Suspense fallback={<SectionSkeleton data-oid="kp:glno" />} data-oid="siy5l8e">
          <MotionProvider>{children}</MotionProvider>
        </Suspense>
      ) : (
        <div aria-hidden="true" data-oid="deferred-section-placeholder" />
      )}
    </div>
  );
}

const getStructuredData = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.ieltsai.pro/#organization',
      name: 'IELTS Ai Pro',
      url: 'https://www.ieltsai.pro/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ieltsai.pro/logo.svg',
        width: 300,
        height: 72,
      },
    },
    // The questions below are the ones FAQSection renders on this page, so the
    // markup stays consistent with the visible content Google requires.
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ieltsai.pro/#faq',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.ieltsai.pro/#website',
      url: 'https://www.ieltsai.pro/',
      name: 'IELTS Ai Pro',
      publisher: { '@id': 'https://www.ieltsai.pro/#organization' },
      inLanguage: 'en',
    },
    // Deliberately a WebPage rather than a SoftwareApplication. Google's Software App
    // markup requires an aggregateRating, and the only way to satisfy that would be to
    // publish review data the product has not collected. Every page still emitting a
    // SoftwareApplication node was reported as a structured-data error, so the node is
    // dropped; reinstate it only alongside genuine reviews. This mirrors the static
    // graph in index.html, which is what non-rendering crawlers read.
    {
      '@type': 'WebPage',
      '@id': 'https://www.ieltsai.pro/#webpage',
      url: 'https://www.ieltsai.pro/',
      name: 'Free AI IELTS Practice & Mock Tests',
      description:
        'Web-based IELTS practice platform with Reading and Listening tests, AI-assisted Writing and Speaking feedback, progress analytics, vocabulary review, and adaptive study planning.',
      inLanguage: 'en',
      datePublished: '2025-10-15',
      dateModified: '2026-07-26',
      isPartOf: { '@id': 'https://www.ieltsai.pro/#website' },
      about: { '@id': 'https://www.ieltsai.pro/#organization' },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: 'https://www.ieltsai.pro/og.webp',
      },
    },
  ],
});

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, authCheckComplete } = useAuth();

  const isSignedIn = Boolean(user && !authLoading);

  useEffect(() => {
    if (authCheckComplete && isSignedIn) {
      const targetPage = user?.onboarding_completed ? 'Dashboard' : 'Onboarding';
      navigate(createPageUrl(targetPage));
    }
  }, [authCheckComplete, isSignedIn, user?.onboarding_completed, navigate]);

  const handlePrimaryCta = () => {
    navigate(createPageUrl(isSignedIn ? 'Dashboard' : 'SignUp'));
  };

  const handlePricing = () => {
    // /pricing is auth-gated; anonymous visitors compare plans on the landing page itself
    if (isSignedIn) {
      navigate(createPageUrl('Pricing'));
      return;
    }
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <DocumentHead
        title="Free AI IELTS Practice & Mock Tests | IELTS Ai Pro"
        description="Get instant AI band scores for IELTS Writing & Speaking, plus free Cambridge-style Reading and Listening mock tests. Track progress and start free today."
        canonicalUrl="https://www.ieltsai.pro/"
        keywords="AI IELTS preparation, IELTS writing checker, IELTS speaking practice AI, IELTS mock test online, IELTS band score feedback, free IELTS practice tests"
        structuredData={getStructuredData()}
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
            isSignedIn={isSignedIn}
            data-oid=":.wx3iw"
          />

          <main data-oid="ac5n:fg">
            <HeroSection
              handlePricing={handlePricing}
              handlePrimaryCta={handlePrimaryCta}
              isSignedIn={isSignedIn}
              data-oid="fmlzvda"
            />

            <LazySection
              id="features"
              className="scroll-mt-28"
              minHeight="1100px"
              data-oid="5f-ve:-"
            >
              <FeaturesSection viewport={viewport} data-oid="ddzrln_" />
            </LazySection>

            <LazySection
              id="how-it-works"
              className="scroll-mt-28"
              minHeight="900px"
              data-oid="8.voqxh"
            >
              <HowItWorksSection viewport={viewport} data-oid="jorp6_8" />
            </LazySection>

            <LazySection id="comparison" className="scroll-mt-28" minHeight="900px">
              <ComparisonSection viewport={viewport} handlePrimaryCta={handlePrimaryCta} />
            </LazySection>

            <LazySection id="pricing" className="scroll-mt-28" minHeight="850px" data-oid="txw9f10">
              <PricingSection
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="zr_aidp"
              />
            </LazySection>

            <LazySection id="faq" className="scroll-mt-28" minHeight="650px" data-oid="j:lurzc">
              <FAQSection faqs={faqs} viewport={viewport} data-oid="cw9om1r" />
            </LazySection>

            <LazySection id="cta" minHeight="auto" data-oid="8sg2b2h">
              <CTABanner
                handlePricing={handlePricing}
                handlePrimaryCta={handlePrimaryCta}
                viewport={viewport}
                data-oid="fji.vdu"
              />
            </LazySection>
          </main>

          <div data-oid="2hv100n-wrap">
            <Suspense fallback={<SectionSkeleton />}>
              <Footer data-oid="2hv100n" />
            </Suspense>
          </div>
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
