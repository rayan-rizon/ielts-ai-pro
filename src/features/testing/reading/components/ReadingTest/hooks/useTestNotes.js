import { useState, useCallback } from 'react';

export const useTestNotes = (initialNotes = []) => {
  const [notes, setNotes] = useState(initialNotes);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');

  const addNote = useCallback(
    (currentPassageIndex) => {
      if (!newNote.trim()) return;

      const note = {
        id: Date.now(),
        content: newNote,
        timestamp: new Date().toISOString(),
        passageIndex: currentPassageIndex,
      };

      setNotes((prev) => [...prev, note]);
      setNewNote('');
    },
    [newNote]
  );

  const removeNote = useCallback((noteId) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  }, []);

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
