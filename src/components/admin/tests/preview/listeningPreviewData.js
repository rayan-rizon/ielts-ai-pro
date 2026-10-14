import { computeQuestionNumbers } from '@/features/testing/listening/components/ListeningTest/utils/questionProcessing';
export function buildListeningPreview(sections) {
  const snapshot = structuredClone(sections);
  const displaySections = snapshot.map((section, index) => ({
    ...section,
    section_number: index + 1,
  }));
  let number = 1;
  const questions = displaySections.flatMap((section, s) =>
    (section.groups || section.question_groups || []).flatMap((group, g) =>
      (group.questions || []).map((question, q) => {
        const result = {
          ...question,
          id: question.id || `qlp_${s}_${g}_${q}`,
          section: s + 1,
          group_instructions: group.instructions || '',
          question_number: number++,
        };
        if (q === 0 && group.title) result.mcq_title = group.title;
        return result;
      })
    )
  );
  return { displaySections, questions: computeQuestionNumbers(questions) };
}
