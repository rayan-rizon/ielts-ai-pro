import React, { memo } from 'react';
import { m } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SectionHeading, SoftSection } from './LandingSection';

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
    <SoftSection id="faq" className="scroll-mt-24" data-oid="_3z_paz">
      <div className="mx-auto max-w-3xl px-6" data-oid="f03zlwo">
        <SectionHeading
          eyebrow="Questions, answered"
          title="Everything you need to"
          script="start confidently."
          description="Clear answers about the platform, feedback, and your IELTS preparation."
          viewport={viewport}
          className="mb-12"
        />

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
                  className="overflow-hidden rounded-[20px] border border-white/90 bg-white/[0.74] px-6 shadow-[0_18px_45px_-34px_rgba(31,52,106,.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[.055]"
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
    </SoftSection>
  );
}

export default memo(FAQSection);
