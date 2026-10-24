import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import MotionProvider from '@/components/shared/MotionProvider';
import QuickAddCard from '@/features/vocabulary/components/QuickAddCard';
import { VocabDefineError } from '@/features/vocabulary/services/vocabDefineService';
import { saveLanguagePreference } from '@/features/vocabulary/services/translateService';

const mocked = vi.hoisted(() => ({
  defineWord: vi.fn(),
  suggestions: [],
  suggest: vi.fn(),
  clearSuggestions: vi.fn(),
}));

vi.mock('@/features/vocabulary/services/vocabDefineService', async (importOriginal) => ({
  ...(await importOriginal()),
  defineWord: (...args) => mocked.defineWord(...args),
}));
vi.mock('@/features/vocabulary/hooks/useWordDefinition', async (importOriginal) => ({
  ...(await importOriginal()),
  useWordSuggestions: () => ({
    suggestions: mocked.suggestions,
    fetchSuggestions: mocked.suggest,
    clearSuggestions: mocked.clearSuggestions,
  }),
}));

const CARD = {
  word: 'mitigate',
  partOfSpeech: 'verb',
  ipa: '/ˈmɪtɪɡeɪt/',
  level: 'C1',
  register: 'formal',
  meaning: 'To make something bad less serious.',
  translation: {
    language: 'bn',
    word: 'প্রশমিত করা',
    meaning: 'কোনো খারাপ জিনিসকে কম গুরুতর করা।',
  },
  examples: ['Trees mitigate the effects of heat.', 'Better planning can mitigate risk.'],
  synonyms: ['reduce'],
  collocations: ['mitigate the risk'],
  wordFamily: [{ word: 'mitigation', pos: 'noun' }],
  commonMistake: '',
};
const result = (card = CARD) => ({
  card,
  source: 'generated',
  remainingDailyQuota: 20,
  quotaResetsAt: null,
});

beforeEach(() => {
  mocked.suggestions = [];
  localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function mount(onAddWord = vi.fn()) {
  render(
    <MotionProvider>
      <QuickAddCard user={{ id: 'test', subscription_tier: 'premium' }} onAddWord={onAddWord} />
    </MotionProvider>
  );
}
const type = (value) =>
  fireEvent.change(screen.getByPlaceholderText('Type a word to save...'), { target: { value } });

it('looks up a spelling-confirmed word on its own and shows meaning, Bangla and IPA', async () => {
  vi.useFakeTimers();
  mocked.suggestions = [{ word: 'mitigate' }];
  mocked.defineWord.mockResolvedValue(result());
  mount();
  type('mitigate');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(901);
  });
  expect(mocked.defineWord).toHaveBeenCalledTimes(1);
  expect(mocked.defineWord).toHaveBeenCalledWith(
    'mitigate',
    expect.objectContaining({ language: 'bn' })
  );
  expect(screen.getByText('To make something bad less serious.')).toBeInTheDocument();
  expect(screen.getByText('কোনো খারাপ জিনিসকে কম গুরুতর করা।')).toBeInTheDocument();
  expect(screen.getByText('/ˈmɪtɪɡeɪt/')).toBeInTheDocument();
  expect(screen.getByText('C1')).toBeInTheDocument();
});

it('does not spend a lookup on a word the spelling list does not confirm', async () => {
  vi.useFakeTimers();
  mocked.suggestions = [{ word: 'mitigate' }];
  mount();
  type('mitig');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(mocked.defineWord).not.toHaveBeenCalled();
});

it('preserves a manual meaning while a lookup finishes and saves it without the AI translation', async () => {
  vi.useFakeTimers();
  mocked.suggestions = [{ word: 'mitigate' }];
  let resolveLookup;
  mocked.defineWord.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLookup = resolve;
      })
  );
  const onAddWord = vi.fn().mockResolvedValue({ success: true });
  mount(onAddWord);
  type('mitigate');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(901);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Enter meaning' }));
  fireEvent.change(screen.getByLabelText('Meaning'), {
    target: { value: 'My meaning in context.' },
  });
  await act(async () => resolveLookup(result()));
  expect(screen.getByLabelText('Meaning')).toHaveValue('My meaning in context.');

  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  const saved = onAddWord.mock.calls[0][0];
  expect(saved.definition).toBe('My meaning in context.');
  expect(saved.example).toBe('');
  // The translation described the AI's sentence, not the learner's.
  expect(saved.fields.translations).toEqual({});
  expect(saved.fields.enriched_at).toBeNull();
});

it('looks up with the sparkle button, then saves the card fields, and keeps the input after a failed save', async () => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  mocked.defineWord.mockResolvedValue(result());
  const onAddWord = vi.fn().mockResolvedValue({ success: false });
  mount(onAddWord);
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(onAddWord).not.toHaveBeenCalled();
  expect(screen.getByText('To make something bad less serious.')).toBeInTheDocument();

  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  expect(onAddWord).toHaveBeenCalledWith(
    expect.objectContaining({
      word: 'mitigate',
      definition: 'To make something bad less serious.',
      example: 'Trees mitigate the effects of heat.',
      fields: expect.objectContaining({
        part_of_speech: 'verb',
        ipa: '/ˈmɪtɪɡeɪt/',
        level: 'C1',
        translations: { bn: { word: 'প্রশমিত করা', meaning: 'কোনো খারাপ জিনিসকে কম গুরুতর করা।' } },
      }),
    })
  );
  expect(screen.getByPlaceholderText('Type a word to save...')).toHaveValue('mitigate');
});

