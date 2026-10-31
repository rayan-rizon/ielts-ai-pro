import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { createPageUrl } from '@/utils';
import AboutHero from '@/features/core/components/about/AboutHero';
import AboutMission from '@/features/core/components/about/AboutMission';
import AboutFacts from '@/features/core/components/about/AboutFacts';
import AboutMethod from '@/features/core/components/about/AboutMethod';
import AboutValues from '@/features/core/components/about/AboutValues';
import AboutCTA from '@/features/core/components/about/AboutCTA';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * About page.
 *
 * Reads top to bottom as an argument rather than as a second landing page:
 * what this is (hero) → the problem it exists for and the limits it accepts
 * (mission) → what it covers, in checkable numbers (facts) → how a band is
 * actually arrived at (method) → what the product will not trade away (values)
 * → try it (CTA).
 *
 * The sections it used to carry — a feature list, a tutoring-vs-AI comparison
 * and a four-step "how it works" — each restated a landing section, and the
 * landing's versions are richer (a three-way comparison table with a generic-AI
 * column; step cards with live product previews). Duplicating them here cost a
 * visitor a second read of the same pitch and split the page's SEO with `/`.
 */
export default function About() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const isSignedIn = Boolean(user && !authLoading);
  const handlePrimaryCta = () => navigate(createPageUrl(isSignedIn ? 'Dashboard' : 'SignUp'));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfdff] text-foreground transition-colors duration-300 dark:bg-[#08080a]">
      <DocumentHead
        title="About IELTS Ai Pro - AI-Powered IELTS Preparation Platform"
        description="Why IELTS Ai Pro exists, how it scores Writing and Speaking against the public IELTS band descriptors, and what an AI practice band can and cannot tell you."
        canonicalUrl="https://www.ieltsai.pro/about"
        keywords="about IELTS Ai Pro, IELTS AI evaluation, IELTS band descriptors, IELTS writing checker, IELTS speaking coach, IELTS mock test"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About IELTS Ai Pro',
          description:
            'IELTS Ai Pro provides instant AI-assisted practice feedback for Writing, Speaking, Reading, and Listening using public IELTS assessment criteria.',
          url: 'https://www.ieltsai.pro/about',
          // An AboutPage is about the organisation, not a SoftwareApplication -
          // which would additionally require an aggregateRating we have not collected.
          mainEntity: {
            '@id': 'https://www.ieltsai.pro/#organization',
          },
          publisher: {
            '@type': 'Organization',
            '@id': 'https://www.ieltsai.pro/#organization',
            name: 'IELTS Ai Pro',
            url: 'https://www.ieltsai.pro/',
            logo: 'https://www.ieltsai.pro/apple-touch-icon.png',
          },
        }}
      />

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={isSignedIn}
      />

      {/* The navbar is fixed and floats over the page; this clears its resting
          height. Each section brings its own ambient lighting via SoftSection,
          so there is no page-level glow layer competing with them. */}
      <TooltipProvider delayDuration={150}>
        <main className="pt-20 sm:pt-24">
          <AboutHero />
          <AboutMission />
          <AboutFacts />
          <AboutMethod />
          <AboutValues />
          <AboutCTA
            onSignup={handlePrimaryCta}
            onPricing={() => navigate(createPageUrl('Pricing'))}
          />
        </main>
      </TooltipProvider>

      <Footer />
    </div>
  );
}
