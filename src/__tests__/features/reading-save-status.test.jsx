import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTestSaving } from '@/hooks/admin/useTestSaving';
import { Passage } from '@/features/testing/shared/services/Passage';
vi.mock('@/features/testing/shared/services/Passage', () => ({
  Passage: { update: vi.fn(), create: vi.fn() },
}));
vi.mock('@/features/testing/shared/services/Question', () => ({
  Question: { bulkUpsert: vi.fn(), bulkCreate: vi.fn() },
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ not: async () => ({ data: [] }) }) }),
      delete: () => ({ eq: () => ({ filter: async () => ({ error: null }) }) }),
    }),
  },
}));
beforeEach(() => {
  vi.clearAllMocks();
  Passage.update.mockResolvedValue({ id: 'existing' });
  Passage.create.mockResolvedValue({ id: 'new' });
});
describe('Reading saves preserve publication status', () => {
  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('keeps is_active=%s during silent=%s saves', async (active, silent) => {
    const { result } = renderHook(() => useTestSaving());
    await act(async () => {
      await result.current.saveTest(
        {
          passage: { id: 'existing', title: 'Reading', test_type: 'reading', is_active: active },
          questions: [
            { id: 'question-id', type: 'short_answer', correct_answer: 'rose', question_number: 1 },
          ],
        },
        { silent }
      );
    });
    expect(Passage.update).toHaveBeenCalledWith(
      'existing',
      expect.objectContaining({ is_active: active })
    );
    expect(Passage.create).not.toHaveBeenCalled();
  });
});
