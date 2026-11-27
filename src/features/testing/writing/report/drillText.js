import { paragraphName } from './components/paragraphName';

const LINK_FOR = { '/grammar': 'drillGrammarStart', '/vocabulary': 'drillVocabularyStart' };

const WORDING = {
  rewrite: (t, drill) => ({
    title: t('drillRewrite', { paragraph: paragraphName(t, drill.paragraph) }),
    why: t('drillRewriteWhy', { count: drill.count }),
  }),
  grammar: (t, drill) => ({
    title: t('drillGrammar'),
    why: t('drillGrammarWhy', { count: drill.count, total: drill.total }),
  }),
  vocabulary: (t) => ({ title: t('drillVocabulary'), why: t('drillVocabularyWhy') }),
  words: (t, drill) => ({
    title: t('drillWords'),
    why: t('drillWordsWhy', { count: drill.count }),
  }),
  criterion: (t, drill) => ({
    title: t('drillCriterion', { criterion: drill.criterion }),
    why: t('drillCriterionWhy', { score: Number(drill.score).toFixed(1) }),
  }),
};

/** A drill's title, reason and link label, shared by the screen and the PDF. */
export function drillText(t, drill) {
  const link = LINK_FOR[drill.to];
  return { ...WORDING[drill.id](t, drill), link: link ? t(link) : null };
}