it('saves the example the learner picked', async () => {
  mocked.defineWord.mockResolvedValue(result());
  const onAddWord = vi.fn().mockResolvedValue({ success: true });
  mount(onAddWord);
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  fireEvent.click(screen.getByRole('button', { name: 'Better planning can mitigate risk.' }));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  expect(onAddWord.mock.calls[0][0].example).toBe('Better planning can mitigate risk.');
});

it('explains a daily-limit refusal, blocks further AI lookups and still allows a manual meaning', async () => {
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  mocked.defineWord.mockRejectedValue(
    new VocabDefineError('quota', 'limit', { retryAfterSeconds: 3600 })
  );
  const onAddWord = vi.fn().mockResolvedValue({ success: true });
  mount(onAddWord);
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(screen.getByText(/used today’s AI lookups/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Look up with AI' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Enter meaning' }));
  fireEvent.change(screen.getByLabelText('Meaning'), { target: { value: 'Make less severe.' } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  // A refused lookup is not retried on save: the learner's own meaning goes through.
  expect(mocked.defineWord).toHaveBeenCalledTimes(1);
  expect(onAddWord).toHaveBeenCalledWith(
    expect.objectContaining({ word: 'mitigate', definition: 'Make less severe.' })
  );
});

it('tells the learner when the word is not recognised', async () => {
  mocked.defineWord.mockRejectedValue(
    new VocabDefineError('not_a_word', '“asdfgh” is not a recognised English word')
  );
  mount();
  type('asdfgh');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(screen.getByText('“asdfgh” is not a recognised English word')).toBeInTheDocument();
});

it("writes the meaning in the learner's chosen language, not only Bangla", async () => {
  localStorage.setItem('vocabularyTargetLanguage', 'ru');
  mocked.defineWord.mockResolvedValue(
    result({
      ...CARD,
      translation: {
        language: 'ru',
        word: 'смягчать',
        meaning: 'Сделать что-то плохое менее серьёзным.',
      },
    })
  );
  mount();
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(mocked.defineWord).toHaveBeenCalledWith(
    'mitigate',
    expect.objectContaining({ language: 'ru' })
  );
  expect(screen.getByText('Russian meaning')).toBeInTheDocument();
  expect(screen.getByText('Сделать что-то плохое менее серьёзным.')).toBeInTheDocument();
});

it('drops the old-language card when the learner switches language, and asks for the new one', async () => {
  localStorage.setItem('vocabularyTargetLanguage', 'bn');
  mocked.defineWord.mockResolvedValue(result());
  mount();
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(screen.getByText('Bangla meaning')).toBeInTheDocument();

  mocked.defineWord.mockResolvedValue(
    result({
      ...CARD,
      translation: { language: 'hi', word: 'कम करना', meaning: 'कम गंभीर बनाना।' },
    })
  );
  await act(async () => saveLanguagePreference('hi'));
  expect(screen.queryByText('Bangla meaning')).not.toBeInTheDocument();
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(mocked.defineWord).toHaveBeenLastCalledWith(
    'mitigate',
    expect.objectContaining({ language: 'hi' })
  );
  expect(screen.getByText('कम गंभीर बनाना।')).toBeInTheDocument();
});

it('saves the translation under the language it was written in', async () => {
  localStorage.setItem('vocabularyTargetLanguage', 'hi');
  mocked.defineWord.mockResolvedValue(
    result({
      ...CARD,
      translation: { language: 'hi', word: 'कम करना', meaning: 'कम गंभीर बनाना।' },
    })
  );
  const onAddWord = vi.fn().mockResolvedValue({ success: true });
  mount(onAddWord);
  type('mitigate');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save Word' })));
  expect(onAddWord.mock.calls[0][0].fields.translations).toEqual({
    hi: { word: 'कम करना', meaning: 'कम गंभीर बनाना।' },
  });
});

it('does not retry a failed automatic lookup on its own, but lets the learner try again', async () => {
  vi.useFakeTimers();
  mocked.suggestions = [{ word: 'mitigate' }];
  // A real request takes time, so the card is seen loading before it fails. An instant
  // rejection would batch both into one render and hide the retry loop this guards.
  mocked.defineWord.mockImplementation(
    () =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new VocabDefineError('unavailable', 'down')), 1000)
      )
  );
  mount();
  type('mitigate');
  // One second at a time, so React renders between steps like a browser does.
  for (let second = 0; second < 15; second += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
  expect(mocked.defineWord).toHaveBeenCalledTimes(1);

  mocked.defineWord.mockResolvedValue(result());
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Look up with AI' })));
  expect(mocked.defineWord).toHaveBeenCalledTimes(2);
  expect(screen.getByText('To make something bad less serious.')).toBeInTheDocument();
});
