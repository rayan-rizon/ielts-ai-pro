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
    fireEvent.click(await screen.findByRole('button', { name: 'Review and practise' }));
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
      /^1Practise this set2Review your answers$/
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
      /^1Review your mistake2Practise this set3Review your answers$/
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
    fireEvent.click(screen.getByRole('button', { name: 'Review and practise' }));
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
  it('updates the next step and source picker when a different card is selected', async () => {
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
    const picker = screen.getByRole('combobox', { name: 'Choose a source set' });
    fireEvent.click(picker);
    expect(
      screen.getByRole('option', { name: /Another original library test/ })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /Another original library test/ }));
    expect(picker).toHaveTextContent(/Another original library test/);
    fireEvent.click(screen.getByRole('button', { name: /Summary completion/ }));
    expect(screen.getAllByRole('heading', { name: 'Summary completion' }).length).toBeGreaterThan(
      0
    );
    const selected = screen.getByRole('region', { name: 'Selected question type' });
    expect(selected).toHaveTextContent('Summary completion');
    expect(selected).toHaveTextContent('Choose a real library set');
    expect(screen.getAllByRole('button', { name: 'Review and practise' })).toHaveLength(2);
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
    expect(screen.getByText('Directive')).toBeInTheDocument();
  });
});
