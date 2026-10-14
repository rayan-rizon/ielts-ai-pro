import { validateReadingExplanationInput } from './aiReadingExplanations.js';
export const AI_READING_LIMITS = {
  images: 8,
  imageBytes: 1024 * 1024,
  totalImageBytes: 6 * 1024 * 1024,
  bodyBytes: 9 * 1024 * 1024,
  textCharacters: 60000,
};

// Require a numbered answer on each line. Do not silently truncate alternatives,
// dates or numeric answers, or skip repeated/out-of-order question numbers.
export function parseAiReadingAnswers(text) {
  /** @type {Record<string, string>} */
  const answers = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*(\d{1,2})\s*(?:[.):-]\s*|\s+)(.+?)\s*$/);
    if (!match) throw new Error('Use one numbered answer per line, for example: 1. TRUE');
    const number = Number(match[1]);
    if (number < 1 || number > 40 || answers[number]) {
      throw new Error(`Invalid or repeated answer number: ${number}`);
    }
    answers[number] = match[2].trim();
  }
  return answers;
}

export function validateAiReadingInput(body) {
  if (body?.action === 'explanations') return validateReadingExplanationInput(body);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Provide passage, questions and an answer key.');
  }
  const expectedQuestions = Number(body.expectedQuestions);
  if (!Number.isInteger(expectedQuestions) || expectedQuestions < 1 || expectedQuestions > 40) {
    throw new Error('Expected questions must be between 1 and 40.');
  }
  /** @type {{ passageText: string, questionText: string, answerText: string }} */
  const texts = {};
  for (const field of ['passageText', 'questionText', 'answerText']) {
    if (body[field] != null && typeof body[field] !== 'string') {
      throw new Error(`Invalid ${field}.`);
    }
    texts[field] = (body[field] || '').trim();
  }
  if (Object.values(texts).join('').length > AI_READING_LIMITS.textCharacters) {
    throw new Error('Text is too long. Import one Reading test at a time.');
  }
  const images = body.images || [];
  if (!Array.isArray(images) || images.length > AI_READING_LIMITS.images) {
    throw new Error('Upload up to eight screenshots.');
  }
  let totalBytes = 0;
  const cleanImages = images.map((image) => {
    if (!image || !['passage', 'questions', 'answers'].includes(image.role)) {
      throw new Error('Choose whether each screenshot contains a passage, questions or answers.');
    }
    const match = String(image.dataUrl || '').match(
      /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/
    );
    if (!match || match[2].length % 4 !== 0) throw new Error('Use PNG, JPEG or WebP screenshots.');
    const bytes = (match[2].length * 3) / 4 - (match[2].match(/=+$/)?.[0].length || 0);
    const prefixes = { png: 'iVBORw0KGgo', jpeg: '/9j/', webp: 'UklGR' };
    if (!match[2].startsWith(prefixes[match[1]]) || bytes > AI_READING_LIMITS.imageBytes) {
      throw new Error('A screenshot is invalid or too large.');
    }
    totalBytes += bytes;
    const sectionNumber = image.sectionNumber == null ? null : Number(image.sectionNumber);
    if (
      sectionNumber != null &&
      (!Number.isInteger(sectionNumber) || sectionNumber < 1 || sectionNumber > 3)
    )
      throw new Error('Invalid screenshot passage.');
    return { role: image.role, dataUrl: image.dataUrl, sectionNumber };
  });
  if (totalBytes > AI_READING_LIMITS.totalImageBytes) throw new Error('Screenshots are too large.');
  for (const [field, role] of [
    ['passageText', 'passage'],
    ['questionText', 'questions'],
    ['answerText', 'answers'],
  ]) {
    if (!texts[field] && !cleanImages.some((image) => image.role === role)) {
      throw new Error(`Provide ${role} as text or screenshots.`);
    }
  }
  const suppliedAnswers = parseAiReadingAnswers(texts.answerText);
  if (texts.answerText && !cleanImages.some((image) => image.role === 'answers')) {
    if (Object.keys(suppliedAnswers).length !== expectedQuestions) {
      throw new Error('The answer key must cover every expected question.');
    }
    for (let n = 1; n <= expectedQuestions; n++) {
      if (!suppliedAnswers[n]) throw new Error(`The answer key is missing Q${n}.`);
    }
  }
  const sectionCounts = body.sectionCounts || [];
  if (!Array.isArray(sectionCounts) || sectionCounts.length > 3)
    throw new Error('Invalid passage question counts.');
  if (sectionCounts.length) {
    if (sectionCounts.some((count) => !Number.isInteger(count) || count < 1 || count > 40))
      throw new Error('Invalid passage question count.');
    if (sectionCounts.reduce((sum, count) => sum + count, 0) !== expectedQuestions)
      throw new Error('Passage counts do not match total questions.');
  }
  return { ...texts, expectedQuestions, images: cleanImages, suppliedAnswers, sectionCounts };
}
