import React from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Target, Users, Zap, Shield, Globe } from 'lucide-react';
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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function About() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();

  const handlePrimaryCta = () =>
    navigate(user && !authLoading ? createPageUrl('Dashboard') : createPageUrl('Login'));
  const handlePricing = () => navigate(createPageUrl('Pricing'));

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead
        title="About Us | IELTS Ai Pro - AI-Powered Preparation"
        description="Master IELTS with IELTS Ai Pro. Our advanced AI provides instant, accurate feedback on Writing and Speaking to help you achieve Band 7+ faster."
        canonicalUrl="https://www.ieltsai.pro/about"
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

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-12 md:py-20 px-6">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto text-center">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Badge
                variant="secondary"
                className="rounded-full bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
              >
                About Us
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                The Future of <br />
                <span className="text-gradient-primary">IELTS Preparation</span>
              </h1>
              <p className="body-lg max-w-2xl mx-auto text-muted-foreground">
                Stop waiting days for feedback. Our AI provides instant, examiner-level scoring for
                Writing and Speaking, giving you the precise roadmap to hit your target Band 7+.
              </p>
            </m.div>
          </div>
        </section>

        {/* Story & Features Section */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <m.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="heading-md">More Than Just Practice</h2>
              <div className="space-y-4 body-md text-muted-foreground">
                <p>
                  Most students practice blindly, repeating the same mistakes without knowing why.
                  We changed that by integrating official IELTS scoring criteria directly into our
                  AI models.
                </p>
                <ul className="space-y-3 pt-2">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-primary/10 text-primary">
                      <Target className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-foreground">Instant Writing Evaluation:</strong> Get
                      detailed feedback on Task 1 & 2 essays in seconds, not days.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-primary/10 text-primary">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-foreground">Real-time Speaking Coach:</strong>{' '}
                      Practice with our AI examiner that analyzes fluency, pronunciation, and
                      vocabulary.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded-full bg-primary/10 text-primary">
                      <Shield className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-foreground">Full-Length Mock Tests:</strong>{' '}
                      Experience the pressure of the real exam with our realistic Reading and
                      Listening modules.
                    </span>
                  </li>
                </ul>
                <p className="pt-2">
                  We don't just give you a score; we give you a roadmap. Our analytics track your
                  progress across every skill, showing you exactly what to focus on to reach your
                  target band.
                </p>
              </div>
            </m.div>

            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 mix-blend-overlay" />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                alt="IELTS Ai Pro Feature Showcase"
                className="w-full h-full object-cover"
              />
            </m.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="heading-md mb-4">Our Core Values</h2>
              <p className="body-md text-muted-foreground max-w-xl mx-auto">
                The principles that drive our innovation and your success.
              </p>
            </div>

            <m.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  icon: Zap,
                  title: 'Speed of Feedback',
                  description:
                    'Learning is most effective when feedback is immediate. We prioritize real-time insights so you never have to wait to learn.',
                },
                {
                  icon: Shield,
                  title: 'Accuracy & Trust',
                  description:
                    'Our AI systems are rigorously tested against official IELTS standards to ensure your predicted scores are reliable.',
                },
                {
                  icon: Globe,
                  title: 'Global Access',
                  description:
                    "Quality education shouldn't be a luxury. We provide elite-level coaching tools to accessible to everyone, everywhere.",
                },
              ].map((value, i) => (
                <m.div key={i} variants={itemVariants}>
                  <Card className="p-6 h-full bg-card/50 backdrop-blur-xl border-white/5 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <value.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </Card>
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12 rounded-[2.5rem] border border-primary/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Ready to Achieve Your Target Score?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of students who have upgraded their preparation with AI. Stop
                guessing and start improving today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Start Free Practice
                </a>
                <a
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background/50 backdrop-blur-sm px-8 text-sm font-bold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  View Plans
                </a>
              </div>
            </m.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
