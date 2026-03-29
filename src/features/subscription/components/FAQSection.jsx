import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, absolutely. You can cancel your subscription at any time from your account settings. You will continue to have access to your plan until the end of your current billing period.',
  },
  {
    question: 'How accurate is the AI grading?',
    answer:
      'Our AI is trained on thousands of official IELTS exams and is calibrated to score within 0.5 bands of official examiners. It provides detailed feedback on grammar, vocabulary, coherence, and task response.',
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
];

export default function FAQSection() {
  return (
    <section className="max-w-4xl mx-auto mb-32">
      <div className="flex items-center gap-3 mb-10 justify-center">
        <HelpCircle className="w-6 h-6 text-indigo-500" />
        <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
      </div>
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 p-6 sm:p-8 md:p-10 shadow-xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b-slate-200/60 dark:border-white/5 last:border-0"
            >
              <AccordionTrigger className="text-left font-bold text-lg py-6 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed pb-6 text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10 text-center">
          <p className="text-slate-500 font-medium">
            Still have questions?{' '}
            <a
              href="mailto:support@ieltsai.pro"
              className="text-indigo-600 font-bold hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
