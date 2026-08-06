import React from 'react';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AboutHero from '@/features/core/components/about/AboutHero';
import AboutStoryAndStats from '@/features/core/components/about/AboutStoryAndStats';
import ComparisonSection from '@/features/core/components/about/ComparisonSection';
import AboutValues from '@/features/core/components/about/AboutValues';
import TechSpotlightSection from '@/features/core/components/about/TechSpotlightSection';
import AboutCTA from '@/features/core/components/about/AboutCTA';

export default function About() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <div className="relative min-h-screen bg-[#fcfdff] dark:bg-[#08080a] text-foreground transition-colors duration-300 overflow-x-hidden">
      <DocumentHead
        title="About IELTS Ai Pro - AI-Powered IELTS Preparation Platform"
        description="Get instant, examiner-grade AI feedback for IELTS Writing Task 1 & 2, Speaking Parts 1-3, Reading, and Listening. Achieve Band 7.5+ faster."
        canonicalUrl="https://www.ieltsai.pro/about"
        keywords="about IELTS Ai Pro, IELTS AI evaluation, IELTS writing checker, IELTS speaking coach, IELTS mock test, band score calculator"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About IELTS Ai Pro',
          description:
            'IELTS Ai Pro provides instant AI feedback for Writing, Speaking, Reading, and Listening using official Cambridge rubrics.',
          url: 'https://www.ieltsai.pro/about',
          // An AboutPage is about the organisation, not a SoftwareApplication -
          // which would additionally require an aggregateRating we have not collected.
          mainEntity: {
            '@id': 'https://www.ieltsai.pro/#organization',
          },
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
            logo: 'https://www.ieltsai.pro/logo.svg',
          },
        }}
      />

      {/* Ambient Decorative Lighting starting from top-0 behind Navbar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-144 w-144 rounded-full bg-linear-to-tr/srgb from-blue-400/15 to-indigo-500/15 blur-[130px] dark:from-[#5a63df]/10 dark:to-[#5a63df]/10" />
        <div className="absolute -right-32 top-0 h-152 w-152 rounded-full bg-linear-to-br/srgb from-violet-400/15 to-fuchsia-400/15 blur-[140px] dark:from-[#5a63df]/8 dark:to-[#5a63df]/8" />
        <div className="absolute left-1/2 top-28 -translate-x-1/2 h-104 w-104 rounded-full bg-cyan-300/10 blur-[120px] dark:bg-transparent" />
      </div>

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-20 sm:pt-24 pb-12 overflow-hidden">
        <AboutHero />
        <AboutStoryAndStats />
        <ComparisonSection />
        <AboutValues />
        <TechSpotlightSection />
        <AboutCTA onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />
      </main>

      <Footer />
    </div>
  );
}
