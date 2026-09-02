import React, { useState, useMemo, useLayoutEffect, memo } from 'react';
import ReactDOM from 'react-dom';
import DebouncedInput from '@/components/ui/debounced-input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { sanitizeHtml } from '@/lib/security';
import QuestionNumberCircle from '@/components/test/QuestionNumberCircle';
import { cn } from '@/lib/cn';
import { INPUT_DEFAULT, ACCENT_TEXT } from '@/features/testing/shared/questionUiTokens';

function ensureListState(targetType, listState, processedLines) {
  if (listState.inList && listState.listType !== targetType) {
    processedLines.push(`</${listState.listType}>`);
    listState.inList = false;
  }
  if (!listState.inList) {
    const listTag =
      targetType === 'ul'
        ? '<ul class="list-disc pl-5 my-1.5 space-y-2 list-outside">'
        : '<ol class="list-decimal pl-6 my-0.5 space-y-0.5">';
    processedLines.push(listTag);
    listState.inList = true;
    listState.listType = targetType;
  }
}

function closeListState(listState, processedLines) {
  if (listState.inList) {
    processedLines.push(`</${listState.listType}>`);
    listState.inList = false;
  }
}

function processSingleMarkdownLine(line, listState, processedLines) {
  const trimmedLine = line.trim();
  const isNumbered = trimmedLine.match(/^(\d+)[.)]\s+(.*)/);
  const bulletMatch =
    trimmedLine.match(/^([-•●*])\s+(.*)/i) || trimmedLine.match(/^<[^>]+>([-•●*])\s+(.*)/i);

  if (bulletMatch) {
    ensureListState('ul', listState, processedLines);
    const content = bulletMatch[2] || bulletMatch[1];
    processedLines.push(
      `<li class="text-foreground leading-normal pl-2 font-medium">${content}</li>`
    );
    return;
  }

  if (isNumbered) {
    ensureListState('ol', listState, processedLines);
    processedLines.push(`<li class="text-foreground leading-normal">${isNumbered[2]}</li>`);
    return;
  }

  closeListState(listState, processedLines);
  const isHeader =
    trimmedLine.endsWith(':') && trimmedLine.length < 80 && !trimmedLine.includes('[gap]');

  if (isHeader) {
    processedLines.push(
      `<div class="font-bold text-foreground mt-1 mb-0 text-[15px]">${trimmedLine}</div>`
    );
  } else if (trimmedLine === '') {
    processedLines.push('<div class="h-1"></div>');
  } else {
    processedLines.push(`<div class="my-0 leading-normal">${line}</div>`);
  }
}

function processMarkdownLines(lines, variant) {
  const processedLines = [];
  const listState = { inList: false, listType: 'ul' };

  for (let i = 0; i < lines.length; i++) {
    processSingleMarkdownLine(lines[i], listState, processedLines);
  }
  closeListState(listState, processedLines);

  const renderedHtml = processedLines.join('');
  return variant === 'flowchart'
    ? `<div class="flowchart-step-text text-slate-800 dark:text-slate-200">${renderedHtml}</div>`
    : renderedHtml;
}

function convertMarkdownToHtml(content, variant) {
  if (!content) return '';

  let html = content;
  html = html
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>\s*<div>/gi, '\n')
    .replace(/^<p>/i, '')
    .replace(/<\/p>$/i, '')
    .replace(/^<div>/i, '')
    .replace(/<\/div>$/i)
    .replace(/<\/li>\s*<li>/gi, '\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul>/gi, '')
    .replace(/<\/?ol>/gi)
    .replace(/&nbsp;/g, ' ');

  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/__([^_]+)__/g, '<strong class="font-bold text-foreground">$1</strong>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-muted-foreground">$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em class="italic text-muted-foreground">$1</em>');

  const lines = html.split('\n');
  return processMarkdownLines(lines, variant);
}

/**
 * GapFillContent - Component for rendering gap-fill questions with inline input fields.
 */
