import React, { Suspense } from 'react';
import { Loader2, Type } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';
import { registerWritingDraftFlusher } from '@/features/testing/writing/writingDraftFlush';

// Hoisted so the <ReactQuill> `modules` prop keeps a stable identity across
// renders instead of being rebuilt on every keystroke-driven re-render.
const QUILL_MODULES = {
  toolbar: false,
  clipboard: { matchVisual: false },
};

// Lazy load ReactQuill to reduce initial bundle size (~200KB)
const ReactQuill = React.lazy(() =>
  import('react-quill-new').then((module) => {
    // Import styles after module is loaded
    import('react-quill-new/dist/quill.snow.css');
    import('@/styles/quill-custom.css');
    return module;
  })
);

// Loading fallback for the editor
const EditorSkeleton = () => (
  <div
    className="flex-1 flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-[#f4f3fb] dark:bg-white/4 md:min-h-[260px] container-border"
    data-oid=".9ka2dl"
  >
    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4 opacity-50" data-oid="ndugygt" />
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400" data-oid="y15z1qj">
      Loading editor...
    </span>
  </div>
);

function configureExamEditor(editor) {
  const root = editor?.getEditor?.().root;
  if (!root) return;

  root.setAttribute('spellcheck', 'false');
  root.setAttribute('autocorrect', 'off');
  root.setAttribute('autocapitalize', 'off');
  root.setAttribute('autocomplete', 'off');
  root.setAttribute('data-gramm', 'false');
  root.setAttribute('data-gramm_editor', 'false');
  root.setAttribute('data-enable-grammarly', 'false');
}

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
  testMode = 'practice',
  title,
  subtitle,
  previewMode = false,
}) {
  const [localValue, setLocalValue] = React.useState(writing);
  const [localWordCount, setLocalWordCount] = React.useState(globalWordCount);
  const [isFocused, setIsFocused] = React.useState(false);
  const debounceTimerRef = React.useRef(null);
  const isExamMode = testMode === 'exam' && !isCompleted;

  // Track the last value we synced to/from the parent to avoid self-updates
  const lastWritingRef = React.useRef(writing);

  const flushWriting = React.useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setWriting(lastWritingRef.current);
  }, [setWriting]);

  React.useEffect(() => {
    if (previewMode)
      return () => {
        flushWriting();
      };
    const unregister = registerWritingDraftFlusher(flushWriting);
    return () => {
      unregister();
      flushWriting();
    };
  }, [flushWriting, previewMode]);

  // Sync local state when external writing changes (e.g. task switch, session load)
  React.useEffect(() => {
    if (writing !== lastWritingRef.current) {
      lastWritingRef.current = writing;
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
    const words = content.replace(/<[^>]*>/g, ' ').match(/\S+/g) || [];
    setLocalWordCount(words.length);

    // 3. Update the ref immediately so that when the parent re-renders with the new value,
    // we know it was an update initiated by us and we don't reset the editor value.
    lastWritingRef.current = content;

    // 4. Debounce the heavy global store update to prevent main thread thrashing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setWriting(content);
    }, 500); // 500ms is the sweet spot for balance between performance and state consistency
  };

  const isTargetMet = localWordCount >= (targetLimit || 150);

  const setEditorRef = React.useCallback(
    (editor) => {
      if (isExamMode) configureExamEditor(editor);
    },
    [isExamMode]
  );

  return (
    <div
      className={cn('h-full min-h-0 w-full bg-[#fcfcfc] p-1.5 sm:p-2.5 md:p-3 dark:bg-[#08080a]')}
      data-oid="d7m1g:5"
    >
      {/* Editor Card */}
      <div
        className={cn(
          'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border bg-white shadow-xs transition-all duration-300 dark:bg-[#131315]',
          isFocused
            ? 'border-indigo-400 dark:border-indigo-500/40 ring-2 ring-indigo-500/10 dark:ring-indigo-500/20'
            : 'border-[#e4e2f0] dark:border-white/[0.07]'
        )}
        data-oid="h1s38r1"
      >
        {/* Header - Matches Annotation Card Header */}
        <div
          className="flex-none px-3.5 py-2.5 sm:px-4 sm:py-2.5 border-b border-[#ebeaf7] dark:border-white/[0.07] flex items-center justify-between gap-2.5 bg-white dark:bg-[#131315]"
          data-oid="h0d5wu9"
        >
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1" data-oid="oc:4-p.">
            <div
              className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg sm:rounded-xl shrink-0"
              data-oid="0rmcfsb"
            >
              <Type className="w-4 h-4 text-indigo-500" data-oid="vq38o:0" />
            </div>
            <div className="min-w-0 flex-1" data-oid="yfw.ehj">
              <h3
                className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate"
                title={title || 'Writing Workspace'}
                data-oid="yy3cf5a"
              >
                {title || 'Writing Workspace'}
              </h3>
              <p
                className="text-[10px] text-slate-400 dark:text-slate-400 font-medium truncate hidden min-[480px]:block"
                data-oid="m8-5q3s"
              >
                {subtitle || 'Write your response below'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" data-oid="toggle-wrapper">
            {/* Word Count Badge */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border text-[10px] sm:text-[11px] font-bold transition-colors select-none shrink-0',
                isTargetMet
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10 dark:text-slate-400'
              )}
              data-oid="sjizwz3"
            >
              <span className={NUM} data-oid=".cj99vs">
                {localWordCount} <span className="hidden min-[360px]:inline">words</span>
              </span>
              <span
                className="w-px h-2.5 sm:h-3 bg-current opacity-20 mx-0.5"
                aria-hidden="true"
                data-oid="sx.vo_a"
              />
              <span className={`opacity-75 ${NUM}`} data-oid="445lc2_">
                <span className="hidden min-[420px]:inline">Target: </span>
                {targetLimit || 150}
              </span>
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div
          className="flex-1 flex flex-col relative bg-[#f4f3fb]/20 dark:bg-white/1.5 min-h-0"
          data-oid="-xg5pl7"
        >
          <Suspense fallback={<EditorSkeleton data-oid=":m0npyd" />} data-oid="6d2awu9">
            <ReactQuill
              ref={setEditorRef}
              theme="snow"
              value={localValue}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                flushWriting();
              }}
              readOnly={isCompleted}
              spellCheck={!isExamMode}
              placeholder="Start writing your essay here..."
              className="flex-1 flex flex-col h-full bg-transparent
                               [&_.ql-container]:flex-1
                               [&_.ql-container]:flex
                               [&_.ql-container]:flex-col
                               [&_.ql-container]:h-full
                               [&_.ql-container]:min-h-0
                               [&_.ql-container]:border-none
                               [&_.ql-editor]:flex-1
                               [&_.ql-editor]:h-full
                               [&_.ql-editor]:min-h-[220px]
                               md:[&_.ql-editor]:min-h-[260px]
                               [&_.ql-editor]:px-3.5 sm:[&_.ql-editor]:px-5 md:[&_.ql-editor]:px-6 [&_.ql-editor]:pt-3! [&_.ql-editor]:pb-4! [&_.ql-editor.ql-blank::before]:top-3!
                               [&_.ql-editor]:text-[16px]
                               [&_.ql-editor]:leading-8
                               [&_.ql-editor]:font-serif
                               text-slate-800 dark:text-slate-100
                               [&_.ql-editor]:text-slate-800
                               dark:[&_.ql-editor]:text-slate-100
                               [&_.ql-editor_p]:text-slate-800
                               dark:[&_.ql-editor_p]:text-slate-100
                               [&_.ql-editor_*]:text-inherit
                               [&_.ql-editor::placeholder]:text-slate-400/50
                               dark:[&_.ql-editor::placeholder]:text-slate-400/60
                               [&_.ql-editor]:focus:outline-none
                               [&_.ql-toolbar]:hidden
                               [&_.ql-container]:overflow-y-auto
                               [&_.ql-editor.ql-blank::before]:font-sans
                               [&_.ql-editor.ql-blank::before]:text-slate-400/50
                               dark:[&_.ql-editor.ql-blank::before]:text-slate-400/60
                               [&_.ql-editor.ql-blank::before]:not-italic"
              modules={QUILL_MODULES}
              data-oid=":_0az-u"
            />
          </Suspense>
        </div>

        {/* Editor Status Bar */}
        <div
          className="flex-none px-3.5 py-2 sm:px-5 sm:py-2.5 border-t border-[#ebeaf7] dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#131315] text-xs text-slate-400 font-medium"
          data-oid="editor-status-bar"
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-300">
              {previewMode ? 'Local preview only' : 'Auto-saved to cloud'}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-500 dark:text-slate-300">
            <span className={NUM}>
              {(localValue || '').replace(/<[^>]*>?/gm, '').length} characters
            </span>
            <span className="w-px h-3 bg-slate-200 dark:bg-white/10" aria-hidden="true" />
            <span className={NUM}>
              Est. {Math.max(1, Math.ceil(localWordCount / 200))} min read
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
