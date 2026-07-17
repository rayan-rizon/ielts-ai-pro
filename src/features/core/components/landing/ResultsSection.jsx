import React, { memo } from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

function QuoteCard({ name, meta, quote, metric, icon: Icon }) {
  return (
    <div
      className="w-[350px] md:w-[400px] shrink-0 glass-card-premium rounded-2xl p-8 hover-lift group border border-border/50 bg-white/70 dark:bg-slate-900/60 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 mx-4"
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
  // Duplicate array for an infinitely scrolling marquee effect
  const duplicatedTestimonials = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  return (
    <section
      id="results"
      className="scroll-mt-24 py-16 md:py-24 relative overflow-hidden bg-white/40 dark:bg-[#0f1115]/30 border-y border-border/40"
      data-oid="gzcdor9"
    >
      {/* Background Decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/5 rounded-full blur-[120px] -z-10"
        data-oid=":624unr"
      />

      <div className="mx-auto max-w-7xl px-6 relative z-10 mb-12 lg:mb-16" data-oid="b649gwu">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto"
          data-oid="0oxzxh_"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-blue-700 dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-5 py-2 text-[11px] font-black uppercase tracking-widest mb-6 shadow-sm"
            data-oid="e5p607_"
          >
            IELTS Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter" data-oid="_ef-5cw">
            Real results from <br className="md:hidden" />
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500"
              data-oid="a5_xyz9"
            >
              IELTS Learners
            </span>
          </h2>
          <p
            className="mt-6 text-lg font-medium text-muted-foreground max-w-2xl mx-auto"
            data-oid="c.gyzpg"
          >
            Join thousands of learners who fast-tracked their IELTS preparation and secured their
            target band scores.
          </p>
        </m.div>
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
          animate={{ x: ['0%', '-50%'] }}
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
          animate={{ x: ['-50%', '0%'] }}
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
    </section>
  );
}

export default memo(ResultsSection);
