import { validateAiReadingInput } from './aiReadingInput.js';
import { validateAiReadingDraft } from './aiReadingValidation.js';
import { aiReadingDraftSections } from './aiReadingDraft.js';
import { validateReadingExplanationInput } from './aiReadingExplanations.js';

const LISTENING_TYPES = new Set([
  'multiple_choice',
  'matching_features',
  'table_completion',
  'flowchart',
  'notes_completion',
  'summary_completion',
  'sentence_completion',
  'short_answer',
]);
export function validateListeningAudioUrls(value = []) {
  if (!Array.isArray(value) || value.length > 4) throw new Error('Provide up to four audio links.');
  return value.map((raw) => {
    const url = String(raw || '').trim();
    if (!url) return '';
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Use a valid HTTPS audio link.');
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
      throw new Error('Use a public HTTPS audio link.');
    return url;
  });
}
export function validateAiListeningInput(body) {
  if (body?.action === 'explanations') return validateReadingExplanationInput(body, 4);
  const input = validateAiReadingInput(body);
  return { ...input, audioUrls: validateListeningAudioUrls(body.audioUrls) };
}
export function validateAiListeningDraft(raw, input) {
  const draft = validateAiReadingDraft(raw, { ...input, maxSections: 4 });
  draft.sections.forEach((section) =>
    section.groups.forEach((group) => {
      if (!LISTENING_TYPES.has(group.type))
        throw new Error(`Unsupported Listening question type: ${group.type}`);
    })
  );
  return draft;
}
const gapTypes = new Set([
  'notes_completion',
  'summary_completion',
  'sentence_completion',
  'short_answer',
]);
function listeningGroupQuestions(group, readingGroup) {
  if (!gapTypes.has(group.type)) return readingGroup.questions;
  const text =
    group.text ||
    group.items
      .map((item) => (/\[\d+\]/.test(item.text) ? item.text : `${item.text} [${item.number}]`))
      .join('\n');
  return [
    {
      ...readingGroup.questions[0],
      type: 'gap_fill',
      correct_answer: '',
      question_count: group.items.length,
      gap_fill: {
        box_title: group.title || '',
        text: text.replace(/\[\d+\]/g, '[gap]'),
        question_count: group.items.length,
        answers: Object.fromEntries(group.items.map((item, index) => [index, item.answer])),
      },
      explanation_data: {
        blanks: Object.fromEntries(group.items.map((item) => [item.number, item.explanation])),
      },
    },
  ];
}
export function aiListeningDraftSections(draft, audioUrls = []) {
  const reading = aiReadingDraftSections(draft);
  return draft.sections.map((section, index) => ({
    section_number: index + 1,
    title: section.title,
    audio_url: audioUrls[index] || '',
    transcript: section.content,
    srt_content: '',
    transcript_highlights: (section.highlights || []).map((highlight) => ({
      phrase: highlight.text,
      question_numbers: highlight.question_numbers,
    })),
    question_groups: section.groups.map((group, g) => ({
      ...reading[index].question_groups[g],
      questions: listeningGroupQuestions(group, reading[index].question_groups[g]),
    })),
  }));
}
