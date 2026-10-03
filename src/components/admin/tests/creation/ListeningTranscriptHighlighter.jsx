import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Code2, CornerUpLeft, Eye, FileText, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import {
  isSilenceSegment,
  parsePlainTranscript,
  parseSrt,
  resolveTranscriptSpeakers,
} from '@/utils/parseSrt';
import { buildHighlightedTranscript } from '@/features/testing/listening/components/ListeningTest/utils/transcriptPresentation';

function normalizePhrase(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseManualQuestionNumbers(value, minimum = 1, maximum = 40) {
  return [
    ...new Set(
      (String(value || '').match(/\d+/g) || [])
        .map((number) => Number.parseInt(number, 10))
        .filter((number) => Number.isFinite(number) && number >= minimum && number <= maximum)
    ),
  ].sort((a, b) => a - b);
}

function highlightQuestionNumbers(highlight) {
  return parseManualQuestionNumbers(
    highlight?.question_numbers ??
      highlight?.questionNumbers ??
      highlight?.question_number ??
      highlight?.questionNumber
  );
}

function highlightPhrase(highlight) {
  if (Array.isArray(highlight?.phrases)) return highlight.phrases.join(' · ');
  return highlight?.phrase ?? highlight?.text ?? '';
}

function highlightHasBadge(highlight) {
  return (highlight?.show_badge ?? highlight?.showBadge) !== false;
}

/**
 * A selection spanning several transcript segments is saved as consecutive
 * entries where every entry but the last carries `show_badge: false`. Editing
 * or removing one of those marks has to act on the whole run.
 */
function highlightGroupIndices(highlights, index) {
  if (!Array.isArray(highlights) || !highlights[index]) return [];

  let start = index;
  while (start > 0 && !highlightHasBadge(highlights[start - 1])) start -= 1;

  let end = index;
  while (end < highlights.length - 1 && !highlightHasBadge(highlights[end])) end += 1;

  return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
}

function sourceHighlightIndex(highlightKey) {
  const match = /^source-(\d+)-\d+$/.exec(String(highlightKey || ''));
  return match ? Number.parseInt(match[1], 10) : null;
}

function selectedTextInsideNode(range, node) {
  const nodeRange = document.createRange();
  nodeRange.selectNodeContents(node);
  const intersection = range.cloneRange();

  // Range.START_TO_START = 0; Range.END_TO_END = 2. Numeric constants avoid
  // relying on a global Range constructor in test and embedded-browser contexts.
  if (range.compareBoundaryPoints(0, nodeRange) <= 0) {
    intersection.setStart(nodeRange.startContainer, nodeRange.startOffset);
  }
  if (range.compareBoundaryPoints(2, nodeRange) >= 0) {
    intersection.setEnd(nodeRange.endContainer, nodeRange.endOffset);
  }

  return normalizePhrase(intersection.toString());
}

const WORD_CHARACTER = /[\p{L}\p{N}'\u2019-]/u;

function clampOffset(text, offset) {
  return Math.max(0, Math.min(offset, text.length));
}

function snapToWordStart(text, offset) {
  let index = clampOffset(text, offset);
  while (index > 0 && WORD_CHARACTER.test(text[index - 1])) index -= 1;
  return index;
}

function snapToWordEnd(text, offset) {
  let index = clampOffset(text, offset);
  while (index < text.length && WORD_CHARACTER.test(text[index])) index += 1;
  return index;
}

/** Character offset of a pointer position inside a rendered transcript segment. */
export function offsetFromPoint(x, y, segmentElement) {
  let node = null;
  let offset = 0;

  if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(x, y);
    if (!position) return null;
    node = position.offsetNode;
    offset = position.offset;
  } else if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(x, y);
    if (!range) return null;
    node = range.startContainer;
    offset = range.startOffset;
  }

  if (!node || !segmentElement.contains(node)) return null;

  // Safari may return a stale caret offset while a highlight is rerendered.
  // DOM Range offsets count characters in text nodes and children in elements.
  const maximum = [3, 4, 8].includes(node.nodeType)
    ? node.textContent.length
    : node.childNodes.length;
  if (!Number.isFinite(offset)) return null;
  const safeOffset = Math.max(0, Math.min(Math.trunc(offset), maximum));

  const measured = document.createRange();
  measured.selectNodeContents(segmentElement);
  measured.setEnd(node, safeOffset);
  return measured.toString().length;
}

