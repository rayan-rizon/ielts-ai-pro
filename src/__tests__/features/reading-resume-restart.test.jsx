import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GridActions, TestRowAction } from '@/features/testing/reading/ReadingCardComponents';

const quotaLock = vi.hoisted(() => ({ locked: false, open: vi.fn() }));
vi.mock('@/features/testing/shared/quota/useObjectiveTestQuota', () => ({
  useQuotaLock: () => quotaLock,
}));

const test = { id: 'reading-test-1' };
const session = { id: 'reading-session-1' };
const restartHref = '/reading-test?test-id=reading-test-1&retake=true';

describe('Reading resume restart action', () => {
  beforeEach(() => {
    quotaLock.locked = false;
    quotaLock.open.mockClear();
  });

  it('swaps a new start for a limit button that opens the paywall once the allowance is spent', () => {
    quotaLock.locked = true;
    render(
      <MemoryRouter>
        <GridActions
          isLocked={false}
          isResuming={false}
          isCompleted={false}
          test={{ id: 't', title: 'Test 2' }}
        />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: /start practice/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /free limit reached/i }));
    expect(quotaLock.open).toHaveBeenCalledWith('Test 2');
  });

  it('keeps Resume available and routes Restart to the paywall when the allowance is spent', () => {
    quotaLock.locked = true;
    render(
      <MemoryRouter>
        <GridActions
          isLocked={false}
          isResuming
          isCompleted={false}
          test={{ id: 't', title: 'Test 2' }}
          session={session}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Resume Test' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /restart test, free limit reached/i }));
    expect(quotaLock.open).toHaveBeenCalledWith('Test 2');
  });

  it('shows restart beside Resume Test in the grid card', () => {
    render(
      <MemoryRouter>
        <GridActions
          isLocked={false}
          isResuming
          isCompleted={false}
          test={test}
          session={session}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Resume Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      restartHref
    );
  });

  it('shows restart beside Resume in the list row', () => {
    render(
      <MemoryRouter>
        <TestRowAction
          isLocked={false}
          isResuming
          isCompleted={false}
          testSession={session}
          test={test}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      restartHref
    );
  });

  it('marks a completed paired attempt and opens its shared comparison', () => {
    const pairedSession = { id: 'reading-session-1', paired_room_id: 'paired-room-1' };
    render(
      <MemoryRouter>
        <GridActions
          isLocked={false}
          isResuming={false}
          isCompleted
          test={test}
          completedSession={pairedSession}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Compare Results' }).closest('a')).toHaveAttribute(
      'href',
      '/reading-test/reading-session-1?room=paired-room-1'
    );
  });
});
