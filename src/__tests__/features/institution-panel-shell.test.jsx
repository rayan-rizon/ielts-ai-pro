import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import InstitutionPanel from '../../features/institution/pages/InstitutionPanel';
import InstitutionHistory from '../../features/institution/components/InstitutionHistory';
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
const state = vi.hoisted(() => ({ admin: false, request: vi.fn() }));
vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: state.admin, signOut: vi.fn() }),
}));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('../../features/institution/services/institutions', () => ({
  institutionRequest: state.request,
}));
const school = { id: 'school', name: 'IELTS Centre', status: 'active' };
afterEach(() => {
  cleanup();
  state.admin = false;
  state.request.mockReset();
});
describe('separate institution panel', () => {
  it('provides institution navigation without learner or platform-admin controls', async () => {
    state.request.mockImplementation(async (action) =>
      action === 'list'
        ? { enabled: true, institutions: [school] }
        : { institution: school, seats: [], orders: [], pricing: [], audit: [] }
    );
    render(
      <MemoryRouter initialEntries={['/institution']}>
        <InstitutionPanel />
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: 'IELTS Centre' });
    expect(screen.getByRole('navigation', { name: 'Institution navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buy seats' })).toHaveAttribute(
      'href',
      '/institution?institution=school&tab=subscription'
    );
    expect(screen.queryByText('Writing Practice')).not.toBeInTheDocument();
    expect(screen.queryByText('Grant free seats')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Institution sections' })
    ).not.toBeInTheDocument();
  });
  it('keeps the owner paused when the gate is off, with a clear explanation', async () => {
    state.request.mockResolvedValue({ enabled: false, institutions: [school] });
    render(
      <MemoryRouter>
        <InstitutionPanel />
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: 'Institution access is paused' });
    expect(state.request).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('navigation', { name: 'Institution navigation' })
    ).not.toBeInTheDocument();
  });
  it('allows a labelled admin preview without exposing admin management buttons', async () => {
    state.admin = true;
    state.request.mockImplementation(async (action) =>
      action === 'list'
        ? { enabled: false, institutions: [school] }
        : { institution: school, seats: [], orders: [], pricing: [], audit: [] }
    );
    render(
      <MemoryRouter>
        <InstitutionPanel />
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: 'IELTS Centre' });
    expect(screen.getByText('Institution panel preview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grant free seats' })).not.toBeInTheDocument();
  });
  it('shows errors and permits retry without remaining stuck in loading', async () => {
    state.request
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ enabled: true, institutions: [] });
    render(
      <MemoryRouter>
        <InstitutionPanel />
      </MemoryRouter>
    );
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Your institution panel' });
  });
});
describe('institution history interactions', () => {
  const entry = {
    id: 5,
    action: 'pricing',
    created_at: '2026-10-03T01:00:00Z',
    actor_auth_id: 'private-id',
    actor: { full_name: 'Admin Name', role: 'admin' },
    reason: 'Negotiated rate',
    before_value: { amount: 9.99, currency: 'USD' },
    after_value: { amount: 4.25, currency: 'USD' },
  };
  it('paginates readable history and filters from the server', async () => {
    state.request.mockImplementation(async (_action, data) =>
      data.category === 'students'
        ? { entries: [], next_cursor: null }
        : data.cursor
          ? { entries: [{ ...entry, id: 4, action: 'grant' }], next_cursor: null }
          : { entries: [entry], next_cursor: '5' }
    );
    render(<InstitutionHistory institutionId="school" seats={[]} />);
    await screen.findByText('Admin Name');
    expect(screen.queryByText('private-id')).not.toBeInTheDocument();
    expect(screen.queryByText('"before"')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('View 1 change'));
    expect(screen.getByText('$4.25')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load older activity' }));
    await screen.findByText('Free seats granted');
    expect(screen.getAllByText('Admin Name')).toHaveLength(2);
    fireEvent.change(screen.getByRole('combobox', { name: 'History activity type' }), {
      target: { value: 'students' },
    });
    await screen.findByText('No matching activity');
    await waitFor(() => expect(screen.queryByText('Pricing updated')).not.toBeInTheDocument());
  });
});
