export const BLOG_COVER_WIDTH = 1200;
export const BLOG_COVER_HEIGHT = 675;

const COVER_ALT_BY_SLUG = {
  'ielts-writing-coherence-cohesion-band-7':
    'IELTS learner reviewing an essay with connected paragraph notes on a bright study desk',
  'ielts-speaking-band-7-to-8-grammar-vocabulary':
    'IELTS learner recording a speaking answer beside colour-coded grammar and vocabulary notes',
  'ielts-mock-test-score-readiness-checklist':
    'IELTS learner comparing three mock-test result sheets with a timer on a bright desk',
  'ielts-writing-task-2-stay-on-topic':
    'IELTS learner checking an essay outline with arrows and paragraph boxes beside a laptop',
  'ielts-reading-band-6-5-error-log':
    'IELTS learner comparing a reading passage with a colour-coded error log on a bright desk',
  'ielts-listening-missed-answer-recovery':
    'IELTS learner using headphones and a skipped-question sequence to practise listening recovery',
  'ielts-speaking-part-3-stop-rambling':
    'IELTS learner practising a clear Part 3 answer with a microphone and sequenced prompt cards',
  'ielts-listening-spelling-plurals-word-limits':
    'IELTS learner typing a Listening answer while using headphones and an accuracy checklist',
  'ielts-reading-paraphrase-traps':
    'IELTS learner matching highlighted paraphrases between a reading passage and a laptop',
  'cambridge-ielts-21-academic-2026-practice-tests':
    'Cambridge IELTS 21 Academic 2026 title above a learner planning four practice sets',
  'ielts-listening-multiple-choice-part-3':
    'IELTS learner tracking two speakers and multiple-choice decisions with headphones',
  'ielts-writing-task-1-overview-key-features':
    'IELTS learner selecting key trends from charts before writing a Task 1 overview',
  'ielts-overall-band-score-rounding-calculator':
    'IELTS learner comparing four skill score cards with a calculator on a bright study desk',
  'ielts-writing-task-2-examples':
    'IELTS learner planning a Task 2 paragraph from an idea through explanation to an example',
  'ai-ielts-speaking-score-accuracy':
    'IELTS learner recording a speaking answer while reviewing four AI feedback indicators',
};

export function getBlogCoverAlt(article) {
  return (
    COVER_ALT_BY_SLUG[article?.slug] ||
    `${article?.category || 'IELTS'} practice guide: learner studying with a laptop and notebook`
  );
}
