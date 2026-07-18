import React from 'react';
import { m } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles, Target, Zap, Shield, Globe } from 'lucide-react';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(3px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function CardGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="grid-about" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-about)" />
      </svg>
    </div>
  );
}

function AboutHero() {
  return (
    <section className="relative pt-2 pb-6 md:pt-4 md:pb-8 px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-[34rem] w-[34rem] rounded-full bg-blue-200/20 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-8 h-[38rem] w-[38rem] rounded-full bg-violet-200/20 blur-[140px] dark:bg-violet-600/10" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd8ff] bg-gradient-to-r from-[#f1edff]/95 to-white/75 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#4f35d8] shadow-sm backdrop-blur-xl dark:border-violet-400/20 dark:from-violet-400/10 dark:to-white/5 dark:text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Our Story & Vision
          </div>

          <h1 className="text-[clamp(2.35rem,6.5vw,3.65rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#07142f] dark:text-white">
            <span className="block">The Future of</span>
            <span className="relative inline-block font-handwritten mt-2.5 bg-gradient-to-r from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text pb-3 text-[1.02em] leading-[1.08] tracking-[-0.025em] text-transparent">
              IELTS Preparation
              <svg
                className="absolute bottom-0 left-0 w-full h-3 text-[#7384f8]"
                viewBox="0 0 200 10"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 3C60 7 140 7 198 3"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg font-medium leading-relaxed text-[#515d74] dark:text-slate-300 max-w-2xl mx-auto">
            Stop waiting days for feedback. Our AI provides instant, examiner-level scoring for
            Writing and Speaking, giving you the precise roadmap to hit your target Band 7+.
          </p>
        </m.div>
      </div>
    </section>
  );
}

