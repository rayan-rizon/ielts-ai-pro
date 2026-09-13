import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { describe, expect, it, vi } from 'vitest';
import { UserManagementTable } from '@/components/admin/users/UserManagementTable';
import { countryFlag, countryName } from '@/components/admin/shared/country';

describe('UserManagement Country display', () => {
  it('correctly generates flag emoji and country names from country codes', () => {
    expect(countryFlag('BD')).toBe('🇧🇩');
    expect(countryFlag('LK')).toBe('🇱🇰');
    expect(countryFlag('UZ')).toBe('🇺🇿');
    expect(countryFlag('IN')).toBe('🇮🇳');
    expect(countryFlag('unknown')).toBe('');
    expect(countryFlag(null)).toBe('');

    expect(countryName('BD')).toBe('Bangladesh');
    expect(countryName('LK')).toBe('Sri Lanka');
    expect(countryName('UZ')).toBe('Uzbekistan');
    expect(countryName(null)).toBe('Unknown country');
  });

  it('renders Country header in the table and displays users with country and without country', () => {
    const sampleUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Dinithi Gunarathna',
        email: 'dinithi@example.com',
        country: 'LK',
        signup_channel: 'organic_search',
        subscription_tier: 'free',
        role: 'user',
        last_active: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Tanha Islam',
        email: 'tanha@example.com',
        country: 'BD',
        signup_channel: 'paid_social',
        subscription_tier: 'free',
        role: 'user',
        last_active: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        full_name: 'Anonymous User',
        email: 'anon@example.com',
        country: null,
        signup_channel: 'direct',
        subscription_tier: 'free',
        role: 'user',
        last_active: null,
      },
    ];

    render(
      <TooltipProvider>
        <UserManagementTable
          users={sampleUsers}
          loading={false}
          selectedUsers={new Set()}
          selectAll={false}
          onToggleAll={vi.fn()}
          onToggleUser={vi.fn()}
          sortField="created_at"
          sortDirection="desc"
          onSort={vi.fn()}
          onEditUser={vi.fn()}
          onDeleteUser={vi.fn()}
          onReset={vi.fn()}
          pagination={{
            currentPage: 1,
            totalPages: 1,
            onPageChange: vi.fn(),
            pageSize: 10,
            onPageSizeChange: vi.fn(),
            totalItems: 3,
          }}
        />
      </TooltipProvider>
    );

    // Country column header
    expect(screen.getByText('Country')).toBeInTheDocument();

    // Sri Lanka row
    expect(screen.getByText('Sri Lanka')).toBeInTheDocument();
    expect(screen.getByText('LK')).toBeInTheDocument();
    expect(screen.getByText('🇱🇰')).toBeInTheDocument();

    // Bangladesh row
    expect(screen.getByText('Bangladesh')).toBeInTheDocument();
    expect(screen.getByText('BD')).toBeInTheDocument();
    expect(screen.getByText('🇧🇩')).toBeInTheDocument();

    // Fallback for null country
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Not captured')).toBeInTheDocument();
    expect(screen.queryByText('Google signup')).not.toBeInTheDocument();
  });
});
