import React from 'react';
import DocumentHead from '@/components/shared/DocumentHead';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import Footer from '@/features/core/components/landing/Footer';
import CookieConsent from '@/components/shared/CookieConsent';
import { institutionLanding as content, institutionFaqs } from '../content/landingContent';
import InstitutionHeroSection from '../components/landing/InstitutionHeroSection';
import {
  InstitutionPortalFeaturesSection,
  InstitutionPracticeSkillsSection,
  InstitutionAcademicBenefitsSection,
  InstitutionHowItWorksSection,
  InstitutionFaqSection,
  InstitutionClosingCtaSection,
  InstitutionSkipLink,
  InstitutionAmbientAtmosphere,
} from '../components/landing/InstitutionLandingSections';
import './institutionLanding.css';

function buildInstitutionSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${content.canonical}#webpage`,
        url: content.canonical,
        name: content.title,
        description: content.description,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://www.ieltsai.pro/#website' },
        primaryImageOfPage: { '@type': 'ImageObject', url: content.image },
      },
      {
        '@type': 'FAQPage',
        '@id': `${content.canonical}#faq`,
        mainEntity: institutionFaqs.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.ieltsai.pro/' },
          { '@type': 'ListItem', position: 2, name: 'For institutions', item: content.canonical },
        ],
      },
    ],
  };
}

export default function InstitutionLanding() {
  const schema = buildInstitutionSchema();

  return (
    <div className="min-h-screen bg-[#fcfdff] font-sans text-slate-900 transition-colors duration-300 dark:bg-[#08080a] dark:text-slate-100 overflow-x-hidden selection:bg-[#5a63df]/20 selection:text-[#5a63df]">
      <DocumentHead
        title={content.title}
        description={content.description}
        keywords={content.keywords}
        canonicalUrl={content.canonical}
        image={content.image}
        imageAlt={content.imageAlt}
        imageWidth={1200}
        imageHeight={630}
        structuredData={schema}
      />

      <InstitutionSkipLink />
      <PublicNavbar />
      <InstitutionAmbientAtmosphere />

      <main id="institution-main" className="relative z-10 pt-14 md:pt-16">
        <InstitutionHeroSection />
        <InstitutionPortalFeaturesSection />
        <InstitutionPracticeSkillsSection />
        <InstitutionAcademicBenefitsSection />
        <InstitutionHowItWorksSection />
        <InstitutionFaqSection />
        <InstitutionClosingCtaSection />
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}
