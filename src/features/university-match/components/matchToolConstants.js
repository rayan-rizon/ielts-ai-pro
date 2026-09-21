import Headphones from 'lucide-react/icons/headphones';
import BookOpen from 'lucide-react/icons/book-open';
import PenLine from 'lucide-react/icons/pen-line';
import Mic from 'lucide-react/icons/mic';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import AlertCircle from 'lucide-react/icons/alert-circle';
import TriangleAlert from 'lucide-react/icons/triangle-alert';

export const SKILLS = [
  { key: 'listening', name: 'Listening', icon: Headphones, tone: 'sky' },
  { key: 'reading', name: 'Reading', icon: BookOpen, tone: 'emerald' },
  { key: 'writing', name: 'Writing', icon: PenLine, tone: 'amber' },
  { key: 'speaking', name: 'Speaking', icon: Mic, tone: 'accent' },
];

export const LEVELS = [
  { key: 'undergraduate', label: 'Undergraduate', short: 'UG' },
  { key: 'postgraduate', label: 'Postgraduate', short: 'PG' },
];

/*
 * Starting points for the learner's own four bands. The heading above them is
 * what says whose scores these are; the descriptions stay course-oriented
 * because that is the context a student recognises their own result by.
 *
 * The 8.0 row matters: stopping at 7.5 implied a ceiling, when the sliders run
 * to 9.0 and plenty of applicants score above it.
 */
export const SCORE_PRESETS = [
  {
    label: '6.0 Baseline',
    desc: 'Foundation & Pathways',
    scores: { listening: 6.0, reading: 6.0, writing: 5.5, speaking: 6.0 },
  },
  {
    label: '6.5 Standard',
    desc: 'Most UK Taught Degrees',
    scores: { listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.5 },
  },
  {
    label: '7.0 High',
    desc: 'Competitive Courses',
    scores: { listening: 7.0, reading: 7.0, writing: 6.5, speaking: 7.0 },
  },
  {
    label: '7.5 Advanced',
    desc: 'Medicine, Law, Oxford',
    scores: { listening: 7.5, reading: 7.5, writing: 7.0, speaking: 7.5 },
  },
  {
    label: '8.0+ Expert',
    desc: 'Clears almost every requirement',
    // Same shape as the rows above — three skills at the headline band and
    // Writing half a band under — so the label matches the overall it produces.
    scores: { listening: 8.0, reading: 8.0, writing: 7.5, speaking: 8.0 },
    wide: true,
  },
];

export const OUTCOME_META = {
  safe: {
    label: 'Comfortably Clears',
    tone: 'ok',
    badgeText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    icon: CheckCircle2,
  },
  match: {
    label: 'Meets Requirement',
    tone: 'ok',
    badgeText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    icon: CheckCircle2,
  },
  reach: {
    label: 'Score Shortfall',
    tone: 'warn',
    badgeText: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    icon: AlertCircle,
  },
  unlikely: {
    label: 'Well Short',
    tone: 'fault',
    badgeText: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
    icon: TriangleAlert,
  },
  unknown: {
    label: 'Not Published',
    tone: 'neutral',
    badgeText: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
    icon: AlertCircle,
  },
  'not-accepted': {
    label: 'IELTS Not Accepted',
    tone: 'neutral',
    badgeText: 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/20',
    icon: AlertCircle,
  },
};

export function formatBand(band) {
  return typeof band === 'number' ? band.toFixed(1) : '—';
}

export function sliderFill(value, min, max) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #5a63df 0%, #5a63df ${pct}%, var(--calc-track, #e4e2f0) ${pct}%)`,
  };
}
