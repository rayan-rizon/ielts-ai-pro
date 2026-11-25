import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LibraryPracticeLab, {
  parseGroupInstructions,
  QuestionGroupInstructions,
} from './pages/LibraryPracticeLab';

const { invoke, auth } = vi.hoisted(() => ({ invoke: vi.fn(), auth: { user: { id: 'student' } } }));
vi.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke } } }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => auth,
}));
const group = {
  id: 'group',
  title: 'Original library test',
  focus: 'reading:multiple_choice',
  total: 1,
  familiarity: 'new',
};
const secondGroup = {
  ...group,
  id: 'group-3',
  title: 'Another original library test',
  focus: 'reading:summary_completion',
  total: 2,
};
const alternateGroup = {
  ...group,
  id: 'group-2',
  title: 'Another original library test',
};
const session = {
  id: 'session',
  focus: group.focus,
  stage: 0,
  answers: {},
  familiarity: 'new',
  source: {
    title: group.title,
    passage_title: 'The library on Sunday',
    section: 1,
    content: '[center]The library closes on Sunday.[/center]',
  },
  tips: ['Read the whole sentence.'],
  mistake: null,
  explanations: [],
  result: null,
  questions: [
    {
      id: 'q',
      question_number: 1,
      question_text: 'When does it close?',
      type: 'multiple_choice',
      options: ['A. Sunday', 'B. Monday'],
    },
  ],
};
function mount(path = '/practice-lab') {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/practice-lab" element={<LibraryPracticeLab />} />
          <Route path="/practice-lab/session/:sessionId" element={<LibraryPracticeLab />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  auth.user = { id: 'student' };
  sessionStorage.clear();
  invoke.mockReset();
  invoke.mockImplementation(async (_, { body }) => {
    if (body.action === 'dashboard')
      return {
        data: {
          enabled: true,
          remaining: 2,
          limit: 2,
          reset_at: '2026-09-08',
          groups: [group],
          recommendations: [],
          sessions: [],
        },
      };
    if (body.action === 'start' || body.action === 'resume') return { data: session };
    if (body.action === 'save')
      return { data: { ...session, stage: body.stage, answers: body.answers } };
    return {
      data: null,
      error: { context: { json: async () => ({ error: 'Try again. Your answers are saved.' }) } },
    };
  });
});
describe('library practice page', () => {
  it('submits the latest typed Reading note even before the input loses focus', async () => {
    const question = {
      id: 'notes',
      type: 'notes_completion',
      question_number: 31,
      gap_fill: { structured_text: 'Writer [31]' },
      practice_items: [{ id: 'notes_gap_31', number: 31 }],
    };
    invoke.mockResolvedValue({
      data: { ...session, stage: 2, focus: 'reading:notes_completion', questions: [question] },
    });
    mount('/practice-lab/session/session');
    fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({ action: 'submit', answers: { notes_gap_31: 'Ada' } }),
        })
      )
    );
  });
  it('saves both blanks when the source Reading short answer awards one combined mark', async () => {
    const question = {
      id: 'short',
      question_number: 23,
      type: 'short_answer',
      question_text: 'The writer travelled from _____ to _____.',
      practice_items: [
        { id: 'short_blank_1', number: 23 },
        { id: 'short_blank_2', number: 23 },
      ],
    };
    invoke.mockResolvedValue({
      data: { ...session, stage: 2, focus: 'reading:short_answer', questions: [question] },
    });
    mount('/practice-lab/session/session');
    const inputs = await screen.findAllByRole('textbox', { name: /question 23/i });
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[0], { target: { value: 'York' } });
    fireEvent.change(inputs[1], { target: { value: 'Leeds' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({
            action: 'submit',
            answers: { short_blank_1: 'York', short_blank_2: 'Leeds' },
          }),
        })
      )
    );
  });
  it('shows separate Listening MCQ cards with their question totals and opens the chosen set', async () => {
    const single = { ...group, id: 'single', focus: 'listening:multiple_choice', total: 3 };
    const multi = {
      ...single,
      id: 'multi',
      category: 'listening:multiple_choice_multiple',
      total: 2,
    };
    invoke.mockImplementation(async (_, { body }) =>
      body.action === 'dashboard'
        ? { data: { enabled: true, remaining: 2, limit: 2, groups: [single, multi] } }
        : { data: session }
    );
    mount('/practice-lab?module=listening&focus=listening%3Amultiple_choice');
    const multiCard = await screen.findByRole('button', {
      name: /Choose Multiple choice \(multiple answers\)/i,
    });
    expect(multiCard).toHaveTextContent('1 set · 2 questions');
    fireEvent.click(multiCard);
    const selected = screen.getByRole('region', { name: 'Selected question type' });
    fireEvent.click(within(selected).getByRole('button', { name: 'Start practice' }));
    expect(invoke).toHaveBeenCalledWith(
      'skill-lab',
      expect.objectContaining({
        body: expect.objectContaining({ action: 'start', groupId: 'multi' }),
      })
    );
  });

  it('renders the original Reading short answer and sends a fast submit with the word entered', async () => {
    const question = {
      id: 'short',
      question_number: 13,
      type: 'short_answer',
      question_text: 'Who wrote the letter?',
    };
    invoke.mockResolvedValue({
      data: { ...session, stage: 2, focus: 'reading:short_answer', questions: [question] },
    });
    mount('/practice-lab/session/session');
    const input = await screen.findByRole('textbox', { name: /Question 13/i });
    fireEvent.change(input, { target: { value: 'Ada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({ action: 'submit', answers: { short: 'Ada' } }),
        })
      )
    );
  });
  it.each(['pro', 'premium'])('starts a set without a daily allowance for %s', async (tier) => {
    invoke.mockImplementation(async (_, { body }) =>
      body.action === 'dashboard'
        ? {
            data: {
              enabled: true,
              tier,
              unlimited: true,
              remaining: 1,
              limit: 10,
              groups: [group],
            },
          }
        : { data: session }
    );
    mount();
    const start = await screen.findByRole('button', { name: 'Start practice' });
    expect(start).toBeEnabled();
    expect(screen.queryByText(/Sets left today/)).not.toBeInTheDocument();
    fireEvent.click(start);
    expect(invoke).toHaveBeenCalledWith(
      'skill-lab',
      expect.objectContaining({
        body: expect.objectContaining({ action: 'start', groupId: group.id }),
      })
    );
  });

  it('blocks new sets when the Free daily allowance is exhausted', async () => {
    invoke.mockResolvedValue({
      data: { enabled: true, tier: 'free', remaining: 0, limit: 2, groups: [group] },
    });
    mount();
    expect(await screen.findByRole('button', { name: 'Start practice' })).toBeDisabled();
    expect(screen.getByText(/Sets left today/)).toHaveTextContent('0 / 2');
    expect(screen.getByText(/You have used all 2 sets/)).toBeInTheDocument();
  });

  it('shows real source selection without inventing a weakness for a new student', async () => {
    mount();
    expect(
      await screen.findByRole('heading', { name: 'Find your starting point' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Original library test/)).toBeInTheDocument();
    expect(screen.queryByText(/You missed/)).not.toBeInTheDocument();
    expect(screen.getByText(/partly practised/)).toBeInTheDocument();
    expect(screen.queryByText(/What your teacher knows/)).not.toBeInTheDocument();
  });
  it('starts a resumable library session straight into the original questions', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Start practice' }));
    await screen.findByRole('heading', { name: 'Original library test', level: 1 });
    await screen.findByRole('button', { name: 'Check my answers' });
    expect(screen.getByText('The library closes on Sunday.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'The library on Sunday · Part 1' })
    ).toBeInTheDocument();
    expect(screen.queryByText('[center]')).not.toBeInTheDocument();
    // The approach step and the AI teacher launcher are gone.
    expect(screen.queryByText('Try this approach')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /AI teacher/ })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Practice workflow stages' })).toHaveTextContent(
      /^1Try the questions2Check answers$/
    );
    expect(screen.queryByText('Review your mistake')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({ action: 'start', groupId: 'group' }),
        })
      )
    );
  });
  it('opens an earlier mistake first, then goes straight to practising', async () => {
    const mistake = {
      ...session.source,
      questions: session.questions,
      answers: { q: 'B' },
      explanations: [{ id: 'q', text: 'The passage says Sunday.' }],
      result: {
        correct: 0,
        total: 1,
        answers: {
          q: { questionNumber: 1, userAnswer: 'B', correctAnswer: 'A', isCorrect: false },
        },
      },
    };
    invoke.mockImplementation(async (_, { body }) => ({
      data:
        body.action === 'save'
          ? { ...session, mistake, stage: body.stage }
          : { ...session, mistake },
    }));
    mount('/practice-lab/session/session?library=1');
    expect(await screen.findByLabelText('Question 1 feedback')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Practice workflow stages' })).toHaveTextContent(
      /^1See your mistake2Try the questions3Check answers$/
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start practising' }));
    await screen.findByRole('button', { name: 'Check my answers' });
    expect(
      invoke.mock.calls.some(
        ([, options]) => options.body.action === 'save' && options.body.stage === 2
      )
    ).toBe(true);
  });
  it('opens a session saved at the removed approach step on the questions', async () => {
    invoke.mockResolvedValue({ data: { ...session, stage: 1 } });
    mount('/practice-lab/session/session?library=1');
    expect(await screen.findByRole('button', { name: 'Check my answers' })).toBeInTheDocument();
  });
  it('moves to the answer review step after server scoring', async () => {
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'submit')
        return {
          data: {
            ...session,
            stage: 3,
            completed_at: '2026-09-08T00:00:00Z',
            result: {
              correct: 0,
              total: 1,
              answers: {
                q: { questionNumber: 1, userAnswer: '', correctAnswer: 'A', isCorrect: false },
              },
            },
          },
        };
      if (body.action === 'dashboard')
        return {
          data: {
            enabled: true,
            remaining: 2,
            limit: 2,
            reset_at: '2026-09-08',
            groups: [group],
            recommendations: [],
            sessions: [],
          },
        };
      return { data: session };
    });
    mount('/practice-lab/session/session?library=1');
    await screen.findByRole('heading', { name: 'Original library test', level: 1 });
    await screen.findByRole('button', { name: 'Check my answers' });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    expect(await screen.findByRole('region', { name: 'Practice result' })).toBeInTheDocument();
    expect(screen.getByText('0 of 1 correct')).toBeInTheDocument();
    expect(screen.getAllByText('Not answered').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Question 1 feedback')).toBeInTheDocument();
  });
  it('shows each question, answer and explanation together with clear answer colors', async () => {
    invoke.mockResolvedValue({
      data: {
        ...session,
        stage: 3,
        completed_at: '2026-09-08T00:00:00Z',
        result: {
          correct: 0,
          total: 1,
          answers: {
            q: { questionNumber: 1, userAnswer: 'B', correctAnswer: 'A', isCorrect: false },
          },
        },
        explanations: [{ id: 'q', text: 'The passage says the library closes on Sunday.' }],
      },
    });
    mount('/practice-lab/session/session?library=1');

    const feedback = await screen.findByLabelText('Question 1 feedback');
    expect(within(feedback).getByText('When does it close?')).toBeInTheDocument();
    expect(within(feedback).getByText(/library closes on Sunday/)).toBeInTheDocument();
    expect(within(feedback).getByText('B. Monday')).toHaveClass('text-[rgb(var(--signal-fault))]');
    expect(within(feedback).getByText('A. Sunday')).toHaveClass('text-[rgb(var(--signal-ok))]');
  });
  it('shows the meaning behind saved matching answer letters', async () => {
    invoke.mockResolvedValue({
      data: {
        ...session,
        stage: 3,
        completed_at: '2026-09-08T00:00:00Z',
        questions: [
          {
            id: 'q',
            question_number: 1,
            type: 'matching_features',
            matching_features: {
              options: ['A. Elkind', 'B. Miller & Almon'],
              questions: [{ id: 'one', question_number: 1, question_text: 'Who described play?' }],
            },
          },
        ],
        result: {
          correct: 0,
          total: 1,
          answers: {
            q_one: { questionNumber: 1, userAnswer: 'A', correctAnswer: 'B', isCorrect: false },
          },
        },
      },
    });
    mount('/practice-lab/session/session?library=1');
    const feedback = await screen.findByLabelText('Question 1 feedback');
    expect(within(feedback).getByText('A — Elkind')).toBeInTheDocument();
    expect(within(feedback).getByText('B — Miller & Almon')).toBeInTheDocument();
  });
  it('does not attach a Learning Path task to a substituted question type', async () => {
    mount('/practice-lab?module=reading&focus=reading%3Ashort_answer&activityId=task-1');
    expect(
      await screen.findByText(/will not complete your Learning Path task/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start practice' }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({ action: 'start', activityId: null }),
        })
      )
    );
  });
  it('reviews every answer of a listening set, not just the first question', async () => {
    invoke.mockResolvedValue({
      data: {
        ...session,
        focus: 'listening:multiple_choice',
        stage: 3,
        completed_at: '2026-09-08T00:00:00Z',
        source: {
          title: 'Listening test',
          audio_url: 'part2.mp3',
          audio_scope: 'section',
          section: 2,
        },
        questions: [
          {
            id: 'multi',
            question_number: 11,
            question_count: 2,
            allow_multiple: true,
            type: 'multiple_choice',
            question_text: 'Which TWO things does the speaker mention?',
            options: ['A. A photo', 'B. A competition', 'C. Sunhats'],
          },
          {
            id: 'single',
            question_number: 13,
            type: 'multiple_choice',
            question_text: 'When did it start?',
            options: ['A. Two years ago', 'B. Six years ago'],
          },
        ],
        // The scorer numbers the set from 1 and keys multi-select rows by option.
        result: {
          correct: 2,
          total: 3,
          answers: {
            multi_option_0: {
              questionNumber: 1,
              userAnswer: 'B. A COMPETITION',
              correctAnswer: 'B. A COMPETITION',
              isCorrect: true,
            },
            multi_option_1: {
              questionNumber: 2,
              userAnswer: 'A. A PHOTO',
              correctAnswer: 'C. SUNHATS',
              isCorrect: false,
            },
            single: {
              questionNumber: '3',
              userAnswer: 'B. Six years ago',
              correctAnswer: 'B. Six years ago',
              isCorrect: true,
            },
          },
        },
      },
    });
    mount('/practice-lab/session/session?library=1');
    await screen.findByRole('region', { name: 'Practice result' });
    expect(screen.getByText('2 of 3 correct')).toBeInTheDocument();
    for (const number of [11, 12, 13]) {
      expect(screen.getByLabelText(`Question ${number} feedback`)).toBeInTheDocument();
    }
    const second = screen.getByLabelText('Question 12 feedback');
    expect(within(second).getByText('A. A photo')).toBeInTheDocument();
    expect(within(second).getByText('C. Sunhats')).toBeInTheDocument();
    expect(screen.getByText(/Your set covers/)).toHaveTextContent('Questions 11–13 of Part 2');
  });
  it('keeps the suggestion and opens a panel when a different card is selected', async () => {
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'dashboard') {
        return {
          data: {
            enabled: true,
            remaining: 2,
            limit: 2,
            reset_at: '2026-09-08',
            groups: [group, alternateGroup, secondGroup],
            recommendations: [],
            sessions: [],
          },
        };
      }
      return { data: session };
    });
    mount();
    expect(
      (await screen.findAllByRole('heading', { name: 'Multiple choice' })).length
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    const picker = screen.getByRole('combobox', { name: 'Choose a source set' });
    fireEvent.click(picker);
    expect(
      screen.getByRole('option', { name: /Another original library test/ })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /Another original library test/ }));
    expect(picker).toHaveTextContent(/Another original library test/);
    fireEvent.click(screen.getByRole('button', { name: /Summary completion/ }));
    // The suggested card stays put; only the panel follows the chosen card.
    expect(screen.queryByRole('heading', { name: 'Summary completion' })).toBeNull();
    const selected = screen.getByRole('region', { name: 'Selected question type' });
    expect(selected).toHaveTextContent('Summary completion');
    expect(selected).toHaveTextContent('Choose a test');
    expect(screen.getAllByRole('button', { name: 'Start practice' })).toHaveLength(2);
  });
  it('keeps one main action, caps the backlog and opens a card beside itself', async () => {
    const unfinished = [1, 2, 3].map((day) => ({
      id: `old-${day}`,
      focus: 'reading:multiple_choice',
      group_id: 'group',
      created_at: `2026-09-0${day}T00:00:00Z`,
      answers: {},
    }));
    const need = (focus) => ({ focus, correct: 0, total: 4, due: true, history: [], sources: [] });
    invoke.mockResolvedValue({
      data: {
        enabled: true,
        remaining: 2,
        limit: 2,
        groups: [group, secondGroup, { ...group, id: 'heard', focus: 'listening:multiple_choice' }],
        sessions: unfinished,
        recommendations: [need('reading:multiple_choice'), need('listening:multiple_choice')],
      },
    });
    mount();
    expect(await screen.findAllByRole('button', { name: 'Start practice' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: /Resume/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'All unfinished (3)' }));
    expect(screen.getAllByRole('link', { name: /Resume/ })).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Review Reading Multiple choice' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reading' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review Listening Multiple choice' }));
    expect(screen.getByRole('region', { name: 'Selected question type' })).toHaveTextContent(
      'Listening'
    );
    const card = screen.getByRole('button', { name: /Choose Summary completion/ });
    card.focus();
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-expanded', 'true');
    expect(card).toHaveFocus();
    fireEvent.click(card);
    expect(screen.queryByRole('region', { name: 'Selected question type' })).toBeNull();
  });
  const submitCalls = () => invoke.mock.calls.filter(([, o]) => o.body.action === 'submit');

  it('warns once about blank answers before submitting, and resets on a change', async () => {
    invoke.mockResolvedValue({ data: { ...session, stage: 2 } });
    mount('/practice-lab/session/session');
    expect(await screen.findByText('0 of 1 answered')).toBeInTheDocument();
    const warning = '1 still blank. Press Check my answers again to submit.';
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    expect(screen.getByText(warning)).toBeInTheDocument();
    expect(submitCalls()).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    await waitFor(() => expect(submitCalls()).toHaveLength(1));
  });

  it('clears the blank warning and says when an autosave failed', async () => {
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'save') throw new Error('offline');
      return { data: { ...session, stage: 2 } };
    });
    mount('/practice-lab/session/session');
    fireEvent.click(await screen.findByRole('button', { name: 'Check my answers' }));
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(screen.queryByText(/still blank/)).toBeNull();
    expect(screen.getByText('1 of 1 answered')).toBeInTheDocument();
    expect(await screen.findByText(/Not saved yet/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByText('Saved')).toBeNull();
  });
  it('keeps one listening player beside the questions without content tabs', async () => {
    invoke.mockResolvedValue({
      data: {
        ...session,
        stage: 2,
        focus: 'listening:multiple_choice',
        source: { title: 'Listening test', audio_url: 'part2.mp3', section: 2 },
      },
    });
    mount('/practice-lab/session/session');
    const audio = await waitFor(() => {
      const element = document.querySelector('audio');
      expect(element).not.toBeNull();
      return element;
    });
    expect(screen.queryByRole('button', { name: 'Passage / audio' })).toBeNull();
    expect(screen.getByTestId('sticky-audio')).toContainElement(audio);
    expect(screen.getByTestId('sticky-audio')).not.toHaveTextContent(/Listen to the original/);
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('keeps the passage tab for reading', async () => {
    invoke.mockResolvedValue({ data: { ...session, stage: 2 } });
    mount('/practice-lab/session/session');
    expect(await screen.findByRole('button', { name: 'Passage / audio' })).toBeInTheDocument();
  });
  it('does not carry a failed save into the next session', async () => {
    let saves = 0;
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'save' && (saves += 1) === 1) throw new Error('offline');
      if (body.action === 'dashboard') {
        return { data: { enabled: true, remaining: 2, limit: 2, groups: [group] } };
      }
      if (body.action === 'start') return { data: { ...session, id: 'second', stage: 2 } };
      return { data: { ...session, id: body.sessionId || 'session', stage: 2 } };
    });
    mount('/practice-lab/session/session');
    fireEvent.click((await screen.findAllByRole('radio'))[0]);
    await screen.findByText(/Not saved yet/, {}, { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'Save and exit' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Start practice' }));
    await screen.findByRole('button', { name: 'Check my answers' });
    expect(screen.queryByText(/Not saved yet/)).toBeNull();
  });
  it('does not create placeholder rows when a matching set has no question data', async () => {
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'dashboard') {
        return {
          data: {
            enabled: true,
            remaining: 2,
            limit: 2,
            reset_at: '2026-09-08',
            groups: [group],
            recommendations: [],
            sessions: [],
          },
        };
      }
      return {
        data: {
          ...session,
          focus: 'reading:matching_headings',
          stage: 2,
          questions: [
            {
              id: 'headings',
              question_number: 1,
              type: 'matching_headings',
              options: ['Heading one', 'Heading two'],
            },
          ],
        },
      };
    });
    mount('/practice-lab/session/session?library=1');
    expect(await screen.findByText(/missing its original question details/i)).toBeInTheDocument();
    expect(screen.queryByText('Paragraph A')).not.toBeInTheDocument();
  });

  it('parses question ranges from group instructions and renders structured card UI', () => {
    const raw =
      'Questions 31–34\nComplete each sentence with the correct ending, A–F, below.\nWrite the correct letter, A–F , in boxes 31–34 on your answer sheet.';
    const { range, body } = parseGroupInstructions(raw);
    expect(range).toBe('Questions 31–34');
    expect(body).toContain('Complete each sentence');
    expect(body).toContain('Write the correct letter');

    const singleLine = 'Questions 1-5: Complete the notes below.';
    expect(parseGroupInstructions(singleLine)).toEqual({
      range: 'Questions 1-5',
      body: 'Complete the notes below.',
    });

    const noRange = 'Which paragraph contains the following information?';
    expect(parseGroupInstructions(noRange)).toEqual({
      range: null,
      body: 'Which paragraph contains the following information?',
    });

    render(<QuestionGroupInstructions instructions={raw} />);
    expect(
      screen.getByRole('region', { name: /instructions for questions 31–34/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Questions 31–34')).toBeInTheDocument();
    expect(screen.queryByText('Directive')).toBeNull();
  });
});
