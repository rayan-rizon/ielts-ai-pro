import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import ArrowRight from 'lucide-react/icons/arrow-right';
import ChevronRight from 'lucide-react/icons/chevron-right';

import {
  GlassPanel,
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from '@/features/core/components/landing/LandingSection';

const VIEWPORT = { once: true, amount: 0.2 };

// React 18 forwards the HTML-standard lowercase attribute without a development
// warning; the camel-cased prop is dropped, taking the LCP hint with it.
const heroImagePriorityProps = { fetchpriority: 'high' };

/** Matches the pill used by SectionHeading, for places that need one on its own. */
function EyebrowPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-[#ded9ff] bg-[#f2f0ff]/75 px-5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#5e50ee] shadow-[0_8px_24px_-8px_rgba(98,86,239,0.22)] backdrop-blur-md dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/**
 * The site's handwritten accent. SectionHeading draws its underline with an
 * absolutely-positioned span, which only lines up while the phrase fits on one
 * line — these headings wrap, so the rule is painted as a background instead
 * and `box-decoration-clone` repeats it on every line.
 */
function ScriptAccent({ children }) {
  return (
    <span className="font-handwritten box-decoration-clone bg-linear-to-r/srgb from-[#89d9d0] to-[#7086f6] bg-[length:100%_3px] bg-bottom bg-no-repeat pb-1 tracking-[-0.03em] text-[#5262ef] dark:text-violet-300">
      {children}
    </span>
  );
}

function PrimaryLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#6256ef] px-6 py-3 text-sm font-black text-white shadow-[0_18px_40px_-18px_rgba(98,86,239,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#5243e4] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7664f2]/30"
    >
      {children} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function SecondaryLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/80 px-6 py-3 text-sm font-black text-slate-800 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#c9c2ff] hover:text-[#5243e4] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-violet-400/40"
    >
      {children}
    </Link>
  );
}

export function Breadcrumb({ label }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
        <li>
          <Link to="/" className="transition hover:text-[#5243e4] dark:hover:text-violet-300">
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="text-slate-800 dark:text-slate-200" aria-current="page">
          {label}
        </li>
      </ol>
    </nav>
  );
}

