export const focusLabel = (focus = '') =>
  ({
    matching: 'Matching information',
    matching_information: 'Matching information',
    matching_headings: 'Matching headings',
    matching_features: 'Matching features',
    true_false_not_given: 'True, False or Not Given',
    yes_no_not_given: 'Yes, No or Not Given',
    multiple_choice: 'Multiple choice',
    summary_completion: 'Summary completion',
    gap_fill: 'Fill in the gaps',
  })[focus.split(':').pop()] || focus.split(':').pop().replaceAll('_', ' ');
