import React from 'react';
import { m } from 'framer-motion';
import ShieldCheck from 'lucide-react/icons/shield-check';
import ScrollText from 'lucide-react/icons/scroll-text';
import Eye from 'lucide-react/icons/eye';
import { SoftSection, landingReveal, landingStagger } from '../landing/LandingSection';
import { ABOUT_VIEWPORT, CARD, CHIP, INK, MUTED, RULE } from './aboutTokens';

/**
 * Why the product exists, and where it stops.
 *
 * This is the section the page did not have. What stood here before was a
 * feature list and a stat grid — both restatements of the landing page. An
 * About page is where a visitor decides whether to trust the thing, so the
 * right half of this section is given over to the limits rather than to more
 * selling. That is also the voice the rest of the site already uses: the FAQ
 * answers "No" to whether AI bands are official results, and the landing
 * structured data deliberately omits a rating the product has not collected.
 */
const COMMITMENTS = [
  {
    icon: ScrollText,
    title: 'Practice estimates, never official results',
    body: 'Only certified examiners and authorised test centres issue real band scores. Everything here is practice, and the product says so wherever a band appears.',
  },
  {
    icon: ShieldCheck,
    title: 'The public band descriptors, in full',
    body: 'Scored against the same published criteria a human examiner applies — not a score of our own invention.',
  },
  {
    icon: Eye,
    title: 'No band without the reason for it',
    body: 'A number on its own teaches nothing. Every score arrives with the sentences and criterion notes behind it.',
  },
];

export default function AboutMission() {
  return (
    <SoftSection className="bg-[#faf9ff] py-16 dark:bg-[#08080a] lg:py-24">
      <div className="relative z-10 mx-auto max-w-[1300px] px-5 md:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* The problem, stated plainly. */}
          <m.div
            initial="hidden"
            whileInView="show"
            viewport={ABOUT_VIEWPORT}
            variants={landingStagger}
          >
            <m.span
              variants={landingReveal}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${CHIP}`}
            >
              Why we built it
            </m.span>

            <m.h2
              variants={landingReveal}
              className={`mt-5 text-balance text-[clamp(1.9rem,3.4vw,2.9rem)] font-black leading-[1.05] tracking-[-0.045em] ${INK}`}
            >
              Half of the IELTS marks itself. The expensive half doesn&apos;t.
            </m.h2>

            <m.div
              variants={landingReveal}
              className={`mt-6 space-y-4 text-[15px] leading-7 ${MUTED}`}
            >
              <p>
                Reading and Listening close the loop on their own — you finish the paper, you see
                the answers, you know where you stand. Writing and Speaking give you nothing back. A
                tutor takes days to return an essay and charges by the hour for it, so most
                candidates walk into the test having written a handful of Task 2 responses and
                guessed at the rest.
              </p>
              <p>
                That gap is not a knowledge problem, it is a feedback problem. Learners do not need
                to be told to practise more; they need to know which of the four criteria is holding
                their band down, and what a better version of their own sentence looks like.
              </p>
              <p className="font-semibold text-[#101836] dark:text-slate-200">
                So we built the part that was missing: criterion-based feedback on your own writing
                and speaking, returned while you still remember what you were trying to say.
              </p>
            </m.div>
          </m.div>

          {/* Where it stops. */}
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={ABOUT_VIEWPORT}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={CARD}
          >
            <div className="flex items-center gap-2.5">
              <span className={`h-4 w-[3px] shrink-0 rounded-full bg-[#6256ef]`} aria-hidden />
              <h3 className={`text-[13px] font-black uppercase tracking-[0.12em] ${INK}`}>
                Where we draw the line
              </h3>
            </div>

            <ul className="mt-5 space-y-5">
              {COMMITMENTS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className={index > 0 ? `border-t pt-5 ${RULE}` : undefined}>
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${CHIP}`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0">
                      <h4 className={`text-sm font-extrabold leading-snug ${INK}`}>{title}</h4>
                      <p className={`mt-1.5 text-[13px] leading-6 ${MUTED}`}>{body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </m.div>
        </div>
      </div>
    </SoftSection>
  );
}
