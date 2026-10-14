export function savedPreviewData(test, questions) {
  let content;
  try {
    content = typeof test.content === 'string' ? JSON.parse(test.content) : test.content;
  } catch {
    content = null;
  }
  if (test.test_type === 'writing') {
    const tasks = { 'Task 1': { prompt: '' }, 'Task 2': { prompt: '' } };
    if (content?.['Task 1'] || content?.['Task 2']) return { tasks: { ...tasks, ...content } };
    tasks[test.task_type || 'Task 1'] =
      content && typeof content === 'object' ? content : { prompt: test.content || '' };
    return { tasks };
  }
  if (test.test_type === 'speaking') {
    return {
      parts: [...questions]
        .sort((a, b) => a.question_number - b.question_number)
        .map((q) => ({
          id: q.id,
          part_number: q.question_number,
          title: q.question_text,
          prompt: q.correct_answer || '',
          content: q.content || '',
          duration_minutes: q.table_data?.duration_minutes || 5,
        })),
    };
  }
  const sections =
    Array.isArray(content) && content.length
      ? content
      : [{ title: test.title, content: test.content || '', audio_url: test.audio_url }];
  return {
    sections: sections.map((section, index) => {
      // Stored question rows are authoritative, including older tests whose
      // passage JSON does not contain embedded question groups.
      const rows = questions
        .filter((q) => Number(q.section || 1) === index + 1)
        .sort((a, b) => a.question_number - b.question_number);
      const groups = [];
      for (const q of rows) {
        const previous = groups.at(-1);
        if (previous && previous.instructions === (q.group_instructions || '') && !q.mcq_title)
          previous.questions.push(q);
        else
          groups.push({
            instructions: q.group_instructions || '',
            title: q.mcq_title || '',
            questions: [q],
          });
      }
      return {
        ...section,
        groups: rows.length ? groups : section.groups || section.question_groups || [],
      };
    }),
  };
}
