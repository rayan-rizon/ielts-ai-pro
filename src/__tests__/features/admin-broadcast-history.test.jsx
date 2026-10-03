import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
const mocks = vi.hoisted(() => ({
  adminPage: vi.fn(),
  create: vi.fn(),
  setActive: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('@/entities', () => ({ Notification: mocks }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import BroadcastsPanel from '@/components/admin/communications/BroadcastsPanel';
const notification = (id, title) => ({
  id,
  title,
  message: 'Message',
  type: 'info',
  target_audience: 'all',
  is_active: true,
  read_count: 1501,
  created_at: '2026-10-01',
  starts_at: null,
  expires_at: null,
});
function renderPanel() {
  return render(
    <TooltipProvider>
      <BroadcastsPanel />
    </TooltipProvider>
  );
}
describe('paginated broadcast history', () => {
  beforeEach(() => vi.resetAllMocks());
  it('keeps global counts and compose fields while appending older broadcasts', async () => {
    const cursor = { date: '2026-10-01', id: 'first' };
    mocks.adminPage
      .mockResolvedValueOnce({
        entries: [notification('first', 'First broadcast')],
        cursor,
        stats: { live: 60, scheduled: 10, paused: 5, expired: 3, reads: 3005 },
      })
      .mockResolvedValue({
        entries: [notification('older', 'Older broadcast')],
        cursor: null,
        stats: { live: 60, scheduled: 10, paused: 5, expired: 3, reads: 3005 },
      });
    renderPanel();
    await waitFor(() => expect(screen.getAllByText('First broadcast').length).toBeGreaterThan(0));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Draft is retained' } });
    fireEvent.click(screen.getByText('Load older broadcasts'));
    await waitFor(() => expect(screen.getAllByText('Older broadcast').length).toBeGreaterThan(0));
    expect(screen.getByLabelText('Title')).toHaveValue('Draft is retained');
    expect(screen.getByText('3005')).toBeInTheDocument();
    expect(mocks.adminPage).toHaveBeenLastCalledWith(cursor);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('preserves loaded history on error instead of showing invented zero opens', async () => {
    mocks.adminPage
      .mockResolvedValueOnce({
        entries: [notification('first', 'Saved broadcast')],
        cursor: null,
        stats: { live: 1, scheduled: 0, paused: 0, expired: 0, reads: 1501 },
      })
      .mockRejectedValue(new Error('offline'));
    renderPanel();
    await screen.findAllByText('1501');
    fireEvent.click(screen.getByText('Refresh'));
    await screen.findByRole('alert');
    expect(screen.getAllByText('1501').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Saved broadcast').length).toBeGreaterThan(0);
  });
});
