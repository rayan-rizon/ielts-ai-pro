import {
  LayoutGrid,
  Sparkles,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  CreditCard,
  Library,
  Brain,
  Trophy,
  Users,
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Crown,
  Megaphone,
  Settings,
  TrendingUp,
  Wallet,
  Gift,
  FlaskConical,
  Target,
  Lightbulb,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { ReiconChart } from '@/components/icons/ReiconChart';
import { ReiconTarget } from '@/components/icons/ReiconTarget';

export const userNavigationItems = [
  { title: 'Dashboard', url: createPageUrl('Dashboard'), icon: LayoutGrid },
  {
    title: 'AI Learning Path',
    url: createPageUrl('LearningPath'),
    icon: Sparkles,
    tourKey: 'learning-path',
  },
  { title: 'Reading Tests', url: createPageUrl('Reading'), icon: BookOpen },
  { title: 'Writing Practice', url: createPageUrl('Writing'), icon: PenTool },
  { title: 'Listening Tests', url: createPageUrl('Listening'), icon: Headphones },
  { title: 'Speaking Practice', url: createPageUrl('Speaking'), icon: Mic },
  {
    title: 'Analytics',
    url: createPageUrl('Analytics'),
    icon: ReiconChart,
    tourKey: 'analytics',
  },
  { title: 'Pricing', url: createPageUrl('Pricing'), icon: CreditCard },
];

export const learningToolsItems = [
  {
    title: 'Grammar Lab',
    url: createPageUrl('Grammar'),
    icon: FlaskConical,
    tourKey: 'grammar-lab',
  },
  {
    title: 'Practice Lab',
    url: createPageUrl('SkillLab'),
    icon: ReiconTarget,
    tourKey: 'practice-lab',
  },
  { title: 'Resources', url: createPageUrl('Resources'), icon: Library },
  { title: 'Vocabulary', url: createPageUrl('Vocabulary'), icon: Brain },
  { title: 'Leaderboards', url: createPageUrl('Leaderboard'), icon: Trophy },
];

export const adminNavigationItems = [
  { title: 'Overview', url: createPageUrl('AdminPanel'), icon: LayoutDashboard },
  {
    title: 'Test Management',
    url: createPageUrl('AdminPanel') + '?tab=tests',
    icon: ClipboardList,
  },
  { title: 'Resources', url: createPageUrl('AdminPanel') + '?tab=resources', icon: Library },
  { title: 'User Management', url: createPageUrl('AdminPanel') + '?tab=users', icon: Users },
  { title: 'AI Usage', url: createPageUrl('AdminPanel') + '?tab=ai-usage', icon: Cpu },
  {
    title: 'Feature Requests',
    url: createPageUrl('AdminPanel') + '?tab=feature-requests',
    icon: Lightbulb,
  },
  { title: 'Promo Codes', url: createPageUrl('AdminPanel') + '?tab=promo', icon: Crown },
  { title: 'Referrals', url: createPageUrl('AdminPanel') + '?tab=referrals', icon: Gift },
  { title: 'Marketing', url: createPageUrl('AdminPanel') + '?tab=marketing', icon: Target },
  { title: 'Payments', url: createPageUrl('AdminPanel') + '?tab=payments', icon: CreditCard },
  {
    title: 'Communications',
    url: createPageUrl('AdminPanel') + '?tab=notifications',
    icon: Megaphone,
  },
  { title: 'Settings', url: createPageUrl('AdminPanel') + '?tab=settings', icon: Settings },
];

export const analyticsNavigationItems = [
  {
    title: 'User Analytics',
    url: createPageUrl('AdminPanel') + '?tab=user-analytics',
    icon: TrendingUp,
  },
  {
    title: 'Revenue Analytics',
    url: createPageUrl('AdminPanel') + '?tab=revenue-analytics',
    icon: Wallet,
  },
];
