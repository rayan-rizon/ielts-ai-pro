import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  GripVertical,
  Bold,
  Italic,
  Type,
  AlignCenter,
  List,
  Image as ImageIcon,
  Link2,
  Edit3,
  Eye,
  EyeOff,
  Hash,
  FileText,
  BookOpen,
  ShieldCheck,
  AlignLeft,
  CheckSquare,
  PenTool,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { uploadToR2 } from '@/lib/r2';
import { sanitizeHtml } from '@/lib/security';
import { cn } from '@/lib/cn';
import { AdminButton, PANEL, MICRO, ADMIN_TABS_LIST, ADMIN_TAB_TRIGGER } from '../../ui/primitives';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import TableBuilder from '../builders/TableBuilder';
import MatchingFeaturesBuilder from '../builders/MatchingFeaturesBuilder';
import FlowchartBuilder from '../builders/FlowchartBuilder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TestEditorHeader from './TestEditorHeader';
import BulkImportModal from '../BulkImportModal';
import ExplanationImportModal from '../ExplanationImportModal';

// --- Rich Text Editor ---
const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  rows = 10,
  className = '',
  mode = 'full',
}) => {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [floatingMenu, setFloatingMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    start: 0,
    end: 0,
  });
  const [qNumInput, setQNumInput] = useState('');

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || isPreview) return;

    const parent = textarea.parentElement?.closest('.overflow-y-auto');
    const scrollTop = parent ? parent.scrollTop : 0;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(mode === 'simple' ? 60 : rows * 24, textarea.scrollHeight)}px`;
    if (parent) parent.scrollTop = scrollTop;
  }, [value, rows, isPreview, mode]);

  // Use plain textarea for simple mode (Instructions) to preserve exact formatting
  if (mode === 'simple') {
    const renderSimplePreview = (text) => {
      if (!text)
        return (
          <div className="text-gray-400 italic text-sm" data-oid="ydz_h1_">
            No content to preview
          </div>
        );

      // Only process basic HTML tags, preserve all whitespace (except our custom tags)
      let processedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(
          /\[image\](.*?)\[\/image\]/g,
          '<img src="$1" alt="Instruction Image" referrerpolicy="no-referrer" class="max-w-full h-auto mx-auto my-2 border rounded" />'
        );

      return (
        <div className="prose prose-sm max-w-none dark:prose-invert" data-oid="u52w_59">
          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedText) }}
            data-oid="n5s3lbc"
          />
        </div>
      );
    };

    const handleInsertImageUrl = () => {
      let finalUrl = imageUrlInput.trim();
      if (!finalUrl) return;
      // Auto-prepend https:// if missing protocol
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }

      // Basic URL validation
      try {
        new URL(finalUrl);
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }

      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value || '';
      const formatting = `[image]${finalUrl}[/image]`;
      const newValue = text.substring(0, start) + formatting + text.substring(end);
      onChange(newValue);

      setImageUrlInput('');
      setShowImageUrlModal(false);
      toast.success('Image URL inserted');

      setTimeout(() => {
        textarea.focus();
        const newPos = start + formatting.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
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
        className={`border rounded-lg ${className} bg-white dark:bg-stone-900 dark:border-stone-700 shadow-sm overflow-hidden`}
        data-oid="h5f73vi"
      >
        <div
          className="flex items-center justify-between px-2 py-1.5 border-b bg-gray-50 dark:bg-stone-800 dark:border-stone-700 sticky top-0 z-10"
          data-oid="0r8vcd8"
        >
          <div className="flex items-center gap-1" data-oid="7uoc5ns">
            <div
              className="text-[10px] text-stone-500 dark:text-stone-400 font-medium mr-2"
              data-oid="6gg-_ja"
            >
              Instructions
            </div>
            {!isPreview && (
              <div
                className="flex items-center border-l pl-2 gap-1 border-stone-200 dark:border-stone-700"
                data-oid="0gkbj6j"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('bold')}
                  className="h-6 w-6 p-0 hover:bg-stone-200 dark:hover:bg-stone-700"
                  title="Bold"
                  data-oid="n37o7iy"
                >
                  <Bold className="w-3 h-3" data-oid="qn2yyzw" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFormat('italic')}
                  className="h-6 w-6 p-0 hover:bg-stone-200 dark:hover:bg-stone-700"
                  title="Italic"
                  data-oid="bz9012j"
                >
                  <Italic className="w-3 h-3" data-oid="crgtqwk" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImageUrlModal(true)}
                  className="h-6 w-6 p-0 hover:bg-stone-200 dark:hover:bg-stone-700"
                  title="Insert Image URL"
                  data-oid="79cgqwj"
                >
                  <Link2 className="w-3 h-3" data-oid="516ik1t" />
                </Button>
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="text-xs h-6 px-2 dark:text-stone-300 dark:hover:bg-stone-700"
            data-oid="0gdr8g:"
          >
            {isPreview ? (
              <Edit3 className="w-3 h-3 mr-1" data-oid="vk-8t4s" />
            ) : (
              <Eye className="w-3 h-3 mr-1" data-oid="iquyztl" />
            )}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
        <div className="relative" data-oid="1t0qn8:">
          {isPreview ? (
            <div
              className="bg-white dark:bg-stone-900 overflow-y-auto min-h-[60px] p-2"
              style={{ whiteSpace: 'pre-wrap' }}
              data-oid="q_6wtyg"
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
              data-oid="_b3au::"
            />
          )}
          {/* Image URL Modal for Instructions */}
          {showImageUrlModal && (
            <div
              className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4"
              onClick={() => setShowImageUrlModal(false)}
              data-oid="k417t17"
            >
              <div
                className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl p-6 max-w-md w-full border dark:border-stone-700 animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
                data-oid="igts.4p"
              >
                <div className="flex items-center gap-3 mb-4" data-oid="d4cjdbf">
                  <div
                    className="p-2 rounded-lg bg-stone-100 dark:bg-stone-900/40"
                    data-oid=".m9i7h:"
                  >
                    <Link2
                      className="w-5 h-5 text-stone-600 dark:text-stone-400"
                      data-oid="yorljuo"
                    />
                  </div>
                  <div data-oid="h7rdq:d">
                    <h3
                      className="text-lg font-semibold text-stone-900 dark:text-white"
                      data-oid="uwk2hwt"
                    >
                      Insert Image URL
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400" data-oid="rjy.6wz">
                      Paste a direct link to an image for instructions
                    </p>
                  </div>
                </div>
                <Input
                  autoFocus
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mb-4 dark:bg-stone-800 dark:border-stone-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInsertImageUrl();
                    }
                  }}
                  data-oid="-ne35qx"
                />

                {imageUrlInput && (
                  <div
                    className="mb-4 p-2 rounded-lg bg-stone-100 dark:bg-stone-800 border dark:border-stone-700"
                    data-oid="mqms.m8"
                  >
                    <p
                      className="text-xs text-stone-500 dark:text-stone-400 mb-2"
                      data-oid="ivaqi2z"
                    >
                      Preview:
                    </p>
                    <div
                      className="relative min-h-[128px] flex items-center justify-center bg-stone-50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-700"
                      data-oid="4-rggms"
                    >
                      <img
                        src={imageUrlInput}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="max-h-32 max-w-full rounded object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        data-oid="qh7_xl9"
                      />

                      <div
                        className="hidden flex-col items-center justify-center text-stone-400 p-4"
                        data-oid="swsob7g"
                      >
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" data-oid="d_g4k73" />
                        <p className="text-xs" data-oid="ttxmk1j">
                          Preview unavailable
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2" data-oid="s-fh0df">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowImageUrlModal(false);
                      setImageUrlInput('');
                    }}
                    data-oid="c2u8rpm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInsertImageUrl}
                    className="bg-stone-600 hover:bg-stone-700 text-white"
                    data-oid="p4tqqpn"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" data-oid="pqgj:r9" />
                    Insert Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Legacy Custom Editor for Passage / Full Mode (Handles [answer] tags) ---
  // Handle paste to preserve formatting from HTML sources (Word, web, etc.)
  const handlePaste = (e) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Check if HTML content is available
    const html = clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();

      // Parse HTML and convert to markdown-like syntax
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const convertToMarkdown = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return '';

        const tagName = node.tagName.toLowerCase();
        let children = Array.from(node.childNodes).map(convertToMarkdown).join('');

        switch (tagName) {
          case 'b':
          case 'strong':
            return `**${children}**`;
          case 'i':
          case 'em':
            return `*${children}*`;
          case 'u':
            return `__${children}__`;
          case 'br':
            return '\n';
          case 'p':
          case 'div':
            return children + '\n\n';
          case 'h1':
            return `[title]${children}[/title]\n`;
          case 'h2':
          case 'h3':
            return `[heading]${children}[/heading]\n`;
          case 'li':
            return `• ${children}\n`;
          case 'ul':
          case 'ol':
            return children;
          case 'img':
            return `[image]${node.getAttribute('src')}[/image]\n`;
          default:
            return children;
        }
      };

      let markdown = convertToMarkdown(doc.body);
      // Clean up excessive newlines
      markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

      // Insert at cursor position
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentValue = value || '';
        const newValue = currentValue.substring(0, start) + markdown + currentValue.substring(end);
        onChange(newValue);

        // Set cursor position after pasted content
        setTimeout(() => {
          textarea.focus();
          const newPos = start + markdown.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 0);
      }
    }
    // If no HTML, let the default paste behavior handle plain text
  };

  const insertFormatting = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const { file_url } = await uploadToR2(file);
      insertFormatting(`[image]${file_url}[/image]`);
      toast.success('Image uploaded to R2 successfully!');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInsertImageUrl = () => {
    let finalUrl = imageUrlInput.trim();
    // Auto-prepend https:// if missing protocol
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    // Basic URL validation
    try {
      new URL(finalUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }
    insertFormatting(`[image]${finalUrl}[/image]`);
    setImageUrlInput('');
    setShowImageUrlModal(false);
    toast.success('Image URL inserted');
  };

  const handleMouseUp = (e) => {
    if (mode !== 'full' && mode !== 'passage') return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      setFloatingMenu((prev) => ({ ...prev, visible: false }));
      return;
    }

    const text = value.substring(start, end);
    if (!text.trim()) return;

    const container = e.target.parentElement;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top - 45;

    setFloatingMenu({ visible: true, x, y, text, start, end });
    setQNumInput('');
  };

  const applyHighlight = () => {
    if (!qNumInput.trim()) {
      toast.error('Please enter a Question Number');
      return;
    }

    const before = value.substring(0, floatingMenu.start);
    const after = value.substring(floatingMenu.end);
    const newText = before + `[answer q=${qNumInput}]${floatingMenu.text}[/answer]` + after;

    onChange(newText);
    setFloatingMenu((prev) => ({ ...prev, visible: false }));
    toast.success(`Marked as Answer for Q${qNumInput}`);
  };

  const allButtons = [
    { icon: Bold, label: 'Bold', action: () => insertFormatting('**', '**'), modes: ['full'] },
    { icon: Italic, label: 'Italic', action: () => insertFormatting('*', '*'), modes: ['full'] },
    {
      icon: Type,
      label: 'Title',
      action: () => insertFormatting('[title]', '[/title]'),
      modes: ['full'],
    },
    {
      icon: Hash,
      label: 'Heading',
      action: () => insertFormatting('[heading]', '[/heading]'),
      modes: ['full'],
    },
    {
      icon: AlignCenter,
      label: 'Center',
      action: () => insertFormatting('[center]', '[/center]'),
      modes: ['full'],
    },
    { icon: List, label: 'List Item', action: () => insertFormatting('• '), modes: ['full'] },
    {
      icon: ImageIcon,
      label: 'Upload Image',
      action: () => fileInputRef.current?.click(),
      disabled: uploadingImage,
      modes: ['full'],
    },
    {
      icon: Link2,
      label: 'Insert Image URL',
      action: () => setShowImageUrlModal(true),
      modes: ['full'],
    },
  ];

  const visibleButtons = allButtons.filter((btn) => btn.modes.includes(mode));

  const renderPreview = (text) => {
    if (!text)
      return (
        <div className="text-gray-400 italic" data-oid="e30igje">
          No content to preview
        </div>
      );

    // Split by paragraph to handle block-level elements correctly
    const paragraphs = text.split(/\n\s*\n/);

    const processedHtml = paragraphs
      .map((para) => {
        if (!para.trim()) return '';

        let processed = para
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(
            /\[title\](.*?)\[\/title\]/g,
            '<h2 class="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3 text-center">$1</h2>'
          )
          .replace(
            /\[heading\](.*?)\[\/heading\]/g,
            '<h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">$1</h3>'
          )
          .replace(/\[center\](.*?)\[\/center\]/g, '<div class="text-center">$1</div>')
          .replace(
            /\[image\](.*?)\[\/image\]/g,
            '<img src="$1" alt="Passage Image" referrerpolicy="no-referrer" class="max-w-full h-auto mx-auto my-4 border rounded shadow-sm" />'
          )
          .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
          .replace(/\n/g, '<br />');

        if (showAnswers) {
          processed = processed.replace(
            /\[answer q=([\d,\s]+)\](.*?)\[\/answer\]/g,
            (match, qNum, content) =>
              `<span class="bg-[rgb(var(--signal-ok)/0.08)] text-[rgb(var(--signal-ok))] px-1 py-0.5 rounded-sm font-medium transition-all duration-200">${content.trim()}<span class="inline-flex items-center justify-center bg-[rgb(var(--signal-ok))] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm select-none align-middle ml-0.5 transform -translate-y-px">Q${qNum}</span></span>`
          );
        } else {
          processed = processed.replace(/\[answer q=[\d,\s]+\](.*?)\[\/answer\]/g, '$1');
        }

        return `<div class="mb-4 leading-relaxed">${processed}</div>`;
      })
      .join('');

    return (
      <div className="prose prose-sm max-w-none dark:prose-invert" data-oid="upixb-g">
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedHtml) }} data-oid="n-whogj" />
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col border rounded-lg ${className} bg-white dark:bg-stone-900 dark:border-stone-700 shadow-sm transition-all focus-within:ring-2 ring-primary/20`}
      data-oid="w3c.z2d"
    >
      <div
        className="flex items-center justify-between p-2 flex-wrap sm:flex-nowrap gap-2 border-b bg-white dark:bg-stone-900 dark:border-stone-700 rounded-t-lg sticky top-0 z-30 shadow-sm"
        data-oid="cwtsu2g"
      >
        <div className="flex items-center gap-1 flex-wrap min-w-0" data-oid="pl:3xau">
          {visibleButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action}
              disabled={button.disabled}
              className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-stone-700 dark:text-stone-300"
              title={button.label}
              data-oid="j7pej5b"
            >
              <button.icon className="w-4 h-4" data-oid="1uojl9f" />
            </Button>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
            data-oid="r::uxtv"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-auto" data-oid="t1zody_">
          {isPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className={`text-xs h-7 px-2 ${showAnswers ? 'text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))] bg-[rgb(var(--signal-ok)/0.06)] bg-[rgb(var(--signal-ok)/0.06)]' : 'text-stone-500 dark:text-stone-400'}`}
              title={showAnswers ? 'Hide Answers' : 'Show Answers'}
              data-oid="nidvuab"
            >
              {showAnswers ? (
                <Eye className="w-4 h-4 mr-1.5" data-oid="trb5m:0" />
              ) : (
                <EyeOff className="w-4 h-4 mr-1.5" data-oid="ak.bljh" />
              )}
              <span className="hidden min-[480px]:inline">
                {showAnswers ? 'Answers On' : 'Answers Off'}
              </span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="text-xs h-7 px-2 dark:text-stone-300 dark:hover:bg-stone-700"
            data-oid="ouw1xs."
          >
            {isPreview ? (
              <Edit3 className="w-4 h-4 mr-1.5" data-oid="tc__hd_" />
            ) : (
              <Eye className="w-4 h-4 mr-1.5" data-oid="yeyso90" />
            )}
            {isPreview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden" data-oid="1t0qn8:">
        {isPreview ? (
          <div
            className="bg-white dark:bg-stone-900 overflow-y-auto flex-1 p-6 md:p-8"
            data-oid="k-ddzo4"
          >
            {renderPreview(value || '')}
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 group" data-oid="editor-container">
            {/* --- Syntax Highlighter Overlay --- */}
            <div
              className="absolute inset-0 pointer-events-none p-3 font-mono text-sm whitespace-pre-wrap wrap-break-word overflow-hidden text-transparent z-0"
              aria-hidden="true"
              style={{
                lineHeight: '1.5',
              }}
              data-oid="editor-highlighter"
            >
              {(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .split(
                  /(\[answer q=[\d,\s]+\].*?\[\/answer\]|\[title\].*?\[\/title\]|\[heading\].*?\[\/heading\]|\[center\].*?\[\/center\]|\[image\].*?\[\/image\])/g
                )
                .map((part, i) => {
                  // Answer Tag Highlight
                  if (part.startsWith('[answer')) {
                    return (
                      <span
                        key={i}
                        className="bg-[rgb(var(--signal-ok)/0.06)] bg-[rgb(var(--signal-ok)/0.06)] ring-1  rounded-sm py-0.5"
                      >
                        {part}
                      </span>
                    );
                  }
                  // Structural Tag Highlight (Blue)
                  if (part.startsWith('[title') || part.startsWith('[heading')) {
                    return (
                      <span
                        key={i}
                        className="bg-stone-500/10 dark:bg-stone-400/20 ring-1  rounded-sm py-0.5"
                      >
                        {part}
                      </span>
                    );
                  }
                  // Other Tags (Amber/Orange)
                  if (part.startsWith('[center') || part.startsWith('[image')) {
                    return (
                      <span
                        key={i}
                        className="bg-[rgb(var(--signal-warn)/0.06)] bg-[rgb(var(--signal-warn)/0.06)] ring-1  rounded-sm py-0.5"
                      >
                        {part}
                      </span>
                    );
                  }
                  return part;
                })}
              {/* Extra padding placeholder */}
              <div className="h-20" />
            </div>

            {/* --- Main Textarea --- */}
            <Textarea
              ref={textareaRef}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              onMouseUp={handleMouseUp}
              onPaste={handlePaste}
              onScroll={(e) => {
                const highlighter = e.target.previousSibling;
                if (highlighter) highlighter.scrollTop = e.target.scrollTop;
              }}
              placeholder={placeholder}
              rows={rows}
              className="relative z-10 border-0 rounded-none rounded-b-lg resize-none focus:ring-0 font-mono text-sm bg-transparent dark:text-stone-200 p-3 w-full h-full min-h-[200px]"
              style={{
                lineHeight: '1.5',
                caretColor: 'currentColor',
              }}
              data-oid="f57ocfv"
            />

            {floatingMenu.visible && (
              <div
                className="absolute z-50 flex items-center gap-1 p-1 bg-white dark:bg-stone-800 border dark:border-stone-700 shadow-lg rounded-lg animate-in fade-in zoom-in duration-200"
                style={{
                  top: Math.max(0, floatingMenu.y),
                  left: Math.max(
                    0,
                    Math.min(floatingMenu.x, (textareaRef.current?.offsetWidth || 500) - 160)
                  ),
                }}
                data-oid=":.24zpt"
              >
                <span
                  className="text-[10px] font-bold text-stone-500 pl-1 dark:text-stone-400"
                  data-oid="5897.gc"
                >
                  Q
                </span>
                <Input
                  autoFocus
                  className="h-6 w-10 text-xs px-1 text-center bg-transparent border-stone-200 dark:border-stone-600 dark:text-white"
                  placeholder="#"
                  value={qNumInput}
                  onChange={(e) => setQNumInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyHighlight();
                    }
                  }}
                  data-oid="3q00233"
                />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={applyHighlight}
                  className="h-6 w-6 p-0 text-[rgb(var(--signal-ok))] hover:text-[rgb(var(--signal-ok))] hover:bg-[rgb(var(--signal-ok)/0.06)] dark:hover:bg-[rgb(var(--signal-ok)/0.06)]"
                  data-oid=".wi2dl_"
                >
                  <CheckSquare className="w-4 h-4" data-oid="c88-kyu" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFloatingMenu((prev) => ({ ...prev, visible: false }))}
                  className="h-6 w-6 p-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  data-oid="ppqxw8u"
                >
                  <X className="w-3 h-3" data-oid="2r2zj:q" />
                </Button>
              </div>
            )}
            {/* Image URL Modal */}
            {showImageUrlModal && (
              <div
                className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4"
                onClick={() => setShowImageUrlModal(false)}
                data-oid="wbfxoik"
              >
                <div
                  className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl p-6 max-w-md w-full border dark:border-stone-700 animate-in fade-in zoom-in duration-200"
                  onClick={(e) => e.stopPropagation()}
                  data-oid="44e2ohw"
                >
                  <div className="flex items-center gap-3 mb-4" data-oid="g564flg">
                    <div
                      className="p-2 rounded-lg bg-stone-100 dark:bg-stone-900/40"
                      data-oid="olwzo4n"
                    >
                      <Link2
                        className="w-5 h-5 text-stone-600 dark:text-stone-400"
                        data-oid="7l-d2u4"
                      />
                    </div>
                    <div data-oid="itl1-7j">
                      <h3
                        className="text-lg font-semibold text-stone-900 dark:text-white"
                        data-oid="8rur2b_"
                      >
                        Insert Image URL
                      </h3>
                      <p className="text-sm text-stone-500 dark:text-stone-400" data-oid="mx4o_ks">
                        Paste a direct link to an image
                      </p>
                    </div>
                  </div>
                  <Input
                    autoFocus
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mb-4 dark:bg-stone-800 dark:border-stone-700"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInsertImageUrl();
                      }
                    }}
                    data-oid="zlpoq3z"
                  />

                  {imageUrlInput && (
                    <div
                      className="mb-4 p-2 rounded-lg bg-stone-100 dark:bg-stone-800 border dark:border-stone-700"
                      data-oid="n8_7:2q"
                    >
                      <p
                        className="text-xs text-stone-500 dark:text-stone-400 mb-2"
                        data-oid="yn8xhaa"
                      >
                        Preview:
                      </p>
                      <div
                        className="relative min-h-[128px] flex items-center justify-center bg-stone-50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-700"
                        data-oid="5nkrf9n"
                      >
                        <img
                          src={imageUrlInput}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="max-h-32 max-w-full rounded object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          data-oid="uw0_msy"
                        />

                        <div
                          className="hidden flex-col items-center justify-center text-stone-400 p-4"
                          data-oid="g54kgyv"
                        >
                          <ImageIcon className="w-8 h-8 mb-2 opacity-50" data-oid="zgb3ium" />
                          <p className="text-xs" data-oid="wyye_l2">
                            Preview unavailable
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2" data-oid="hf1clb3">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowImageUrlModal(false);
                        setImageUrlInput('');
                      }}
                      data-oid="ze:pz:d"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInsertImageUrl}
                      className="bg-stone-600 hover:bg-stone-700 text-white"
                      data-oid="e543pll"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" data-oid="qcxdfb5" />
                      Insert Image
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const countMatchingFeatures = ({ matching_features: feature }) => {
  if (!feature) return 0;
  if (feature.mode === 'paragraph') return (feature.text || '').match(/\[(\d+)\]/g)?.length || 0;
  return feature.questions?.length || 0;
};

