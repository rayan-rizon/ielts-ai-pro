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

function attachPracticeContext(answerSection, targetSection, pIdx) {
  const pSubheading = targetSection.blocks[pIdx];
  const after = targetSection.blocks.slice(pIdx + 1);
  const promptBlock = after.find((b) => b.type === 'paragraph');
  const questionBlocks = after.filter((b) => b.type === 'numbered');

  answerSection.practiceContext = {
    title: pSubheading.value,
    id: pSubheading.id,
    prompt: promptBlock?.value || '',
    questions: questionBlocks,
  };

  targetSection.blocks = targetSection.blocks.slice(0, pIdx);
}

function linkPracticeContext(sections) {
  const answerSection = sections.find((s) => /answer|suggested answer/i.test(s.title));
  if (!answerSection) return;

  for (const s of sections) {
    const pIdx = s.blocks.findIndex((b) => b.type === 'subheading' && /^Practice\b/i.test(b.value));
    if (pIdx !== -1) {
      attachPracticeContext(answerSection, s, pIdx);
      break;
    }
  }
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

function parseNumberedAnswers(rawAnswer) {
  const matches = Array.from(rawAnswer.matchAll(/(?:^|;\s*)(\d+)\s+([\s\S]*?)(?=;\s*\d+\s+|$)/g));
  return matches.map((match) => ({
    number: Number(match[1]),
    answer: match[2].trim().replace(/[.;]$/, ''),
  }));
}

function getBaseAnswerItems(section) {
  const contentBlocks = section.blocks.filter((b) =>
    ['paragraph', 'bullet', 'numbered'].includes(b.type)
  );
  const rawAnswer = contentBlocks
    .map((b) => b.value)
    .join(' ')
    .trim();
  const numbered = parseNumberedAnswers(rawAnswer);
  if (numbered.length > 0) {
    return numbered;
  }
  return section.blocks
    .filter((b) => ['bullet', 'paragraph'].includes(b.type))
    .map((b, index) => ({ number: index + 1, answer: b.value }));
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
      title: /answer|suggested answer/i.test(section.title) ? 'Check your practice' : section.title,
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
