import { BookOpen, Headphones, Mic, PenTool } from 'lucide-react';
import { createPageUrl } from '@/utils';

export const MODULE_META = [
  {
    key: 'reading',
    title: 'Reading',
    icon: BookOpen,
    href: createPageUrl('Reading'),
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    key: 'writing',
    title: 'Writing',
    icon: PenTool,
    href: createPageUrl('Writing'),
    gradient: 'from-indigo-600 to-purple-600',
  },
  {
    key: 'listening',
    title: 'Listening',
    icon: Headphones,
    href: createPageUrl('Listening'),
    gradient: 'from-violet-600 to-fuchsia-600',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    icon: Mic,
    href: createPageUrl('Speaking'),
    gradient: 'from-emerald-600 to-teal-600',
  },
];

export const PIE_COLORS = [
  'hsl(var(--primary))',
  '#10B981',
  '#8B5CF6',
  '#06B6D4',
  '#F59E0B',
  '#EF4444',
];

export const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};
