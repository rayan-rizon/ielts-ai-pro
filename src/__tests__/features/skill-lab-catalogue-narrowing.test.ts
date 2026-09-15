import { describe, it, expect } from 'vitest';
import { handleLibraryPractice } from '../../../supabase/functions/skill-lab/libraryHandler.ts';
import fixture from './__fixtures__/skill-lab-catalogue.json';

/**
 * `practice_library_catalogue` used to return `to_jsonb()` of every row it
 * touched — about 8.5 MB per Skill Lab load. It now omits columns the caller
 * never reads, and omits question explanations entirely on the dashboard action.
 *
 * Two things have to hold for that to be safe:
 *
 *  1. The dashboard action must ask for the cheap payload and `start` must ask
 *     for the full one, since `start` persists explanations into the snapshot.
 *  2. Stripping explanations must not change which groups the dashboard lists,
 *     or their summaries. Group eligibility reads passage content and answer
 *     keys, not explanations — this proves that empirically rather than by
 *     inspection.
 *
 * The fixture is a real free-tier reading passage and its 15 questions, pulled
 * from the production database with the same column shape the RPC now returns.
 */

const PASSAGE: any = (fixture as any).passage;
const QUESTIONS: any[] = (fixture as any).questions;

function stripExplanations(questions: any[]) {
  return questions.map((q) => {
    const { explanation, explanation_data, ...rest } = q;
    return rest;
  });
}

/** Minimal stand-in for the Supabase client the edge function is handed. */
function makeClient(options: { history?: any[] } = {}) {
  const rpcCalls: Array<{ name: string; args: any }> = [];
  // `practice_library_index` receives the group the handler decided to start,
  // including the snapshot it will persist. Keeping it lets the fake answer the
  // following `start` call with a realistically shaped session.
  let indexedGroup: any = null;

  const client = {
    rpc: async (name: string, args: any) => {
      rpcCalls.push({ name, args });

      if (name === 'practice_library_state') {
        if (args.p_action === 'dashboard') {
          return { data: { exposures: [], sessions: [] }, error: null };
        }
        // 'start' / 'resume' return a session row shaped like the real RPC's.
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

      if (name === 'practice_library_catalogue') {
        const includeExplanations = args.p_include_explanations !== false;
        return {
          data: {
            passages: [PASSAGE],
            questions: includeExplanations ? QUESTIONS : stripExplanations(QUESTIONS),
            history: options.history ?? [],
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

  return { client, rpcCalls };
}

async function runDashboard(history?: any[]) {
  const { client, rpcCalls } = makeClient({ history });
  const result = await handleLibraryPractice(client as any, 'auth-fixture', {
    action: 'dashboard',
  });
  return { result, rpcCalls };
}

describe('skill lab catalogue narrowing', () => {
  it('asks for the cheap catalogue on the dashboard action', async () => {
    const { rpcCalls } = await runDashboard();
    const call = rpcCalls.find((c) => c.name === 'practice_library_catalogue');

    expect(call).toBeDefined();
    expect(call!.args.p_auth).toBe('auth-fixture');
    expect(call!.args.p_include_explanations).toBe(false);
  });

  it('asks for the full catalogue when a set is started', async () => {
    const { client, rpcCalls } = makeClient();
    // Discover a real group id from the dashboard first.
    const dash: any = await handleLibraryPractice(client as any, 'auth-fixture', {
      action: 'dashboard',
    });
    const groupId = dash.groups[0]?.id;
    expect(groupId).toBeTruthy();

    rpcCalls.length = 0;
    await handleLibraryPractice(client as any, 'auth-fixture', {
      action: 'start',
      groupId,
      requestId: 'req-1',
    });

    const call = rpcCalls.find((c) => c.name === 'practice_library_catalogue');
    expect(call).toBeDefined();
    expect(call!.args.p_include_explanations).toBe(true);
  });

  it('produces the same dashboard groups with or without explanations', async () => {
    // Force the full payload through the same code path the dashboard uses, so
    // the only difference between the two runs is the explanation columns.
    const withExplanations = {
      rpc: async (name: string) => {
        if (name === 'practice_library_state')
          return { data: { exposures: [], sessions: [] }, error: null };
        if (name === 'practice_library_catalogue')
          return {
            data: { passages: [PASSAGE], questions: QUESTIONS, history: [] },
            error: null,
          };
        throw new Error(`unexpected rpc: ${name}`);
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    };

    const full: any = await handleLibraryPractice(withExplanations as any, 'auth-fixture', {
      action: 'dashboard',
    });
    const { result: narrowed } = await runDashboard();

    expect((narrowed as any).groups).toEqual(full.groups);
    expect((narrowed as any).recommendations).toEqual(full.recommendations);
    expect((narrowed as any).groups.length).toBeGreaterThan(0);
  });

  it('reconstructs past attempts from the narrowed history shape', async () => {
    // Exactly the five keys the RPC now returns for history rows.
    const answers: Record<string, unknown> = {};
    for (const q of QUESTIONS) answers[q.id] = 'A';

    const history = [
      {
        id: 'session-fixture',
        passage_id: PASSAGE.id,
        test_type: PASSAGE.test_type,
        completed_at: '2026-09-01T00:00:00.000Z',
        content_data: { savedAnswers: answers },
      },
    ];

    const { result } = await runDashboard(history);

    // The narrowed row carried enough to mark the source as already attempted.
    const familiarities = new Set((result as any).groups.map((g: any) => g.familiarity));
    expect(familiarities.has('familiar')).toBe(true);
  });

  it('treats a history row with no savedAnswers as having nothing to replay', async () => {
    const history = [
      {
        id: 'session-empty',
        passage_id: PASSAGE.id,
        test_type: PASSAGE.test_type,
        completed_at: '2026-09-01T00:00:00.000Z',
        content_data: { savedAnswers: null },
      },
    ];

    await expect(runDashboard(history)).resolves.toBeDefined();
  });
});
