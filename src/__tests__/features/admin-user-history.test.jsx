import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
const data = vi.hoisted(() => ({ history: vi.fn() }));
vi.mock('@/entities', () => ({
  User: {
    getById: async () => ({ id: 'u1', full_name: 'History Learner', subscription_tier: 'free' }),
  },
  TestSession: { adminHistory: data.history },
}));
vi.mock('@/features/institution/services/institutions', () => ({
  institutionRequest: async () => ({}),
}));
vi.mock('@/utils/api', () => ({ sendEmail: vi.fn() }));
vi.mock('recharts', () => ({
  AreaChart: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: () => null,
}));
import AdminUserDetails from '@/features/admin/pages/AdminUserDetails';

describe('admin bounded user history', () => {
  it('keeps lifetime summaries while loading another metadata page without duplicate rows', async () => {
    const row = {
      id: 's1',
      test_type: 'reading',
      score: 6,
      is_completed: true,
      completed_at: '2026-10-12',
    };
    const cursor = { created_at: '2026-10-12T00:00:00Z', id: 's1' };
    data.history
      .mockResolvedValueOnce({
        sessions: [row],
        nextCursor: cursor,
        stats: {
          overallAverage: '6.5',
          totalCompleted: 60,
          moduleBreakdown: { reading: { total: 60, best: 8, average: 6.5 } },
          recentTrend: [],
        },
      })
      .mockResolvedValueOnce({
        sessions: [row, { ...row, id: 's2', test_type: 'speaking' }],
        nextCursor: null,
      });
    render(
      <MemoryRouter initialEntries={['/admin/user?userId=u1']}>
        <AdminUserDetails />
      </MemoryRouter>
    );
    const button = await screen.findByRole('button', { name: 'Load more tests' });
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
    fireEvent.click(button);
    await waitFor(() => expect(data.history).toHaveBeenCalledWith('u1', cursor));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Load more tests' })).toBeNull()
    );
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('table')).getAllByText('reading')).toHaveLength(1);
    expect(screen.getByText('speaking')).toBeInTheDocument();
  });
});