const GapFillContent = memo(function GapFillContent({
  question,
  answers,
  handleAnswerChange,
  isFinished,
  questionNum,
  toggleFlag,
  flaggedQuestions,
  correctAnswersMap = {},
  gapStartIndex = 0,
  idPrefix = '',
  answerMode = 'input',
  options = [],
  variant = 'default',
}) {
  const [mountNodes, setMountNodes] = useState([]);
  const text = question.gap_fill?.text || question.gap_fill?.content || '';

  // Parse parts to count gaps
  const parts = text.split(/\[gap\]|__BLANK__|__BLANK_\d+__/g);
  const gapCount = parts.length - 1;

  const domIdBase = idPrefix || question.id;

  const htmlContent = useMemo(() => {
    let processedHtml = convertMarkdownToHtml(text, variant);
    let gapIndex = 0;

    processedHtml = processedHtml.replace(/\[gap\]|__BLANK__|__BLANK_\d+__/g, () => {
      const id = `gap-${domIdBase}-${gapIndex}`;
      gapIndex++;
      const width = variant === 'flowchart' ? '70px' : '110px';
      return `<span id="${id}" class="gap-placeholder inline-flex align-middle mx-1" style="min-width: ${width};"></span>`;
    });
    return processedHtml;
  }, [text, domIdBase, variant]);

  useLayoutEffect(() => {
    const nodes = [];
    for (let i = 0; i < gapCount; i++) {
      const el = document.getElementById(`gap-${domIdBase}-${i}`);
      if (el) nodes.push(el);
    }
    setMountNodes(nodes);
  }, [htmlContent, gapCount, domIdBase]);

  const getInputStyle = (answerKey) => {
    const baseStyle =
      variant === 'flowchart'
        ? 'h-7 w-[70px] px-2 py-0.5 text-center text-sm rounded-lg transition-all duration-200 border'
        : 'h-7 w-28 px-2 py-0.5 text-center text-[15px] rounded-lg transition-all duration-200';

    if (!isFinished) {
      return cn(baseStyle, INPUT_DEFAULT);
    }

    const validation = correctAnswersMap[answerKey];
    const value = answers[answerKey];

    return cn(
      baseStyle,
      'cursor-not-allowed opacity-100 font-semibold',
      validation?.isCorrect
        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        : value
          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
          : 'bg-white dark:bg-white/4 border-[#e4e2f0] dark:border-white/8 text-foreground'
    );
  };

  return (
    <div
      className={cn(
        'leading-relaxed text-foreground font-medium font-sans gap-fill-container',
        variant === 'flowchart' ? 'text-[15px] w-full' : 'text-[15px]'
      )}
      data-oid="pi3r:an"
    >
      <style>{`
        .gap-fill-container ul { list-style-type: disc !important; margin-left: 1rem !important; margin-bottom: 0.1rem !important; margin-top: 0.1rem !important; }
        .gap-fill-container ol { list-style-type: decimal !important; margin-left: 1rem !important; margin-bottom: 0.1rem !important; margin-top: 0.1rem !important; }
        .gap-fill-container li { 
          display: list-item !important; 
          margin-bottom: 0px !important;
          padding-left: 0.25rem !important;
          line-height: 1.4 !important;
          padding-top: 0px !important;
          padding-bottom: 0px !important;
        }
        .gap-fill-container li::marker {
          color: #3b82f6;
          font-weight: bold;
        }
        .gap-fill-container .flowchart-step-text { 
          display: block; 
          width: 100%;
          text-align: left;
        }
        .gap-fill-container .flowchart-step-text ul {
          margin-bottom: 0px !important;
        }
        .gap-fill-container .flowchart-step-text li {
          margin-bottom: 0.25rem !important;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }} />

      {mountNodes.map((node, i) => {
        const totalIdx = i + gapStartIndex;
        const answerKey = `${question.id}_${totalIdx}`;
        const number = parseInt(questionNum) + totalIdx;
        const value = answers[answerKey] || '';

        // Determine circle status
        let circleStatus = 'default';
        const validation = correctAnswersMap[answerKey];
        if (isFinished) {
          circleStatus = validation?.isCorrect ? 'correct' : value ? 'incorrect' : 'unanswered';
        }

        return ReactDOM.createPortal(
          <span
            key={i}
            className="inline-flex items-center gap-1.5 align-middle whitespace-nowrap shrink-0"
          >
            <QuestionNumberCircle
              number={number}
              isFlagged={flaggedQuestions.has(answerKey)}
              onClick={() => toggleFlag(answerKey)}
              status={circleStatus}
              size="sm"
            />

            {answerMode === 'dropdown' ? (
              <Select
                value={value}
                onValueChange={(val) => handleAnswerChange(answerKey, val)}
                disabled={isFinished}
              >
                <SelectTrigger
                  className={cn(getInputStyle(answerKey), 'flex bg-white dark:bg-white/4 px-3')}
                >
                  {/* flex-1 and text-center ensures the letter is centered while the icon stays on the right */}
                  <div className="flex-1 text-center pr-2">
                    <span className={cn('font-bold', ACCENT_TEXT)}>{value}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="z-9999 min-w-16">
                  {options.map((opt, oIdx) => {
                    const label = String.fromCharCode(65 + oIdx);
                    return (
                      <SelectItem
                        key={label}
                        value={label}
                        textValue={label}
                        className="py-1.5 justify-center"
                      >
                        <span className={cn('font-bold', ACCENT_TEXT)}>{label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            ) : (
              <DebouncedInput
                className={getInputStyle(answerKey)}
                onChange={(val) => handleAnswerChange(answerKey, val)}
                value={value}
                disabled={isFinished}
                placeholder={isFinished ? '' : 'answer'}
                autoComplete="off"
              />
            )}
          </span>,
          node
        );
      })}
    </div>
  );
});

GapFillContent.displayName = 'GapFillContent';
export default GapFillContent;
