import React, { useState } from 'react';
import { m } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Headphones, ChevronDown, Send } from 'lucide-react';
import { toast } from 'sonner';

function CardGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="grid-contact-form" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-contact-form)" />
      </svg>
    </div>
  );
}

function ContactFormSuccess({ onReset }) {
  return (
    <div className="flex flex-col items-center text-center py-12 space-y-5 animate-in fade-in zoom-in duration-300 relative z-10 my-auto">
      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg border border-emerald-500/20">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-2 max-w-sm mx-auto">
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">
          Draft Ready in Email Client!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
          Please hit send on the generated email draft to deliver your message directly to{' '}
          <strong className="text-indigo-600 dark:text-indigo-400">mail@ieltsai.pro</strong>.
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={onReset}
        className="rounded-xl px-6 h-11 font-extrabold text-sm border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-105 transition-all"
      >
        Send Another Inquiry
      </Button>
    </div>
  );
}

function ContactFormFields({ onSubmit, isSubmitting }) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4.5 relative z-10 h-full flex flex-col justify-between"
    >
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
          <Headphones className="w-4 h-4" />
          <span>Send Direct Inquiry</span>
        </div>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">How Can We Help You?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
          Fill out the form below and our academic support team will respond promptly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
            Full Name
          </label>
          <Input
            name="name"
            required
            placeholder="e.g., Sarah Jenkins"
            className="h-11 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
            Email Address
          </label>
          <Input
            name="email"
            required
            type="email"
            placeholder="you@example.com"
            className="h-11 bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
          Inquiry Topic
        </label>
        <div className="relative">
          <select
            name="topic"
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
          >
            <option>General Platform Question</option>
            <option>Writing & Speaking AI Evaluation Support</option>
            <option>Account & Subscription Billing</option>
            <option>Technical Issue / Bug Report</option>
            <option>Feature Suggestion</option>
            <option>Institutional & Teacher Partnership</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 flex-1 flex flex-col">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
          Your Message
        </label>
        <Textarea
          name="message"
          required
          placeholder="Please describe your question or feature request in detail..."
          className="flex-1 min-h-[120px] bg-slate-50/50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium resize-none p-4 text-sm transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5246ea] via-[#6352f0] to-[#2b72f0] hover:from-[#4438dd] hover:to-[#1a64e0] text-white font-extrabold text-sm tracking-wide shadow-md hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] mt-2 flex items-center justify-center gap-2 group shrink-0"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Preparing Email...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ContactForm() {
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
    }, 800);
  };

  return (
    <m.div
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
      className="relative h-full flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 blur-3xl -z-10 rounded-[3rem] opacity-70" />

      <Card className="p-7 sm:p-8 md:p-10 border border-slate-200/80 bg-white/80 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-[28px] md:rounded-[32px] relative overflow-hidden group h-full flex flex-col justify-between">
        <CardGridBackground />
        {isSubmitted ? (
          <ContactFormSuccess onReset={() => setIsSubmitted(false)} />
        ) : (
          <ContactFormFields onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </Card>
    </m.div>
  );
}
