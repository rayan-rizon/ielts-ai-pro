import React from 'react';
import { m } from 'framer-motion';
import {
  SectionHeading,
  SoftSection,
  landingReveal,
  landingStagger,
} from '../landing/LandingSection';
import { ABOUT_VIEWPORT, CARD, CHIP, INK, INSET, MUTED } from './aboutTokens';

/**
 * How a response is actually scored.
 *
 * Replaces `TechSpotlightSection`, which was a second copy of the landing's
 * "How it works". The landing tells you the learner's workflow; what belongs
 * here is the method — which criteria a band comes from.
 *
 * Writing and Speaking do NOT share a criteria set: Task Response and
 * Coherence & Cohesion are Writing's, Fluency & Coherence and Pronunciation
 * are Speaking's, and only Lexical Resource and Grammatical Range & Accuracy
 * are common to both. Six distinct criteria, four applied per response. The
 * Speaking set here matches the one the product actually reports against in
 * `speaking/utils/speakingReportSummary.js`.
 */
const CRITERIA = [
  {
    id: '01',
    name: 'Task Response',
    skill: 'Writing',
    body: 'Whether the response answers the whole question and holds a clear position throughout.',
  },
  {
    id: '02',
    name: 'Coherence & Cohesion',
    skill: 'Writing',
    body: 'Paragraphing, sequencing and linking that reads naturally rather than bolted on.',
  },
  {
    id: '03',
    name: 'Fluency & Coherence',
    skill: 'Speaking',
    body: 'Speaking at length without losing the thread, and without hesitation that breaks the answer up.',
  },
  {
    id: '04',
    name: 'Pronunciation',
    skill: 'Speaking',
    body: 'Scored from your recording: individual sounds, word stress and intonation across the answer.',
  },
  {
    id: '05',
    name: 'Lexical Resource',
    skill: 'Writing & Speaking',
    body: 'Range and precision of vocabulary. Misusing a rare word costs more than never reaching for it.',
  },
  {
    id: '06',
    name: 'Grammatical Range & Accuracy',
    skill: 'Writing & Speaking',
    body: 'Variety of structures attempted, weighed against how often they go wrong.',
  },
];

const LIMITS = [
  'A practice band is an estimate. It is not moderated, and it is not an official IELTS result.',
  'Pronunciation is judged from your recorded audio. If a recording is too unclear to assess, the report says so rather than guessing from the transcript.',
  'Reading and Listening are marked against the answer key, so those results are exact.',
];

export default function AboutMethod() {
  return (
    <SoftSection className="bg-[#faf9ff] py-16 dark:bg-[#08080a] lg:py-24">
      <div className="relative z-10 mx-auto max-w-[1300px] px-5 md:px-8">
        <SectionHeading
          eyebrow="How the scoring works"
          title="Every response, scored on"
          script="four criteria."
          description="Writing and Speaking each have their own four published IELTS descriptors — two of which they share. Every band traces back to the descriptor it came from."
          viewport={ABOUT_VIEWPORT}
        />

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={ABOUT_VIEWPORT}
          variants={landingStagger}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {CRITERIA.map(({ id, name, skill, body }) => (
            <m.article key={id} variants={landingReveal} className={CARD}>
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-[11px] font-black tabular-nums ${CHIP}`}
                >
                  {id}
                </span>
                <span
                  className={`text-[9px] font-black uppercase leading-tight tracking-[0.14em] ${MUTED}`}
                >
                  {skill}
                </span>
              </div>

              <h3
                className={`mt-4 text-[15px] font-extrabold leading-snug transition-colors group-hover:text-[#5e50ee] dark:group-hover:text-violet-300 ${INK}`}
              >
                {name}
              </h3>
              <p className={`mt-2 text-[13px] leading-6 ${MUTED}`}>{body}</p>
            </m.article>
          ))}
        </m.div>

        {/* The honest half. */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={ABOUT_VIEWPORT}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-5 ${CARD} sm:p-7`}
        >
          <div className={`${INSET} p-5 sm:p-6`}>
            <h3 className={`text-sm font-black tracking-tight ${INK}`}>
              What an AI band score cannot do
            </h3>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {LIMITS.map((limit) => (
                <li key={limit} className="flex items-start gap-2.5">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6256ef] dark:bg-violet-400"
                    aria-hidden
                  />
                  <p className={`text-[13px] leading-6 ${MUTED}`}>{limit}</p>
                </li>
              ))}
            </ul>
          </div>
        </m.div>
      </div>
    </SoftSection>
  );
}
