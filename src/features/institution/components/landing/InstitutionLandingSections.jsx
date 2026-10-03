import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Check,
  Clock,
  FileText,
  Headphones,
  HelpCircle,
  Layers,
  Mail,
  Mic,
  Pencil,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PANEL,
  WELL,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  IconChip,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import {
  institutionLanding as content,
  portalFeatures,
  practiceFeatures,
  approvalSteps,
  institutionFaqs,
} from '../../content/landingContent';
import PortalPreview from './PortalPreview';
import SkillVisual from './SkillVisual';

const skillIcons = [BookOpen, Headphones, Pencil, Mic];
const portalIcons = [UserPlus, ShoppingCart, FileText];
const stepIcons = [FileText, Users, Mail];

const academicBenefits = [
  {
    title: 'Centralized Billing',
    desc: 'Keep institution purchases, billing history and available invoices together, separate from students’ personal subscriptions.',
    icon: FileText,
    badge: 'Direct Billing',
  },
  {
    title: 'Bulk CSV Onboarding',
    desc: 'Import student email addresses with a CSV preview, then send invitations and track who has accepted.',
    icon: UserPlus,
    badge: 'One-Click Invite',
  },
  {
    title: 'Flexible Student Seats',
    desc: 'Seats only begin their duration upon student activation, allowing you to prepay for upcoming terms.',
    icon: Users,
    badge: 'Flexible Terms',
  },
  {
    title: 'Academic Volume Pricing',
    desc: 'Discuss bulk seat pricing or a custom package for your language school or IELTS coaching centre.',
    icon: Award,
    badge: 'Group Rates',
  },
];

