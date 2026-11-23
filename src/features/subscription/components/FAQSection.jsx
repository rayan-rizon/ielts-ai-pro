import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import { EXAM_PASS_DISCOUNT_PERCENT, EXAM_PASS_MONTHS } from '@/lib/pricingUtils';

const faqs = [
  {
    question: `What is the ${EXAM_PASS_MONTHS}-Month Exam Pass?`,
    answer: `One payment covers ${EXAM_PASS_MONTHS} months of Pro or Premium at ${EXAM_PASS_DISCOUNT_PERCENT}% less than paying monthly. It never renews — your access simply ends after ${EXAM_PASS_MONTHS} months, so there is nothing to cancel.`,
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, absolutely. You can cancel your subscription at any time from your account settings. You will continue to have access to your plan until the end of your current billing period.',
  },
  {
    question: 'How accurate is the AI grading?',
    answer:
      'The score is an AI-assisted practice estimate based on the public IELTS assessment criteria. It provides feedback on task achievement or response, coherence and cohesion, lexical resource, and grammatical range and accuracy. It is not an official IELTS result or a replacement for a qualified examiner.',
  },
  {
    question: 'Are the Cambridge IELTS tests free?',
    answer:
      'Yes! All Cambridge IELTS Reading and Listening practice tests are now completely free for all users.',
  },
  {
    question: 'Do I need a subscription for AI feedback?',
    answer:
      'While the tests are free, a Pro or Premium subscription is required for deep AI evaluations of your Writing and Speaking sessions.',
  },
  {
    question: 'How many Practice Lab sets can I do?',
    answer:
      'Free accounts can start 2 Practice Lab sets per day. The daily allowance resets at 00:00 UTC. Pro and Premium include unlimited Practice Lab sets. All learners can return to saved sets at any time.',
  },
];

export default function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl pt-8">
      <h2 className="mb-4 text-center text-2xl font-extrabold tracking-[-0.02em] text-slate-900 dark:text-white">
        Frequently asked questions
      </h2>
      <div className={cn(PANEL, 'px-5 py-3 sm:px-7')}>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b-[#eeedf7] dark:border-b-white/[0.07] last:border-b-0"
            >
              <AccordionTrigger className="text-left text-sm font-bold text-slate-800 transition-colors hover:text-[#5a63df] dark:text-slate-100 dark:hover:text-[#a9afff] sm:text-base">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
