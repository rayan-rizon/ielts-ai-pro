import {
  LayoutGrid,
  Sparkles,
  BookOpen,
  PenTool,
  Headphones,
  Mic,
  BarChart3,
  CreditCard,
  Library,
  Brain,
  Trophy,
  Users,
  LayoutDashboard,
  ClipboardList,
  Cpu,
  Crown,
  Bell,
  Settings,
  TrendingUp,
  Wallet,
  GraduationCap,
  Gift,
} from 'lucide-react';
import { createPageUrl } from '@/utils';

export const userNavigationItems = [
  { title: 'Dashboard', url: createPageUrl('Dashboard'), icon: LayoutGrid },
  { title: 'AI Learning Path', url: createPageUrl('LearningPath'), icon: Sparkles },
  { title: 'Reading Tests', url: createPageUrl('Reading'), icon: BookOpen },
  { title: 'Writing Practice', url: createPageUrl('Writing'), icon: PenTool },
  { title: 'Listening Tests', url: createPageUrl('Listening'), icon: Headphones },
  { title: 'Speaking Practice', url: createPageUrl('Speaking'), icon: Mic },
  { title: 'Analytics', url: createPageUrl('Analytics'), icon: BarChart3 },
  { title: 'Pricing', url: createPageUrl('Pricing'), icon: CreditCard },
];

export const learningToolsItems = [
  { title: 'Resources', url: createPageUrl('Resources'), icon: Library },
  { title: 'Vocabulary', url: createPageUrl('Vocabulary'), icon: Brain },
  { title: 'Leaderboards', url: createPageUrl('Leaderboard'), icon: Trophy },
  { title: 'Study Groups', url: createPageUrl('StudyGroups'), icon: Users },
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
  { title: 'Promo Codes', url: createPageUrl('AdminPanel') + '?tab=promo', icon: Crown },
  { title: 'Referrals', url: createPageUrl('AdminPanel') + '?tab=referrals', icon: Gift },
  { title: 'Payments', url: createPageUrl('AdminPanel') + '?tab=payments', icon: CreditCard },
  { title: 'Notifications', url: createPageUrl('AdminPanel') + '?tab=notifications', icon: Bell },
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
