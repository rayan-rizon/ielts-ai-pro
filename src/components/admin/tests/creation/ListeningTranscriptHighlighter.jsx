import React, { useMemo, useRef, useState } from 'react';
import { Check, Code2, Eye, FileText, Trash2, X } from 'lucide-react';
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

function AnswerMark({ part }) {
  const questionNumbers = part.questionNumbers?.length
    ? part.questionNumbers
    : part.questionNumber
      ? [part.questionNumber]
      : [];
  const label = questionNumbers.join(',');

  if (!questionNumbers.length) return part.text;

  return (
    <mark
      className={cn(
        'rounded-sm bg-[#d9f6c7] px-0.5 font-semibold text-slate-950',
        'dark:bg-[rgb(var(--signal-ok)/0.34)] dark:text-slate-50',
        part.showBadge !== false &&
          'after:ml-1 after:inline-flex after:min-w-4 after:items-center after:justify-center after:rounded-sm after:bg-[rgb(var(--signal-ok))] after:px-1 after:text-[9px] after:font-black after:leading-4 after:text-white after:content-[attr(data-answer-label)]'
      )}
      data-answer-label={part.showBadge === false ? undefined : label}
      aria-label={`Answer evidence ${label}`}
    >
      {part.text}
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
  const [mode, setMode] = useState('highlight');
  const [selectionDraft, setSelectionDraft] = useState(null);
  const [questionInput, setQuestionInput] = useState('');

  const segments = useMemo(() => {
    const timedSegments = parseSrt(srtContent || '');
    const source = timedSegments.length
      ? timedSegments
      : parsePlainTranscript(plainTranscript || srtContent || '');

    return resolveTranscriptSpeakers(
      source.map((segment, sourceIndex) => ({ ...segment, sourceIndex }))
    ).filter((segment) => !isSilenceSegment(segment));
  }, [plainTranscript, srtContent]);

  const presentationSegments = useMemo(
    () => buildHighlightedTranscript(segments, {}, highlights),
    [highlights, segments]
  );

  const handleSelection = () => {
    const container = transcriptRef.current;
    const selection = window.getSelection?.();
    if (!container || !selection?.rangeCount || selection.isCollapsed) {
      setSelectionDraft(null);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      setSelectionDraft(null);
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
      setSelectionDraft(null);
      return;
    }

    const rangeRect = range.getBoundingClientRect?.() || { left: 0, bottom: 0 };
    const containerRect = container.getBoundingClientRect();
    const toolbarWidth = 250;
    const left = Math.max(
      8,
      Math.min(rangeRect.left - containerRect.left, container.clientWidth - toolbarWidth - 8)
    );
    const top = Math.max(8, rangeRect.bottom - containerRect.top + container.scrollTop + 8);

    setQuestionInput('');
    setSelectionDraft({ chunks, left, top });
  };

  const applyHighlight = () => {
    const questionNumbers = parseManualQuestionNumbers(questionInput, questionStart, questionEnd);

    if (!questionNumbers.length) {
      toast.error(`Enter a question number from ${questionStart} to ${questionEnd}`);
      return;
    }
    if (!selectionDraft?.chunks.length) return;

    const selectedPhrases = new Set(
      selectionDraft.chunks.map(
        ({ phrase, sourceIndex }) => `${sourceIndex ?? ''}:${phrase.toLowerCase()}`
      )
    );
    const retainedHighlights = highlights.filter(
      (highlight) =>
        !selectedPhrases.has(
          `${highlight?.source_index ?? highlight?.sourceIndex ?? ''}:${normalizePhrase(
            highlightPhrase(highlight)
          ).toLowerCase()}`
        )
    );
    const newHighlights = selectionDraft.chunks.map(({ phrase, sourceIndex }, index, phrases) => ({
      question_number: questionNumbers[0],
      ...(questionNumbers.length > 1 ? { question_numbers: questionNumbers } : {}),
      phrase,
      ...(Number.isFinite(sourceIndex) ? { source_index: sourceIndex } : {}),
      ...(index < phrases.length - 1 ? { show_badge: false } : {}),
    }));

    onHighlightsChange([...retainedHighlights, ...newHighlights]);
    window.getSelection?.()?.removeAllRanges();
    setSelectionDraft(null);
    setQuestionInput('');
    toast.success(`Marked answer evidence for ${questionNumbers.join(',')}`);
  };

  const removeHighlight = (highlightIndex) => {
    onHighlightsChange(highlights.filter((_, index) => index !== highlightIndex));
  };

  return (
    <div
      className={cn(
        'flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-xl border border-[#e4e2f0] bg-white',
        'dark:border-white/[0.07] dark:bg-[#100f15]',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e2f0] px-3 py-2 dark:border-white/[0.07]">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
            Answer highlighting
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Select spoken text, then assign question {questionStart}–{questionEnd}
          </p>
        </div>
        <div className="flex items-center rounded-lg border border-[#e4e2f0] bg-[#f7f6fb] p-0.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode('highlight');
              setSelectionDraft(null);
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
              setSelectionDraft(null);
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
          className="min-h-[360px] flex-1 resize-none rounded-none border-0 bg-white p-4 font-mono text-xs leading-6 focus-visible:ring-0 dark:bg-[#100f15]"
          aria-label="Raw SRT transcript"
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            ref={transcriptRef}
            onMouseUp={handleSelection}
            className="relative min-h-[320px] flex-1 select-text overflow-y-auto p-4 text-[13px] leading-6 text-slate-700 dark:text-slate-300 sm:p-5 sm:text-sm"
            aria-label="Timestamp-free transcript highlighter"
          >
            {presentationSegments.length ? (
              <div className="space-y-2.5">
                {presentationSegments.map((segment, segmentIndex) => {
                  const showSpeaker =
                    segment.speaker &&
                    segment.speaker !== presentationSegments[segmentIndex - 1]?.speaker;

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
                        {segment.displayParts.map((part, partIndex) => (
                          <AnswerMark key={`${segmentIndex}-${partIndex}`} part={part} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-[280px] place-items-center text-center">
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

            {selectionDraft && (
              <div
                className="absolute z-30 flex items-center gap-1 rounded-lg border border-[#d8d5e8] bg-white p-1 dark:border-white/10 dark:bg-[#18171d]"
                style={{ left: selectionDraft.left, top: selectionDraft.top }}
                role="dialog"
                aria-label="Assign selected transcript text"
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
                  aria-label="Add answer highlight"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectionDraft(null)}
                  className="h-7 w-7 text-slate-400"
                  aria-label="Cancel answer highlight"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {highlights.length > 0 && (
            <div className="max-h-32 overflow-y-auto border-t border-[#e4e2f0] bg-[#faf9ff] px-3 py-2 dark:border-white/[0.07] dark:bg-white/[0.025]">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Saved evidence · {highlights.length}
                </span>
                <span className="text-[9px] font-medium text-slate-400">
                  Shown in learner results
                </span>
              </div>
              <div className="space-y-1">
                {highlights.map((highlight, highlightIndex) => {
                  const questionLabel = highlightQuestionNumbers(highlight).join(',');
                  return (
                    <div
                      key={`${questionLabel}-${highlightIndex}-${highlightPhrase(highlight)}`}
                      className="flex items-center gap-2 rounded-md border border-[#e4e2f0] bg-white px-2 py-1 dark:border-white/[0.07] dark:bg-white/[0.035]"
                    >
                      <span className="rounded-sm bg-[rgb(var(--signal-ok))] px-1 text-[9px] font-black leading-4 text-white">
                        {questionLabel}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        {highlightPhrase(highlight)}
                      </span>
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
