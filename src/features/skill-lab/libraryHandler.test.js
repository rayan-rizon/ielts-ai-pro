import { describe, expect, it } from 'vitest';
import {
  buildLibraryGroups,
  scoreLibraryGroup,
} from '../../../supabase/functions/_shared/skill-lab/libraryPractice.js';
import { handleLibraryPractice } from '../../../supabase/functions/skill-lab/libraryHandler.ts';

const passage = {
  id: 'passage',
  title: 'IELTS 11 Academic Test 2',
  is_active: true,
  test_type: 'reading',
  access_tier: 'free',
  content: 'The library opens on Sunday. It closes on Monday.',
};
// Matching is where a blank used to be scored as a wrong answer.
const questions = [
  {
    id: 'match',
    passage_id: 'passage',
    type: 'matching_features',
    question_number: 1,
    question_text: 'Match each statement with a day.',
    matching_features: {
      options: ['A. Sunday', 'B. Monday'],
      questions: [
        { id: 'one', text: 'The library opens.', answer: 'A' },
        { id: 'two', text: 'The library closes.', answer: 'B' },
      ],
    },
  },
];
const [group] = buildLibraryGroups(passage, questions);

/** The real handler and scorer; only the database calls are replaced. */
function database({ history = [], sessions = [] }) {
  const replies = {
    practice_library_state: { enabled: true, sessions, exposures: [] },
    practice_library_dashboard_groups_v2: [
      { id: group.id, sourceId: 'passage', title: group.title, focus: group.focus, total: 2 },
    ],
    practice_library_history: history,
    practice_library_catalogue_for_sources: { passages: [passage], questions },
  };
  return { rpc: async (name) => ({ data: replies[name], error: null }) };
}

const dashboard = (rows) =>
  handleLibraryPractice(database(rows), 'user', { action: 'dashboard', catalogueVersion: 2 });
const recently = new Date(Date.now() - 86_400_000).toISOString();
const fullTest = (savedAnswers) => ({
  id: 'test-1',
  passage_id: 'passage',
  test_type: 'reading',
  completed_at: recently,
  content_data: { savedAnswers },
});

describe('practice library dashboard', () => {
  it('counts only the full test questions that were answered', async () => {
    const result = await dashboard({ history: [fullTest({ match_one: 'A' })] });
    expect(result.recommendations[0]).toMatchObject({ correct: 1, total: 1 });
  });
  it('suggests nothing from a full test left blank', async () => {
    const result = await dashboard({ history: [fullTest({})] });
    expect(result.recommendations).toEqual([]);
  });
  it('names a practice result after its test', async () => {
    const answers = { match_one: 'B', match_two: 'B' };
    const result = await dashboard({
      sessions: [
        {
          id: 'practice-1',
          group_id: group.id,
          source_id: 'passage',
          focus: group.focus,
          familiarity: 'familiar',
          completed_at: recently,
          result: scoreLibraryGroup('reading', questions, answers),
        },
      ],
    });
    const [need] = result.recommendations;
    expect(need).toMatchObject({ correct: 1, total: 2 });
    expect(need.sources[0]).toMatchObject({ title: passage.title, practice: true });
  });
});

describe('practice listening audioscript', () => {
  const recording = {
    id: 'audio-passage',
    title: 'IELTS 12 Listening Test 1',
    test_type: 'listening',
    audio_url: 'https://example.test/full.mp3',
    content: JSON.stringify([
      {
        section_number: 1,
        title: 'Part 1',
        srt_content: '1\n00:00:01,000 --> 00:00:03,000\nThe [answer 1]library[/answer] opens.',
        transcript: 'The [answer 1]library[/answer] opens.',
        transcript_highlights: [{ question_number: 1, phrase: 'library' }],
      },
    ]),
  };
  const saved = (source, mistake = null) => ({
    id: 'practice-2',
    focus: 'listening:note_completion',
    answers: {},
    stage: 2,
    snapshot: { source, questions: [], mistake },
  });
  const resume = (session) => {
    const client = {
      rpc: async () => ({ data: session, error: null }),
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: recording, error: null }) }),
        }),
      }),
    };
    return handleLibraryPractice(client, 'user', { action: 'resume' });
  };
  const stored = {
    id: 'audio-passage',
    title: recording.title,
    passage_title: 'Part 1',
    section: 1,
    content: '',
    audio_url: recording.audio_url,
  };

  it('sends the part’s audioscript without answer marks or answer evidence', async () => {
    const result = await resume(saved(stored));
    expect(result.source.transcript).toBe('The library opens.');
    expect(result.source.srt_content).toContain('The library opens.');
    expect(JSON.stringify(result.source)).not.toMatch(/\[answer|transcript_highlights/);
  });

  it('gives the recording being retried its audioscript too', async () => {
    const result = await resume(saved(stored, { ...stored, questions: [] }));
    expect(result.mistake.transcript).toBe('The library opens.');
  });
});

