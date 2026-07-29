import skillsVocabularyMarkdown from '../../../../IELTS Vocabulary for Speaking, Reading & Writing .md?raw';
import masterVocabularyMarkdown from '../../../../IELTS Vocabulary Master List .md?raw';

const CREATED_AT = '2026-07-29T00:00:00.000Z';

export const FREE_VOCABULARY_KIT_SLUGS = new Set([
  'ielts-speaking-giving-and-developing-opinions',
  'ielts-reading-argument-and-evidence',
  'ielts-writing-introducing-and-framing-an-argument',
  'education-vocabulary-for-ielts',
  'environment-vocabulary-for-ielts',
]);

export function getVocabularyKitAccessTier({ slug, category, title }) {
  if (FREE_VOCABULARY_KIT_SLUGS.has(slug)) return 'free';
  if (category === 'Vocabulary by target band') {
    return /Band [89]\b/i.test(title) ? 'premium' : 'pro';
  }
  if (category === 'Topic vocabulary') return 'premium';
  return 'pro';
}

const cleanCell = (value = '') =>
  value
    .trim()
    .replace(/^\*+|\*+$/g, '')
    .replace(/`/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const splitRow = (line) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cleanCell);

const isDividerRow = (line) =>
  splitRow(line).every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')));

function tableWords(lines) {
  const rows = lines.filter((line) => line.trim().startsWith('|'));
  if (rows.length < 3) return [];

  const headers = splitRow(rows[0]).map((header) => header.toLowerCase());
  const dataRows = rows.slice(isDividerRow(rows[1]) ? 2 : 1);
  const meaningIndex = headers.findIndex((header) =>
    ['meaning', 'function', 'precise meaning', 'correct distinction'].includes(header)
  );
  const exampleIndex = headers.findIndex((header) =>
    [
      'natural example',
      'natural collocation',
      'high-value collocation',
      'model use',
      'use it for',
      'register note',
      'collocation',
      'precise upgrades',
    ].includes(header)
  );
  const posIndex = headers.findIndex((header) => header === 'pos');

  return dataRows
    .map(splitRow)
    .filter((cells) => cells[0])
    .map((cells) => {
      const fallbackMeaningIndex = posIndex === 1 && cells.length > 2 ? 2 : 1;
      const fallbackExampleIndex = cells.length > 2 ? cells.length - 1 : -1;
      return {
        word: cells[0],
        definition:
          cells[meaningIndex >= 0 ? meaningIndex : fallbackMeaningIndex] ||
          'A useful IELTS vocabulary item.',
        example:
          cells[exampleIndex >= 0 ? exampleIndex : fallbackExampleIndex] ||
          `Use “${cells[0]}” accurately in an IELTS response.`,
        ...(posIndex >= 0 && cells[posIndex] ? { partOfSpeech: cells[posIndex] } : {}),
      };
    });
}

function sections(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let current = null;

  lines.forEach((line) => {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      if (current) result.push(current);
      current = { level: heading[1].length, title: cleanCell(heading[2]), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  });

  if (current) result.push(current);
  return result;
}

const TOPIC_DESCRIPTIONS = {
  Education: 'Precise language for schooling, attainment, access, and learning policy.',
  Environment: 'High-value vocabulary for climate, conservation, energy, and sustainability.',
  Technology: 'Discuss innovation, automation, privacy, access, and digital change precisely.',
  'Health & Medicine':
    'Build accurate language for public health, treatment, prevention, and well-being.',
  'Work & Employment':
    'Describe careers, labour markets, workplace change, and job quality naturally.',
  'Crime & Law':
    'Write and speak precisely about punishment, prevention, justice, and rehabilitation.',
  'Government & Politics':
    'Useful policy language for public spending, institutions, and accountability.',
  'Media & Information': 'Analyze news, credibility, bias, online information, and press freedom.',
  'Travel & Tourism':
    'Topic language for destinations, tourism impacts, heritage, and visitor management.',
  'Cities & Urbanisation': 'Discuss housing, transport, public space, migration, and urban growth.',
  'Globalisation & Culture':
    'Express ideas about cultural exchange, identity, trade, and global influence.',
  'Art, Heritage & Creativity':
    'Vocabulary for artistic value, preservation, funding, and creative work.',
  'Family & Society': 'Discuss demographic change, equality, relationships, and social cohesion.',
  'Economy & Business':
    'Precise language for markets, living costs, investment, and economic policy.',
  'Science & Space': 'Academic vocabulary for research, evidence, ethics, and scientific progress.',
  'Sport & Leisure':
    'Natural vocabulary for participation, performance, recreation, and sports policy.',
  'Language for Writing Task 1 (data description)':
    'Describe changes, comparisons, proportions, peaks, and trends with control.',
  'Cohesion & discourse markers':
    'Connect ideas clearly with formal, balanced, and speaking-friendly transitions.',
  'High-value academic verbs (usable in every topic)':
    'Replace vague verbs with precise academic actions that work across IELTS topics.',
  'Paraphrase bank (avoid repetition penalties)':
    'Upgrade common words and paraphrase prompts without sounding memorised.',
};

function createKit({ title, description, category, source, words, featured = false }) {
  const slug = slugify(title);
  return {
    id: `vocabulary-kit-${slug}`,
    slug,
    title,
    description,
    category,
    source,
    content_type: 'vocabulary',
    access_tier: getVocabularyKitAccessTier({ slug, category, title }),
    is_published: true,
    is_local: true,
    featured,
    created_at: CREATED_AT,
    word_count: words.length,
    words,
    content: JSON.stringify(words),
  };
}

function buildTopicKits() {
  return sections(masterVocabularyMarkdown)
    .filter((section) => section.level === 2 && /^\d+\.\s/.test(section.title))
    .map((section) => {
      const topic = section.title.replace(/^\d+\.\s*/, '');
      return createKit({
        title: `${topic} Vocabulary for IELTS`,
        description:
          TOPIC_DESCRIPTIONS[topic] ||
          `Build accurate, topic-specific vocabulary for IELTS ${topic.toLowerCase()}.`,
        category: 'Topic vocabulary',
        source: 'IELTS Vocabulary Master List',
        words: tableWords(section.lines),
        featured: ['Education', 'Environment'].includes(topic),
      });
    });
}

const SKILL_DESCRIPTIONS = {
  Speaking: 'Natural phrases for extending answers, qualifying opinions, and speaking fluently.',
  Reading: 'Recognise argument, evidence, comparison, cause, and author attitude in passages.',
  Writing: 'Build precise academic arguments with controlled analysis, evaluation, and cohesion.',
};

function buildSkillKits() {
  const parsedSections = sections(skillsVocabularyMarkdown);
  let currentSkill = '';

  return parsedSections.flatMap((section) => {
    const partMatch = section.title.match(/^Part [IVX]+ — (Speaking|Reading|Writing) vocabulary$/i);
    if (partMatch) {
      currentSkill = partMatch[1][0].toUpperCase() + partMatch[1].slice(1).toLowerCase();
      return [];
    }

    if (section.level === 3 && currentSkill) {
      const focus = section.title.replace(/^[A-Z]\.\s*/, '');
      return [
        createKit({
          title: `IELTS ${currentSkill}: ${focus}`,
          description: `${SKILL_DESCRIPTIONS[currentSkill]} Focus: ${focus.toLowerCase()}.`,
          category: `${currentSkill} vocabulary`,
          source: 'IELTS Vocabulary for Speaking, Reading & Writing',
          words: tableWords(section.lines),
          featured:
            (currentSkill === 'Speaking' && focus === 'Giving and developing opinions') ||
            (currentSkill === 'Writing' && focus === 'Analysis, cause and consequence'),
        }),
      ];
    }

    return [];
  });
}

function buildBandKits() {
  return sections(skillsVocabularyMarkdown)
    .filter((section) => section.level === 2 && /^Band [789] vocabulary$/i.test(section.title))
    .map((section) => {
      const band = section.title.match(/[789]/)?.[0];
      return createKit({
        title: `Band ${band} Vocabulary Builder`,
        description: `Vocabulary and collocations selected to practise the precision, flexibility, and control expected around Band ${band}.`,
        category: 'Vocabulary by target band',
        source: 'IELTS Vocabulary for Speaking, Reading & Writing',
        words: tableWords(section.lines),
      });
    });
}

export const VOCABULARY_KITS = [...buildSkillKits(), ...buildBandKits(), ...buildTopicKits()];

export const FEATURED_VOCABULARY_KITS = [
  'ielts-speaking-giving-and-developing-opinions',
  'ielts-writing-analysis-cause-and-consequence',
  'education-vocabulary-for-ielts',
  'environment-vocabulary-for-ielts',
]
  .map((slug) => VOCABULARY_KITS.find((kit) => kit.slug === slug))
  .filter(Boolean);

export const VOCABULARY_KIT_CATEGORIES = [
  'All kits',
  'Speaking vocabulary',
  'Reading vocabulary',
  'Writing vocabulary',
  'Vocabulary by target band',
  'Topic vocabulary',
];

export function getVocabularyKit(slug) {
  return VOCABULARY_KITS.find((kit) => kit.slug === slug || kit.id === slug) || null;
}
