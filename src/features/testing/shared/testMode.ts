export type TestMode = 'practice' | 'exam';

export const PRACTICE_MODE: TestMode = 'practice';
export const EXAM_MODE: TestMode = 'exam';
export const EXAM_DURATION_SECONDS = 60 * 60;
export const LISTENING_REVIEW_SECONDS = 2 * 60;

type SettingsLike = { default_test_mode?: unknown } | null | undefined;
type SessionLike = {
  test_mode?: unknown;
  created_at?: string | null;
  started_at?: string | null;
  content_data?: Record<string, unknown> | null;
};

export function normalizeTestMode(value: unknown): TestMode {
  return value === EXAM_MODE || value === 'mock' ? EXAM_MODE : PRACTICE_MODE;
}

export function resolveNewAttemptMode({
  search = '',
  settings,
}: {
  search?: string;
  settings?: SettingsLike;
}): TestMode {
  const queryMode = new URLSearchParams(search).get('mode');
  if (queryMode === EXAM_MODE || queryMode === PRACTICE_MODE) return queryMode;
  return normalizeTestMode(settings?.default_test_mode);
}

export function getSessionTestMode(session?: SessionLike | null): TestMode {
  return normalizeTestMode(session?.test_mode);
}

export function toPersistedTestMode(mode: TestMode): 'practice' | 'mock' {
  return mode === EXAM_MODE ? 'mock' : 'practice';
}

export function mergeDefaultTestMode(
  settings: Record<string, unknown> | null | undefined,
  mode: unknown
) {
  return {
    ...(settings || {}),
    default_test_mode: normalizeTestMode(mode),
  };
}

export function getExamRemainingSeconds(
  session: SessionLike | null | undefined,
  durationSeconds = EXAM_DURATION_SECONDS,
  now = Date.now()
): number {
  if (!session) return durationSeconds;
  const startedAt = session.started_at || session.created_at;
  const startedAtMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  if (!Number.isFinite(startedAtMs)) return durationSeconds;
  return Math.max(0, durationSeconds - Math.floor((now - startedAtMs) / 1000));
}

export function getReadingExamEligibility(testData: any, questions: any[]) {
  const sectionNumbers = new Set(
    (testData?.sections || []).map((section: any, index: number) =>
      Number(section?.section_number || index + 1)
    )
  );
  const questionCount = questions.reduce(
    (total, question) => total + Math.max(1, getQuestionCount(question)),
    0
  );
  const eligible = sectionNumbers.size === 3 && questionCount === 40;
  return {
    eligible,
    reason: eligible
      ? ''
      : `Exam Mode requires 3 Reading sections and 40 questions. This test has ${sectionNumbers.size} section${sectionNumbers.size === 1 ? '' : 's'} and ${questionCount} questions.`,
  };
}

export function getListeningParts(testData: any): any[] {
  if (Array.isArray(testData?.content)) return testData.content;
  return testData?.audio_url ? [testData] : [];
}

export function getListeningExamEligibility(testData: any, questions: any[]) {
  const parts = getListeningParts(testData);
  const questionCount = questions.reduce(
    (total, question) => total + Math.max(1, getQuestionCount(question)),
    0
  );
  const audioCount = parts.filter((part) => {
    const audio = part?.audio_url || part?.audioUrl;
    return typeof audio === 'string' && audio.trim().length > 0;
  }).length;
  const eligible = parts.length === 4 && questionCount === 40 && audioCount === 4;
  return {
    eligible,
    reason: eligible
      ? ''
      : `Exam Mode requires 4 Listening parts, 40 questions, and audio for every part. This test has ${parts.length} part${parts.length === 1 ? '' : 's'}, ${questionCount} questions, and ${audioCount} valid audio file${audioCount === 1 ? '' : 's'}.`,
  };
}

export function getWritingExamEligibility(compositeTasks: Record<string, unknown> | null) {
  const hasTask1 = Boolean(compositeTasks?.['Task 1']);
  const hasTask2 = Boolean(compositeTasks?.['Task 2']);
  const eligible = hasTask1 && hasTask2;
  return {
    eligible,
    reason: eligible ? '' : 'Exam Mode requires both Writing Task 1 and Writing Task 2.',
  };
}
import { getQuestionCount } from '@/lib/utils';
