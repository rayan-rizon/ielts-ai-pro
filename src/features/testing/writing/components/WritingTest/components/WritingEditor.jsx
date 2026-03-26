import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Type, LayoutPanelLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Lazy load ReactQuill to reduce initial bundle size (~200KB)
const ReactQuill = React.lazy(() =>
  import('react-quill').then((module) => {
    // Import styles after module is loaded
    import('react-quill/dist/quill.snow.css');
    import('@/styles/quill-custom.css');
    return module;
  })
);

// Loading fallback for the editor
const EditorSkeleton = () => (
  <div
    className="flex-1 flex flex-col min-h-[450px] items-center justify-center bg-slate-50 dark:bg-slate-900/50 container-border rounded-xl"
    data-oid=".9ka2dl"
  >
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4 opacity-50" data-oid="ndugygt" />
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400" data-oid="y15z1qj">
      Loading editor...
    </span>
  </div>
);

/**
 * WritingEditor
 *
 * Encapsulates ReactQuill editor and word count indicators.
 * Compact / Utilitarian Design.
 */
export function WritingEditor({
  writing,
  setWriting,
  wordCount: globalWordCount,
  targetLimit,
  isCompleted,
  isAnalyzing,
  currentFeedback,
  isSidebarClosed,
  onToggleSidebar,
  title,
  subtitle,
}) {
  const [localValue, setLocalValue] = React.useState(writing);
  const [localWordCount, setLocalWordCount] = React.useState(globalWordCount);
  const debounceTimerRef = React.useRef(null);

  // Sync local state when external writing changes (e.g. task switch, session load)
  React.useEffect(() => {
    if (writing !== localValue) {
      setLocalValue(writing);

      // Update local word count immediately on external sync
      const words = writing.replace(/<[^>]*>?/gm, ' ').match(/\S+/g) || [];
      setLocalWordCount(words.length);
    }
  }, [writing]);

  const handleChange = (content) => {
    // 1. Immediate local update for zero-latency typing
    setLocalValue(content);

    // 2. Immediate local word count for visual feedback
    const words = content.replace(/<[^>]*>?/gm, ' ').match(/\S+/g) || [];
    setLocalWordCount(words.length);

    // 3. Debounce the heavy global store update to prevent main thread thrashing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setWriting(content);
    }, 500); // 500ms is the sweet spot for balance between performance and state consistency
  };

  const isTargetMet = localWordCount >= (targetLimit || 150);

  return (
    <div
      className={cn(
        'w-full h-full bg-[#fcfcfc] dark:bg-[#050505] p-2 md:p-4 pt-0 md:pt-0' // Reduced padding and removed top padding
      )}
      data-oid="d7m1g:5"
    >
      {/* Editor Card */}
      <div
        className="w-full h-full flex flex-col bg-white dark:bg-[#0D0E1A] rounded-2xl border border-slate-200/60 dark:border-white/5 shadow-sm overflow-hidden relative"
        data-oid="h1s38r1"
      >
        {/* Header - Matches Annotation Card Header */}
        <div
          className="flex-none px-6 py-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0D0E1A]"
          data-oid="h0d5wu9"
        >
          <div className="flex items-center gap-3" data-oid="oc:4-p.">
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl" data-oid="0rmcfsb">
              <Type className="w-4 h-4 text-indigo-500" data-oid="vq38o:0" />
            </div>
            <div data-oid="yfw.ehj">
              <h3
                className="font-bold text-slate-800 dark:text-slate-100 text-sm"
                data-oid="yy3cf5a"
              >
                {title || 'Writing Workspace'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium" data-oid="m8-5q3s">
                {subtitle || 'Write your response below'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" data-oid="toggle-wrapper">
            {/* Mobile Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden h-8 w-8 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              title={isSidebarClosed ? 'Show Task' : 'Hide Task'}
              data-oid="mobile-toggle"
            >
              {isSidebarClosed ? (
                <LayoutPanelLeft className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            {/* Word Count Badge */}
            <div
              className={cn(
                'flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-colors',
                isTargetMet
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                  : 'bg-slate-50 border-slate-100 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400'
              )}
              data-oid="sjizwz3"
            >
              <span data-oid=".cj99vs">{localWordCount} words</span>
              <span className="w-px h-3 bg-current opacity-20 mx-0.5" data-oid="sx.vo_a"></span>
              <span className="opacity-70" data-oid="445lc2_">
                Target: {targetLimit || 150}
              </span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col relative" data-oid="-xg5pl7">
          <Suspense fallback={<EditorSkeleton data-oid=":m0npyd" />} data-oid="6d2awu9">
            <ReactQuill
              theme="snow"
              value={localValue}
              onChange={handleChange}
              readOnly={isCompleted}
              placeholder="Start writing your essay here..."
              className="flex-1 flex flex-col h-full bg-transparent
                               [&_.ql-container]:flex-1
                               [&_.ql-container]:border-none
                               [&_.ql-editor]:p-4 md:p-6 pt-2 md:pt-4
                               [&_.ql-editor]:text-[15px]
                               [&_.ql-editor]:leading-7
                               [&_.ql-editor]:font-serif
                               [&_.ql-editor]:text-slate-700
                               dark:[&_.ql-editor]:text-slate-100
                               [&_.ql-editor::placeholder]:text-slate-400/50
                               [&_.ql-editor::placeholder]:font-sans
                               [&_.ql-editor]:focus:outline-none
                               [&_.ql-toolbar]:hidden
                               [&_.ql-container]:overflow-y-auto
                               [&_.ql-editor.ql-blank::before]:font-sans
                               [&_.ql-editor.ql-blank::before]:text-slate-400/50
                               [&_.ql-editor.ql-blank::before]:not-italic"
              modules={{
                toolbar: false,
                clipboard: { matchVisual: false },
              }}
              data-oid=":_0az-u"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
