import React from 'react';
import { AlertCircle, CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { renderInline } from './renderInline';

function GuideSubheading({ block, content }) {
  const isPractice = /^Practice\b/i.test(block.value);
  if (isPractice) {
    return (
      <div className="mt-6">
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
      </div>
    );
  }

  return (
    <div className="mt-5 first:mt-1">
      <h3
        id={block.id}
        className="scroll-mt-24 border-b border-[#eceafa]/70 pb-1.5 text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:border-white/10 dark:text-white"
      >
        {content}
      </h3>
    </div>
  );
}

function GuideBulletItem({ block, content }) {
  const isNegative = /^(Incorrect|Fragment|Weak|Unclear):/i.test(block.value);
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

  const isPositive = /^(Correct|Complete|Repaired|Clear|Better):/i.test(block.value);
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

  const isCaution = /^(Caution|Warning|Avoid|Watch out):/i.test(block.value);
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

function GuideNumberedItem({ block, content, index }) {
  return (
    <li className="flex items-start gap-2.5 text-sm font-medium leading-snug text-slate-700 dark:text-slate-300">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#e2e5f2] bg-[#f8f9fe] text-[10px] font-black text-[#5a63df] dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
        {block.number || index + 1}
      </span>
      <span className="min-w-0 flex-1">{content}</span>
    </li>
  );
}

function GuideTable({ block, index }) {
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

export function GuideBlock({ block, index }) {
  const content = renderInline(block.value, `${block.type}-${index}`);

  if (block.type === 'subheading') {
    return <GuideSubheading block={block} content={content} />;
  }
  if (block.type === 'bullet') {
    return <GuideBulletItem block={block} content={content} />;
  }
  if (block.type === 'numbered') {
    return <GuideNumberedItem block={block} content={content} index={index} />;
  }
  if (block.type === 'example') {
    return (
      <blockquote className="my-3 rounded-r-xl rounded-l-xs border border-l-[3.5px] border-[#e2e5f5] border-l-[#5a63df] bg-[#f8f9ff] px-3.5 py-2.5 text-sm font-semibold leading-relaxed text-slate-800 dark:border-white/10 dark:border-l-[#8f97ff] dark:bg-white/[0.03] dark:text-slate-100">
        {content}
      </blockquote>
    );
  }
  if (block.type === 'table') {
    return <GuideTable block={block} index={index} />;
  }

  return (
    <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
      {content}
    </p>
  );
}
