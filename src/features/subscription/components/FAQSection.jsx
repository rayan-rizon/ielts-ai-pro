import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { IconChip, MICRO, PANEL } from '@/features/dashboard/components/primitives';
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
    question: 'How do daily Practice Lab limits work?',
    answer:
      'Full Cambridge IELTS practice tests are always 100% free and unlimited for all learners. Daily limits only apply to Practice Lab AI tests, which provide targeted question sets and AI diagnostic feedback. Free accounts include 2 Practice Lab AI tests/day, Pro includes 10/day with personalised AI explanations, and Premium includes 20/day. Limits reset at 00:00 UTC, and previously completed tests and feedback remain free to revisit anytime.',
  },
];

export default function FAQSection() {
  return (
    <section className="mx-auto mb-16 max-w-3xl">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <p
          className={cn(MICRO, 'inline-flex items-center gap-2 text-slate-500 dark:text-slate-400')}
        >
          <IconChip icon={HelpCircle} size="sm" />
          Before you choose
        </p>
        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-slate-900 dark:text-white sm:text-[28px]">
          Frequently asked <span className="text-[#5a63df] dark:text-[#a9afff]">questions</span>
        </h2>
      </div>
      <div className={cn(PANEL, 'p-5 sm:p-7')}>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b-[#eeedf7] last:border-0 dark:border-b-white/[0.07]"
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
        <div className="mt-6 text-center">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Still have questions?{' '}
            <a
              href="mailto:support@ieltsai.pro"
              className="font-bold text-[#5a63df] hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
