import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Save,
  X,
  PenTool,
  Clock,
  FileText,
  Sparkles,
  ImageIcon,
  Trash2,
  Info,
  ArrowLeft,
  Undo2,
  Redo2,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Link2,
  Upload,
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

// ... (Rest of imports and components remain unchanged)

// Inside WritingTestEditor render:

import { sanitizeHtml } from '@/lib/security';

// Reusing RichTextEditor with Theme Support (for prompts - uses ReactQuill)
const RichTextEditor = ({ value, onChange, placeholder, rows = 10, className = '', theme }) => {
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
      className={`
            bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 
            dark:from-slate-900 dark:via-orange-950/10 dark:to-amber-950/5 
            border border-orange-200/40 dark:border-orange-800/30 
            rounded-xl shadow-sm shadow-orange-500/5 dark:shadow-orange-900/10 
            hover:shadow-md hover:shadow-orange-500/10 
            transition-all duration-300 
            ${className} 
            ${theme?.border ? `border-${theme.border.split('-')[1]}` : ''}
        `}
      data-oid="lvo51.m"
    >
      <style data-oid="min-xbk">{`
        .ql-toolbar {
          background: linear-gradient(to right, rgba(254, 240, 138, 0.3), rgba(251, 191, 36, 0.2));
          border: none;
          border-bottom: 1px solid rgba(251, 146, 60, 0.3);
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 12px 16px;
        }
        .dark .ql-toolbar {
          background: linear-gradient(to right, rgba(154, 52, 18, 0.2), rgba(124, 45, 18, 0.3));
          border-bottom: 1px solid rgba(251, 146, 60, 0.2);
        }
        .ql-toolbar button {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(251, 146, 60, 0.2);
          border-radius: 6px;
          margin: 2px;
          width: 32px;
          height: 32px;
          transition: all 0.2s ease;
        }
        .dark .ql-toolbar button {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(251, 146, 60, 0.3);
        }
        .ql-toolbar button:hover {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(254, 215, 170, 0.2));
          border-color: rgba(251, 146, 60, 0.3);
          transform: scale(1.05);
          box-shadow: 0 1px 4px rgba(251, 146, 60, 0.15);
        }
        .dark .ql-toolbar button:hover {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.15));
          border-color: rgba(251, 146, 60, 0.4);
        }
        .ql-toolbar button.ql-active {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.3));
          border-color: rgba(251, 146, 60, 0.4);
          box-shadow: 0 1px 6px rgba(251, 146, 60, 0.2);
        }
        .dark .ql-toolbar button.ql-active {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(254, 215, 170, 0.2));
          border-color: rgba(251, 146, 60, 0.5);
        }
        .ql-toolbar .ql-picker {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(251, 146, 60, 0.2);
          border-radius: 6px;
        }
        .dark .ql-toolbar .ql-picker {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(251, 146, 60, 0.3);
        }
        .ql-toolbar .ql-picker:hover {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(254, 215, 170, 0.2));
          border-color: rgba(251, 146, 60, 0.3);
        }
        .ql-toolbar .ql-picker.ql-active {
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.2), rgba(254, 215, 170, 0.3));
          border-color: rgba(251, 146, 60, 0.4);
        }
        .ql-container {
          background: transparent;
          border: none;
          font-size: 16px;
          border-radius: 0 0 0.75rem 0.75rem;
        }
        .ql-editor {
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(4px);
          border-radius: 0 0 0.75rem 0.75rem;
          padding: 20px;
          min-height: 150px;
          transition: all 0.3s ease;
        }
        .dark .ql-editor {
          background: rgba(30, 41, 59, 0.3);
          backdrop-filter: blur(4px);
        }
        .ql-editor:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.5);
          box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.15);
        }
        .dark .ql-editor:focus {
          background: rgba(30, 41, 59, 0.5);
          box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.2);
        }
        .ql-editor.ql-blank::before {
          color: rgba(251, 146, 60, 0.5);
          font-style: italic;
        }
        .dark .ql-editor.ql-blank::before {
          color: rgba(251, 146, 60, 0.4);
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        className="h-full min-h-[150px]"
        placeholder={placeholder}
        data-oid="ly.f:7q"
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
    <div
      className="border rounded-xl bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 dark:from-slate-900 dark:via-amber-950/10 dark:to-orange-950/5 border-amber-200/40 dark:border-amber-800/30 shadow-sm overflow-hidden"
      data-oid="vjvl-4i"
    >
      <style data-oid="yh1.8ah">{`
        .sample-answer-editor .ql-toolbar {
          background: linear-gradient(to right, rgba(251, 191, 36, 0.15), rgba(249, 115, 22, 0.1));
          border: none;
          border-bottom: 1px solid rgba(251, 191, 36, 0.2);
          padding: 8px 12px;
        }
        .dark .sample-answer-editor .ql-toolbar {
          background: linear-gradient(to right, rgba(180, 83, 9, 0.2), rgba(154, 52, 18, 0.15));
          border-bottom: 1px solid rgba(251, 191, 36, 0.15);
        }
        .sample-answer-editor .ql-toolbar button {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 4px;
          margin: 1px;
          width: 28px;
          height: 28px;
          transition: all 0.2s ease;
        }
        .dark .sample-answer-editor .ql-toolbar button {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(251, 191, 36, 0.25);
        }
        .sample-answer-editor .ql-toolbar button:hover {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(249, 115, 22, 0.15));
          border-color: rgba(251, 191, 36, 0.4);
          transform: scale(1.05);
        }
        .sample-answer-editor .ql-toolbar button.ql-active {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(249, 115, 22, 0.2));
          border-color: rgba(251, 191, 36, 0.5);
        }
        .sample-answer-editor .ql-toolbar .ql-picker {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 4px;
        }
        .dark .sample-answer-editor .ql-toolbar .ql-picker {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(251, 191, 36, 0.25);
        }
        .sample-answer-editor .ql-container {
          background: transparent;
          border: none;
          font-size: 15px;
        }
        .sample-answer-editor .ql-editor {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(4px);
          padding: 16px;
          min-height: 150px;
          max-height: 400px;
          overflow-y: auto;
          line-height: 1.7;
        }
        .dark .sample-answer-editor .ql-editor {
          background: rgba(30, 41, 59, 0.3);
        }
        .sample-answer-editor .ql-editor:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.6);
          box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.2);
        }
        .dark .sample-answer-editor .ql-editor:focus {
          background: rgba(30, 41, 59, 0.5);
        }
        .sample-answer-editor .ql-editor.ql-blank::before {
          color: rgba(251, 191, 36, 0.5);
          font-style: italic;
        }
        .sample-answer-editor .ql-editor p {
          margin-bottom: 1em;
        }
        .sample-answer-editor .ql-editor h1,
        .sample-answer-editor .ql-editor h2,
        .sample-answer-editor .ql-editor h3 {
          font-weight: 700;
          margin-bottom: 0.75em;
        }
      `}</style>
      <div className="sample-answer-editor" data-oid="yr08836">
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={quillModules}
          placeholder={
            placeholder ||
            'Paste or type the sample answer here. Formatting (bold, headings, paragraphs) will be preserved.'
          }
          data-oid="uuak9rv"
        />
      </div>
      <div
        className="px-3 py-1.5 border-t border-amber-200/30 dark:border-amber-800/20 bg-amber-50/50 dark:bg-amber-950/20 text-[10px] text-amber-600 dark:text-amber-400"
        data-oid="_1ilrbf"
      >
        Tip: Paste formatted text directly - bold, headings, and paragraphs are preserved
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
    <div
      className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm overflow-hidden"
      data-oid=":.mac04"
    >
      <div
        className="flex items-center justify-between px-2 py-1.5 border-b bg-gray-50 dark:bg-slate-800 dark:border-slate-700"
        data-oid="h.dt_ux"
      >
        <div className="flex items-center gap-1" data-oid=":bg3sax">
          <div
            className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mr-2"
            data-oid="fi46rn-"
          >
            Instructions
          </div>
          {!isPreview && (
            <div
              className="flex items-center border-l pl-2 gap-1 border-slate-200 dark:border-slate-700"
              data-oid="zz_fakw"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('bold')}
                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Bold"
                data-oid="tewl7a."
              >
                <span className="font-bold text-xs" data-oid="iwqq8-r">
                  B
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('italic')}
                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Italic"
                data-oid="wws55wb"
              >
                <span className="italic text-xs" data-oid="8h06b2r">
                  I
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUrlModal(true)}
                className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Insert Image URL"
                data-oid="yii.2xm"
              >
                <Link2 className="w-3 h-3" data-oid="4m3ozjg" />
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          className="text-xs h-6 px-2 dark:text-slate-300 dark:hover:bg-slate-700"
          data-oid="8lwq64a"
        >
          {isPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>
      <div className="relative" data-oid="pmmt8h:">
        {isPreview ? (
          <div
            className="bg-white dark:bg-slate-900 overflow-y-auto min-h-[60px] p-2"
            style={{ whiteSpace: 'pre-wrap' }}
            data-oid="rbj-q:6"
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
            className="w-full border-0 rounded-none rounded-b-lg resize-none focus:ring-0 text-sm bg-white dark:bg-slate-950 dark:text-slate-200 font-mono min-h-[60px] p-3"
            style={{ whiteSpace: 'pre-wrap', overflow: 'hidden' }}
            data-oid="s5x3-0f"
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
                className="border rounded-lg p-2 bg-slate-50 dark:bg-slate-900 overflow-hidden text-center"
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
              className="bg-orange-600 hover:bg-orange-700 text-white"
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
      <div
        className="rounded-xl border border-dashed border-orange-300/40 dark:border-orange-700/30 bg-orange-50/30 dark:bg-orange-950/10 p-8 flex flex-col items-center justify-center text-center gap-2 text-orange-400/60 dark:text-orange-600/40"
        data-oid="nl3bn15"
      >
        <ImageIcon className="w-8 h-8 opacity-50" data-oid="6n7kbws" />
        <span className="text-xs font-medium" data-oid="blxk9jt">
          No image provided
        </span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className="rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 p-6 flex flex-col items-center justify-center text-center gap-3"
        data-oid=":8s.de9"
      >
        <div className="flex items-center gap-2 text-amber-500" data-oid=".scbi.f">
          <X className="w-5 h-5" data-oid="bgm6c4p" />
          <span className="text-sm font-medium" data-oid="obbc9p_">
            Image could not be loaded
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-100"
          data-oid="e_et_5w"
        >
          <Trash2 className="w-3 h-3 mr-1" data-oid="hhy9bzy" />
          Clear URL
        </Button>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-orange-200/40 dark:border-orange-800/30 bg-slate-100 dark:bg-slate-950/50 aspect-video flex items-center justify-center group"
      data-oid="wenfh-0"
    >
      <div
        className="absolute inset-0 bg-checkerboard opacity-10 pointer-events-none"
        data-oid="68svsfu"
      ></div>
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-200/50 dark:bg-slate-800/50 z-20"
          data-oid="b1y3suc"
        >
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" data-oid="1-2k-go" />
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
  // Use Orange theme if not provided
  // Use Orange theme if not provided
  const effectiveTheme = theme || {
    color: 'orange',
    primary: 'bg-orange-600',
    primaryHover: 'hover:bg-orange-700',
    light: 'bg-orange-50 dark:bg-orange-950/40',
    lighter: 'bg-orange-50/50 dark:bg-orange-950/20',
    border: 'border-orange-100 dark:border-orange-900',
    text: 'text-orange-700 dark:text-orange-300',
    icon: PenTool,
    gradient: 'from-orange-500 to-red-500',
    ring: 'ring-orange-500/20',
  };
  const ThemeIcon = effectiveTheme.icon || PenTool;
  const themeColor = effectiveTheme.color || 'orange';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Undo/Redo State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

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

  const [activeTask, setActiveTask] = useState('Task 1');

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    instructions: false,
    prompt: false,
    sampleAnswer: false,
    image: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Initialize
  useEffect(() => {
    if (initialData) {
      let parsedTasks = {};
      try {
        const content = initialData.content || '{}';
        const jsonContent = JSON.parse(content);
        if (jsonContent['Task 1'] || jsonContent['Task 2']) {
          parsedTasks = {
            'Task 1': jsonContent['Task 1'] || tasks['Task 1'],
            'Task 2': jsonContent['Task 2'] || tasks['Task 2'],
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
      } catch (e) {
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
      setHistory([initialState]);
      setHistoryIndex(0);
    } else {
      setHistory([{ tasks, meta }]);
      setHistoryIndex(0);
    }
  }, [initialData]);

  // History Tracking
  const addToHistory = useCallback(
    (newTasks, newMeta) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      const newEntry = { tasks: newTasks, meta: newMeta };
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
      setTasks(prev.tasks);
      setMeta(prev.meta);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIndex + 1];
      setTasks(next.tasks);
      setMeta(next.meta);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const updateTaskField = (taskType, field, value) => {
    const newTasks = { ...tasks, [taskType]: { ...tasks[taskType], [field]: value } };
    setTasks(newTasks);
    addToHistory(newTasks, meta);
  };

  const updateMeta = (field, value) => {
    const newMeta = { ...meta, [field]: value };
    setMeta(newMeta);
    addToHistory(tasks, newMeta);
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
        is_active: !silent, // Only set active on explicit save
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
      await onSave(dataToSave, silent);
      setLastSaved(new Date());
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

  // Auto-title for official Cambridge tests: Book number = year - 2005 (e.g., 2015 = IELTS 10)
  useEffect(() => {
    if (meta.is_official_cambridge) {
      const bookNumber = meta.cambridge_year - 2005;
      setMeta((prev) => ({
        ...prev,
        title: `IELTS ${bookNumber} Writing ${meta.cambridge_year} Test ${meta.cambridge_test_number}`,
      }));
    }
  }, [meta.is_official_cambridge, meta.cambridge_year, meta.cambridge_test_number]);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (meta.title && initialData?.id) handleSave(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [tasks, meta]);

  const years = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i + 1);

  return (
    <div
      className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 dark:from-background dark:via-orange-950/10 dark:to-amber-950/5 text-foreground rounded-xl overflow-hidden border border-orange-100/50 dark:border-orange-900/20"
      data-oid="xsm8q8:"
    >
      {/* Premium Header */}
      <div
        className={`px-6 py-4 bg-gradient-to-r from-white via-orange-50/80 to-amber-50/60 dark:from-slate-900/95 dark:via-orange-950/40 dark:to-amber-950/30 backdrop-blur-xl border-b border-orange-200/30 dark:border-orange-800/20 flex flex-col md:flex-row justify-between items-center shadow-sm shadow-orange-500/5 dark:shadow-orange-900/10 z-20 gap-4 ${effectiveTheme.border}`}
        data-oid="j7yn9hn"
      >
        <div className="flex items-center gap-4 flex-1 w-full overflow-x-auto" data-oid="19vxjkn">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="mr-2 shrink-0 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all duration-200 hover:scale-105"
            data-oid="julyjzw"
          >
            <ChevronUp className="h-5 w-5 -rotate-90 text-slate-500" data-oid="ww16tz_" />
          </Button>

          <div
            className={`p-2.5 rounded-xl shrink-0 bg-gradient-to-br ${effectiveTheme.light} ${effectiveTheme.text} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
            data-oid="ea1wcd0"
          >
            <effectiveTheme.icon className="w-5 h-5" data-oid="2:mti8c" />
          </div>

          <div className="flex flex-col gap-1.5 w-full max-w-3xl min-w-[300px]" data-oid="7djgqoa">
            <div className="flex gap-3 items-center" data-oid=".s.jg5j">
              <Input
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                className="font-bold text-xl border-transparent px-3 py-1.5 hover:border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all h-9 flex-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm dark:text-white dark:placeholder-slate-500 placeholder:text-slate-400 tracking-tight rounded-lg shadow-sm hover:shadow-md"
                placeholder="Untitled Writing Test"
                data-oid="48a4d3t"
              />

              {/* Metadata Pills */}
              <div className="flex items-center gap-2" data-oid=".:5cw:.">
                {/* Format Pill */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm hover:shadow-md transition-all duration-200 ${effectiveTheme.light} ${effectiveTheme.border} hover:scale-105`}
                  data-oid="c451f.k"
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider ${effectiveTheme.text}`}
                    data-oid="i:9yv54"
                  >
                    Format
                  </span>
                  <Select
                    value={meta.test_format}
                    onValueChange={(v) => setMeta({ ...meta, test_format: v })}
                    data-oid=":_jhlf5"
                  >
                    <SelectTrigger
                      className="h-4 w-auto gap-1 border-0 bg-transparent p-0 text-xs font-medium focus:ring-0 text-slate-700 dark:text-slate-200 hover:text-slate-900"
                      data-oid="8zedc7s"
                    >
                      <SelectValue data-oid="jceup9-" />
                    </SelectTrigger>
                    <SelectContent data-oid="1:z_j:l">
                      <SelectItem value="Academic" data-oid="h4_s7pf">
                        Academic
                      </SelectItem>
                      <SelectItem value="General" data-oid="v.wp63.">
                        General
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Access Pill */}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-200/40 dark:border-orange-800/30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                  data-oid="jayvf31"
                >
                  <span
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-500"
                    data-oid="w4m_2c_"
                  >
                    Access
                  </span>
                  <Select
                    value={meta.access_tier}
                    onValueChange={(v) => setMeta({ ...meta, access_tier: v })}
                    data-oid="7r6wtjd"
                  >
                    <SelectTrigger
                      className="h-4 w-auto gap-1 border-0 bg-transparent p-0 text-xs font-medium focus:ring-0 text-slate-700 dark:text-slate-200 hover:text-slate-900"
                      data-oid="edtqrnk"
                    >
                      <SelectValue data-oid="f2kr6ik" />
                    </SelectTrigger>
                    <SelectContent data-oid="mzh59ut">
                      <SelectItem value="free" data-oid="41bg0ci">
                        Free
                      </SelectItem>
                      <SelectItem value="pro" data-oid="sh3y--j">
                        Pro
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Official Pill */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm hover:shadow-md transition-all duration-200 ${meta.is_official_cambridge ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-700 hover:from-amber-100 hover:to-orange-100' : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-orange-200/40 dark:border-orange-800/30 hover:border-orange-300'} hover:scale-105`}
                  data-oid="qdkw6qi"
                >
                  <div className="flex items-center gap-1.5" data-oid="qu3gdxm">
                    <ShieldCheck
                      className={`w-3.5 h-3.5 ${meta.is_official_cambridge ? 'text-amber-500' : 'text-slate-400'}`}
                      data-oid="7ub-jhl"
                    />

                    <span
                      className={`text-xs font-medium ${meta.is_official_cambridge ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500'}`}
                      data-oid="vpt3:td"
                    >
                      Official
                    </span>
                  </div>
                  <Checkbox
                    checked={meta.is_official_cambridge}
                    onCheckedChange={(c) => setMeta({ ...meta, is_official_cambridge: c })}
                    className={`h-4 w-4 rounded-full ${meta.is_official_cambridge ? 'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500' : ''}`}
                    data-oid="nmigtgc"
                  />
                </div>

                {meta.is_official_cambridge && (
                  <div
                    className="flex gap-2 animate-in fade-in slide-in-from-left-2 shrink-0"
                    data-oid="0nqum_w"
                  >
                    <Select
                      value={String(meta.cambridge_year)}
                      onValueChange={(v) => setMeta({ ...meta, cambridge_year: parseInt(v) })}
                      data-oid="7yxrb7q"
                    >
                      <SelectTrigger
                        className="h-8 rounded-full border-amber-200 bg-amber-50/50 text-xs font-medium text-amber-900"
                        data-oid="rty-xsy"
                      >
                        <SelectValue placeholder="Year" data-oid="8x-q5be" />
                      </SelectTrigger>
                      <SelectContent data-oid="3g.a:41">
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)} data-oid="9sz5ae.">
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={String(meta.cambridge_test_number)}
                      onValueChange={(v) =>
                        setMeta({ ...meta, cambridge_test_number: parseInt(v) })
                      }
                      data-oid="s:.xffj"
                    >
                      <SelectTrigger
                        className="h-8 rounded-full border-amber-200 bg-amber-50/50 text-xs font-medium text-amber-900"
                        data-oid="3lqbktu"
                      >
                        <SelectValue placeholder="Test #" data-oid="x7eywhh" />
                      </SelectTrigger>
                      <SelectContent data-oid="-u4prwg">
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={String(num)} data-oid="f:rzdbw">
                            Test {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto" data-oid="ee1fog7">
          <div
            className="flex items-center gap-1 mr-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 p-1 rounded-lg shadow-sm"
            data-oid="cndgdl3"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-7 w-7 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-200/50 dark:hover:bg-orange-800/30 disabled:opacity-30 transition-all duration-200"
              data-oid=":luzncx"
            >
              <Undo2 className="w-4 h-4" data-oid="27id.os" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-7 w-7 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-200/50 dark:hover:bg-orange-800/30 disabled:opacity-30 transition-all duration-200"
              data-oid=".h.tmvs"
            >
              <Redo2 className="w-4 h-4" data-oid=".hoez18" />
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={onCancel}
            className="hidden md:flex hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-all duration-200"
            data-oid="au5tvxe"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={loading}
            className={`shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 ${effectiveTheme.primary} ${effectiveTheme.primaryHover} text-white w-full md:w-auto h-9`}
            data-oid="tfwz:et"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-4" data-oid="hyq5wv:">
          <AlertDescription data-oid="nt6ojvq">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-white/40 via-orange-50/20 to-amber-50/10 dark:from-slate-900/40 dark:via-orange-950/10 dark:to-amber-950/5 backdrop-blur-sm"
        data-oid="96xhrye"
      >
        <div className="w-full max-w-[1800px] mx-auto" data-oid="4:6nw0x">
          <Tabs
            value={activeTask}
            onValueChange={setActiveTask}
            className="w-full space-y-4"
            data-oid="-tkhi1n"
          >
            {/* Enhanced Tabs UI */}
            <TabsList
              className="h-14 bg-gradient-to-br from-white via-orange-50/60 to-amber-50/40 dark:from-slate-900 dark:via-orange-950/30 dark:to-amber-950/20 backdrop-blur-2xl border border-orange-200/30 dark:border-orange-800/25 rounded-3xl p-3 shadow-xl shadow-orange-500/8 dark:shadow-orange-900/15 grid w-full grid-cols-2 max-w-lg mx-auto mb-10 relative overflow-hidden group gap-2"
              data-oid="yc2flwg"
            >
              {/* Decorative gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                data-oid="isxhf8l"
              ></div>

              {/* Active tab indicator */}
              <div
                className={`absolute top-3 left-3 right-3 h-8 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-400/10 dark:to-amber-400/10 rounded-2xl transition-all duration-300 pointer-events-none`}
                style={{
                  transform:
                    activeTask === 'Task 1' ? 'translateX(0)' : 'translateX(calc(100% + 12px))',
                  width: 'calc(50% - 12px)',
                }}
                data-oid="w7ydwl2"
              ></div>

              <TabsTrigger
                value="Task 1"
                className="relative text-xs font-semibold rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:border-orange-400 data-[state=inactive]:text-orange-700 dark:data-[state=inactive]:text-orange-300 data-[state=inactive]:hover:text-orange-900 dark:data-[state=inactive]:hover:text-orange-100 data-[state=inactive]:hover:bg-orange-200/50 dark:data-[state=inactive]:hover:bg-orange-800/30 group hover:scale-105 z-10 mx-1"
                data-oid="w2i80b."
              >
                <span className="flex items-center gap-2" data-oid="1r64-b6">
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all duration-300 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 group-data-[state=inactive]:scale-95 group-data-[state=active]:scale-100"
                    data-oid="---.ltc"
                  >
                    1
                  </span>
                  <div className="flex flex-col items-start" data-oid="vwd8fxq">
                    <span className="font-semibold text-xs leading-tight" data-oid="4iv:8jf">
                      Task 1
                    </span>
                    <span
                      className="text-[10px] opacity-70 leading-tight hidden sm:inline"
                      data-oid="7phm:6t"
                    >
                      Report/Letter
                    </span>
                  </div>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="Task 2"
                className="relative text-xs font-semibold rounded-2xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-orange-500/25 data-[state=active]:border-orange-400 data-[state=inactive]:text-orange-700 dark:data-[state=inactive]:text-orange-300 data-[state=inactive]:hover:text-orange-900 dark:data-[state=inactive]:hover:text-orange-100 data-[state=inactive]:hover:bg-orange-200/50 dark:data-[state=inactive]:hover:bg-orange-800/30 group hover:scale-105 z-10 mx-1"
                data-oid="ok6t:5c"
              >
                <span className="flex items-center gap-2" data-oid="sw2xde6">
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all duration-300 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 group-data-[state=inactive]:scale-95 group-data-[state=active]:scale-100"
                    data-oid="i_7uam."
                  >
                    2
                  </span>
                  <div className="flex flex-col items-start" data-oid="es-_i05">
                    <span className="font-semibold text-xs leading-tight" data-oid="0q819:s">
                      Task 2
                    </span>
                    <span
                      className="text-[10px] opacity-70 leading-tight hidden sm:inline"
                      data-oid="ucipevq"
                    >
                      Essay
                    </span>
                  </div>
                </span>
              </TabsTrigger>
            </TabsList>

            {['Task 1', 'Task 2'].map((taskType) => (
              <TabsContent
                key={taskType}
                value={taskType}
                className="space-y-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
                data-oid="4-.ams-"
              >
                <div
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-full"
                  data-oid="poz5ap9"
                >
                  {/* Left Column: Instructions & Prompt - Takes 7/12 width */}
                  <div className="lg:col-span-7 space-y-4 flex flex-col" data-oid="ejnfktw">
                    {/* Instructions */}
                    <div
                      className="bg-white/50 dark:bg-slate-900/50 border border-orange-200/40 dark:border-orange-800/30 rounded-2xl shadow-md shadow-orange-500/5 backdrop-blur-sm p-5 relative group transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
                      data-oid="_b7prj-"
                    >
                      <div className="flex items-center justify-between mb-3" data-oid="ot:uqrr">
                        <h3
                          className="text-xs font-bold flex items-center gap-2 text-orange-700 dark:text-orange-300 uppercase tracking-widest"
                          data-oid="udphzmz"
                        >
                          <Info className="w-3.5 h-3.5" data-oid="sz5_mdu" /> Instructions
                        </h3>
                        {tasks[taskType].instructions && (
                          <div
                            className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            data-oid="8cq:d4v"
                          ></div>
                        )}
                      </div>
                      <div className="relative" data-oid="mqx7sb:">
                        <InstructionEditor
                          value={tasks[taskType].instructions}
                          onChange={(val) => updateTaskField(taskType, 'instructions', val)}
                          placeholder="Enter brief instructions about time and word count..."
                          data-oid="0uhkwnl"
                        />
                      </div>
                    </div>

                    {/* Prompt */}
                    <div
                      className="bg-white dark:bg-slate-900 border border-orange-200/40 dark:border-orange-800/30 rounded-2xl shadow-lg shadow-orange-500/10 p-1 flex flex-col min-h-fit"
                      data-oid="nxb:zc2"
                    >
                      <div
                        className="p-4 pb-2 flex items-center justify-between border-b border-orange-100/50 dark:border-orange-900/20 mb-1"
                        data-oid="2s-oiw:"
                      >
                        <h3
                          className="text-sm font-bold flex items-center gap-2 text-orange-700 dark:text-orange-300"
                          data-oid="0re0f3h"
                        >
                          <PenTool className="w-4 h-4" data-oid="xy46itw" /> Task Prompt
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40 text-[10px] uppercase"
                          data-oid="mxjb4ml"
                        >
                          Required
                        </Badge>
                      </div>
                      <div className="flex-1 p-2" data-oid=":wy77xs">
                        <RichTextEditor
                          theme={effectiveTheme}
                          value={tasks[taskType].prompt}
                          onChange={(val) => updateTaskField(taskType, 'prompt', val)}
                          className="border-0 shadow-none !bg-transparent min-h-[150px]"
                          placeholder={`Write the ${taskType} question here...`}
                          data-oid="bpbs8i8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image & Sample Answer - Takes 5/12 width */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col h-full" data-oid="hipp.xx">
                    {/* Task 1 Image or Task 2 Spacer/Info */}
                    {taskType === 'Task 1' ? (
                      <div
                        className="bg-white/50 dark:bg-slate-900/50 border border-orange-200/40 dark:border-orange-800/30 rounded-2xl shadow-md shadow-orange-500/5 backdrop-blur-sm p-5 transition-all duration-300"
                        data-oid="e0fhafr"
                      >
                        <div className="flex items-center justify-between mb-4" data-oid="fjejsi6">
                          <h3
                            className="text-xs font-bold flex items-center gap-2 text-orange-700 dark:text-orange-300 uppercase tracking-widest"
                            data-oid="gnt7_8s"
                          >
                            <ImageIcon className="w-3.5 h-3.5" data-oid="d-dm1wd" /> Reference Image
                          </h3>
                          {tasks[taskType].image_url && (
                            <div
                              className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              data-oid="1r21eyo"
                            ></div>
                          )}
                        </div>
                        <div className="flex gap-2 mb-3">
                          <Input
                            placeholder="Paste Image URL here..."
                            value={tasks[taskType].image_url}
                            onChange={(e) => updateTaskField(taskType, 'image_url', e.target.value)}
                            className="bg-white/80 dark:bg-slate-950/50 border-orange-200/50 dark:border-orange-800/40 focus:ring-orange-500/20"
                            data-oid="sq_n1tn"
                          />
                          <div className="relative">
                            <Button
                              variant="outline"
                              size="icon"
                              className="group shrink-0 border-orange-200/50 dark:border-orange-800/40 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <Upload className="h-4 w-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
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
                            </Button>
                          </div>
                        </div>

                        <ImagePreview
                          imageUrl={tasks[taskType].image_url}
                          onClear={() => updateTaskField(taskType, 'image_url', '')}
                          data-oid="jb-rua-"
                        />
                      </div>
                    ) : (
                      <div
                        className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl p-5 shadow-sm"
                        data-oid="0bpukf6"
                      >
                        <div className="flex gap-3" data-oid="-bff0mq">
                          <div
                            className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg h-fit text-indigo-600 dark:text-indigo-400"
                            data-oid="0:p7tx8"
                          >
                            <Sparkles className="w-5 h-5" data-oid="bnm::pq" />
                          </div>
                          <div data-oid="r09mhzi">
                            <h4
                              className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-1"
                              data-oid="_jq2yzn"
                            >
                              Essay Writing Tips
                            </h4>
                            <p
                              className="text-xs text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed"
                              data-oid="slelgm9"
                            >
                              For Task 2, providing a detailed sample answer helps students
                              understand the structure of a high-scoring essay. Focus on clear
                              arguments, logical paragraphing, and advanced vocabulary.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sample Answer */}
                    <div
                      className="bg-white dark:bg-slate-900 border border-orange-200/40 dark:border-orange-800/30 rounded-2xl shadow-lg shadow-orange-500/10 flex-1 flex flex-col min-h-[400px]"
                      data-oid=".prf.8b"
                    >
                      <div
                        className="p-4 pb-2 flex items-center justify-between border-b border-orange-100/50 dark:border-orange-900/20 mb-1"
                        data-oid="pvqv89i"
                      >
                        <h3
                          className="text-sm font-bold flex items-center gap-2 text-orange-700 dark:text-orange-300"
                          data-oid="o:736o-"
                        >
                          <FileText className="w-4 h-4" data-oid="7s--kot" /> Model Answer
                        </h3>
                        {tasks[taskType].sample_answer && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 text-[10px] uppercase flex items-center gap-1"
                            data-oid="8ftziqm"
                          >
                            <ShieldCheck className="w-3 h-3" data-oid="ndh9nf8" /> Band 9
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 p-0 overflow-hidden rounded-b-2xl" data-oid="a1do7tx">
                        <style jsx data-oid="-jgpff8">{`
                          /* Override styles specifically for this instance to fit the container better */
                          .sample-answer-editor-wrapper .ql-toolbar {
                            border-top: none;
                            border-left: none;
                            border-right: none;
                            background: transparent;
                            padding: 8px 12px;
                          }
                          .sample-answer-editor-wrapper .ql-container {
                            font-size: 14px;
                          }
                          .sample-answer-editor-wrapper .ql-editor {
                            min-height: 250px;
                            padding: 20px;
                            background: transparent;
                          }
                        `}</style>
                        <div className="sample-answer-editor-wrapper h-full" data-oid="hnxk:q_">
                          <SampleAnswerEditor
                            value={tasks[taskType].sample_answer}
                            onChange={(val) => updateTaskField(taskType, 'sample_answer', val)}
                            placeholder="Write or paste the model answer here..."
                            data-oid="koxbb8u"
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
