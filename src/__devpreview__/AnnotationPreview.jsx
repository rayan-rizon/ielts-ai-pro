import AnnotatedText from '@/components/writing/AnnotatedText';

const TEXT =
  'The two diagrams present information about the composition of library users and their levels of satisfaction with various services. Overall, full-time undergraduates constitute the largest user group (44%), while academic staff are the smallest (7%). In terms of satisfaction, users are most pleased with staff helpfulness (95% very satisfied) and library opening hours (65% very satisfied), whereas journal availability and wi-fi reliability receive the lowest approval ratings. Specifically, among user categories, full-time postgraduates account for 25%, followed by part-time postgraduates (16%) and distance learners (8%). The relatively small proportion of academic staff (7%) contrasts sharply with the dominance of undergraduate students. Regarding satisfaction, the staff’s helpfulness stands out as exceptionally well-regarded, with virtually all users (95%) reporting high satisfaction and none expressing dissatisfaction. Conversely, journal availability elicits the most negative response: only 45% are very satisfied, while 20% are not satisfied - a significantly higher dissatisfaction rate than for any other service. Similarly, wi-fi reliability shows notable discontent (19% not satisfied), despite nearly half (48%) being very satisfied. Book availability receives moderate feedback (50% very satisfied, 10% not satisfied), suggesting room for improvement but less urgency than journals or wi-fi.';

const ANNOTATIONS = [
  {
    originalText:
      'The two diagrams present information about the composition of library users and their levels of satisfaction with various services.',
    type: 'positive',
    severity: 'positive',
    suggestion: '',
    explanation: 'Strong overview sentence that frames both charts.',
  },
  {
    originalText:
      'Overall, full-time undergraduates constitute the largest user group (44%), while academic staff are the smallest (7%). In terms of satisfaction, users are most pleased with staff helpfulness (95% very satisfied) and library opening hours (65% very satisfied), whereas journal availability and wi-fi reliability receive the lowest approval ratings.',
    type: 'style',
    severity: 'warning',
    suggestion: 'Split into two sentences.',
    explanation: 'This sentence is overloaded; split it for readability.',
  },
  {
    originalText:
      'The relatively small proportion of academic staff (7%) contrasts sharply with the dominance of undergraduate students.',
    type: 'positive',
    severity: 'positive',
    suggestion: '',
    explanation: 'Good comparative framing.',
  },
  {
    originalText:
      'virtually all users (95%) reporting high satisfaction and none expressing dissatisfaction.',
    type: 'grammar',
    severity: 'error',
    suggestion: 'virtually all users (95%) reported high satisfaction',
    explanation: 'Participle clause does not agree with the main verb.',
  },
  {
    originalText:
      'Book availability receives moderate feedback (50% very satisfied, 10% not satisfied), suggesting room for improvement but less urgency than journals or wi-fi.',
    type: 'clarity',
    severity: 'suggestion',
    suggestion: 'Tighten this closing sentence.',
    explanation: 'Consider making the comparison more direct.',
  },
];

const VOCAB = [
  {
    original: 'pleased',
    alternatives: ['content', 'gratified'],
    context: 'users are most pleased',
  },
  { original: 'elicits', alternatives: ['provokes', 'generates'], context: 'availability elicits' },
];

export default function AnnotationPreview() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-[#070913]">
      <div className="mx-auto max-w-4xl">
        <AnnotatedText text={TEXT} annotations={ANNOTATIONS} vocabularyEnhancements={VOCAB} />
      </div>
    </div>
  );
}
