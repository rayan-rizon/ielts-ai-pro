import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LibraryPracticeLab from './pages/LibraryPracticeLab';

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
  source: { title: group.title, content: '[center]The library closes on Sunday.[/center]' },
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
  it('starts a resumable library session and moves through teaching into original questions', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Review and practise' }));
    await screen.findByRole('heading', { name: 'Original library test', level: 1 });
    fireEvent.click(screen.getByRole('button', { name: /See the approach|Start the questions/ }));
    await screen.findByText('Read the whole sentence.');
    fireEvent.click(screen.getByRole('button', { name: /See the approach|Start the questions/ }));
    await screen.findByRole('button', { name: 'Check my answers' });
    expect(screen.getByText('The library closes on Sunday.')).toBeInTheDocument();
    expect(screen.queryByText('[center]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ask your teacher' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'skill-lab',
        expect.objectContaining({
          body: expect.objectContaining({ action: 'start', groupId: 'group' }),
        })
      )
    );
  });
  it('moves to the answer review step after server scoring', async () => {
    invoke.mockImplementation(async (_, { body }) => {
      if (body.action === 'submit')
        return {
          data: {
            ...session,
            stage: 3,
            completed_at: '2026-09-08T00:00:00Z',
            result: { correct: 1, total: 1, answers: {} },
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
    fireEvent.click(screen.getByRole('button', { name: /See the approach|Start the questions/ }));
    await screen.findByRole('heading', { name: 'An approach to try' });
    fireEvent.click(screen.getByRole('button', { name: /See the approach|Start the questions/ }));
    await screen.findByRole('button', { name: 'Check my answers' });
    fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
    expect(await screen.findByRole('region', { name: 'Practice result' })).toBeInTheDocument();
    expect(screen.getByText('1 of 1 correct')).toBeInTheDocument();
  });
  it('keeps paid teacher help in a collapsible corner panel and restores keyboard focus', async () => {
    auth.user = { id: 'student', subscription_tier: 'premium' };
    invoke.mockImplementation(async (_, { body }) => ({
      data:
        body.action === 'help'
          ? { explanation: 'The passage says Sunday.', next_step: 'Check the exact detail.' }
          : { ...session, stage: 1 },
    }));
    mount('/practice-lab/session/session?library=1');
    const trigger = await screen.findByRole('button', { name: 'Ask your AI teacher' });
    expect(screen.queryByRole('textbox', { name: 'Your question' })).not.toBeInTheDocument();
    fireEvent.click(trigger);
    const input = screen.getByRole('textbox', { name: 'Your question' });
    expect(input).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Suggest an approach' }));
    expect(input).toHaveValue('Suggest an approach');
    fireEvent.click(screen.getByRole('button', { name: 'Ask your teacher' }));
    await screen.findByText(/The passage says Sunday/);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Your question' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(screen.getByText(/The passage says Sunday/)).toBeInTheDocument();
  });
  it('shows the plan link for free teacher access without sending AI requests', async () => {
    invoke.mockResolvedValue({ data: { ...session, stage: 1 } });
    mount('/practice-lab/session/session?library=1');
    fireEvent.click(await screen.findByRole('button', { name: 'Ask your AI teacher' }));
    expect(screen.getByRole('link', { name: 'Explore plans' })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('textbox', { name: 'Your question' })).not.toBeInTheDocument();
    expect(invoke.mock.calls.some(([, options]) => options.body.action === 'help')).toBe(false);
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
  });
});
