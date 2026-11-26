import {
  buildLibraryGroups,
  rankPracticeNeeds,
  scoreLibraryGroup,
  practiceTips,
} from '../_shared/skill-lab/libraryPractice.js';
import { isAnswerMap, type PracticeDb } from './librarySession.ts';

export const groupsOf = (catalogue: any) =>
  (catalogue.passages || []).flatMap((p: any) => buildLibraryGroups(p, catalogue.questions || []));

const groupsRpcName = (version: unknown) =>
  version === 2 ? 'practice_library_dashboard_groups_v2' : 'practice_library_dashboard_groups';

async function loadHistory({ rpc, authId }: PracticeDb, historyRows: any[]) {
  const sources = [...new Set(historyRows.map((row: any) => row.passage_id).filter(Boolean))];
  if (!sources.length) return [];
  const catalogue = await rpc('practice_library_catalogue_for_sources', {
    p_auth: authId,
    p_sources: sources,
    p_include_explanations: false,
  });
  return groupsOf(catalogue);
}

function withFamiliarity(summaries: any[], exposures: any[], historyRows: any[]) {
  const exposedGroups = new Set(exposures.map((e: any) => e.group_id));
  const seenSources = new Set([
    ...exposures.map((e: any) => e.source_id),
    ...historyRows.map((row: any) => row.passage_id),
  ]);
  const familiarity = (group: any) => {
    if (exposedGroups.has(group.id)) return 'repeated';
    return seenSources.has(group.sourceId) ? 'familiar' : 'new';
  };
  return summaries.map((group: any) => ({ ...group, familiarity: familiarity(group) }));
}

/** Evidence from full tests, re-scored from the saved answers. */
function testAttempts(historyRows: any[], historyGroups: any[], categoryByGroup: Map<any, any>) {
  // Aggregate legacy totals are not enough to reconstruct the student's answer.
  return historyRows
    .filter((old: any) => isAnswerMap(old.content_data?.savedAnswers))
    .flatMap((old: any) =>
      historyGroups
        .filter((g: any) => g.sourceId === old.passage_id && g.eligible)
        .map((group: any) => ({
          focus: categoryByGroup.get(group.id) || group.focus,
          sourceId: group.sourceId,
          groupId: group.id,
          sessionId: old.id,
          title: group.title,
          completedAt: old.completed_at,
          ...scoreLibraryGroup(old.test_type, group.questions, old.content_data.savedAnswers),
        }))
    );
}

function practiceAttempts(sessions: any[], summaries: any[], categoryByGroup: Map<any, any>) {
  const titleByGroup = new Map(summaries.map((g: any) => [g.id, g.title]));
  return sessions
    .filter((s: any) => s.completed_at && s.result)
    .map((s: any) => ({
      practice: true,
      focus: categoryByGroup.get(s.group_id) || s.focus,
      sourceId: s.source_id,
      groupId: s.group_id,
      sessionId: s.id,
      title: titleByGroup.get(s.group_id),
      completedAt: s.completed_at,
      nextReviewAt: s.next_review_at,
      assisted: s.assisted,
      repeated: s.familiarity === 'repeated',
      familiar: s.familiarity === 'familiar',
      ...s.result,
    }));
}

/** Everything the dashboard shows, which choosing a new set also depends on. */
export async function loadOverview(db: PracticeDb) {
  const { rpc, state, authId, body } = db;
  const [dashboard, rawSummaries, history] = await Promise.all([
    state('dashboard'),
    rpc(groupsRpcName(body.catalogueVersion), { p_auth: authId }),
    rpc('practice_library_history', { p_auth: authId }),
  ]);
  const historyRows = history || [];
  const historyGroups = await loadHistory(db, historyRows);
  const summaries = withFamiliarity(rawSummaries || [], dashboard.exposures, historyRows);
  const categoryByGroup = new Map<string, string>(
    summaries.map((group: any) => [group.id, group.category || group.focus])
  );
  const categories = new Set(categoryByGroup.values());
  const attempts = [
    ...testAttempts(historyRows, historyGroups, categoryByGroup),
    ...practiceAttempts(dashboard.sessions, summaries, categoryByGroup),
  ];
  const recommendations = rankPracticeNeeds(attempts).filter((r: any) => categories.has(r.focus));
  return { dashboard, historyRows, summaries, categoryByGroup, categories, recommendations };
}

export type Overview = Awaited<ReturnType<typeof loadOverview>>;

export function dashboardView({ dashboard, summaries, categories, recommendations }: Overview) {
  const categoryTips = Object.fromEntries(
    Array.from(categories, (category) => [category, practiceTips(category)[0]])
  );
  return { ...dashboard, groups: summaries, recommendations, categoryTips };
}
