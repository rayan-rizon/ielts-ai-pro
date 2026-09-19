import { describe, it, expect } from 'vitest';
import { handleLibraryPractice } from '../../../supabase/functions/skill-lab/libraryHandler.ts';
import { buildLibraryGroups } from '../../../supabase/functions/_shared/skill-lab/libraryPractice.js';
import fixture from './__fixtures__/skill-lab-catalogue.json';

const PASSAGE: any = (fixture as any).passage;
const QUESTIONS: any[] = (fixture as any).questions;

function stripExplanations(questions: any[]) {
  return questions.map((q) => {
    const { explanation, explanation_data, ...rest } = q;
    return rest;
  });
}

function fixtureSummaries() {
  return buildLibraryGroups(PASSAGE, QUESTIONS)
    .filter((group: any) => group.eligible)
    .map((group: any) => ({
      id: group.id,
      sourceId: group.sourceId,
      title: group.title,
      focus: group.focus,
      total: group.total,
      section: group.source.section,
      startNumber: group.questions[0].question_number,
      audioScope: group.source.audio_scope,
    }));
}

function makeClient(options: { history?: any[] } = {}) {
  const rpcCalls: Array<{ name: string; args: any }> = [];
  let indexedGroup: any = null;

  const client = {
    rpc: async (name: string, args: any) => {
      rpcCalls.push({ name, args });
      if (name === 'practice_library_state') {
        if (args.p_action === 'dashboard') {
          return { data: { exposures: [], sessions: [] }, error: null };
        }
        return {
          data: {
            id: 'session-started',
            focus: indexedGroup?.focus ?? 'reading:multiple_choice',
            answers: {},
            stage: 'answering',
            completed_at: null,
            familiarity: 'new',
            assisted: false,
            next_review_at: null,
            activity_id: null,
            source_session_id: null,
            result: null,
            snapshot: indexedGroup?.snapshot ?? { source: {}, questions: [], mistake: null },
          },
          error: null,
        };
      }
      if (name === 'practice_library_dashboard_groups') {
        return { data: fixtureSummaries(), error: null };
      }
      if (name === 'practice_library_history') {
        return { data: options.history ?? [], error: null };
      }
      if (name === 'practice_library_catalogue_for_sources') {
        const selected = args.p_sources.includes(PASSAGE.id);
        return {
          data: {
            passages: selected ? [PASSAGE] : [],
            questions: selected
              ? args.p_include_explanations
                ? QUESTIONS
                : stripExplanations(QUESTIONS)
              : [],
          },
          error: null,
        };
      }
      if (name === 'practice_library_index') {
        indexedGroup = args.p_group;
        return { data: {}, error: null };
      }
      throw new Error(`unexpected rpc: ${name}`);
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
  };

  return { client, rpcCalls, indexedGroup: () => indexedGroup };
}

async function runDashboard(history?: any[]) {
  const { client, rpcCalls } = makeClient({ history });
  const result = await handleLibraryPractice(client as any, 'auth-fixture', {
    action: 'dashboard',
  });
  return { result, rpcCalls };
}

describe('skill lab targeted catalogue payloads', () => {
  it('loads pre-grouped dashboard metadata without downloading the catalogue', async () => {
    const { result, rpcCalls } = await runDashboard();

    expect((result as any).groups).toEqual(
      fixtureSummaries().map((group) => ({ ...group, familiarity: 'new' }))
    );
    expect(rpcCalls.some((call) => call.name === 'practice_library_dashboard_groups')).toBe(true);
    expect(rpcCalls.some((call) => call.name === 'practice_library_catalogue_static')).toBe(false);
    expect(rpcCalls.some((call) => call.name === 'practice_library_catalogue')).toBe(false);
    expect(rpcCalls.some((call) => call.name === 'practice_library_catalogue_for_sources')).toBe(
      false
    );
  });

  it('downloads full content only for the source being started', async () => {
    const { client, rpcCalls, indexedGroup } = makeClient();
    const dashboard: any = await handleLibraryPractice(client as any, 'auth-fixture', {
      action: 'dashboard',
    });

    rpcCalls.length = 0;
    await handleLibraryPractice(client as any, 'auth-fixture', {
      action: 'start',
      groupId: dashboard.groups[0].id,
      requestId: 'req-targeted-source',
    });

    const call = rpcCalls.find((entry) => entry.name === 'practice_library_catalogue_for_sources');
    expect(call?.args).toEqual({
      p_auth: 'auth-fixture',
      p_sources: [PASSAGE.id],
      p_include_explanations: true,
    });
    expect(indexedGroup().snapshot.questions.length).toBeGreaterThan(0);
    expect(indexedGroup().snapshot.questions[0]).toHaveProperty('explanation');
  });

  it('fetches only attempted sources to reconstruct legacy recommendations', async () => {
    const answers: Record<string, unknown> = {};
    for (const question of QUESTIONS) answers[question.id] = 'A';
    const history = [
      {
        id: 'session-fixture',
        passage_id: PASSAGE.id,
        test_type: PASSAGE.test_type,
        completed_at: '2026-09-01T00:00:00.000Z',
        content_data: { savedAnswers: answers },
      },
    ];

    const { result, rpcCalls } = await runDashboard(history);
    const call = rpcCalls.find((entry) => entry.name === 'practice_library_catalogue_for_sources');

    expect(call?.args).toEqual({
      p_auth: 'auth-fixture',
      p_sources: [PASSAGE.id],
      p_include_explanations: false,
    });
    expect(new Set((result as any).groups.map((group: any) => group.familiarity))).toContain(
      'familiar'
    );
  });

  it('does not fetch source content for history rows without a passage', async () => {
    const { rpcCalls } = await runDashboard([
      {
        id: 'session-empty',
        passage_id: null,
        test_type: 'reading',
        completed_at: '2026-09-01T00:00:00.000Z',
        content_data: { savedAnswers: null },
      },
    ]);

    expect(rpcCalls.some((entry) => entry.name === 'practice_library_catalogue_for_sources')).toBe(
      false
    );
  });
});
