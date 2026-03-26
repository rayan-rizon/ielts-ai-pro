import React from 'react';
import { BookOpen, Headphones, PenTool, Mic } from 'lucide-react';
import ReadingTestEditor from './ReadingTestEditor';
import ListeningTestEditor from './ListeningTestEditor';
import WritingTestEditor from './WritingTestEditor';
import SpeakingTestEditor from './SpeakingTestEditor';
import GenericTestCreator from './GenericTestCreator';

const THEMES = {
  reading: {
    key: 'reading',
    label: 'Reading Module',
    color: 'blue',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    light: 'bg-blue-50 dark:bg-blue-950/40',
    lighter: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900',
    borderStrong: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    textLight: 'text-blue-600/80 dark:text-blue-400/80',
    icon: BookOpen,
    gradient: 'from-blue-500 to-indigo-500',
    gradientLight: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
    shadow: 'shadow-blue-500/20',
    ring: 'ring-blue-500/20',
  },
  listening: {
    key: 'listening',
    label: 'Listening Module',
    color: 'violet',
    primary: 'bg-violet-600',
    primaryHover: 'hover:bg-violet-700',
    light: 'bg-violet-50 dark:bg-violet-950/40',
    lighter: 'bg-violet-50/50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-900',
    borderStrong: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-700 dark:text-violet-300',
    textLight: 'text-violet-600/80 dark:text-violet-400/80',
    icon: Headphones,
    gradient: 'from-violet-500 to-purple-500',
    gradientLight: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
    shadow: 'shadow-violet-500/20',
    ring: 'ring-violet-500/20',
  },
  writing: {
    key: 'writing',
    label: 'Writing Module',
    color: 'orange',
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    light: 'bg-orange-50 dark:bg-orange-950/40',
    lighter: 'bg-orange-50/50 dark:bg-orange-950/20',
    border: 'border-orange-100 dark:border-orange-900',
    borderStrong: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    textLight: 'text-orange-600/80 dark:text-orange-400/80',
    icon: PenTool,
    gradient: 'from-orange-500 to-red-500',
    gradientLight: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
    shadow: 'shadow-orange-500/20',
    ring: 'ring-orange-500/20',
  },
  speaking: {
    key: 'speaking',
    label: 'Speaking Module',
    color: 'rose',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    light: 'bg-rose-50 dark:bg-rose-950/40',
    lighter: 'bg-rose-50/50 dark:bg-rose-950/20',
    border: 'border-rose-100 dark:border-rose-900',
    borderStrong: 'border-rose-200 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    textLight: 'text-rose-600/80 dark:text-rose-400/80',
    icon: Mic,
    gradient: 'from-rose-500 to-pink-500',
    gradientLight: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
    shadow: 'shadow-rose-500/20',
    ring: 'ring-rose-500/20',
  },
};

const TestCreator = ({ initialData, onSave, onCancel, testType }) => {
  const type = initialData?.test_type || testType || 'reading';
  const theme = THEMES[type] || THEMES.reading;

  const commonProps = {
    initialData,
    onSave,
    onCancel,
    theme, // Inject theme
  };

  if (type === 'reading') return <ReadingTestEditor {...commonProps} data-oid="p8hkf2u" />;
  if (type === 'listening') return <ListeningTestEditor {...commonProps} data-oid="h4cf284" />;
  if (type === 'writing') return <WritingTestEditor {...commonProps} data-oid="tk9sqt." />;
  if (type === 'speaking') return <SpeakingTestEditor {...commonProps} data-oid="5m77m-x" />;

  return <GenericTestCreator {...commonProps} testType={type} data-oid="2g.46j3" />;
};

export default TestCreator;
