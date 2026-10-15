import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MICRO,
  TILE,
  TITLE,
  MUTED,
  NUM,
  Pill,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';

function ItemPreview({ item, options, onChange, editableAnswer }) {
  return (
    <div className="space-y-3 border-t border-[#e4e2f0] dark:border-white/[0.07] pt-3">
      <div className="flex items-center gap-2">
        <span className={cn(NUM, 'text-xs font-bold')}>Q{item.number}</span>
        <Pill tone="accent">{item.answer}</Pill>
      </div>
      {editableAnswer && (
        <label className="block text-xs space-y-1">
          Correct answer · Q{item.number}
          <Input
            value={item.answer}
            className="shadow-none text-xs"
            onChange={(e) => onChange({ ...item, answer: e.target.value })}
          />
        </label>
      )}
      <label className="block text-xs space-y-1">
        Question
        <Textarea
          className="shadow-none text-xs leading-relaxed"
          value={item.text}
          rows={2}
          onChange={(e) => onChange({ ...item, text: e.target.value })}
        />
      </label>
      {(item.options || options)?.length > 0 && (
        <ol className="list-[upper-alpha] pl-5 text-xs space-y-1">
          {(item.options || options).map((option, i) => (
            <li key={i}>{option}</li>
          ))}
        </ol>
      )}
      <label className="block text-xs space-y-1">
        Explanation
        <Textarea
          className="shadow-none text-xs leading-relaxed"
          rows={2}
          value={item.explanation.why_correct}
          onChange={(e) =>
            onChange({ ...item, explanation: { ...item.explanation, why_correct: e.target.value } })
          }
        />
      </label>
      <label className="block text-xs space-y-1">
        Passage evidence
        <Textarea
          className="shadow-none text-xs leading-relaxed"
          rows={2}
          value={item.explanation.passage_highlight}
          onChange={(e) =>
            onChange({
              ...item,
              explanation: { ...item.explanation, passage_highlight: e.target.value },
            })
          }
        />
      </label>
      {item.explanation.trap && (
        <label className="block text-xs space-y-1">
          Common trap
          <Textarea
            value={item.explanation.trap}
            rows={2}
            maxLength={180}
            className="shadow-none text-xs leading-relaxed"
            onChange={(e) =>
              onChange({ ...item, explanation: { ...item.explanation, trap: e.target.value } })
            }
          />
        </label>
      )}
      <details className="text-xs">
        <summary className="cursor-pointer font-medium">Keywords and other options</summary>
        <div className="mt-2 space-y-1">
          {item.explanation.synonym_map.map((pair, i) => (
            <p key={i}>
              {pair.question_keyword} → {pair.passage_keyword}: {pair.connection}
            </p>
          ))}
          {Object.entries(item.explanation.why_wrong).map(([label, reason]) => (
            <p key={label}>
              {label}: {reason}
            </p>
          ))}
          {!item.explanation.synonym_map.length &&
            !Object.keys(item.explanation.why_wrong).length && (
              <p className={MUTED}>No additional notes needed.</p>
            )}
        </div>
      </details>
    </div>
  );
}

