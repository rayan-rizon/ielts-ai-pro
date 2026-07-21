import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Mail,
  MessageCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/features/core/components/landing/Navbar';
import Footer from '@/features/core/components/landing/Footer';
import DocumentHead from '@/components/shared/DocumentHead';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/features/auth/context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

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
          <pattern id="grid-contact" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-contact)" />
      </svg>
    </div>
  );
}

function FaqAccordionItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-slate-200/60 dark:border-slate-800/65 py-4">
      <button
        onClick={onClick}
        type="button"
        className="flex w-full items-center justify-between text-left font-bold text-slate-800 dark:text-slate-100 hover:text-primary transition-colors py-2 text-base"
      >
        <span>{question}</span>
        <m.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 shrink-0 ml-4"
        >
          <ChevronDown className="w-5 h-5" />
        </m.span>
      </button>
      <m.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 pt-2 pb-3 font-medium">
          {answer}
        </p>
      </m.div>
    </div>
  );
}

function ContactInfo() {
  return (
    <m.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-12"
    >
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#bfe9df] bg-[#f2fbf8] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#218b75] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm">
          <Sparkles className="h-3 w-3 text-[#218b75] dark:text-emerald-300" />
          Help Center
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-[#07142f] dark:text-white">
          We'd love to <br className="hidden sm:block" />
          <span className="text-gradient-primary">hear from you.</span>
        </h1>

        <p className="text-base font-medium leading-relaxed text-[#515d74] dark:text-slate-355 max-w-lg">
          Whether you're stuck on a feature, need help with your plan, or want to share your success
          story, our team is here to assist.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 flex items-start gap-5 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/60 border-slate-200/60 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-indigo-950/40 dark:border-slate-800/60 shadow-[0_8px_32px_rgba(15,23,42,0.02)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <CardGridBackground />
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
            <Mail className="w-6 h-6" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="font-extrabold text-base text-[#07142f] dark:text-white">
              Email Support
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 mb-2.5">
              Best for account requests & detailed support.
            </p>
            <a
              href="mailto:mail@ieltsai.pro"
              className="text-primary font-extrabold text-sm hover:underline"
            >
              mail@ieltsai.pro
            </a>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-5 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/60 border-slate-200/60 dark:from-slate-950/90 dark:via-slate-900/80 dark:to-indigo-950/40 dark:border-slate-800/60 shadow-[0_8px_32px_rgba(15,23,42,0.02)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
          <CardGridBackground />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="relative z-10 flex-1">
            <h3 className="font-extrabold text-base text-[#07142f] dark:text-white">Live Chat</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 mb-3">
              Instant answers for simple setup questions.
            </p>
            <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Available 9am - 6pm GMT
            </span>
          </div>
        </Card>
      </div>
    </m.div>
  );
}

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const topic = formData.get('topic');
    const message = formData.get('message');

    // Construct mailto link
    const mailtoLink = `mailto:mail@ieltsai.pro?subject=[${topic}] Inquiry from ${name}&body=${encodeURIComponent(message)}`;

    // Open email client
    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Opening your email client to send the message...');
    }, 1000);
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-[#6256ed]/5 to-transparent blur-3xl -z-10 rounded-[3rem] opacity-60" />

      <Card className="p-8 md:p-10 border border-white/40 bg-white/70 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] rounded-[32px] relative overflow-hidden group">
        <CardGridBackground />

        {isSubmitted ? (
          <div className="flex flex-col items-center text-center py-16 space-y-6 animate-in fade-in zoom-in duration-300 relative z-10">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Opening Mail Client...
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                Please complete sending the message draft generated in your email client. We'll be
                in touch soon!
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsSubmitted(false)}
              className="rounded-xl px-6 h-11 font-extrabold text-sm"
            >
              Send Another Message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1 mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Send us a message
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Fill out the form below and we'll help you get sorted.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 ml-1">
                  Name
                </label>
                <Input
                  name="name"
                  required
                  placeholder="Your Name"
                  className="h-12 bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all focus:bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 ml-1">
                  Email
                </label>
                <Input
                  name="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  className="h-12 bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all focus:bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 ml-1">
                Topic
              </label>
              <div className="relative">
                <select
                  name="topic"
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-black/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all focus:bg-background appearance-none cursor-pointer"
                >
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Billing & Pricing</option>
                  <option>Feature Request</option>
                  <option>Partnership</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 ml-1">
                Message
              </label>
              <Textarea
                name="message"
                required
                placeholder="How can we help you?"
                className="min-h-[140px] bg-white/40 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium resize-none p-4 text-sm transition-all focus:bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-[#6256ed] hover:to-[#5347dd] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 mt-2 group"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Preparing Email...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Send Message{' '}
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        )}
      </Card>
    </m.div>
  );
}

