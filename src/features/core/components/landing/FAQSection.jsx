import React, { memo } from 'react';
import { m } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

function FAQSection({ faqs, viewport }) {
  return (
    <section
      id="faq"
      className="scroll-mt-24 py-8 md:py-12 relative overflow-hidden bg-background"
      data-oid="_3z_paz"
    >
      <div className="mx-auto max-w-3xl px-6" data-oid="f03zlwo">
        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="mb-10 text-center"
          data-oid="7_qn-lf"
        >
          <Badge
            variant="secondary"
            className="rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground border-primary/20 dark:border-primary/30 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest mb-4"
            data-oid="duol0pg"
          >
            FAQ
          </Badge>
          <m.h2 variants={itemVariants} className="heading-lg" data-oid="uv9i7d0">
            Frequently Asked{' '}
            <span className="text-gradient-primary" data-oid="c4rdhlo">
              Questions
            </span>
          </m.h2>
        </m.div>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={containerVariants}
          className="space-y-3"
          data-oid="ptxr19f"
        >
          {faqs.map((faq, idx) => (
            <m.div key={idx} variants={itemVariants} data-oid="s8xw7vg">
              <Accordion type="single" collapsible className="w-full" data-oid="j369p:y">
                <AccordionItem
                  value={`item-${idx}`}
                  className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-xl px-5 rounded-2xl overflow-hidden shadow-sm"
                  data-oid="hevmppg"
                >
                  <AccordionTrigger
                    className="text-base font-bold tracking-tight text-foreground hover:no-underline py-4"
                    data-oid="-:t76ho"
                  >
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-sm font-medium text-muted-foreground/80 pb-4 leading-relaxed"
                    data-oid="3u1i4hd"
                  >
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}

export default memo(FAQSection);
