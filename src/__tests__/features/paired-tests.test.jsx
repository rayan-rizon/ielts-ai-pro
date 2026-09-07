import { invitationPath, roomLobbyPath } from '@/features/testing/paired/pairedApi';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  prepareSnapshot,
  gradeSnapshot,
  comparisonSummary,
  withoutSolutions,
  validateAnswers,
  audioPosition,
} from '../../../supabase/functions/_shared/objective-scoring/paired.js';
import { publicRoom } from '../../../supabase/functions/_shared/objective-scoring/publicRoom.js';
import { calculateTestResults } from '@/features/testing/reading/components/ReadingTest/utils/scoreCalculator';
import { calculateListeningTestResults } from '@/features/testing/listening/components/ListeningTest/utils/scoreCalculator';
import * as pairedApi from '@/features/testing/paired/pairedApi';
import PairedTestEntry from '@/features/testing/paired/PairedTestEntry';
import PairedRoomView from '@/features/testing/paired/PairedRoomView';
import PairedRoomHeader from '@/features/testing/paired/components/PairedRoomHeader';
import SessionSteps from '@/features/testing/paired/components/SessionSteps';
import TakeWithFriend from '@/features/testing/paired/TakeWithFriend';
import PairedPracticeSpotlight from '@/features/testing/paired/PairedPracticeSpotlight';
import PairedTestGate from '@/features/testing/paired/PairedTestGate';

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ userProfile: { full_name: 'Alex Rivera' } }),
}));