describe('practice session actions', () => {
  const stored = (extra = {}) => ({
    id: 'practice-3',
    focus: group.focus,
    answers: {},
    stage: 2,
    snapshot: { source: { title: passage.title }, questions: group.questions, mistake: null },
    ...extra,
  });
  // A retry never comes from the passage about to be practised, so the earlier
  // mistake needs a passage of its own.
  const earlier = { ...passage, id: 'earlier', title: 'IELTS 10 Academic Test 1' };
  const catalogue = {
    passages: [passage, earlier],
    questions: [...questions, { ...questions[0], id: 'old', passage_id: 'earlier' }],
  };
  const missed = (passageId, questionId) => ({
    ...fullTest({ [`${questionId}_one`]: 'B', [`${questionId}_two`]: 'B' }),
    passage_id: passageId,
  });
  /** Records what the handler asks the database to store. */
  function recorder({ history = [] } = {}) {
    const writes = {};
    const base = database({ history });
    return {
      writes,
      rpc: async (name, args) => {
        if (name === 'practice_library_index') {
          writes.index = args.p_group;
          return { data: null, error: null };
        }
        if (name === 'practice_library_catalogue_for_sources') {
          return { data: catalogue, error: null };
        }
        if (['start', 'complete', 'resume'].includes(args.p_action)) {
          writes[args.p_action] = args.p_data;
          return { data: stored(), error: null };
        }
        return base.rpc(name);
      },
    };
  }
  const run = (client, body) =>
    handleLibraryPractice(client, 'user', { catalogueVersion: 2, ...body });

  const start = async (history) => {
    const client = recorder({ history });
    await run(client, { action: 'start', groupId: group.id, requestId: 'r1' });
    return client.writes;
  };

  it('asks the learner to retry the mistake from an earlier full test', async () => {
    const writes = await start([missed('earlier', 'old')]);
    expect(writes.start).toMatchObject({
      group_id: group.id,
      source_session_id: 'test-1',
      mistake: { id: 'earlier', answers: { old_one: 'B', old_two: 'B' } },
    });
    expect(writes.index.snapshot.mistake).toBeNull();
    expect(writes.index.version).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never asks for a retry on the passage about to be practised', async () => {
    const writes = await start([missed('passage', 'match')]);
    expect(writes.start.mistake).toBeNull();
  });

  it('refuses a set that is not in the library', async () => {
    await expect(run(recorder(), { action: 'start', groupId: 'missing' })).rejects.toThrow(
      'This question set is unavailable'
    );
  });

  it.each([undefined, [], 'A', { long: 'x'.repeat(31000) }])(
    'refuses to mark answers that are not an answer sheet (%#)',
    async (answers) => {
      const client = recorder();
      await expect(run(client, { action: 'submit', answers })).rejects.toThrow('Invalid answers');
      expect(client.writes.complete).toBeUndefined();
    }
  );

  it('marks the answers on the server before storing them', async () => {
    const client = recorder();
    await run(client, { action: 'submit', answers: { match_one: 'A', match_two: 'A' } });
    expect(client.writes.complete.result).toMatchObject({ correct: 1, total: 2 });
  });

  it.each(['delete', 'constructor'])('refuses the unknown action %s', async (action) => {
    await expect(run(recorder(), { action })).rejects.toThrow('Unknown practice action');
  });
});
