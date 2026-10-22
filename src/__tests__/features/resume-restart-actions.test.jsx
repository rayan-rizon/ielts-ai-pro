import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TestCardActions as ListeningActions,
  TestRowAction as ListeningRowAction,
} from '@/features/testing/listening/ListeningCardComponents';
import {
  WritingActions,
  TestRowAction as WritingRowAction,
} from '@/features/testing/writing/WritingCardComponents';
import {
  GridActions as SpeakingActions,
  TestRowAction as SpeakingRowAction,
} from '@/features/testing/speaking/SpeakingCardComponents';

const quotaLock = vi.hoisted(() => ({ locked: false, open: vi.fn() }));
vi.mock('@/features/testing/shared/quota/useObjectiveTestQuota', () => ({
  useQuotaLock: () => quotaLock,
}));

const test = { id: 'test-1' };
const session = { id: 'session-1' };

function renderCard(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('resume restart actions', () => {
  beforeEach(() => {
    quotaLock.locked = false;
  });

  it('lets learners restart an unfinished Speaking attempt that cannot be resumed', () => {
    const { unmount } = renderCard(
      <SpeakingActions isLocked={false} isResuming isCompleted={false} test={test} />
    );

    expect(screen.getByRole('button', { name: 'Resume Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/speaking-test?test-id=test-1&retake=true'
    );
    unmount();

    renderCard(
      <SpeakingRowAction
        isLocked={false}
        isResuming
        isCompleted={false}
        testSession={session}
        test={test}
      />
    );

    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/speaking-test?test-id=test-1&retake=true'
    );
  });

  it('shows restart beside Listening resume actions', () => {
    const { unmount } = renderCard(
      <ListeningActions
        isLocked={false}
        isResuming
        isCompleted={false}
        test={test}
        session={session}
      />
    );

    expect(screen.getByRole('button', { name: 'Resume Test' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/listening-test?test-id=test-1&retake=true'
    );
    unmount();

    renderCard(
      <ListeningRowAction
        isLocked={false}
        isResuming
        isCompleted={false}
        testSession={session}
        test={test}
      />
    );

    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/listening-test?test-id=test-1&retake=true'
    );
  });

  it('shows restart beside Writing resume actions', () => {
    const { unmount } = renderCard(
      <WritingActions
        isLocked={false}
        isResuming
        isCompleted={false}
        test={test}
        session={session}
      />
    );

    expect(screen.getByRole('button', { name: 'Resume Task' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/writing-task?taskId=test-1&new_attempt=true'
    );
    unmount();

    renderCard(
      <WritingRowAction
        isLocked={false}
        isResuming
        isCompleted={false}
        testSession={session}
        test={test}
      />
    );

    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      '/writing-task?taskId=test-1&new_attempt=true'
    );
  });

  it('opens the shared comparison from a completed Listening pair attempt', () => {
    renderCard(
      <ListeningActions
        isLocked={false}
        isResuming={false}
        isCompleted
        test={test}
        completedSession={{ id: 'session-1', paired_room_id: 'paired-room-1' }}
      />
    );

    expect(screen.getByRole('button', { name: 'Compare Results' }).closest('a')).toHaveAttribute(
      'href',
      '/listening-test/session-1?room=paired-room-1'
    );
  });
});
