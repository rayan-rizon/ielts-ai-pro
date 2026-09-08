import React from 'react';
import { m } from 'framer-motion';
import Zap from 'lucide-react/icons/zap';
import Scale from 'lucide-react/icons/scale';
import Globe from 'lucide-react/icons/globe';
import {
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from '../landing/LandingSection';
import { ABOUT_VIEWPORT, CARD, CHIP, INK, MUTED } from './aboutTokens';

/**
 * The three principles the product is built around.
 *
 * Same three ideas as before, rebuilt on the landing card. The old version gave
 * each card its own accent hue (amber / blue / purple), its own hover glow orb
 * and its own border colour, which turned one section into three unrelated
 * visual systems. Colour here carries no meaning — the cards are peers — so
 * they share one accent and let the copy differentiate them.
 */
const VALUES = [
  {
    icon: Zap,
    title: 'Feedback while it still matters',
    badge: 'Immediacy',
    body: 'A correction lands best in the minutes after you wrote the sentence. Three days later it is a receipt, not a lesson.',
  },
  {
    icon: Scale,
    title: 'The published rules, not our own',
    badge: 'Fidelity',
    body: 'If a judgement cannot be traced to an official band descriptor, it does not belong in a score.',
  },
  {
    icon: Globe,
    title: 'Preparation not rationed by budget',
    badge: 'Access',
    body: 'Cambridge Reading and Listening stay unlimited on the free plan. Paid tiers add AI volume, not the exam itself.',
  },
];

export default function AboutValues() {
  return (
    <SoftSection className="bg-[#fcfdff] py-16 dark:bg-[#08080a] lg:py-24">
      <div className="relative z-10 mx-auto max-w-[1300px] px-5 md:px-8">
        <SectionHeading
          eyebrow="What we optimise for"
          title="Three principles we"
          script="do not trade away."
          description="Every product decision on this platform gets checked against these three."
          viewport={ABOUT_VIEWPORT}
        />

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={ABOUT_VIEWPORT}
          variants={landingStagger}
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {VALUES.map(({ icon: Icon, title, badge, body }) => (
            <m.article key={title} variants={landingReveal} className={CARD}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${CHIP}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.14em] leading-tight ${MUTED}`}
                >
                  {badge}
                </span>
              </div>

              <h3
                className={`mt-5 text-lg font-extrabold leading-snug tracking-tight transition-colors group-hover:text-[#5e50ee] dark:group-hover:text-violet-300 ${INK}`}
              >
                {title}
              </h3>
              <p className={`mt-2.5 text-[13px] leading-6 ${MUTED}`}>{body}</p>
            </m.article>
          ))}
        </m.div>
      </div>
    </SoftSection>
  );
}
