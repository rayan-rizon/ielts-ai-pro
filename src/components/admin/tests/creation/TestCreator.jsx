import React from 'react';
import { BookOpen, Headphones, PenTool, Mic } from 'lucide-react';
import ReadingTestEditor from './ReadingTestEditor';
import ListeningTestEditor from './ListeningTestEditor';
import WritingTestEditor from './WritingTestEditor';
import SpeakingTestEditor from './SpeakingTestEditor';
import GenericTestCreator from './GenericTestCreator';

/**
 * All four modules share one graphite/stone instrument-panel theme — the
 * admin panel deliberately doesn't color-code by module (see TestTable),
 * so module identity is carried by the icon + label only, not by hue.
 */
const BASE_THEME = {
  primary: 'bg-stone-900 dark:bg-stone-50',
  primaryHover: 'hover:bg-stone-700 dark:hover:bg-stone-200',
  light: 'bg-stone-100 dark:bg-white/4',
  lighter: 'bg-stone-50 dark:bg-white/2',
  border: 'border-stone-200/80 dark:border-white/[0.07]',
  borderStrong: 'border-stone-300 dark:border-white/12',
  text: 'text-stone-700 dark:text-stone-200',
  textLight: 'text-stone-500 dark:text-stone-400',
};

const THEMES = {
  reading: { ...BASE_THEME, key: 'reading', label: 'Reading Module', icon: BookOpen },
  listening: { ...BASE_THEME, key: 'listening', label: 'Listening Module', icon: Headphones },
  writing: { ...BASE_THEME, key: 'writing', label: 'Writing Module', icon: PenTool },
  speaking: { ...BASE_THEME, key: 'speaking', label: 'Speaking Module', icon: Mic },
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
