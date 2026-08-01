import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Redo2, Save, Undo2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AdminButton, PANEL, MICRO, SectionLabel } from '../../ui/primitives';

// --- History Hook ---
const useHistory = (initialState) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [pointer, setPointer] = useState(0);

  const set = (newState) => {
    const next = typeof newState === 'function' ? newState(state) : newState;
    const newHistory = history.slice(0, pointer + 1);
    newHistory.push(next);
    setHistory(newHistory);
    setPointer(newHistory.length - 1);
    setState(next);
  };

  const undo = () => {
    if (pointer > 0) {
      setPointer(pointer - 1);
      setState(history[pointer - 1]);
    }
  };

  const redo = () => {
    if (pointer < history.length - 1) {
      setPointer(pointer + 1);
      setState(history[pointer + 1]);
    }
  };

  return [state, set, undo, redo, pointer > 0, pointer < history.length - 1];
};

const GenericTestCreator = ({ initialData, onSave, onCancel, testType }) => {
  const [formData, setFormData, undo, redo, canUndo, canRedo] = useHistory({
    title: initialData?.title || '',
    access_tier: initialData?.access_tier || 'free',
    test_type: testType,
    is_official_cambridge: initialData?.is_official_cambridge || false,
    cambridge_year: initialData?.cambridge_year || new Date().getFullYear(),
    cambridge_test_number: initialData?.cambridge_test_number || 1,
    // Keep complex structures as JSON string for editing
    raw_data: JSON.stringify(
      {
        listening_sections: initialData?.content
          ? typeof initialData.content === 'string'
            ? JSON.parse(initialData.content)
            : initialData.content
          : initialData?.listening_sections || [],
        speaking_parts: initialData?.speaking_parts || [],
        writing_tasks: initialData?.writing_tasks || [],
      },
      null,
      2
    ),
  });

  // Auto-save Effect
  useEffect(() => {
    if (!initialData && typeof localStorage !== 'undefined') {
      const timer = setTimeout(() => {
        localStorage.setItem(
          `${testType}_test_draft`,
          JSON.stringify({ formData, timestamp: Date.now() })
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, testType, initialData]);

  // Load draft on mount
  useEffect(() => {
    if (!initialData && typeof localStorage !== 'undefined') {
      const draft = localStorage.getItem(`${testType}_test_draft`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.formData && parsed.formData.testType === testType) {
            setFormData(parsed.formData);
          }
        } catch {
          // Ignore malformed drafts and start with a clean form.
        }
      }
    }
  }, []);

  // Auto-format title for official tests
  useEffect(() => {
    if (formData.is_official_cambridge) {
      // Book number formula: year - 2005 (e.g., 2015 = IELTS 10)
      const bookNumber = formData.cambridge_year - 2005;
      const formattedTitle = `IELTS ${bookNumber} Academic ${formData.cambridge_year} Test ${formData.cambridge_test_number}`;
      if (formattedTitle !== formData.title) {
        setFormData((prev) => ({ ...prev, title: formattedTitle }));
      }
    }
  }, [formData.is_official_cambridge, formData.cambridge_year, formData.cambridge_test_number]);

  const handleSave = () => {
    try {
      JSON.parse(formData.raw_data);
      onSave({
        ...initialData,
        title: formData.title,
        access_tier: formData.access_tier,
        test_type: testType,
        is_official_cambridge: formData.is_official_cambridge,
        cambridge_year: formData.cambridge_year,
        cambridge_test_number: formData.cambridge_test_number,
        content: formData.raw_data, // Save as stringified JSON if that's what backend expects for 'content' column
      });
    } catch (e) {
      alert('Invalid JSON in test data: ' + e.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 capitalize">
          {testType} Test Editor
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-white/[0.04] p-1 rounded-md">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <AdminButton variant="outline" onClick={onCancel}>
            <X className="w-3.5 h-3.5" /> Cancel
          </AdminButton>
          <AdminButton onClick={handleSave}>
            <Save className="w-3.5 h-3.5" /> Save
          </AdminButton>
        </div>
      </div>

      <div className={cn(PANEL, 'p-4 space-y-4')}>
        <SectionLabel>Test Details</SectionLabel>

        <div className="grid gap-1.5">
          <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Cambridge 15 Test 1"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Access Tier</Label>
          <Select
            value={formData.access_tier}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, access_tier: val }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={formData.is_official_cambridge}
              onCheckedChange={(c) => setFormData({ ...formData, is_official_cambridge: !!c })}
            />
            <span className="text-xs font-bold text-stone-700 dark:text-stone-200">
              Official Cambridge Test
            </span>
          </label>

          {formData.is_official_cambridge && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-200 p-3 rounded-lg border border-dashed border-stone-200 dark:border-white/[0.1] bg-stone-50 dark:bg-white/[0.02]">
              <div className="grid gap-1.5 flex-1">
                <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Year</Label>
                <Input
                  type="number"
                  min="2000"
                  max="2030"
                  value={formData.cambridge_year}
                  onChange={(e) =>
                    setFormData({ ...formData, cambridge_year: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-1.5 flex-1">
                <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Test Number
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.cambridge_test_number}
                  onChange={(e) =>
                    setFormData({ ...formData, cambridge_test_number: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            Test Data (JSON Configuration)
          </Label>
          <Textarea
            className="font-mono text-xs h-96"
            value={formData.raw_data}
            onChange={(e) => setFormData({ ...formData, raw_data: e.target.value })}
          />
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Configure {testType} specific sections here (sections, tasks, prompts). Validation will
            be applied on save.
          </p>
        </div>
      </div>
    </div>
  );
};
export default GenericTestCreator;
