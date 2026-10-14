import { parseSrt } from '@/utils/parseSrt';
import { buildListeningPreview } from './listeningPreviewData';
import {
  readingExplanationItems,
  validateReadingExplanationInput,
} from '../../../../../supabase/functions/_shared/aiReadingExplanations';

export function makeListeningExplanationInput(sections, selectedSection = null) {
  const { displaySections, questions } = buildListeningPreview(sections);
  const passages = displaySections
    .filter((_, index) => selectedSection == null || index === selectedSection)
    .map((section) => ({
      content:
        section.transcript ||
        parseSrt(section.srt_content || '')
          .map((segment) => segment.text)
          .join('\n'),
      questions: questions
        .filter((q) => q.section === section.section_number)
        .flatMap((q) =>
          readingExplanationItems({
            ...q,
            question_number: q._displayStartNumber,
            gap_fill: q.gap_fill
              ? { ...q.gap_fill, structured_text: q.gap_fill.text || q.gap_fill.content }
              : undefined,
          })
        ),
    }))
    .filter((passage) => passage.questions.length);
  return validateReadingExplanationInput({ action: 'explanations', passages }, 4);
}
export function applyListeningExplanations(sections, explanations) {
  const { questions } = buildListeningPreview(sections);
  const byId = new Map(questions.map((q) => [q.id, q]));
  return sections.map((section, s) => ({
    ...section,
    groups: (section.groups || section.question_groups || []).map((group, g) => ({
      ...group,
      questions: group.questions.map((q, index) => {
        const numbered = byId.get(q.id || `qlp_${s}_${g}_${index}`);
        const entries = Array.from(
          { length: numbered._displaySize },
          (_, offset) => numbered._displayStartNumber + offset
        ).filter((number) => explanations[number]);
        if (!entries.length) return q;
        const data =
          numbered._displaySize === 1
            ? explanations[entries[0]]
            : {
                ...q.explanation_data,
                blanks: {
                  ...q.explanation_data?.blanks,
                  ...Object.fromEntries(entries.map((number) => [number, explanations[number]])),
                },
              };
        return { ...q, explanation_data: data };
      }),
    })),
  }));
}
