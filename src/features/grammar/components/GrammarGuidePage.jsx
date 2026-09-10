import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenText,
  Check,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Eye,
  LockKeyhole,
  Mic2,
  RotateCcw,
  Route,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { skillLabel, skillMeta } from '../constants';
import { getGrammarGuide } from '../data/grammarGuideCatalog';
import { contentTierLabel, hasContentAccess } from '@/features/subscription/config/contentAccess';
import { IconChip, MICRO, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';

const LOCKED_GUIDE_BENEFITS = [
  'Full workbook unit and worked examples',
  'Practice questions with instant scoring',
];

function headingId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderInline(value, keyPrefix) {
  const str = String(value || '');
  if (!str) return null;
  if (!/[*_]/.test(str)) {
    return str;
  }

  const ESCAPED_UNDERSCORE = '\uE000';
  const s = str.replace(/\\_/g, ESCAPED_UNDERSCORE);

  const tokens = [];
  const regex = /(\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(s)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: s.slice(lastIndex, match.index).replace(/\uE000/g, '_'),
      });
    }
    const raw = match[0];
    if (
      (raw.startsWith('**') && raw.endsWith('**')) ||
      (raw.startsWith('__') && raw.endsWith('__'))
    ) {
      tokens.push({
        type: 'strong',
        value: raw.slice(2, -2).replace(/\uE000/g, '_'),
      });
    } else if (
      (raw.startsWith('*') && raw.endsWith('*')) ||
      (raw.startsWith('_') && raw.endsWith('_'))
    ) {
      tokens.push({
        type: 'em',
        value: raw.slice(1, -1).replace(/\uE000/g, '_'),
      });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < s.length) {
    tokens.push({
      type: 'text',
      value: s.slice(lastIndex).replace(/\uE000/g, '_'),
    });
  }

  return tokens.map((token, index) => {
    if (token.type === 'strong') {
      return (
        <strong
          key={`${keyPrefix}-strong-${index}`}
          className="font-extrabold text-slate-900 dark:text-white"
        >
          {renderInline(token.value, `${keyPrefix}-s-${index}`)}
        </strong>
      );
    }
    if (token.type === 'em') {
      return (
        <em
          key={`${keyPrefix}-em-${index}`}
          className="font-semibold italic text-slate-800 dark:text-slate-100"
        >
          {renderInline(token.value, `${keyPrefix}-e-${index}`)}
        </em>
      );
    }
    return <span key={`${keyPrefix}-text-${index}`}>{token.value}</span>;
  });
}

function tableCells(line) {
  return String(line)
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseGrammarGuide(content) {
  const sections = [];
  let current = {
    id: 'start',
    title: '',
    blocks: [],
  };

  const lines = String(content || '').split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const value = lines[lineIndex].trim();
    if (!value || value === '---' || /^<\/?[a-z][^>]*>$/i.test(value)) continue;

    if (value.startsWith('## ')) {
      if (current.title || current.blocks.length) sections.push(current);
      const title = value.slice(3).trim();
      current = { id: headingId(title), title, blocks: [] };
      continue;
    }
    if (value.startsWith('### ')) {
      const subheading = value.slice(4).trim();
      current.blocks.push({
        type: 'subheading',
        id: headingId(subheading),
        value: subheading,
      });
      continue;
    }
    if (
      value.startsWith('|') &&
      lines[lineIndex + 1]?.trim().startsWith('|') &&
      /^\|?[\s:|-]+\|?$/.test(lines[lineIndex + 1].trim())
    ) {
      const headers = tableCells(value);
      const rows = [];
      lineIndex += 2;
      while (lineIndex < lines.length && lines[lineIndex].trim().startsWith('|')) {
        rows.push(tableCells(lines[lineIndex]));
        lineIndex += 1;
      }
      lineIndex -= 1;
      current.blocks.push({ type: 'table', headers, rows });
      continue;
    }
    if (value.startsWith('- ')) {
      current.blocks.push({ type: 'bullet', value: value.slice(2).trim() });
      continue;
    }
    const numberedMatch = value.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      current.blocks.push({
        type: 'numbered',
        number: parseInt(numberedMatch[1], 10),
        value: numberedMatch[2],
      });
      continue;
    }
    if (value.startsWith('> ')) {
      current.blocks.push({ type: 'example', value: value.slice(2).trim() });
      continue;
    }
    current.blocks.push({ type: 'paragraph', value });
  }

  if (current.title || current.blocks.length) sections.push(current);

  const answerSection = sections.find((s) => /answer|suggested answer/i.test(s.title));
  if (answerSection) {
    for (let sIdx = 0; sIdx < sections.length; sIdx += 1) {
      const s = sections[sIdx];
      const pIdx = s.blocks.findIndex(
        (b) => b.type === 'subheading' && /^Practice\b/i.test(b.value)
      );
      if (pIdx !== -1) {
        const pSubheading = s.blocks[pIdx];
        const after = s.blocks.slice(pIdx + 1);
        const promptBlock = after.find((b) => b.type === 'paragraph');
        const questionBlocks = after.filter((b) => b.type === 'numbered');

        answerSection.practiceContext = {
          title: pSubheading.value,
          id: pSubheading.id,
          prompt: promptBlock?.value || '',
          questions: questionBlocks,
        };

        s.blocks = s.blocks.slice(0, pIdx);
        break;
      }
    }
  }

  return sections;
}