const countTableBlanks = ({ table_data: table }) =>
  table?.blank_positions?.length ??
  table?.blanks?.length ??
  (typeof table?.blanks_count === 'number' ? table.blanks_count : 0);

const countMatchingHeadings = (question) =>
  question.matching_data?.paragraphs?.length ??
  question.questions?.length ??
  question.options?.length ??
  1;

const countFlowchartGaps = ({ flowchart }) =>
  flowchart?.steps
    ? flowchart.steps.reduce(
        (total, step) => total + (step.text?.match(/\[gap\]/g) || []).length,
        0
      )
    : 1;

const countGapFill = ({ gap_fill: gapFill }) =>
  gapFill?.gap_count || (gapFill?.structured_text?.match(/\[\d+\]/g) || []).length || 1;

const QUESTION_COUNTERS = {
  map_labeling: (question) =>
    question.map_labeling?.questions ? question.map_labeling.questions.length : 1,
  matching_features: countMatchingFeatures,
  table_completion: countTableBlanks,
  matching_headings: countMatchingHeadings,
  flowchart: countFlowchartGaps,
  flow_chart_completion: countFlowchartGaps,
  notes_completion: countGapFill,
  note_completion: countGapFill,
  summary_completion: countGapFill,
  sentence_completion: countGapFill,
  flowchart_completion: countGapFill,
  diagram_completion: countGapFill,
  multiple_choice: (question) =>
    question.allow_multiple ? Number.parseInt(question.question_count || 1, 10) : 1,
};

