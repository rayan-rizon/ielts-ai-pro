import {
  scoreLibraryGroup,
  publicPracticeContent,
  practiceTips,
  savedLibraryExplanations,
  publicLibraryQuestions,
  libraryGroupCategory,
} from '../_shared/skill-lab/libraryPractice.js';
import { withDisplayText } from './libraryDisplayText.ts';

const MAX_ANSWERS_LENGTH = 30000;

export const isAnswerMap = (value: unknown) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** The database calls one practice request makes, bound to its learner. */
export function practiceDb(client: any, authId: string, body: any) {
  const rpc = async (name: string, args: any) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  };
  const state = (action: string, data = {}) =>
    rpc('practice_library_state', {
      p_auth: authId,
      p_action: action,
      p_session: body.sessionId || null,
      p_data: data,
    });
  return { client, authId, body, rpc, state };
}

export type PracticeDb = ReturnType<typeof practiceDb>;

const revealedExplanations = (session: any, questions: any[]) =>
  session.completed_at ? savedLibraryExplanations(questions) : [];

/** What the learner may see of a stored session. */
export async function sessionView(client: any, s: any) {
  const snapshot = s.snapshot || {};
  const category = libraryGroupCategory(s.focus, snapshot.questions);
  const source = await withDisplayText(client, snapshot.source, snapshot.questions);
  const mistakeSource = await withDisplayText(
    client,
    snapshot.mistake,
    snapshot.mistake?.questions
  );
  return {
    id: s.id,
    focus: s.focus,
    category,
    answers: s.answers,
    stage: s.stage,
    completed_at: s.completed_at,
    familiarity: s.familiarity,
    assisted: s.assisted,
    next_review_at: s.next_review_at,
    activity_id: s.activity_id,
    source_session_id: s.source_session_id,
    source: { ...source, content: publicPracticeContent(source.content) },
    questions: publicLibraryQuestions(s.focus.split(':')[0], snapshot.questions),
    tips: practiceTips(category),
    result: s.result,
    // Only previously answered material may include an answer/explanation before submission.
    mistake: mistakeSource.id ? { ...snapshot.mistake, ...mistakeSource } : null,
    explanations: revealedExplanations(s, snapshot.questions),
  };
}

async function submittedSession({ body, state }: PracticeDb) {
  const s = await state('resume');
  if (s.completed_at) return s;
  if (!isAnswerMap(body.answers) || JSON.stringify(body.answers).length > MAX_ANSWERS_LENGTH)
    throw new Error('Invalid answers');
  const result = scoreLibraryGroup(s.focus.split(':')[0], s.snapshot.questions, body.answers);
  return await state('complete', { answers: body.answers, result });
}

/** Actions on one existing session. Each resolves to the stored session row. */
export const SESSION_ACTIONS = new Map<string, (db: PracticeDb) => Promise<any>>([
  ['resume', ({ state }) => state('resume')],
  ['save', ({ body, state }) => state('save', { answers: body.answers, stage: body.stage })],
  ['submit', submittedSession],
]);
