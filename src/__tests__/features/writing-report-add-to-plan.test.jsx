import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ value: {} }));
const store = vi.hoisted(() => ({ items: [], read: null, update: null }));
vi.mock('@/features/auth/context/AuthContext', () => ({ useAuth: () => auth.value }));
vi.mock('@/features/testing/writing/report/planPracticeStore', () => ({
  readPlanPractice: (...args) => store.read(...args),
  updatePlanPractice: (...args) => store.update(...args),
}));

import { AddToPlan } from '@/features/testing/writing/report/components/AddToPlan';
import PlanPracticeCard from '@/features/learning/components/dashboard/PlanPracticeCard';
import { planItems } from '@/features/testing/writing/report/planAdditions';
import { reportT } from '@/features/testing/writing/report/reportStrings';

const drills = [
  { id: 'grammar', count: 2, total: 4, to: '/grammar' },
  { id: 'rewrite', count: 3, paragraph: { role: 'body', number: 1, index: 1 } },
];
const renderIn = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);
const addButton = () => screen.getByRole('button', { name: 'Add to study plan' });
const add = (props) =>
  renderIn(
    <AddToPlan t={reportT('en')} drills={drills} sessionId="s1" taskType="Task 2" {...props} />
  );

beforeEach(() => {
  auth.value = { userProfile: { id: 'u1', subscription_tier: 'pro' }, isAdmin: false };
  store.items = [];
  store.read = vi.fn(async () => store.items);
  store.update = vi.fn(async (change) => (store.items = change(store.items)));
});

describe('adding a report to the study plan', () => {
  it('saves every drill, then offers the study plan', async () => {
    add();
    await waitFor(() => expect(addButton().disabled).toBe(false));
    fireEvent.click(addButton());
    expect(await screen.findByText('Added to your study plan')).toBeTruthy();
    expect(store.items.map((item) => item.drill.id)).toEqual(['grammar', 'rewrite']);
    expect(screen.getByRole('link', { name: /Open study plan/ }).getAttribute('href')).toBe(
      '/learning-path#writing-practice'
    );
    expect(screen.queryByRole('button', { name: 'Add to study plan' })).toBeNull();
  });

  it('shows an already added report as added', async () => {
    store.items = planItems(drills, { sessionId: 's1', taskType: 'Task 2', now: 'then' });
    add();
    expect(await screen.findByText('Added to your study plan')).toBeTruthy();
    expect(store.update).not.toHaveBeenCalled();
  });

  it('says so when saving fails and lets the learner try again', async () => {
    store.update = vi.fn().mockRejectedValueOnce(new Error('offline'));
    add();
    await waitFor(() => expect(addButton().disabled).toBe(false));
    fireEvent.click(addButton());
    expect((await screen.findByRole('alert')).textContent).toContain('Could not add');
    expect(addButton().disabled).toBe(false);
    expect(screen.queryByText('Added to your study plan')).toBeNull();
  });

  it('tells a free learner the study plan is part of Pro and writes nothing', () => {
    auth.value = { userProfile: { id: 'u1', subscription_tier: 'free' }, isAdmin: false };
    add();
    const link = screen.getByRole('link', { name: /Study plan is part of Pro/ });
    expect(link.getAttribute('href')).toBe('/learning-path');
    expect(screen.queryByRole('button', { name: 'Add to study plan' })).toBeNull();
    expect(store.read).not.toHaveBeenCalled();
    expect(store.update).not.toHaveBeenCalled();
  });

  it('shows nothing without a saved report or drills', () => {
    expect(add({ sessionId: undefined }).container.textContent).toBe('');
    expect(add({ drills: [] }).container.textContent).toBe('');
  });
});

describe('the study plan card', () => {
  const listed = () => planItems(drills, { sessionId: 's1', taskType: 'Task 2', now: 'then' });

  it('stays away until something was added', async () => {
    const { container } = renderIn(<PlanPracticeCard />);
    await waitFor(() => expect(store.read).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('lists each drill with a time, a way to start and a tick', async () => {
    store.items = listed();
    renderIn(<PlanPracticeCard />);
    expect(await screen.findByText('Rewrite Body 1')).toBeTruthy();
    expect(screen.getByText('Practise grammar and spelling')).toBeTruthy();
    expect(screen.getByText('About 10 min')).toBeTruthy();
    const starts = screen.getAllByRole('link', { name: /Start/ });
    expect(starts.map((link) => link.getAttribute('href'))).toEqual([
      '/grammar',
      '/writing-task?sessionId=s1&view=true',
    ]);

    const tick = screen.getByRole('checkbox', { name: /Practise grammar and spelling/ });
    fireEvent.click(tick);
    await waitFor(() => expect(store.items[0].doneAt).toBeTruthy());
    expect(tick.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(tick);
    await waitFor(() => expect(store.items[0].doneAt).toBeNull());
  });

  it('removes an item', async () => {
    store.items = listed();
    renderIn(<PlanPracticeCard />);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove: Rewrite Body 1' }));
    await waitFor(() => expect(store.items).toHaveLength(1));
    expect(screen.queryByText('Rewrite Body 1')).toBeNull();
  });

  it('puts the tick back if it could not be saved', async () => {
    store.items = listed();
    store.update = vi.fn().mockRejectedValue(new Error('offline'));
    renderIn(<PlanPracticeCard />);
    const tick = await screen.findByRole('checkbox', { name: /Rewrite Body 1/ });
    fireEvent.click(tick);
    expect((await screen.findByRole('alert')).textContent).toContain('not saved');
    expect(tick.getAttribute('aria-checked')).toBe('false');
  });
});
