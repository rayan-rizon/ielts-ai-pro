import { useEditorHistory } from '@/hooks/admin/useEditorHistory';
import { m } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
const WritingStudentPreview = React.lazy(() => import('../preview/WritingStudentPreview'));
import { Input } from '@/components/ui/input';
import ReadingEditorSelect from '../ReadingEditorSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Loader2,
  PenTool,
  FileText,
  Sparkles,
  ImageIcon,
  Trash2,
  Info,
  ShieldCheck,
  Link2,
  Upload,
  X,
} from 'lucide-react';
import TestEditorHeader from './TestEditorHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { uploadToR2 } from '@/lib/r2';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  PANEL,
  MICRO,
  PILL_BASE,
  pillTone,
  ADMIN_TABS_LIST,
  ADMIN_TAB_TRIGGER,
} from '../../ui/primitives';
import { sanitizeHtml } from '@/lib/security';

// Reusing RichTextEditor with Theme Support (for prompts - uses ReactQuill)
const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],

    // matchVisual: true (default) preserves formatting including line breaks and spacing
    clipboard: { matchVisual: true },
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-[#131315] border border-stone-200/80 dark:border-white/[0.07] rounded-xl transition-colors duration-150',
        className
      )}
    >
      <style>{`
        .ql-toolbar.ql-snow {
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgb(231 229 228 / 1);
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 8px 12px;
        }
        .dark .ql-toolbar.ql-snow {
          border: 0;
          border-bottom: 1px solid rgb(255 255 255 / 0.07);
        }
        .ql-toolbar button {
          border-radius: 4px;
          margin: 1px;
          width: 28px;
          height: 28px;
          transition: background-color 0.15s ease;
        }
        .dark .ql-toolbar button { filter: invert(0.75); }
        .ql-toolbar button:hover,
        .ql-toolbar .ql-picker:hover {
          background: rgb(245 245 244 / 1);
        }
        .dark .ql-toolbar button:hover,
        .dark .ql-toolbar .ql-picker:hover {
          background: rgb(255 255 255 / 0.06);
        }
        .ql-toolbar button.ql-active,
        .ql-toolbar .ql-picker.ql-active {
          background: rgb(231 229 228 / 1);
        }
        .dark .ql-toolbar button.ql-active,
        .dark .ql-toolbar .ql-picker.ql-active {
          background: rgb(255 255 255 / 0.1);
        }
        .ql-container.ql-snow {
          background: transparent;
          border: 0;
          font-size: 15px;
          border-radius: 0 0 0.75rem 0.75rem;
        }
        .ql-editor {
          padding: 16px;
          min-height: 150px;
        }
        .ql-editor:focus { outline: none; }
        .ql-editor.ql-blank::before {
          color: rgb(168 162 158 / 1);
          font-style: italic;
        }
        .dark .ql-editor.ql-blank::before { color: rgb(120 113 108 / 1); }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        className="h-full min-h-[150px]"
        placeholder={placeholder}
      />
    </div>
  );
};

// --- Sample Answer Editor (uses ReactQuill for proper HTML formatting) ---
const SampleAnswerEditor = ({ value, onChange, placeholder }) => {
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['clean'],
    ],

    clipboard: {
      matchVisual: true, // Preserve formatting on paste
    },
  };

  return (
    <div className="border border-stone-200/80 dark:border-white/[0.07] rounded-xl bg-white dark:bg-[#131315] overflow-hidden">
      <style>{`
        .sample-answer-editor .ql-toolbar {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgb(231 229 228 / 1);
          padding: 6px 10px;
        }
        .dark .sample-answer-editor .ql-toolbar { border-bottom: 1px solid rgb(255 255 255 / 0.07); }
        .sample-answer-editor .ql-toolbar button { border-radius: 4px; margin: 1px; width: 26px; height: 26px; }
        .dark .sample-answer-editor .ql-toolbar button { filter: invert(0.75); }
        .sample-answer-editor .ql-toolbar button:hover,
        .sample-answer-editor .ql-toolbar .ql-picker:hover { background: rgb(245 245 244 / 1); }
        .dark .sample-answer-editor .ql-toolbar button:hover,
        .dark .sample-answer-editor .ql-toolbar .ql-picker:hover { background: rgb(255 255 255 / 0.06); }
        .sample-answer-editor .ql-toolbar button.ql-active { background: rgb(231 229 228 / 1); }
        .dark .sample-answer-editor .ql-toolbar button.ql-active { background: rgb(255 255 255 / 0.1); }
        .sample-answer-editor .ql-container { background: transparent; border: none; font-size: 14px; }
        .sample-answer-editor .ql-editor {
          padding: 16px;
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
          line-height: 1.7;
        }
        .sample-answer-editor .ql-editor:focus { outline: none; }
        .sample-answer-editor .ql-editor.ql-blank::before {
          color: rgb(168 162 158 / 1);
          font-style: italic;
        }
        .dark .sample-answer-editor .ql-editor.ql-blank::before { color: rgb(120 113 108 / 1); }
        .sample-answer-editor .ql-editor p { margin-bottom: 1em; }
        .sample-answer-editor .ql-editor h1,
        .sample-answer-editor .ql-editor h2,
        .sample-answer-editor .ql-editor h3 { font-weight: 700; margin-bottom: 0.75em; }
      `}</style>
      <div className="sample-answer-editor">
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={quillModules}
          placeholder={
            placeholder ||
            'Paste or type the sample answer here. Formatting (bold, headings, paragraphs) will be preserved.'
          }
        />
      </div>
      <div
        className={cn(
          MICRO,
          'px-3 py-1.5 border-t border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/2 text-stone-400 dark:text-stone-500 normal-case tracking-normal font-medium'
        )}
      >
        Tip: Paste formatted text directly — bold, headings, and paragraphs are preserved
        automatically.
      </div>
    </div>
  );
};

// --- Instruction Editor Component (Consistent with Reading/Listening) ---
const InstructionEditor = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !isPreview) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(60, textarea.scrollHeight) + 'px';
    }
  }, [value, isPreview]);

  const renderSimplePreview = (text) => {
    if (!text)
      return (
        <div className="text-gray-400 italic text-sm" data-oid="fdyl0:c">
          No content to preview
        </div>
      );

    let processedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /\[image\](.*?)\[\/image\]/g,
        '<img src="$1" referrerpolicy="no-referrer" class="max-w-full h-auto mx-auto my-2 border rounded shadow-sm" />'
      );

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert" data-oid="ayj3q8q">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedText) }} data-oid="km1loth" />
      </div>
    );
  };

  const handleInsertImageUrl = () => {
    if (!imageUrlInput) return;

    let finalUrl = imageUrlInput.trim();
    // Basic validation
    if (!finalUrl.startsWith('http')) {
      toast.error('Please enter a valid URL');
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value || '';
      const tag = `[image]${finalUrl}[/image]`;
      const newValue = text.substring(0, start) + tag + text.substring(end);
      onChange(newValue);

      // Close modal and clear input
      setShowImageUrlModal(false);
      setImageUrlInput('');

      // Focus and place cursor after tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  const handleFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || '';
    const selected = text.substring(start, end);

    let formatted = '';
    if (type === 'bold') {
      formatted = `**${selected === '' ? 'bold text' : selected}**`;
    } else if (type === 'italic') {
      formatted = `*${selected === '' ? 'italic text' : selected}*`;
    }

    const newValue = text.substring(0, start) + formatted + text.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const offset = type === 'bold' ? 2 : 1;
      if (selected === '') {
        textarea.setSelectionRange(start + offset, start + offset + (type === 'bold' ? 9 : 11));
      } else {
        textarea.setSelectionRange(start + offset, start + offset + selected.length);
      }
    }, 0);
  };

  return (
    <div className="border border-stone-200/80 dark:border-white/[0.07] rounded-lg bg-white dark:bg-[#131315] overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/2">
        <div className="flex items-center gap-1">
          <div className={cn(MICRO, 'text-stone-400 dark:text-stone-500 mr-2')}>Instructions</div>
          {!isPreview && (
            <div className="flex items-center border-l border-stone-200 dark:border-white/10 pl-2 gap-1">
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
                title="Bold"
              >
                <span className="font-bold text-xs">B</span>
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
                title="Italic"
              >
                <span className="italic text-xs">I</span>
              </button>
              <button
                type="button"
                onClick={() => setShowImageUrlModal(true)}
                className="h-6 w-6 grid place-items-center rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
                title="Insert Image URL"
              >
                <Link2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="text-[11px] font-bold h-6 px-2 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
        >
          {isPreview ? 'Edit' : 'Preview'}
        </button>
      </div>
      <div className="relative">
        {isPreview ? (
          <div
            className="bg-white dark:bg-[#131315] overflow-y-auto min-h-[60px] p-2"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {renderSimplePreview(value || '')}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full border-0 rounded-none rounded-b-lg resize-none focus:ring-0 text-sm bg-white dark:bg-[#0c0c0d] text-stone-700 dark:text-stone-200 font-mono min-h-[60px] p-3"
            style={{ whiteSpace: 'pre-wrap', overflow: 'hidden' }}
          />
        )}
      </div>

      {/* Image URL Modal */}
      <AlertDialog open={showImageUrlModal} onOpenChange={setShowImageUrlModal} data-oid="crt-4a-">
        <AlertDialogContent className="sm:max-w-md" data-oid="1x_9-j5">
          <AlertDialogHeader data-oid="y.g:p07">
            <AlertDialogTitle data-oid="flg1e7o">Insert Image URL</AlertDialogTitle>
            <AlertDialogDescription data-oid="14n1hpc">
              Paste the direct URL of the image you want to insert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4" data-oid="dv_gv79">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertImageUrl();
                }
              }}
              data-oid="ox2gbjh"
            />

            {imageUrlInput && (
              <div
                className="border rounded-lg p-2 bg-stone-50 dark:bg-stone-900 overflow-hidden text-center"
                data-oid="a82d.wp"
              >
                <p
                  className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold"
                  data-oid="x-olx.z"
                >
                  Preview
                </p>
                <img
                  src={imageUrlInput}
                  alt="Preview"
                  className="max-h-40 mx-auto object-contain rounded"
                  onError={(e) => (e.target.style.display = 'none')}
                  data-oid="-q_oyzc"
                />
              </div>
            )}
          </div>
          <AlertDialogFooter data-oid="tse1ymf">
            <AlertDialogCancel onClick={() => setImageUrlInput('')} data-oid="j7gh:ne">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInsertImageUrl}
              className="bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200"
              disabled={!imageUrlInput}
              data-oid="3ursd:t"
            >
              Insert Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- ImagePreview Component with React State-based Error Handling ---
const ImagePreview = ({ imageUrl, onClear }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when URL changes
  useEffect(() => {
    if (imageUrl) {
      setHasError(false);
      setIsLoading(true);
    }
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 dark:border-white/12 bg-stone-50 dark:bg-white/2 p-8 flex flex-col items-center justify-center text-center gap-2 text-stone-400 dark:text-stone-600">
        <ImageIcon className="w-8 h-8 opacity-50" />
        <span className="text-xs font-medium">No image provided</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-xl border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] p-6 flex flex-col items-center justify-center text-center gap-3">
        <div className="flex items-center gap-2 text-[rgb(var(--signal-warn))]">
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">Image could not be loaded</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold h-7 px-2 rounded text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear URL
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-stone-200/80 dark:border-white/[0.07] bg-stone-100 dark:bg-white/3 aspect-video flex items-center justify-center group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/60 dark:bg-white/4 z-20">
          <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
        </div>
      )}
      <img
        src={imageUrl}
        alt="Reference"
        className={`max-h-64 max-w-full object-contain z-10 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        referrerPolicy="no-referrer"
        data-oid="nqm_f7s"
      />
    </div>
  );
};

