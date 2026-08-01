import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Eye,
  Lightbulb,
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
import { IconChip, MUTED, PANEL, Pill } from '@/features/dashboard/components/primitives';

function headingId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function renderInline(value, keyPrefix) {
  return String(value || '')
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong
            key={`${keyPrefix}-strong-${index}`}
            className="font-extrabold text-slate-900 dark:text-white"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em
            key={`${keyPrefix}-em-${index}`}
            className="font-semibold text-slate-800 dark:text-slate-100"
          >
            {part.slice(1, -1)}
          </em>
        );
      }
      return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
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
    if (/^\d+\.\s/.test(value)) {
      current.blocks.push({ type: 'numbered', value: value.replace(/^\d+\.\s/, '') });
      continue;
    }
    if (value.startsWith('> ')) {
      current.blocks.push({ type: 'example', value: value.slice(2).trim() });
      continue;
    }
    current.blocks.push({ type: 'paragraph', value });
  }

  if (current.title || current.blocks.length) sections.push(current);
  return sections;
}

function GuideBlock({ block, index }) {
  const content = renderInline(block.value, `${block.type}-${index}`);
  if (block.type === 'subheading') {
    const isPractice = /^Practice\b/i.test(block.value);
    return (
      <h3
        id={block.id}
        className={cn(
          'mt-6 scroll-mt-24 text-base font-extrabold tracking-tight text-slate-900 dark:text-white',
          isPractice &&
            'rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/[0.06] px-4 py-3 text-slate-900 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-100'
        )}
      >
        {content}
      </h3>
    );
  }
  if (block.type === 'bullet') {
    const isIncorrectExample = /^Incorrect:/i.test(block.value);
    const isCorrectExample = /^Correct:/i.test(block.value);
    const icon = isIncorrectExample ? (
      <XCircle
        role="img"
        aria-label="Incorrect example"
        className="mt-1.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400"
      />
    ) : (
      <CheckCircle2
        role={isCorrectExample ? 'img' : undefined}
        aria-label={isCorrectExample ? 'Correct example' : undefined}
        aria-hidden={isCorrectExample ? undefined : true}
        className="mt-1.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400"
      />
    );

    return (
      <li
        className={cn(
          'flex gap-3 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300',
          isIncorrectExample && 'text-rose-800 dark:text-rose-200'
        )}
      >
        {icon}
        <span>{content}</span>
      </li>
    );
  }
  if (block.type === 'numbered') {
    return (
      <li className="ml-5 list-decimal pl-1 text-sm font-medium leading-7 text-slate-600 marker:font-extrabold marker:text-[#5a63df] dark:text-slate-300">
        {content}
      </li>
    );
  }
  if (block.type === 'example') {
    return (
      <blockquote className="my-4 rounded-lg border border-[#dfe3fa] bg-[#f5f6ff] px-5 py-4 text-[15px] font-bold leading-7 text-slate-800 shadow-[inset_4px_0_0_#5a63df] dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-slate-100">
        {content}
      </blockquote>
    );
  }
  if (block.type === 'table') {
    return (
      <div className="my-4 overflow-x-auto rounded-lg border border-[#e3e6f4] dark:border-white/10">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead className="bg-[#f5f6fc] text-slate-800 dark:bg-white/5 dark:text-white">
            <tr>
              {block.headers.map((header, cellIndex) => (
                <th key={`${header}-${cellIndex}`} className="px-4 py-3 font-extrabold">
                  {renderInline(header, `table-head-${index}-${cellIndex}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceefa] dark:divide-white/10">
            {block.rows.map((row, rowIndex) => (
              <tr key={`table-row-${index}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cell}-${cellIndex}`}
                    className="px-4 py-3 align-top font-medium leading-5 text-slate-600 dark:text-slate-300"
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
    <p className="text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">{content}</p>
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

  if (numbered.length) return numbered;
  return section.blocks
    .filter((block) => ['bullet', 'paragraph'].includes(block.type))
    .map((block, index) => ({ number: index + 1, answer: block.value }));
}

function InteractiveAnswerCheck({ section }) {
  const items = answerItems(section);
  const [revealed, setRevealed] = useState(() => new Set());
  const [checked, setChecked] = useState(() => new Set());
  const [confident, setConfident] = useState(() => new Set());

  const reveal = (number) => {
    setRevealed((current) => new Set(current).add(number));
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
  const reset = () => {
    setRevealed(new Set());
    setChecked(new Set());
    setConfident(new Set());
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/65 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
            Check one answer at a time
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-emerald-800/75 dark:text-emerald-200/75">
            Try every item first. Reveal the model only when you are ready to compare.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 dark:bg-white/10 dark:text-emerald-200">
            {checked.size}/{items.length} reviewed
          </span>
          {revealed.size > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-emerald-800 transition hover:bg-white/70 dark:text-emerald-200 dark:hover:bg-white/10"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const isRevealed = revealed.has(item.number);
          const isChecked = checked.has(item.number);
          const isConfident = confident.has(item.number);
          return (
            <div
              key={item.number}
              className="overflow-hidden rounded-lg border border-emerald-200/80 bg-white/85 dark:border-emerald-400/15 dark:bg-[#10131f]"
            >
              {!isRevealed ? (
                <button
                  type="button"
                  aria-label={`Compare answer for question ${item.number}`}
                  onClick={() => reveal(item.number)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-extrabold text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-emerald-400/10"
                >
                  <span>Question {item.number}</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Eye className="h-3.5 w-3.5" /> Compare answer
                  </span>
                </button>
              ) : (
                <div className="p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                    Suggested answer {item.number}
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                    {renderInline(item.answer, `answer-${item.number}`)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-emerald-100 pt-3 dark:border-emerald-400/15">
                    <button
                      type="button"
                      aria-pressed={isChecked && isConfident}
                      onClick={() => selfMark(item.number, true)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-[10px] font-extrabold transition',
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
                        'rounded-lg border px-3 py-1.5 text-[10px] font-extrabold transition',
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

      {checked.size === items.length && (
        <div className="mt-3 rounded-lg bg-emerald-100/80 px-3 py-2 text-xs font-bold text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100">
          {confident.size === items.length
            ? 'Strong check. Continue to measured practice while the rule is fresh.'
            : `${items.length - confident.size} item${
                items.length - confident.size === 1 ? '' : 's'
              } marked for another look before practice.`}
        </div>
      )}
    </div>
  );
}

function GuideSection({ section }) {
  const isAnswerKey = /answer|suggested answer/i.test(section.title);
  const displayTitle = isAnswerKey ? 'Check your practice' : section.title;
  const sectionContent = (
    <div className="space-y-3">
      {section.blocks.map((block, index) => (
        <GuideBlock key={`${section.id}-${block.type}-${index}`} block={block} index={index} />
      ))}
    </div>
  );

  return (
    <section
      id={section.id}
      className="scroll-mt-24 border-b border-[#eceefa] pb-8 last:border-0 dark:border-white/10"
    >
      {section.title && (
        <div className="mb-4 flex items-start gap-3">
          <IconChip icon={isAnswerKey ? CheckCircle2 : Lightbulb} size="lg" />
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {displayTitle}
          </h2>
        </div>
      )}
      {isAnswerKey ? <InteractiveAnswerCheck section={section} /> : sectionContent}
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
    return (
      <section className={cn(PANEL, 'mx-auto max-w-2xl p-8 text-center sm:p-10')}>
        <IconChip icon={LockKeyhole} size="lg" className="mx-auto" />
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {contentTierLabel(resource.access_tier)} grammar guide
        </h1>
        <p className={cn('mx-auto mt-2 max-w-md text-sm font-medium leading-6', MUTED)}>
          Upgrade to {contentTierLabel(resource.access_tier)} to continue this workbook unit and its
          practice.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
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
      </section>
    );
  }

  const sections = parseGrammarGuide(resource.content_markdown);
  const tableOfContents = sections.flatMap((section) => [
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
  ]);
  const meta = skillMeta(resource.skill_code);
  const previousGuide = getGrammarGuide(resource.previous_slug);
  const nextGuide = getGrammarGuide(resource.next_slug);

  return (
    <div className="mx-auto max-w-[1280px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Grammar Lab
      </button>

      <section className={cn(PANEL, 'relative overflow-hidden px-6 py-4 sm:px-8 sm:py-5')}>
        <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(90,99,223,0.14),transparent_55%)] lg:block" />
        <div className="relative max-w-3xl">
          <Pill tone="accent">
            <BookOpenText className="h-3 w-3" />
            {skillLabel(resource.skill_code)}
          </Pill>
          <h1 className="mt-2.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {resource.title}
          </h1>
          <p className={cn('mt-2 max-w-2xl text-sm font-medium leading-6', MUTED)}>
            {resource.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f3fb] px-3 py-1.5 dark:bg-white/5">
              <Clock3 className="h-3.5 w-3.5 text-[#5a63df]" />
              {resource.estimated_minutes} minute guide
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              IELTS Writing & Speaking
            </span>
            {resource.unit_number && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f3fb] px-3 py-1.5 dark:bg-white/5">
                Unit {resource.unit_number} of 18
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <article className={cn(PANEL, 'space-y-8 px-5 py-7 sm:px-8 sm:py-9')}>
          {sections.map((section) => (
            <GuideSection key={section.id} section={section} />
          ))}
        </article>

        <aside className="space-y-3 lg:sticky lg:top-6">
          <nav aria-label="Guide contents" className={cn(PANEL, 'p-4 sm:p-5')}>
            <div className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#5a63df]">
              In this guide
            </div>
            <div className="mt-3 space-y-1">
              {tableOfContents.map((item, index) => (
                <a
                  key={`${item.id}-${index}`}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-indigo-300"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5a63df]/10 text-[10px] text-[#5a63df] dark:bg-indigo-500/20 dark:text-indigo-300">
                    {index + 1}
                  </span>
                  {item.title}
                </a>
              ))}
            </div>
          </nav>

          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <IconChip icon={Route} size="lg" />
            <h2 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
              Your next step
            </h2>
            <p className={cn('mt-2 text-xs font-medium leading-5', MUTED)}>
              {meta.guideOutcome || meta.transferHint}
            </p>
            <Button
              onClick={() => onPractice(resource.skill_code)}
              disabled={isStarting}
              className="mt-4 w-full rounded-lg bg-[#5a63df] font-bold text-white hover:bg-[#4a52c9]"
            >
              Practise this skill <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>

          <section className={cn(PANEL, 'p-4 sm:p-5')}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
                'mt-4 w-full rounded-lg font-bold',
                !isCompleted && 'bg-emerald-600 text-white hover:bg-emerald-700'
              )}
            >
              {isCompleted ? 'Mark as incomplete' : 'Mark guide complete'}
            </Button>
          </section>

          {(previousGuide || nextGuide) && (
            <nav aria-label="Workbook units" className={cn(PANEL, 'grid grid-cols-2 gap-2 p-3')}>
              {previousGuide ? (
                <Link
                  to={`/grammar/guides/${previousGuide.slug}`}
                  className="rounded-lg px-3 py-2 text-left text-[10px] font-extrabold text-slate-500 transition hover:bg-[#f4f3fb] hover:text-[#5a63df] dark:text-slate-400 dark:hover:bg-white/5"
                >
                  ← Unit {previousGuide.unit_number}
                </Link>
              ) : (
                <span />
              )}
              {nextGuide && (
                <Link
                  to={`/grammar/guides/${nextGuide.slug}`}
                  className="rounded-lg px-3 py-2 text-right text-[10px] font-extrabold text-[#5a63df] transition hover:bg-[#f4f3fb] dark:hover:bg-white/5"
                >
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
