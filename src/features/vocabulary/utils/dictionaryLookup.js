const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const DATAMUSE_API_URL = 'https://api.datamuse.com/words';
const PROVIDER_TIMEOUT_MS = 4500;

export function isUsableDefinition(definition) {
  return (
    typeof definition === 'string' &&
    Boolean(definition.trim()) &&
    !/^(definition unavailable|definition not found|saved ielts vocabulary word|no definition)[.!]?$/i.test(
      definition.trim()
    )
  );
}

function findAudioUrl(phonetics) {
  if (!phonetics) return '';
  const found = phonetics.find((p) => p.audio);
  return found ? found.audio : '';
}

function extractFirstMeaning(meanings) {
  for (const meaning of meanings || []) {
    const definition = meaning.definitions?.find((item) => isUsableDefinition(item?.definition));
    if (definition) {
      return {
        definition: definition.definition.trim(),
        example: definition.example || '',
        partOfSpeech: meaning.partOfSpeech || '',
        synonyms: meaning.synonyms || [],
      };
    }
  }
  return null;
}

function parseDictionaryResponse(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  for (const entry of data) {
    const meanings = entry.meanings || [];
    const meaning = extractFirstMeaning(meanings);
    if (meaning) {
      return {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.find((item) => item.text)?.text || '',
        ...meaning,
        audio: findAudioUrl(entry.phonetics),
        allMeanings: meanings,
      };
    }
  }
  return null;
}

function getInflectionCandidates(word) {
  const candidates = [];
  const add = (candidate) => {
    if (candidate && candidate !== word && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  };

  if (word.endsWith('ied') && word.length > 4) {
    add(`${word.slice(0, -3)}y`);
  } else if (word.endsWith('ies') && word.length > 4) {
    add(`${word.slice(0, -3)}y`);
    add(word.slice(0, -1));
  } else if (word.endsWith('ed') && word.length > 3) {
    const stem = word.slice(0, -2);
    add(stem);
    add(`${stem}e`);
    if (/(.)\1$/.test(stem)) {
      const undoubled = stem.slice(0, -1);
      add(undoubled);
      add(`${undoubled}e`);
    }
  } else if (word.endsWith('ing') && word.length > 5) {
    const stem = word.slice(0, -3);
    add(stem);
    add(`${stem}e`);
    if (/(.)\1$/.test(stem)) add(stem.slice(0, -1));
  } else if (word.endsWith('es') && word.length > 4) {
    const stem = word.slice(0, -2);
    add(stem);
    add(`${stem}e`);
  } else if (word.endsWith('s') && word.length > 3) {
    add(word.slice(0, -1));
  }

  return candidates;
}

function getInflectionLabel(word, partOfSpeech) {
  if (word.endsWith('ied') || word.endsWith('ed')) return 'Past tense and past participle';
  if (word.endsWith('ing')) return 'Present participle';
  if (word.endsWith('ies') || word.endsWith('es') || word.endsWith('s')) {
    if (partOfSpeech === 'n') return 'Plural form';
    if (partOfSpeech === 'v') return 'Third-person singular';
    return 'Inflected form';
  }
  return 'Related form';
}

function definitionFromDatamuseEntry(entry, requestedWord) {
  const rawDefinition = entry?.defs?.find(isUsableDefinition);
  if (!rawDefinition) return null;

  const [partOfSpeech = '', ...definitionParts] = rawDefinition.split('\t');
  let definition = definitionParts.join('\t').trim() || rawDefinition.trim();
  if (!isUsableDefinition(definition)) return null;

  const lemma = entry.word?.trim();
  if (lemma && lemma.toLowerCase() !== requestedWord.toLowerCase()) {
    definition = `${getInflectionLabel(requestedWord, partOfSpeech)} of ${lemma}: ${definition}`;
  }

  return {
    word: requestedWord,
    phonetic: '',
    definition,
    example: '',
    partOfSpeech:
      { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' }[partOfSpeech] || partOfSpeech,
    audio: '',
    allMeanings: [],
  };
}

function parseDatamuseResponse(data, word) {
  if (!Array.isArray(data)) return null;

  const normalizedWord = word.trim().toLowerCase();
  const exactEntry = data.find((item) => item.word?.trim().toLowerCase() === normalizedWord);
  const exactHeadword = exactEntry?.defHeadword?.trim().toLowerCase();
  if (exactEntry && (!exactHeadword || exactHeadword === normalizedWord)) {
    const exactDefinition = definitionFromDatamuseEntry(exactEntry, word);
    if (exactDefinition) return exactDefinition;
  }

  for (const candidate of getInflectionCandidates(normalizedWord)) {
    const entry = data.find(
      (item) =>
        item.word?.trim().toLowerCase() === candidate &&
        (!item.defHeadword || item.defHeadword.trim().toLowerCase() === candidate)
    );
    const definition = definitionFromDatamuseEntry(entry, word);
    if (definition) return definition;
  }

  return null;
}

async function fetchJson(url, parentSignal, timeoutMs) {
  const timeoutController = new AbortController();
  const abortFromParent = () => timeoutController.abort();
  const timeoutId = setTimeout(abortFromParent, timeoutMs);
  if (parentSignal.aborted) abortFromParent();
  else parentSignal.addEventListener('abort', abortFromParent, { once: true });

  try {
    const response = await fetch(url, { signal: timeoutController.signal });
    if (!response.ok) throw new Error(`Definition service returned ${response.status}`);
    return await response.json();
  } catch (error) {
    if (timeoutController.signal.aborted && !parentSignal.aborted) {
      throw new Error('Definition provider timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    parentSignal.removeEventListener('abort', abortFromParent);
  }
}

export async function fetchFastDefinition(word, signal) {
  const lookupController = new AbortController();
  const abortLookup = () => lookupController.abort();
  if (signal.aborted) abortLookup();
  else signal.addEventListener('abort', abortLookup, { once: true });

  const primary = fetchJson(
    `${DICTIONARY_API_URL}/${encodeURIComponent(word)}`,
    lookupController.signal,
    PROVIDER_TIMEOUT_MS
  ).then((data) => {
    const result = parseDictionaryResponse(data);
    if (!result) throw new Error('No dictionary meaning found');
    return result;
  });

  const fallback = fetchJson(
    `${DATAMUSE_API_URL}?sp=${encodeURIComponent(word)}&md=d&max=10`,
    lookupController.signal,
    PROVIDER_TIMEOUT_MS
  ).then((data) => {
    const result = parseDatamuseResponse(data, word);
    if (!result) throw new Error('No fallback meaning found');
    return result;
  });

  try {
    // A slow primary lookup must not block a faster fallback response.
    return await Promise.any([primary, fallback]);
  } finally {
    lookupController.abort();
    signal.removeEventListener('abort', abortLookup);
  }
}
