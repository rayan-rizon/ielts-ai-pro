import { m, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Plus, Trash2, Clock, Undo2, Redo2, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import TestEditorHeader from './TestEditorHeader';
import { AdminButton, PANEL, MICRO, PILL_BASE, pillTone, SectionLabel } from '../../ui/primitives';

const SpeakingTestEditor = ({ initialData, onSave, onCancel, theme }) => {
  const effectiveTheme = theme || { icon: Mic };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    test_type: 'speaking',
    duration_minutes: 15, // Total duration
    access_tier: 'free',
    is_active: true,
    is_official_cambridge: false,
    cambridge_year: new Date().getFullYear(),
    cambridge_test_number: 1,
  });

  const [parts, setParts] = useState([
    {
      part_number: 1,
      title: 'Introduction & Interview',
      prompt: '',
      duration_minutes: 5,
      content: '',
    },
    { part_number: 2, title: 'Long Turn', prompt: '', duration_minutes: 4, content: '' },
    { part_number: 3, title: 'Two-way Discussion', prompt: '', duration_minutes: 5, content: '' },
  ]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      loadParts(initialData.id);
    } else {
      setHistory([{ formData, parts }]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // Auto-title for official Cambridge tests: Book number = year - 2005 (e.g., 2015 = IELTS 10)
  useEffect(() => {
    if (formData.is_official_cambridge) {
      const bookNumber = formData.cambridge_year - 2005;
      setFormData((prev) => ({
        ...prev,
        title: `IELTS ${bookNumber} Speaking ${formData.cambridge_year} Test ${formData.cambridge_test_number}`,
      }));
    }
  }, [formData.is_official_cambridge, formData.cambridge_year, formData.cambridge_test_number]);

  const addToHistory = useCallback(
    (newFormData, newParts) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      const newEntry = { formData: newFormData, parts: newParts };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIndex - 1];
      setFormData(prev.formData);
      setParts(prev.parts);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIndex + 1];
      setFormData(next.formData);
      setParts(next.parts);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const updateFormData = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    addToHistory(newData, parts);
  };

  const loadParts = async (testId) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('passage_id', testId)
        .order('question_number', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        const loadedParts = data.map((q) => ({
          id: q.id,
          part_number: q.question_number,
          title: q.question_text || `Part ${q.question_number}`,
          prompt: q.correct_answer || '',
          content: q.content || '',
          duration_minutes: q.table_data?.duration_minutes || 5,
        }));
        setParts(loadedParts);
        setHistory([{ formData: initialData, parts: loadedParts }]);
        setHistoryIndex(0);
      }
    } catch (err) {
      console.error('Error loading parts:', err);
    }
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
    addToHistory(formData, newParts);
  };

  const addPart = () => {
    const newParts = [
      ...parts,
      {
        part_number: parts.length + 1,
        title: `Part ${parts.length + 1}`,
        prompt: '',
        duration_minutes: 4,
        content: '',
      },
    ];

    setParts(newParts);
    addToHistory(formData, newParts);
  };

  const removePart = (index) => {
    const newParts = parts
      .filter((_, i) => i !== index)
      .map((part, i) => ({ ...part, part_number: i + 1 }));
    setParts(newParts);
    addToHistory(formData, newParts);
  };

  const handleSave = async (silent = false) => {
    if (!formData.title) {
      if (!silent) {
        setError('Please provide a test title.');
        toast.error('Title is required');
      }
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { speaking_parts: _speakingParts, questions: _questions, ...cleanFormData } = formData;
      const isActive = !!formData.is_active;
      const payload = { ...cleanFormData, is_active: isActive };
      const savedPassage = await onSave(payload, !isActive);
      if (!savedPassage || !savedPassage.id) {
        if (!silent) setLoading(false);
        return;
      }
      const questionsToInsert = parts.map((p) => ({
        passage_id: savedPassage.id,
        type: 'speaking_part',
        question_text: p.title,
        correct_answer: p.prompt,
        question_number: p.part_number,
        table_data: { duration_minutes: p.duration_minutes },
      }));
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('passage_id', savedPassage.id);
      if (deleteError) throw deleteError;
      const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
      if (qError) throw qError;
      setLastSaved(new Date());
      if (savedPassage.id && !formData.id)
        setFormData((prev) => ({ ...prev, id: savedPassage.id }));
    } catch (err) {
      console.error('Error saving speaking test:', err);
      if (!silent) {
        setError('Failed to save test. ' + err.message);
        toast.error('Save failed');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100 dark:bg-[#08080a] text-stone-900 dark:text-stone-50 overflow-hidden">
      <TestEditorHeader
        title={formData.title}
        theme={effectiveTheme}
        metadata={formData}
        onMetadataChange={setFormData}
        onTitleChange={(t) => updateFormData('title', t)}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={loading}
        lastSaved={lastSaved}
        showActiveToggle={true}
        leftActions={
          <>
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </>
        }
      />

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] px-3 py-2 text-xs font-semibold text-[rgb(var(--signal-fault))]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Description */}
          <div className={cn(PANEL, 'p-4')}>
            <SectionLabel className="mb-2">Test Description</SectionLabel>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Enter a brief description for this test..."
              className="resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm min-h-[50px] bg-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold tracking-tight flex items-center gap-2 text-stone-900 dark:text-stone-50">
              <Mic className="w-4 h-4 text-stone-400 dark:text-stone-500" /> Speaking Parts
            </h2>
            <AdminButton variant="outline" size="sm" onClick={addPart}>
              <Plus className="w-3.5 h-3.5" /> Add Part
            </AdminButton>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {parts.map((part, index) => (
                <m.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    PANEL,
                    'overflow-hidden group transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'
                  )}
                >
                  <div className="py-2.5 px-4 border-b border-stone-200/80 dark:border-white/[0.07] flex items-center justify-between bg-stone-50/60 dark:bg-white/2">
                    <div className="flex items-center gap-3">
                      <span className={cn(PILL_BASE, pillTone('neutral'))}>
                        Part {part.part_number}
                      </span>
                      <Input
                        value={part.title}
                        onChange={(e) => handlePartChange(index, 'title', e.target.value)}
                        className="h-7 w-64 font-bold bg-transparent border-transparent hover:border-stone-200 dark:hover:border-white/10 focus-visible:ring-0 px-2 text-stone-900 dark:text-stone-100"
                        placeholder="Part Title"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white dark:bg-[#131315] px-2 py-1 rounded-md border border-stone-200/80 dark:border-white/[0.07]">
                        <Clock className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        <Input
                          type="number"
                          value={part.duration_minutes}
                          onChange={(e) =>
                            handlePartChange(index, 'duration_minutes', parseInt(e.target.value))
                          }
                          className="h-5 w-10 text-xs border-0 p-0 text-center focus-visible:ring-0 bg-transparent"
                        />
                        <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePart(index)}
                        className="h-7 w-7 grid place-items-center rounded-md text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mb-2 block')}>
                      Examiner Script (AI Prompt)
                    </Label>
                    <Textarea
                      value={part.prompt}
                      onChange={(e) => handlePartChange(index, 'prompt', e.target.value)}
                      placeholder={`Enter questions split by newlines.\nExample:\nWhat is your full name?\nDo you work or are you a student?`}
                      className="font-sans text-sm min-h-[120px] resize-y bg-stone-50 dark:bg-white/2 border-stone-200/80 dark:border-white/[0.07] focus-visible:ring-stone-400/20"
                    />
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> The AI examiner will read these questions one by
                      one. Text in [brackets] is ignored (instructions).
                    </p>
                  </div>
                </m.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestEditor;
