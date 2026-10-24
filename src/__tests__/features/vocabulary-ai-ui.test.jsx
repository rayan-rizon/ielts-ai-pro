import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MotionProvider from '@/components/shared/MotionProvider';
import ReviewSession from '@/features/vocabulary/components/ReviewSession';
import WordDetailDialog from '@/features/vocabulary/components/WordDetailDialog';
import { useVocabularyEnrichment } from '@/features/vocabulary/hooks/useVocabularyEnrichment';
import { VocabDefineError } from '@/features/vocabulary/services/vocabDefineService';

const mocked = vi.hoisted(() => ({ defineWord: vi.fn(), update: vi.fn(), translate: vi.fn() }));

vi.mock('@/features/vocabulary/services/vocabDefineService', async (importOriginal) => ({
  ...(await importOriginal()),
  defineWord: (...args) => mocked.defineWord(...args),
}));
vi.mock('@/features/vocabulary/services/VocabularyItem', () => ({
  VocabularyItem: { update: (...args) => mocked.update(...args) },
}));
vi.mock('@/features/vocabulary/services/translateService', async (importOriginal) => ({
  ...(await importOriginal()),
  translateText: (...args) => mocked.translate(...args),
  getCachedTranslation: () => null,
}));

const CARD = {
  word: 'mitigate',
  partOfSpeech: 'verb',
  ipa: '/ˈmɪtɪɡeɪt/',
  level: 'C1',
  register: 'formal',
  meaning: 'To make something bad less serious.',
  translation: { language: 'bn', word: 'প্রশমিত করা', meaning: 'কম গুরুতর করা।' },
  examples: ['Trees mitigate the effects of heat.'],
  synonyms: ['reduce'],
  collocations: ['mitigate the risk'],
  wordFamily: [{ word: 'mitigation', pos: 'noun' }],
  commonMistake: '',
};
const cardResult = (card = CARD) => ({ card, source: 'generated', remainingDailyQuota: 10 });

beforeEach(() => {
  mocked.update.mockImplementation(async (id, patch) => ({ id, ...patch }));
});
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const saved = (overrides = {}) => ({
  id: 'w1',
  word: 'mitigate',
  definition: 'Make less severe.',
  example: 'Trees mitigate the effects of heat.',
  ...overrides,
});

