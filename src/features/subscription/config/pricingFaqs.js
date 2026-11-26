// The pricing page questions. Free allowances are read from the live plan lines,
// so an admin changing a limit changes the answer with it.
import { EXAM_PASS_DISCOUNT_PERCENT, EXAM_PASS_MONTHS } from '@/lib/pricingUtils';

const freeLines = (plans) => plans?.find((plan) => plan.tier === 'free')?.features || [];

const firstCount = (lines, pattern) => {
  const found = lines.map((line) => pattern.exec(line)).find(Boolean);
  return found ? Number(found[1]) : null;
};

function testsAnswer(lines) {
  if (lines.includes('Unlimited Reading tests') && lines.includes('Unlimited Listening tests')) {
    return 'Yes. A free account currently includes unlimited Reading and Listening tests.';
  }
  const reading = firstCount(lines, /^(\d+) free Reading tests?$/);
  const listening = firstCount(lines, /^(\d+) free Listening tests?$/);
  const allowance =
    reading === null || listening === null
      ? 'A free account includes a limited number of Reading and Listening tests, and the library shows how many you have left.'
      : `A free account can start ${reading} Reading and ${listening} Listening tests in total, chosen from the newest free tests. Resuming a test does not use one.`;
  return `Not all of them. ${allowance} Pro and Premium give unlimited Reading and Listening tests.`;
}

function feedbackAnswer(lines) {
  const writing = firstCount(lines, /^(\d+) AI Writing Evaluations?\/month$/);
  if (!writing) return 'AI evaluation of Writing and Speaking needs Pro or Premium.';
  const included = `Free includes ${writing} AI Writing evaluation${writing === 1 ? '' : 's'}`;
  const speaking = firstCount(lines, /^(\d+) AI Speaking Sessions?\/month$/);
  return speaking
    ? `${included} and ${speaking} AI Speaking session${speaking === 1 ? '' : 's'} a month. Pro and Premium include many more.`
    : `${included} a month. AI Speaking sessions, and more Writing evaluations, need Pro or Premium.`;
}

export function pricingFaqs(plans) {
  const lines = freeLines(plans);
  return [
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
    { question: 'Are the Cambridge IELTS tests free?', answer: testsAnswer(lines) },
    { question: 'Do I need a subscription for AI feedback?', answer: feedbackAnswer(lines) },
  ];
}
