import React, { memo } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';
import { SectionHeading, SoftSection } from './LandingSection';

function QuoteCard({ name, meta, quote, metric, icon: Icon }) {
  return (
    <div
      className="relative mx-3 w-[330px] shrink-0 overflow-hidden rounded-[24px] border border-white/90 bg-white/[0.74] p-7 shadow-[0_24px_60px_-36px_rgba(31,52,106,.42)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-34px_rgba(63,81,181,.45)] dark:border-white/10 dark:bg-white/[.055] md:w-[390px]"
      data-oid="dbnqo2p"
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-2xl"
        data-oid="_04sfjh"
      />

      <div className="relative flex h-full flex-col" data-oid="b5::29f">
        <div className="flex items-start justify-between gap-6" data-oid="kh:m4e7">
          <div className="space-y-1.5" data-oid="7_:-n:3">
            <div className="text-base font-black text-foreground" data-oid="gknf.n.">
              {name}
            </div>
            <div className="text-sm font-semibold text-muted-foreground" data-oid="y62flsv">
              {meta}
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-black text-primary shadow-sm transition-all group-hover:border-primary/40 group-hover:bg-primary/10"
            data-oid="er9jl3k"
          >
            <Icon className="h-4 w-4" data-oid="n98nlkd" />
            {metric}
          </div>
        </div>
        <div
          className="mt-6 text-[15px] font-medium leading-relaxed text-foreground/90 whitespace-normal flex-grow"
          data-oid="n:10l04"
        >
          “{quote}”
        </div>
        <div className="mt-8 flex items-center gap-1 text-amber-500" data-oid="kbp-p:7">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-amber-500 transition-transform duration-300 hover:scale-125"
              style={{ transitionDelay: `${i * 30}ms` }}
              data-oid="5fe_0g."
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsSection({ testimonials, viewport }) {
  const reduceMotion = useReducedMotion();
  // Duplicate array for an infinitely scrolling marquee effect
  const duplicatedTestimonials = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  return (
    <SoftSection
      id="results"
      className="scroll-mt-24 border-y border-[#e9eef8]/70"
      data-oid="gzcdor9"
    >
      {/* Background Decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[120px] -z-10"
        data-oid=":624unr"
      />

      <div className="relative z-10 mx-auto mb-12 max-w-7xl px-6 lg:mb-16" data-oid="b649gwu">
        <SectionHeading
          eyebrow="IELTS success stories"
          title="Real progress from"
          script="real learners."
          description="Join learners who turned focused practice and clear feedback into the band score they needed."
          viewport={viewport}
        />
      </div>

      {/* Infinite Scrolling Marquee */}
      <div
        className="relative w-full overflow-hidden flex flex-col gap-6 py-4 mask-edges"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        {/* Row 1: Scroll Left */}
        <m.div
          className="flex w-max"
          animate={reduceMotion ? {} : { x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 45,
            ease: 'linear',
          }}
        >
          {duplicatedTestimonials.map((t, i) => (
            <QuoteCard key={`row1-${t.name}-${i}`} {...t} data-oid={`row1-${i}`} />
          ))}
        </m.div>

        {/* Row 2: Scroll Right (reverse) */}
        <m.div
          className="flex w-max"
          animate={reduceMotion ? {} : { x: ['-50%', '0%'] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 55,
            ease: 'linear',
          }}
        >
          {duplicatedTestimonials.map((t, i) => (
            <QuoteCard key={`row2-${t.name}-${i}`} {...t} data-oid={`row2-${i}`} />
          ))}
        </m.div>
      </div>
    </SoftSection>
  );
}

export default memo(ResultsSection);
