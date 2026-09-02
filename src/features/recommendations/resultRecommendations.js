import { normalizeSpeakingDeepDive } from '@/features/testing/speaking/utils/speakingDeepDive';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RESULT_AGE_DAYS = 180;
const MAX_RECOMMENDATIONS = 3;
const MIN_RECOMMENDATION_SCORE = 0.42;

const GRAMMAR_RULES = [
  {
    slug: 'subject-verb-agreement',
    label: 'subject–verb agreement',
    patterns: [
      /subject[- ]verb agreement/i,
      /agreement (?:error|between|with)/i,
      /singular (?:subject|verb)/i,
      /plural (?:subject|verb)/i,
    ],
  },
  {
    slug: 'articles-a-an-the-and-zero',
    label: 'article use',
    patterns: [/\barticles?\b/i, /definite article/i, /indefinite article/i, /zero article/i],
  },
  {
    slug: 'nouns-countability-and-quantity',
    label: 'countability and quantity',
    patterns: [/countable/i, /uncountable/i, /quantifier/i, /quantity word/i, /mass noun/i],
  },
  {
    slug: 'essential-tense-control',
    label: 'tense control',
    patterns: [/\btense(?:s)?\b/i, /past simple/i, /present perfect/i, /time reference/i],
  },
  {
    slug: 'gerunds-and-infinitives',
    label: 'gerunds and infinitives',
    patterns: [/gerund/i, /infinitive/i, /verb pattern/i],
  },
  {
    slug: 'modal-verbs-and-claim-strength',
    label: 'modal verbs',
    patterns: [/modal verb/i, /\bmodal\b/i, /claim strength/i],
  },
  {
    slug: 'passive-voice',
    label: 'passive voice',
    patterns: [/passive voice/i, /active voice/i],
  },
  {
    slug: 'reported-views-and-reporting-verbs',
    label: 'reported views',
    patterns: [/reported speech/i, /reporting verb/i, /reported view/i],
  },
  {
    slug: 'conditionals',
    label: 'conditionals',
    patterns: [/conditional/i, /if[- ]clause/i],
  },
  {
    slug: 'relative-clauses',
    label: 'relative clauses',
    patterns: [/relative clause/i, /relative pronoun/i],
  },
  {
    slug: 'subordination-and-logical-relationships',
    label: 'clause relationships',
    patterns: [/subordinat/i, /dependent clause/i, /logical relationship/i],
  },
  {
    slug: 'coordination-and-parallel-structure',
    label: 'parallel structure',
    patterns: [/parallel structure/i, /parallelism/i, /coordination/i],
  },
  {
    slug: 'pronouns-and-reference',
    label: 'pronoun reference',
    patterns: [/pronoun reference/i, /unclear reference/i, /antecedent/i],
  },
  {
    slug: 'participle-clauses',
    label: 'participle clauses',
    patterns: [/participle clause/i, /dangling modifier/i, /misplaced modifier/i],
  },
  {
    slug: 'hedging-and-precision',
    label: 'hedging and precision',
    patterns: [/\bhedg(?:e|ing)\b/i, /unsupported certainty/i, /overgeneral/i],
  },
  {
    slug: 'punctuation-for-grammar-accuracy',
    label: 'punctuation',
    patterns: [/punctuation/i, /comma splice/i, /semicolon/i, /apostrophe/i],
  },
  {
    slug: 'complete-sentences-and-clauses',
    label: 'sentence boundaries',
    patterns: [/sentence fragment/i, /run-on/i, /sentence boundary/i, /incomplete sentence/i],
  },
];

