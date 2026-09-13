import { createPageUrl } from '@/utils';
import { hasPaidAccess } from '@/features/subscription/config/contentAccess';

export function buildProductTourSteps(user) {
  const canOpenLearningPath = hasPaidAccess(user);
  return [
    {
      id: 'dashboard-stats',
      route: createPageUrl('Dashboard'),
      section: 'Dashboard · 1 of 3',
      target: '[data-tour="dashboard-stats"]',
      title: 'Your progress at a glance',
      body: 'Track your current band score, target gap, completed practice, study time, and exam countdown.',
    },
    {
      id: 'dashboard-skills',
      route: createPageUrl('Dashboard'),
      section: 'Dashboard · 2 of 3',
      target: '[data-tour="skill-launcher"]',
      title: 'Choose a skill and set your baseline',
      body: 'Practice Reading, Listening, Writing, or Speaking. Your first test sets your baseline band score.',
    },
    {
      id: 'dashboard-next',
      route: createPageUrl('Dashboard'),
      section: 'Dashboard · 3 of 3',
      target: '[data-tour="dashboard-next-up"]',
      title: 'Know what to practise next',
      body: 'Focus on high-impact practice recommendations tailored directly to your latest test results.',
    },
    {
      id: 'grammar-lab',
      route: createPageUrl('Grammar'),
      section: 'Learning tools',
      target: '[data-tour="grammar-lab"]',
      title: 'Grammar Lab',
      body: 'Master essential IELTS grammatical structures with targeted lessons and interactive drills.',
    },
    {
      id: 'practice-lab',
      route: createPageUrl('SkillLab'),
      section: 'Learning tools',
      target: '[data-tour="practice-lab"]',
      title: 'Practice Lab',
      body: 'Target specific question types and turn your weaker exam areas into scoring strengths.',
    },
    {
      id: 'analytics',
      route: createPageUrl('Analytics'),
      section: 'Analytics',
      target: '[data-tour="analytics"]',
      title: 'Analytics',
      body: 'Track score trends, skill breakdowns, and exact progress toward your target band score.',
    },
    {
      id: 'learning-path',
      route: canOpenLearningPath ? createPageUrl('LearningPath') : createPageUrl('Upgrade'),
      section: 'AI Learning Path',
      target: '[data-tour="learning-path"]',
      title: canOpenLearningPath
        ? 'Follow one adaptive study plan'
        : 'Preview your AI Learning Path',
      body: canOpenLearningPath
        ? 'Follow personalized study tasks adapted to your exam date, band goal, and score trends.'
        : 'Preview how Pro creates an adaptive weekly study plan matched to your target exam date.',
    },
  ];
}
