export const BLOG_COVER_WIDTH = 1200;
export const BLOG_COVER_HEIGHT = 675;

const COVER_ALT_BY_SLUG = {
  'ielts-writing-coherence-cohesion-band-7':
    'IELTS learner reviewing an essay with connected paragraph notes on a bright study desk',
  'ielts-speaking-band-7-to-8-grammar-vocabulary':
    'IELTS learner recording a speaking answer beside colour-coded grammar and vocabulary notes',
  'ielts-mock-test-score-readiness-checklist':
    'IELTS learner comparing three mock-test result sheets with a timer on a bright desk',
};

export function getBlogCoverAlt(article) {
  return (
    COVER_ALT_BY_SLUG[article?.slug] ||
    `${article?.category || 'IELTS'} practice guide: learner studying with a laptop and notebook`
  );
}