const READING_TYPE_RULES = [
  {
    slug: 'ielts-reading-author-attitude-and-evaluation',
    label: 'author attitude and evaluation',
    patterns: [/yes.*no.*not given/i, /writer(?:'s)? (?:view|claim)/i, /author attitude/i],
  },
  {
    slug: 'ielts-reading-argument-and-evidence',
    label: 'argument and evidence',
    patterns: [
      /matching heading/i,
      /main idea/i,
      /matching information/i,
      /true.*false.*not given/i,
    ],
  },
  {
    slug: 'ielts-reading-cause-effect-and-relationships',
    label: 'cause and relationships',
    patterns: [/cause/i, /effect/i, /relationship/i],
  },
  {
    slug: 'ielts-reading-change-quantity-and-comparison',
    label: 'change and comparison',
    patterns: [/table completion/i, /diagram/i, /quantity/i, /comparison/i],
  },
];

const TOPIC_RULES = [
  [
    'education-vocabulary-for-ielts',
    /\b(?:education|school|student|teacher|university|learning)\b/i,
  ],
  [
    'environment-vocabulary-for-ielts',
    /\b(?:environment|climate|pollution|wildlife|energy|sustainab)\w*/i,
  ],
  [
    'technology-vocabulary-for-ielts',
    /\b(?:technology|digital|internet|robot|automation|artificial intelligence)\b/i,
  ],
  [
    'health-and-medicine-vocabulary-for-ielts',
    /\b(?:health|medicine|medical|hospital|disease|well-being)\b/i,
  ],
  [
    'work-and-employment-vocabulary-for-ielts',
    /\b(?:work|job|employment|career|workplace|labour)\b/i,
  ],
  ['crime-and-law-vocabulary-for-ielts', /\b(?:crime|criminal|law|justice|prison|police)\b/i],
  [
    'government-and-politics-vocabulary-for-ielts',
    /\b(?:government|politic|election|public policy|democracy)\w*/i,
  ],
  [
    'media-and-information-vocabulary-for-ielts',
    /\b(?:media|news|journalism|information|advertising)\b/i,
  ],
  [
    'travel-and-tourism-vocabulary-for-ielts',
    /\b(?:travel|tourism|tourist|holiday|destination)\b/i,
  ],
  [
    'cities-and-urbanisation-vocabulary-for-ielts',
    /\b(?:cities|city|urban|housing|traffic|transport)\b/i,
  ],
  [
    'globalisation-and-culture-vocabulary-for-ielts',
    /\b(?:globalisation|globalization|culture|identity|tradition)\b/i,
  ],
  [
    'art-heritage-and-creativity-vocabulary-for-ielts',
    /\b(?:art|heritage|museum|theatre|music|creative)\w*/i,
  ],
  [
    'family-and-society-vocabulary-for-ielts',
    /\b(?:family|society|social|parent|child|generation)\b/i,
  ],
  [
    'economy-and-business-vocabulary-for-ielts',
    /\b(?:economy|economic|business|market|finance|income)\b/i,
  ],
  [
    'science-and-space-vocabulary-for-ielts',
    /\b(?:science|scientific|research|space|planet|astronomy)\b/i,
  ],
  ['sport-and-leisure-vocabulary-for-ielts', /\b(?:sport|exercise|leisure|athlete|game)\b/i],
];

const WRITING_FOCUS_RULES = [
  [
    'ielts-writing-cohesion-and-precise-qualification',
    /\b(?:cohesion|transition|linking|qualification)\b/i,
  ],
  ['ielts-writing-analysis-cause-and-consequence', /\b(?:analysis|cause|consequence|effect)\b/i],
  [
    'ielts-writing-evaluation-and-recommendations',
    /\b(?:evaluate|evaluation|recommendation|solution)\b/i,
  ],
  [
    'ielts-writing-introducing-and-framing-an-argument',
    /\b(?:argument|thesis|position|introduction)\b/i,
  ],
];

const SPEAKING_FOCUS_RULES = [
  [
    'ielts-speaking-agreeing-disagreeing-and-balancing',
    /\b(?:agree|disagree|balance|counterpoint)\w*/i,
  ],
  ['ielts-speaking-fluency-explanation-and-examples', /\b(?:explain|example|develop|extend)\w*/i],
  [
    'ielts-speaking-describing-people-experiences-and-change',
    /\b(?:describe|experience|change|person|people)\w*/i,
  ],
  ['ielts-speaking-giving-and-developing-opinions', /\b(?:opinion|viewpoint|view)\b/i],
];

const UNIVERSAL_VOCABULARY_SLUG =
  'high-value-academic-verbs-usable-in-every-topic-vocabulary-for-ielts';
const PARAPHRASE_VOCABULARY_SLUG =
  'paraphrase-bank-avoid-repetition-penalties-vocabulary-for-ielts';

function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizedType(session) {
  return String(session?.test_type || session?.module || '')
    .trim()
    .toLowerCase();
}

function completionTime(session) {
  const timestamp = new Date(session?.completed_at || session?.evaluated_at || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function recencyWeight(timestamp, now) {
  const ageDays = Math.max(0, (now - timestamp) / DAY_MS);
  return Math.max(0.25, Math.exp(-ageDays / 90));
}

function isReliableSession(session, now) {
  if (!session?.is_completed) return false;
  if (
    ['writing', 'speaking'].includes(normalizedType(session)) &&
    session.evaluation_status !== 'complete'
  ) {
    return false;
  }
  const timestamp = completionTime(session);
  if (!timestamp || timestamp > now + DAY_MS) return false;
  return now - timestamp <= MAX_RESULT_AGE_DAYS * DAY_MS;
}

function criterionValue(content, criterion) {
  const sources = [content?.criteriaScores, content?.finalEvaluation];
  const keys =
    criterion === 'grammar'
      ? ['grammar', 'GrammaticalRangeAndAccuracy', 'Grammatical Range & Accuracy', 'GRA']
      : ['lexicalResource', 'lexical', 'LexicalResource', 'Lexical Resource', 'LR'];

  for (const source of sources) {
    for (const key of keys) {
      const value = numeric(source?.[key]);
      if (value !== null && value >= 0 && value <= 9) return value;
    }
  }
  return null;
}

function collectStrings(value, output = [], depth = 0) {
  if (depth > 4 || value == null) return output;
  if (typeof value === 'string') {
    if (value.trim()) output.push(value.trim());
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output, depth + 1));
    return output;
  }
  if (typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, output, depth + 1));
  }
  return output;
}

