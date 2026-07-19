import { BarChart3, ShieldCheck, Sparkles, Target } from 'lucide-react';

export const DRAFT_STORAGE_KEY = 'public-writing-checker-draft-v2';
export const CHECKER_PATH = '/ielts-writing-checker';

export const TASKS = {
  'Task 1': {
    label: 'Task 1',
    shortLabel: 'Task 1 report',
    minimum: 150,
    feedbackMinimum: 50,
    prompt:
      'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  },
  'Task 2': {
    label: 'Task 2',
    shortLabel: 'Task 2 essay',
    minimum: 250,
    feedbackMinimum: 100,
    prompt:
      'Some people think governments should spend more money on public transport, while others believe improving roads is more important. Discuss both views and give your own opinion.',
  },
};

export const DEMO_ESSAYS = {
  'Task 2': `Investment in transport infrastructure is essential for modern cities, but people disagree about whether public transport or roads should receive priority. Although roads remain necessary for many journeys, I believe governments should direct more funding towards reliable public transport.

Those who support road investment argue that private vehicles offer flexibility. Roads connect homes, workplaces and rural communities that may not be served by trains or buses. They are also necessary for emergency services and the delivery of goods. If roads are badly maintained, congestion can increase and businesses may face higher transport costs. For these reasons, governments cannot ignore the quality and safety of road networks.

However, improving public transport can solve several problems at the same time. Frequent buses and trains allow more people to travel using less space, which can reduce traffic congestion in crowded cities. Public transport can also make employment and education more accessible to people who cannot afford a car. In addition, electric trains and buses can lower emissions when they replace large numbers of individual car journeys. A dependable network therefore benefits both the economy and the environment.

In my view, governments should maintain existing roads while giving new investment priority to public transport, especially in densely populated areas. This balanced approach preserves essential road access but encourages commuters to choose a more efficient alternative.

In conclusion, roads are indispensable for flexible and last-mile travel, yet high-quality public transport produces wider long-term benefits. Public money should therefore focus on expanding affordable and reliable transport networks while keeping essential roads safe.`,
  'Task 1': `The three pie charts compare the proportions of sodium, saturated fat and added sugar contained in four meals in the United States.

Overall, dinner accounts for the largest shares of sodium and saturated fat, whereas snacks contain by far the greatest proportion of added sugar. Breakfast makes the smallest or joint-smallest contribution to all three nutrients.

Regarding sodium, dinner represents 43% of the total, followed by lunch at 29%. Breakfast and snacks each account for 14%. A similar pattern can be seen for saturated fat. Dinner is again the largest source, at 37%, while lunch contributes 26%. Snacks make up 21%, leaving breakfast with the lowest figure of 16%.

The distribution of added sugar is noticeably different. Snacks are responsible for 42%, almost twice the proportion recorded for dinner, at 23%. Lunch and breakfast contribute comparatively modest shares of 19% and 16% respectively.

In summary, the evening meal is the main source of sodium and saturated fat in the typical diet shown, while snacking is the principal source of added sugar.`,
};

export const FAQS = [
  {
    question: 'Is this an Academic IELTS writing checker?',
    answer:
      'Yes. This checker is designed only for Academic IELTS Writing Task 1 and Task 2. For Task 1, you add the original chart, graph, map or diagram when requesting analysis.',
  },
  {
    question: 'Is the IELTS writing checker free?',
    answer:
      'Yes. Your first three Academic IELTS writing feedback reports are free. A report is only used when you choose to analyse a response.',
  },
  {
    question: 'What feedback will I receive?',
    answer:
      'You receive an estimated overall band and criterion-level feedback for Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy, plus strengths and practical next steps.',
  },
  {
    question: 'How accurate is the estimated IELTS band score?',
    answer:
      'The report is an AI-assisted practice estimate based on the writing you submit and the task prompt. It is designed to support practice and is not an official IELTS result or a replacement for a qualified examiner.',
  },
  {
    question: 'Why is the original Task 2 question needed?',
    answer:
      'Task Response measures how completely and relevantly you answer the exact question. The checker asks for those instructions only when they are needed for an accurate personalised report.',
  },
  {
    question: 'Why is my Academic Task 1 image needed?',
    answer:
      'Task Achievement depends on accurately selecting, comparing and reporting the main features of the exact chart, graph, table, map or process. Your visual is requested only when you analyse Task 1.',
  },
];

export const ANALYSIS_STAGES = [
  { id: 'preparing', label: 'Preparing your response' },
  { id: 'criteria', label: 'Checking IELTS criteria' },
  { id: 'feedback', label: 'Writing your feedback' },
];

export const getSampleCriteria = (taskType) => [
  [
    taskType === 'Task 1' ? 'Task Achievement' : 'Task Response',
    '7.0',
    taskType === 'Task 1'
      ? 'Selects and reports main features with clear comparisons.'
      : 'Addresses the prompt with a clear position and key ideas.',
  ],
  ['Coherence & Cohesion', '6.5', 'Organises ideas logically with clear paragraphing.'],
  ['Lexical Resource', '7.0', 'Uses a range of vocabulary with flexibility.'],
  ['Grammatical Range & Accuracy', '6.5', 'Uses a mix of structures with clear communication.'],
];

/** Shared criterion detail map used in DemoResultPanel for both real and demo reports. */
export const CRITERION_DETAILS = {
  'Task Achievement': {
    icon: Target,
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    barColor: 'from-rose-500 to-pink-500',
  },
  'Task Response': {
    icon: Target,
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    barColor: 'from-rose-500 to-pink-500',
  },
  'Coherence & Cohesion': {
    icon: BarChart3,
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    barColor: 'from-indigo-500 to-violet-500',
  },
  'Lexical Resource': {
    icon: Sparkles,
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    barColor: 'from-violet-500 to-purple-500',
  },
  'Grammatical Range & Accuracy': {
    icon: ShieldCheck,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    barColor: 'from-emerald-500 to-teal-500',
  },
};

const DEFAULT_CRITERION_DETAIL = {
  icon: Target,
  bgColor: 'bg-indigo-50',
  iconColor: 'text-indigo-600',
  barColor: 'from-indigo-500 to-violet-500',
};

/** Get criterion detail with fallback. */
export function getCriterionDetail(label) {
  return CRITERION_DETAILS[label] || DEFAULT_CRITERION_DETAIL;
}
