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
};

export function getBlogCoverAlt(article) {
  return (
    COVER_ALT_BY_SLUG[article?.slug] ||
    `${article?.category || 'IELTS'} practice guide: learner studying with a laptop and notebook`
  );
}