function ContactFaqs() {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'When will I get a response?',
      answer:
        'Our customer support team typically responds to all inquiries within 12 to 24 hours on business days.',
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        'Yes, we offer a 7-day satisfaction refund guarantee for new subscribers on selected paid plans if the platform does not meet your preparation expectations.',
    },
    {
      question: 'How accurate is the AI scoring system?',
      answer:
        'Our grading algorithms are calibrated directly against official IELTS rubrics, achieving a 98.4% score alignment verified regularly by senior human examiners.',
    },
    {
      question: 'Is there a free trial option available?',
      answer:
        'Absolutely! You can register and access free mock tests and daily practice questions with capped AI evaluations, no credit card required.',
    },
  ];

  return (
    <section className="py-16 px-6 relative border-t border-slate-100 dark:border-white/5 bg-[#fafbfe] dark:bg-[#070912]/40">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#07142f] dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Quick answers to common questions about our support policies, refunds, and platforms.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-sm">
          {faqs.map((faq, index) => (
            <FaqAccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaqIndex === index}
              onClick={() => toggleFaq(index)}
            />
          ))}
        </div>
      </m.div>
    </section>
  );
}

function ContactCTA({ onSignup, onPricing }) {
  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-br from-[#3f6df1] to-[#6256ed] text-white rounded-[40px] p-8 md:p-12 relative overflow-hidden shadow-xl text-center"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[90px] rounded-full translate-x-1/2 -translate-y-1/2" />

          <h2 className="text-2xl md:text-4xl font-extrabold mb-4 relative z-10 leading-tight">
            Ready to start learning?
          </h2>

          <p className="text-white/85 text-sm sm:text-base font-medium mb-8 max-w-lg mx-auto relative z-10 leading-relaxed">
            Join thousands of students achieving their target scores with our advanced AI prep
            environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Button
              onClick={onSignup}
              className="h-12 px-6 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free
            </Button>
            <Button
              onClick={onPricing}
              variant="outline"
              className="h-12 px-6 rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white hover:border-white/40 font-extrabold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              View Pricing
            </Button>
          </div>
        </m.div>
      </div>
    </section>
  );
}

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
        title="Contact IELTS Ai Pro Support & Help Center"
        description="Get in touch with our IELTS support team for help with your preparation plan, pricing questions, or technical issues. Available to assist your Band 7+ journey."
        canonicalUrl="https://www.ieltsai.pro/contact"
        keywords="contact IELTS Ai Pro, customer support, IELTS help, contact us"
      />

      {/* Decorative Glow Elements */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-[34rem] w-[34rem] rounded-full bg-blue-200/20 blur-[130px] dark:bg-blue-600/10" />
        <div className="absolute -right-40 top-8 h-[38rem] w-[38rem] rounded-full bg-[#6256ed]/10 blur-[140px] dark:bg-violet-650/10" />
      </div>

      <Navbar
        isDark={theme === 'dark'}
        setTheme={setTheme}
        handlePricing={handlePricing}
        handlePrimaryCta={handlePrimaryCta}
        isSignedIn={Boolean(user && !authLoading)}
      />

      <main className="pt-24 pb-16 relative z-10">
        <section className="py-12 md:py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-16 lg:gap-24 items-start">
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
