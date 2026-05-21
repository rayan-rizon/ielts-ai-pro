import { useState, useCallback } from 'react';
import { UserPoints } from '@/features/gamification/services/UserPoints';
import { VocabularyItem } from '@/features/vocabulary/services/VocabularyItem';

// Simple in-memory cache for word definitions to prevent redundant API calls
const definitionCache = new Map();

export const useWordDefinition = (user, testData, currentPassageIndex) => {
  const [wordDefinition, setWordDefinition] = useState(null);

  const fetchWordDefinition = useCallback(async (word) => {
    try {
      // Clean the word (remove punctuation)
      const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (!cleanWord) return;

      // Check cache first
      if (definitionCache.has(cleanWord)) {
        console.log(`[Dictionary] Serving from cache: ${cleanWord}`);
        setWordDefinition(definitionCache.get(cleanWord));
        return;
      }

      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

      if (!response.ok) {
        throw new Error('Word not found');
      }

      const data = await response.json();
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      const def =
        meaning?.definitions?.find((item) => item?.definition) || meaning?.definitions?.[0];

      // Find audio if available
      const phonetic = entry.phonetics.find((p) => p.audio && p.text) || entry.phonetics[0];

      const result = {
        word: entry.word,
        definition: def?.definition || 'Definition unavailable.',
        pronunciation: phonetic?.text || entry.phonetic || '',
        audio: phonetic?.audio || '',
        example: def?.example || '',
        synonyms: meaning.synonyms || [],
        part_of_speech: meaning?.partOfSpeech,
      };

      // Store in cache
      definitionCache.set(cleanWord, result);

      setWordDefinition((prev) => ({
        ...prev,
        ...result,
      }));
    } catch (err) {
      console.warn('Error fetching definition:', err);
      setWordDefinition((prev) => ({
        ...prev,
        definition: 'Definition not found.',
        error: true,
      }));
    }
  }, []);

  const addToVocabulary = useCallback(
    async (wordData) => {
      if (!user) {
        setWordDefinition((prev) => ({ ...prev, vocabError: true, addedToVocab: false }));
        console.error('User not logged in, cannot add to vocabulary.');
        return;
      }

      try {
        // Check if word already exists
        const existingWords = await VocabularyItem.list({
          user_id: user.id,
          word: wordData.word.toLowerCase(),
        });

        if (existingWords.length > 0) {
          setWordDefinition((prev) => ({
            ...prev,
            alreadyExists: true,
            addedToVocab: false,
            vocabError: false,
          }));
          setTimeout(() => {
            setWordDefinition(null);
          }, 2000);
          return;
        }

        const sourceTag = `${testData?.title || 'Reading Test'} - Passage ${currentPassageIndex + 1}`;

        await VocabularyItem.create({
          user_id: user.id,
          word: wordData.word,
          definition: `${wordData.part_of_speech ? `(${wordData.part_of_speech}) ` : ''}${wordData.definition}`,
          example: wordData.example,
          synonyms: Array.isArray(wordData.synonyms)
            ? wordData.synonyms
            : wordData.synonyms
              ? [wordData.synonyms]
              : [],
          source: sourceTag,
        });

        // Show success feedback
        setWordDefinition((prev) => ({
          ...prev,
          addedToVocab: true,
          vocabError: false,
          alreadyExists: false,
        }));

        // Award points for adding vocabulary
        if (user?.id) {
          try {
            await UserPoints.addPoints(user.id, 5);
          } catch (pointsError) {
            console.warn('Could not update points:', pointsError);
          }
        }

        setTimeout(() => {
          setWordDefinition(null);
        }, 2000);
      } catch (error) {
        console.error('Error adding word to vocabulary:', error);
        setWordDefinition((prev) => ({
          ...prev,
          vocabError: true,
          errorMessage: error.message || 'Unknown error',
          addedToVocab: false,
          alreadyExists: false,
        }));
      }
    },
    [user, testData, currentPassageIndex]
  );

  return {
    wordDefinition,
    setWordDefinition,
    fetchWordDefinition,
    addToVocabulary,
  };
};
