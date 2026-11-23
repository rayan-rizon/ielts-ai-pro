export const focusLabel = (focus = '') =>
  ({
    matching: 'Matching information',
    matching_information: 'Matching information',
    matching_headings: 'Matching headings',
    matching_features: 'Matching features',
    true_false_not_given: 'True, False or Not Given',
    yes_no_not_given: 'Yes, No or Not Given',
    multiple_choice: 'Multiple choice',
    multiple_choice_multiple: 'Multiple choice (multiple answers)',
    note_completion: 'Note completion',
    notes_completion: 'Notes completion',
    form_completion: 'Form completion',
    sentence_completion: 'Sentence completion',
    table_completion: 'Table completion',
    flowchart: 'Flow-chart completion',
    map_labeling: 'Plan, map or diagram labelling',
    short_answer: 'Short-answer questions',
    summary_completion: 'Summary completion',
    gap_fill: 'Fill in the gaps',
  })[focus.split(':').pop()] || focus.split(':').pop().replaceAll('_', ' ');

export function groupCategory(group) {
  return group?.category || group?.focus;
}
