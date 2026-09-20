import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import AdminNotificationShowcase from '@/features/marketing/pages/AdminNotificationShowcase';
import { ADMIN_NOTIFICATION_SCENARIOS } from '@/features/marketing/dev/adminNotificationScenarios';

describe('AdminNotificationShowcase', () => {
  it('renders every static learner message without delivery controls', () => {
    render(
      <MemoryRouter>
        <AdminNotificationShowcase />
      </MemoryRouter>
    );

    expect(screen.getByText('Learner notification showcase')).toBeInTheDocument();
    expect(
      screen.getByText(`${ADMIN_NOTIFICATION_SCENARIOS.length} learner states`)
    ).toBeInTheDocument();
    expect(screen.getAllByText('Claim 20% before it ends')).toHaveLength(2);
    expect(screen.getAllByRole('timer')).toHaveLength(2);
    expect(screen.queryByText('Approve message')).not.toBeInTheDocument();
  });

  it('filters the temporary gallery without changing the scenarios', () => {
    render(
      <MemoryRouter>
        <AdminNotificationShowcase />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Activation' }));
    expect(screen.getByText('2 learner states')).toBeInTheDocument();
    expect(screen.getByText('Make your first 15 minutes count')).toBeInTheDocument();
    expect(screen.queryByText('Your 20% plan offer ends in 48 hours')).not.toBeInTheDocument();
  });

  it('is wired to an admin-only dashboard route', () => {
    const appSource = readFileSync('src/App.jsx', 'utf8');
    const routeStart = appSource.indexOf("path: '/dashboard/notification-preview'");
    const routeSource = appSource.slice(routeStart, routeStart + 500);

    expect(routeStart).toBeGreaterThan(-1);
    expect(routeSource).toContain('<ProtectedRoute adminOnly');
    expect(routeSource).toContain('<AdminNotificationShowcase />');
  });
});
