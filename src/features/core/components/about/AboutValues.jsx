import React from 'react';
import { m } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Zap, Shield, Globe } from 'lucide-react';

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
    <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay">
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 100 100"
      >
        <defs>
          <pattern id="grid-about-values" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-about-values)" />
      </svg>
    </div>
  );
}

const VALUES = [
  {
    icon: Zap,
    title: 'Real-Time Insights',
    description:
      'Immediate feedback accelerates learning. Our AI pinpoints exact errors so you can revise essays and speech in real time.',
    badge: 'Instant Results',
    glow: 'group-hover:bg-amber-400/10',
    border: 'hover:border-amber-500/30',
    accentColor: 'text-amber-500 bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Rubric Compliance',
    description:
      'Trained strictly on official Cambridge IELTS criteria for Task 1, Task 2, and Speaking Parts 1–3 to ensure reliable scoring.',
    badge: 'Rubric Aligned',
    glow: 'group-hover:bg-blue-400/10',
    border: 'hover:border-blue-500/30',
    accentColor: 'text-blue-500 bg-blue-500/10',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description:
      'Democratizing top-tier IELTS coaching for candidates anywhere in the world, on any budget.',
    badge: 'Equal Access',
    glow: 'group-hover:bg-purple-400/10',
    border: 'hover:border-purple-500/30',
    accentColor: 'text-purple-500 bg-purple-500/10',
  },
];

export default function AboutValues() {
  return (
    <section className="py-16 md:py-20 px-6 relative bg-slate-50/50 dark:bg-white/2 border-t border-slate-200/60 dark:border-white/[0.07]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 block">
            Academic Excellence
          </span>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-0.035em] text-slate-950 dark:text-white">
            Our Core Standards
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            The principles behind our AI evaluation technology.
          </p>
        </div>

        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {VALUES.map((value, i) => (
            <m.div key={i} variants={itemVariants}>
              <Card
                className={`h-full rounded-[24px] border bg-linear-to-br/srgb from-white via-slate-50/50 to-indigo-50/30 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 border-slate-200/80 dark:bg-linear-to-b/srgb dark:from-[#131315] dark:via-[#131315] dark:to-[#131315] dark:border-white/10 relative overflow-hidden group shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-none ${value.border}`}
              >
                <CardGridBackground />
                <div
                  className={`absolute -right-16 -top-16 h-36 w-36 rounded-full bg-slate-400/0 blur-3xl transition-all duration-500 ${value.glow}`}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl ${value.accentColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                    >
                      <value.icon className="w-5.5 h-5.5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                      {value.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold mb-2 text-slate-950 dark:text-white">
                    {value.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
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