describe('useVocabularyEnrichment', () => {
  const setup = (language = 'bn') => {
    const setAll = vi.fn();
    const hook = renderHook(() => useVocabularyEnrichment({ setAllVocabulary: setAll, language }));
    return { setAll, ...hook };
  };

  it('translates the sense the learner saved and keeps their wording', async () => {
    mocked.defineWord.mockResolvedValue(cardResult());
    const { result, setAll } = setup();
    await act(async () => {
      await result.current.enrichItem(saved({ definition: '(verb) Make less severe.' }));
    });
    expect(mocked.defineWord).toHaveBeenCalledWith('mitigate', {
      hint: 'Make less severe.',
      language: 'bn',
    });
    const patch = mocked.update.mock.calls[0][1];
    expect(patch.definition).toBeUndefined();
    expect(patch.translations.bn.meaning).toBe('কম গুরুতর করা।');
    expect(patch.ipa).toBe('/ˈmɪtɪɡeɪt/');
    expect(patch.example).toBeUndefined();
    const update = setAll.mock.calls[0][0];
    expect(update([saved(), saved({ id: 'other' })])[0].translations.bn).toBeTruthy();
    expect(update([saved(), saved({ id: 'other' })])[1].translations).toBeUndefined();
  });

  it('gives a word saved with no usable meaning the card’s meaning and example', async () => {
    mocked.defineWord.mockResolvedValue(cardResult());
    const { result } = setup();
    await act(async () => {
      await result.current.enrichItem(
        saved({ definition: 'Saved IELTS vocabulary word', example: '' })
      );
    });
    expect(mocked.defineWord.mock.calls[0][1].hint).toBe('');
    const patch = mocked.update.mock.calls[0][1];
    expect(patch.definition).toBe(CARD.meaning);
    expect(patch.example).toBe(CARD.examples[0]);
  });

  it.each(['ja', 'ru', 'uz', 'id'])(
    'asks for the card in the learner’s own language (%s)',
    async (code) => {
      mocked.defineWord.mockResolvedValue(cardResult());
      const { result } = setup(code);
      await act(async () => {
        await result.current.enrichItem(saved());
      });
      expect(mocked.defineWord.mock.calls[0][1].language).toBe(code);
    }
  );

  it('asks for English only when the learner reads English', async () => {
    mocked.defineWord.mockResolvedValue(cardResult({ ...CARD, translation: null }));
    const { result } = setup('en');
    await act(async () => {
      await result.current.enrichItem(saved());
    });
    expect(mocked.defineWord.mock.calls[0][1].language).toBe('en');
  });

  it('opens a word once per visit, unless the learner asks again', async () => {
    mocked.defineWord.mockResolvedValue(cardResult());
    const { result } = setup();
    const item = saved();
    await act(async () => {
      await result.current.enrichOnce(item);
      await result.current.enrichOnce(item);
    });
    expect(mocked.defineWord).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.enrichOnce(item, { force: true });
    });
    expect(mocked.defineWord).toHaveBeenCalledTimes(2);
  });

  it('skips a word that already has its card', async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.enrichOnce(
        saved({ enriched_at: 'x', translations: { bn: { word: 'a', meaning: 'b' } } })
      );
    });
    expect(mocked.defineWord).not.toHaveBeenCalled();
  });

  it('surfaces a refusal instead of retrying it', async () => {
    mocked.defineWord.mockRejectedValue(new VocabDefineError('quota', 'No lookups left today'));
    const { result } = setup();
    await act(async () => {
      expect(await result.current.enrichOnce(saved())).toBeNull();
    });
    expect(result.current.notice).toEqual({ kind: 'quota', message: 'No lookups left today' });
    expect(mocked.update).not.toHaveBeenCalled();
  });

  it('adds cards in batches of ten, one at a time, and stops when the limit is hit', async () => {
    const items = Array.from({ length: 14 }, (_, index) =>
      saved({ id: `w${index}`, word: `w${index}` })
    );
    let calls = 0;
    mocked.defineWord.mockImplementation(async () => {
      calls += 1;
      if (calls === 4) throw new VocabDefineError('burst', 'Too quick', { retryAfterSeconds: 15 });
      return cardResult();
    });
    const { result } = setup();
    let outcome;
    await act(async () => {
      outcome = await result.current.enrichMany(items);
    });
    expect(outcome.done).toBe(3);
    expect(outcome.stopped.kind).toBe('burst');
    expect(mocked.defineWord).toHaveBeenCalledTimes(4);
    expect(result.current.notice.kind).toBe('burst');
    expect(result.current.batch).toBeNull();
  });

  it('never sends more than ten words in one batch', async () => {
    const items = Array.from({ length: 25 }, (_, index) =>
      saved({ id: `w${index}`, word: `w${index}` })
    );
    mocked.defineWord.mockResolvedValue(cardResult());
    const { result } = setup();
    await act(async () => {
      await result.current.enrichMany(items);
    });
    expect(mocked.defineWord).toHaveBeenCalledTimes(10);
  });

  it('carries on past a word that is not a word', async () => {
    const items = [saved({ id: 'a', word: 'asdf' }), saved({ id: 'b', word: 'mitigate' })];
    mocked.defineWord
      .mockRejectedValueOnce(new VocabDefineError('not_a_word', 'nope'))
      .mockResolvedValueOnce(cardResult());
    const { result } = setup();
    let outcome;
    await act(async () => {
      outcome = await result.current.enrichMany(items);
    });
    expect(outcome).toMatchObject({ done: 1, stopped: null });
  });
});