export function SectionEyebrow({ icon: Icon = Sparkles, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#ded9ff] bg-[#f2f0ff]/80 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#5a63df] shadow-xs backdrop-blur-md transition-all duration-300 dark:border-[#5a63df]/30 dark:bg-[#5a63df]/15 dark:text-[#a9afff]">
      <Icon
        className="h-3.5 w-3.5 text-[#5a63df] dark:text-[#a9afff] shrink-0"
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}

export function InstitutionPortalFeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-16 sm:py-24 border-t border-[#e4e2f0]/70 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.01]"
      aria-labelledby="portal-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <SectionEyebrow icon={Layers}>Institution Portal</SectionEyebrow>
          <h2
            id="portal-heading"
            className="text-balance text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            One portal.{' '}
            <span className="text-[#5a63df] dark:text-[#8f97ff]">Every student connected.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Manage invitations, student access, seat purchases and billing in one simple place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-4">
            {portalFeatures.map((feature, i) => {
              const Icon = portalIcons[i];
              return (
                <div
                  key={feature.title}
                  className={cn(
                    PANEL,
                    'p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/35 dark:hover:border-[#8f97ff]/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <IconChip
                      icon={Icon}
                      tone={i === 0 ? 'accent' : i === 1 ? 'emerald' : 'sky'}
                      size="md"
                    />
                    <div className="space-y-1">
                      <h3 className={cn(TITLE, 'text-sm sm:text-base font-extrabold')}>
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div
              className={cn(
                WELL,
                'p-4 rounded-xl border border-[#e4e2f0]/80 dark:border-white/10 space-y-2'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(MICRO, MUTED)}>Already an approved institution?</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200">
                Access your seat dashboard and manage student invitations and access status.
              </p>
              <Link
                to={content.secondaryHref}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5a63df] dark:text-[#a9afff] hover:underline pt-1"
              >
                <span>Sign in to Institution Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <PortalPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

export function InstitutionPracticeSkillsSection() {
  const tones = ['sky', 'accent', 'emerald', 'amber'];
  return (
    <section
      className="relative py-16 sm:py-24 border-t border-[#e4e2f0]/70 dark:border-white/[0.07]"
      aria-labelledby="practice-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <SectionEyebrow icon={Sparkles}>Complete IELTS Practice</SectionEyebrow>
          <h2
            id="practice-heading"
            className="text-balance text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            Practice that continues{' '}
            <span className="text-[#5a63df] dark:text-[#8f97ff]">beyond the classroom.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Give students IELTS online practice in Reading, Listening, Writing and Speaking, with
            realistic tasks and AI feedback on their writing and speaking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {practiceFeatures.map((feature, i) => {
            const Icon = skillIcons[i];
            return (
              <article
                key={feature.title}
                className={cn(
                  PANEL,
                  'flex flex-col justify-between p-5 space-y-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <IconChip icon={Icon} tone={tones[i]} size="md" />
                    <span className={cn(MICRO, MUTED)}>Skill 0{i + 1}</span>
                  </div>
                  <h3
                    className={cn(TITLE, 'text-base font-extrabold text-slate-900 dark:text-white')}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed min-h-[48px]">
                    {feature.description}
                  </p>
                </div>

                <div
                  className={cn(
                    WELL,
                    'rounded-xl p-3 border border-[#e4e2f0]/60 dark:border-white/[0.05]'
                  )}
                >
                  <SkillVisual index={i} />
                </div>
              </article>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Standard Pro or Premium allowances apply. AI feedback and band scores are practice
          estimates.
        </p>
      </div>
    </section>
  );
}

export function InstitutionAcademicBenefitsSection() {
  return (
    <section className="relative py-16 sm:py-20 border-t border-[#e4e2f0]/70 dark:border-white/[0.07] bg-slate-50/50 dark:bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <SectionEyebrow icon={ShieldCheck}>Academic Benefits</SectionEyebrow>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Built specifically for IELTS providers.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Eliminate administrative friction and give every student the same high-standard exam
            preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {academicBenefits.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                PANEL,
                'p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:text-[#a9afff]">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function InstitutionHowItWorksSection() {
  const turnaroundCues = [
    'Share your requirements',
    'Our team reviews your request',
    'Set up your institution portal',
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-24 border-t border-[#e4e2f0]/70 dark:border-white/[0.07]"
      aria-labelledby="how-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <SectionEyebrow icon={Clock}>Get Started</SectionEyebrow>
          <h2
            id="how-heading"
            className="text-balance text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            How institution access works.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Apply first. After approval, your owner receives an invitation to a dedicated
            institution portal.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 relative list-none m-0 p-0">
          {approvalSteps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <li
                key={step.title}
                className={cn(
                  PANEL,
                  'relative p-6 flex flex-col justify-between space-y-5 transition-all duration-200 hover:-translate-y-0.5'
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        NUM,
                        'flex h-9 w-9 items-center justify-center rounded-xl bg-[#5a63df]/10 text-sm font-extrabold text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]'
                      )}
                    >
                      0{i + 1}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3
                      className={cn(
                        TITLE,
                        'text-base font-extrabold text-slate-900 dark:text-white'
                      )}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e4e2f0]/60 dark:border-white/[0.07] flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>Timeline:</span>
                  <span className="text-[#5a63df] dark:text-[#a9afff]">{turnaroundCues[i]}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function InstitutionFaqSection() {
  return (
    <section
      className="relative py-16 sm:py-24 border-t border-[#e4e2f0]/70 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.01]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <SectionEyebrow icon={HelpCircle}>A Few Helpful Answers</SectionEyebrow>
          <h2
            id="faq-heading"
            className="text-balance text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            Simple access.{' '}
            <span className="text-[#5a63df] dark:text-[#8f97ff]">Clear expectations.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Common questions about seat allowances, student access, billing, and privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-4">
            <div className={cn(PANEL, 'p-6 space-y-4')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5a63df]/15 text-[#5a63df] dark:text-[#a9afff]">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Need custom requirements?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Have questions about student group sizes, prepaid seat durations, or custom
                  institution pricing?
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold transition-all hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5"
              >
                <span>Contact Our Partnerships Team</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div
              className={cn(
                WELL,
                'p-4 rounded-xl border border-[#e4e2f0]/80 dark:border-white/10 space-y-1'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Dedicated Academic Support
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Share your institution’s requirements and our team will get in touch.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="space-y-3">
              {institutionFaqs.map(([question, answer], idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className={cn(
                    PANEL,
                    'border border-[#e4e2f0] dark:border-white/10 px-5 rounded-xl overflow-hidden'
                  )}
                >
                  <AccordionTrigger className="text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white py-4.5 hover:no-underline hover:text-[#5a63df] dark:hover:text-[#8f97ff]">
                    {question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 pb-4.5">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingCtaChecklist() {
  return (
    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        No upfront payment to apply
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Admin-reviewed applications
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Flexible group licensing
      </span>
    </div>
  );
}

export function InstitutionClosingCtaSection() {
  return (
    <section
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      aria-labelledby="closing-heading"
    >
      <div
        className={cn(
          PANEL,
          'relative overflow-hidden p-8 sm:p-12 lg:p-14 border border-[#ded9ff] dark:border-[#5a63df]/30 bg-linear-to-br from-[#f8f7ff] via-white to-[#f0eeff] dark:from-[#141319] dark:via-[#100f15] dark:to-[#17142b] shadow-md'
        )}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#5a63df]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4 text-left">
            <SectionEyebrow icon={Sparkles}>Ready When You Are</SectionEyebrow>
            <h2
              id="closing-heading"
              className="text-balance text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 dark:text-white"
            >
              Ready to support your students?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Share your needs. Our academic partnerships team will help you configure the right
              seat tiers for your institution.
            </p>

            <ClosingCtaChecklist />
          </div>

          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
            <Link
              to={content.primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5a63df] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#4a52c9] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-center"
            >
              <span>{content.primaryCta}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to={content.secondaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4e2f0] bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-[#5a63df]/30 hover:text-[#5a63df] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 dark:border-white/10 dark:bg-[#141319] dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-[#a9afff] text-center"
            >
              <Building2 className="h-4 w-4 text-[#5a63df] dark:text-[#8f97ff]" />
              <span>{content.secondaryCta}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InstitutionSkipLink() {
  return (
    <a
      href="#institution-main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-150 focus:rounded-lg focus:bg-[#5a63df] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
    >
      Skip to content
    </a>
  );
}

export function InstitutionAmbientAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(168_162_158/0.25)_1px,transparent_0)] bg-size-[24px_24px] opacity-40 dark:bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.05)_1px,transparent_0)] dark:opacity-25" />
      <div className="absolute -left-28 top-16 h-[460px] w-[460px] rounded-full bg-[#5a63df]/10 blur-[100px] transform-gpu dark:bg-[#5a63df]/15" />
      <div className="absolute -right-28 top-40 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-[110px] transform-gpu dark:bg-indigo-500/12" />
    </div>
  );
}
