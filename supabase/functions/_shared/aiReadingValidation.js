const TYPES = new Set([
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'short_answer',
  'sentence_completion',
  'summary_completion',
  'notes_completion',
  'matching_features',
  'matching_headings',
  'table_completion',
  'flowchart',
]);
const CHOICE_TYPES = new Set(['multiple_choice', 'matching_features', 'matching_headings']);
const ROMANS = [
  'i',
  'ii',
  'iii',
  'iv',
  'v',
  'vi',
  'vii',
  'viii',
  'ix',
  'x',
  'xi',
  'xii',
  'xiii',
  'xiv',
  'xv',
];
const BOOLEANS = {
  true_false_not_given: ['TRUE', 'FALSE', 'NOT GIVEN'],
  yes_no_not_given: ['YES', 'NO', 'NOT GIVEN'],
};
const answerIdentity = (answer) => String(answer).trim().replace(/\s+/g, ' ').toLowerCase();
const plain = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label} must be an object.`);
  return value;
}
function list(value, label, min = 0, max = 40) {
  if (!Array.isArray(value)) throw new Error(`${label} must be a list.`);
  if (value.length < min || value.length > max) throw new Error(`Invalid ${label} count.`);
  return value;
}
function integer(value, label, min, max) {
  if (!Number.isInteger(value)) throw new Error(`${label} must be a whole number.`);
  if (value < min || value > max) throw new Error(`${label} is out of range.`);
  return value;
}
function text(value, label, max = 60000) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is missing.`);
  if (value.length > max) throw new Error(`${label} is too long.`);
  if (/<\/?[a-z][^>]*>|\[(?:image|answer|center)\]/i.test(value))
    throw new Error(`${label}: use plain text without HTML or embedded images.`);
  return value.trim();
}
function optionalTitle(value) {
  return value ? text(value, 'Title', 200) : '';
}
function optionsFor(value, style = 'ABC') {
  const options = list(value, 'choice options', 2, 15).map((option) =>
    text(option, 'Option', 2000)
  );
  const labels = options.map((_, i) =>
    style === 'ROMAN' ? ROMANS[i] : String.fromCharCode(65 + i)
  );
  return { options, labels };
}
function synonymMap(value) {
  return list(value ?? [], 'keyword mappings', 0, 3).map((pair) => ({
    question_keyword: text(pair?.question_keyword, 'Question keyword', 300),
    passage_keyword: text(pair?.passage_keyword, 'Passage keyword', 300),
    connection: text(pair?.connection, 'Keyword connection', 500),
  }));
}
function wrongNotes(value, accepted, number) {
  const entries = list(
    Object.entries(record(value ?? {}, 'Wrong-option notes')),
    'wrong options',
    0,
    15
  );
  const correct = new Set(accepted.map(answerIdentity));
  return Object.fromEntries(
    entries.map(([label, reason]) => {
      if (correct.has(answerIdentity(label)))
        throw new Error(`Q${number}: an accepted answer is marked wrong.`);
      return [text(label, 'Wrong option', 30), text(reason, 'Wrong-option reason', 1000)];
    })
  );
}
function explanation(value, item, passage, accepted) {
  const raw = record(value, `Q${item.number} explanation`);
  const reason = text(raw.why_correct, `Q${item.number} explanation`, 1800);
  const evidence = text(raw.passage_highlight, `Q${item.number} passage evidence`, 3000);
  if (!plain(passage).includes(plain(evidence)))
    throw new Error(`Q${item.number}: evidence must quote its actual passage.`);
  if (/^N\/A\b|simulated passage|hypothetical passage/i.test(reason))
    throw new Error(`Q${item.number}: explain the answer using the actual passage.`);
  return {
    correct_answer: item.answer,
    why_correct: reason,
    passage_highlight: evidence,
    synonym_map: synonymMap(raw.synonym_map),
    why_wrong: wrongNotes(raw.why_wrong, accepted, item.number),
  };
}
function validateAnswerKey(item, context) {
  const supplied = context.suppliedAnswers[item.number];
  if (supplied && answerIdentity(supplied) !== answerIdentity(item.answer))
    throw new Error(`Q${item.number}: the generated answer differs from your answer key.`);
}
function normalizeItem(raw, group, passage, context) {
  record(raw, 'Question');
  integer(raw.number, 'Question number', 1, 40);
  if (raw.number !== context.nextNumber)
    throw new Error(
      `Expected Q${context.nextNumber}; question numbers must be complete and in order.`
    );
  context.nextNumber++;
  const item = {
    number: raw.number,
    text: text(raw.text, `Q${raw.number} text`, 6000),
    answer: text(raw.answer, `Q${raw.number} answer`, 300),
  };
  validateAnswerKey(item, context);
  if (raw.options) item.options = optionsFor(raw.options).options;
  const accepted = group.select_count > 1 ? group.items.map((i) => i.answer) : [item.answer];
  item.explanation = explanation(raw.explanation, item, passage, accepted);
  return item;
}
function validateChoices(group) {
  for (const item of group.items) {
    const allowed =
      BOOLEANS[group.type] ||
      (CHOICE_TYPES.has(group.type)
        ? optionsFor(item.options || group.options, group.style).labels
        : null);
    if (allowed && !allowed.map(answerIdentity).includes(answerIdentity(item.answer)))
      throw new Error(`Q${item.number}: answer is not one of the available choices.`);
  }
}
function validateMultiSelect(group) {
  if (group.select_count === 1) return;
  if (group.items.length !== group.select_count || !group.options)
    throw new Error(
      'A multi-select group must contain exactly its scored numbers and shared options.'
    );
  if (new Set(group.items.map((item) => answerIdentity(item.answer))).size !== group.items.length)
    throw new Error('Multi-select answers must be different choices.');
}
function markers(value, items, label) {
  const actual = [...value.matchAll(/\[(\d+)\]/g)].map((match) => Number(match[1]));
  if (JSON.stringify(actual) !== JSON.stringify(items.map((item) => item.number)))
    throw new Error(`${label}: include each numbered blank exactly once in question order.`);
}
function structuredText(raw, group) {
  group.text = text(raw.text, 'Structured question text');
  markers(group.text, group.items, group.type);
}
function validateSummary(raw, group) {
  if (group.items.length > 1) structuredText(raw, group);
  else group.items.forEach((item) => markers(item.text, [item], 'Completion'));
}
function validateMatching(raw, group) {
  if (raw.text) structuredText(raw, group);
  if (!group.options) throw new Error('Matching options are required.');
}
function cell(value) {
  return value === '' ? '' : text(value, 'Table cell', 2000);
}
function validateTable(raw, group) {
  group.headers = list(raw.headers, 'table headers', 1, 8).map((header) =>
    text(header, 'Table header', 300)
  );
  group.rows = list(raw.rows, 'table rows', 1, 30).map((row) =>
    list(row, 'table columns', group.headers.length, group.headers.length).map(cell)
  );
  markers(group.rows.flat().join('\n'), group.items, 'Table');
}
function validateFlowchart(raw, group) {
  group.steps = list(raw.steps, 'flowchart steps', 1, 30).map((step) =>
    text(step, 'Flowchart step', 3000)
  );
  markers(group.steps.join('\n'), group.items, 'Flowchart');
}
function validateSentence(_raw, group) {
  group.items.forEach((item) => markers(item.text, [item], 'Completion'));
}
const SHAPES = {
  multiple_choice: (_raw, group) => validateMultiSelect(group),
  notes_completion: structuredText,
  summary_completion: validateSummary,
  matching_features: validateMatching,
  matching_headings: validateMatching,
  table_completion: validateTable,
  flowchart: validateFlowchart,
  sentence_completion: validateSentence,
};
function groupOptions(raw, group) {
  if (raw.options) {
    group.style = raw.style === 'ROMAN' ? 'ROMAN' : 'ABC';
    group.options = optionsFor(raw.options, group.style).options;
  }
  if (raw.text) group.text = text(raw.text, 'Group text');
}
function normalizeGroup(value, passage, context) {
  const raw = record(value, 'Question group');
  if (!TYPES.has(raw.type)) throw new Error('Unsupported or unclear question type.');
  const select_count = integer(Number(raw.select_count ?? 1), 'MCQ selection count', 1, 3);
  if (select_count > 1 && raw.type !== 'multiple_choice')
    throw new Error('Only MCQs can be multi-select.');
  const rawItems = list(raw.items, 'numbered items', 1, 40);
  const group = {
    type: raw.type,
    title: optionalTitle(raw.title),
    instructions: text(raw.instructions, 'Group instructions', 4000),
    select_count,
  };
  group.items = rawItems.map((item) =>
    normalizeItem(item, { ...raw, items: rawItems, select_count }, passage, context)
  );
  groupOptions(raw, group);
  // A summary with a word list uses the existing matching paragraph renderer.
  if (group.type === 'summary_completion' && group.options) group.type = 'matching_features';
  validateChoices(group);
  SHAPES[group.type]?.(raw, group);
  return group;
}
function normalizeSection(value, context) {
  const raw = record(value, 'Passage section');
  const content = text(raw.content, 'Passage');
  const first = context.nextNumber;
  const groups = list(raw.groups, 'question groups', 1, 40).map((group) =>
    normalizeGroup(group, content, context)
  );
  const highlights = list(raw.highlights ?? [], 'source highlights', 0, 40).map((highlight) => {
    const excerpt = text(highlight.text, 'Highlighted source excerpt', 3000);
    if (!content.includes(excerpt))
      throw new Error('A detected highlight is not an exact passage excerpt.');
    const question_numbers = list(
      highlight.question_numbers,
      'highlight question numbers',
      1,
      40
    ).map((number) => integer(number, 'Highlight question number', first, context.nextNumber - 1));
    return { text: excerpt, question_numbers: [...new Set(question_numbers)] };
  });
  return {
    title: text(raw.title, 'Passage title', 200),
    content,
    groups,
    ...(highlights.length ? { highlights } : {}),
  };
}
export function validateAiReadingDraft(
  value,
  { expectedQuestions, suppliedAnswers = {}, sectionCounts = [], maxSections = 3 } = {}
) {
  const raw = record(value, 'Reading draft');
  if (raw.version !== 1) throw new Error('Unsupported Reading draft version.');
  const issues = list(raw.issues ?? [], 'source issues');
  if (issues.length) throw new Error(`Source needs attention: ${issues.slice(0, 4).join('; ')}`);
  const context = { nextNumber: 1, suppliedAnswers };
  const sections = list(raw.sections, 'passages', 1, maxSections).map((section) =>
    normalizeSection(section, context)
  );
  if (sectionCounts.length) {
    if (sections.length !== sectionCounts.length)
      throw new Error('The generated passages do not match your source passage options.');
    sections.forEach((section, index) => {
      if (
        section.groups.reduce((sum, group) => sum + group.items.length, 0) !== sectionCounts[index]
      )
        throw new Error(`Passage ${index + 1} has the wrong question count.`);
    });
  }
  if (context.nextNumber - 1 !== expectedQuestions)
    throw new Error(`Expected ${expectedQuestions} questions; received ${context.nextNumber - 1}.`);
  return { version: 1, title: text(raw.title, 'Test title', 200), sections, issues: [] };
}

export { explanation as validateGeneratedReadingExplanation };