export function Hero({ config }) {
  const Icon = config.icon;
  return (
    <section className="relative overflow-hidden bg-[#fcfdff] pt-24 pb-14 dark:bg-[#08080a] sm:pt-28 md:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-136 w-136 rounded-full bg-[#c9f3eb]/45 blur-[120px] dark:bg-[#5a63df]/10" />
        <div className="absolute -right-40 top-4 h-152 w-152 rounded-full bg-[#d8ddff]/60 blur-[130px] dark:bg-[#5a63df]/8" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <m.div initial="hidden" animate="show" variants={landingStagger}>
          <m.div variants={landingReveal}>
            <Breadcrumb label={config.breadcrumb} />
            <EyebrowPill icon={Icon}>{config.eyebrow}</EyebrowPill>
          </m.div>

          <m.h1
            variants={landingReveal}
            className="mt-5 text-balance text-[clamp(2.3rem,5.2vw,3.9rem)] font-black leading-[1.1] tracking-[-0.05em] text-[#07142f] dark:text-white"
          >
            {config.headingLead} <ScriptAccent>{config.headingScript}</ScriptAccent>
          </m.h1>

          <m.p
            variants={landingReveal}
            className="mt-6 max-w-2xl text-[15px] font-medium leading-7 text-[#59657a] dark:text-slate-300 md:text-[17px]"
          >
            {config.answer}
          </m.p>

          <m.div variants={landingReveal} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink to={config.primaryHref}>{config.primaryCta}</PrimaryLink>
            <SecondaryLink to={config.secondaryHref}>{config.secondaryCta}</SecondaryLink>
          </m.div>

          <m.ul
            variants={landingReveal}
            className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            {config.chips.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none"
              >
                {chip}
              </li>
            ))}
          </m.ul>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <GlassPanel className="overflow-hidden rounded-[28px] p-3">
            <img
              src="/ielts-hero-student.webp"
              alt={config.heroAlt}
              width="1200"
              height="900"
              loading="eager"
              decoding="async"
              {...heroImagePriorityProps}
              className="aspect-4/3 w-full rounded-[20px] object-cover"
            />
            <dl className="grid gap-2 p-1 pt-3 sm:grid-cols-3">
              {config.proof.map(([value, label]) => (
                <div key={value} className="rounded-2xl bg-slate-50/90 px-3 py-3 dark:bg-white/5">
                  <dt className="text-sm font-black text-[#07142f] dark:text-white">{value}</dt>
                  <dd className="mt-1 text-[11px] font-semibold leading-4 text-slate-500 dark:text-slate-400">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </GlassPanel>
        </m.div>
      </div>
    </section>
  );
}

export function FeatureSection({ config }) {
  return (
    <SoftSection>
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <SectionHeading
          eyebrow="What you get"
          title="Practice that ends with a"
          script="decision"
          description="Every session should leave you with one thing to change, not just a number to worry about."
          viewport={VIEWPORT}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={landingStagger}
          className="mt-12 grid gap-5 lg:grid-cols-3"
        >
          {config.features.map((feature) => {
            const Icon = feature.icon;
            return (
              <m.article key={feature.title} variants={landingReveal}>
                <GlassPanel className="h-full rounded-[24px] p-7 transition duration-300 hover:-translate-y-1">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6256ef] text-white shadow-[0_14px_30px_-14px_rgba(98,86,239,0.9)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-black tracking-tight text-[#07142f] dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#59657a] dark:text-slate-300">
                    {feature.text}
                  </p>
                </GlassPanel>
              </m.article>
            );
          })}
        </m.div>
      </div>
    </SoftSection>
  );
}

/**
 * Test-format breakdown. This is the section search traffic actually lands on,
 * so its anchors (#reading, #listening) are linked from the footer and blog and
 * must not be renamed.
 */
export function BreakdownSection({ config }) {
  const { breakdown } = config;
  return (
    <section className="relative overflow-hidden bg-white py-20 dark:bg-[#0b0b0e] md:py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <SectionHeading
          eyebrow={breakdown.eyebrow}
          title={breakdown.title}
          script={breakdown.script}
          description={breakdown.description}
          viewport={VIEWPORT}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={landingStagger}
          className={`mt-12 grid gap-5 ${
            breakdown.items.length > 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
          }`}
        >
          {breakdown.items.map((item) => {
            const Icon = item.icon;
            return (
              <m.article
                key={item.id}
                id={item.id}
                variants={landingReveal}
                className="scroll-mt-28"
              >
                <GlassPanel className="h-full rounded-[24px] p-7">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ded9ff] bg-[#f2f0ff] text-[#5e50ee] dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-[#07142f] dark:text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#5e50ee] dark:text-violet-300">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5 border-t border-slate-200/70 pt-5 dark:border-white/10">
                    {item.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2.5 text-sm font-medium leading-6 text-[#59657a] dark:text-slate-300"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7086f6]"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              </m.article>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}

export function ProcessSection({ config }) {
  return (
    <SoftSection>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-5 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <EyebrowPill>A better review loop</EyebrowPill>
          <h2 className="mt-5 text-balance text-[clamp(2rem,4vw,3.2rem)] font-black leading-[1.02] tracking-[-0.05em] text-[#07142f] dark:text-white">
            Diagnose, focus, <ScriptAccent>repeat</ScriptAccent>
          </h2>
          <p className="mt-5 max-w-lg text-[15px] font-medium leading-7 text-[#59657a] dark:text-slate-300">
            A score is useful only when it changes what you practise next. Keep the loop small
            enough to repeat consistently.
          </p>
        </div>

        <m.ol
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={landingStagger}
          className="space-y-4"
        >
          {config.steps.map(([title, text], index) => (
            <m.li key={title} variants={landingReveal}>
              <GlassPanel className="grid grid-cols-[3rem_1fr] gap-4 rounded-[24px] p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6256ef] text-sm font-black text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#07142f] dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#59657a] dark:text-slate-300">
                    {text}
                  </p>
                </div>
              </GlassPanel>
            </m.li>
          ))}
        </m.ol>
      </div>
    </SoftSection>
  );
}

export function FaqSection({ config }) {
  return (
    <section className="relative overflow-hidden bg-white py-20 dark:bg-[#0b0b0e] md:py-28">
      <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6">
        <SectionHeading
          eyebrow="Clear answers"
          title="Frequently asked"
          script="questions"
          viewport={VIEWPORT}
        />
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={landingStagger}
          className="mt-12 space-y-4"
        >
          {config.faqs.map((item) => (
            <m.article key={item.q} variants={landingReveal}>
              <GlassPanel className="rounded-[22px] p-6">
                <h3 className="text-lg font-black leading-snug text-[#07142f] dark:text-white">
                  {item.q}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#59657a] dark:text-slate-300">
                  {item.a}
                </p>
              </GlassPanel>
            </m.article>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export function RelatedSection({ links, currentPath }) {
  const visible = links.filter((link) => link.href !== currentPath);
  return (
    <SoftSection className="py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-[#07142f] dark:text-white">
          Keep preparing
        </h2>
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((link) => (
            <li key={link.href}>
              <Link to={link.href} className="group block h-full">
                <GlassPanel className="h-full rounded-[22px] p-5 transition duration-300 group-hover:-translate-y-1">
                  <h3 className="flex items-center gap-1.5 text-sm font-black text-[#07142f] dark:text-white">
                    {link.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-[#6256ef] transition-transform duration-300 group-hover:translate-x-1 dark:text-violet-300"
                    />
                  </h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#59657a] dark:text-slate-300">
                    {link.text}
                  </p>
                </GlassPanel>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SoftSection>
  );
}
