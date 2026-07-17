import React from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function HowItWorksSection({ howItWorks, viewport }) {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 py-8 md:py-12 relative overflow-hidden bg-background"
      data-oid="nyn1eld"
    >
      {/* Background decorative elements */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20"
        data-oid=":y6mj-5"
      >
        <div
          className="absolute top-[10%] left-[5%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"
          data-oid="mn0wluh"
        />

        <div
          className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"
          style={{ animationDelay: '2s' }}
          data-oid="cv4utui"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 relative z-10" data-oid="migur6c">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="mb-10 text-center max-w-2xl mx-auto"
          data-oid="2be.el6"
        >
          <m.div variants={itemVariants} data-oid="aq28yvm">
            <Badge
              variant="secondary"
              className="rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] mb-3 shadow-sm"
              data-oid="a3c0tji"
            >
              How it works
            </Badge>
          </m.div>
          <m.h2 variants={itemVariants} className="heading-lg" data-oid="ni6rahg">
            Your journey to{' '}
            <span className="text-gradient-primary" data-oid="6.w9umo">
              Band 7.5+
            </span>
          </m.h2>
          <m.p
            variants={itemVariants}
            className="body-base max-w-xl mx-auto mt-4"
            data-oid="c5m5jpf"
          >
            Skip the guesswork. Our AI identifies your weak spots and helps you fix them instantly.
          </m.p>
        </m.div>

        <div className="relative" data-oid=":qe:4_u">
          {/* Connection Line (Desktop) */}
          <div
            className="absolute top-1/2 left-[10%] right-[10%] h-[2px] hidden lg:block -translate-y-[80px] opacity-10"
            data-oid="t-h6lsz"
          >
            <div
              className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
              data-oid="cr3t6-c"
            />
          </div>

          <m.div
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={containerVariants}
            className="grid grid-cols-1 gap-8 lg:grid-cols-3 relative z-10"
            data-oid="36xe_v_"
          >
            {howItWorks.map((step, idx) => (
              <m.div
                key={step.title}
                variants={itemVariants}
                className="relative h-full"
                data-oid="j04.zst"
              >
                <div
                  className="glass-card-premium !overflow-visible rounded-2xl p-6 lg:p-8 pb-4 lg:pb-6 flex flex-col items-center text-center group cursor-default transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 border-border bg-card/90 backdrop-blur-xl h-full"
                  data-oid="xkqjk-9"
                >
                  {/* Glassy Background Effect */}
                  <div
                    className={cn(
                      'absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 rounded-2xl blur-3xl -z-10 bg-gradient-to-br',
                      step.accent
                    )}
                    data-oid="ksjy3v8"
                  />

                  {/* Step Number Badge - Fixed Cutoff and Improved Design */}
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center"
                    data-oid="2u70bao"
                  >
                    <div
                      className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-xl shadow-primary/30 ring-4 ring-background transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-primary/40"
                      data-oid="iwjftz0"
                    >
                      {idx + 1}
                    </div>
                  </div>

                  {/* Icon Container - Compacted */}
                  <div
                    className="relative mt-6 mb-6 group-hover:scale-110 transition-transform duration-500"
                    data-oid=".d.plbx"
                  >
                    <div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      data-oid="hpiwu-4"
                    />

                    <div
                      className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 flex items-center justify-center text-primary shadow-inner border border-primary/10 transition-all duration-500 group-hover:from-primary group-hover:to-primary/80 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:rotate-6"
                      data-oid="88muk61"
                    >
                      <step.icon
                        size={32}
                        strokeWidth={2.5}
                        className="transition-transform duration-500"
                        data-oid=":gv1sqd"
                      />
                    </div>
                  </div>

                  {/* Content - Compacted Spacing */}
                  <div className="space-y-3 flex-grow" data-oid="9x7o8rv">
                    <h3
                      className="text-xl font-black tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary"
                      data-oid="lo4rwce"
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed text-muted-foreground/80 font-medium group-hover:text-muted-foreground transition-colors duration-300 max-w-[260px] mx-auto"
                      data-oid="4t9wmqx"
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Subtle interactive indicator at the bottom */}
                  <div
                    className="mt-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0"
                    data-oid="38-yks:"
                  >
                    <div
                      className="h-1 w-10 rounded-full bg-primary/20 overflow-hidden"
                      data-oid="gk:t9ad"
                    >
                      <div
                        className="h-full w-full bg-primary origin-left animate-shimmer"
                        style={{ animationDuration: '2s' }}
                        data-oid=".w_98cg"
                      />
                    </div>
                  </div>
                </div>
              </m.div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}