function ResizeHandle({ edge, label, onPointerDown }) {
  return (
    <span
      role="separator"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'mx-px inline-block h-[1.05em] w-[5px] shrink-0 cursor-ew-resize rounded-full align-text-bottom',
        'bg-[#5a63df] ring-2 ring-white/70 dark:ring-[#100f15]',
        edge === 'start' ? 'mr-0.5' : 'ml-0.5'
      )}
    />
  );
}

function AnswerMark({ part, onEdit, onResizeStart, isFocused, segmentIndex, start, end }) {
  const questionNumbers = part.questionNumbers?.length
    ? part.questionNumbers
    : part.questionNumber
      ? [part.questionNumber]
      : [];
  const label = questionNumbers.join(',');

  if (!questionNumbers.length) return part.text;

  const highlightIndex = sourceHighlightIndex(part.highlightKey);
  const isEditable = Number.isFinite(highlightIndex) && typeof onEdit === 'function';
  const isResizable = isEditable && isFocused && typeof onResizeStart === 'function';

  const openEditor = (event) => {
    if (!isEditable) return;
    // A drag that ends on a mark is a new selection, not a request to edit it.
    if (!window.getSelection?.()?.isCollapsed) return;
    event.stopPropagation();
    onEdit(highlightIndex, event.currentTarget);
  };

  return (
    <mark
      className={cn(
        'rounded-sm bg-[#d9f6c7] px-0.5 font-semibold text-slate-950',
        'dark:bg-[rgb(var(--signal-ok)/0.34)] dark:text-slate-50',
        isEditable &&
          'cursor-pointer outline-hidden transition-shadow hover:ring-2 hover:ring-[rgb(var(--signal-ok)/0.55)] focus-visible:ring-2 focus-visible:ring-[#5a63df]',
        isFocused && 'ring-2 ring-[#5a63df]',
        part.showBadge !== false &&
          'after:ml-1 after:inline-flex after:min-w-4 after:items-center after:justify-center after:rounded-sm after:bg-[rgb(var(--signal-ok))] after:px-1 after:text-[9px] after:font-black after:leading-4 after:text-white after:content-[attr(data-answer-label)]'
      )}
      data-answer-label={part.showBadge === false ? undefined : label}
      data-highlight-index={Number.isFinite(highlightIndex) ? highlightIndex : undefined}
      role={isEditable ? 'button' : undefined}
      tabIndex={isEditable ? 0 : undefined}
      onClick={openEditor}
      onKeyDown={(event) => {
        if (!isEditable) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onEdit(highlightIndex, event.currentTarget);
        }
      }}
      aria-label={`Answer evidence ${label}`}
      title={
        isEditable
          ? 'Click to change the question number, drag the blue edges to add or remove words, or remove it'
          : undefined
      }
    >
      {isResizable && (
        <ResizeHandle
          edge="start"
          label={`Drag to change where evidence ${label} starts`}
          onPointerDown={(event) =>
            onResizeStart(event, { highlightIndex, segmentIndex, start, end, edge: 'start' })
          }
        />
      )}
      {part.text}
      {isResizable && (
        <ResizeHandle
          edge="end"
          label={`Drag to change where evidence ${label} ends`}
          onPointerDown={(event) =>
            onResizeStart(event, { highlightIndex, segmentIndex, start, end, edge: 'end' })
          }
        />
      )}
    </mark>
  );
}

