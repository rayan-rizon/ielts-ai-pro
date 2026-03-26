import { BookOpen, PenTool, Headphones, Mic, Sparkles, Award } from 'lucide-react';

/**
 * Module configuration for IELTS skills
 * Used across Learning Path, Dashboard, and Analytics
 */
export const moduleConfig = {
  reading: {
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    gradient: 'from-blue-600/20 to-cyan-500/20',
  },
  writing: {
    icon: PenTool,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    gradient: 'from-orange-600/20 to-amber-500/20',
  },
  listening: {
    icon: Headphones,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    gradient: 'from-purple-600/20 to-pink-500/20',
  },
  speaking: {
    icon: Mic,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    gradient: 'from-rose-600/20 to-rose-400/20',
  },
  vocabulary: {
    icon: Sparkles,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    gradient: 'from-emerald-600/20 to-teal-500/20',
  },
  grammar: {
    icon: Award,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    gradient: 'from-amber-600/20 to-yellow-500/20',
  },
};

export default moduleConfig;