function writingFeedbacks(content) {
  const feedbacks = content?.ai_feedbacks;
  return feedbacks && typeof feedbacks === 'object' ? Object.values(feedbacks).filter(Boolean) : [];
}

function lexicalEvidenceText(content, testType) {
  if (testType === 'writing') {
    return writingFeedbacks(content)
      .flatMap((feedback) => [
        ...(feedback.annotations || []).filter((item) => item?.type === 'vocabulary'),
        ...(feedback.priorities || []).filter((item) =>
          /lexical|vocab/i.test(item?.criterion || '')
        ),
        ...(feedback.vocabularyEnhancements || []),
      ])
      .flatMap((item) => collectStrings(item))
      .join(' ');
  }

  return [
    content?.finalEvaluation?.criterionNotes?.lexical,
    ...(content?.finalEvaluation?.improvements || []).filter((item) =>
      /lexical|vocab/i.test(`${item?.criterion || ''} ${item?.area || ''}`)
    ),
  ]
    .flatMap((item) => collectStrings(item))
    .join(' ');
}

function grammarEvidenceRecords(content, testType) {
  if (testType === 'writing') {
    return writingFeedbacks(content).flatMap((feedback) => [
      ...(feedback.annotations || []).filter((item) => item?.type === 'grammar'),
      ...(feedback.priorities || []).filter((item) => /grammar/i.test(item?.criterion || '')),
    ]);
  }

  const detailedErrors = (normalizeSpeakingDeepDive(content?.detailedFeedback) || []).flatMap(
    (item) => (Array.isArray(item.grammaticalErrors) ? item.grammaticalErrors : [])
  );
  return [
    ...detailedErrors,
    ...(content?.finalEvaluation?.improvements || []).filter((item) =>
      /grammar/i.test(`${item?.criterion || ''} ${item?.area || ''}`)
    ),
  ];
}

