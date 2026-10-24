// Pure helpers for the AI word card: turning a card into saved columns, reading a
// saved word back, and building the fill-the-gap review question.

const PLACEHOLDER_DEFINITION =
  /^(definition unavailable|definition not found|saved ielts vocabulary word|no definition)[.!]?$/i;

/** The sense a saved word already carries, without a "(noun) " prefix some rows have. */
export function savedSenseHint(definition) {
  const text = String(definition || '')
    .replace(/^\s*\((?:noun|verb|adjective|adverb|phrase|n|v|adj|adv)\.?\)\s*/i, '')
    .trim();
  return text && !PLACEHOLDER_DEFINITION.test(text) ? text : '';
}

/**
 * The columns a word card fills in. `definition` is left to the caller: the
 * learner may have edited it, and a saved word keeps the sense it was saved with.
 */
export function cardToItemFields(card, language, existing = {}) {
  if (!card) return {};
  const translations = { ...(existing.translations || {}) };
  if (card.translation?.meaning && language && language !== 'en') {
    translations[language] = { word: card.translation.word, meaning: card.translation.meaning };
  }
  return {
    part_of_speech: card.partOfSpeech && card.partOfSpeech !== 'other' ? card.partOfSpeech : null,
    ipa: card.ipa || null,
    level: card.level || null,
    synonyms: card.synonyms?.length ? card.synonyms : null,
    translations,
    details: {
      register: card.register || '',
      collocations: card.collocations || [],
      wordFamily: card.wordFamily || [],
      commonMistake: card.commonMistake || '',
      examples: card.examples || [],
    },
    enriched_at: new Date().toISOString(),
  };
}

/** Only fill gaps on an existing word: never overwrite what the learner saved. */
export function mergeEnrichment(item, fields) {
  const patch = { translations: fields.translations, details: fields.details };
  for (const key of ['part_of_speech', 'ipa', 'level']) {
    if (!item[key] && fields[key]) patch[key] = fields[key];
  }
  if (!item.synonyms?.length && fields.synonyms) patch.synonyms = fields.synonyms;
  patch.enriched_at = fields.enriched_at;
  return patch;
}

export function getItemTranslation(item, language) {
  if (!language || language === 'en') return null;
  const entry = item?.translations?.[language];
  return entry?.meaning ? entry : null;
}

/** A word needs a card when it was never enriched, or lacks the learner's language. */
export function needsEnrichment(item, language) {
  if (!item?.word) return false;
  if (!item.enriched_at) return true;
  return Boolean(language && language !== 'en' && !getItemTranslation(item, language));
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Normal English inflections of a headword, longest first. */
export function inflectionsOf(word) {
  const base = word.toLowerCase();
  if (base.includes(' ')) return [base];
  const forms = new Set([base, `${base}s`, `${base}es`, `${base}ed`, `${base}d`, `${base}ing`]);
  const last = base.slice(-1);
  if (base.endsWith('e')) {
    forms.add(`${base.slice(0, -1)}ing`);
  }
  if (base.endsWith('y') && base.length > 2) {
    forms.add(`${base.slice(0, -1)}ies`);
    forms.add(`${base.slice(0, -1)}ied`);
  }
  if (/[bcdfghjklmnpqrstvwxz]/.test(last)) {
    forms.add(`${base}${last}ed`);
    forms.add(`${base}${last}ing`);
  }
  forms.add(`${base}ly`);
  forms.add(`${base}ment`);
  return [...forms].sort((a, b) => b.length - a.length);
}

/**
 * A fill-the-gap question from the word's own example sentence, or null when the
 * sentence does not contain the word (or a normal form of it).
 */
export function buildCloze(item) {
  const word = String(item?.word || '').trim();
  if (!word) return null;
  const sentences = [item.example, item.example_sentence, ...(item.details?.examples || [])]
    .map((text) => String(text || '').trim())
    .filter(Boolean);
  const pattern = new RegExp(
    `(?<![A-Za-z])(${inflectionsOf(word).map(escapeRegExp).join('|')})(?![A-Za-z])`,
    'i'
  );
  for (const sentence of sentences) {
    const match = sentence.match(pattern);
    if (!match) continue;
    return {
      prompt: `${sentence.slice(0, match.index)}_____${sentence.slice(match.index + match[0].length)}`,
      answer: match[0],
      base: word,
    };
  }
  return null;
}

const squash = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Either the exact form in the sentence or the saved headword is a correct answer. */
export function checkClozeAnswer(typed, cloze) {
  const answer = squash(typed);
  if (!answer || !cloze) return false;
  return answer === squash(cloze.answer) || answer === squash(cloze.base);
}

/** Speed-quiz wrong answers: prefer other words of the same part of speech. */
export function pickDistractors(target, pool, count = 3, random = Math.random) {
  const others = pool.filter((entry) => entry.id !== target.id && entry.definition);
  const pos = target.part_of_speech;
  const shuffle = (list) => [...list].sort(() => random() - 0.5);
  const samePos = pos ? shuffle(others.filter((entry) => entry.part_of_speech === pos)) : [];
  const rest = shuffle(others.filter((entry) => !samePos.includes(entry)));
  const seen = new Set([target.definition]);
  const picked = [];
  for (const entry of [...samePos, ...rest]) {
    if (seen.has(entry.definition)) continue;
    seen.add(entry.definition);
    picked.push(entry.definition);
    if (picked.length >= count) break;
  }
  return picked;
}
