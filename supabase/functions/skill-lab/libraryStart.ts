import {
  scoreLibraryGroup,
  publicPracticeContent,
  libraryGroupSource,
  savedLibraryExplanations,
  publicLibraryQuestions,
  pickPracticeMistake,
} from '../_shared/skill-lab/libraryPractice.js';
import { groupsOf, type Overview } from './libraryOverview.ts';
import type { PracticeDb } from './librarySession.ts';

type PracticeMistake = {
  sessionId: string;
  groupId: string;
  sourceId: string;
  practice?: boolean;
};

const UNAVAILABLE = 'This question set is unavailable. Choose another library set.';

/** The earlier mistake this new set asks the learner to retry first, if any. */
function chooseMistake(
  overview: Overview,
  summary: any,
  sourceSessionId: string
): PracticeMistake | undefined {
  const category = overview.categoryByGroup.get(summary.id);
  const need = overview.recommendations.find((r: any) => r.focus === category);
  return pickPracticeMistake(need?.mistakes, summary.sourceId, sourceSessionId);
}

async function loadSelection(
  { rpc, authId, body }: PracticeDb,
  summary: any,
  mistake?: PracticeMistake
) {
  const olderTestSource = mistake && !mistake.practice ? mistake.sourceId : null;
  const catalogue = await rpc('practice_library_catalogue_for_sources', {
    p_auth: authId,
    p_sources: [...new Set([summary.sourceId, olderTestSource].filter(Boolean))],
    p_include_explanations: true,
  });
  const groups = groupsOf(catalogue);
  const group = groups.find((g: any) => g.id === body.groupId && g.eligible);
  if (!group) throw new Error(UNAVAILABLE);
  return { catalogue, groups, group };
}

async function practiceMistake(
  { rpc, authId }: PracticeDb,
  mistake: PracticeMistake,
  focus: string
) {
  const previous = await rpc('practice_library_state', {
    p_auth: authId,
    p_action: 'resume',
    p_session: mistake.sessionId,
    p_data: {},
  });
  if (!previous.completed_at || previous.focus !== focus) return null;
  return {
    ...previous.snapshot.source,
    content: publicPracticeContent(previous.snapshot.source.content),
    questions: publicLibraryQuestions(previous.focus.split(':')[0], previous.snapshot.questions),
    answers: previous.answers,
    result: previous.result,
    explanations: savedLibraryExplanations(previous.snapshot.questions),
  };
}

function testMistake(mistake: PracticeMistake, historyRows: any[], selection: any) {
  const old = historyRows.find((s: any) => s.id === mistake.sessionId);
  const original = selection.groups.find((g: any) => g.id === mistake.groupId);
  const source = selection.catalogue.passages.find((p: any) => p.id === mistake.sourceId);
  if (![old, original, source].every(Boolean)) return null;
  const answers = old.content_data.savedAnswers;
  return {
    ...libraryGroupSource(source, original.questions),
    questions: publicLibraryQuestions(old.test_type, original.questions),
    answers,
    result: scoreLibraryGroup(old.test_type, original.questions, answers),
    explanations: savedLibraryExplanations(original.questions),
  };
}

function mistakeSnapshot(
  db: PracticeDb,
  mistake: PracticeMistake | undefined,
  overview: Overview,
  selection: any
) {
  if (!mistake) return null;
  if (mistake.practice) return practiceMistake(db, mistake, selection.group.focus);
  return testMistake(mistake, overview.historyRows, selection);
}

/** Stores the set's current form; the hash tells whether its content changed. */
async function indexGroup({ rpc }: PracticeDb, group: any, source: any) {
  const snapshot = { questions: group.questions, source, mistake: null };
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const version = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await rpc('practice_library_index', { p_group: { ...group, snapshot, version } });
}

/** A mistake from a full test links the new session back to that test. */
function originSessionId(sourceSessionId: string, mistake?: PracticeMistake) {
  if (sourceSessionId) return sourceSessionId;
  return mistake?.practice ? null : mistake?.sessionId;
}

/** Starts a new session and resolves to its stored row. */
export async function startSession(db: PracticeDb, overview: Overview) {
  const { body, state } = db;
  const summary = overview.summaries.find((g: any) => g.id === body.groupId);
  if (!summary) throw new Error(UNAVAILABLE);
  const mistake = chooseMistake(overview, summary, body.sourceSessionId);
  const selection = await loadSelection(db, summary, mistake);
  const { group, catalogue } = selection;
  const passage = catalogue.passages.find((p: any) => p.id === group.sourceId);
  const source = libraryGroupSource(passage, group.questions);
  const retried = await mistakeSnapshot(db, mistake, overview, selection);
  await indexGroup(db, group, source);
  return await state('start', {
    group_id: group.id,
    request_id: body.requestId,
    source_session_id: originSessionId(body.sourceSessionId, mistake),
    activity_id: body.activityId,
    mistake: retried,
  });
}
