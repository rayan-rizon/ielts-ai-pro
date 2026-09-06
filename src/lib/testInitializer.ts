/**
 * Unified test initialization utility for Reading and Listening tests.
 * Batches database queries and standardizes session management.
 */

import { supabase } from '@/lib/supabase';
import { Passage, Question, User } from '@/entities';

// Use looser types that are compatible with the actual entity responses
interface TestSession {
  id: string;
  user_id: string;
  passage_id?: string;
  test_type: string;
  is_completed?: boolean;
  created_at?: string;
  content_data?: {
    passage_id?: string;
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface UserData {
  id: string;
  [key: string]: unknown;
}

interface Section {
  section_number: number;
  title: string;
  passage_name?: string;
  content: string;
  question_groups: unknown[];
  [key: string]: unknown;
}

interface InitializeTestParams {
  type: 'reading' | 'listening';
  id: string;
  isRetake?: boolean;
  viewResults?: boolean;
  user?: UserData | null;
}

interface InitializeTestResult {
  testData: {
    title: string;
    content: unknown;
    sections?: Section[];
    [key: string]: unknown;
  };
  questions: Array<Record<string, unknown>>;
  session: TestSession | null | undefined;
  user: UserData | null;
}

interface CreateSessionParams {
  userId: string;
  passageId: string;
  type: 'reading' | 'listening';
  testMode?: 'practice' | 'exam';
  durationSeconds?: number;
  learningPathActivityId?: string | null;
}

const DATABASE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isDatabaseId = (id: unknown): id is string =>
  typeof id === 'string' && DATABASE_ID_PATTERN.test(id);

/**
 * Initialize a test (Reading or Listening) with batched queries.
 */
export async function initializeTest({
  type,
  id,
  isRetake = false,
  viewResults = false,
  user: passedUser = null,
}: InitializeTestParams): Promise<InitializeTestResult> {
  if (!['reading', 'listening'].includes(type)) {
    throw new Error(`Invalid test type: ${type}`);
  }

  if (!isDatabaseId(id)) {
    throw new Error(`Invalid ${type} test identifier`);
  }

  // Step 1: Parallel fetch - check session AND get user simultaneously
  const [sessionResult, userData] = await Promise.all([
    // Check if ID is a session
    supabase.from('test_sessions').select('*').eq('id', id).maybeSingle(),
    // Get current user - use passed user if available, otherwise fetch
    passedUser ? Promise.resolve(passedUser) : User.me().catch(() => null),
  ]);

  const sessionFromUrl = sessionResult?.data as TestSession | null;
  if (sessionFromUrl?.paired_room_id) {
    const { pairedRequest } = await import('@/features/testing/paired/pairedApi');
    const room = await pairedRequest('get', String(sessionFromUrl.paired_room_id), {
      include_snapshot: true,
    });
    if (room.state !== 'complete')
      throw new Error('Open this attempt from its paired test invitation');
    return { ...room.snapshot, session: sessionFromUrl, user: userData };
  }

  // Determine passage ID
  const passageId: string =
    sessionFromUrl?.passage_id ||
    sessionFromUrl?.content_data?.passage_id ||
    sessionFromUrl?.content_data?.id ||
    id;

  // Step 2: Parallel fetch - get passage AND questions
  // Use type assertions at runtime to handle the entity methods
  const PassageEntity = Passage as Record<string, unknown>;
  const QuestionEntity = Question as Record<string, unknown>;

  const [passage, questions] = await Promise.all([
    typeof PassageEntity.getByIdCached === 'function'
      ? (PassageEntity.getByIdCached as (id: string) => Promise<unknown>)(passageId)
      : Passage.getById(passageId),
    typeof QuestionEntity.listByPassageIdCached === 'function'
      ? (QuestionEntity.listByPassageIdCached as (id: string) => Promise<unknown[]>)(passageId)
      : Question.list({ passage_id: passageId }, 'question_number', 100),
  ]);

  const passageData = passage as Record<string, unknown> | null;
  const questionsData = (questions || []) as Array<Record<string, unknown>>;

  if (!passageData) {
    throw new Error(`${type === 'reading' ? 'Passage' : 'Test'} not found`);
  }

  // Step 2.5: Content parsing (needed early for enrichment)
  let parsedContent: any[] = [];
  if (passageData.content) {
    try {
      parsedContent =
        typeof passageData.content === 'string'
          ? JSON.parse(passageData.content)
          : (passageData.content as unknown[]);
    } catch (e) {
      console.warn('Could not parse passage content', e);
    }
  }

  // Standardize correct_answer parsing for Listening
  const processedQuestions: Array<
    Record<string, unknown> & { section: number; correct_answer: unknown }
  > = questionsData.map((q) => {
    let parsedCorrect: unknown = q.correct_answer;
    if (
      type === 'listening' &&
      typeof q.correct_answer === 'string' &&
      q.correct_answer.startsWith('[') &&
      q.correct_answer.endsWith(']')
    ) {
      try {
        parsedCorrect = JSON.parse(q.correct_answer);
      } catch {
        // Ignore JSON parse errors, keep original value
      }
    }

    const sectionValue = q.section;
    const partNumber = q.part_number;

    return {
      ...q,
      section:
        (typeof sectionValue === 'string'
          ? parseInt(sectionValue, 10)
          : (sectionValue as number)) ||
        (type === 'listening' ? parseInt(String(partNumber), 10) : 1) ||
        1,
      correct_answer: parsedCorrect,
    };
  });

  // Enrich listening questions with data from passage content (the source of truth for grouping/titles)
  if (type === 'listening' && Array.isArray(parsedContent)) {
    parsedContent.forEach((section: any) => {
      if (section.question_groups) {
        section.question_groups.forEach((group: any) => {
          if (group.title && group.questions && group.questions.length > 0) {
            const firstQInGroup = group.questions[0];
            // Find the corresponding question in our processed list
            const match = processedQuestions.find((q) => q.id === firstQInGroup.id);
            if (match && !match.mcq_title) {
              match.mcq_title = group.title;
            }
          }
        });
      }
    });
  }

  const sortedQuestions = processedQuestions.sort((a, b) => {
    const sectionA =
      typeof a.section === 'number' ? a.section : parseInt(String(a.section || a.part_number || 1));
    const sectionB =
      typeof b.section === 'number' ? b.section : parseInt(String(b.section || b.part_number || 1));
    if (sectionA !== sectionB) return sectionA - sectionB;
    return ((a.question_number as number) || 0) - ((b.question_number as number) || 0);
  });

  // Step 3: Session resolution logic
  let resolvedSession: TestSession | null | undefined = sessionFromUrl;

  if (!resolvedSession && userData && !isRetake) {
    // Look for existing sessions for this specific passage
    const { data: userSessions } = await supabase
      .from('test_sessions')
      .select(
        'id, user_id, passage_id, test_type, test_mode, is_completed, answers, band_score, score, content_data, created_at, started_at, completed_at, time_remaining, time_spent, duration_minutes, user_responses'
      )
      .eq('user_id', userData.id)
      .eq('test_type', type)
      .eq('passage_id', passageData.id)
      .order('created_at', { ascending: false });

    const sessions = userSessions as TestSession[] | null;

    if (sessions?.length) {
      if (viewResults) {
        // Find most recent COMPLETED session for this passage
        resolvedSession = sessions.find((s) => s.is_completed);
      } else {
        // Find latest IN-PROGRESS session
        resolvedSession = sessions.find((s) => !s.is_completed);
      }
    }
  }

  // Step 4: Content parsing (already done above)
  let sections: Section[] = [];
  if (type === 'reading' && Array.isArray(parsedContent)) {
    sections = parsedContent.map((section: unknown, index: number) => {
      const s = section as Record<string, unknown>;
      return {
        section_number: (s.section_number as number) || index + 1,
        title: (s.title as string) || `Section ${index + 1}`,
        passage_name: (s.passage_name as string) || (s.title as string) || `Passage ${index + 1}`,
        content: (s.content as string) || '',
        question_groups: (s.question_groups as unknown[]) || [],
        ...s,
      };
    });
  } else if (type === 'reading') {
    sections = [
      {
        section_number: 1,
        title: (passageData.title as string) || 'Reading Passage',
        content: (passageData.content as string) || '',
        question_groups: [],
      },
    ];
  }

  // Step 5: Title standardization
  let displayTitle = (passageData.title as string) || 'Test';
  const year = passageData.cambridge_year as number | undefined;
  const testNum = passageData.cambridge_test_number as number | undefined;
  if (year && testNum) {
    const bookNumber = year - 2005;
    displayTitle = `IELTS ${bookNumber} Academic ${year} Test ${testNum}`;
  }

  return {
    testData: {
      ...passageData,
      title: displayTitle,
      content: type === 'listening' ? parsedContent : passageData.content,
      sections: type === 'reading' ? sections : undefined,
    },
    questions: sortedQuestions,
    session: resolvedSession,
    user: userData,
  };
}

/**
 * Create a new test session
 */
export async function createTestSession({
  userId,
  passageId,
  type,
  testMode = 'practice',
  durationSeconds = 60 * 60,
  learningPathActivityId = null,
}: CreateSessionParams): Promise<TestSession> {
  const durationMinutes = Math.ceil(durationSeconds / 60);
  const { data, error } = await supabase
    .from('test_sessions')
    .insert({
      user_id: userId,
      test_type: type,
      test_mode: testMode === 'exam' ? 'mock' : 'practice',
      is_completed: false,
      duration_minutes: durationMinutes,
      passage_id: passageId,
      learning_path_activity_id: learningPathActivityId,
      content_data: {
        passage_id: passageId,
        test_mode: testMode,
        duration_seconds: durationSeconds,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data as TestSession;
}