const getQuestionCount = (question) => QUESTION_COUNTERS[question.type]?.(question) ?? 1;

// --- Main Editor ---
const ReadingTestEditor = ({ initialData, onSave, onCancel, theme }) => {
  // Fallback theme if not provided
  const effectiveTheme = theme || { icon: BookOpen };

  const [sections, setSections] = useState(() => {
    if (initialData?.content) {
      try {
        const parsed = JSON.parse(initialData.content);
        if (Array.isArray(parsed))
          return parsed.map((s) => ({ ...s, groups: s.question_groups || [] }));
      } catch (e) {
        console.error('Failed to parse initial content:', e);
      }
    }
    return [
      {
        id: 1,
        title: initialData?.title || 'Passage 1',
        content: initialData?.content || '',
        groups: initialData?.groups || [],
      },
      { id: 2, title: 'Passage 2', content: '', groups: [] },
      { id: 3, title: 'Passage 3', content: '', groups: [] },
    ];
  });

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [passageMetadata, setPassageMetadata] = useState({
    title: initialData?.title || '',
    test_format: initialData?.test_format || 'Academic',
    topic: initialData?.topic || 'General Practice',
    is_official_cambridge: initialData?.is_official_cambridge || false,
    cambridge_year: initialData?.cambridge_year || new Date().getFullYear(),
    cambridge_test_number: initialData?.cambridge_test_number || 1,
    access_tier: initialData?.access_tier || 'free',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isPassageVisible, setIsPassageVisible] = useState(true);
  const [bulkImportConfig, setBulkImportConfig] = useState({ isOpen: false, mode: 'full' });
  const [showExplanationImport, setShowExplanationImport] = useState(false);
  // Track the saved passage ID to prevent creating multiple drafts on auto-save
  const [savedPassageId, setSavedPassageId] = useState(initialData?.id || null);

  // Resizable Layout State
  const [passageWidth, setPassageWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // Resize Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPassageWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const constrainedWidth = Math.min(75, Math.max(25, newPassageWidth));
      setPassageWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Auto-title: Book number = year - 2005 (e.g., 2015 = IELTS 10)
  useEffect(() => {
    if (passageMetadata.is_official_cambridge) {
      const bookNumber = passageMetadata.cambridge_year - 2005;
      setPassageMetadata((prev) => ({
        ...prev,
        title: `IELTS ${bookNumber} ${passageMetadata.test_format} ${passageMetadata.cambridge_year} Test ${passageMetadata.cambridge_test_number}`,
      }));
    }
  }, [
    passageMetadata.is_official_cambridge,
    passageMetadata.cambridge_year,
    passageMetadata.cambridge_test_number,
    passageMetadata.test_format,
  ]);

  // Auto-Save Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (passageMetadata.title) {
        handleSave(true); // Silent save
      }
    }, 5000); // Autosave every 5 seconds
    return () => clearTimeout(timer);
  }, [sections, passageMetadata]);

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
      if (!newSections[activeSectionIndex]) return prev;
      newSections[activeSectionIndex].groups = newGroups;
      return newSections;
    });
  };

  const addGroup = () => {
    setSections((prev) => {
      const newSections = [...prev];
      if (!newSections[activeSectionIndex]) return prev;
      newSections[activeSectionIndex].groups = [
        ...newSections[activeSectionIndex].groups,
        {
          id: `g${Date.now()}`,
          instructions: '',
          questions: [],
          isCollapsed: false,
        },
      ];
      return newSections;
    });
  };

  const removeGroup = (groupId) => {
    setSections((prev) => {
      const newSections = [...prev];
      if (!newSections[activeSectionIndex]) return prev;
      newSections[activeSectionIndex].groups = newSections[activeSectionIndex].groups.filter(
        (g) => g.id !== groupId
      );
      return newSections;
    });
  };

  const updateGroup = (groupId, newGroup) => {
    setSections((prev) => {
      const newSections = [...prev];
      if (!newSections[activeSectionIndex]) return prev;
      newSections[activeSectionIndex].groups = newSections[activeSectionIndex].groups.map((g) =>
        g.id === groupId ? newGroup : g
      );
      return newSections;
    });
  };

  const addQuestionToGroup = (groupId, type = 'multiple_choice', count = 1, overrides = {}) => {
    setSections((prev) => {
      const newSections = [...prev];
      const s = newSections[activeSectionIndex];
      if (!s) return prev;
      const g = s.groups.find((g) => g.id === groupId);
      if (g) {
        g.isCollapsed = false;
        for (let i = 0; i < count; i++) {
          const newQ = {
            id: `q${Date.now()}-${i}-${Math.random()}`,
            type: type,
            question_text: '',
            options: ['', '', '', ''],
            correct_answer: '',
            ...overrides,
          };

          // Initialize complex types
          if (type === 'notes_completion') {
            newQ.gap_fill = { title: '', structured_text: '', gap_count: 0, ...newQ.gap_fill };
          } else if (type === 'matching_features') {
            newQ.matching_features = {
              style: 'list',
              questions: [],
              options: [],
              ...newQ.matching_features,
            };
          }

          g.questions.push(newQ);
        }
      }
      return newSections;
    });
  };

  const handleBulkImport = (questions, targetSectionIndex) => {
    try {
      const newSections = [...sections];
      // Ensure target section exists (though logic prevents invalid index)
      if (!newSections[targetSectionIndex]) return;

      // Group questions by 'group_instructions' to create logical groups
      // If instructions vary, new group. If sequential questions share instructions, same group.

      let currentGroup = null;
      let lastInstructions = null;

      questions.forEach((q) => {
        // Clean instructions for comparison
        const instr = q.group_instructions ? q.group_instructions.trim() : '';

        if (!currentGroup || instr !== lastInstructions) {
          // Start new group
          currentGroup = {
            id: `g${Date.now()}_${Math.random()}`,
            instructions: q.group_instructions || '',
            questions: [],
            isCollapsed: false,
          };
          newSections[targetSectionIndex].groups.push(currentGroup);
          lastInstructions = instr;
        }

        // Add question to current group
        // Ensure ID is unique
        currentGroup.questions.push({
          ...q,
          id:
            q.id && q.id.toString().startsWith('temp')
              ? `q${Date.now()}_${Math.random()}`
              : q.id || `q${Date.now()}_${Math.random()}`,
          // Remove temp fields if any
          group_instructions: undefined,
          section: undefined,
        });
      });

      setSections(newSections);
      toast.success(
        `Imported ${questions.length} questions into Passage ${targetSectionIndex + 1}`
      );
    } catch (error) {
      console.error('Bulk Import Error:', error);
      toast.error('Failed to import questions. Check console for details.');
    }
  };

  const handleBulkAnswerImport = (updatedQuestions, _targetSectionIndex) => {
    const newSections = [...sections];

    // Flatten updated questions for easy lookup by ID
    const answersMap = {};
    updatedQuestions.forEach((q) => {
      answersMap[q.id] = q;
    });

    let updateCount = 0;

    // GLOBAL UPDATE: Iterate over all sections
    newSections.forEach((section, sIdx) => {
      // Clone section
      const updatedSection = { ...section };
      let sectionModified = false;

      updatedSection.groups = updatedSection.groups.map((group) => {
        // Clone group
        const updatedGroup = { ...group };
        updatedGroup.questions = group.questions.map((q) => {
          const match = answersMap[q.id];
          if (match) {
            updateCount++;
            sectionModified = true;
            // Update relevant answer fields
            return {
              ...q,
              correct_answer: match.correct_answer,
              table_data: match.table_data,
              matching_features: match.matching_features,
              gap_fill: match.gap_fill,
              id: q.id,
            };
          }
          return q;
        });
        return updatedGroup;
      });

      if (sectionModified) {
        newSections[sIdx] = updatedSection;
      }
    });

    setSections(newSections);

    toast.success(`Updated answers for ${updateCount} questions across all sections.`);
  };

  const handleSave = useCallback(
    async (silent = false) => {
      if (!passageMetadata.title) {
        if (!silent) toast.error('Test Title is required');
        return;
      }
      if (!silent) setIsSaving(true);
      try {
        const sectionsToSave = sections.map((s, idx) => ({
          section_number: idx + 1,
          title: s.title,
          passage_name: s.title,
          content: s.content,
          question_groups: s.groups,
        }));
        let allQuestions = [];
        let globalQuestionCounter = 1;
        // Use savedPassageId (from previous saves) or initialData?.id
        const currentPassageId = savedPassageId || initialData?.id;
        sections.forEach((section, sIdx) => {
          (section.groups || []).forEach((group) => {
            group.questions.forEach((q) => {
              const count = getQuestionCount(q);
              allQuestions.push({
                ...q,
                group_instructions: group.instructions,
                question_number: globalQuestionCounter,
                section: sIdx + 1,
                passage_id: currentPassageId,
              });
              globalQuestionCounter += count;
            });
          });
        });
        const result = await onSave(
          {
            passage: {
              ...initialData,
              id: currentPassageId, // Use tracked ID for updates
              title: passageMetadata.title,
              test_type: 'reading',
              test_format: passageMetadata.test_format,
              topic: passageMetadata.topic,
              is_official_cambridge: passageMetadata.is_official_cambridge,
              cambridge_year: passageMetadata.cambridge_year,
              cambridge_test_number: passageMetadata.cambridge_test_number,
              access_tier: passageMetadata.access_tier,
              content: JSON.stringify(sectionsToSave),
            },
            questions: allQuestions,
          },
          { silent }
        );
        // Store the passage ID after first save to prevent creating duplicates
        if (result?.id && !savedPassageId) {
          setSavedPassageId(result.id);
        }
        setLastSaved(new Date());
      } catch (error) {
        console.error('Save failed:', error);
        if (!silent) toast.error('Save failed');
      } finally {
        if (!silent) setIsSaving(false);
      }
    },
    [passageMetadata, sections, savedPassageId, initialData, onSave]
  );

  // Memoize the flattened questions for input-only mode to prevent Modal state resets
  const flattenedQuestionsForImport = React.useMemo(() => {
    if (bulkImportConfig.mode !== 'answers_only') return [];

    return sections.flatMap((section) =>
      section.groups.flatMap((g) =>
        g.questions.map((q) => {
          // Calculate Start Number
          const startNum = (() => {
            let count = 1;
            for (let sIdx = 0; sIdx < sections.length; sIdx++) {
              for (let gIdx = 0; gIdx < sections[sIdx].groups.length; gIdx++) {
                const grp = sections[sIdx].groups[gIdx];
                for (let qIdx = 0; qIdx < grp.questions.length; qIdx++) {
                  const curr = grp.questions[qIdx];
                  if (curr.id === q.id) return count;
                  count += getQuestionCount(curr);
                }
              }
            }
            return 0;
          })();

          // Clone and inject numbers for sub-questions
          const enrichedQ = { ...q, question_number: startNum };

          if (enrichedQ.type === 'table_completion' && enrichedQ.table_data?.blank_positions) {
            enrichedQ.table_data = {
              ...enrichedQ.table_data,
              blank_positions: enrichedQ.table_data.blank_positions.map((b, idx) => ({
                ...b,
                blankNumber: startNum + idx,
              })),
            };
          }

          if (enrichedQ.type === 'matching_features' && enrichedQ.matching_features?.questions) {
            enrichedQ.matching_features = {
              ...enrichedQ.matching_features,
              questions: enrichedQ.matching_features.questions.map((mq, idx) => ({
                ...mq,
                questionNumber: startNum + idx,
              })),
            };
          }

          return enrichedQ;
        })
      )
    );
  }, [sections, bulkImportConfig.mode]);

  return (
    <div
      className="flex flex-col h-screen bg-stone-100 dark:bg-[#08080a] text-stone-900 dark:text-stone-50 overflow-hidden"
      data-oid="x88e.5l"
    >
      {/* Premium Header */}
      <TestEditorHeader
        title={passageMetadata.title}
        theme={effectiveTheme}
        metadata={passageMetadata}
        onMetadataChange={setPassageMetadata}
        onTitleChange={(t) => setPassageMetadata((prev) => ({ ...prev, title: t }))}
        onSave={handleSave}
        onCancel={onCancel}
        isSaving={isSaving}
        lastSaved={lastSaved}
        data-oid="_y45go4"
      >
        {/* Format Pill (Reading/Writing Specific) */}
        <div className="flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-stone-200/80 dark:border-white/[0.07] bg-stone-50 dark:bg-white/3 shrink-0">
          <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500')}>Format</span>
          <Select
            value={passageMetadata.test_format}
            onValueChange={(val) => setPassageMetadata((prev) => ({ ...prev, test_format: val }))}
            data-oid="i2wjt:r"
          >
            <SelectTrigger
              className="h-4 w-auto gap-1 border-0 bg-transparent p-0 text-[11px] font-bold focus:ring-0 text-stone-900 dark:text-stone-100"
              data-oid="-xztmsw"
            >
              <SelectValue data-oid="tlpqd7p" />
            </SelectTrigger>
            <SelectContent data-oid="f8rp174">
              <SelectItem value="Academic" data-oid="_ncqus3">
                Academic
              </SelectItem>
              <SelectItem value="General" data-oid="zkw80pz">
                General
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => setIsPassageVisible(!isPassageVisible)}
          title={isPassageVisible ? 'Hide Passage' : 'Show Passage'}
          className="hidden md:grid h-7 w-7 place-items-center rounded-md border border-dashed border-stone-300 dark:border-white/15 text-stone-500 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors shrink-0"
          data-oid="sp_2pb7"
        >
          {isPassageVisible ? (
            <AlignLeft className="w-3.5 h-3.5" data-oid="4mh-vw5" />
          ) : (
            <BookOpen className="w-3.5 h-3.5" data-oid="u53.ifd" />
          )}
        </button>
      </TestEditorHeader>

      {/* Content Split */}
      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden relative min-h-0"
        data-oid="bqx_a2:"
      >
        {/* Left: Passage Editor */}
        {isPassageVisible && (
          <div
            className="flex flex-col z-10 border-r border-stone-200/80 dark:border-white/[0.07] bg-white dark:bg-[#131315] h-full min-h-0"
            style={{ width: `${passageWidth}%` }}
            data-oid="mro4rtk"
          >
            <Tabs
              value={String(activeSectionIndex)}
              onValueChange={(v) => setActiveSectionIndex(Number(v))}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              data-oid="w292-00"
            >
              <div
                className="p-3 border-b border-stone-200/80 dark:border-white/[0.07]"
                data-oid="t268v-z"
              >
                <TabsList
                  className={cn(ADMIN_TABS_LIST, 'w-full grid')}
                  style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}
                  data-oid="0l0urcb"
                >
                  {sections.map((_, idx) => (
                    <TabsTrigger
                      key={idx}
                      value={String(idx)}
                      className={ADMIN_TAB_TRIGGER}
                      data-oid="lc-e3b."
                    >
                      <span className="flex items-center gap-1.5 z-10 relative" data-oid="vy::a6i">
                        <span
                          className="flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold bg-stone-200 dark:bg-white/10 text-stone-600 dark:text-stone-300"
                          data-oid="hz302ht"
                        >
                          {idx + 1}
                        </span>
                        <span data-oid="u.getx1">Passage {idx + 1}</span>
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <TabsContent
                value={String(activeSectionIndex)}
                className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto m-0 text-foreground min-h-0"
                data-oid="rth:f6v"
              >
                <div className="flex-1 flex flex-col" data-oid="4_3nsh7">
                  <div className="flex justify-between items-center mb-3" data-oid="jhthbk:">
                    <h3
                      className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"
                      data-oid="uhi8.8o"
                    >
                      <AlignLeft className="w-3 h-3" data-oid="96we-7o" /> Passage Content
                    </h3>
                    <Input
                      value={sections[activeSectionIndex].title}
                      onChange={(e) => {
                        const n = [...sections];
                        n[activeSectionIndex].title = e.target.value;
                        setSections(n);
                      }}
                      placeholder="Passage Title"
                      className="h-7 w-1/2 text-xs bg-white dark:bg-stone-900 dark:border-stone-700 dark:text-stone-200"
                      data-oid="x-gmzqe"
                    />
                  </div>
                  <div className="flex-1 min-h-[400px]" data-oid="g2xln5v">
                    <RichTextEditor
                      value={sections[activeSectionIndex].content}
                      onChange={(val) => {
                        const n = [...sections];
                        n[activeSectionIndex].content = val;
                        setSections(n);
                      }}
                      className="min-h-full h-full bg-white dark:bg-stone-950 shadow-sm"
                      rows={40}
                      data-oid="g5dqr4r"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Resize Handle */}
        {isPassageVisible && (
          <div
            className="w-0.5 hover:w-1 cursor-col-resize flex items-center justify-center group transition-all relative z-50 bg-stone-200 dark:bg-white/10 hover:bg-stone-400 dark:hover:bg-white/20"
            onMouseDown={() => setIsResizing(true)}
            data-oid="pcf_5op"
          >
            <div
              className="w-4 h-8 rounded-full bg-white dark:bg-[#1b1b1e] shadow-sm border border-stone-200/80 dark:border-white/10 flex items-center justify-center transition-colors group-hover:border-stone-400 dark:group-hover:border-white/20"
              data-oid="agebkc0"
            >
              <GripVertical
                className="w-3 h-3 text-muted-foreground group-hover:text-primary"
                data-oid="mzxqvpi"
              />
            </div>
          </div>
        )}

        {/* Right: Question Groups */}
        <div
          className="flex flex-col h-full min-h-0 bg-stone-50 dark:bg-white/1.5 overflow-y-auto p-3 md:p-4"
          style={{ width: isPassageVisible ? `${100 - passageWidth}%` : '100%' }}
          data-oid="34j-1tj"
        >
          <div className="max-w-4xl mx-auto space-y-4 w-full" data-oid="47n62f:">
            <div
              className={cn(PANEL, 'flex flex-wrap justify-between items-center gap-4 p-4')}
              data-oid="w2ds3jg"
            >
              <div className="min-w-[200px]" data-oid="zf.oahq">
                <h2
                  className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2"
                  data-oid="9jslgqu"
                >
                  Questions (Passage {activeSectionIndex + 1})
                </h2>
                <p className="text-stone-500 dark:text-stone-400 text-xs" data-oid="8s3oqtu">
                  Manage questions for this passage.
                </p>
              </div>
              <div className="flex flex-wrap gap-2" data-oid="eieprnh">
                <AdminButton
                  onClick={() => setBulkImportConfig({ isOpen: true, mode: 'answers_only' })}
                  variant="outline"
                  title="Import Answers Only"
                  data-oid="gr582.n"
                >
                  <List className="w-3.5 h-3.5" data-oid="jlncz0j" /> Answers
                </AdminButton>
                <AdminButton
                  onClick={() => setBulkImportConfig({ isOpen: true, mode: 'full' })}
                  variant="outline"
                  data-oid="19bserm"
                >
                  <FileText className="w-3.5 h-3.5" data-oid="alezjg2" /> Questions
                </AdminButton>
                <AdminButton
                  onClick={() => setShowExplanationImport(true)}
                  variant="outline"
                  title="Import Paraphrase Detective Explanations"
                  data-oid="explanation-import-btn"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Explanations
                </AdminButton>
                <AdminButton onClick={addGroup} data-oid="rsx-6m7">
                  <Plus className="w-3.5 h-3.5" data-oid="-p.y91_" /> Add Group
                </AdminButton>
              </div>
            </div>

            <Reorder.Group
              axis="y"
              values={sections[activeSectionIndex].groups || []}
              onReorder={handleGroupReorder}
              className="space-y-6"
              data-oid="kxrz2nz"
            >
              {(sections[activeSectionIndex].groups || []).map((group, gIndex) => (
                <QuestionGroupItem
                  key={group.id}
                  group={group}
                  index={gIndex}
                  activeSectionIndex={activeSectionIndex}
                  startNumbers={startNumbers}
                  updateGroup={updateGroup}
                  removeGroup={removeGroup}
                  addQuestionToGroup={addQuestionToGroup}
                  effectiveTheme={effectiveTheme}
                  data-oid="s7besuj"
                />
              ))}
            </Reorder.Group>
            {(!sections[activeSectionIndex].groups ||
              sections[activeSectionIndex].groups.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-2xl bg-stone-50/60 dark:bg-white/2"
                data-oid="_4n8vck"
              >
                <div className="flex flex-col items-center gap-3" data-oid="1m6dv61">
                  <div
                    className="w-14 h-14 rounded-full bg-stone-100 dark:bg-white/4 flex items-center justify-center"
                    data-oid="3vn-ppr"
                  >
                    <FileText
                      className="w-6 h-6 text-stone-400 dark:text-stone-500"
                      data-oid="e3c1bq2"
                    />
                  </div>
                  <div data-oid="a7j130z">
                    <p
                      className="text-stone-700 dark:text-stone-200 font-bold text-sm mb-1"
                      data-oid="2mpl.by"
                    >
                      No questions added yet
                    </p>
                    <p
                      className="text-stone-400 dark:text-stone-500 text-xs max-w-xs mx-auto"
                      data-oid="90-zer:"
                    >
                      Start by adding a question group to creating your test structure.
                    </p>
                  </div>
                  <AdminButton
                    onClick={addGroup}
                    variant="outline"
                    className="mt-2"
                    data-oid="6z8nrmu"
                  >
                    Add First Group
                  </AdminButton>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <BulkImportModal
          isOpen={bulkImportConfig.isOpen}
          onClose={() => setBulkImportConfig({ ...bulkImportConfig, isOpen: false })}
          onImport={
            bulkImportConfig.mode === 'answers_only' ? handleBulkAnswerImport : handleBulkImport
          }
          testType="reading"
          initialSection={activeSectionIndex}
          mode={bulkImportConfig.mode}
          existingQuestions={flattenedQuestionsForImport}
          data-oid="-9d44fw"
        />
        <ExplanationImportModal
          isOpen={showExplanationImport}
          onClose={() => setShowExplanationImport(false)}
          questions={sections[activeSectionIndex]?.groups?.flatMap((g) => g.questions) || []}
          passageId={savedPassageId}
          startNum={startNumbers[`${activeSectionIndex}-0`] || 1}
          onExplanationsUpdated={(updates) => {
            // updates is an array of { id, data }
            setSections((prev) => {
              const newSections = [...prev];
              const section = newSections[activeSectionIndex];
              if (!section) return prev;

              section.groups = section.groups.map((group) => ({
                ...group,
                questions: group.questions.map((q) => {
                  const update = updates.find((u) => u.id === q.id);
                  if (update) {
                    return { ...q, explanation_data: update.data };
                  }
                  return q;
                }),
              }));
              return newSections;
            });
          }}
        />
      </div>
    </div>
  );
};

// --- Group Component (Premium) ---
const QuestionGroupItem = ({
  group,
  index,
  activeSectionIndex,
  startNumbers,
  updateGroup,
  removeGroup,
  addQuestionToGroup,
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
      data-oid="2_z9zn2"
    >
      <QuestionGroupEditor
        group={group}
        startNum={startNumbers[`${activeSectionIndex}-${index}`] || 1}
        onUpdate={(newG) => updateGroup(group.id, newG)}
        onRemove={() => removeGroup(group.id)}
        onAddQuestion={(type, count, overrides) =>
          addQuestionToGroup(group.id, type, count, overrides)
        }
        theme={effectiveTheme}
        dragControls={dragControls}
        data-oid="88eiu23"
      />
    </Reorder.Item>
  );
};

const QuestionGroupEditor = ({
  group,
  onUpdate,
  onRemove,
  onAddQuestion,
  startNum,
  theme,
  dragControls,
}) => {
  // Local stone-based style tokens — QuestionGroupEditor concatenates these
  // into class strings below, so the shape here matters more than the
  // caller's `theme` prop (which only carries an `icon`, see BASE_THEME).
  const t = {
    ring: 'ring-stone-400/20',
    color: 'stone',
    lighter: 'bg-stone-50 dark:bg-white/2',
    primary: 'bg-stone-800 dark:bg-stone-600',
    text: 'text-stone-600 dark:text-stone-300',
    border: 'border-stone-200/80 dark:border-white/[0.07]',
    ...theme,
  };

  const totalQuestions = group.questions.reduce((acc, q) => acc + getQuestionCount(q), 0);
  const endNum = startNum + Math.max(0, totalQuestions - 1);
  const rangeLabel =
    totalQuestions > 0
      ? totalQuestions === 1
        ? `Question ${startNum}`
        : `Questions ${startNum}-${endNum}`
      : `Questions ${startNum} - ...`;

  const [addType, setAddType] = useState('multiple_choice');
  const [addCount, setAddCount] = useState(5);

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white dark:bg-[#131315] rounded-xl border border-stone-200/80 dark:border-white/[0.07] transition-all ${group.isCollapsed ? 'shadow-xs' : 'shadow-md'}`}
      data-oid="h64_h:t"
    >
      <div
        className={`p-4 flex items-center justify-between cursor-pointer transition-colors rounded-t-xl ${group.isCollapsed ? 'hover:bg-stone-50 dark:hover:bg-white/5' : t.lighter}`}
        onClick={() => onUpdate({ ...group, isCollapsed: !group.isCollapsed })}
        data-oid="3bpybzb"
      >
        <div className="flex items-center gap-2" data-oid="8is8ba4">
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            onPointerDown={(e) => dragControls.start(e)}
            data-oid="0:7xd6x"
          >
            <GripVertical className="w-4 h-4" data-oid="ssxp7th" />
          </div>
          <div className="flex items-center gap-3" data-oid="c.q9alw">
            <div
              className={`p-1.5 rounded-lg transition-transform duration-300 ${group.isCollapsed ? '-rotate-90 bg-stone-100 dark:bg-[#18181b] text-stone-500 dark:text-stone-300 border border-stone-200/80 dark:border-white/10' : 'rotate-0 bg-stone-600 dark:bg-stone-600 text-white shadow-sm'}`}
              data-oid="e.ijww."
            >
              <ChevronDown className="w-4 h-4" data-oid="69gtvby" />
            </div>
            <div data-oid="2zdfel7">
              <div className="flex items-center gap-2" data-oid="m64oosy">
                <span className="font-bold text-sm text-foreground" data-oid="-:j1ezq">
                  {rangeLabel}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-black bg-white dark:bg-stone-800 border-stone-100 dark:border-white/10 text-stone-600 dark:text-stone-300 shadow-sm uppercase tracking-widest px-2"
                  data-oid="tehx0q4"
                >
                  {totalQuestions} questions
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" data-oid="02ainwd">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="h-8 w-8 p-0 text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.06)] dark:hover:bg-[rgb(var(--signal-fault)/0.06)] rounded-full transition-colors"
            data-oid="0fj6yjb"
          >
            <Trash2 className="w-4 h-4" data-oid="fvjye0l" />
          </Button>
        </div>
      </div>

      <AnimatePresence data-oid="eizv1fx">
        {!group.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50"
            data-oid="o:x74mc"
          >
            <div className="p-5 space-y-6" data-oid="9-szmdu">
              {/* Instructions Block */}
              <div
                className="bg-stone-50/50 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-800"
                data-oid="dtwnn_j"
              >
                <label
                  className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1"
                  data-oid="xv31c3m"
                >
                  <List className="w-3 h-3" data-oid="bgd313_" /> Group Instructions
                </label>
                <RichTextEditor
                  value={group.instructions}
                  onChange={(v) => onUpdate({ ...group, instructions: v })}
                  placeholder="e.g. Choose the correct letter, A, B, C or D."
                  rows={2}
                  className="bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 focus-within:ring-0 focus-within:border-stone-400"
                  mode="simple"
                  data-oid="._a1g7:"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-4" data-oid="vidsg1k">
                {group.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="relative pl-4 border-l-2 border-stone-100 dark:border-stone-800 hover:border-stone-500/50 transition-colors group/item"
                    data-oid="t0x14oz"
                  >
                    <div className="flex justify-between items-start mb-3" data-oid="aiav2az">
                      <div className="flex items-center gap-3" data-oid="shipgsj">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold tracking-wider ${t.text} ${t.border} bg-white dark:bg-[#131315] shadow-sm`}
                          data-oid="gk1mwhe"
                        >
                          {q.type.replace(/_/g, ' ')}
                        </Badge>

                        {/* Multi-Select Logic */}
                        {q.type === 'multiple_choice' && (
                          <div
                            className="flex items-center gap-2 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900"
                            data-oid="uws1qbl"
                          >
                            <Checkbox
                              id={`multi-${q.id}`}
                              checked={q.allow_multiple}
                              onCheckedChange={(c) => updateQuestion(qIdx, 'allow_multiple', c)}
                              className="h-4 w-4 rounded-sm border-2 border-stone-300 dark:border-stone-600 data-[state=checked]:bg-linear-to-r/srgb data-[state=checked]:from-stone-500 data-[state=checked]:to-stone-600 data-[state=checked]:border-stone-500 data-[state=checked]:text-white data-[state=checked]:shadow-sm data-[state=checked]: transition-all duration-200"
                              data-oid="gnzjjnp"
                            />

                            <label
                              htmlFor={`multi-${q.id}`}
                              className="text-[10px] font-medium cursor-pointer whitespace-nowrap text-stone-600 dark:text-stone-400"
                              data-oid="sp-jw4l"
                            >
                              Multi-Select
                            </label>
                            {q.allow_multiple && (
                              <Input
                                type="number"
                                className="w-8 h-4 text-[10px] p-0 text-center border-0 bg-transparent"
                                value={q.question_count || 2}
                                onChange={(e) =>
                                  updateQuestion(qIdx, 'question_count', e.target.value)
                                }
                                data-oid="69ro3d9"
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
                        data-oid="h_3::gm"
                      >
                        <X className="w-3 h-3" data-oid="2xo4etb" />
                      </Button>
                    </div>

                    <div className="space-y-3" data-oid="7wdczbx">
                      {/* Question Renderers */}
                      {q.type === 'multiple_choice' && (
                        <>
                          <Input
                            value={q.question_text}
                            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                            placeholder="Type your question here..."
                            className="font-medium bg-transparent border-0 border-b border-stone-200 dark:border-stone-800 rounded-none px-0 focus-visible:ring-0 focus-visible:border-stone-500 placeholder:text-stone-400"
                            data-oid="n8or7:q"
                          />

                          <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2"
                            data-oid="zw3w-en"
                          >
                            {q.options.map((opt, oI) => (
                              <div
                                key={oI}
                                className="flex gap-2 items-center group/option"
                                data-oid="yn6jlls"
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
                                      ? `${t.primary} text-white dark:text-stone-900 border-transparent`
                                      : 'bg-white dark:bg-[#131315] border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-white/25'
                                  }`}
                                  data-oid="kgfkfqc"
                                >
                                  {String.fromCharCode(65 + oI)}
                                </button>
                                <div className="relative flex-1" data-oid="zlpagka">
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const nO = [...q.options];
                                      nO[oI] = e.target.value;
                                      updateQuestion(qIdx, 'options', nO);
                                    }}
                                    className="h-8 text-sm bg-stone-50 dark:bg-stone-900/50 border-transparent focus:bg-white dark:focus:bg-stone-900 focus:border-stone-200 transition-all"
                                    placeholder={`Option ${String.fromCharCode(65 + oI)}`}
                                    data-oid="maer:7:"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Standard Input Types with Optional Title */}
                      {(q.type === 'short_answer' ||
                        q.type === 'sentence_completion' ||
                        q.type === 'summary_completion') && (
                        <div className="grid grid-cols-1 gap-3" data-oid="zgyh7:g">
                          {/* Title Input (always show for short_answer/summary_completion) */}
                          {(q.type === 'short_answer' || q.type === 'summary_completion') && (
                            <div
                              className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700"
                              data-oid="kchsz1r"
                            >
                              <span
                                className="text-[10px] font-bold uppercase text-stone-400 whitespace-nowrap"
                                data-oid="zd3oydl"
                              >
                                Box Title:
                              </span>
                              <Input
                                value={q.gap_fill?.title || ''}
                                onChange={(e) =>
                                  updateQuestion(qIdx, 'gap_fill', {
                                    ...q.gap_fill,
                                    title: e.target.value,
                                  })
                                }
                                placeholder="e.g. Why believe the 'light screen' hypothesis?"
                                className="h-7 bg-white dark:bg-stone-900 border-0 focus-visible:ring-1 focus-visible: font-medium text-sm"
                                data-oid="92n3e-p"
                              />
                            </div>
                          )}
                          <div
                            className="flex justify-between items-center bg-stone-50 dark:bg-stone-900 p-2 rounded-lg border border-stone-100 dark:border-stone-800 focus-within:ring-1 focus-within:"
                            data-oid="9xgdzas"
                          >
                            <Input
                              id={`q-text-${q.id}`}
                              value={q.question_text}
                              onChange={(e) =>
                                updateQuestion(qIdx, 'question_text', e.target.value)
                              }
                              placeholder="Statement or Question Text..."
                              className="flex-1 bg-transparent border-0 focus-visible:ring-0 h-auto py-0"
                              data-oid="7s1ome1"
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              className="h-6 text-[10px] ml-2"
                              onClick={() => {
                                const blank = '_____';
                                const input = document.getElementById(`q-text-${q.id}`);
                                if (input) {
                                  const start = input.selectionStart;
                                  const end = input.selectionEnd;
                                  const text = q.question_text || '';
                                  const newText =
                                    text.substring(0, start) + blank + text.substring(end);
                                  updateQuestion(qIdx, 'question_text', newText);
                                  // Refocus after state update (slight delay)
                                  setTimeout(() => {
                                    input.focus();
                                    input.setSelectionRange(
                                      start + blank.length,
                                      start + blank.length
                                    );
                                  }, 0);
                                } else {
                                  updateQuestion(
                                    qIdx,
                                    'question_text',
                                    (q.question_text || '') + blank
                                  );
                                }
                              }}
                              data-oid="t4n6uo2"
                            >
                              + Blank
                            </Button>
                          </div>
                          <div className="flex items-center gap-3" data-oid="wohuqd6">
                            <span className="text-xs font-medium text-stone-500" data-oid="6kpx5ap">
                              Correct Answer:
                            </span>
                            <Input
                              value={q.correct_answer}
                              onChange={(e) =>
                                updateQuestion(qIdx, 'correct_answer', e.target.value)
                              }
                              placeholder="Enter strict answer key"
                              className="h-8 w-full max-w-sm font-mono text-sm border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)] bg-[rgb(var(--signal-ok)/0.06)] border-[rgb(var(--signal-ok)/0.3)] text-[rgb(var(--signal-ok))] text-[rgb(var(--signal-ok))]"
                              data-oid="xfqmmtv"
                            />
                          </div>
                        </div>
                      )}

                      {/* Notes Completion Type - Structured text with inline gaps */}
                      {q.type === 'notes_completion' && (
                        <div className="grid grid-cols-1 gap-3" data-oid="29ssvpg">
                          {/* Title Input */}
                          <div
                            className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-2 rounded-lg border border-stone-200 dark:border-stone-700"
                            data-oid=":2jw7sy"
                          >
                            <span
                              className="text-[10px] font-bold uppercase text-stone-400 whitespace-nowrap"
                              data-oid="yx-_n.0"
                            >
                              Title:
                            </span>
                            <Input
                              value={q.gap_fill?.title || ''}
                              onChange={(e) =>
                                updateQuestion(qIdx, 'gap_fill', {
                                  ...q.gap_fill,
                                  title: e.target.value,
                                })
                              }
                              placeholder="e.g. Wildfires"
                              className="h-7 bg-white dark:bg-stone-900 border-0 focus-visible:ring-1 focus-visible: font-medium text-sm"
                              data-oid="28zravl"
                            />
                          </div>

                          {/* Structured Text Textarea */}
                          <div className="space-y-1" data-oid="sm7y_zk">
                            <div className="flex items-center justify-between" data-oid=".ty6:u5">
                              <div className="flex items-center gap-2" data-oid="notes-label-row">
                                <span
                                  className="text-xs font-medium text-stone-500"
                                  data-oid="2eq_owm"
                                >
                                  Structured Notes Content:
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="h-5 text-[10px] px-2 py-0 hover:bg-stone-50 dark:hover:bg-stone-900/20 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                                  onClick={() => {
                                    const text = q.gap_fill?.structured_text || '';
                                    const gaps = Array.from(text.matchAll(/\[(\d+)\]/g)).map((m) =>
                                      parseInt(m[1])
                                    );
                                    const nextGap = gaps.length > 0 ? Math.max(...gaps) + 1 : 1;
                                    const gapToken = `[${nextGap}]`;

                                    const textarea = document.getElementById(`notes-text-${q.id}`);
                                    if (textarea) {
                                      const start = textarea.selectionStart;
                                      const end = textarea.selectionEnd;
                                      const newValue =
                                        text.substring(0, start) + gapToken + text.substring(end);

                                      // Use the same counting logic as onChange
                                      const count = (newValue.match(/\[\d+\]/g) || []).length;

                                      updateQuestion(qIdx, 'gap_fill', {
                                        ...q.gap_fill,
                                        structured_text: newValue,
                                        gap_count: count,
                                      });

                                      setTimeout(() => {
                                        textarea.focus();
                                        textarea.setSelectionRange(
                                          start + gapToken.length,
                                          start + gapToken.length
                                        );
                                      }, 0);
                                    }
                                  }}
                                  data-oid="insert-notes-gap-btn"
                                >
                                  + Insert Gap
                                </Button>
                              </div>
                              {q.gap_fill?.gap_count > 0 && (
                                <span
                                  className="text-xs text-stone-600 dark:text-stone-400 font-medium"
                                  data-oid="ptugbf4"
                                >
                                  {q.gap_fill.gap_count} gap(s) detected
                                </span>
                              )}
                            </div>
                            <Textarea
                              id={`notes-text-${q.id}`}
                              value={q.gap_fill?.structured_text || ''}
                              onChange={(e) => {
                                const text = e.target.value;
                                const count = (text.match(/\[\d+\]/g) || []).length;
                                updateQuestion(qIdx, 'gap_fill', {
                                  ...q.gap_fill,
                                  structured_text: text,
                                  gap_count: count,
                                });
                              }}
                              placeholder={`Use [N] for gaps, e.g.:\n● Characteristics of wildfires:\n– occurrence: more frequent\n– movement: [1] more unpredictably`}
                              className="min-h-[200px] font-mono text-sm bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700"
                              data-oid="w_647y2"
                            />

                            <p className="text-[10px] text-stone-400" data-oid="56mwscv">
                              Use ● for main bullets, – for sub-bullets. Use [1], [2], etc. for gap
                              placeholders.
                            </p>
                          </div>

                          {/* Answers Configuration */}
                          {q.gap_fill?.gap_count > 0 && (
                            <div
                              className="bg-stone-50/50 dark:bg-white/2 border border-stone-200/80 dark:border-white/[0.07] rounded-xl p-3 space-y-3"
                              data-oid="8:kyuh1"
                            >
                              <div className="flex items-center justify-between" data-oid="dx.t:oy">
                                <span
                                  className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-300 tracking-wider"
                                  data-oid="90yibzj"
                                >
                                  Answers Configuration
                                </span>
                              </div>
                              <div
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                                data-oid="el2mqvk"
                              >
                                {(() => {
                                  const text = q.gap_fill.structured_text || '';
                                  const gaps = Array.from(text.matchAll(/\[(\d+)\]/g)).map((m) =>
                                    parseInt(m[1])
                                  );
                                  const uniqueGaps = [...new Set(gaps)].sort((a, b) => a - b);

                                  return uniqueGaps.map((num) => (
                                    <div
                                      key={num}
                                      className="flex items-center gap-2 group"
                                      data-oid="yp71lkf"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center shrink-0 border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-300 bg-white dark:bg-[#18181b]"
                                        data-oid="w0ajnh0"
                                      >
                                        {num}
                                      </Badge>
                                      <Input
                                        value={q.gap_fill?.answers?.[num] || ''}
                                        onChange={(e) => {
                                          const newAnswers = { ...(q.gap_fill.answers || {}) };
                                          newAnswers[num] = e.target.value;
                                          updateQuestion(qIdx, 'gap_fill', {
                                            ...q.gap_fill,
                                            answers: newAnswers,
                                          });
                                        }}
                                        placeholder="Correct answer"
                                        className="h-8 text-xs border-stone-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-stone-900 dark:text-stone-100 focus-visible:ring-1 focus-visible:ring-stone-400/30"
                                        data-oid="r4g1o02"
                                      />
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {(q.type === 'flowchart' || q.type === 'flow_chart_completion') && (
                        <FlowchartBuilder
                          initialData={q.flowchart}
                          onChange={(flowchart) => updateQuestion(qIdx, 'flowchart', flowchart)}
                          theme={theme}
                        />
                      )}

                      {/* TFNG Types */}
                      {(q.type === 'true_false_not_given' || q.type === 'yes_no_not_given') && (
                        <div
                          className="flex items-center gap-4 p-2 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-100 dark:border-stone-800"
                          data-oid="z25p19m"
                        >
                          <Input
                            value={q.question_text}
                            onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                            placeholder="Statement text..."
                            className="flex-1 bg-transparent border-0 focus-visible:ring-0"
                            data-oid="k-rr9w9"
                          />

                          <div
                            className="flex gap-1 bg-white dark:bg-stone-950 p-1 rounded-md border shadow-sm"
                            data-oid="3:hajm3"
                          >
                            {(q.type === 'yes_no_not_given'
                              ? ['YES', 'NO', 'NOT GIVEN']
                              : ['TRUE', 'FALSE', 'NOT GIVEN']
                            ).map((o) => (
                              <button
                                key={o}
                                onClick={() => updateQuestion(qIdx, 'correct_answer', o)}
                                className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${q.correct_answer === o ? 'bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-900' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                data-oid="bq3qxl."
                              >
                                {o === 'NOT GIVEN' ? 'NG' : o.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advanced Types */}
                      {q.type === 'matching_features' && (
                        <MatchingFeaturesBuilder
                          initialData={q.matching_features}
                          startNum={(() => {
                            let off = 0;
                            for (let i = 0; i < qIdx; i++)
                              off += getQuestionCount(group.questions[i]);
                            return startNum + off;
                          })()}
                          onChange={(d) => updateQuestion(qIdx, 'matching_features', d)}
                          data-oid="o92xv9j"
                        />
                      )}
                      {q.type === 'table_completion' && (
                        <TableBuilder
                          initialData={q.table_data}
                          startNum={(() => {
                            let off = 0;
                            for (let i = 0; i < qIdx; i++)
                              off += getQuestionCount(group.questions[i]);
                            return startNum + off;
                          })()}
                          onChange={(d) => updateQuestion(qIdx, 'table_data', d)}
                          data-oid="-:lcy_r"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Footer */}
              <div
                className="flex flex-wrap items-center gap-3 pt-4 mt-6 border-t border-dashed border-stone-200 dark:border-stone-800"
                data-oid="wre6fms"
              >
                <DropdownMenu data-oid="-ytuila">
                  <DropdownMenuTrigger asChild data-oid="sgvtms:">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 rounded-full border-dashed hover:border-solid hover:bg-stone-50 dark:hover:bg-stone-800 transition-all text-xs font-medium"
                      data-oid="qft9hn."
                    >
                      <Plus className="w-3.5 h-3.5 mr-2 text-stone-500" data-oid="3q3yhce" /> Add
                      Single Question
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 p-1" data-oid="nsiw_kp">
                    <div
                      className="px-2 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider"
                      data-oid="5ij3nke"
                    >
                      Basic Types
                    </div>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('multiple_choice', 1)}
                      data-oid="qz2nezz"
                    >
                      <CheckSquare className="w-3.5 h-3.5 mr-2 opacity-70" data-oid="gj_r4h_" />{' '}
                      Multiple Choice
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('true_false_not_given', 1)}
                      data-oid="m2v-x-x"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-2 opacity-70" data-oid=":kpf416" />{' '}
                      True / False
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('short_answer', 1)}
                      data-oid="8g8p9vn"
                    >
                      <PenTool className="w-3.5 h-3.5 mr-2 opacity-70" data-oid="gz9lt_3" /> Short
                      Answer
                    </DropdownMenuItem>
                    <div
                      className="px-2 py-1.5 text-xs font-medium text-stone-400 uppercase tracking-wider mt-2"
                      data-oid="zltq.j5"
                    >
                      Complex Types
                    </div>

                    <DropdownMenuItem
                      onClick={() => onAddQuestion('matching_features', 1)}
                      data-oid="2oiw1gm"
                    >
                      <List className="w-3.5 h-3.5 mr-2 opacity-70" data-oid="h4pz2uh" /> Matching
                      Features
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onAddQuestion('table_completion', 1)}
                      data-oid="_5d52j_"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 mr-2 opacity-70" data-oid="w5atpf6" />{' '}
                      Table Completion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="ml-auto flex items-center gap-2" data-oid="h84y89r">
                  <span
                    className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mr-1"
                    data-oid="rre_698"
                  >
                    Quick Bulk Add
                  </span>
                  <div
                    className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 border dark:border-stone-700"
                    data-oid=":3i5i5p"
                  >
                    <select
                      className="h-7 bg-transparent text-xs border-0 focus:ring-0 text-stone-600 dark:text-stone-300 font-medium"
                      value={addType}
                      onChange={(e) => setAddType(e.target.value)}
                      data-oid="5lu7z-s"
                    >
                      <option value="multiple_choice" data-oid="7urlsqx">
                        Multiple Choice
                      </option>
                      <option value="true_false_not_given" data-oid="75y-e-v">
                        T/F/NG
                      </option>
                      <option value="short_answer" data-oid=".m.ulsg">
                        Short Answer
                      </option>
                      <option value="notes_completion" data-oid="1e4fodl">
                        Notes Completion
                      </option>
                    </select>
                    <div
                      className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1"
                      data-oid="dlm6neq"
                    />

                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="w-8 h-7 bg-transparent text-center text-xs border-0 focus:ring-0 p-0"
                      value={addCount}
                      onChange={(e) => setAddCount(e.target.value)}
                      data-oid="2edweuo"
                    />

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-stone-700 shadow-sm"
                      onClick={() => onAddQuestion(addType, parseInt(addCount) || 1)}
                      data-oid="6jq:74p"
                    >
                      <Plus className="w-3.5 h-3.5" data-oid="d-jp.6n" />
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

export default ReadingTestEditor;