function fixture(type = 'reading') {
  const count = type === 'reading' ? 3 : 4;
  const parts = Array.from({ length: count }, (_, i) => ({
    section_number: i + 1,
    title: `Part ${i + 1}`,
    content: 'A passage',
    audio_url: `https://media.ieltsai.pro/${i}.mp3`,
  }));
  const passage = {
    id: 'test',
    title: 'Practice',
    test_type: type,
    is_active: true,
    content: JSON.stringify(parts),
  };
  const questions = Array.from({ length: 40 }, (_, i) => ({
    id: `q${i}`,
    type: 'multiple_choice',
    question_number: i + 1,
    section: Math.min(count, Math.floor(i / (type === 'reading' ? 14 : 10)) + 1),
    correct_answer: 'A',
  }));
  return prepareSnapshot(passage, questions);
}
function serverRoom(state = 'running') {
  return {
    id: 'room',
    actor_id: 'one',
    host_id: 'one',
    state,
    test_type: 'reading',
    passage_id: 'test',
    title: 'Practice',
    snapshot: fixture(),
    duration_seconds: 3600,
    invite_token: 'secret',
    members: [
      {
        user_id: 'one',
        auth_id: 'auth-one',
        display_name: 'Alex',
        answers: { q0: 'A' },
        revision: 1,
        session_id: 'own',
        ready: true,
        summary: comparisonSummary(gradeSnapshot(fixture(), { q0: 'A' })),
      },
      {
        user_id: 'two',
        auth_id: 'auth-two',
        display_name: 'Sam',
        answers: { q0: 'B' },
        revision: 1,
        session_id: 'peer',
        ready: true,
        summary: comparisonSummary(gradeSnapshot(fixture(), {})),
      },
    ],
  };
}
describe('authoritative paired scoring', () => {
  it.each(['reading', 'listening'])('uses the existing %s scoring rules', (type) => {
    const snapshot = fixture(type),
      answers = { q0: 'A', q1: 'B', q2: 'a' };
    const actual = gradeSnapshot(snapshot, answers);
    const expected =
      type === 'reading'
        ? calculateTestResults(snapshot.questions, answers, snapshot.testData.sections)
        : calculateListeningTestResults(snapshot.questions, answers, snapshot.testData.content);
    expect(actual).toEqual(expected);
    expect(actual.correctAnswers).toBe(2);
    expect(actual.totalQuestions).toBe(40);
  });
  it('rejects incomplete or disabled tests', () => {
    expect(() => prepareSnapshot({ test_type: 'reading', is_active: false }, [])).toThrow();
    expect(() =>
      prepareSnapshot({ test_type: 'reading', is_active: true, content: '[]' }, [])
    ).toThrow();
  });
  it('never returns another student answers, session identifier, or auth identity', () => {
    const result = publicRoom(serverRoom());
    expect(result.own.answers).toEqual({ q0: 'A' });
    expect(result.members[1]).not.toHaveProperty('answers');
    expect(result.members[1]).not.toHaveProperty('auth_id');
    expect(result.members[1]).not.toHaveProperty('session_id');
    expect(result.members[0].summary).toBeUndefined();
    expect(result.invite_token).toBeUndefined();
    expect(JSON.stringify(result.snapshot)).not.toContain('correct_answer');
    expect(result.snapshot.testData.content).toBe('');
  });
  it('returns a lobby invitation only to the host', () => {
    const hostRoom = serverRoom('lobby');
    expect(publicRoom(hostRoom).invite_token).toBe('secret');

    const partnerRoom = { ...hostRoom, actor_id: 'two' };
    expect(publicRoom(partnerRoom).invite_token).toBeUndefined();
  });
  it('releases only allowlisted score summaries when the room completes', () => {
    const result = publicRoom(serverRoom('complete'));
    expect(result.members[0].summary.correctAnswers).toBe(1);
    expect(result.members[1]).not.toHaveProperty('answers');
    expect(Object.keys(result.members[0].summary).sort()).toEqual(
      [
        'bandScore',
        'correctAnswers',
        'percentage',
        'sectionStats',
        'totalQuestions',
        'typeStats',
      ].sort()
    );
  });
  it('does not repeatedly transfer frozen test content during polling', () =>
    expect(publicRoom(serverRoom(), false).snapshot).toBeUndefined());
  it('strips nested solutions and transcripts', () =>
    expect(
      withoutSolutions({
        question_groups: [
          {
            questions: [
              { id: 'a', gap_fill: { answers: { 1: 'secret' } }, explanation_data: 'private' },
            ],
          },
        ],
        transcript: 'secret',
      })
    ).toEqual({ question_groups: [{ questions: [{ id: 'a', gap_fill: {} }] }] }));
  it('bounds answer payloads and rejects structured score injection', () => {
    expect(validateAnswers({ q1: ['A', 'B'] })).toEqual({ q1: ['A', 'B'] });
    expect(() => validateAnswers({ q1: { score: 9 } })).toThrow();
    expect(() => validateAnswers({ q1: 'x'.repeat(1001) })).toThrow();
    expect(() => validateAnswers(JSON.parse('{"__proto__":"x"}'))).toThrow();
  });
  it('restores audio at part boundaries and the review interval', () => {
    expect(audioPosition([100, 200, 300, 400], 150)).toEqual({
      part: 1,
      offset: 50,
      review: false,
    });
    expect(audioPosition([100, 200], 100)).toEqual({ part: 1, offset: 0, review: false });
    expect(audioPosition([100, 200], 300).review).toBe(true);
    expect(audioPosition([100, 200], -5).offset).toBe(0);
  });
});
describe('paired comparison interface', () => {
  it.each([
    ['lobby', 'Join lobby'],
    ['running', 'Take test'],
    ['grading', 'Compare results'],
    ['complete', 'Compare results'],
  ])('tracks the %s room state in the session progress rail', (state, currentLabel) => {
    render(<SessionSteps state={state} />);

    expect(screen.getByText(currentLabel).closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('withholds comparison for an early submission', () => {
    const source = serverRoom();
    source.members[0].submitted_at = '2026-09-01';
    render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(source)} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Your answers are locked/)).toBeInTheDocument();
    expect(screen.queryByText('estimated band')).not.toBeInTheDocument();
  });
  it('shows live partner progress after the current student submits', () => {
    const source = serverRoom();
    source.members[0].submitted_at = '2026-09-01';
    render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(source)} act={vi.fn()} onlineCount={2} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Sam is still taking the test/i)).toBeInTheDocument();
    expect(screen.getByText('Taking test')).toBeInTheDocument();
    expect(screen.queryByText('Ready to start')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Browse tests' })).not.toBeInTheDocument();
  });
  it('only shows invitation controls to a host with an open seat', () => {
    const source = serverRoom('lobby');
    source.members = [source.members[0]];
    const { rerender } = render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(source)} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Private invitation link').value).not.toContain('undefined');
    expect(screen.queryByRole('button', { name: 'I’m ready' })).not.toBeInTheDocument();

    const fullRoom = serverRoom('lobby');
    rerender(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(fullRoom)} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('Private invitation link')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PairedRoomView room={publicRoom({ ...fullRoom, actor_id: 'two' })} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('Private invitation link')).not.toBeInTheDocument();
  });
  it('displays both results and links only to the owner private review', () => {
    render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(serverRoom('complete'))} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getAllByText('estimated band')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'My private review' }).getAttribute('href')).toContain(
      '/reading-test/own?room=room'
    );
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
  it('labels locked results and turns shared weaknesses into concise practice signals', () => {
    render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(serverRoom('complete'))} act={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Both finished')).toBeInTheDocument();
    expect(screen.getByText('Your result')).toBeInTheDocument();
    expect(screen.getAllByText('Study partner')).toHaveLength(2);
    expect(screen.getByText('1 shared focus area')).toBeInTheDocument();
    expect(screen.getByText('Both below target')).toBeInTheDocument();
    expect(
      screen.queryByText(/Reviewing these question types together will boost/)
    ).not.toBeInTheDocument();
  });
  it('returns to the previous page from shared results when it exists', () => {
    const room = publicRoom(serverRoom('complete'));
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/reading', key: 'library' },
          { pathname: '/reading-test/own', search: '?room=room', key: 'shared-results' },
        ]}
        initialIndex={1}
      >
        <Routes>
          <Route
            path="/reading-test/own"
            element={<PairedRoomHeader room={room} bothComplete onlineCount={1} />}
          />
          <Route path="/reading" element={<p>Reading Library</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to Reading Library' }));
    expect(screen.getByText('Reading Library')).toBeInTheDocument();
  });

  it('uses the test library when shared results are opened directly', () => {
    const room = publicRoom(serverRoom('complete'));
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/reading-test/own', search: '?room=room', key: 'default' }]}
      >
        <Routes>
          <Route
            path="/reading-test/own"
            element={<PairedRoomHeader room={room} bothComplete onlineCount={1} />}
          />
          <Route path="/reading" element={<p>Reading Library</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Back to Reading Library' }));
    expect(screen.getByText('Reading Library')).toBeInTheDocument();
  });

  it('disables start until both students are ready', () => {
    const source = serverRoom('lobby');
    source.members[1].ready = false;
    render(
      <MemoryRouter>
        <PairedRoomView room={publicRoom(source)} act={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Start together' })).toBeDisabled();
  });
});

describe('test-page entry points', () => {
  it.each(['reading', 'listening'])('keeps %s invitations and lobbies on the test page', (type) => {
    const room = { id: 'room', passage_id: 'test', test_type: type, invite_token: 'token' };
    expect(invitationPath(room)).toBe(`/${type}-test/test#invite=token`);
    expect(roomLobbyPath(room)).toBe(`/${type}-test/test?room=room`);
    expect(invitationPath({ ...room, invite_token: undefined })).toBe('');
  });

  it.each(['reading', 'listening'])(
    'shows the new paired-practice discovery and a working %s card action',
    (type) => {
      render(
        <MemoryRouter>
          <PairedPracticeSpotlight type={type} />
          <TakeWithFriend test={{ id: 'test', title: 'Practice Test' }} type={type} />
        </MemoryRouter>
      );

      expect(screen.getByText(`Take a ${type} test with a friend`)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Take with a friend' })).toHaveAttribute(
        'href',
        `/${type}-test/test?together=true`
      );
    }
  );

  it('does not offer paired practice for locked or incomplete tests', () => {
    const { rerender } = render(
      <MemoryRouter>
        <TakeWithFriend test={{ id: 'locked' }} type="reading" isLocked />
      </MemoryRouter>
    );
    expect(screen.queryByRole('link', { name: 'Take with a friend' })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <TakeWithFriend test={{ id: 'short', total_questions: 20 }} type="reading" />
      </MemoryRouter>
    );
    expect(screen.queryByRole('link', { name: 'Take with a friend' })).not.toBeInTheDocument();
  });
});

describe('PairedTestEntry component', () => {
  it('renders correctly with Learner Panel elements and unified 3-step rail', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PairedTestEntry type="reading" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Back to Reading tests')).toBeInTheDocument();
    });
    expect(screen.getByText('READING · PRACTICE TOGETHER')).toBeInTheDocument();
    expect(screen.getByText('Test with a friend')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('Create & invite')).toBeInTheDocument();
    expect(screen.getByText('Start together')).toBeInTheDocument();
    expect(screen.getByText('Compare scores')).toBeInTheDocument();
    expect(screen.getByText(/Answers stay private:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create room & invite/i })).toBeInTheDocument();
  });

  it('prompts user when attempting to proceed without consent', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PairedTestEntry type="reading" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create room & invite/i })).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /Create room & invite/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText('Please check this box to agree before continuing.')
    ).toBeInTheDocument();
  });

  it('displays human-friendly recovery message and try again button on error', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockRejectedValue(new Error('Invalid request origin'));

    render(
      <MemoryRouter>
        <PairedTestEntry type="reading" />
      </MemoryRouter>
    );

    const checkbox = screen.getByLabelText(/I agree to share my final test results/i);
    fireEvent.click(checkbox);

    const submitBtn = screen.getByRole('button', { name: /Create room & invite/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to reach the paired study service from this address/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });
});