const WritingTestEditor = ({ initialData, onSave, onCancel, theme }) => {
  const effectiveTheme = theme || { icon: PenTool };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  const [historyReady, setHistoryReady] = useState(false);

  const [meta, setMeta] = useState({
    title: '',
    test_format: 'Academic',
    access_tier: 'free',
    is_official_cambridge: false,
    cambridge_year: new Date().getFullYear(),
    cambridge_test_number: 1,
  });

  const [tasks, setTasks] = useState({
    'Task 1': {
      prompt: '',
      instructions:
        'You should spend about **20 minutes** on this task.\n\nWrite at least **150 words**.',
      image_url: '',
      sample_answer: '',
    },
    'Task 2': {
      prompt: '',
      instructions:
        'You should spend about **40 minutes** on this task.\n\nWrite at least **250 words**.',
      image_url: '',
      sample_answer: '',
    },
  });

  const [showFullPreview, setShowFullPreview] = useState(false);
  const savedEditorSnapshot = useRef('');
  const [activeTask, setActiveTask] = useState('Task 1');

  // Initialize
  useEffect(() => {
    if (initialData) {
      let parsedTasks = {};
      try {
        const content = initialData.content || '{}';
        const jsonContent = JSON.parse(content);
        if (jsonContent['Task 1'] || jsonContent['Task 2']) {
          parsedTasks = {
            'Task 1': { ...tasks['Task 1'], ...jsonContent['Task 1'] },
            'Task 2': { ...tasks['Task 2'], ...jsonContent['Task 2'] },
          };
        } else if (typeof jsonContent === 'object' && jsonContent !== null) {
          const taskType = initialData.task_type || 'Task 1';
          parsedTasks = {
            ...tasks,
            [taskType]: {
              prompt: jsonContent.prompt || '',
              instructions: jsonContent.instructions || tasks[taskType].instructions,
              image_url: jsonContent.image_url || '',
              sample_answer: jsonContent.sample_answer || '',
            },
          };
        }
      } catch {
        const taskType = initialData.task_type || 'Task 1';
        parsedTasks = {
          ...tasks,
          [taskType]: { ...tasks[taskType], prompt: initialData.content || '' },
        };
      }

      setMeta({
        title: initialData.title || '',
        test_format: initialData.test_format || 'Academic',
        access_tier: initialData.access_tier || 'free',
        is_official_cambridge: initialData.is_official_cambridge || false,
        cambridge_year: initialData.cambridge_year || new Date().getFullYear(),
        cambridge_test_number: initialData.cambridge_test_number || 1,
      });

      if (Object.keys(parsedTasks).length > 0) setTasks(parsedTasks);
      if (initialData.task_type) setActiveTask(initialData.task_type);

      const initialState = {
        tasks: Object.keys(parsedTasks).length > 0 ? parsedTasks : tasks,
        meta: {
          title: initialData.title || '',
          test_format: initialData.test_format || 'Academic',
          access_tier: initialData.access_tier || 'free',
          is_official_cambridge: initialData.is_official_cambridge || false,
          cambridge_year: initialData.cambridge_year || new Date().getFullYear(),
          cambridge_test_number: initialData.cambridge_test_number || 1,
        },
      };
      savedEditorSnapshot.current = JSON.stringify({
        tasks: initialState.tasks,
        meta: initialState.meta,
      });
      previousTitleInputs.current = JSON.stringify([
        initialState.meta.is_official_cambridge,
        initialState.meta.cambridge_year,
        initialState.meta.cambridge_test_number,
      ]);
    } else {
      savedEditorSnapshot.current = JSON.stringify({ tasks, meta });
    }
    setHistoryReady(true);
  }, [initialData]);

  const editorHistory = useEditorHistory(
    { tasks, meta },
    (snapshot) => {
      setTasks(snapshot.tasks);
      setMeta(snapshot.meta);
    },
    historyReady
  );

  const updateTaskField = (taskType, field, value) => {
    const newTasks = { ...tasks, [taskType]: { ...tasks[taskType], [field]: value } };
    setTasks(newTasks);
  };

  const updateMeta = (field, value) => {
    const newMeta = { ...meta, [field]: value };
    setMeta(newMeta);
  };

  const handleSave = async (silent = false) => {
    if (!meta.title) {
      if (!silent) {
        setError('Please enter a title.');
        toast.error('Title is required');
      }
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        title: meta.title,
        test_type: 'writing',
        test_format: meta.test_format,
        topic: 'general',
        task_type: activeTask,
        content: JSON.stringify(tasks),
        access_tier: meta.access_tier,
        is_active: typeof initialData?.is_active === 'boolean' ? initialData.is_active : !silent,
        is_official_cambridge: meta.is_official_cambridge,
        cambridge_year: meta.is_official_cambridge ? meta.cambridge_year : null,
        cambridge_test_number: meta.is_official_cambridge ? meta.cambridge_test_number : null,
        writing_tasks: Object.keys(tasks)
          .map((type) => ({
            prompt: sanitizeHtml(tasks[type].prompt),
            instructions: sanitizeHtml(tasks[type].instructions),
            sample_answer: sanitizeHtml(tasks[type].sample_answer),
            image_url: tasks[type].image_url, // URL doesn't need HTML sanitization, but good to validate generally. JS valid URL check is enough usually, but here we leave it as string.
            task_type: type,
          }))
          .filter((t) => t.prompt && t.prompt !== '<p><br></p>'),
      };

      if (initialData?.id) dataToSave.id = initialData.id;

      // Pass isDraft=true for silent saves to prevent parent from closing the editor
      const result = await onSave(dataToSave, silent);
      if (result?.id) {
        savedEditorSnapshot.current = JSON.stringify({ tasks, meta });
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error saving writing test:', err);
      if (!silent) {
        setError('Failed to save. ' + err.message);
        toast.error('Save failed');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const titleInputs = JSON.stringify([
    meta.is_official_cambridge,
    meta.cambridge_year,
    meta.cambridge_test_number,
  ]);
  const previousTitleInputs = useRef(titleInputs);
  const titleHydrating = useRef(!!initialData);
  // Auto-title for official Cambridge tests: Book number = year - 2005 (e.g., 2015 = IELTS 10)
  useEffect(() => {
    if (titleHydrating.current) {
      previousTitleInputs.current = titleInputs;
      if (meta.title === (initialData?.title || '')) titleHydrating.current = false;
      return;
    }
    if (previousTitleInputs.current === titleInputs) return;
    previousTitleInputs.current = titleInputs;
    if (meta.is_official_cambridge) {
      const bookNumber = meta.cambridge_year - 2005;
      setMeta((prev) => ({
        ...prev,
        title: `IELTS ${bookNumber} Writing ${meta.cambridge_year} Test ${meta.cambridge_test_number}`,
      }));
    }
  }, [
    titleInputs,
    meta.is_official_cambridge,
    meta.cambridge_year,
    meta.cambridge_test_number,
    meta.title,
    initialData?.title,
  ]);

  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;
  // Auto-save
  useEffect(() => {
    if (showFullPreview || JSON.stringify({ tasks, meta }) === savedEditorSnapshot.current) return;
    const timer = setTimeout(() => {
      if (meta.title && initialData?.id) saveRef.current(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [tasks, meta, showFullPreview, initialData?.id]);

  return (
    <div className="flex flex-col h-screen bg-stone-100 dark:bg-[#08080a] text-stone-900 dark:text-stone-50 overflow-hidden">
      <TestEditorHeader
        title={meta.title}
        theme={effectiveTheme}
        metadata={meta}
        onMetadataChange={setMeta}
        onTitleChange={(t) => updateMeta('title', t)}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={loading}
        lastSaved={lastSaved}
        history={editorHistory}
      >
        <AdminButton variant="outline" onClick={() => setShowFullPreview(true)}>
          <Eye className="size-3.5" />
          Full preview
        </AdminButton>
        {/* Format Pill */}
        <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
          <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>Format</span>
          <ReadingEditorSelect
            label="Test format"
            value={meta.test_format}
            onValueChange={(value) => setMeta({ ...meta, test_format: value })}
            className="h-5 w-auto border-0 p-0 font-bold"
            options={[
              { value: 'Academic', label: 'Academic' },
              { value: 'General', label: 'General Training' },
            ]}
          />
        </div>
      </TestEditorHeader>

      {showFullPreview && (
        <React.Suspense fallback={<p role="status">Opening preview…</p>}>
          <WritingStudentPreview
            tasks={tasks}
            title={meta.title}
            onClose={() => setShowFullPreview(false)}
          />
        </React.Suspense>
      )}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 rounded-lg border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] px-3 py-2 text-xs font-semibold text-[rgb(var(--signal-fault))]">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="w-full max-w-[1800px] mx-auto">
          <Tabs value={activeTask} onValueChange={setActiveTask} className="w-full space-y-4">
            <TabsList className={cn(ADMIN_TABS_LIST, 'mx-auto mb-6')}>
              <TabsTrigger
                value="Task 1"
                className={cn(
                  ADMIN_TAB_TRIGGER,
                  'relative overflow-visible data-[state=active]:shadow-none'
                )}
              >
                {activeTask === 'Task 1' && (
                  <m.span
                    layoutId="writingTaskActivePill"
                    className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="flex items-center gap-2 relative z-10">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                    1
                  </span>
                  Task 1
                  <span className="text-[10px] font-normal opacity-60 hidden sm:inline">
                    Report/Letter
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="Task 2"
                className={cn(
                  ADMIN_TAB_TRIGGER,
                  'relative overflow-visible data-[state=active]:shadow-none'
                )}
              >
                {activeTask === 'Task 2' && (
                  <m.span
                    layoutId="writingTaskActivePill"
                    className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="flex items-center gap-2 relative z-10">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                    2
                  </span>
                  Task 2
                  <span className="text-[10px] font-normal opacity-60 hidden sm:inline">Essay</span>
                </span>
              </TabsTrigger>
            </TabsList>

            {['Task 1', 'Task 2'].map((taskType) => (
              <TabsContent
                key={taskType}
                value={taskType}
                className="space-y-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-full">
                  {/* Left Column: Instructions & Prompt - Takes 7/12 width */}
                  <div className="lg:col-span-7 space-y-4 flex flex-col">
                    {/* Instructions */}
                    <div className={cn(PANEL, 'p-4')}>
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className={cn(
                            MICRO,
                            'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                          )}
                        >
                          <Info className="w-3.5 h-3.5" /> Instructions
                        </h3>
                        {tasks[taskType].instructions && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
                        )}
                      </div>
                      <InstructionEditor
                        value={tasks[taskType].instructions}
                        onChange={(val) => updateTaskField(taskType, 'instructions', val)}
                        placeholder="Enter brief instructions about time and word count..."
                      />
                    </div>

                    {/* Prompt */}
                    <div className={cn(PANEL, 'p-1 flex flex-col min-h-fit')}>
                      <div className="p-3 pb-2 flex items-center justify-between border-b border-stone-200/80 dark:border-white/[0.07] mb-1">
                        <h3 className="text-xs font-extrabold flex items-center gap-1.5 text-stone-700 dark:text-stone-200">
                          <PenTool className="w-3.5 h-3.5 text-stone-400" /> Task Prompt
                        </h3>
                        <span className={cn(PILL_BASE, pillTone('neutral'))}>Required</span>
                      </div>
                      <div className="flex-1 p-2">
                        <RichTextEditor
                          theme={effectiveTheme}
                          value={tasks[taskType].prompt}
                          onChange={(val) => updateTaskField(taskType, 'prompt', val)}
                          className="border-0 bg-transparent! min-h-[150px]"
                          placeholder={`Write the ${taskType} question here...`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image & Sample Answer - Takes 5/12 width */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col h-full">
                    {/* Task 1 Image or Task 2 Spacer/Info */}
                    {taskType === 'Task 1' ? (
                      <div className={cn(PANEL, 'p-4')}>
                        <div className="flex items-center justify-between mb-3">
                          <h3
                            className={cn(
                              MICRO,
                              'text-stone-500 dark:text-stone-400 flex items-center gap-1.5'
                            )}
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Reference Image
                          </h3>
                          {tasks[taskType].image_url && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
                          )}
                        </div>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Paste Image URL here..."
                            value={tasks[taskType].image_url || ''}
                            onChange={(e) => updateTaskField(taskType, 'image_url', e.target.value)}
                          />
                          <div className="relative shrink-0">
                            <AdminButton variant="outline" className="group h-9 w-9 p-0">
                              <Upload className="h-3.5 w-3.5 text-stone-500 group-hover:scale-110 transition-transform" />
                              <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    setLoading(true);
                                    const { file_url } = await uploadToR2(file);
                                    if (file_url) {
                                      updateTaskField(taskType, 'image_url', file_url);
                                      toast.success('Image uploaded successfully');
                                    }
                                  } catch (err) {
                                    console.error('Upload failed', err);
                                    toast.error('Upload failed');
                                  } finally {
                                    setLoading(false);
                                  }
                                }}
                              />
                            </AdminButton>
                          </div>
                        </div>

                        <ImagePreview
                          imageUrl={tasks[taskType].image_url}
                          onClear={() => updateTaskField(taskType, 'image_url', '')}
                        />
                      </div>
                    ) : (
                      <div className={cn(PANEL, 'p-4')}>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-md grid place-items-center shrink-0 bg-stone-100 dark:bg-white/4 text-stone-500 dark:text-stone-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-stone-800 dark:text-stone-100 mb-1">
                              Essay Writing Tips
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                              For Task 2, providing a detailed sample answer helps students
                              understand the structure of a high-scoring essay. Focus on clear
                              arguments, logical paragraphing, and advanced vocabulary.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sample Answer */}
                    <div className={cn(PANEL, 'flex-1 flex flex-col min-h-[400px]')}>
                      <div className="p-3 pb-2 flex items-center justify-between border-b border-stone-200/80 dark:border-white/[0.07] mb-1">
                        <h3 className="text-xs font-extrabold flex items-center gap-1.5 text-stone-700 dark:text-stone-200">
                          <FileText className="w-3.5 h-3.5 text-stone-400" /> Model Answer
                        </h3>
                        {tasks[taskType].sample_answer && (
                          <span className={cn(PILL_BASE, pillTone('ok'), 'gap-1')}>
                            <ShieldCheck className="w-2.5 h-2.5" /> Band 9
                          </span>
                        )}
                      </div>
                      <div className="flex-1 p-0 overflow-hidden rounded-b-xl">
                        <style>{`
                          .sample-answer-editor-wrapper .ql-toolbar {
                            border-top: none;
                            border-left: none;
                            border-right: none;
                            background: transparent;
                            padding: 8px 12px;
                          }
                          .sample-answer-editor-wrapper .ql-container { font-size: 14px; }
                          .sample-answer-editor-wrapper .ql-editor {
                            min-height: 250px;
                            padding: 20px;
                            background: transparent;
                          }
                        `}</style>
                        <div className="sample-answer-editor-wrapper h-full">
                          <SampleAnswerEditor
                            value={tasks[taskType].sample_answer}
                            onChange={(val) => updateTaskField(taskType, 'sample_answer', val)}
                            placeholder="Write or paste the model answer here..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default WritingTestEditor;
