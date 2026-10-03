import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InstitutionApply from '@/features/institution/pages/InstitutionApply';
import InstitutionApplications from '@/features/institution/components/InstitutionApplications';
import InstitutionAdmin from '@/features/institution/components/InstitutionAdmin';
import { historyChanges, ACTION_LABELS } from '@/features/institution/services/history';
import { institutionDestination } from '@/features/institution/services/entry';
import { saveRequestedDestination } from '@/features/auth/utils/authDestination';
import { validateInstitutionApplication } from '../../../supabase/functions/_shared/institutionApplications.ts';
const state = vi.hoisted(() => ({ submit: vi.fn(), request: vi.fn() }));
vi.mock('@/features/institution/services/institutions', () => ({
  submitInstitutionApplication: state.submit,
  institutionRequest: state.request,
}));
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/components/shared/DocumentHead', () => ({ default: () => null }));
beforeEach(() => {
  state.submit.mockReset();
  state.request.mockReset();
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(cleanup);
const payload = {
  institution_name: ' Centre ',
  contact_name: ' Owner ',
  email: ' Owner@Example.Test ',
  country: ' Bangladesh ',
  expected_seats: '50',
  message: '',
  request_key: '20000000-0000-0000-0000-000000000001',
};
describe('institution entry boundaries', () => {
  it('shows the requested seat count in approval history without exposing internal identifiers', () => {
    expect(ACTION_LABELS.application_approved).toBe('Institution request approved');
    const changes = historyChanges({
      after_value: {
        application_id: 'private-reference',
        name: 'Centre',
        email: 'owner@example.test',
        expected_seats: 25,
      },
    });
    expect(changes).toContainEqual(
      expect.objectContaining({ label: 'Requested student seats', after: '25' })
    );
    expect(changes.some((change) => change.key === 'application_id')).toBe(false);
  });

  it('retains invitation tokens and isolates the owner destination from learner or admin history', () => {
    expect(
      institutionDestination({
        state: { from: { pathname: '/institution/accept', search: '?token=one-use' } },
      })
    ).toBe('/institution/accept?token=one-use');
    saveRequestedDestination('/dashboard');
    expect(institutionDestination(null)).toBe('/institution');
    expect(institutionDestination({ state: { from: { pathname: '/admin/panel' } } })).toBe(
      '/institution'
    );
    sessionStorage.clear();
    saveRequestedDestination('/institution/accept?token=verify', { crossTab: true });
    sessionStorage.clear();
    expect(institutionDestination(null)).toBe('/institution/accept?token=verify');
  });
  it('normalizes and whitelists public fields without accepting an access or status override', () => {
    const value = validateInstitutionApplication({
      ...payload,
      status: 'approved',
      owner_auth_id: 'hacker',
    });
    expect(value).toMatchObject({
      institution_name: 'Centre',
      contact_name: 'Owner',
      email: 'owner@example.test',
      expected_seats: 50,
    });
    expect(value).not.toHaveProperty('status');
    expect(value).not.toHaveProperty('owner_auth_id');
  });
  it.each([
    { expected_seats: true },
    { expected_seats: 0 },
    { expected_seats: 1.2 },
    { expected_seats: 100001 },
    { email: 'invalid' },
    { institution_name: 'a' },
    { request_key: 'bad' },
    { message: 'a'.repeat(2001) },
  ])('rejects invalid public input %j', (invalid) => {
    expect(() => validateInstitutionApplication({ ...payload, ...invalid })).toThrow();
  });
});
function fillApplication() {
  for (const [label, value] of [
    ['Institution name', 'IELTS Centre'],
    ['Contact person', 'Owner Name'],
    ['Work email', 'owner@example.test'],
    ['Country', 'Bangladesh'],
    ['Expected student seats', '50'],
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
}
describe('public institution requests', () => {
  it('requires a country selection and explains the approval steps before submission', () => {
    render(
      <MemoryRouter initialEntries={['/institution/apply']}>
        <InstitutionApply />
      </MemoryRouter>
    );
    const country = screen.getByRole('combobox', { name: 'Country' });
    expect(country).toBeRequired();
    expect(country).toHaveValue('');
    expect(country.checkValidity()).toBe(false);
    fireEvent.change(country, { target: { value: 'Bangladesh' } });
    expect(country.checkValidity()).toBe(true);
    expect(screen.getByRole('list', { name: 'Institution approval steps' })).toHaveTextContent(
      'Apply'
    );
    expect(screen.getByRole('list', { name: 'Institution approval steps' })).toHaveTextContent(
      'Admin review'
    );
    expect(screen.getByRole('list', { name: 'Institution approval steps' })).toHaveTextContent(
      'Owner invitation'
    );
    expect(screen.getByRole('link', { name: 'Request access' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
  it('keeps details and the idempotency key on retry, then explains approval and billing', async () => {
    state.submit
      .mockRejectedValueOnce(new Error('Please try again'))
      .mockResolvedValueOnce({ received: true });
    render(
      <MemoryRouter>
        <InstitutionApply />
      </MemoryRouter>
    );
    fillApplication();
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Work email')).toHaveValue('owner@example.test');
    expect(screen.getByLabelText('Country')).toHaveValue('Bangladesh');
    expect(state.submit.mock.calls[0][0].country).toBe('Bangladesh');
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
    await screen.findByRole('heading', { name: 'Request received' });
    expect(state.submit.mock.calls[0][0].request_key).toBe(
      state.submit.mock.calls[1][0].request_key
    );
    expect(screen.getByText(/does not create an institution account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Already have access/ })).toHaveAttribute(
      'href',
      '/institution/login'
    );
  });
});
const application = {
  id: 'app-one',
  institution_name: 'Request Centre',
  contact_name: 'Owner Name',
  email: 'owner@example.test',
  country: 'Bangladesh',
  expected_seats: 50,
  status: 'pending',
  created_at: '2026-10-03T00:00:00Z',
};
describe('admin request inbox', () => {
  it('opens pending applications from the main admin page and keeps an explicit partner selection', async () => {
    state.request.mockImplementation(async (action) =>
      action === 'list'
        ? { enabled: true, institutions: [], pricing: [] }
        : { entries: [application], pending_count: 1, next_cursor: null }
    );
    render(
      <MemoryRouter initialEntries={['/admin/panel?tab=institutions']}>
        <InstitutionAdmin />
      </MemoryRouter>
    );
    await screen.findByText('Request Centre');
    expect(screen.getByLabelText('1 pending requests')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Institutions/ }));
    await screen.findByText('No institutions yet');
    fireEvent(window, new Event('focus'));
    await waitFor(() => expect(screen.queryByText('Request Centre')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Institution requests/ }));
    await screen.findByText('Request Centre');
  });

  it('refreshes a previously empty inbox when the admin returns from submitting an application', async () => {
    state.request.mockResolvedValueOnce({ entries: [], pending_count: 0, next_cursor: null });
    const onPendingCountChanged = vi.fn();
    render(
      <MemoryRouter>
        <InstitutionApplications onPendingCountChanged={onPendingCountChanged} />
      </MemoryRouter>
    );
    await screen.findByText('No matching requests');
    state.request.mockResolvedValue({
      entries: [application],
      pending_count: 1,
      next_cursor: null,
    });
    fireEvent(window, new Event('focus'));
    await screen.findByText('Request Centre');
    expect(onPendingCountChanged).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh requests' }));
    await waitFor(() => expect(state.request).toHaveBeenCalledTimes(3));
  });

  it('reports an inbox failure on the partners view instead of implying there are no requests', async () => {
    state.request.mockImplementation(async (action) => {
      if (action === 'list') return { enabled: true, institutions: [], pricing: [] };
      throw new Error('Inbox unavailable');
    });
    render(
      <MemoryRouter initialEntries={['/admin/panel?tab=institutions&view=partners']}>
        <InstitutionAdmin />
      </MemoryRouter>
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Inbox unavailable');
    expect(screen.queryByLabelText('0 pending requests')).not.toBeInTheDocument();
  });
  it('reviews the selected request, records a reason and currency, and exposes the institution link and delivery problem', async () => {
    const onApproved = vi.fn();
    state.request.mockImplementation(async (action) =>
      action === 'applications_list'
        ? { entries: [application], pending_count: 1, next_cursor: null }
        : {
            application: { ...application, status: 'approved', institution_id: 'school' },
            url: 'https://example.test/institution/accept?token=one',
            delivery_error: 'Invitation email is disabled; share the invitation link instead',
          }
    );
    render(
      <MemoryRouter>
        <InstitutionApplications onApproved={onApproved} />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Approve & invite owner' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('does not grant free seats');
    fireEvent.change(screen.getByLabelText('Billing currency'), { target: { value: 'BDT' } });
    fireEvent.change(screen.getByLabelText('Review reason'), {
      target: { value: 'Pilot approval' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve and send invitation' }));
    await screen.findByText('Institution approved');
    expect(state.request).toHaveBeenCalledWith('application_approve', {
      application_id: 'app-one',
      currency: 'BDT',
      reason: 'Pilot approval',
    });
    expect(screen.getByRole('link', { name: 'Open institution' })).toHaveAttribute(
      'href',
      '/admin/panel?tab=institutions&institution=school'
    );
    expect(screen.getByText(/email is disabled/)).toBeInTheDocument();
    expect(onApproved).toHaveBeenCalledOnce();
  });
  it('loads older requests and server filters without stale entries', async () => {
    state.request.mockImplementation(async (_action, data) =>
      data.status === 'declined'
        ? { entries: [], pending_count: 1, next_cursor: null }
        : {
            entries: [
              {
                ...application,
                id: data.cursor_id ? 'older' : 'newer',
                institution_name: data.cursor_id ? 'Older Centre' : 'Newer Centre',
              },
            ],
            pending_count: 1,
            next_cursor: data.cursor_id
              ? null
              : { cursor_id: 'newer', cursor_date: application.created_at },
          }
    );
    render(
      <MemoryRouter>
        <InstitutionApplications />
      </MemoryRouter>
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Load older requests' }));
    await screen.findByText('Older Centre');
    expect(screen.getByText('Newer Centre')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'declined' } });
    await screen.findByText('No matching requests');
    await waitFor(() => expect(screen.queryByText('Newer Centre')).not.toBeInTheDocument());
  });
});