function classifyGrammarRecord(record) {
  const text = collectStrings(record).join(' ');
  const matches = GRAMMAR_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(text))
  ).map((rule) => ({ slug: rule.slug, label: rule.label }));
  if (matches.length) return matches;

  const original = String(record?.originalText || record?.original || record?.error || '');
  const suggestion = String(record?.suggestion || record?.correction || record?.corrected || '');
  if (!original || !suggestion) return [];

  const beforeArticles = original.match(/\b(?:a|an|the)\b/gi)?.length || 0;
  const afterArticles = suggestion.match(/\b(?:a|an|the)\b/gi)?.length || 0;
  if (beforeArticles !== afterArticles) {
    return [{ slug: 'articles-a-an-the-and-zero', label: 'article use' }];
  }

  const agreementChange =
    /\b(?:is|was|has)\b/i.test(original) && /\b(?:are|were|have)\b/i.test(suggestion);
  const reverseAgreementChange =
    /\b(?:are|were|have)\b/i.test(original) && /\b(?:is|was|has)\b/i.test(suggestion);
  if (agreementChange || reverseAgreementChange) {
    return [{ slug: 'subject-verb-agreement', label: 'subject–verb agreement' }];
  }

  return [];
}

function passageText(session) {
  const passage = Array.isArray(session?.passage) ? session.passage[0] : session?.passage;
  return [
    passage?.title,
    passage?.cambridge_title,
    session?.content_data?.title,
    session?.content_data?.topic,
    session?.content_data?.testTitle,
  ]
    .filter(Boolean)
    .join(' ');
}

function weakestQuestionType(typeStats) {
  return Object.entries(typeStats || {})
    .map(([type, stats]) => {
      const total = numeric(stats?.total) || 0;
      const correct = numeric(stats?.correct) || 0;
      return { type, total, accuracy: total > 0 ? correct / total : 1 };
    })
    .filter((item) => item.total >= 2 && item.accuracy < 0.75)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)[0];
}

function firstRuleMatch(text, rules) {
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || null;
}

function addCandidate(map, { slug, score, reason, timestamp, source }) {
  if (!slug || !Number.isFinite(score) || score <= 0) return;
  const current = map.get(slug) || {
    slug,
    score: 0,
    evidenceCount: 0,
    latestAt: 0,
    reason: '',
    strongestSignal: 0,
    sources: new Set(),
  };
  current.score += score;
  current.evidenceCount += 1;
  current.latestAt = Math.max(current.latestAt, timestamp || 0);
  current.sources.add(source);
  if (score > current.strongestSignal) {
    current.strongestSignal = score;
    current.reason = reason;
  }
  map.set(slug, current);
}

function finalizeCandidates(map, completed, catalogSlugs) {
  return [...map.values()]
    .filter(
      (item) =>
        item.score >= MIN_RECOMMENDATION_SCORE &&
        !completed.has(item.slug) &&
        catalogSlugs.has(item.slug)
    )
    .sort(
      (a, b) =>
        b.score - a.score || b.evidenceCount - a.evidenceCount || a.slug.localeCompare(b.slug)
    )
    .slice(0, MAX_RECOMMENDATIONS)
    .map((item) => ({
      slug: item.slug,
      reason: item.reason,
      evidenceCount: item.evidenceCount,
      confidence:
        item.evidenceCount >= 2 || item.score >= 1.35
          ? 'high'
          : item.score >= 0.7
            ? 'medium'
            : 'early',
      sources: [...item.sources].sort(),
    }));
}

