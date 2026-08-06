import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { sanitizeHtml } from '@/lib/security';
import { cn } from '@/lib/cn';
import { ADMIN_TABS_LIST, ADMIN_TAB_TRIGGER } from '../../ui/primitives';
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  Bold,
  Italic,
  Link2,
  Edit3,
  Eye,
  Music,
  Upload,
  LayoutGrid,
  FileText,
  ListChecks,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Headphones,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { uploadToR2 } from '@/lib/r2';
import { normalizeSrtContent } from '@/utils/parseSrt';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import MatchingFeaturesBuilder from '../builders/MatchingFeaturesBuilder';
import MapLabelingBuilder from '../builders/MapLabelingBuilder';
import TestEditorHeader from './TestEditorHeader';
import TableBuilder from '../builders/TableBuilder';
import GapFillBuilder from '../builders/GapFillBuilder';
import StaticTextBuilder from '../builders/StaticTextBuilder';
import FlowchartBuilder from '../builders/FlowchartBuilder';
import BulkImportModal from '../BulkImportModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// --- Helper: Audio Uploader ---
const AudioUploader = ({ url, onUrlChange }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Use R2 for upload
      const result = await uploadToR2(file);
      const finalUrl = result?.file_url;

      if (!finalUrl) throw new Error('Failed to retrieve file URL');

      onUrlChange(finalUrl);
      toast.success('Audio uploaded to R2 successfully!');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'Upload failed';
      setError(msg);
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border p-5 flex flex-col items-center justify-center transition-all duration-200 gap-3 text-center group',
          error
            ? 'border-rose-500/30 bg-rose-500/6 dark:border-rose-400/30 dark:bg-rose-950/20'
            : url
              ? 'border-[#5a63df]/30 bg-linear-to-b from-white to-[#faf9ff] dark:border-white/8 dark:from-[#141319] dark:to-[#100f15]'
              : 'border-dashed border-[#e4e2f0] dark:border-white/10 bg-linear-to-b from-white to-[#faf9ff] dark:from-[#141319] dark:to-[#100f15] hover:border-[#5a63df]/40'
        )}
      >
        {uploading ? (
          <div className="py-6 flex flex-col items-center">
            <div className="w-10 h-10 border-3 border-[#5a63df] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
              Uploading...
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Preparing listening audio source
            </p>
          </div>
        ) : url ? (
          <div className="w-full relative animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[13px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100 uppercase block">
                  Source Active
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px] block font-medium">
                  {url.split('/').pop()}
                </span>
              </div>
            </div>

            <div className="bg-[#f4f3fb] dark:bg-white/4 rounded-xl p-2.5 border border-[#ebeaf7] dark:border-white/10 mb-4">
              <audio key={url} controls src={url} className="w-full h-9 rounded-lg" />
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('audio-upload-input').click()}
                className="text-[10px] uppercase font-extrabold tracking-wider h-8 px-3 rounded-lg border-[#5a63df]/30 bg-[#5a63df]/8 text-[#5a63df] hover:bg-[#5a63df] hover:text-white dark:text-[#a9afff] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:hover:bg-[#8f97ff] dark:hover:text-[#0b0c10] transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Replace
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onUrlChange('')}
                className="text-[10px] uppercase font-extrabold tracking-wider h-8 px-3 rounded-lg border border-rose-500/30 bg-rose-500/8 text-rose-600 dark:text-rose-300 dark:border-rose-400/30 dark:bg-rose-400/15 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'p-4 rounded-xl mb-0.5 transition-all duration-200 group-hover:scale-105',
                error
                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                  : 'border border-[#5a63df]/25 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#8f97ff]/30 dark:bg-[#8f97ff]/15 dark:text-[#a9afff]'
              )}
            >
              {error ? <X className="w-7 h-7" /> : <Music className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Audio Source
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.14em] mt-0.5">
                Drag files or click browse
              </p>
            </div>

            {error && (
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 animate-bounce">
                {error}
              </div>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => document.getElementById('audio-upload-input').click()}
              className="mt-1 bg-[#5a63df] hover:bg-[#4850c8] text-white font-extrabold text-[10px] uppercase tracking-wider px-5 h-8 rounded-lg transition-all active:scale-95 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Select MP3 / WAV
            </Button>
          </>
        )}

        <input
          id="audio-upload-input"
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Fallback URL Input */}
      {!uploading && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              URL
            </span>
          </div>
          <Input
            placeholder="https://source-link.mp3"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="pl-12 text-[11px] font-mono h-9 bg-white dark:bg-[#131315] text-slate-800 dark:text-slate-200 border-[#e4e2f0] dark:border-white/8 hover:border-[#5a63df]/30 dark:hover:border-white/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

// --- Instruction Editor Component ---
const InstructionEditor = ({ value, onChange, placeholder }) => {
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

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
        <div className="text-gray-400 italic text-sm" data-oid="y4yt_23">
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
      <div className="prose prose-sm max-w-none dark:prose-invert" data-oid="j:p11os">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedText) }} data-oid="c7z4div" />
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

    // Selection logic for after the change
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
      className="border border-stone-200/80 dark:border-white/[0.07] rounded-2xl bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
      data-oid="rx8pzb:"
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-stone-200/80 dark:border-white/[0.07] bg-stone-50/50 dark:bg-white/2"
        data-oid="nd2jlqp"
      >
        <div className="flex items-center gap-2" data-oid=":87yj1b">
          <div
            className="text-[10px] text-stone-500 dark:text-stone-400 font-black uppercase tracking-widest mr-2"
            data-oid="vtw9hy8"
          >
            Instructions
          </div>
          {!isPreview && (
            <div
              className="flex items-center border-l pl-3 gap-1.5 border-stone-200 dark:border-stone-700"
              data-oid="skw9dsd"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('bold')}
                className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-stone-700 shadow-sm border border-transparent hover:border-stone-200"
                title="Bold"
                data-oid="8ch--_k"
              >
                <Bold className="w-3.5 h-3.5" data-oid="6js5ao5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormat('italic')}
                className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-stone-700 shadow-sm border border-transparent hover:border-stone-200"
                title="Italic"
                data-oid="t5tovpa"
              >
                <Italic className="w-3.5 h-3.5" data-oid="hn7-q0o" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUrlModal(true)}
                className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-stone-700 shadow-sm border border-transparent hover:border-stone-200"
                title="Insert Image URL"
                data-oid="de12h3k"
              >
                <Link2 className="w-3.5 h-3.5" data-oid="lbmu.dz" />
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          className={`text-[10px] h-7 px-3 rounded-lg font-black uppercase tracking-widest transition-all ${
            isPreview
              ? 'bg-stone-600 text-white hover:bg-stone-700 shadow-md'
              : 'bg-white dark:bg-[#18181b] text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/8 border border-stone-200 dark:border-white/10 shadow-sm'
          }`}
          data-oid="n1_hor9"
        >
          {isPreview ? (
            <Edit3 className="w-3 h-3 mr-1.5" data-oid="-4pmivu" />
          ) : (
            <Eye className="w-3 h-3 mr-1.5" data-oid="q89fiqn" />
          )}
          {isPreview ? 'Edit' : 'Preview'}
        </Button>
      </div>
      <div className="relative" data-oid="xnciqeo">
        {isPreview ? (
          <div
            className="bg-white dark:bg-stone-900 overflow-y-auto min-h-[60px] p-2"
            style={{ whiteSpace: 'pre-wrap' }}
            data-oid="hl-5od."
          >
            {renderSimplePreview(value || '')}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="border-0 rounded-none rounded-b-lg resize-none focus:ring-0 text-sm bg-white dark:bg-stone-950 dark:text-stone-200 font-mono min-h-[60px]"
            style={{ whiteSpace: 'pre-wrap', overflow: 'hidden' }}
            data-oid="oedrp2a"
          />
        )}
      </div>

      {/* Image URL Modal */}
      <AlertDialog open={showImageUrlModal} onOpenChange={setShowImageUrlModal} data-oid="tchkvxr">
        <AlertDialogContent className="sm:max-w-md" data-oid="pub.wmo">
          <AlertDialogHeader data-oid="-66r10:">
            <AlertDialogTitle data-oid="p.lc_ek">Insert Image URL</AlertDialogTitle>
            <AlertDialogDescription data-oid="xgrxf-v">
              Paste the direct URL of the image you want to insert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4" data-oid="gjb8fv-">
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
              data-oid="m_cf:n3"
            />

            {imageUrlInput && (
              <div
                className="border rounded-lg p-2 bg-stone-50 dark:bg-stone-900 overflow-hidden text-center"
                data-oid="ej3p:_m"
              >
                <p
                  className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold"
                  data-oid="d1gwd.k"
                >
                  Preview
                </p>
                <img
                  src={imageUrlInput}
                  alt="Preview"
                  className="max-h-40 mx-auto object-contain rounded"
                  onError={(e) => (e.target.style.display = 'none')}
                  data-oid="l3xv7qp"
                />
              </div>
            )}
          </div>
          <AlertDialogFooter data-oid="_im_e0l">
            <AlertDialogCancel onClick={() => setImageUrlInput('')} data-oid="j14xm2_">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInsertImageUrl}
              className="bg-stone-600 hover:bg-stone-700"
              disabled={!imageUrlInput}
              data-oid="z_y480v"
            >
              Insert Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Count Utility ---
