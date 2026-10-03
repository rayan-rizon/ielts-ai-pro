import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import GrammarLab from '@/features/grammar/pages/GrammarLab';

const state = vi.hoisted(() => ({ props: null, startAttempt: vi.fn(), navigate: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => state.navigate,
}));
vi.mock('@/features/grammar/hooks/useGrammarLab', () => ({
  useGrammarLab: () => ({ dashboard: { skills: [] }, startAttempt: state.startAttempt }),
}));
vi.mock('@/features/grammar/components/GrammarDashboard', () => ({
  default: (props) => {
    state.props = props;
    return null;
  },
}));
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
vi.mock('@/features/ai-coach/components/AskAiCoachButton', () => ({ default: () => null }));

describe('Grammar action failures', () => {
  afterEach(() => vi.clearAllMocks());

  it('consumes the quota rejection and keeps the learner on the current screen', async () => {
    state.startAttempt.mockRejectedValue(
      new Error("Today's five free Grammar Lab questions are already used")
    );
    render(
      <MemoryRouter>
        <GrammarLab />
      </MemoryRouter>
    );
    let result;
    await act(async () => {
      result = await state.props.onStart({
        mode: 'practice',
        targetSkills: ['grammar_verb_forms'],
        questionCount: 5,
      });
    });
    expect(result).toBeNull();
    expect(state.navigate).not.toHaveBeenCalled();
  });

  it('navigates to the attempt only after it starts successfully', async () => {
    state.startAttempt.mockResolvedValue({ attempt: { id: 'attempt' } });
    render(
      <MemoryRouter>
        <GrammarLab />
      </MemoryRouter>
    );
    await act(async () =>
      state.props.onStart({
        mode: 'practice',
        targetSkills: ['grammar_verb_forms'],
        questionCount: 5,
      })
    );
    expect(state.navigate).toHaveBeenCalledWith('/grammar?mode=practice&skill=grammar_verb_forms', {
      replace: true,
    });
  });
});
