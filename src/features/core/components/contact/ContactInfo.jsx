import React from 'react';
import { m } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles, Mail, MessageCircle, ArrowRight } from 'lucide-react';

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
          <pattern id="grid-contact-info" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-contact-info)" />
      </svg>
    </div>
  );
}

export default function ContactInfo() {
  return (
    <m.div
      initial={{ opacity: 0, x: -25 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col justify-between space-y-6"
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-white/90 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-indigo-600 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300 shadow-sm backdrop-blur-xl">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Student Help & Support Center</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-slate-950 dark:text-white">
          We'd love to <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-[#a456ef] via-[#6951ed] to-[#3e70f3] bg-clip-text text-transparent">
            hear from you.
          </span>
        </h1>

        <p className="text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-lg">
          Have questions about your practice plan, AI scoring rubrics, billing, or technical
          features? Our team is here to support your Band 7+ journey every step of the way.
        </p>
      </div>

      <div className="grid gap-4 mt-auto">
        {/* Email Card */}
        <Card className="p-6 flex items-start gap-5 bg-gradient-to-br from-white via-slate-50/60 to-indigo-50/50 border-slate-200/80 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:border-white/10 shadow-[0_8px_30px_rgba(15,23,42,0.03)] dark:shadow-none hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-none hover:border-indigo-500/30 dark:hover:border-[#5a63df]/30 transition-all duration-300 group relative overflow-hidden rounded-[24px]">
          <CardGridBackground />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <Mail className="w-6 h-6" />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                Email Support
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
                Response &lt; 12h
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 mb-2.5">
              Direct line for account, billing, and technical inquiries.
            </p>
            <a
              href="mailto:mail@ieltsai.pro"
              className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm hover:underline"
            >
              <span>mail@ieltsai.pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </Card>

        {/* Live Chat Card */}
        <Card className="p-6 flex items-start gap-5 bg-gradient-to-br from-white via-slate-50/60 to-emerald-50/40 border-slate-200/80 dark:bg-gradient-to-b dark:from-[#131315] dark:to-[#131315] dark:border-white/10 shadow-[0_8px_30px_rgba(15,23,42,0.03)] dark:shadow-none hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-none hover:border-emerald-500/30 dark:hover:border-emerald-500/25 transition-all duration-300 group relative overflow-hidden rounded-[24px]">
          <CardGridBackground />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold text-base text-slate-950 dark:text-white">
                Live Chat Assistance
              </h3>
              <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Active Desk
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 mb-2">
              Instant setup answers & candidate onboarding assistance.
            </p>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Mon – Fri: 9:00 AM – 6:00 PM GMT
            </span>
          </div>
        </Card>
      </div>
    </m.div>
  );
}
