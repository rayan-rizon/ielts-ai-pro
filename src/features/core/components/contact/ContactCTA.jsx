import React from 'react';
import { m } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

export default function ContactCTA({ onSignup, onPricing }) {
  return (
    <section className="py-6 md:py-10 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-br from-[#4f38ea] via-[#5c47f0] to-[#216ff0] text-white rounded-[28px] md:rounded-[36px] p-6 sm:p-8 md:p-10 border border-white/15 shadow-[0_25px_60px_-15px_rgba(79,70,229,0.4)] dark:shadow-[0_35px_75px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden text-center group"
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 100 100"
            >
              <pattern id="grid-cta-contact" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none" />
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid-cta-contact)" />
            </svg>
          </div>

          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-60 h-60 bg-indigo-400/20 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2.5 relative z-10 leading-tight tracking-tight">
            Ready to Start Improving Your Band Score?
          </h2>

          <p className="text-white/85 text-xs sm:text-sm font-medium mb-6 max-w-md mx-auto relative z-10 leading-relaxed">
            Join candidates worldwide using IELTS AI Pro to get instant, examiner-grade writing and
            speaking feedback.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10">
            <button
              onClick={onSignup}
              className="h-12 px-7 rounded-[14px] bg-white text-slate-950 hover:bg-slate-50 font-extrabold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group/btn"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onPricing}
              className="h-12 px-7 rounded-[14px] border border-white/25 bg-white/10 text-white hover:bg-white/15 font-extrabold text-sm backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              View Pricing Plans
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold text-white/80 relative z-10">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300" /> Free practice included
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300" /> Instant Band score estimation
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300" /> Cambridge rubric aligned
            </span>
          </div>
        </m.div>
      </div>
    </section>
  );
}
