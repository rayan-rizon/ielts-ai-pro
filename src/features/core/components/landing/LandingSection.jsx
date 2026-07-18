/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export const landingReveal = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const landingStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

export function SectionHeading({
  eyebrow,
  title,
  script,
  suffix,
  description,
  viewport,
  className,
}) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      variants={landingStagger}
      className={cn('mx-auto max-w-4xl text-center', className)}
    >
      <m.div variants={landingReveal}>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#bfe9df] bg-[#f2fbf8]/90 px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#218b75] shadow-[0_8px_28px_-18px_rgba(33,139,117,0.45)] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {eyebrow}
        </span>
      </m.div>
      <m.h2
        variants={landingReveal}
        className="mt-5 text-balance text-[clamp(2.35rem,5vw,4.35rem)] font-black leading-[0.98] tracking-[-0.055em] text-[#07142f] dark:text-white"
      >
        {title}{' '}
        {script && (
          <span
            className="relative inline-block font-normal tracking-[-0.03em] text-[#5262ef]"
            style={{ fontFamily: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive" }}
          >
            {script}
            <span className="absolute -bottom-1 left-[5%] h-[3px] w-[90%] -rotate-1 rounded-full bg-gradient-to-r from-[#89d9d0] to-[#7086f6] opacity-70" />
          </span>
        )}{' '}
        {suffix}
      </m.h2>
      {description && (
        <m.p
          variants={landingReveal}
          className="mx-auto mt-6 max-w-2xl text-[15px] font-medium leading-7 text-[#59657a] dark:text-slate-300 md:text-[17px]"
        >
          {description}
        </m.p>
      )}
    </m.div>
  );
}

export function GlassPanel({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'border border-white/90 bg-white/[0.74] shadow-[0_24px_70px_-36px_rgba(31,52,106,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const SoftSection = React.forwardRef(function SoftSection(
  { className, children, ...props },
  ref
) {
  return (
    <section
      ref={ref}
      className={cn(
        'relative overflow-hidden bg-[#fcfdff] py-20 dark:bg-[#070b17] md:py-28',
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute left-[-12rem] top-12 h-96 w-96 rounded-full bg-[#c9f3eb]/45 blur-[100px] dark:bg-emerald-500/10" />
      <div className="pointer-events-none absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#d8ddff]/55 blur-[110px] dark:bg-indigo-500/10" />
      {children}
    </section>
  );
});
