import { PRACTICE_LIBRARY_ENABLED, SKILL_LAB_ENABLED } from '@/features/skill-lab/skills';
const libraryPractice = PRACTICE_LIBRARY_ENABLED;
export const DEFAULT_PRICING_PLANS = [
  {
    name: 'Free',
    basePrice: 0,
    description: 'Start practising IELTS and see how you are improving.',
    features: [
      'Reading & Listening Practice',
      ...(SKILL_LAB_ENABLED
        ? [libraryPractice ? '2 Library Practice Sets/Day' : '2 Basic Practice Lab Lessons/Day']
        : []),
      'Cambridge Reading & Listening Tests',
      '0 AI Speaking Sessions/month',
      '1 AI Writing Evaluation/month',
      '100 Saved Vocabulary Words',
      '5 Vocabulary Starter Kits',
      'Grammar Units 1–3 + 5 Questions/Day',
      'Basic 30-Day Progress Analytics',
    ],
    limitations: ['Advanced Weakness & Readiness Analytics', 'AI Study Plan Made for You'],
    buttonText: 'Current Plan',
    tier: 'free',
    color: 'slate',
  },
  {
    name: 'Pro',
    basePrice: 9.99,
    description: 'Get more AI help and a study plan that fits your needs.',
    features: [
      'Everything in Free',
      ...(SKILL_LAB_ENABLED
        ? libraryPractice
          ? ['10 Library Practice Sets/Day', 'Personalised AI Explanations']
          : ['10 Practice Lab Lessons/Day', 'Practice Lab AI Help & Short Speaking Feedback']
        : []),
      '100 AI Writing Evaluations/month',
      '50 AI Speaking Sessions/month',
      '300 Saved Vocabulary Words',
      'All Grammar Guides + Unlimited Practice',
      'All Skill Kits + Band 7',
      'Advanced Weakness & Readiness Analytics',
      'AI Study Plan Made for You',
    ],
    limitations: [],
    buttonText: 'Upgrade to Pro',
    popular: true,
    tier: 'pro',
    color: 'indigo',
    oldPrice: 15,
  },
  {
    name: 'Premium',
    basePrice: 15.99,
    oldPrice: 25,
    description: 'More AI practice and support for every part of your IELTS prep.',
    features: [
      'Everything in Pro',
      ...(SKILL_LAB_ENABLED
        ? [libraryPractice ? '20 Library Practice Sets/Day' : '20 Practice Lab Lessons/Day']
        : []),
      '200 AI Writing Evaluations/month',
      '100 AI Speaking Sessions/month',
      'Unlimited Saved Vocabulary Words',
      'All Topic Kits + Band 8 & 9',
      'Study Plan Updates as You Improve',
      'Detailed Writing & Speaking Feedback',
    ],
    limitations: [],
    buttonText: 'Get Premium',
    tier: 'premium',
    color: 'violet',
  },
];
