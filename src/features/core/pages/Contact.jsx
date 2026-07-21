import React from 'react';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ContactInfo from '@/features/core/components/contact/ContactInfo';
import ContactForm from '@/features/core/components/contact/ContactForm';
import ContactFaqs from '@/features/core/components/contact/ContactFaqs';
import ContactCTA from '@/features/core/components/contact/ContactCTA';

export default function Contact() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-[#070912] text-foreground transition-colors duration-300 overflow-x-hidden">
      <DocumentHead
        title="Contact Support & Help Desk - IELTS Ai Pro"
        description="Need assistance with your IELTS preparation, Writing/Speaking AI grading, or subscription account? Contact our team at mail@ieltsai.pro or check our student FAQ."
        canonicalUrl="https://www.ieltsai.pro/contact"
        keywords="contact IELTS Ai Pro, IELTS support, IELTS customer service, IELTS help desk, mail@ieltsai.pro"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact IELTS Ai Pro Support',
          description:
            'Get in touch with the IELTS Ai Pro team for support with AI Writing & Speaking evaluation, accounts, or platform features.',
          url: 'https://www.ieltsai.pro/contact',
          mainEntity: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro Support',
            email: 'mail@ieltsai.pro',
            url: 'https://www.ieltsai.pro',
            contactPoint: {
              '@type': 'ContactPoint',
              email: 'mail@ieltsai.pro',
              contactType: 'customer support',
              availableLanguage: ['English'],
            },
          },
        }}
      />

      {/* Ambient Decorative Lighting */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-[34rem] w-[34rem] rounded-full bg-blue-200/20 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-8 h-[38rem] w-[38rem] rounded-full bg-indigo-500/10 blur-[140px] dark:bg-violet-600/10" />
      </div>

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-24 pb-12 relative z-10">
        <section className="py-12 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-stretch">
              <ContactInfo />
              <ContactForm />
            </div>
          </div>
        </section>

        <ContactFaqs />

        <ContactCTA onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />
      </main>

      <Footer />
    </div>
  );
}