const getQuestionCount = (q) => {
  if (q.type === 'static_text') return 0;
  if (q.type === 'gap_fill') {
    // First check if question_count is explicitly set
    if (q.gap_fill?.question_count) return parseInt(q.gap_fill.question_count) || 0;
    // Fallback: count [gap] markers in text
    const text = q.gap_fill?.text || q.gap_fill?.content || '';
    const matches = text.match(/\[gap\]/gi);
    return matches ? matches.length : 0;
  }
  if (q.type === 'map_labeling' && q.map_labeling?.questions)
    return q.map_labeling.questions.length || 0;
  if (q.type === 'matching_features') {
    if (q.matching_features?.mode === 'paragraph' && q.matching_features.answers)
      return Object.keys(q.matching_features.answers).length || 0;
    else if (q.matching_features?.questions) return q.matching_features.questions.length || 0;
    if (q.matching_features?.mode === 'paragraph' && q.matching_features.text) {
      const matches = q.matching_features.text.match(/\[(\d+)\]/g);
      return matches ? matches.length : 0;
    }
    return 1;
  }
  if (q.type === 'table_completion') {
    // First check explicit blanks array
    if (q.table_data?.blanks?.length) return q.table_data.blanks.length;
    // Fallback: count [gap] markers and empty cells in table rows
    const rows = q.table_data?.table_rows || q.table_data?.rows || [];
    let count = 0;
    rows.forEach((row) => {
      row.forEach((cell) => {
        // Count [gap] markers
        const gapMatches = cell.match(/\[gap\]|__BLANK__|__BLANK_\d+__/gi);
        if (gapMatches) count += gapMatches.length;
        // Also count empty cells as potential gaps
        else if (cell.trim() === '') count += 1;
      });
    });
    return count || 0;
  }
  if (q.type === 'flowchart' && q.flowchart?.steps) {
    return (
      q.flowchart.steps.reduce(
        (acc, step) => acc + (step.text.match(/\[gap\]/g) || []).length,
        0
      ) || 0
    );
  }
  if (q.type === 'multiple_choice' && q.allow_multiple) return parseInt(q.question_count || 1);
  return 1;
};