const ListeningTranscriptHighlighter = ({
  srtContent = '',
  plainTranscript = '',
  highlights = [],
  onSrtChange,
  onHighlightsChange,
  questionStart = 1,
  questionEnd = 10,
  className,
}) => {
  const transcriptRef = useRef(null);
  const dragRef = useRef(null);
  const latestRef = useRef({ highlights, onHighlightsChange });
  const [mode, setMode] = useState('highlight');
  const [draft, setDraft] = useState(null);
  const [questionInput, setQuestionInput] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [resizePreview, setResizePreview] = useState(null);

  useEffect(() => {
    latestRef.current = { highlights, onHighlightsChange };
  });

  const segments = useMemo(() => {
    const timedSegments = parseSrt(srtContent || '');
    const source = timedSegments.length
      ? timedSegments
      : parsePlainTranscript(plainTranscript || srtContent || '');

    return resolveTranscriptSpeakers(
      source.map((segment, sourceIndex) => ({ ...segment, sourceIndex }))
    ).filter((segment) => !isSilenceSegment(segment));
  }, [plainTranscript, srtContent]);

  // While an edge is being dragged the transcript renders the pending phrase so
  // the admin sees the words leave or join the mark before committing.
  const previewHighlights = useMemo(() => {
    if (!resizePreview) return highlights;
    return highlights.map((highlight, index) =>
      index === resizePreview.index ? { ...highlight, phrase: resizePreview.phrase } : highlight
    );
  }, [highlights, resizePreview]);

  const presentationSegments = useMemo(
    () => buildHighlightedTranscript(segments, {}, previewHighlights),
    [previewHighlights, segments]
  );

  const closeDraft = useCallback(() => {
    setDraft(null);
    setQuestionInput('');
  }, []);

  useEffect(() => {
    if (!confirmClearAll) return undefined;
    const timer = setTimeout(() => setConfirmClearAll(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClearAll]);

  useEffect(() => {
    if (!draft) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeDraft();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDraft, draft]);

  // Anchors the floating editor next to the text it acts on, flipping above the
  // caret when the selection sits near the bottom of the scroll viewport so the
  // controls never fall outside the panel.
  const anchorPosition = (rect) => {
    const container = transcriptRef.current;
    if (!container) return { left: 8, top: 8 };

    const containerRect = container.getBoundingClientRect();
    const toolbarWidth = 260;
    const toolbarHeight = 44;
    const left = Math.max(
      8,
      Math.min(rect.left - containerRect.left, container.clientWidth - toolbarWidth - 8)
    );
    const flipAbove = rect.bottom - containerRect.top + toolbarHeight + 12 > container.clientHeight;
    const top = flipAbove
      ? Math.max(8, rect.top - containerRect.top + container.scrollTop - toolbarHeight - 8)
      : Math.max(8, rect.bottom - containerRect.top + container.scrollTop + 8);

    return { left, top };
  };

  const handleSelection = () => {
    const container = transcriptRef.current;
    const selection = window.getSelection?.();
    if (!container || !selection?.rangeCount || selection.isCollapsed) {
      if (draft?.kind === 'create') closeDraft();
      return;
    }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      closeDraft();
      return;
    }

    const chunks = [...container.querySelectorAll('[data-transcript-segment]')]
      .filter((node) => {
        try {
          return range.intersectsNode(node);
        } catch {
          return false;
        }
      })
      .map((node) => {
        const phrase = selectedTextInsideNode(range, node);
        const segmentIndex = Number.parseInt(node.dataset.segmentIndex, 10);
        const sourceIndex = segments[segmentIndex]?.sourceIndex;
        return { phrase, sourceIndex };
      })
      .filter((chunk) => chunk.phrase);

    if (!chunks.length) {
      closeDraft();
      return;
    }

    const rangeRect = range.getBoundingClientRect?.() || { left: 0, top: 0, bottom: 0 };
    const preview = chunks.map((chunk) => chunk.phrase).join(' ');

    setQuestionInput('');
    setDraft({ kind: 'create', chunks, preview, ...anchorPosition(rangeRect) });
  };

  const openHighlightEditor = useCallback(
    (highlightIndex, element) => {
      const indices = highlightGroupIndices(highlights, highlightIndex);
      if (!indices.length) return;

      const rect = element?.getBoundingClientRect?.() || { left: 0, top: 0, bottom: 0 };
      const questionLabel = highlightQuestionNumbers(highlights[indices.at(-1)]).join(',');

      window.getSelection?.()?.removeAllRanges();
      setQuestionInput(questionLabel);
      setDraft({
        kind: 'edit',
        indices,
        preview: indices.map((index) => highlightPhrase(highlights[index])).join(' '),
        ...anchorPosition(rect),
      });
    },
    [highlights]
  );

  const startResize = (event, { highlightIndex, segmentIndex, start, end, edge }) => {
    const segmentText = presentationSegments[segmentIndex]?.text ?? '';
    if (!segmentText) return;

    event.preventDefault();
    event.stopPropagation();
    window.getSelection?.()?.removeAllRanges();

    const phrase = segmentText.slice(start, end).trim();
    dragRef.current = { highlightIndex, segmentIndex, start, end, edge, segmentText, phrase };
    setResizePreview({ index: highlightIndex, phrase });
  };

  const isResizing = resizePreview !== null;

  useEffect(() => {
    if (!isResizing) return undefined;

    const onPointerMove = (event) => {
      const drag = dragRef.current;
      const segmentElement = transcriptRef.current?.querySelector(
        `[data-segment-index="${drag?.segmentIndex}"]`
      );
      if (!drag || !segmentElement) return;

      const offset = offsetFromPoint(event.clientX, event.clientY, segmentElement);
      if (offset === null) return;

      const text = drag.segmentText;
      let { start, end } = drag;

      if (drag.edge === 'start') {
        start = snapToWordStart(text, offset);
        if (start >= end) start = snapToWordStart(text, Math.max(0, end - 1));
      } else {
        end = snapToWordEnd(text, offset);
        if (end <= start) end = snapToWordEnd(text, Math.min(text.length, start + 1));
      }

      const phrase = text.slice(start, end).trim();
      if (!phrase || phrase === drag.phrase) return;

      dragRef.current = { ...drag, start, end, phrase };
      setResizePreview({ index: drag.highlightIndex, phrase });
    };

    const onPointerUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      setResizePreview(null);
      if (!drag) return;

      const { highlights: currentHighlights, onHighlightsChange: commit } = latestRef.current;
      const original = currentHighlights[drag.highlightIndex];
      if (!original || !drag.phrase || drag.phrase === normalizePhrase(highlightPhrase(original))) {
        return;
      }

      commit(
        currentHighlights.map((highlight, index) =>
          index === drag.highlightIndex
            ? {
                ...highlight,
                ...(Array.isArray(highlight.phrases)
                  ? { phrases: [drag.phrase] }
                  : { phrase: drag.phrase }),
              }
            : highlight
        )
      );
      toast.success('Answer evidence updated');
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isResizing]);

  const applyHighlight = () => {
    const questionNumbers = parseManualQuestionNumbers(questionInput, questionStart, questionEnd);

    if (!questionNumbers.length) {
      toast.error(`Enter a question number from ${questionStart} to ${questionEnd}`);
      return;
    }

    if (draft?.kind === 'edit') {
      const editedIndices = new Set(draft.indices);
      onHighlightsChange(
        highlights.map((highlight, index) => {
          if (!editedIndices.has(index)) return highlight;
          const {
            question_numbers: _ignoredNumbers,
            questionNumbers: _ignoredCamelNumbers,
            ...rest
          } = highlight;
          return {
            ...rest,
            question_number: questionNumbers[0],
            ...(questionNumbers.length > 1 ? { question_numbers: questionNumbers } : {}),
          };
        })
      );
      closeDraft();
      toast.success(`Answer evidence moved to ${questionNumbers.join(',')}`);
      return;
    }

    if (!draft?.chunks?.length) return;

    const selectedPhrases = new Set(
      draft.chunks.map(({ phrase, sourceIndex }) => `${sourceIndex ?? ''}:${phrase.toLowerCase()}`)
    );
    const retainedHighlights = highlights.filter(
      (highlight) =>
        !selectedPhrases.has(
          `${highlight?.source_index ?? highlight?.sourceIndex ?? ''}:${normalizePhrase(
            highlightPhrase(highlight)
          ).toLowerCase()}`
        )
    );
    const newHighlights = draft.chunks.map(({ phrase, sourceIndex }, index, phrases) => ({
      question_number: questionNumbers[0],
      ...(questionNumbers.length > 1 ? { question_numbers: questionNumbers } : {}),
      phrase,
      ...(Number.isFinite(sourceIndex) ? { source_index: sourceIndex } : {}),
      ...(index < phrases.length - 1 ? { show_badge: false } : {}),
    }));

    onHighlightsChange([...retainedHighlights, ...newHighlights]);
    window.getSelection?.()?.removeAllRanges();
    closeDraft();
    toast.success(`Marked answer evidence for ${questionNumbers.join(',')}`);
  };

  const removeHighlight = (highlightIndex) => {
    const indices = new Set(highlightGroupIndices(highlights, highlightIndex));
    const label = highlightQuestionNumbers(highlights[highlightIndex]).join(',');
    onHighlightsChange(highlights.filter((_, index) => !indices.has(index)));
    closeDraft();
    if (label) toast.success(`Removed answer evidence ${label}`);
  };

  const revealHighlight = (highlightIndex) => {
    const container = transcriptRef.current;
    const mark = container?.querySelector(`[data-highlight-index="${highlightIndex}"]`);
    if (!mark) {
      toast.error('This phrase is no longer in the transcript — remove it or fix the SRT');
      return;
    }
    mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
    openHighlightEditor(highlightIndex, mark);
  };

  const clearAllHighlights = () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    onHighlightsChange([]);
    setConfirmClearAll(false);
    closeDraft();
    toast.success('Cleared all answer evidence for this part');
  };

  const focusedIndices = draft?.kind === 'edit' ? new Set(draft.indices) : null;

  return (
    <div
      className={cn(
        'flex max-h-[min(560px,60vh)] min-h-[300px] flex-1 flex-col overflow-hidden rounded-xl border border-[#e4e2f0] bg-white',
        'dark:border-white/[0.07] dark:bg-[#100f15]',
        className
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#e4e2f0] px-3 py-2 dark:border-white/[0.07]">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
            Answer highlighting
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Select spoken text to assign question {questionStart}–{questionEnd}. Click a highlight
            to renumber or remove it, and drag its blue edges to add or drop words.
          </p>
        </div>
        <div className="flex items-center rounded-lg border border-[#e4e2f0] bg-[#f7f6fb] p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode('highlight');
              closeDraft();
            }}
            className={cn(
              'h-7 rounded-md px-2 text-[9px] font-black uppercase tracking-wider',
              mode === 'highlight'
                ? 'bg-white text-[#5a63df] dark:bg-white/10 dark:text-[#a9afff]'
                : 'text-slate-500'
            )}
            aria-pressed={mode === 'highlight'}
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            Highlight
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode('srt');
              closeDraft();
            }}
            className={cn(
              'h-7 rounded-md px-2 text-[9px] font-black uppercase tracking-wider',
              mode === 'srt'
                ? 'bg-white text-[#5a63df] dark:bg-white/10 dark:text-[#a9afff]'
                : 'text-slate-500'
            )}
            aria-pressed={mode === 'srt'}
          >
            <Code2 className="mr-1 h-3.5 w-3.5" />
            Edit SRT
          </Button>
        </div>
      </div>

      {mode === 'srt' ? (
        <Textarea
          value={srtContent || ''}
          onChange={(event) => onSrtChange(event.target.value)}
          placeholder={`1\n00:00:00,000 --> 00:00:05,000\nSPEAKER 1: Welcome...`}
          className="min-h-0 flex-1 resize-none rounded-none border-0 bg-white p-4 font-mono text-xs leading-6 focus-visible:ring-0 dark:bg-[#100f15]"
          aria-label="Raw SRT transcript"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            ref={transcriptRef}
            onMouseUp={handleSelection}
            className={cn(
              'custom-scrollbar relative min-h-0 flex-1 overflow-y-auto p-4 text-[13px] leading-6 text-slate-700 dark:text-slate-300 sm:p-5 sm:text-sm',
              isResizing ? 'cursor-ew-resize select-none' : 'select-text'
            )}
            aria-label="Timestamp-free transcript highlighter"
          >
            {presentationSegments.length ? (
              <div className="space-y-2.5">
                {presentationSegments.map((segment, segmentIndex) => {
                  const showSpeaker =
                    segment.speaker &&
                    segment.speaker !== presentationSegments[segmentIndex - 1]?.speaker;
                  let partOffset = 0;

                  return (
                    <div
                      key={`${segment.id ?? segmentIndex}-${segment.sourceIndex ?? segmentIndex}`}
                    >
                      {showSpeaker && (
                        <div className="mb-0.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          <span className="h-3 w-0.5 rounded-full bg-[#5a63df]" />
                          {segment.speaker}
                        </div>
                      )}
                      <span data-transcript-segment data-segment-index={segmentIndex}>
                        {segment.displayParts.map((part, partIndex) => {
                          const partStart = partOffset;
                          partOffset += part.text.length;

                          return (
                            <AnswerMark
                              key={`${segmentIndex}-${partIndex}`}
                              part={part}
                              segmentIndex={segmentIndex}
                              start={partStart}
                              end={partOffset}
                              onEdit={openHighlightEditor}
                              onResizeStart={startResize}
                              isFocused={
                                focusedIndices?.has(sourceHighlightIndex(part.highlightKey)) ??
                                false
                              }
                            />
                          );
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-[260px] place-items-center text-center">
                <div className="max-w-xs">
                  <FileText className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    Add or generate an SRT transcript first
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    Timestamps stay available under Edit SRT but remain hidden while assigning
                    answers.
                  </p>
                </div>
              </div>
            )}

            {draft && (
              <div
                className="absolute z-30 flex items-center gap-1 rounded-lg border border-[#d8d5e8] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#18171d]"
                style={{ left: draft.left, top: draft.top }}
                onMouseDown={(event) => event.stopPropagation()}
                onMouseUp={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-label={
                  draft.kind === 'edit'
                    ? 'Edit saved answer evidence'
                    : 'Assign selected transcript text'
                }
              >
                <span className="pl-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                  Q
                </span>
                <Input
                  autoFocus
                  value={questionInput}
                  onChange={(event) => setQuestionInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyHighlight();
                    }
                  }}
                  placeholder={`${questionStart}`}
                  className="h-7 w-20 border-[#e4e2f0] px-2 text-center text-xs dark:border-white/10"
                  aria-label="Question numbers"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={applyHighlight}
                  className="h-7 w-7 text-[rgb(var(--signal-ok))] hover:bg-[rgb(var(--signal-ok)/0.08)]"
                  aria-label={
                    draft.kind === 'edit' ? 'Save answer highlight' : 'Add answer highlight'
                  }
                >
                  <Check className="h-4 w-4" />
                </Button>
                {draft.kind === 'edit' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHighlight(draft.indices[0])}
                    className="h-7 w-7 text-slate-400 hover:bg-[rgb(var(--signal-fault)/0.08)] hover:text-[rgb(var(--signal-fault))]"
                    aria-label="Remove this answer highlight"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeDraft}
                  className="h-7 w-7 text-slate-400"
                  aria-label="Cancel answer highlight"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {highlights.length > 0 && (
            <div className="shrink-0 border-t border-[#e4e2f0] bg-[#faf9ff] dark:border-white/[0.07] dark:bg-white/[0.025]">
              <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Saved evidence · {highlights.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllHighlights}
                  onBlur={() => setConfirmClearAll(false)}
                  className={cn(
                    'h-6 rounded-md px-2 text-[9px] font-black uppercase tracking-wider',
                    confirmClearAll
                      ? 'bg-[rgb(var(--signal-fault)/0.12)] text-[rgb(var(--signal-fault))]'
                      : 'text-slate-400 hover:text-[rgb(var(--signal-fault))]'
                  )}
                >
                  {confirmClearAll ? 'Confirm clear all' : 'Clear all'}
                </Button>
              </div>
              <div className="custom-scrollbar max-h-[124px] space-y-1 overflow-y-auto px-3 pb-2">
                {highlights.map((highlight, highlightIndex) => {
                  const questionLabel = highlightQuestionNumbers(highlight).join(',');
                  return (
                    <div
                      key={`${questionLabel}-${highlightIndex}-${highlightPhrase(highlight)}`}
                      className={cn(
                        'flex items-center gap-2 rounded-md border border-[#e4e2f0] bg-white px-2 py-1 dark:border-white/[0.07] dark:bg-white/[0.035]',
                        focusedIndices?.has(highlightIndex) &&
                          'border-[#5a63df] ring-1 ring-[#5a63df]/40'
                      )}
                    >
                      <span className="rounded-sm bg-[rgb(var(--signal-ok))] px-1 text-[9px] font-black leading-4 text-white">
                        {questionLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => revealHighlight(highlightIndex)}
                        className="min-w-0 flex-1 truncate text-left text-[10px] font-medium text-slate-600 hover:text-[#5a63df] dark:text-slate-300 dark:hover:text-[#a9afff]"
                        aria-label={`Jump to answer evidence ${questionLabel}`}
                      >
                        {highlightPhrase(highlight)}
                      </button>
                      <CornerUpLeft className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHighlight(highlightIndex)}
                        className="h-6 w-6 shrink-0 text-slate-400 hover:text-[rgb(var(--signal-fault))]"
                        aria-label={`Remove answer evidence ${questionLabel}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListeningTranscriptHighlighter;
