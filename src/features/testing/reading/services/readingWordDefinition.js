import {
  fetchFastDefinition,
  isUsableDefinition,
} from '@/features/vocabulary/utils/dictionaryLookup';
import { requestReadingAssistance } from './readingAiService';

const CONTEXTUAL_LOOKUP_DEADLINE_MS = 20000;

function contextualDefinition(word, result) {
  return {
    word,
    definition: result.meaning,
    part_of_speech: result.partOfSpeech || '',
    synonyms: result.synonyms || [],
    example: result.example || '',
    pronunciation: '',
    audio: '',
    contextual: true,
    error: false,
  };
}

function dictionaryDefinition(word, details) {
  return {
    word,
    definition: details.definition,
    pronunciation: details.phonetic,
    audio: details.audio,
    example: details.example,
    synonyms: details.synonyms || [],
    part_of_speech: details.partOfSpeech,
    contextual: false,
    error: false,
  };
}

async function waitForContextualDeadline(promise) {
  let deadlineId;
  try {
    await Promise.race([
      promise,
      new Promise((resolve) => {
        deadlineId = setTimeout(resolve, CONTEXTUAL_LOOKUP_DEADLINE_MS);
      }),
    ]);
  } finally {
    clearTimeout(deadlineId);
  }
}

function canPublishDictionary(state, signal) {
  return !signal.aborted && !state.contextualApplied;
}

function requestContextualMeaning({ word, request, signal, onDefinition }, state) {
  return requestReadingAssistance(request)
    .then((response) => {
      if (signal.aborted || !isUsableDefinition(response?.result?.meaning)) return;
      const result = response.result;
      onDefinition(contextualDefinition(word, result));
      state.contextualApplied = true;
    })
    .catch(() => null);
}

/**
 * Publish a contextual meaning first, or a provisional dictionary meaning after
 * the deadline. A late contextual meaning can still upgrade the dictionary card
 * after this promise settles. The caller aborts the signal when selection changes
 * or the card closes, and merges updates with its existing position/state.
 */
export async function lookupReadingDefinition({
  word,
  contextualRequest,
  signal,
  onDefinition,
  onError,
}) {
  const state = { contextualApplied: false };
  if (contextualRequest) {
    const contextualPromise = requestContextualMeaning(
      { word, request: contextualRequest, signal, onDefinition },
      state
    );
    await waitForContextualDeadline(contextualPromise);
    if (state.contextualApplied || signal.aborted) return;
  }

  try {
    const details = await fetchFastDefinition(word, signal);
    if (!canPublishDictionary(state, signal)) return;
    onDefinition(dictionaryDefinition(word, details));
  } catch (error) {
    // A dictionary failure must not replace an AI meaning that won the race.
    if (canPublishDictionary(state, signal)) onError(error);
  }
}