function AboutStoryAndStats() {
  return (
    <section className="py-10 md:py-16 px-6 relative border-y border-slate-100 dark:border-white/5 bg-[#fafbfe] dark:bg-[#070912]/40">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#f3f7ff]/20 to-transparent dark:from-slate-950/10" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center relative z-10">
        {/* Left Narrative Column */}
        <m.div
          initial={{ opacity: 0, x: -25 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3.5xl font-black tracking-[-0.04em] text-[#07142f] dark:text-white">
              More Than Just Practice
            </h2>
            <p className="text-base font-medium leading-relaxed text-[#515d74] dark:text-slate-300">
              Most students practice blindly, repeating the same mistakes without knowing why. We
              changed that by integrating official IELTS scoring criteria directly into our
              proprietary AI feedback models, allowing you to train smarter.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              {
                icon: Target,
                title: 'Instant Writing Evaluation',
                desc: 'Detailed essays breakdown covering Task Achievement, Coherence, Lexical Resource, and Grammar in seconds.',
                color: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
              },
              {
                icon: Sparkles,
                title: 'Real-time Speaking Coach',
                desc: 'Speak freely with our AI examiner that evaluates your fluency, pronunciation, grammar and vocabulary dynamically.',
                color:
                  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
              },
              {
                icon: Shield,
                title: 'Full-Length Mock Tests',
                desc: 'Simulate the actual test environment with realistic Reading, Listening, Writing, and Speaking modules.',
                color:
                  'bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#07142f] dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-sm sm:text-base font-medium leading-relaxed text-[#515d74] dark:text-slate-300 border-l-2 border-[#3f6df1]/40 pl-4">
            We don't just give you a static score; we deliver a personalized roadmap. Our platform
            tracks metrics across every completed module, helping you target exactly what matters to
            push past your current band limits.
          </p>
        </m.div>

        {/* Right Bento Grid Stats Column */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="col-span-2 rounded-[28px] border border-white/40 bg-white/70 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 p-6 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <CardGridBackground />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Our Reach
            </span>
            <span className="text-4xl font-extrabold text-blue-650 dark:text-blue-400 block tracking-tight">
              10,000+
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1 block">
              Active Global Students
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">
              Preparing for their dreams across 85 countries.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/70 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 p-5 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <CardGridBackground />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 dark:text-emerald-400 block mb-2">
              Impact
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
              +1.5
            </span>
            <span className="text-xs font-bold text-slate-655 dark:text-slate-300 mt-1 block">
              Avg Band Jump
            </span>
          </div>

          <div className="rounded-[28px] border border-white/40 bg-white/70 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 p-5 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
            <CardGridBackground />
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-500 dark:text-violet-400 block mb-2">
              Accuracy
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
              98.4%
            </span>
            <span className="text-xs font-bold text-slate-655 dark:text-slate-300 mt-1 block">
              Reliability Score
            </span>
          </div>
        </m.div>
      </div>
    </section>
  );
}

function AboutValues() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#4f35d8] dark:text-violet-350 block">
            Integrity & Standard
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-[#07142f] dark:text-white">
            Our Core Values
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            The foundational principles guiding our AI technology development and your prep journey.
          </p>
        </div>

        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: Zap,
              title: 'Speed of Feedback',
              description:
                'Learning is most effective when feedback is immediate. We prioritize real-time insights so you never have to wait to learn.',
              glow: 'group-hover:bg-amber-400/5',
              border: 'hover:border-amber-500/20',
            },
            {
              icon: Shield,
              title: 'Accuracy & Trust',
              description:
                'Our AI models are trained and calibrated against official IELTS assessment criteria to ensure your practice results are dependable.',
              glow: 'group-hover:bg-blue-400/5',
              border: 'hover:border-blue-500/20',
            },
            {
              icon: Globe,
              title: 'Global Access',
              description:
                'Top-tier educational resources should not be a luxury. We deliver examiner-grade coaching capabilities to students anywhere, on any budget.',
              glow: 'group-hover:bg-purple-400/5',
              border: 'hover:border-purple-500/20',
            },
          ].map((value, i) => (
            <m.div key={i} variants={itemVariants}>
              <Card
                className={`h-full rounded-[28px] border bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/60 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 border-slate-200/60 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-indigo-950/40 dark:border-slate-800/60 relative overflow-hidden group shadow-[0_8px_32px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.06)] dark:hover:shadow-[0_20px_45px_rgba(99,102,241,0.12)] ${value.border}`}
              >
                <CardGridBackground />
                <div
                  className={`absolute -right-16 -top-16 h-36 w-36 rounded-full bg-slate-400/0 blur-3xl transition-all duration-500 ${value.glow}`}
                />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold mb-3 text-[#07142f] dark:text-white">
                    {value.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </Card>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

function AboutCTA({ onSignup, onPricing }) {
  return (
    <section className="py-16 md:py-24 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-br from-[#4f38ea] via-[#634df0] to-[#216ff0] text-white rounded-[32px] md:rounded-[40px] p-8 md:p-16 border border-white/10 shadow-[0_35px_75px_-20px_rgba(82,98,239,0.4)] dark:shadow-[0_45px_90px_-25px_rgba(0,0,0,0.7)] relative overflow-hidden text-center group"
        >
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 100 100"
            >
              <pattern id="grid-cta" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none" />
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid-cta)" />
            </svg>
          </div>

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/35 blur-3xl pointer-events-none" />
          <Sparkles className="absolute left-10 top-12 h-6 w-6 text-white/20 animate-pulse pointer-events-none hidden md:block" />
          <Sparkles className="absolute right-12 bottom-12 h-8 w-8 text-white/30 animate-pulse pointer-events-none hidden md:block" />

          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-[-0.035em] relative z-10 max-w-2xl mx-auto text-balance">
            Ready to Achieve Your{' '}
            <span className="bg-gradient-to-r from-[#a6edff] to-[#dcf9ff] bg-clip-text text-transparent drop-shadow-sm">
              Target Score?
            </span>
          </h2>

          <p className="text-white/80 text-sm sm:text-base font-medium mt-4 mb-8 max-w-lg mx-auto relative z-10 leading-relaxed">
            Join thousands of students who have upgraded their preparation with real-time feedback.
            Stop guessing and start improving.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button
              onClick={onSignup}
              className="h-14 px-8 rounded-[16px] bg-white text-slate-900 hover:bg-slate-50 font-extrabold text-sm sm:text-base shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Start Free Practice
            </button>
            <button
              onClick={onPricing}
              className="h-14 px-8 rounded-[16px] border border-white/20 bg-white/10 text-white hover:bg-white/15 font-extrabold text-sm sm:text-base backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              View Pricing Plans
            </button>
          </div>
        </m.div>
      </div>
    </section>
  );
}

export default function About() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <div className="min-h-screen bg-[#fcfdff] dark:bg-[#070912] text-foreground transition-colors duration-300">
      <DocumentHead
        title="About IELTS Ai Pro - AI-Powered IELTS Coaching Platform"
        description="Learn how IELTS Ai Pro uses advanced AI and official IELTS standards to provide instant, accurate feedback on Writing and Speaking. Founded by IELTS experts to help students achieve Band 7+."
        canonicalUrl="https://www.ieltsai.pro/about"
        keywords="about IELTS Ai Pro, IELTS coaching, AI IELTS platform, IELTS expertise"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About IELTS Ai Pro',
          description:
            'IELTS Ai Pro combines advanced AI with official testing standards to provide instant, accurate feedback on Writing and Speaking.',
          url: 'https://www.ieltsai.pro/about',
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
            logo: 'https://www.ieltsai.pro/favicon.webp',
          },
        }}
      />

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-24 pb-16 overflow-hidden">
        <AboutHero />
        <AboutStoryAndStats />
        <AboutValues />
        <AboutCTA onSignup={() => navigate('/signup')} onPricing={() => navigate('/pricing')} />
      </main>

      <Footer />
    </div>
  );
}
