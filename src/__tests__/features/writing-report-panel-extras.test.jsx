import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let profile = null;
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ userProfile: profile }),
}));
const readSaved = vi.fn();
const saveLanguage = vi.fn();
vi.mock('@/features/testing/writing/report/reportLanguagePreference', () => ({
  readSavedReportLanguage: (...args) => readSaved(...args),
  saveReportLanguage: (...args) => saveLanguage(...args),
}));
const saveWord = vi.fn();
vi.mock('@/features/testing/writing/hooks/useWritingVocabularySave', () => ({
  normalizeVocabularyTerm: (word) => String(word).toLowerCase(),
  useWritingVocabularySave: () => ({
    onSaveVocabularyWord: (...args) => saveWord(...args),
    savedVocabularyTerms: new Set(),
    savingVocabularyTerms: new Set(),
  }),
}));
const assist = vi.fn();
vi.mock('@/features/testing/writing/report/reportAssistClient', () => ({
  requestReportAssist: (...args) => assist(...args),
}));

const { FeedbackPanel } =
  await import('@/features/testing/writing/components/WritingTest/components/FeedbackPanel');
const { useWritingTestStore } =
  await import('@/features/testing/writing/store/useWritingTestStore');
const { resetReportLanguageForTests } =
  await import('@/features/testing/writing/report/useReportLanguage');

const body = (lead) =>
  `${lead}, free education give more people the chance to study and tuition fees are a heavy burden for many poor families, so the country loses talented workers because they cannot go to university.`;

const essay = [
  'Some people believe university should be free for every student while others think students should pay for it. In my opinion governments should pay because it helps the whole society.',
  body('Firstly'),
  body('Secondly'),
  'In conclusion I strongly believe university should be free because it pays for itself over time and gives everyone an equal chance to succeed in their life.',
]
  .map((p) => `<p>${p}</p>`)
  .join('');

const feedback = {
  overallBand: 6,
  taskType: 'Task 2',
  wordCount: 268,
  sourceFingerprint: 'abc',
  originalSource: essay,
  summary: 'Your position is clear, but grammar limits the score.',
  criteriaScores: {
    TaskResponse: 7,
    CoherenceAndCohesion: 6,
    LexicalResource: 6,
    GrammaticalRangeAndAccuracy: 5.5,
  },
  priorities: [
    {
      criterion: 'Grammar',
      issue: 'Agreement errors recur.',
      action: 'Check each verb against its subject.',
      evidenceText: 'free education give',
    },
  ],
  annotations: [
    {
      originalText: 'give more people',
      type: 'grammar',
      severity: 'error',
      replacementText: 'gives more people',
      explanation: 'A singular subject needs a singular verb.',
    },
  ],
  strengths: ['A clear position is kept throughout.'],
};

const modelAnswer = (band, language) => ({
  operation: 'model',
  band,
  language,
  notesTranslated: language !== 'en',
  paragraphs: [1, 2].map((index) => ({
    index,
    original: body(index === 1 ? 'Firstly' : 'Secondly'),
    model: `Band ${band} paragraph ${index}: to begin with, free education widens access.`,
    notes: [
      { n: 1, criterion: 'coherence', phrase: 'to begin with', why: `Reason ${band}.` },
      { n: 2, criterion: 'vocabulary', phrase: 'widens access', why: 'A precise phrase.' },
    ],
  })),
});

const bangla = {
  summary: 'আপনার অবস্থান স্পষ্ট।',
  'priorities.0.issue': 'ক্রিয়ার ভুল বারবার হচ্ছে।',
};

const renderPanel = (props = {}) => {
  useWritingTestStore.setState({
    feedbacks: { 'Task 1': null, 'Task 2': feedback },
    currentFeedback: feedback,
  });
  return render(
    <MemoryRouter>
      <FeedbackPanel feedback={feedback} reportSessionId="s-1" {...props} />
    </MemoryRouter>
  );
};

