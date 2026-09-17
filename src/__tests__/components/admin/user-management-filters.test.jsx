import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserManagementFilters } from '@/components/admin/users/UserManagementFilters';

const filters = {
  subscription: 'all',
  subscriptionStatus: 'all',
  role: 'all',
  channel: 'all',
  search: '',
  inactiveDays: 'all',
  dateRange: 'all',
  dateField: 'created_at',
  startDate: '',
  endDate: '',
};

describe('UserManagementFilters', () => {
  it('renders selected-user actions without exposing implementation text', async () => {
    render(
      <UserManagementFilters
        filters={filters}
        onFiltersChange={vi.fn()}
        onReset={vi.fn()}
        selectedCount={1}
        loading={false}
        onWarnSelected={vi.fn()}
        onDeleteSelected={vi.fn()}
      />
    );

    expect(await screen.findByText('1 user selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send warning/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
    expect(screen.queryByText('return (')).not.toBeInTheDocument();
  });
});
