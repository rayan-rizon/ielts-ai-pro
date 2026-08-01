import React, { useMemo } from 'react';
import { m } from 'framer-motion';

import CookieConsent from '@/components/shared/CookieConsent';
import DocumentHead from '@/components/shared/DocumentHead';
import { useAuth } from '@/features/auth/context/AuthContext';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import { FAQS } from './checker/checkerConstants';
import HeroSection from './checker/HeroSection';
import HowItWorksSection from './checker/HowItWorksSection';
import FaqSection from './checker/FaqSection';
import CtaSection from './checker/CtaSection';

/** Build the JSON-LD structured data once per mount. */
function useStructuredData() {
  return useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://www.ieltsai.pro/ielts-writing-checker#webpage',
          url: 'https://www.ieltsai.pro/ielts-writing-checker',
          name: 'Free IELTS Writing Checker for Task 1 & Task 2',
          description:
            'Free IELTS Writing Checker for Academic Task 1 and Task 2 with estimated band scores and feedback on all four writing criteria.',
          primaryImageOfPage: {
            '@type': 'ImageObject',
            '@id': 'https://www.ieltsai.pro/ielts-writing-checker#primaryimage',
            url: 'https://www.ieltsai.pro/ielts-hero-student.webp',
            contentUrl: 'https://www.ieltsai.pro/ielts-hero-student.webp',
            width: 1200,
            height: 900,
            caption:
              'Student reviewing Academic IELTS Writing Task 1 and Task 2 feedback on a laptop.',
          },
          mainEntity: { '@id': 'https://www.ieltsai.pro/ielts-writing-checker#app' },
        },
        {
          '@type': 'WebApplication',
          '@id': 'https://www.ieltsai.pro/ielts-writing-checker#app',
          name: 'Free IELTS Writing Checker for Task 1 & Task 2',
          url: 'https://www.ieltsai.pro/ielts-writing-checker',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          description:
            'Free Academic IELTS Writing Task 1 and Task 2 checker with estimated band scores and criterion-level AI-assisted practice feedback.',
          image: { '@id': 'https://www.ieltsai.pro/ielts-writing-checker#primaryimage' },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Three free writing feedback reports for new accounts.',
          },
        },
        {
          '@type': 'HowTo',
          name: 'How to check your Academic IELTS writing',
          step: [
            {
              '@type': 'HowToStep',
              name: 'Choose Task 1 or Task 2',
              text: 'Select the Academic IELTS writing task you want to practise.',
            },
            {
              '@type': 'HowToStep',
              name: 'Add your response',
              text: 'Paste or write your response and check the word count.',
            },
            {
              '@type': 'HowToStep',
              name: 'Analyse the response',
              text: 'Request a personalised report when the response is ready.',
            },
            {
              '@type': 'HowToStep',
              name: 'Review and improve',
              text: 'Use the estimated band, four criterion scores, and suggestions to plan your next response.',
            },
          ],
        },
        {
          '@type': 'FAQPage',
          mainEntity: FAQS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        },
      ],
    }),
    []
  );
}

export default function IeltsWritingChecker() {
  const { user, loading: authLoading } = useAuth();
  const structuredData = useStructuredData();

  return (
    <div className="min-h-screen bg-white dark:bg-[#08080a] transition-colors duration-300">
      <DocumentHead
        title="Free IELTS Writing Checker – Task 1 & 2 Band Score & Feedback"
        description="Paste your Academic IELTS Task 1 or Task 2 response and instantly receive an estimated band score with detailed feedback on all four writing criteria."
        canonicalUrl="https://www.ieltsai.pro/ielts-writing-checker"
        keywords="IELTS writing checker, IELTS Task 1 checker, IELTS Task 2 checker, free IELTS writing feedback, IELTS band score checker, Academic IELTS writing"
        structuredData={structuredData}
      />
      <PublicNavbar />

      <main>
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroSection user={user} authLoading={authLoading} />
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <HowItWorksSection />
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <FaqSection />
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <CtaSection />
        </m.div>
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
