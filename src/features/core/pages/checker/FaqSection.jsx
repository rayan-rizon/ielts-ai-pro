import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQS } from './checkerConstants';

export default function FaqSection() {
  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div>
          <span className="text-xs font-black uppercase tracking-[.2em] text-indigo-600 dark:text-indigo-400">
            Frequently asked questions
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Before you check your IELTS writing
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            Clear answers about the Academic-only format, free reports, task context, and estimated
            band scores.
          </p>
          <a
            href="#checker"
            className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
          >
            Analyze my writing free <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`faq-${index}`}
              className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
            >
              <AccordionTrigger className="text-left text-sm font-extrabold text-slate-900 dark:text-slate-100 hover:no-underline sm:text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-slate-600 dark:text-slate-400">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
