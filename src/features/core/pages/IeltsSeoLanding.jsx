import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import CookieConsent from '@/components/shared/CookieConsent';
import DocumentHead from '@/components/shared/DocumentHead';
import CTABanner from '@/features/core/components/landing/CTABanner';
import Footer from '@/features/core/components/landing/Footer';
import PublicNavbar from '@/features/core/components/landing/PublicNavbar';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import {
  RELATED_LINKS,
  SITE_URL,
  createStructuredData,
  getConfig,
} from '@/features/core/components/seo-landing/seoLandingConfig';
import {
  BreakdownSection,
  FaqSection,
  FeatureSection,
  Hero,
  ProcessSection,
  RelatedSection,
} from '@/features/core/components/seo-landing/SeoLandingSections';

const VIEWPORT = { once: true, amount: 0.2 };

export default function IeltsSeoLanding() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const config = getConfig(pathname);

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('SignUp'));

  return (
    <div className="min-h-screen bg-[#fcfdff] font-sans text-slate-950 transition-colors duration-300 dark:bg-[#08080a] dark:text-white">
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
        <BreakdownSection config={config} />
        <ProcessSection config={config} />
        <FaqSection config={config} />
        <RelatedSection links={RELATED_LINKS} currentPath={config.path} />
        <CTABanner handlePrimaryCta={handlePrimaryCta} viewport={VIEWPORT} />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
