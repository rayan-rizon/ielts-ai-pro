import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import ProductTour from '@/features/dashboard/components/ProductTour';
import { buildProductTourSteps } from '@/features/dashboard/lib/productTourSteps';
import {
  hasQueuedProductTour,
  queueProductTour,
} from '@/features/dashboard/lib/productTourStorage';

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
}

function TourHarness({ user }) {
  return (
    <>
      <div data-tour="dashboard-stats">Dashboard stats</div>
      <div data-tour="skill-launcher">Skill launcher</div>
      <div data-tour="dashboard-next-up">Next up</div>
      <div data-tour="grammar-lab">Grammar Lab</div>
      <div data-tour="practice-lab">Practice Lab</div>
      <div data-tour="analytics">Analytics</div>
      <div data-tour="learning-path">Learning path</div>
      <ProductTour user={user} />
      <LocationProbe />
    </>
  );
}

function renderTour(user = { id: 'learner-1', full_name: 'Sam Learner' }) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <TourHarness user={user} />
    </MemoryRouter>
  );
}

describe('new learner product tour', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('queues the tour per user after onboarding', () => {
    queueProductTour('learner-1');

    expect(hasQueuedProductTour('learner-1')).toBe(true);
    expect(hasQueuedProductTour('learner-2')).toBe(false);
  });

  it('opens each post-dashboard page while pointing only at its sidebar row', () => {
    const steps = buildProductTourSteps({ id: 'learner-1' }).slice(3);

    expect(steps.map(({ id, route, target }) => ({ id, route, target }))).toEqual([
      { id: 'grammar-lab', route: '/grammar', target: '[data-tour="grammar-lab"]' },
      { id: 'practice-lab', route: '/practice-lab', target: '[data-tour="practice-lab"]' },
      { id: 'analytics', route: '/analytics', target: '[data-tour="analytics"]' },
      { id: 'learning-path', route: '/upgrade', target: '[data-tour="learning-path"]' },
    ]);
    expect(steps.every((step) => step.body.length < 100)).toBe(true);
  });

  it('opens by default on the first dashboard load after onboarding', () => {
    queueProductTour('learner-1');
    renderTour();

    expect(
      screen.getByRole('heading', { name: 'Your workspace is ready, Sam' })
    ).toBeInTheDocument();
    expect(screen.getAllByAltText('IELTS AI Pro Logo')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Take a quick 1-minute tour to explore your dashboard/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveStyle({ opacity: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'I’ll explore on my own' }));

    expect(hasQueuedProductTour('learner-1')).toBe(false);
  });

  it('closes the tour when the top right cross button is clicked in the welcome dialog', () => {
    queueProductTour('learner-1');
    renderTour();

    const closeButton = screen.getByRole('button', { name: 'Close tour' });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(hasQueuedProductTour('learner-1')).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('formats uncapitalized learner names without rogue spacing before the comma', () => {
    queueProductTour('learner-alex');
    renderTour({ id: 'learner-alex', full_name: 'alex' });

    expect(
      screen.getByRole('heading', { name: 'Your workspace is ready, Alex' })
    ).toBeInTheDocument();
  });

  it('shows three dashboard moments before opening the four sidebar destinations', () => {
    queueProductTour('learner-1');
    renderTour();

    fireEvent.click(screen.getByRole('button', { name: /Show me around/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Dashboard · 1 of 3');
    expect(screen.getByRole('heading', { name: 'Your progress at a glance' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Dashboard · 2 of 3');
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Dashboard · 3 of 3');

    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/grammar');
    expect(screen.getByRole('heading', { name: 'Grammar Lab' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/practice-lab');
    expect(screen.getByRole('heading', { name: 'Practice Lab' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/analytics');
    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/upgrade');
    expect(
      screen.getByRole('heading', { name: 'Preview your AI Learning Path' })
    ).toBeInTheDocument();
  });

  it('opens the real Learning Path for paid learners', () => {
    queueProductTour('learner-1');
    renderTour({ id: 'learner-1', subscription_tier: 'pro' });
    fireEvent.click(screen.getByRole('button', { name: /Show me around/ }));

    for (let index = 0; index < 6; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }

    expect(screen.getByLabelText('current route')).toHaveTextContent('/learning-path');
    expect(
      screen.getByRole('heading', { name: 'Follow one adaptive study plan' })
    ).toBeInTheDocument();
  });

  it('resumes the active step after the shared layout remounts on navigation', () => {
    queueProductTour('learner-1');
    const firstRender = renderTour();

    fireEvent.click(screen.getByRole('button', { name: /Show me around/ }));
    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }

    expect(screen.getByLabelText('current route')).toHaveTextContent('/grammar');
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/reading']}>
        <TourHarness user={{ id: 'learner-1', full_name: 'Sam Learner' }} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Grammar Lab' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('Step 4 of 7');
  });
});
