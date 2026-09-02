import { describe, expect, it } from 'vitest';
import {
  EXAM_DURATION_SECONDS,
  getExamRemainingSeconds,
  getListeningExamEligibility,
  getReadingExamEligibility,
  getSessionTestMode,
  getWritingExamEligibility,
  mergeDefaultTestMode,
  normalizeTestMode,
  resolveNewAttemptMode,
  toPersistedTestMode,
} from '@/features/testing/shared/testMode';

const questions = Array.from({ length: 40 }, (_, index) => ({
  id: `q-${index + 1}`,
  type: 'multiple_choice',
  question_number: index + 1,
}));

describe('test mode resolution', () => {
  it('uses Practice when Profile settings are missing, null, or invalid', () => {
    expect(resolveNewAttemptMode({ settings: undefined })).toBe('practice');
    expect(resolveNewAttemptMode({ settings: null })).toBe('practice');
    expect(resolveNewAttemptMode({ settings: { default_test_mode: 'timed' } })).toBe('practice');
  });

  it('uses the valid Profile default unless an explicit URL override is present', () => {
    expect(resolveNewAttemptMode({ settings: { default_test_mode: 'exam' } })).toBe('exam');
    expect(
      resolveNewAttemptMode({
        search: '?mode=practice',
        settings: { default_test_mode: 'exam' },
      })
    ).toBe('practice');
    expect(
      resolveNewAttemptMode({
        search: '?mode=exam',
        settings: { default_test_mode: 'practice' },
      })
    ).toBe('exam');
  });

  it('maps learner Exam Mode to the existing mock database value', () => {
    expect(toPersistedTestMode('exam')).toBe('mock');
    expect(toPersistedTestMode('practice')).toBe('practice');
    expect(getSessionTestMode({ test_mode: 'mock' })).toBe('exam');
    expect(normalizeTestMode('unknown')).toBe('practice');
  });

  it('merges the Profile preference without overwriting other settings', () => {
    expect(mergeDefaultTestMode({ theme: 'dark', notifications: true }, 'exam')).toEqual({
      theme: 'dark',
      notifications: true,
      default_test_mode: 'exam',
    });
  });
});

describe('exam eligibility', () => {
  it('requires three Reading sections and exactly 40 questions', () => {
    expect(
      getReadingExamEligibility(
        { sections: [{ section_number: 1 }, { section_number: 2 }, { section_number: 3 }] },
        questions
      ).eligible
    ).toBe(true);
    expect(
      getReadingExamEligibility({ sections: [{ section_number: 1 }] }, questions).eligible
    ).toBe(false);
  });

  it('requires four Listening parts, 40 questions, and audio for every part', () => {
    const content = Array.from({ length: 4 }, (_, index) => ({
      audio_url: `https://example.com/part-${index + 1}.mp3`,
    }));
    expect(getListeningExamEligibility({ content }, questions).eligible).toBe(true);
    expect(
      getListeningExamEligibility(
        { content: content.map((part, index) => (index === 2 ? {} : part)) },
        questions
      ).eligible
    ).toBe(false);
  });

  it('requires both Writing tasks', () => {
    expect(getWritingExamEligibility({ 'Task 1': {}, 'Task 2': {} }).eligible).toBe(true);
    expect(getWritingExamEligibility({ 'Task 1': {} }).eligible).toBe(false);
  });
});

describe('server-backed exam deadline', () => {
  it('derives remaining time from the stored server-created timestamp', () => {
    const startedAt = Date.parse('2026-07-25T10:00:00.000Z');
    const session = { created_at: new Date(startedAt).toISOString(), test_mode: 'mock' };
    expect(getExamRemainingSeconds(session, EXAM_DURATION_SECONDS, startedAt + 125_000)).toBe(3475);
  });

  it('clamps expired attempts at zero', () => {
    const startedAt = Date.parse('2026-07-25T10:00:00.000Z');
    const session = { created_at: new Date(startedAt).toISOString(), test_mode: 'mock' };
    expect(getExamRemainingSeconds(session, EXAM_DURATION_SECONDS, startedAt + 4_000_000)).toBe(0);
  });
});