function extractOptions(prompt, question) {
  if (question) {
    const qSlashMatch = question.match(/\*{1,2}([^*]+?\s*\/\s*[^*]+?)\*{1,2}/);
    if (qSlashMatch) {
      const opts = qSlashMatch[1]
        .split('/')
        .map((s) => s.trim())
        .filter(Boolean);
      if (opts.length >= 2) return opts;
    }
  }
  if (prompt) {
    const boldMatches = Array.from(prompt.matchAll(/\*{1,2}([^*]+?)\*{1,2}/g)).map((m) => m[1]);
    const candidates = [];
    boldMatches.forEach((b) => {
      b.split(/,\s*|\s+or\s+/).forEach((part) => {
        const clean = part.trim();
        if (clean && clean.length <= 25 && !/each|sentence|blank/i.test(clean)) {
          candidates.push(clean);
        }
      });
    });
    if (candidates.length >= 2 && candidates.length <= 6) {
      return candidates;
    }
  }
  return null;
}

function matchesChoice(selected, answer) {
  if (!selected || !answer) return false;
  const s = selected.toLowerCase().trim();
  const a = answer.toLowerCase().trim();
  return a.includes(s) || s.includes(a);
}

function GuideBlock({ block, index }) {
  const content = renderInline(block.value, `${block.type}-${index}`);
  if (block.type === 'subheading') {
    const isPractice = /^Practice\b/i.test(block.value);
    return (
      <div className={cn('mt-5 first:mt-1', isPractice && 'mt-6')}>
        {isPractice ? (
          <div className="rounded-xl border border-[#5a63df]/20 bg-linear-to-br from-[#5a63df]/[0.05] to-transparent p-3.5 sm:p-4 dark:border-indigo-400/25 dark:bg-indigo-500/10">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> Practice exercise
            </div>
            <h3
              id={block.id}
              className="mt-1 scroll-mt-24 text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {content}
            </h3>
          </div>
        ) : (
          <h3
            id={block.id}
            className="scroll-mt-24 border-b border-[#eceafa]/70 pb-1.5 text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:border-white/10 dark:text-white"
          >
            {content}
          </h3>
        )}
      </div>
    );
  }
  if (block.type === 'bullet') {
    const isNegative = /^(Incorrect|Fragment|Weak|Unclear):/i.test(block.value);
    const isPositive = /^(Correct|Complete|Repaired|Clear|Better):/i.test(block.value);
    const isCaution = /^(Caution|Warning|Avoid|Watch out):/i.test(block.value);

    if (isNegative) {
      return (
        <li className="flex items-start gap-2.5 rounded-lg border border-rose-200/80 bg-rose-50/50 px-3 py-2 text-sm font-medium leading-snug text-rose-950 transition-colors dark:border-rose-400/20 dark:bg-rose-500/[0.07] dark:text-rose-200">
          <XCircle
            role="img"
            aria-label="Incorrect example"
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400"
          />
          <span className="min-w-0 flex-1">{content}</span>
        </li>
      );
    }

    if (isPositive) {
      return (
        <li className="flex items-start gap-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-sm font-medium leading-snug text-emerald-950 transition-colors dark:border-emerald-400/20 dark:bg-emerald-500/[0.07] dark:text-emerald-200">
          <CheckCircle2
            role="img"
            aria-label="Correct example"
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400"
          />
          <span className="min-w-0 flex-1">{content}</span>
        </li>
      );
    }

    if (isCaution) {
      return (
        <li className="flex items-start gap-2.5 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-sm font-medium leading-snug text-amber-950 transition-colors dark:border-amber-400/20 dark:bg-amber-500/[0.07] dark:text-amber-200">
          <AlertCircle
            role="img"
            aria-label="Caution"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
          />
          <span className="min-w-0 flex-1">{content}</span>
        </li>
      );
    }

    return (
      <li className="flex items-start gap-2.5 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
        <span
          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a63df] dark:bg-indigo-400"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">{content}</span>
      </li>
    );
  }
  if (block.type === 'numbered') {
    return (
      <li className="flex items-start gap-2.5 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#e2e5f2] bg-[#f8f9fe] text-[10px] font-black text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
          {block.number || index + 1}
        </span>
        <span className="min-w-0 flex-1">{content}</span>
      </li>
    );
  }
  if (block.type === 'example') {
    return (
      <blockquote className="my-3 rounded-r-xl rounded-l-xs border border-l-[3.5px] border-[#e2e5f5] border-l-[#5a63df] bg-[#f8f9ff] px-3.5 py-2.5 text-sm font-semibold leading-relaxed text-slate-800 dark:border-white/10 dark:border-l-[#8f97ff] dark:bg-white/[0.03] dark:text-slate-100">
        {content}
      </blockquote>
    );
  }
  if (block.type === 'table') {
    return (
      <div className="my-3 overflow-x-auto rounded-lg border border-[#e3e6f4] dark:border-white/10">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead className="border-b border-[#eceafa] bg-[#f5f6fc] text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <tr>
              {block.headers.map((header, cellIndex) => (
                <th key={`${header}-${cellIndex}`} className="px-3.5 py-2.5 font-extrabold">
                  {renderInline(header, `table-head-${index}-${cellIndex}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceafa] dark:divide-white/10">
            {block.rows.map((row, rowIndex) => (
              <tr
                key={`table-row-${index}-${rowIndex}`}
                className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="px-3.5 py-2.5 align-top font-medium leading-5 text-slate-700 dark:text-slate-300"
                  >
                    {renderInline(cell, `table-${index}-${rowIndex}-${cellIndex}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
      {content}
    </p>
  );
}

function answerItems(section) {
  const rawAnswer = section.blocks
    .filter((block) => ['paragraph', 'bullet', 'numbered'].includes(block.type))
    .map((block) => block.value)
    .join(' ')
    .trim();
  const numbered = Array.from(
    rawAnswer.matchAll(/(?:^|;\s*)(\d+)\s+([\s\S]*?)(?=;\s*\d+\s+|$)/g)
  ).map((match) => ({
    number: Number(match[1]),
    answer: match[2].trim().replace(/[.;]$/, ''),
  }));

  const baseItems = numbered.length
    ? numbered
    : section.blocks
        .filter((block) => ['bullet', 'paragraph'].includes(block.type))
        .map((block, index) => ({ number: index + 1, answer: block.value }));

  const questions = section.practiceContext?.questions || [];
  const prompt = section.practiceContext?.prompt || '';

  return baseItems.map((item) => {
    const matchedQ = questions.find((q) => q.number === item.number) || questions[item.number - 1];
    const qText = matchedQ?.value || '';
    const options = extractOptions(prompt, qText);
    return {
      ...item,
      question: qText,
      options,
    };
  });
}

function InteractiveAnswerCheck({ section }) {
  const items = answerItems(section);
  const [revealed, setRevealed] = useState(() => new Set());
  const [checked, setChecked] = useState(() => new Set());
  const [confident, setConfident] = useState(() => new Set());
  const [selectedAnswers, setSelectedAnswers] = useState(() => ({}));

  const reveal = (number) => {
    setRevealed((current) => new Set(current).add(number));
  };

  const revealAll = () => {
    setRevealed(new Set(items.map((it) => it.number)));
  };

  const selfMark = (number, isConfident) => {
    setChecked((current) => new Set(current).add(number));
    setConfident((current) => {
      const next = new Set(current);
      if (isConfident) next.add(number);
      else next.delete(number);
      return next;
    });
  };

  const selectOption = (number, opt) => {
    setSelectedAnswers((current) => ({ ...current, [number]: opt }));
  };

  const reset = () => {
    setRevealed(new Set());
    setChecked(new Set());
    setConfident(new Set());
    setSelectedAnswers({});
  };

  return (
    <div
      id={section.practiceContext?.id || undefined}
      className="scroll-mt-24 rounded-xl border border-[#e4e2f0] bg-linear-to-br from-white to-[#faf9ff] p-3.5 sm:p-5 dark:border-white/10 dark:from-[#141319] dark:to-[#100f15]"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-[#eceafa]/60 pb-3 dark:border-white/10">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
            <Sparkles className="h-3 w-3" />
            {section.practiceContext?.title || 'Practice Exercise'}
          </div>
          <h2 className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
            Check your practice
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {section.practiceContext?.prompt
              ? 'Work through each sentence, test yourself, and compare with the suggested answer.'
              : 'Try every item first. Reveal the model only when you are ready to compare.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#f0effe] px-2.5 py-0.5 text-[11px] font-black text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-200">
            {checked.size}/{items.length} reviewed
          </span>
          {revealed.size < items.length ? (
            <button
              type="button"
              onClick={revealAll}
              className="rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Reveal all
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e2e5f2] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* If there is an instruction prompt */}
      {section.practiceContext?.prompt && (
        <div className="mt-3 rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.04] px-3 py-2 text-xs dark:border-indigo-400/20 dark:bg-indigo-500/[0.06]">
          <span className="font-extrabold text-[#5a63df] dark:text-indigo-300">Instruction: </span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {renderInline(section.practiceContext.prompt, 'practice-prompt')}
          </span>
        </div>
      )}

      {/* Question Cards List */}
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const isRevealed = revealed.has(item.number);
          const isChecked = checked.has(item.number);
          const isConfident = confident.has(item.number);
          const userChoice = selectedAnswers[item.number];

          return (
            <div
              key={item.number}
              className={cn(
                'rounded-lg border p-3 transition-all duration-150',
                isChecked
                  ? 'border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-500/20 dark:bg-emerald-950/10'
                  : 'border-[#e2e5f2] bg-white dark:border-white/10 dark:bg-[#121118]'
              )}
            >
              {/* Question row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="mt-0.5 flex h-5 w-6 shrink-0 items-center justify-center rounded-md border border-[#e2e5f2] bg-[#f8f9fe] text-[10px] font-black text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                    {String(item.number).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    {item.question ? (
                      <div className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
                        {renderInline(item.question, `q-${item.number}`)}
                      </div>
                    ) : (
                      <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                        Question {item.number}
                      </div>
                    )}

                    {/* Interactive choice pills if available */}
                    {item.options && item.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                          Choice:
                        </span>
                        {item.options.map((opt) => {
                          const isSelected = userChoice === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => selectOption(item.number, opt)}
                              className={cn(
                                'rounded-md px-2 py-0.5 text-[11px] font-bold transition-all duration-150 active:scale-95',
                                isSelected
                                  ? 'bg-[#5a63df] text-white shadow-2xs ring-1 ring-[#5a63df]'
                                  : 'border border-[#e2e5f2] bg-slate-50/80 text-slate-700 hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                              )}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {!isRevealed ? (
                  <button
                    type="button"
                    aria-label={`Compare answer for question ${item.number}`}
                    onClick={() => reveal(item.number)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e5f2] bg-white px-2.5 py-1 text-xs font-extrabold text-[#5a63df] shadow-2xs transition hover:border-[#5a63df]/40 hover:bg-[#5a63df]/5 active:scale-[0.99] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Compare answer</span>
                  </button>
                ) : null}
              </div>

              {/* Revealed answer comparison */}
              {isRevealed && (
                <div className="mt-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Suggested answer {item.number}
                    </span>
                    {userChoice && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black',
                          matchesChoice(userChoice, item.answer)
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                        )}
                      >
                        {matchesChoice(userChoice, item.answer) ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={3} /> Matches your choice!
                          </>
                        ) : (
                          `You chose: ${userChoice}`
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {renderInline(item.answer, `answer-${item.number}`)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-emerald-200/50 pt-2 dark:border-emerald-500/20">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Self-assessment:
                    </span>
                    <button
                      type="button"
                      aria-pressed={isChecked && isConfident}
                      onClick={() => selfMark(item.number, true)}
                      className={cn(
                        'rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold transition',
                        isChecked && isConfident
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400 dark:border-emerald-400/20 dark:bg-white/5 dark:text-emerald-200'
                      )}
                    >
                      I got this
                    </button>
                    <button
                      type="button"
                      aria-pressed={isChecked && !isConfident}
                      onClick={() => selfMark(item.number, false)}
                      className={cn(
                        'rounded-md border px-2.5 py-0.5 text-[10px] font-extrabold transition',
                        isChecked && !isConfident
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-amber-200 bg-white text-amber-800 hover:border-amber-400 dark:border-amber-400/20 dark:bg-white/5 dark:text-amber-200'
                      )}
                    >
                      Review again
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {checked.size === items.length && items.length > 0 && (
        <div className="mt-3 rounded-lg bg-emerald-100/80 px-3 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100">
          {confident.size === items.length
            ? '✓ Strong check! All items mastered. Ready for IELTS practice.'
            : `Completed! ${items.length - confident.size} item${
                items.length - confident.size === 1 ? '' : 's'
              } marked for review.`}
        </div>
      )}
    </div>
  );
}

function GuideSection({ section }) {
  const isAnswerKey = /answer|suggested answer/i.test(section.title);
  const displayTitle = isAnswerKey ? 'Check your practice' : section.title;

  if (isAnswerKey) {
    return (
      <section id={section.id} className="scroll-mt-24 pb-1">
        <InteractiveAnswerCheck section={section} />
      </section>
    );
  }

  if (!section.title && !section.blocks.length) return null;

  return (
    <section
      id={section.id}
      className="scroll-mt-24 border-b border-[#eceafa]/60 pb-5 last:border-0 dark:border-white/10"
    >
      {section.title && (
        <div className="mb-3 flex items-start gap-2.5">
          <IconChip icon={BookOpenText} size="md" />
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5a63df] dark:text-indigo-300">
              Workbook Unit
            </div>
            <h2 className="mt-0.5 text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              {displayTitle}
            </h2>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {section.blocks.map((block, index) => (
          <GuideBlock key={`${section.id}-${block.type}-${index}`} block={block} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function GrammarGuidePage({
  resource,
  user,
  isStarting,
  isCompleted = false,
  isUpdatingCompletion = false,
  onSetCompletion,
  onBack,
  onPractice,
}) {
  const sections = useMemo(
    () => (resource?.content_markdown ? parseGrammarGuide(resource.content_markdown) : []),
    [resource?.content_markdown]
  );
  const tableOfContents = useMemo(
    () =>
      sections.flatMap((section) => [
        ...(section.title
          ? [
              {
                id: section.id,
                title: /answer|suggested answer/i.test(section.title)
                  ? 'Check your practice'
                  : section.title,
              },
            ]
          : []),
        ...section.blocks
          .filter((block) => block.type === 'subheading')
          .map((block) => ({ id: block.id, title: block.value })),
      ]),
    [sections]
  );

  const [activeHeadingId, setActiveHeadingId] = useState('');

  useEffect(() => {
    if (!tableOfContents.length) return;
    const handleScroll = () => {
      const headingElements = tableOfContents
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);

      const scrollPosition = (typeof window !== 'undefined' ? window.scrollY : 0) + 140;
      let currentId = '';
      for (const el of headingElements) {
        if (el.offsetTop <= scrollPosition) {
          currentId = el.id;
        } else {
          break;
        }
      }
      if (currentId) {
        setActiveHeadingId(currentId);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableOfContents]);

  if (!resource) {
    return (
      <section className={cn(PANEL, 'mx-auto max-w-3xl p-8 text-center')}>
        <BookOpenText className="mx-auto h-8 w-8 text-[#5a63df]" />
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 dark:text-white">
          Guide not found
        </h1>
        <p className={cn('mt-2 text-sm font-medium', MUTED)}>
          This Grammar Lab guide is not available.
        </p>
        <Button onClick={onBack} variant="outline" className="mt-5 rounded-lg font-bold">
          Back to Grammar Lab
        </Button>
      </section>
    );
  }

  if (!hasContentAccess(user, resource.access_tier)) {
    const tier = contentTierLabel(resource.access_tier);
    return (
      <div className="flex min-h-[calc(100vh-220px)] items-center justify-center">
        <section className={cn(PANEL, 'mx-auto max-w-2xl border-dashed p-8 text-center sm:p-10')}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] ring-4 ring-[#5a63df]/6 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.14] dark:text-[#afb5ff] dark:ring-[#8f97ff]/8">
            <LockKeyhole className="h-5 w-5" strokeWidth={2.25} />
          </span>

          <Pill tone="accent" className="mx-auto mt-4 w-fit">
            {tier}
          </Pill>

          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tier} grammar guide
          </h1>
          <p className={cn('mx-auto mt-1.5 max-w-md text-sm font-medium leading-6', MUTED)}>
            Upgrade to {tier} to continue this workbook unit and its practice.
          </p>

          <ul className="mx-auto mt-4 flex w-fit flex-col gap-1.5 text-left">
            {LOCKED_GUIDE_BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-[rgb(var(--signal-ok))]"
                  strokeWidth={2.75}
                />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={onBack} variant="outline" className="rounded-lg font-bold">
              Back to Grammar Lab
            </Button>
            <Button
              asChild
              className="rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
            >
              <Link to="/pricing">View plans</Link>
            </Button>
          </div>
          <p className={cn(MICRO, MUTED, 'mt-3')}>Included in Pro and Premium</p>
        </section>
      </div>
    );
  }

  const meta = skillMeta(resource.skill_code);
  const previousGuide = getGrammarGuide(resource.previous_slug);
  const nextGuide = getGrammarGuide(resource.next_slug);

  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-extrabold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Grammar Lab
      </button>

      <section className={cn(PANEL, 'relative overflow-hidden p-4 sm:p-6')}>
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_75%_35%,rgba(90,99,223,0.12),transparent_60%)] lg:block" />
        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">
              <BookOpenText className="h-3 w-3" />
              {skillLabel(resource.skill_code)}
            </Pill>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 shadow-2xs dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Check className="h-2.5 w-2.5" /> Completed
              </span>
            )}
          </div>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {resource.title}
          </h1>
          <p
            className={cn('mt-1.5 max-w-2xl text-xs font-medium leading-relaxed sm:text-sm', MUTED)}
          >
            {resource.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eceafa] bg-white/80 px-2.5 py-0.5 text-[11px] font-bold dark:border-white/10 dark:bg-white/5">
              <Clock3 className="h-3.5 w-3.5 text-[#5a63df]" />
              {resource.estimated_minutes} minute guide
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              IELTS Writing & Speaking
            </span>
            {resource.unit_number && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eceafa] bg-white/80 px-2.5 py-0.5 text-[11px] font-bold dark:border-white/10 dark:bg-white/5">
                Unit {resource.unit_number} of 18
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <article className={cn(PANEL, 'space-y-5 px-4 py-5 sm:px-6 sm:py-6')}>
          {sections.map((section) => (
            <GuideSection key={section.id} section={section} />
          ))}

          {/* End-of-Guide Action & Unit Pagination Panel */}
          <div className="mt-6 rounded-xl border border-[#e4e2f0] bg-linear-to-br from-white to-[#faf9ff] p-4 sm:p-5 dark:border-white/10 dark:from-[#141319] dark:to-[#100f15]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#5a63df] dark:text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5" /> Unit complete
                </div>
                <h3 className="mt-0.5 text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {isCompleted ? 'You completed this unit!' : 'Finished reading this guide?'}
                </h3>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isCompleted
                    ? 'Great progress! Reinforce this rule in practice, or advance to the next unit.'
                    : 'Mark it complete to record your progress in Grammar Lab.'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => onPractice(resource.skill_code)}
                  disabled={isStarting}
                  className="rounded-xl bg-[#5a63df] text-xs font-extrabold text-white shadow-xs transition hover:bg-[#4a52c9] active:scale-[0.99]"
                >
                  Start practice set <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {(previousGuide || nextGuide) && (
              <div className="mt-4 flex items-center justify-between border-t border-[#eceafa] pt-4 dark:border-white/10">
                {previousGuide ? (
                  <Link
                    to={`/grammar/guides/${previousGuide.slug}`}
                    className="group inline-flex items-center gap-2 text-xs font-extrabold text-slate-600 transition hover:text-[#5a63df] dark:text-slate-400 dark:hover:text-indigo-300"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" />
                    <span>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Previous
                      </span>
                      Unit {previousGuide.unit_number}: {previousGuide.title}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}
                {nextGuide && (
                  <Link
                    to={`/grammar/guides/${nextGuide.slug}`}
                    className="group inline-flex items-center gap-2 text-right text-xs font-extrabold text-[#5a63df] transition hover:text-[#4a52c9] dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    <span>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Next Unit
                      </span>
                      Unit {nextGuide.unit_number}: {nextGuide.title}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </article>

        <aside className="space-y-3.5 lg:sticky lg:top-6">
          <nav aria-label="Guide contents" className={cn(PANEL, 'p-4 sm:p-5')}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#5a63df] dark:text-indigo-300">
                In this guide
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {tableOfContents.length} topics
              </span>
            </div>
            <div className="mt-3.5 space-y-1">
              {tableOfContents.map((item, index) => {
                const isActive = activeHeadingId === item.id;
                return (
                  <a
                    key={`${item.id}-${index}`}
                    href={`#${item.id}`}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all duration-150',
                      isActive
                        ? 'bg-[#5a63df]/10 text-[#5a63df] font-extrabold dark:bg-indigo-500/20 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-indigo-300'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black transition-colors',
                        isActive
                          ? 'bg-[#5a63df] text-white'
                          : 'bg-[#5a63df]/10 text-[#5a63df] group-hover:bg-[#5a63df]/20 dark:bg-indigo-500/20 dark:text-indigo-300'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </a>
                );
              })}
            </div>
          </nav>

          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <IconChip icon={Route} size="md" />
            <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
              Your next step
            </h2>
            <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>
              {meta.guideOutcome || meta.transferHint}
            </p>
            <Button
              onClick={() => onPractice(resource.skill_code)}
              disabled={isStarting}
              className="mt-3.5 w-full rounded-xl bg-[#5a63df] text-xs font-extrabold text-white shadow-xs transition hover:bg-[#4a52c9] active:scale-[0.99]"
            >
              Practise this skill <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>

          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={cn(
                  'h-4 w-4',
                  isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isCompleted ? 'Guide completed' : 'Finished this guide?'}
              </h2>
            </div>
            <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>
              {isCompleted
                ? 'This is saved to your Grammar Lab progress. You can change it whenever you need.'
                : 'Mark it complete only after you have worked through the guide and its checks.'}
            </p>
            <Button
              type="button"
              onClick={() => onSetCompletion?.(!isCompleted)}
              disabled={!onSetCompletion || isUpdatingCompletion}
              variant={isCompleted ? 'outline' : 'default'}
              className={cn(
                'mt-3.5 w-full rounded-xl text-xs font-extrabold transition active:scale-[0.99]',
                !isCompleted && 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
              )}
            >
              {isCompleted ? 'Mark as incomplete' : 'Mark guide complete'}
            </Button>
          </section>

          {(previousGuide || nextGuide) && (
            <nav aria-label="Workbook units" className={cn(PANEL, 'grid grid-cols-2 gap-2 p-2.5')}>
              {previousGuide ? (
                <Link
                  to={`/grammar/guides/${previousGuide.slug}`}
                  className="rounded-lg p-2 text-left text-[11px] font-extrabold text-slate-500 transition hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-indigo-300"
                >
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Previous
                  </span>
                  ← Unit {previousGuide.unit_number}
                </Link>
              ) : (
                <span />
              )}
              {nextGuide && (
                <Link
                  to={`/grammar/guides/${nextGuide.slug}`}
                  className="rounded-lg p-2 text-right text-[11px] font-extrabold text-[#5a63df] transition hover:bg-[#f4f3fb] dark:hover:bg-white/5"
                >
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Next
                  </span>
                  Unit {nextGuide.unit_number} →
                </Link>
              )}
            </nav>
          )}

          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Apply it in IELTS
            </h2>
            <div className="mt-3 space-y-2">
              {[
                { to: '/writing', label: 'Writing practice', icon: FilePenLine },
                { to: '/speaking', label: 'Speaking practice', icon: Mic2 },
                { to: '/learning-path', label: 'AI Learning Path', icon: Sparkles },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-lg border border-[#e2e5f2] px-3 py-2.5 text-xs font-extrabold text-slate-700 transition hover:border-[#c9cdf3] hover:text-[#5a63df] dark:border-white/10 dark:text-slate-200 dark:hover:border-indigo-500/30 dark:hover:text-indigo-300"
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-[#5a63df]" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </section>

          <div className="hidden items-center gap-2 px-2 text-[11px] font-bold text-slate-400 lg:flex">
            <BarChart3 className="h-3.5 w-3.5" />
            Practice evidence stays separate from IELTS band scores.
          </div>
        </aside>
      </div>
    </div>
  );
}