describe('Writing report language and comparison', () => {
  beforeEach(() => {
    profile = { id: 'u1', target_band_score: 7, settings: { report_language: 'en' } };
    readSaved.mockReset().mockResolvedValue(null);
    saveLanguage.mockReset().mockResolvedValue({});
    saveWord.mockReset();
    assist
      .mockReset()
      .mockImplementation(async (request) =>
        request.operation === 'translate'
          ? { translations: bangla }
          : modelAnswer(request.band, request.language)
      );
    resetReportLanguageForTests();
    window.localStorage.clear();
  });

  it('shows an English reader the report without asking or translating', () => {
    renderPanel();
    expect(screen.getByText(feedback.summary)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(assist).not.toHaveBeenCalled();
  });

  it('asks on the first report, saves the answer and translates the explanations', async () => {
    profile = { id: 'u1', settings: {} };
    renderPanel();

    const dialog = await screen.findByRole('dialog', { name: 'Choose your report language' });
    expect(within(dialog).getByRole('radio', { name: 'English' })).toBeChecked();
    fireEvent.click(within(dialog).getByRole('radio', { name: 'বাংলা' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /ভাষা সেভ করুন|Save language/ }));

    expect(saveLanguage).toHaveBeenCalledWith('bn');
    expect(await screen.findByText('আপনার অবস্থান স্পষ্ট।')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(assist).toHaveBeenCalledWith({
      sessionId: 's-1',
      taskType: 'Task 2',
      operation: 'translate',
      language: 'bn',
    });
  });

  it('keeps English and does not ask again when the question is closed', async () => {
    profile = { id: 'u1', settings: {} };
    renderPanel();
    const dialog = await screen.findByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep English' }));

    expect(saveLanguage).toHaveBeenCalledWith('en');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(assist).not.toHaveBeenCalled();
  });

  it('translates headings and explanations but leaves the learner’s English alone', async () => {
    profile = { id: 'u1', settings: { report_language: 'bn' } };
    const { container } = renderPanel();

    expect(
      await screen.findByRole('heading', { name: 'ক্রিয়ার ভুল বারবার হচ্ছে।' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'কেন আপনি 6.0 পেলেন' })).toBeInTheDocument();
    expect(screen.getByText('“free education give”')).toHaveAttribute('lang', 'en');
    expect(screen.getByText('gives more people')).toBeInTheDocument();
    expect(screen.getAllByText('Grammatical Range and Accuracy').length).toBeGreaterThan(0);
    expect(container.querySelector('#feedback-section')).toHaveAttribute('lang', 'bn');
  });

  it('lays an Urdu report out right to left with English kept left to right', async () => {
    profile = { id: 'u1', settings: { report_language: 'ur' } };
    const { container } = renderPanel();

    expect(container.querySelector('#feedback-section')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('“free education give”').closest('[dir]')).toHaveAttribute(
      'dir',
      'ltr'
    );
  });

  it('shows English with a retry when translation is unavailable', async () => {
    profile = { id: 'u1', settings: { report_language: 'id' } };
    assist.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'unavailable' }));
    assist.mockResolvedValueOnce({ translations: { summary: 'Posisi Anda jelas.' } });
    renderPanel();

    expect(await screen.findByText(/belum bisa diterjemahkan/)).toBeInTheDocument();
    expect(screen.getByText(feedback.summary)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Posisi Anda jelas.')).toBeInTheDocument();
  });

  it('lets the learner change the language from the report', async () => {
    renderPanel();

    fireEvent.change(screen.getByRole('combobox', { name: 'Report language' }), {
      target: { value: 'bn' },
    });

    expect(saveLanguage).toHaveBeenCalledWith('bn');
    expect(await screen.findByText('আপনার অবস্থান স্পষ্ট।')).toBeInTheDocument();
  });

  it('says so when the new language could not be saved', async () => {
    saveLanguage.mockRejectedValue(new Error('denied'));
    renderPanel();
    fireEvent.change(screen.getByRole('combobox', { name: 'Report language' }), {
      target: { value: 'hi' },
    });
    expect(await screen.findByText(/आपकी भाषा सेव नहीं हुई/)).toBeInTheDocument();
  });

  it('shows each score against the learner’s target on one scale', () => {
    renderPanel();
    expect(
      screen.getByRole('img', {
        name: 'Grammatical Range and Accuracy: band 5.5, your target is 7.0',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Lowest area')).toBeInTheDocument();
    expect(screen.getByText('At your target')).toBeInTheDocument();
    expect(screen.getByText('Your target')).toBeInTheDocument();
  });

  it('keeps the top card short: one line per score, details folded away', () => {
    useWritingTestStore.setState({ feedbacks: { 'Task 1': null, 'Task 2': feedback } });
    const marked = {
      ...feedback,
      scoreAgreement: { sampleCount: 2, maxSpread: 0 },
      criterionNotes: { LexicalResource: 'Word choice repeats.' },
    };
    render(
      <MemoryRouter>
        <FeedbackPanel feedback={marked} reportSessionId="s-1" />
      </MemoryRouter>
    );
    const card = screen.getByRole('region', { name: 'Task 2 result' });
    const details = within(card).getByText('About these four scores').closest('details');

    // Folded, but still on the page for anyone who opens it.
    expect(details).not.toHaveAttribute('open');
    for (const text of [
      'Did you answer every part of the question?',
      'Word choice repeats.',
      'Marked 2 times. Every mark agreed.',
    ])
      expect(details).toContainElement(within(card).getByText(text));

    // Each score is real text beside its track, not a label floating over the line.
    const rows = within(card)
      .getAllByRole('listitem')
      .filter((row) => row.dataset.criterion);
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      const track = within(row).getByRole('img');
      expect(track).toHaveTextContent('');
      expect(within(row).getByText(/^\d\.\d$/)).toBeInTheDocument();
    }
  });

  it('puts language messages under the score card, not above it', async () => {
    profile = { id: 'u1', settings: { report_language: 'bn' } };
    renderPanel();
    const note = await screen.findByText(/ব্যাখ্যাগুলো বাংলা ভাষায়/);
    const card = screen.getByRole('region', { name: 'Task 2 ফলাফল' });
    expect(card.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the target out for a learner who has not set one', () => {
    profile = { id: 'u1', settings: { report_language: 'en' } };
    renderPanel();
    expect(screen.queryByText('Your target')).not.toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Grammatical Range and Accuracy: band 5.5' })
    ).toBeInTheDocument();
  });

  it('writes a stronger paragraph only when asked, then compares Band 7 and 8', async () => {
    renderPanel();
    const section = screen.getByRole('region', { name: 'Your paragraph next to a stronger one' });
    expect(assist).not.toHaveBeenCalled();

    fireEvent.click(within(section).getByRole('button', { name: 'Show the Band 7 version' }));

    expect(await within(section).findByText('Reason 7.')).toBeInTheDocument();
    expect(assist).toHaveBeenLastCalledWith({
      sessionId: 's-1',
      taskType: 'Task 2',
      operation: 'model',
      band: 7,
      language: 'en',
    });
    expect(within(section).getByText(/Band 7 paragraph 1:/)).toBeInTheDocument();

    fireEvent.click(within(section).getByRole('radio', { name: 'Body 2' }));
    expect(within(section).getByText(/Band 7 paragraph 2:/)).toBeInTheDocument();

    fireEvent.click(within(section).getByRole('radio', { name: 'Band 8' }));
    fireEvent.click(within(section).getByRole('button', { name: 'Show the Band 8 version' }));
    expect(await within(section).findByText('Reason 8.')).toBeInTheDocument();
  });

  it('explains a failed comparison and lets the learner try again', async () => {
    assist.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'rate_limited' }));
    renderPanel();
    const section = screen.getByRole('region', { name: 'Your paragraph next to a stronger one' });

    fireEvent.click(within(section).getByRole('button', { name: 'Show the Band 7 version' }));
    expect(await within(section).findByRole('alert')).toHaveTextContent(/lot of requests/);

    fireEvent.click(within(section).getByRole('button', { name: 'Try again' }));
    expect(await within(section).findByText('Reason 7.')).toBeInTheDocument();
  });

  it('offers no translation or comparison for a report without a saved session', () => {
    profile = { id: 'u1', settings: { report_language: 'bn' } };
    renderPanel({ reportSessionId: undefined });
    expect(assist).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: /stronger|সংস্করণ/ })).not.toBeInTheDocument();
    expect(screen.getByText(feedback.summary)).toBeInTheDocument();
  });

  it('maps the essay paragraph by paragraph and can show it with numbered marks', () => {
    renderPanel();
    const map = screen.getByRole('region', { name: 'Your essay at a glance' });
    for (const name of ['Introduction', 'Body 1', 'Body 2', 'Conclusion'])
      expect(within(map).getByText(name)).toBeInTheDocument();
    expect(within(map).getByText('1 to fix')).toBeInTheDocument();

    // One card holds the map and the marked essay.
    expect(screen.queryByRole('region', { name: 'Your essay with marks' })).not.toBeInTheDocument();
    expect(within(map).queryByText('give more people')).not.toBeInTheDocument();
    fireEvent.click(within(map).getByRole('button', { name: 'Show my essay' }));
    expect(within(map).getByText('give more people')).toBeInTheDocument();
  });

  it('puts the fixes before the praise, and ends with what to practise', () => {
    renderPanel();
    const order = [
      'Also work on',
      'Your essay at a glance',
      'Fix these',
      'What’s already working',
      'Practise next',
    ]
      .map((name) => screen.queryByRole('region', { name }))
      .filter(Boolean);
    expect(order.at(-1)).toHaveAccessibleName('Practise next');
    for (let i = 1; i < order.length; i += 1)
      expect(
        order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
  });

  it('turns this essay’s mistakes into drills with somewhere to go', () => {
    renderPanel();
    const next = screen.getByRole('region', { name: 'Practise next' });

    expect(within(next).getByText('Rewrite Body 1')).toBeInTheDocument();
    expect(within(next).getByText('Practise grammar and spelling')).toBeInTheDocument();
    expect(within(next).getByRole('link', { name: /Open Grammar Lab/ })).toHaveAttribute(
      'href',
      '/grammar'
    );
    expect(within(next).getByRole('link', { name: /Write another essay/ })).toHaveAttribute(
      'href',
      '/writing'
    );
    // Ask Ava needs a coaching session; this report has none.
    expect(within(next).queryByText('Ask Ava about this essay')).not.toBeInTheDocument();
  });

  it('opens the stronger version of the paragraph a drill names', () => {
    const scrolled = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrolled;
    renderPanel();
    const next = screen.getByRole('region', { name: 'Practise next' });
    fireEvent.click(screen.getByRole('radio', { name: 'Body 2' }));

    fireEvent.click(within(next).getByRole('button', { name: 'See a stronger version' }));

    expect(screen.getByRole('radio', { name: 'Body 1' })).toBeChecked();
    expect(scrolled).toHaveBeenCalled();
  });

  it('saves a suggested word to the learner’s vocabulary', async () => {
    const richer = {
      ...feedback,
      vocabularyEnhancements: [
        { original: 'heavy', alternatives: ['substantial', 'considerable'], context: 'x' },
      ],
    };
    useWritingTestStore.setState({ feedbacks: { 'Task 1': null, 'Task 2': richer } });
    render(
      <MemoryRouter>
        <FeedbackPanel feedback={richer} reportSessionId="s-1" />
      </MemoryRouter>
    );
    const next = screen.getByRole('region', { name: 'Practise next' });
    // Slashes, because a suggested phrase can contain commas of its own.
    expect(within(next).getByText('substantial / considerable')).toBeInTheDocument();

    fireEvent.click(within(next).getByRole('button', { name: 'Save substantial' }));

    expect(saveWord).toHaveBeenCalledWith(
      expect.objectContaining({ word: 'substantial', original: 'heavy' })
    );
  });

  it('renders a report saved before summaries and priorities existed', () => {
    const legacy = {
      overallBand: 7,
      taskType: 'Task 2',
      criteriaScores: { TaskResponse: 7, CoherenceAndCohesion: 7 },
      weaknesses: ['Linking is repetitive.'],
      suggestions: ['Vary how you link ideas.'],
      corrections: [{ original: 'a informations', correction: 'information', explanation: 'x' }],
      strengths: ['Clear.'],
      annotations: [],
    };
    render(
      <MemoryRouter>
        <FeedbackPanel feedback={legacy} reportSessionId="s-2" />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Linking is repetitive.' })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Your essay at a glance' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /stronger one/ })).not.toBeInTheDocument();
  });
});
