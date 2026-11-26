import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PANEL } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import { pricingFaqs } from '../config/pricingFaqs';

export default function FAQSection({ plans }) {
  const faqs = pricingFaqs(plans);
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
