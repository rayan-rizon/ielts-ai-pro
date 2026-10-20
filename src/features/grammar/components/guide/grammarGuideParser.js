export function headingId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function tableCells(line) {
  return String(line)
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isIgnoredLine(value) {
  if (!value) return true;
  if (value === '---') return true;
  return /^<\/?[a-z][^>]*>$/i.test(value);
}

function isTableStart(value, nextLine) {
  if (!value.startsWith('|')) return false;
  const trimmedNext = nextLine ? nextLine.trim() : '';
  if (!trimmedNext.startsWith('|')) return false;
  return /^\|?[\s:|-]+\|?$/.test(trimmedNext);
}

function parseTableBlock(lines, startIndex) {
  const headers = tableCells(lines[startIndex].trim());
  const rows = [];
  let index = startIndex + 2;

  while (index < lines.length && lines[index].trim().startsWith('|')) {
    rows.push(tableCells(lines[index]));
    index += 1;
  }

  return {
    block: { type: 'table', headers, rows },
    nextIndex: index - 1,
  };
}

function parseLineBlock(value) {
  if (value.startsWith('- ')) {
    return { type: 'bullet', value: value.slice(2).trim() };
  }

  const numberedMatch = value.match(/^(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return {
      type: 'numbered',
      number: parseInt(numberedMatch[1], 10),
      value: numberedMatch[2],
    };
  }

  if (value.startsWith('> ')) {
    return { type: 'example', value: value.slice(2).trim() };
  }

  return { type: 'paragraph', value };
}

function shouldPushSection(section) {
  return Boolean(section.title || section.blocks.length);
}

function handleHeadingLine(value, current, sections) {
  if (shouldPushSection(current)) {
    sections.push(current);
  }
  const title = value.slice(3).trim();
  return { id: headingId(title), title, blocks: [] };
}

function handleSubheadingLine(value, current) {
  const subheading = value.slice(4).trim();
  current.blocks.push({
    type: 'subheading',
    id: headingId(subheading),
    value: subheading,
  });
}

const PRACTICE_HEADING = /^Practice\b/i;
const ANSWER_TITLE = /answer/i;

export function isAnswerSection(section) {
  return ANSWER_TITLE.test(section?.title || '');
}

// Lifts a "### Practice N" heading, its instruction line and its numbered
// questions out of the lesson body so they can be rendered as one interactive
// card next to the answers. Anything after the questions stays in the lesson.
function takePracticeBlocks(section, index) {
  const { blocks } = section;
  const heading = blocks[index];
  let end = index + 1;
  let prompt = '';
  if (blocks[end]?.type === 'paragraph') {
    prompt = blocks[end].value;
    end += 1;
  }
  const questions = [];
  while (blocks[end]?.type === 'numbered') {
    questions.push(blocks[end]);
    end += 1;
  }
  section.blocks = [...blocks.slice(0, index), ...blocks.slice(end)];
  return { title: heading.value, id: heading.id, prompt, questions };
}

function takeNextPractice(sections) {
  for (const section of sections) {
    const index = section.blocks.findIndex(
      (block) => block.type === 'subheading' && PRACTICE_HEADING.test(block.value)
    );
    if (index !== -1) return takePracticeBlocks(section, index);
  }
  return null;
}

// Every answer section is paired, in reading order, with the next practice
// heading, so a guide can hold several exercises (for example Mixed review).
function linkPracticeContext(sections) {
  sections.filter(isAnswerSection).forEach((answerSection) => {
    const context = takeNextPractice(sections);
    if (context) answerSection.practiceContext = context;
  });
}

export function parseGrammarGuide(content) {
  const sections = [];
  let current = { id: 'start', title: '', blocks: [] };
  const lines = String(content || '').split('\n');

  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const value = lines[lineIndex].trim();
    if (isIgnoredLine(value)) {
      lineIndex += 1;
      continue;
    }

    if (value.startsWith('## ')) {
      current = handleHeadingLine(value, current, sections);
      lineIndex += 1;
      continue;
    }

    if (value.startsWith('### ')) {
      handleSubheadingLine(value, current);
      lineIndex += 1;
      continue;
    }

    if (isTableStart(value, lines[lineIndex + 1])) {
      const { block, nextIndex } = parseTableBlock(lines, lineIndex);
      current.blocks.push(block);
      lineIndex = nextIndex + 1;
      continue;
    }

    current.blocks.push(parseLineBlock(value));
    lineIndex += 1;
  }

  if (shouldPushSection(current)) {
    sections.push(current);
  }
  linkPracticeContext(sections);
  return sections;
}

function extractOptionsFromQuestion(question) {
  if (!question) return null;
  const match = question.match(/\*{1,2}([^*]+?\s*\/\s*[^*]+?)\*{1,2}/);
  if (!match) return null;

  const opts = match[1]
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  return opts.length >= 2 ? opts : null;
}

function isValidOptionCandidate(candidate) {
  if (!candidate) return false;
  if (candidate.length > 25) return false;
  return !/each|sentence|blank/i.test(candidate);
}

function extractOptionsFromPrompt(prompt) {
  if (!prompt) return null;
  const boldMatches = Array.from(prompt.matchAll(/\*{1,2}([^*]+?)\*{1,2}/g)).map((m) => m[1]);
  const candidates = [];

  for (const boldText of boldMatches) {
    const parts = boldText.split(/,\s*|\s+or\s+/);
    for (const part of parts) {
      const clean = part.trim();
      if (isValidOptionCandidate(clean)) {
        candidates.push(clean);
      }
    }
  }

  if (candidates.length >= 2 && candidates.length <= 6) {
    return candidates;
  }
  return null;
}

export function extractOptions(prompt, question) {
  const fromQuestion = extractOptionsFromQuestion(question);
  if (fromQuestion) return fromQuestion;
  return extractOptionsFromPrompt(prompt);
}

export function matchesChoice(selected, answer) {
  if (!selected || !answer) return false;
  const normalize = (value) => String(value).toLowerCase().replace(/\*|_/g, '').trim();
  return normalize(selected) === normalize(answer);
}

// Workbook keys come in two shapes: "1 has; 2 argue; 3 needs" and
// "1 _A sentence._ 2 _Another sentence._". Numbers are searched in order so a
// digit inside an answer (a year, a percentage) is never mistaken for a marker.
function parseSequentialAnswers(text) {
  const markers = [];
  let from = 0;
  for (let number = 1; number <= 40; number += 1) {
    const pattern = new RegExp(`(?<=^|;\\s|[._*)\\]”"]\\s)${number}\\s+(?=\\S)`, 'g');
    pattern.lastIndex = from;
    const match = pattern.exec(text);
    if (!match) break;
    markers.push({ number, start: match.index, answerStart: match.index + match[0].length });
    from = match.index + match[0].length;
  }
  if (!markers.length) return [];
  return markers.map((marker, index) => {
    const answerEnd = markers[index + 1]?.start ?? text.length;
    return {
      number: marker.number,
      answer: text.slice(marker.answerStart, answerEnd).trim().replace(/[.;]$/, ''),
    };
  });
}

const isNote = (block) => block.type === 'bullet' || block.type === 'paragraph';

function getBaseAnswerItems(section) {
  const numberedBlocks = section.blocks.filter((block) => block.type === 'numbered');
  if (numberedBlocks.length) {
    return numberedBlocks.map((block) => ({ number: block.number, answer: block.value }));
  }
  const text = section.blocks
    .filter(isNote)
    .map((block) => block.value)
    .join(' ')
    .trim();
  const sequential = parseSequentialAnswers(text);
  if (sequential.length > 0) return sequential;
  return section.blocks.filter(isNote).map((block, index) => ({
    number: index + 1,
    answer: block.value,
  }));
}

// When a key is a numbered list, any bullets or paragraphs beside it are
// teaching notes (score guides, why-it-works tips), not answers.
export function answerNotes(section) {
  const hasNumbered = section.blocks.some((block) => block.type === 'numbered');
  return hasNumbered ? section.blocks.filter(isNote) : [];
}

function resolveQuestionForAnswer(questions, itemNumber) {
  return questions.find((q) => q.number === itemNumber) || questions[itemNumber - 1];
}

function resolveOptionsForQuestion(prompt, qText) {
  const blanks = qText.match(/\[blank\]|_{2,}/gi);
  if (blanks && blanks.length > 1) {
    return null;
  }
  return extractOptions(prompt, qText);
}

export function answerItems(section) {
  const baseItems = getBaseAnswerItems(section);
  const questions = section.practiceContext?.questions || [];
  const prompt = section.practiceContext?.prompt || '';

  return baseItems.map((item) => {
    const matchedQ = resolveQuestionForAnswer(questions, item.number);
    const qText = matchedQ?.value || '';
    const options = resolveOptionsForQuestion(prompt, qText);
    return {
      ...item,
      question: qText,
      options,
    };
  });
}

function getSectionTocItems(section) {
  const items = [];
  if (section.title) {
    items.push({
      id: section.id,
      title: isAnswerSection(section)
        ? section.practiceContext?.title
          ? `Check: ${section.practiceContext.title}`
          : 'Check your practice'
        : section.title,
    });
  }

  const subheadings = section.blocks
    .filter((block) => block.type === 'subheading')
    .map((block) => ({ id: block.id, title: block.value }));

  return items.concat(subheadings);
}

export function buildTableOfContents(sections) {
  return (sections || []).flatMap(getSectionTocItems);
}