describe('WordDetailDialog', () => {
  const enriched = saved({
    ipa: '/ˈmɪtɪɡeɪt/',
    part_of_speech: 'verb',
    level: 'C1',
    enriched_at: '2026-10-24T00:00:00Z',
    synonyms: ['reduce'],
    translations: { bn: { word: 'প্রশমিত করা', meaning: 'কম গুরুতর করা।' } },
    details: {
      register: 'formal',
      collocations: ['mitigate the risk'],
      wordFamily: [{ word: 'mitigation', pos: 'noun' }],
      commonMistake: 'Not "mitigate against".',
      examples: ['Trees mitigate the effects of heat.', 'Planning can mitigate risk.'],
    },
  });
  const mount = (props) =>
    render(
      <MotionProvider>
        <WordDetailDialog
          viewingWord={enriched}
          setViewingWord={vi.fn()}
          targetLanguage="bn"
          setTargetLanguage={vi.fn()}
          handleDeleteWord={vi.fn()}
          onEnrich={vi.fn()}
          {...props}
        />
      </MotionProvider>
    );

  it('shows the stored Bangla meaning, IPA, level and the rest of the card without any request', () => {
    const onEnrich = vi.fn();
    mount({ onEnrich });
    expect(screen.getByText('কম গুরুতর করা।')).toBeInTheDocument();
    expect(screen.getByText('প্রশমিত করা')).toBeInTheDocument();
    expect(screen.getByText('/ˈmɪtɪɡeɪt/')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
    expect(screen.getByText('mitigate the risk')).toBeInTheDocument();
    expect(screen.getByText('mitigation (noun)')).toBeInTheDocument();
    expect(screen.getByText('Not "mitigate against".')).toBeInTheDocument();
    expect(screen.getByText('Planning can mitigate risk.')).toBeInTheDocument();
    expect(onEnrich).not.toHaveBeenCalled();
    expect(mocked.translate).not.toHaveBeenCalled();
  });

  it('never invents an IPA for a word that has none', () => {
    mount({ viewingWord: saved() });
    expect(screen.queryByText('/mitigate/')).not.toBeInTheDocument();
  });

  it('asks for the missing card when opened and shows progress', () => {
    const onEnrich = vi.fn();
    mount({ viewingWord: saved(), onEnrich, isEnriching: true });
    expect(onEnrich).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Preparing Bangla meaning/)).toBeInTheDocument();
  });

  it('offers a manual retry, and shows why a lookup was refused', () => {
    const onEnrich = vi.fn();
    mount({
      viewingWord: saved(),
      onEnrich,
      enrichNotice: { kind: 'quota', message: 'No AI lookups left today.' },
    });
    expect(screen.getByText('No AI lookups left today.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add Bangla meaning/ }));
    expect(onEnrich).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'w1' }), {
      force: true,
    });
  });

  it('shows the stored meaning in any language and never machine-translates on the fly', () => {
    const japanese = {
      ...enriched,
      translations: { ja: { word: '緩和する', meaning: '悪いものを深刻でなくすること。' } },
    };
    mount({ viewingWord: japanese, targetLanguage: 'ja' });
    expect(screen.getByText('悪いものを深刻でなくすること。')).toBeInTheDocument();
    expect(screen.getByText('Japanese meaning')).toBeInTheDocument();
    expect(mocked.translate).not.toHaveBeenCalled();
  });

  it('asks for the card in the chosen language when only another language is stored', () => {
    const onEnrich = vi.fn();
    mount({ targetLanguage: 'ru', onEnrich });
    expect(onEnrich).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Add Russian meaning/ })).toBeInTheDocument();
    expect(mocked.translate).not.toHaveBeenCalled();
  });

  it('shows no translation block in English', () => {
    const onEnrich = vi.fn();
    mount({ targetLanguage: 'en', onEnrich });
    expect(screen.queryByText('কম গুরুতর করা।')).not.toBeInTheDocument();
    expect(onEnrich).not.toHaveBeenCalled();
  });
});

describe('ReviewSession', () => {
  function Harness({ item, onSubmit = vi.fn(), language = 'bn' }) {
    const [flipped, setFlipped] = useState(false);
    return (
      <MotionProvider>
        <ReviewSession
          isOpen
          onOpenChange={vi.fn()}
          currentItem={item}
          isFlipped={flipped}
          onFlip={() => setFlipped((value) => !value)}
          onSubmit={onSubmit}
          language={language}
        />
      </MotionProvider>
    );
  }
  const item = saved({
    ipa: '/ˈmɪtɪɡeɪt/',
    part_of_speech: 'verb',
    translations: { bn: { word: 'প্রশমিত করা', meaning: 'কম গুরুতর করা।' } },
  });

  it('hides the word and asks for it when the example contains it', () => {
    render(<Harness item={item} />);
    expect(screen.getByText('Fill the gap')).toBeInTheDocument();
    expect(screen.getByText('Trees _____ the effects of heat.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'mitigate' })).not.toBeInTheDocument();
  });

  it('marks a correct answer, shows the Bangla meaning and suggests Good', async () => {
    const onSubmit = vi.fn();
    render(<Harness item={item} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Missing word'), { target: { value: 'Mitigate' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Check' })));
    expect(await screen.findByText('Correct: mitigate')).toBeInTheDocument();
    expect(screen.getByText(/কম গুরুতর করা/)).toBeInTheDocument();
    expect(screen.getByText('/ˈmɪtɪɡeɪt/')).toBeInTheDocument();
    const good = screen.getByRole('button', { name: 'Good (suggested)' });
    fireEvent.click(good);
    expect(onSubmit).toHaveBeenCalledWith(4);
  });

  it('marks a wrong answer, reveals the right one and suggests Forgot', async () => {
    render(<Harness item={item} />);
    fireEvent.change(screen.getByLabelText('Missing word'), { target: { value: 'ignore' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Check' })));
    expect(await screen.findByText('Not quite. The answer is mitigate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot (suggested)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
  });

  it('lets the learner skip to the meaning with no suggestion', async () => {
    render(<Harness item={item} />);
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Show the meaning instead' }))
    );
    expect(await screen.findByText('Make less severe.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\(suggested\)/ })).not.toBeInTheDocument();
  });

  it('keeps the original flip card for a word with no usable example', async () => {
    render(<Harness item={saved({ example: '' })} language="en" />);
    expect(screen.queryByText('Fill the gap')).not.toBeInTheDocument();
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Reveal definition of mitigate' }))
    );
    expect(await screen.findByText('Make less severe.')).toBeInTheDocument();
    const back = screen.getByText('Make less severe.').closest('div');
    expect(within(back.parentElement).queryByText(/কম গুরুতর/)).toBeNull();
  });
});