describe('PairedTestGate and PairedRoomError', () => {
  it('renders loading skeleton while room is fetching with no errors', () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/reading-test/test?room=test-room']}>
        <PairedTestGate type="reading">
          <div>Test Content</div>
        </PairedTestGate>
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Loading study room')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders PairedRoomError instead of skeletons when room loading fails', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockRejectedValue(new Error('Invalid room'));

    render(
      <MemoryRouter initialEntries={['/reading-test/test?room=test']}>
        <PairedTestGate type="reading">
          <div>Test Content</div>
        </PairedTestGate>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Should NOT show pulsing skeletons
    expect(screen.queryByLabelText('Loading study room')).not.toBeInTheDocument();
    expect(screen.getByText('Study room not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take test solo' })).toHaveAttribute(
      'href',
      '/reading'
    );
    expect(screen.getByRole('link', { name: /Back to Reading tests/i })).toHaveAttribute(
      'href',
      '/reading'
    );
  });

  it('routes Take test solo to specific test runner when a valid test ID is in route', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockRejectedValue(new Error('Invalid room'));
    const testUuid = '11111111-2222-3333-4444-555566667777';

    render(
      <MemoryRouter initialEntries={[`/reading-test/${testUuid}?room=test`]}>
        <Routes>
          <Route
            path="/reading-test/:id"
            element={
              <PairedTestGate type="reading">
                <div>Test Content</div>
              </PairedTestGate>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Take test solo' })).toHaveAttribute(
      'href',
      `/reading-test?test-id=${testUuid}`
    );
  });

  it('provides try again button on network or origin errors', async () => {
    vi.spyOn(pairedApi, 'pairedRequest').mockRejectedValue(new Error('Invalid request origin'));

    render(
      <MemoryRouter initialEntries={['/reading-test/test?room=test']}>
        <PairedTestGate type="reading">
          <div>Test Content</div>
        </PairedTestGate>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Connection error')).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to reach the study room service from this address/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Take test solo' })).toHaveAttribute(
      'href',
      '/reading'
    );
  });
});