function GroupSource({ group }) {
  return (
    <>
      {group.text && <p className="whitespace-pre-wrap text-xs">{group.text}</p>}
      {group.rows && (
        <div className="overflow-x-auto">
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr>
                {group.headers.map((header, i) => (
                  <th key={i} className="border p-2 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, col) => (
                    <td key={col} className="border p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {group.steps && (
        <ol className="space-y-1 text-xs">
          {group.steps.map((step, i) => (
            <li className={cn(TILE, 'p-2')} key={i}>
              {step}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export default function AiReadingDraftPreview({
  draft,
  onChange,
  model,
  cost,
  testType = 'reading',
  inferredAnswers = false,
}) {
  const listening = testType === 'listening';
  const sectionLabel = listening ? 'Part' : 'Passage';
  const [sectionIndex, setSectionIndex] = useState(0);
  const section = draft.sections[sectionIndex] || draft.sections[0];
  const changeSection = (next) =>
    onChange({
      ...draft,
      sections: draft.sections.map((value, i) => (i === sectionIndex ? next : value)),
    });
  const changeItem = (g, n, next) =>
    changeSection({
      ...section,
      groups: section.groups.map((group, i) =>
        i === g
          ? {
              ...group,
              items: group.items.map((item, index) => (index === n ? next : item)),
            }
          : group
      ),
    });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="warn">Draft preview</Pill>
        <span className={cn(MUTED, 'text-xs')}>
          {model?.includes('luna') ? 'GPT-6 Luna' : 'GLM-5.3 Flash'} ·{' '}
          {Number(cost || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4,
          })}
        </span>
      </div>
      {inferredAnswers && (
        <p role="note" className={cn(TILE, 'p-3 text-xs leading-relaxed')}>
          AI-inferred answers · No answer key was supplied. Check each answer and its passage
          evidence before saving. You can correct answers below.
        </p>
      )}
      <label className="block text-xs space-y-1">
        Test title
        <Input
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
        />
      </label>
      <div className="flex flex-wrap gap-2" aria-label={listening ? 'Parts' : 'Passages'}>
        {draft.sections.map((value, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setSectionIndex(i)}
            aria-pressed={sectionIndex === i}
            className={cn(
              TILE,
              'px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-[#5a63df]',
              sectionIndex === i && 'border-[#5a63df] text-[#5a63df] dark:text-[#afb5ff]'
            )}
          >
            {sectionLabel} {i + 1} ·{' '}
            {value.groups.reduce((count, group) => count + group.items.length, 0)} questions
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <section className={cn(TILE, 'p-3 space-y-3 min-w-0')}>
          <h3 className={TITLE}>{listening ? 'Audioscript' : 'Passage'}</h3>
          <label className="block text-xs space-y-1">
            {listening ? 'Part title' : 'Passage title'}
            <Input
              value={section.title}
              onChange={(e) => changeSection({ ...section, title: e.target.value })}
            />
          </label>
          <label className="block text-xs space-y-1">
            {listening ? 'Audioscript text' : 'Passage text'}
            <Textarea
              className="shadow-none text-xs leading-relaxed"
              value={section.content}
              rows={14}
              onChange={(e) => changeSection({ ...section, content: e.target.value })}
            />
          </label>
          {section.highlights?.length > 0 && (
            <div className="space-y-2 text-xs">
              <p className={MICRO}>Detected answer highlights</p>
              {section.highlights.map((highlight, index) => (
                <p key={index} className={cn(TILE, 'p-2')}>
                  <strong>Q{highlight.question_numbers.join(', ')}:</strong>{' '}
                  <mark className="bg-[rgb(var(--signal-ok)/0.16)] text-inherit">
                    {highlight.text}
                  </mark>
                </p>
              ))}
            </div>
          )}
        </section>
        <section className="space-y-3 min-w-0">
          <h3 className={TITLE}>Questions and explanations</h3>
          <p className={cn(MUTED, 'text-xs')}>
            {inferredAnswers
              ? 'Answers were inferred from your material. Check the evidence and correct any answer below; update its explanation if needed.'
              : 'Answers follow your supplied key. To correct the key or question layout, return to the source and regenerate.'}
          </p>
          {section.groups.map((group, g) => (
            <details key={g} open={g === 0} className={cn(TILE, 'p-3')}>
              <summary className={cn(MICRO, 'cursor-pointer')}>
                {group.type.replaceAll('_', ' ')} · Q{group.items[0].number}
                {group.items.length > 1 ? `–${group.items.at(-1).number}` : ''}
              </summary>
              <div className="pt-3 space-y-3">
                {group.title && <p className="text-sm font-semibold">{group.title}</p>}
                <p className="text-xs whitespace-pre-wrap">{group.instructions}</p>
                <GroupSource group={group} />
                {group.items.map((item, n) => (
                  <ItemPreview
                    key={item.number}
                    item={item}
                    options={group.options}
                    editableAnswer={inferredAnswers}
                    onChange={(next) => changeItem(g, n, next)}
                  />
                ))}
              </div>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