function addGrammarSkillEvidence(map, grammarSkills, completedSlugs, grammarGuides, now) {
  const guidesBySkill = new Map();
  grammarGuides.forEach((guide) => {
    const guides = guidesBySkill.get(guide.skill_code) || [];
    guides.push(guide);
    guidesBySkill.set(guide.skill_code, guides);
  });

  (grammarSkills || [])
    .filter((skill) => Number(skill?.observations || 0) > 0 && numeric(skill?.mastery) !== null)
    .filter((skill) => Number(skill.mastery) < 0.75)
    .sort(
      (a, b) =>
        Number(a.mastery) - Number(b.mastery) ||
        Number(b.observations || 0) - Number(a.observations || 0)
    )
    .forEach((skill) => {
      const nextGuide = (guidesBySkill.get(skill.skillCode) || []).find(
        (guide) => !completedSlugs.has(guide.slug)
      );
      if (!nextGuide) return;
      const observations = Number(skill.observations || 0);
      const evidenceWeight = skill.evidenceClass === 'measured' ? 1 : 0.72;
      const calculatedScore =
        (0.75 - Number(skill.mastery)) * 1.8 * evidenceWeight + Math.min(observations, 8) * 0.055;
      // This is direct, skill-level evidence from the Grammar Lab. Once the existing
      // weak-skill rule accepts it (< 75% mastery with at least one observation), it
      // must clear the display threshold as well; otherwise a guide can move to the
      // top of the list without receiving its visible recommendation badge.
      const score = Math.max(MIN_RECOMMENDATION_SCORE, calculatedScore);
      addCandidate(map, {
        slug: nextGuide.slug,
        score,
        reason: `Your Grammar Lab result shows ${Math.round(Number(skill.mastery) * 100)}% mastery in ${String(skill.label || nextGuide.kit).toLowerCase()}.`,
        timestamp: now,
        source: 'grammar-lab',
      });
    });
}

function targetVocabularySlug(targetBand) {
  const target = numeric(targetBand);
  if (target === null || target < 6.5) return null;
  const rounded = target <= 7 ? 7 : target <= 8 ? 8 : 9;
  return `band-${rounded}-vocabulary-builder`;
}

