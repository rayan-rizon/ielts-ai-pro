import React from 'react';
import { fireEvent, render, renderHook, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const assist = vi.hoisted(() => ({ request: null }));
vi.mock('@/features/testing/writing/report/reportAssistClient', () => ({
  requestReportAssist: (request) => assist.request(request),
}));

import {
  resetTranslationAgreementsForTests,
  useTranslatedReport,
} from '@/features/testing/writing/report/useTranslatedReport';
import { bandsAbove } from '@/features/testing/writing/report/useReportContent';
import { reportedWords } from '@/features/testing/writing/report/reportViewModel';
import { LanguageNotice } from '@/features/testing/writing/report/components/ReportToolbar';
import { reportT } from '@/features/testing/writing/report/reportStrings';
import AnnotatedText from '@/components/writing/AnnotatedText';

const feedback = { taskType: 'Task 2', summary: 'Your position is clear.', generatedAt: 'g1' };
const refuse = (code) => Object.assign(new Error(code), { code });
const use = () =>
  renderHook(() => useTranslatedReport({ feedback, sessionId: 's1', language: 'bn' }));

beforeEach(() => resetTranslationAgreementsForTests());

describe('spending a review on a translation', () => {
  beforeEach(() => {
    assist.request = vi.fn(async (request) => {
      if (!request.useCredit) throw refuse('credit_required');
      return { translations: { summary: 'অনুবাদ' } };
    });
  });

  it('never sends a charge on its own, and keeps English while offering', async () => {
    const { result } = use();
    await waitFor(() => expect(result.current.status).toBe('offer'));
    expect(result.current.shown.summary).toBe(feedback.summary);
    expect(assist.request.mock.calls.every(([request]) => !request.useCredit)).toBe(true);
  });

  it('translates both panes after one tap', async () => {
    const report = use();
    const essay = use();
    await waitFor(() => expect(report.result.current.status).toBe('offer'));
    act(() => report.result.current.translate());
    await waitFor(() => expect(report.result.current.status).toBe('ready'));
    await waitFor(() => expect(essay.result.current.status).toBe('ready'));
    expect(essay.result.current.shown.summary).toBe('অনুবাদ');
  });

  it('says when no review is left', async () => {
    assist.request = vi.fn(async (request) => {
      throw refuse(request.useCredit ? 'no_credit' : 'credit_required');
    });
    const { result } = use();
    await waitFor(() => expect(result.current.status).toBe('offer'));
    act(() => result.current.translate());
    await waitFor(() => expect(result.current.status).toBe('no_credit'));
  });

  it('shows the cost on the button', () => {
    const onTranslate = vi.fn();
    render(<LanguageNotice t={reportT('bn')} status="offer" onTranslate={onTranslate} />);
    fireEvent.click(screen.getByRole('button', { name: reportT('bn')('creditButton') }));
    expect(onTranslate).toHaveBeenCalled();
  });
});

describe('bands worth comparing with', () => {
  it.each([
    [5.5, [7, 8]],
    [6.5, [7, 8]],
    [7, [8]],
    [7.5, [8]],
    [8, []],
    [8.5, []],
  ])('score %s offers %j', (score, bands) => expect(bandsAbove(score)).toEqual(bands));
});

describe('the words and linking section beside the report', () => {
  const vocabulary = ['good', 'big', 'bad', 'many'].map((original) => ({
    original,
    alternatives: [`better ${original}`],
  }));
  const analysis = {
    linking: [{ category: 'Contrast', phrases: ['however'] }],
    repeatedWords: [],
    paragraphOpenings: [],
    paragraphCount: 1,
  };
  const show = (language, words = vocabulary) =>
    render(
      <AnnotatedText
        t={reportT(language)}
        text="It is good. However, it is big, bad and many."
        vocabularyEnhancements={words}
        reportedVocabulary={reportedWords(words).map((entry) => entry.original)}
        writingAnalysis={analysis}
      />
    );

  it('is shown in the report language, with the learner’s words left alone', () => {
    show('bn');
    for (const key of ['wlTitle', 'wlLinkingTitle', 'linkContrast'])
      expect(screen.getByText(reportT('bn')(key))).toBeTruthy();
    expect(screen.queryByText('Words and linking')).toBeNull();
    expect(screen.getByText('however')).toBeTruthy();
  });

  it('only lists words the report has not already shown', () => {
    show('en');
    expect(screen.getByText('better many')).toBeTruthy();
    expect(screen.queryByText('better good')).toBeNull();
  });

  it('drops the word cards when the report shows them all', () => {
    show('en', vocabulary.slice(0, 3));
    expect(screen.queryByText('Better words for this essay')).toBeNull();
    expect(screen.getByText('Linking words you used')).toBeTruthy();
  });
});
