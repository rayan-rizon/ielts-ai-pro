import { lazy, Suspense, useMemo } from 'react';
import { savedPreviewData } from './savedPreviewData';

const Reading = lazy(() => import('./ReadingStudentPreview'));
const Listening = lazy(() => import('./ListeningStudentPreview'));
const Writing = lazy(() => import('./WritingStudentPreview'));
const Speaking = lazy(() => import('./SpeakingStudentPreview'));

// Opens only the isolated student renderer. Editors and their autosave effects
// are never mounted when a locked test is inspected.
export default function SavedTestPreview({ test, questions, onClose }) {
  const data = useMemo(() => savedPreviewData(test, questions), [test, questions]);
  const Component = {
    reading: Reading,
    listening: Listening,
    writing: Writing,
    speaking: Speaking,
  }[test.test_type];
  if (!Component) return null;
  return (
    <Suspense fallback={<p role="status">Loading full preview…</p>}>
      <Component {...data} title={test.title} onClose={onClose} />
    </Suspense>
  );
}