function addSessionEvidence({ session, targetBand, grammarMap, vocabularyMap, now }) {
  const testType = normalizedType(session);
  const timestamp = completionTime(session);
  const recent = recencyWeight(timestamp, now);
  const content = session.content_data || {};
  const target = numeric(targetBand);
  const grammar = criterionValue(content, 'grammar');
  const lexical = criterionValue(content, 'lexical');
  const overall = numeric(session.band_score) ?? numeric(session.score);
  const reliableEvaluation = !['writing', 'speaking'].includes(testType)
    ? true
    : session.evaluation_status === 'complete';

  if (reliableEvaluation && grammar !== null && target !== null && grammar < target - 0.24) {
    const gapWeight = 0.65 + clamp((target - grammar) / 2.5);
    grammarEvidenceRecords(content, testType).forEach((record) => {
      classifyGrammarRecord(record).forEach((match) => {
        addCandidate(grammarMap, {
          slug: match.slug,
          score: recent * gapWeight,
          reason: `Your ${testType} feedback flagged ${match.label}.`,
          timestamp,
          source: testType,
        });
      });
    });
  }

  let hasVocabularyGap = false;
  if (reliableEvaluation && lexical !== null && target !== null && lexical < target - 0.24) {
    hasVocabularyGap = true;
    const gapWeight = 0.55 + clamp((target - lexical) / 2.5);
    const reason = `Your ${testType} Lexical Resource is Band ${lexical.toFixed(1)} against a Band ${target.toFixed(1)} target.`;
    addCandidate(vocabularyMap, {
      slug: targetVocabularySlug(target),
      score: recent * gapWeight,
      reason,
      timestamp,
      source: testType,
    });

    const evidenceText = lexicalEvidenceText(content, testType);
    const repetitionSignal = /\b(?:repeat|repetition|paraphras)\w*/i.test(evidenceText);
    const focusSlug = repetitionSignal
      ? PARAPHRASE_VOCABULARY_SLUG
      : testType === 'writing'
        ? firstRuleMatch(evidenceText, WRITING_FOCUS_RULES) || UNIVERSAL_VOCABULARY_SLUG
        : firstRuleMatch(evidenceText, SPEAKING_FOCUS_RULES) ||
          'ielts-speaking-fluency-explanation-and-examples';
    addCandidate(vocabularyMap, {
      slug: focusSlug,
      score: recent * gapWeight * 0.88,
      reason: repetitionSignal
        ? `Your ${testType} feedback identified repetition or paraphrasing as a priority.`
        : reason,
      timestamp,
      source: testType,
    });
  }

  if (testType === 'reading' && target !== null && overall !== null && overall < target - 0.49) {
    hasVocabularyGap = true;
    const weakType = weakestQuestionType(content.typeStats);
    const matchedRule = weakType
      ? READING_TYPE_RULES.find((rule) =>
          rule.patterns.some((pattern) => pattern.test(weakType.type))
        )
      : null;
    if (matchedRule) {
      addCandidate(vocabularyMap, {
        slug: matchedRule.slug,
        score: recent * (0.65 + clamp((target - overall) / 3)),
        reason: `Your Reading result was weakest in ${weakType.type}; this kit builds ${matchedRule.label} language.`,
        timestamp,
        source: 'reading',
      });
    }
    addCandidate(vocabularyMap, {
      slug: targetVocabularySlug(target),
      score: recent * (0.55 + clamp((target - overall) / 3)),
      reason: `Your Reading result is Band ${overall.toFixed(1)} against a Band ${target.toFixed(1)} target.`,
      timestamp,
      source: 'reading',
    });
  }

  if (testType === 'listening' && target !== null && overall !== null && overall < target - 0.49) {
    hasVocabularyGap = true;
    addCandidate(vocabularyMap, {
      slug: targetVocabularySlug(target),
      score: recent * (0.5 + clamp((target - overall) / 3)),
      reason: `Your Listening result is Band ${overall.toFixed(1)} against a Band ${target.toFixed(1)} target.`,
      timestamp,
      source: 'listening',
    });
  }

  if (hasVocabularyGap) {
    const topicSlug = firstRuleMatch(passageText(session), TOPIC_RULES);
    if (topicSlug) {
      addCandidate(vocabularyMap, {
        slug: topicSlug,
        score: recent * 0.62,
        reason: `This topic appeared in a recent ${testType} result.`,
        timestamp,
        source: testType,
      });
    }
  }
}

export function buildResultRecommendations({
  sessions = [],
  targetBand,
  grammarSkills = [],
  completedGrammarSlugs = [],
  completedVocabularySlugs = [],
  grammarGuides = [],
  vocabularyKits = [],
  now = Date.now(),
} = {}) {
  const completedGrammar = new Set(completedGrammarSlugs);
  const completedVocabulary = new Set(completedVocabularySlugs);
  const grammarMap = new Map();
  const vocabularyMap = new Map();
  const reliableSessions = (Array.isArray(sessions) ? sessions : [])
    .filter((session) => isReliableSession(session, now))
    .sort((a, b) => completionTime(b) - completionTime(a))
    .slice(0, 12);

  addGrammarSkillEvidence(grammarMap, grammarSkills, completedGrammar, grammarGuides, now);
  reliableSessions.forEach((session) =>
    addSessionEvidence({ session, targetBand, grammarMap, vocabularyMap, now })
  );

  return {
    grammar: finalizeCandidates(
      grammarMap,
      completedGrammar,
      new Set(grammarGuides.map((guide) => guide.slug))
    ),
    vocabulary: finalizeCandidates(
      vocabularyMap,
      completedVocabulary,
      new Set(vocabularyKits.map((kit) => kit.slug))
    ),
    evidence: {
      resultCount: reliableSessions.length,
      latestCompletedAt: reliableSessions[0]?.completed_at || null,
      hasResultEvidence: reliableSessions.length > 0,
    },
  };
}

export const RESULT_RECOMMENDATION_LIMITS = {
  maxAgeDays: MAX_RESULT_AGE_DAYS,
  maxRecommendations: MAX_RECOMMENDATIONS,
};
