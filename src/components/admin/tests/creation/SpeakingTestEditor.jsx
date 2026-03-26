import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Save,
  X,
  Mic,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
  Undo2,
  Redo2,
  Info,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import TestEditorHeader from './TestEditorHeader';

const SpeakingTestEditor = ({ initialData, onSave, onCancel, theme }) => {
  // Use Rose theme if not provided
  const effectiveTheme = theme || {
    color: 'rose',
    primary: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-700',
    text: 'text-rose-600',
    light: 'bg-rose-50 dark:bg-rose-950/40',
    lighter: 'bg-rose-50/50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900',
    hover: 'hover:bg-rose-50',
    icon: Mic,
    gradient: 'from-rose-500 to-pink-500',
    ring: 'ring-rose-500/20',
  };

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
      const { speaking_parts, questions, ...cleanFormData } = formData;
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
    <div
      className="flex flex-col h-screen bg-slate-50 dark:bg-background text-foreground rounded-xl overflow-hidden"
      data-oid="a2-9aeg"
    >
      {/* Premium Header */}
      <TestEditorHeader
        title={formData.title}
        theme={effectiveTheme}
        metadata={formData}
        onMetadataChange={setFormData}
        onTitleChange={(t) => updateFormData('title', t)}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={loading}
        lastSaved={null}
        showActiveToggle={true}
        leftActions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30"
              data-oid="pmyrgy-"
            >
              <Undo2 className="w-4 h-4" data-oid="zms:9eu" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30"
              data-oid="f85ozhj"
            >
              <Redo2 className="w-4 h-4" data-oid="maqmor:" />
            </Button>
          </>
        }
        data-oid="3l:ec6a"
      />

      {error && (
        <Alert variant="destructive" className="m-4" data-oid=":bgn.vn">
          <AlertDescription data-oid=".0iu9a7">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/10 dark:bg-card/20"
        data-oid="0yar6.6"
      >
        <div className="max-w-4xl mx-auto space-y-6" data-oid="6h7p0yt">
          {/* Description */}
          <Card className="border shadow-none bg-background" data-oid="bby4g25">
            <CardHeader className="py-3 px-4 border-b bg-muted/10" data-oid="ry5_ebk">
              <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="_v2:30h">
                Test Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4" data-oid="9c32frz">
              <Textarea
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Enter a brief description for this test..."
                className="resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm min-h-[60px]"
                data-oid="p5k2sfq"
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between" data-oid="n07dff_">
            <h2 className="text-xl font-bold flex items-center gap-2" data-oid="em14up4">
              <Mic className={`w-5 h-5 ${effectiveTheme.text}`} data-oid="s8gx4iu" /> Speaking Parts
            </h2>
            <Button
              onClick={addPart}
              variant="outline"
              size="sm"
              className={`${effectiveTheme.border} ${effectiveTheme.text} hover:${effectiveTheme.light}`}
              data-oid="g:fbk1v"
            >
              <Plus className="w-4 h-4 mr-2" data-oid="gx36ui." /> Add Part
            </Button>
          </div>

          <div className="space-y-4" data-oid="ck2f0_1">
            {parts.map((part, index) => (
              <Card
                key={index}
                className="border-border shadow-sm overflow-hidden group hover:border-rose-300 transition-colors"
                data-oid="4rw0gcw"
              >
                <CardHeader
                  className={`py-3 px-4 border-b flex flex-row items-center justify-between bg-muted/10`}
                  data-oid="3op-yif"
                >
                  <div className="flex items-center gap-3" data-oid="lkhfmg9">
                    <Badge variant="outline" className="bg-background" data-oid="vyp0upo">
                      Part {part.part_number}
                    </Badge>
                    <Input
                      value={part.title}
                      onChange={(e) => handlePartChange(index, 'title', e.target.value)}
                      className="h-7 w-64 font-semibold bg-transparent border-transparent hover:border-border focus-visible:ring-0 px-2"
                      placeholder="Part Title"
                      data-oid="xoafmju"
                    />
                  </div>
                  <div className="flex items-center gap-2" data-oid="ic58j:4">
                    <div
                      className="flex items-center gap-1 bg-background px-2 py-1 rounded border"
                      data-oid=".1qj12e"
                    >
                      <Clock className="w-3 h-3 text-muted-foreground" data-oid="wh1vs9." />
                      <Input
                        type="number"
                        value={part.duration_minutes}
                        onChange={(e) =>
                          handlePartChange(index, 'duration_minutes', parseInt(e.target.value))
                        }
                        className="h-5 w-10 text-xs border-0 p-0 text-center focus-visible:ring-0"
                        data-oid="izzpiv9"
                      />

                      <span className="text-[10px] text-muted-foreground" data-oid=":mdm2ut">
                        min
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePart(index)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      data-oid="tyxr29i"
                    >
                      <Trash2 className="w-4 h-4" data-oid="f:8h2ke" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4" data-oid="69eg5nt">
                  <Label
                    className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider"
                    data-oid="olck5cc"
                  >
                    Examiner Script (AI Prompt)
                  </Label>
                  <Textarea
                    value={part.prompt}
                    onChange={(e) => handlePartChange(index, 'prompt', e.target.value)}
                    placeholder={`Enter questions split by newlines.\nExample:\nWhat is your full name?\nDo you work or are you a student?`}
                    className="font-sans text-sm min-h-[120px] resize-y bg-muted/10 border-border/50 focus-visible:ring-rose-500/20"
                    data-oid="nnr:pam"
                  />

                  <p
                    className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"
                    data-oid="ojol6pj"
                  >
                    <Info className="w-3 h-3" data-oid="aiink1v" /> The AI examiner will read these
                    questions one by one. Text in [brackets] is ignored (instructions).
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestEditor;
