import React, { useState } from 'react';
import { m } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';

function FaqAccordionItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-slate-200/70 dark:border-slate-800 last:border-0 py-4.5 transition-colors">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none"
      >
        <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {question}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
            isOpen
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rotate-180'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 pr-8 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

const FAQS_DATA = [
  {
    question: 'How quickly does customer support respond to inquiries?',
    answer:
      'Our support desk responds to all candidate inquiries within 12 hours. Priority email support is offered for subscribers on Pro and Premium plans.',
  },
  {
    question: 'How accurate is the IELTS AI scoring engine?',
    answer:
      'Our evaluation models are trained strictly on official Cambridge IELTS Band Descriptors for Writing Task 1, Task 2, and Speaking Parts 1-3, achieving a 98.4% score alignment verified by human examiners.',
  },
  {
    question: 'Can I request a refund if I am not satisfied?',
    answer:
      'Yes, we provide a 7-day money-back guarantee on initial subscription upgrades if our practice platform does not meet your expectations.',
  },
  {
    question: 'Are free IELTS practice tests available on the platform?',
    answer:
      'Yes! Registering a free account gives you access to practice modules, daily questions, sample essays, and capped AI evaluations without needing a credit card.',
  },
  {
    question: 'Does IELTS AI Pro support both Academic and General Training modules?',
    answer:
      'Full support is built in for both Academic (Task 1 charts/diagrams & Task 2 essays) and General Training (Task 1 letters & Task 2 essays) along with full Speaking, Reading, and Listening modules.',
  },
];

export default function ContactFaqs() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 px-6 relative border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#070912]/40">
      <m.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Quick answers regarding IELTS AI Pro features, scoring precision, and platform access.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 md:p-8 shadow-sm backdrop-blur-md">
          {FAQS_DATA.map((faq, index) => (
            <FaqAccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openFaqIndex === index}
              onClick={() => toggleFaq(index)}
            />
          ))}
        </div>
      </m.div>
    </section>
  );
}
