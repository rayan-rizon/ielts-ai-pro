import { useCallback, useState } from 'react';
import { useReadingTestStore } from '@/features/testing/reading/store/useReadingTestStore';

/**
 * Study notes taken during a reading test.
 *
 * Notes are held in the store rather than local component state so they survive
 * a refresh or a resume — previously they existed only for the lifetime of the
 * mounted page and were lost with it. `showNotes` and the in-progress draft stay
 * local: they are view state, not the learner's work.
 */
export const useTestNotes = () => {
  const notes = useReadingTestStore((s) => s.notes);
  const setNotes = useReadingTestStore((s) => s.setNotes);
  const addNoteToStore = useReadingTestStore((s) => s.addNote);
  const removeNoteFromStore = useReadingTestStore((s) => s.removeNote);

  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');

  const addNote = useCallback(
    (currentPassageIndex) => {
      const content = newNote.trim();
      if (!content) return;

      addNoteToStore({
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content,
        timestamp: new Date().toISOString(),
        passageIndex: currentPassageIndex ?? null,
      });
      setNewNote('');
    },
    [newNote, addNoteToStore]
  );

  const removeNote = useCallback((noteId) => removeNoteFromStore(noteId), [removeNoteFromStore]);

  return {
    notes,
    setNotes,
    showNotes,
    setShowNotes,
    newNote,
    setNewNote,
    addNote,
    removeNote,
  };
};
