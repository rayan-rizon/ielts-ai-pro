import React from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import ChevronRight from 'lucide-react/icons/chevron-right';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(5px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

function FeatureCard({ icon: Icon, title, description, accent, index }) {
  return (
    <div
      className="relative h-full overflow-hidden rounded-[2rem] p-8 group transition-all duration-500 border border-black/[0.05] dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-sm hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 dark:hover:border-primary/50 hover:-translate-y-2"
      data-oid="_na_..8"
    >
      {/* Decorative animated gradient background */}
      <div
        className={`absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 transition-all duration-700 group-hover:opacity-100 group-hover:scale-150 ${accent} blur-3xl`}
        data-oid=":ofeg14"
      />

      <div className="relative z-10 flex flex-col h-full" data-oid=".4exs4z">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner ring-1 ring-primary/20 transition-all duration-500 overflow-hidden relative group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-primary/30"
          data-oid="6ik:_9w"
        >
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 dark:via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
          <Icon className="h-8 w-8 relative z-10" data-oid="vjj7n:1" />
        </div>
        <h3
          className="mt-6 text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary"
          data-oid="wxf5xzu"
        >
          {title}
        </h3>
        <p
          className="mt-3 text-[15px] font-medium leading-relaxed text-muted-foreground flex-grow"
          data-oid="v6bdvxq"
        >
          {description}
        </p>

        <div className="mt-8 flex items-center gap-1.5 text-sm font-black text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out">
          Explore Feature <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection({ features, viewport }) {
  return (
    <section
      id="features"
      className="scroll-mt-24 py-16 md:py-24 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 border-y border-border/40"
      data-oid="7r82vbe"
    >
      {/* Background Decorators */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute -left-40 top-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -right-40 bottom-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-6 relative z-10" data-oid="6.j2dfq">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="mb-16 text-center max-w-3xl mx-auto"
          data-oid="0rd-i:a"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-blue-700 dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-5 py-2 text-[11px] font-black uppercase tracking-widest mb-6 shadow-sm"
            data-oid="-s-q.ro"
          >
            Why IELTS AI Pro?
          </Badge>
          <m.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-black tracking-tighter"
            data-oid="9fjp9di"
          >
            Built for{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500"
              data-oid="muo-j9_"
            >
              High IELTS
            </span>{' '}
            Scores
          </m.h2>
          <m.p
            variants={itemVariants}
            className="mt-6 text-lg font-medium text-muted-foreground"
            data-oid="lm0x.xe"
          >
            We combine advanced AI with official IELTS band descriptors to create a clearer, faster,
            and more effective learning experience.
          </m.p>
        </m.div>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          data-oid=":r5_x0q"
        >
          {features.map((f, i) => (
            <m.div
              key={f.title}
              variants={itemVariants}
              className={i === 0 || i === 3 ? 'md:col-span-2 lg:col-span-1' : ''}
              data-oid="::46gbv"
            >
              <FeatureCard
                icon={f.icon}
                title={f.title}
                description={f.description}
                accent={f.accent}
                index={i}
                data-oid="q:e..s:"
              />
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