const ListeningTestEditor = ({ initialData, onSave, onCancel, theme }) => {
  const effectiveTheme = theme || { icon: Headphones };
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

  const initialSectionsState = () => {
    if (initialData?.content) {
      try {
        const parsed =
          typeof initialData.content === 'string'
            ? JSON.parse(initialData.content)
            : initialData.content;
        if (Array.isArray(parsed))
          return parsed.map((s) => ({
            ...s,
            groups: (s.question_groups || []).map((g) => ({
              ...g,
              isCollapsed: g.isCollapsed ?? false,
            })),
          }));
      } catch (e) {
        console.error('Content parse error', e);
      }
    }
    // Draft loading removed to ensure new test creation starts blank
    /* if (!initialData && typeof localStorage !== 'undefined') { ... } */
    return Array(4)
      .fill(null)
      .map((_, i) => ({
        id: i + 1,
        title: `Part ${i + 1}`,
        audio_url: '',
        transcript: '',
        groups: [],
      }));
  };

  const [sections, setSections] = useHistory(initialSectionsState());

  const [activeTab, setActiveTab] = useState('0');
  const [meta, setMeta] = useState(() => {
    // Try loading draft meta if creating new
    // Draft loading removed
    /* if (!initialData && typeof localStorage !== 'undefined') { ... } */
    return {
      title: initialData?.title || '',
      tier: initialData?.access_tier || 'free',
      is_official_cambridge: initialData?.is_official_cambridge || false,
      cambridge_year: initialData?.cambridge_year || new Date().getFullYear(),
      cambridge_test_number: initialData?.cambridge_test_number || 1,
    };
  });
  const [saving, setSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [bulkImportConfig, setBulkImportConfig] = useState({ isOpen: false, mode: 'full' });

  // Auto-title: Book number = year - 2005 (e.g., 2015 = IELTS 10)
  useEffect(() => {
    if (meta.is_official_cambridge) {
      const bookNumber = meta.cambridge_year - 2005;
      setMeta((prev) => ({
        ...prev,
        title: `IELTS ${bookNumber} Listening ${meta.cambridge_year} Test ${meta.cambridge_test_number}`,
      }));
    }
  }, [meta.is_official_cambridge, meta.cambridge_year, meta.cambridge_test_number]);

  // Auto-save Effect
  useEffect(() => {
    if (!initialData) {
      // Only auto-save for new tests to avoid overwriting existing data with local draft issues
      const timer = setTimeout(() => {
        localStorage.setItem(
          'listening_test_draft',
          JSON.stringify({ sections, meta, timestamp: Date.now() })
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sections, meta, initialData]);

  const startNumbers = useMemo(() => {
    const map = {};
    let counter = 1;
    sections.forEach((s, sIdx) => {
      s.groups.forEach((g, gIdx) => {
        map[`${sIdx}-${gIdx}`] = counter;
        g.questions.forEach((q) => (counter += getQuestionCount(q)));
      });
    });
    return map;
  }, [sections]);

  const handleGroupReorder = (newGroups) => {
    setSections((prev) => {
      const newSections = [...prev];
      if (!newSections[activeTab]) return prev;
      newSections[activeTab].groups = newGroups;
      return newSections;
    });
  };

  // Flattened questions for bulk answer import
  const flattenedQuestionsForImport = useMemo(() => {
    if (bulkImportConfig.mode !== 'answers_only') return [];

    let currentNum = 1;
    return sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.questions.map((q) => {
          const qWithNum = { ...q, question_number: currentNum };
          currentNum += getQuestionCount(q);
          return qWithNum;
        })
      )
    );
  }, [sections, bulkImportConfig.mode]);

  const handleSave = async () => {
    if (!meta.title) return toast.error('Title required');
    setSaving(true);
    try {
      let allQuestions = [];
      let qCounter = 1;
      const content = sections.map((s, sIdx) => ({
        section_number: sIdx + 1,
        title: s.title,
        audio_url: s.audio_url,
        transcript: sanitizeHtml(s.transcript),
        srt_content: sanitizeHtml(s.srt_content || ''),
        question_groups: (s.groups || []).map((g) => ({
          ...g,
          instructions: sanitizeHtml(g.instructions),
        })),
      }));

      sections.forEach((s, sIdx) => {
        s.groups.forEach((g) => {
          g.questions.forEach((q) => {
            const count = getQuestionCount(q);

            // Pass 'q' directly (including temp ID) so useTestSaving knows it's new
            // Ensure question_text has a fallback for complex types (NOT NULL constraint)
            const questionData = {
              ...q,
              question_text: q.question_text || q.type?.replace('_', ' ') || 'See attached data',
              passage_id: initialData?.id,
              question_number: qCounter,
              section: sIdx + 1,
              group_instructions: g.instructions,
            };

            // Inject title into first question of the group so ListeningTest can group properly
            if (q === g.questions[0] && g.title) {
              questionData.mcq_title = g.title;
            }

            allQuestions.push(questionData);
            qCounter += count;
          });
        });
      });

      // Revert to JSON.stringify(content) since explicit Object failed (implies DB expects string)
      // Also grabbing first non-empty audio_url as main audio
      const mainAudio = sections.find((s) => s.audio_url)?.audio_url || '';

      await onSave({
        passage: {
          ...initialData,
          title: meta.title,
          test_format: 'listening', // Required by DB (NOT NULL)
          topic: 'general', // Required by DB (NOT NULL)
          access_tier: meta.tier,
          is_official_cambridge: meta.is_official_cambridge,
          cambridge_year: meta.is_official_cambridge ? parseInt(meta.cambridge_year) : null,
          cambridge_test_number: meta.is_official_cambridge
            ? parseInt(meta.cambridge_test_number)
            : null,
          content: JSON.stringify(content),
          test_type: 'listening',
          audio_url: mainAudio,
        },
        questions: allQuestions,
      });
    } catch (e) {
      console.error(e);
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTranscribe = async () => {
    const currentSection = sections[Number(activeTab)];

    if (!currentSection.audio_url) {
      toast.error('Please upload an audio file or enter a URL first');
      return;
    }

    setTranscribing(true);
    const toastId = toast.loading('Generating transcript... This may take a few minutes.');

    try {
      // Dynamic import removed - using singleton
      // const { createClient } = await import('@supabase/supabase-js');
      // const supabase = createClient(...)

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      let requestBody = { audioUrl: currentSection.audio_url };

      try {
        // Client-side fetch prevents network isolation issues (container vs localhost)
        const response = await fetch(currentSection.audio_url);
        if (response.ok) {
          const blob = await response.blob();
          if (blob.size < 6 * 1024 * 1024) {
            // Limit to ~6MB for direct payload
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result.split(',')[1]);
            });
            reader.readAsDataURL(blob);
            const base64 = await base64Promise;
            requestBody = {
              audioBase64: base64,
              mimeType: blob.type,
            };
          }
        }
      } catch (e) {
        console.warn('Client-side fetch failed, falling back to server-side URL fetch', e);
      }

      const { data, error } = await supabase.functions.invoke('transcribeAudio', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Supabase function invocation error (e.g. network, 500)
        console.error('Edge Function invocation error:', error);
        // Try to parse error body if it's a stringified JSON
        try {
          const parsed = typeof error === 'string' ? JSON.parse(error) : error;
          const msg = parsed.error || parsed.message || 'Unknown function error';
          throw new Error(`Example Error: ${msg}`);
        } catch {
          throw new Error(error.message || 'Function invocation failed');
        }
      }

      if (!data.success) {
        // Function returned logical error
        console.error('Transcription logical error:', data);
        throw new Error(data.error || 'Transcription failed');
      }

      updateSection(Number(activeTab), 'srt_content', normalizeSrtContent(data.transcript));
      toast.success('Transcript generated successfully!', { id: toastId });
    } catch (err) {
      console.error('Transcription error details:', err);
      toast.error(`Error: ${err.message}. Check console for details.`, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setTranscribing(false);
    }
  };

  const updateSection = (idx, field, val) => {
    setSections((prev) => {
      const n = [...prev];
      if (!n[idx]) return prev;
      n[idx] = { ...n[idx], [field]: val };
      return n;
    });
  };
  const addGroup = (sIdx) => {
    setSections((prev) => {
      const n = [...prev];
      if (!n[sIdx]) return prev;
      n[sIdx].groups = [
        ...n[sIdx].groups,
        {
          id: `g${Date.now()}`,
          instructions: '',
          questions: [],
          isCollapsed: false,
        },
      ];
      return n;
    });
  };
  const updateGroup = (sIdx, gIdx, newGroup) => {
    setSections((prev) => {
      const n = [...prev];
      if (!n[sIdx] || !n[sIdx].groups) return prev;
      n[sIdx].groups = n[sIdx].groups.map((g, i) => (i === gIdx ? newGroup : g));
      return n;
    });
  };
  const removeGroup = (sIdx, gIdx) => {
    setSections((prev) => {
      const n = [...prev];
      if (!n[sIdx] || !n[sIdx].groups) return prev;
      n[sIdx].groups = n[sIdx].groups.filter((_, i) => i !== gIdx);
      return n;
    });
  };

  // UPDATED: Support for Batch Add (count)
  const addQuestion = (sIdx, gIdx, type = 'multiple_choice', count = 1) => {
    setSections((prev) => {
      const n = [...prev];
      if (!n[sIdx] || !n[sIdx].groups[gIdx]) return prev;

      const g = { ...n[sIdx].groups[gIdx], isCollapsed: false };
      const newQuestions = [...g.questions];

      for (let i = 0; i < count; i++) {
        newQuestions.push({
          id: `q${Date.now()}_${i}`,
          type,
          question_text: '',
          options: ['', '', '', ''],
          correct_answer: '',
        });
      }

      g.questions = newQuestions;
      n[sIdx].groups = n[sIdx].groups.map((item, i) => (i === gIdx ? g : item));
      return n;
    });
  };

  const handleBulkAnswerImport = (updatedQuestions) => {
    const answersMap = {};
    updatedQuestions.forEach((q) => {
      answersMap[q.id] = q;
    });

    const newSections = sections.map((section) => ({
      ...section,
      groups: section.groups.map((group) => ({
        ...group,
        questions: group.questions.map((q) => {
          const match = answersMap[q.id];
          if (match) {
            return {
              ...q,
              correct_answer: match.correct_answer,
              table_data: match.table_data,
              matching_features: match.matching_features,
              gap_fill: match.gap_fill,
              flowchart: match.flowchart,
              map_labeling: match.map_labeling,
            };
          }
          return q;
        }),
      })),
    }));

    setSections(newSections);
    toast.success(`Updated answers for questions across all parts.`);
  };

  const handleBulkImport = (questions, targetSectionIndex) => {
    const newSections = [...sections];
    if (!newSections[targetSectionIndex]) return;

    let currentGroup = null;
    let lastInstructions = null;

    questions.forEach((q) => {
      // --- Transformation Logic ---
      let finalType = q.type;
      let finalQ = { ...q };

      // 1. Convert Notes/Summary Completion to Gap Fill
      if (q.type === 'notes_completion' || q.type === 'summary_completion') {
        finalType = 'gap_fill';

        // Handle both structured_text (reading parser) and text (listening parser)
        const sourceText = q.gap_fill?.structured_text || q.gap_fill?.text || '';
        const answers = q.gap_fill?.answers || {};
        const gapNumbers = q.gap_fill?.gap_numbers || [];

        if (sourceText) {
          let text = sourceText;
          const newAnswers = {};
          let gapIndex = 0;

          // If text already contains [gap] markers (listening parser), just re-map answers
          if (text.includes('[gap]')) {
            // Map answers by index
            gapNumbers.forEach((originalNum, idx) => {
              if (answers[idx] !== undefined) {
                newAnswers[idx] = answers[idx];
              }
            });
          } else {
            // Replace [1], [2] etc with [gap] and map answers sequentially (reading parser)
            text = text.replace(/\[(\d+)\]/g, (match, num) => {
              if (answers[num]) {
                newAnswers[gapIndex] = answers[num];
              }
              gapIndex++;
              return ' [gap] ';
            });
          }

          // Convert plain text with markdown to HTML for ReactQuill compatibility
          const convertNotesToHtml = (plainText) => {
            let html = '';
            const lines = plainText.split('\n');

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) {
                html += '<p><br></p>';
                continue;
              }

              // Convert **bold** to <strong>
              let processedLine = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

              // Handle bullet points
              if (/^[-•●]\s/.test(trimmed)) {
                processedLine = processedLine.replace(/^[-•●]\s/, '');
                html += `<p>• ${processedLine}</p>`;
              } else {
                html += `<p>${processedLine}</p>`;
              }
            }

            return html;
          };

          const htmlText = convertNotesToHtml(text);

          finalQ.gap_fill = {
            text: htmlText,
            answers: Object.keys(newAnswers).length > 0 ? newAnswers : answers,
            box_title: q.gap_fill?.title || q.gap_fill?.box_title || '',
          };
        }
      }

      // 2. Convert T/F/NG and Y/N/NG to Multiple Choice
      if (q.type === 'true_false_not_given') {
        finalType = 'multiple_choice';
        finalQ.options = ['TRUE', 'FALSE', 'NOT GIVEN'];
        finalQ.question_text = q.question_text;
      } else if (q.type === 'yes_no_not_given') {
        finalType = 'multiple_choice';
        finalQ.options = ['YES', 'NO', 'NOT GIVEN'];
        finalQ.question_text = q.question_text;
      }

      // Apply transformed type
      finalQ.type = finalType;
      finalQ.id = q.id.startsWith('temp') ? `q${Date.now()}_${Math.random()}` : q.id;

      const instr = q.group_instructions ? q.group_instructions.trim() : '';

      // Grouping Logic
      if (!currentGroup || instr !== lastInstructions) {
        currentGroup = {
          id: `g${Date.now()}_${Math.random()}`,
          instructions: q.group_instructions || '',
          title: q.mcq_title || '', // Capture title from first question
          questions: [],
          isCollapsed: false,
        };
        newSections[targetSectionIndex].groups.push(currentGroup);
        lastInstructions = instr;
      }

      currentGroup.questions.push({
        ...finalQ,
        group_instructions: undefined,
        mcq_title: undefined, // Clear from individual question, stored in group
        section: undefined,
      });
    });

    setSections(newSections);
    toast.success(`Imported ${questions.length} questions into Part ${targetSectionIndex + 1}`);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-[#08080a] text-stone-900 dark:text-stone-50 overflow-hidden">
      <TestEditorHeader
        title={meta.title}
        theme={effectiveTheme}
        metadata={meta}
        onMetadataChange={setMeta}
        onTitleChange={(t) => setMeta((prev) => ({ ...prev, title: t }))}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={saving}
        lastSaved={null}
      >
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 w-8 p-0 rounded-full border-dashed hidden md:flex shrink-0 hover:bg-stone-100 dark:hover:bg-stone-800"
          onClick={() => setShowSidebar(!showSidebar)}
          title={showSidebar ? 'Hide Audio' : 'Show Audio'}
        >
          {showSidebar ? (
            <Minimize2 className="w-4 h-4 text-stone-500" />
          ) : (
            <Maximize2 className="w-4 h-4 text-stone-500" />
          )}
        </Button>
      </TestEditorHeader>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Sidebar (Audio & Transcript) */}
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="w-full md:w-[400px] h-full bg-white dark:bg-[#131315] border-r border-stone-200/80 dark:border-white/[0.07] flex flex-col z-10"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="p-2 md:p-4 border-b border-stone-200/80 dark:border-white/[0.07]">
                  <TabsList className={cn(ADMIN_TABS_LIST, 'w-full grid grid-cols-4 h-10')}>
                    {sections.map((_, i) => (
                      <TabsTrigger key={i} value={String(i)} className={ADMIN_TAB_TRIGGER}>
                        <span className="flex items-center gap-1.5">
                          <span className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-300">
                            {i + 1}
                          </span>
                          Part {i + 1}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <TabsContent
                  value={activeTab}
                  className="flex-1 flex flex-col p-4 md:p-6 gap-6 overflow-y-auto m-0 custom-scrollbar"
                >
                  {/* Audio Section */}
                  <div className="shrink-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-stone-100 dark:bg-stone-950/40 rounded-lg text-stone-600 dark:text-stone-400">
                        <Music className="w-4 h-4" />
                      </div>
                      <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
                        Audio Source
                      </h3>
                    </div>
                    <AudioUploader
                      url={sections[activeTab].audio_url}
                      onUrlChange={(val) => updateSection(Number(activeTab), 'audio_url', val)}
                    />
                  </div>

                  {/* Audioscript Section */}
                  <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-4 border-t border-stone-200/60 dark:border-stone-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-stone-100 dark:bg-stone-950/40 rounded-lg text-stone-600 dark:text-stone-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="text-[11px] font-black text-stone-500 uppercase tracking-widest">
                          Audioscript
                        </h3>
                      </div>
                      <Button
                        onClick={handleAutoTranscribe}
                        disabled={!sections[activeTab].audio_url || transcribing}
                        size="sm"
                        className="h-7 px-3 rounded-full bg-stone-600 hover:bg-stone-700 text-white font-black text-[9px] uppercase tracking-widest shadow-md disabled:opacity-50"
                      >
                        {transcribing ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1.5" />
                            Auto Transcribe
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="relative flex-1 flex flex-col">
                      <p className="text-[10px] text-stone-400 mb-2 font-medium">
                        SRT subtitle format recommended for syncing.
                      </p>
                      <Textarea
                        value={sections[activeTab].srt_content || ''}
                        onChange={(e) =>
                          updateSection(Number(activeTab), 'srt_content', e.target.value)
                        }
                        placeholder={`1\n00:00:00,000 --> 00:00:05,000\nSPEAKER 1: Welcome...`}
                        className="flex-1 font-mono text-xs min-h-[200px] bg-white dark:bg-stone-950 rounded-xl border-stone-200/60 dark:border-stone-800 focus:border-stone-500 focus: transition-all resize-none"
                      />
                    </div>

                    {/* Quick Tip */}
                    <div className="p-4 bg-linear-to-br from-stone-50/50 to-stone-50/50 dark:from-stone-800/50 dark:to-stone-900/50 rounded-2xl border border-stone-100/50 dark:border-stone-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-stone-500 animate-pulse" />
                        <span className="text-[10px] font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest">
                          Quick Tip
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed font-medium">
                        Paste SRT subtitle content or use AI transcription. Format: Number →
                        Timestamp → Speaker: Text
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Question Builder Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-stone-950 overflow-hidden">
          {/* Sub-header with Tabs and Actions */}
          <div className="px-4 sm:px-6 py-4 border-b bg-white dark:bg-stone-950 sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center flex-wrap gap-4 overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`h-9 w-9 shrink-0 rounded-xl border transition-all ${showSidebar ? 'bg-stone-50 dark:bg-white/8 border-stone-200 dark:border-white/15 text-stone-700 dark:text-stone-200' : 'bg-white dark:bg-[#18181b] border-stone-200 dark:border-white/10 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'}`}
                  title={showSidebar ? 'Hide Settings' : 'Show Settings'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-3 px-3 py-1.5 bg-stone-50 dark:bg-stone-900/50 rounded-xl border dark:border-stone-800 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-stone-600">
                      {sections[activeTab]?.groups.length || 0}
                    </span>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                      groups
                    </span>
                  </div>
                  <div className="w-px h-3 bg-stone-200 dark:bg-stone-800" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-stone-600">
                      {sections[activeTab]?.groups.reduce(
                        (acc, g) => acc + g.questions.length,
                        0
                      ) || 0}
                    </span>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                      items
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-wrap md:justify-end gap-2">
                <div className="flex items-center bg-stone-100 dark:bg-stone-900 rounded-xl p-1 border dark:border-stone-800">
                  <Button
                    onClick={() => setBulkImportConfig({ isOpen: true, mode: 'answers_only' })}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 sm:px-3 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800 hover:text-stone-600 font-black text-[9px] uppercase tracking-widest transition-all"
                  >
                    <ListChecks className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Answers</span>
                  </Button>
                  <Button
                    onClick={() => setBulkImportConfig({ isOpen: true, mode: 'full' })}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 sm:px-3 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-800 hover:text-stone-600 font-black text-[9px] uppercase tracking-widest transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-stone-500" />
                    <span className="hidden sm:inline">Questions</span>
                  </Button>
                </div>

                <Button
                  onClick={() => addGroup(Number(activeTab))}
                  size="sm"
                  className="h-9 px-4 sm:px-5 rounded-xl bg-stone-600 hover:bg-stone-700 text-white font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5 shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1 sm:mr-1.5" />
                  Add Group
                </Button>
              </div>
            </div>
          </div>

          {/* Questions List/Editor Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-stone-50/30 dark:bg-stone-950">
            <div className="max-w-4xl mx-auto">
              <Reorder.Group
                axis="y"
                values={sections[activeTab]?.groups || []}
                onReorder={handleGroupReorder}
                className="space-y-6 pb-20"
              >
                {(sections[activeTab]?.groups || []).map((group, gIdx) => (
                  <QuestionGroupItem
                    key={group.id}
                    group={group}
                    index={gIdx}
                    activeTab={activeTab}
                    startNumbers={startNumbers}
                    updateGroup={updateGroup}
                    removeGroup={removeGroup}
                    addQuestion={addQuestion}
                    effectiveTheme={effectiveTheme}
                  />
                ))}
              </Reorder.Group>

              {/* Empty State */}
              {sections[activeTab]?.groups.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-stone-50/50 to-stone-50/30 dark:from-stone-950/20 dark:to-stone-950/10 rounded-2xl -z-10" />
                  <div className="bg-white/70 dark:bg-stone-900/70 border border-stone-200/50 dark:border-stone-800/30 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-stone-50 dark:bg-stone-900/30 flex items-center justify-center mx-auto mb-4 border border-stone-100 dark:border-stone-800">
                      <FileText className="w-8 h-8 text-stone-600 dark:text-stone-400" />
                    </div>
                    <h3 className="text-lg font-black text-stone-800 dark:text-white uppercase tracking-tight">
                      Build your test context
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto font-medium">
                      Add your first question group to start structuring Part{' '}
                      {Number(activeTab) + 1} of your IELTS Listening test.
                    </p>
                    <Button
                      onClick={() => addGroup(Number(activeTab))}
                      className="h-10 px-8 rounded-xl bg-stone-600 hover:bg-stone-700 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Group
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BulkImportModal
        isOpen={bulkImportConfig.isOpen}
        onClose={() => setBulkImportConfig({ ...bulkImportConfig, isOpen: false })}
        onImport={
          bulkImportConfig.mode === 'answers_only' ? handleBulkAnswerImport : handleBulkImport
        }
        testType="listening"
        initialSection={parseInt(activeTab)}
        mode={bulkImportConfig.mode}
        existingQuestions={flattenedQuestionsForImport}
      />
    </div>
  );
};

const QuestionGroupItem = ({
  group,
  index,
  activeTab,
  startNumbers,
  updateGroup,
  removeGroup,
  addQuestion,
  effectiveTheme,
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={group}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      data-oid="zp.onbw"
    >
      <QuestionGroupEditor
        group={group}
        startNum={startNumbers[`${activeTab}-${index}`] || 1}
        onUpdate={(newG) => updateGroup(Number(activeTab), index, newG)}
        onRemove={() => removeGroup(Number(activeTab), index)}
        onAddQuestion={(type, count) => addQuestion(Number(activeTab), index, type, count)}
        theme={effectiveTheme}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
};

// --- Group Component (Premium) ---
const QuestionGroupEditor = ({
  group,
  onUpdate,
  onRemove,
  onAddQuestion,
  startNum,
  theme,
  dragControls,
}) => {
  const totalQuestions = group.questions.reduce((acc, q) => acc + getQuestionCount(q), 0);
  const endNum = startNum + Math.max(0, totalQuestions - 1);
  const rangeLabel =
    totalQuestions > 0
      ? totalQuestions === 1
        ? `Question ${startNum}`
        : `Questions ${startNum}-${endNum}`
      : `Questions ${startNum} - ...`;

  const updateQuestion = (qIdx, field, val) => {
    const n = { ...group };
    n.questions[qIdx] = { ...n.questions[qIdx], [field]: val };
    onUpdate(n);
  };
  const removeQuestion = (qIdx) => {
    const n = { ...group };
    n.questions.splice(qIdx, 1);
    onUpdate(n);
  };

  // Batch Add State
  const [addType, setAddType] = useState('multiple_choice');
  const [addCount, setAddCount] = useState(5);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-stone-900 rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden ${group.isCollapsed ? 'border-stone-200 dark:border-stone-800' : 'ring-2 border-stone-200 dark:border-stone-900 shadow-xl '}`}
      data-oid="x:by8mt"
    >
      <div
        className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer transition-all ${group.isCollapsed ? 'hover:bg-stone-50 dark:hover:bg-stone-800/50' : 'bg-linear-to-r from-stone-50/50 to-stone-100/30 dark:from-stone-800 dark:to-stone-800/50'}`}
        onClick={() => onUpdate({ ...group, isCollapsed: !group.isCollapsed })}
        data-oid="epf.1ci"
      >
        <div className="flex items-center gap-3" data-oid="hf_a7sv">
          <div
            className="cursor-grab active:cursor-grabbing p-1.5 text-stone-300 hover:text-stone-500 transition-colors rounded-lg hover:bg-white dark:hover:bg-stone-800 shadow-sm"
            onPointerDown={(e) => dragControls.start(e)}
            data-oid="u02_7na"
          >
            <GripVertical className="w-4 h-4" data-oid="ea0:_3n" />
          </div>
          <div className="flex items-center gap-4" data-oid="j.nzbzg">
            <div
              className={`p-2 rounded-xl transition-all duration-500 ${group.isCollapsed ? '-rotate-90 bg-stone-100 dark:bg-[#18181b] text-stone-500 dark:text-stone-300 border border-stone-200/80 dark:border-white/10 shadow-inner' : 'rotate-0 bg-stone-600 text-white'}`}
              data-oid="z:5qfsa"
            >
              <ChevronDown className="w-4 h-4" data-oid="qx4e2ao" />
            </div>
            <div className="flex flex-col gap-0.5" data-oid="uf0d.3n">
              <div className="flex items-center gap-2" data-oid="zepkzhf">
                <span
                  className="font-black text-xs sm:text-sm text-stone-900 dark:text-white uppercase tracking-tight"
                  data-oid="dmc_h:d"
                >
                  {rangeLabel}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-black bg-white dark:bg-stone-800 border-stone-100 dark:border-white/10 text-stone-600 dark:text-stone-300 shadow-sm uppercase tracking-widest px-2"
                  data-oid="v21rl6e"
                >
                  {group.questions.length} {group.questions.length === 1 ? 'Element' : 'Elements'}
                </Badge>
              </div>
              {group.title && group.isCollapsed && (
                <span
                  className="text-[10px] text-stone-500 font-medium truncate max-w-[200px] sm:max-w-md"
                  data-oid="group-title-preview"
                >
                  {group.title}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" data-oid="ersyny3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-8 w-8 p-0 text-stone-300 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.06)] dark:hover:bg-[rgb(var(--signal-fault)/0.06)] rounded-xl transition-all"
            data-oid="nr57-s_"
          >
            <Trash2 className="w-4 h-4" data-oid="b3ji38." />
          </Button>
        </div>
      </div>

      <AnimatePresence data-oid="bgex:ee">
        {!group.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50"
            data-oid="rk_kc-j"
          >
            <div className="p-5 space-y-6" data-oid="tkd97vj">
              <div className="space-y-2" data-oid="ffb_jfi">
                <label
                  className="text-xs font-bold uppercase text-muted-foreground tracking-wider"
                  data-oid="5rd0:kl"
                >
                  Group Title / Context (Optional)
                </label>
                <Input
                  value={group.title || ''}
                  onChange={(e) => onUpdate({ ...group, title: e.target.value })}
                  placeholder="e.g. Free activities in the Burnham area"
                  className="font-medium"
                  data-oid="20qlabl"
                />
              </div>

              <InstructionEditor
                value={group.instructions}
                onChange={(v) => onUpdate({ ...group, instructions: v })}
                placeholder="e.g. Choose the correct letter, A, B, C or D."
                data-oid="g31_aq:"
              />

              <div className="space-y-4" data-oid="r7903p5">
                {group.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="relative pl-4 border-l-2 border-stone-100 dark:border-stone-800 hover:border-stone-500/50 transition-colors group/item"
                    data-oid="b6gw-kd"
                  >
                    <div className="flex justify-between items-start mb-3" data-oid="wrt-yb-">
                      <div className="flex items-center gap-3" data-oid="c--10l:">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold tracking-wider ${theme.text} ${theme.border} bg-white dark:bg-stone-900 shadow-sm`}
                          data-oid="tcudf81"
                        >
                          {q.type.replace(/_/g, ' ')}
                        </Badge>
                        {q.type === 'multiple_choice' && (
                          <div
                            className="flex items-center gap-2 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                            data-oid="wym-d67"
                          >
                            <Checkbox
                              id={`multi-${q.id}`}
                              checked={q.allow_multiple}
                              onCheckedChange={(c) => {
                                // When checking, default to 2 if not set. When unchecking, it doesn't matter (hidden)
                                const updates = { allow_multiple: c };
                                if (c && !q.question_count) updates.question_count = 2;

                                const n = { ...group };
                                n.questions[qIdx] = { ...n.questions[qIdx], ...updates };
                                onUpdate(n);
                              }}
                              className="h-4 w-4 rounded-sm border-2 border-stone-300 dark:border-stone-600 data-[state=checked]:bg-linear-to-r data-[state=checked]:from-stone-500 data-[state=checked]:to-stone-600 data-[state=checked]:border-stone-500 data-[state=checked]:text-white data-[state=checked]:shadow-sm data-[state=checked]: transition-all duration-200"
                              data-oid="afwihim"
                            />

                            <label
                              htmlFor={`multi-${q.id}`}
                              className="text-[10px] font-medium cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400"
                              data-oid="1zzm66x"
                            >
                              Multi-Select
                            </label>
                            {q.allow_multiple && (
                              <Input
                                type="number"
                                min="2"
                                max="10"
                                className="w-10 h-5 text-[10px] p-0 pl-1 text-center border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
                                value={q.question_count || 2}
                                onChange={(e) =>
                                  updateQuestion(
                                    qIdx,
                                    'question_count',
                                    parseInt(e.target.value) || 2
                                  )
                                }
                                data-oid="mqccy7_"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(qIdx)}
                        className="h-6 w-6 opacity-0 group-hover/item:opacity-100 text-stone-400 hover:text-[rgb(var(--signal-fault))] transition-all"
                        data-oid="l7m-3de"
                      >
                        <X className="w-3 h-3" data-oid="u:mqr.t" />
                      </Button>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-3" data-oid="0os97s_">
                      {q.type === 'multiple_choice' && (
                        <>
                          <Input
                            value={q.question_text}
                            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                            placeholder="Question Text..."
                            className="font-medium bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-stone-500 placeholder:text-stone-400"
                            data-oid="-i68.m."
                          />

                          <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2"
                            data-oid="l:6feq-"
                          >
                            {q.options.map((opt, oI) => (
                              <div
                                key={oI}
                                className="flex gap-2 items-center group/option"
                                data-oid="u6ptw27"
                              >
                                <button
                                  onClick={() => {
                                    if (q.allow_multiple) {
                                      let current = Array.isArray(q.correct_answer)
                                        ? q.correct_answer
                                        : [];
                                      if (current.includes(opt))
                                        current = current.filter((x) => x !== opt);
                                      else current = [...current, opt];
                                      updateQuestion(qIdx, 'correct_answer', current);
                                    } else {
                                      updateQuestion(qIdx, 'correct_answer', opt);
                                    }
                                  }}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm border ${
                                    (
                                      Array.isArray(q.correct_answer)
                                        ? q.correct_answer.includes(opt)
                                        : q.correct_answer === opt
                                    )
                                      ? `${theme.primary} text-white dark:text-stone-900 border-transparent`
                                      : 'bg-white dark:bg-[#18181b] border-stone-200 dark:border-white/12 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-white/25'
                                  }`}
                                  data-oid="vul97u0"
                                >
                                  {String.fromCharCode(65 + oI)}
                                </button>
                                <div className="relative flex-1" data-oid="eyjlqv.">
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const nO = [...q.options];
                                      nO[oI] = e.target.value;
                                      updateQuestion(qIdx, 'options', nO);
                                    }}
                                    className="h-8 text-sm bg-stone-50 dark:bg-stone-900/50 border-transparent focus:bg-white dark:focus:bg-stone-900 focus:border-stone-200 transition-all"
                                    placeholder={`Option ${String.fromCharCode(65 + oI)}`}
                                    data-oid=".rdmbcc"
                                  />

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const nO = [...q.options];
                                      nO.splice(oI, 1);
                                      updateQuestion(qIdx, 'options', nO);
                                      if (Array.isArray(q.correct_answer)) {
                                        if (q.correct_answer.includes(opt))
                                          updateQuestion(
                                            qIdx,
                                            'correct_answer',
                                            q.correct_answer.filter((c) => c !== opt)
                                          );
                                      } else if (q.correct_answer === opt)
                                        updateQuestion(qIdx, 'correct_answer', '');
                                    }}
                                    className="absolute right-1 top-0 h-8 w-8 text-stone-400 hover:text-[rgb(var(--signal-fault))] opacity-0 group-hover/option:opacity-100 transition-opacity"
                                    disabled={q.options.length <= 2}
                                    data-oid="w:ad_d7"
                                  >
                                    <Trash2 className="w-3 h-3" data-oid="5f:7yl8" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nO = [...q.options, ''];
                                updateQuestion(qIdx, 'options', nO);
                              }}
                              className="self-start mt-1 text-xs h-8 border-dashed col-span-full border-stone-300 dark:border-white/15 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-white/30 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/5 bg-transparent dark:bg-transparent transition-all"
                              data-oid="5msw6xt"
                            >
                              <Plus className="w-3 h-3 mr-1" data-oid="jj_:gou" /> Add Option
                            </Button>
                          </div>
                        </>
                      )}
                      {(q.type === 'short_answer' || q.type === 'sentence_completion') && (
                        <div className="grid grid-cols-1 gap-3" data-oid="f0w620b">
                          <Textarea
                            value={q.question_text}
                            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                            placeholder="Question text (use _____ for blanks)"
                            className="min-h-[60px] text-sm resize-y bg-stone-50 dark:bg-stone-900 dark:text-stone-200 border-0 focus-visible:ring-1 focus-visible:"
                            data-oid="jc8:my5"
                          />

                          <div className="flex items-center gap-3" data-oid="yb_s_s0">
                            <span className="text-xs font-medium text-stone-500" data-oid="4n:2fji">
                              Correct Answer:
                            </span>
                            <Input
                              value={q.correct_answer}
                              onChange={(e) =>
                                updateQuestion(qIdx, 'correct_answer', e.target.value)
                              }
                              placeholder="Enter strict answer key"
                              className="h-8 w-full max-w-sm font-mono text-sm border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)] bg-[rgb(var(--signal-ok)/0.06)] border-[rgb(var(--signal-ok)/0.3)] text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))]"
                              data-oid="rqvzb_k"
                            />
                          </div>
                        </div>
                      )}
                      {q.type === 'map_labeling' && (
                        <MapLabelingBuilder
                          initialData={q.map_labeling}
                          onChange={(d) => updateQuestion(qIdx, 'map_labeling', d)}
                          data-oid="5cjkmeg"
                        />
                      )}
                      {q.type === 'matching_features' && (
                        <MatchingFeaturesBuilder
                          initialData={q.matching_features}
                          onChange={(d) => updateQuestion(qIdx, 'matching_features', d)}
                          data-oid=".zq1r_3"
                        />
                      )}
                      {q.type === 'flowchart' && (
                        <FlowchartBuilder
                          initialData={q.flowchart}
                          onChange={(d) => updateQuestion(qIdx, 'flowchart', d)}
                          data-oid="0mh4d:u"
                        />
                      )}
                      {q.type === 'table_completion' && (
                        <TableBuilder
                          initialData={q.table_data}
                          onChange={(d) => updateQuestion(qIdx, 'table_data', d)}
                          data-oid="u09g_nu"
                        />
                      )}
                      {q.type === 'gap_fill' && (
                        <GapFillBuilder
                          initialData={q.gap_fill}
                          onChange={(d) => updateQuestion(qIdx, 'gap_fill', d)}
                          data-oid="9-rce1k"
                        />
                      )}
                      {q.type === 'static_text' && (
                        <StaticTextBuilder
                          initialData={q.static_text}
                          onChange={(d) => updateQuestion(qIdx, 'static_text', d)}
                          data-oid="10bnd3-"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Footer */}
              <div
                className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-6 mt-6 border-t border-dashed border-stone-200 dark:border-white/10 flex-wrap"
                data-oid="2rc.gbh"
              >
                <DropdownMenu data-oid="mq:_7z2">
                  <DropdownMenuTrigger asChild data-oid="qtvnrpp">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 rounded-full border-dashed hover:border-solid hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-xs font-medium"
                      data-oid="cc06:s_"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2 text-stone-500" data-oid="pg6khke" /> Add
                      Single Question
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-64 bg-white dark:bg-stone-800 z-50"
                    data-oid="wumrzdq"
                  >
                    <div
                      className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      data-oid="npz9ln8"
                    >
                      Basic Types
                    </div>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('multiple_choice', 1)}
                      data-oid="fj.a-il"
                    >
                      Multiple Choice
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('short_answer', 1)}
                      data-oid="n8222h5"
                    >
                      Short Answer
                    </DropdownMenuItem>

                    <div className="h-px bg-stone-100 my-1" data-oid="38teo__" />
                    <div
                      className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      data-oid="llirss."
                    >
                      Complex Types
                    </div>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('gap_fill', 1)}
                      data-oid=".zhtth5"
                    >
                      Form / Note / Summary / Sentence
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('table_completion', 1)}
                      data-oid="bjlvpu_"
                    >
                      Table Completion
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('map_labeling', 1)}
                      data-oid="j29yvpj"
                    >
                      Map / Diagram Labeling
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('flowchart', 1)}
                      data-oid="3w9.2pu"
                    >
                      Flowchart / Process
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('matching_features', 1)}
                      data-oid="tbb8geo"
                    >
                      Matching Features
                    </DropdownMenuItem>

                    <div className="h-px bg-stone-100 my-1" data-oid="__8e7c5" />
                    <div
                      className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      data-oid=".0o:blo"
                    >
                      Structure
                    </div>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('static_text', 0)}
                      data-oid="l2z127g"
                    >
                      Header / Instruction Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-auto flex items-center gap-2" data-oid="k.bq:7.">
                  <span
                    className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mr-1"
                    data-oid="n4s6x14"
                  >
                    Quick Bulk Add
                  </span>
                  <div
                    className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border dark:border-stone-700"
                    data-oid="ffe:rz8"
                  >
                    <select
                      className="h-7 bg-transparent text-xs border-0 focus:ring-0 text-stone-600 dark:text-stone-300 font-medium max-w-[120px]"
                      value={addType}
                      onChange={(e) => setAddType(e.target.value)}
                      data-oid="5unr8ea"
                    >
                      <option value="multiple_choice" data-oid="c.:e37-">
                        Multiple Choice
                      </option>
                      <option value="short_answer" data-oid="cwgc2-2">
                        Short Answer
                      </option>
                      <option value="gap_fill" data-oid="cnpdub5">
                        Form / Note
                      </option>
                      <option value="table_completion" data-oid="cermdjv">
                        Table Compl.
                      </option>
                      <option value="map_labeling" data-oid="ydj:aim">
                        Map Labeling
                      </option>
                      <option value="flowchart" data-oid="_kb_sy6">
                        Flowchart
                      </option>
                      <option value="matching_features" data-oid="phbolx_">
                        Matching Feat.
                      </option>
                    </select>
                    <div
                      className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1"
                      data-oid="rp45:fz"
                    />

                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="w-12 h-7 text-center border-0 p-0 text-xs focus-visible:ring-0 bg-transparent dark:text-stone-200"
                      value={addCount}
                      onChange={(e) => setAddCount(e.target.value)}
                      data-oid="imp34tg"
                    />

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-stone-700 shadow-sm"
                      onClick={() => onAddQuestion(addType, parseInt(addCount) || 1)}
                      data-oid="bdd4wwu"
                    >
                      <Plus className="w-3.5 h-3.5" data-oid="8b8o61n" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ListeningTestEditor;
