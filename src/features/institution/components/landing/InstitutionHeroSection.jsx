import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Crown, FileText } from 'lucide-react';
import { institutionLanding as content } from '../../content/landingContent';

const heroImagePriorityProps = { fetchpriority: 'high' };

function HeroAccessBadges() {
  return (
    <div className="mt-4 sm:mt-0 sm:absolute sm:bottom-3 sm:right-3 lg:bottom-4 lg:right-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-20">
      <div className="flex items-center gap-3 rounded-2xl border border-[#e4e2f0] dark:border-white/10 bg-white/95 dark:bg-[#141319]/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-none min-w-[195px] transition-transform duration-200 hover:-translate-y-0.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
          <FileText className="h-5 w-5 stroke-[2]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <strong className="block text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            Pro access
          </strong>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
            Provided by your institution
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-[#e4e2f0] dark:border-white/10 bg-white/95 dark:bg-[#141319]/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-none min-w-[195px] transition-transform duration-200 hover:-translate-y-0.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
          <Crown className="h-5 w-5 stroke-[2]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <strong className="block text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            Premium access
          </strong>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-nowrap">
            Provided by your institution
          </span>
        </div>
      </div>
    </div>
  );
}

function HeroImageDisplay() {
  return (
    <div className="lg:col-span-6 relative mt-4 lg:mt-0">
      <div className="relative overflow-visible">
        <div className="relative">
          <picture>
            <source
              type="image/avif"
              srcSet="/images/institutions/hero-640.avif 640w, /images/institutions/hero-960.avif 960w, /images/institutions/hero-1440.avif 1440w"
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1240px) 50vw, 660px"
            />
            <img
              src="/images/institutions/hero-960.webp"
              srcSet="/images/institutions/hero-640.webp 640w, /images/institutions/hero-960.webp 960w, /images/institutions/hero-1440.webp 1440w"
              sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1240px) 50vw, 660px"
              width={1536}
              height={1024}
              {...heroImagePriorityProps}
              loading="eager"
              decoding="async"
              alt={content.imageAlt}
              className="w-full h-auto aspect-3/2 object-cover object-center rounded-2xl lg:rounded-none lg:[mask-image:linear-gradient(to_right,transparent_0%,black_16%,black_100%)]"
            />
          </picture>

          <div
            aria-hidden="true"
            className="hidden lg:block absolute inset-y-0 left-0 w-28 bg-linear-to-r from-[#fbfaff] via-[#fbfaff]/80 to-transparent dark:from-[#08080a] dark:via-[#08080a]/80 pointer-events-none"
          />
        </div>

        <HeroAccessBadges />
      </div>
    </div>
  );
}

export default function InstitutionHeroSection() {
  return (
    <section
      className="relative border-b border-[#efedf8] dark:border-white/[0.06] bg-linear-to-r from-[#fbfaff] via-white to-[#f6f5ff] dark:from-[#08080a] dark:via-[#0c0c10] dark:to-[#121118] overflow-hidden"
      aria-labelledby="institution-hero-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-6 pt-10 pb-12 sm:pt-14 sm:pb-16 lg:py-16">
          <div className="lg:col-span-6 z-10 space-y-6 text-left">
            <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-[#5a63df] dark:text-[#8f97ff]">
              IELTS platform for institutions
            </p>

            <h1
              id="institution-hero-heading"
              className="text-balance text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.08] text-slate-950 dark:text-white"
            >
              {content.headingLead}
              <br className="hidden sm:inline" /> {content.headingBridge}{' '}
              <span className="text-[#5a63df] dark:text-[#8f97ff]">{content.headingAccent}</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              {content.intro}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                to={content.primaryHref}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#5a63df] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#4a52c9] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
              >
                <span>{content.primaryCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to={content.secondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c6c6f3] bg-white px-5 py-3.5 text-sm font-semibold text-[#5a63df] hover:bg-[#f6f5ff] hover:border-[#5a63df] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 dark:border-white/15 dark:bg-[#141319] dark:text-[#a9afff] dark:hover:bg-white/5"
              >
                <span>{content.secondaryCta}</span>
              </Link>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 font-medium">
              <Check
                className="h-4 w-4 text-[#5a63df] dark:text-[#8f97ff] shrink-0"
                aria-hidden="true"
              />
              <span>A dedicated portal. One simple way to share access.</span>
            </p>
          </div>

          <HeroImageDisplay />
        </div>
      </div>
    </section>
  );
}
