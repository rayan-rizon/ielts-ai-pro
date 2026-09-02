function normalizeTerm(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
}

export function getVocabularyKitProgress(kit, savedVocabulary = []) {
  const kitWords = kit?.words || [];
  const savedTerms = new Set(savedVocabulary.map((item) => normalizeTerm(item?.word)));
  const savedCount = kitWords.filter((item) => savedTerms.has(normalizeTerm(item?.word))).length;
  const total = kit?.word_count || kitWords.length;
  const percent = total ? Math.round((savedCount / total) * 100) : 0;

  return {
    savedCount,
    total,
    percent,
    isComplete: total > 0 && savedCount === total,
  };
}
