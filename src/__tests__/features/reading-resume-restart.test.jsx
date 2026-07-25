import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GridActions, TestRowAction } from '@/features/testing/reading/ReadingCardComponents';

const test = { id: 'reading-test-1' };
const session = { id: 'reading-session-1' };
const restartHref = '/reading-test?test-id=reading-test-1&retake=true';

describe('Reading resume restart action', () => {
  it('shows restart beside Resume Test in the grid card', () => {
    render(
      <MemoryRouter>
        <GridActions
          isLocked={false}
          isResuming
          isCompleted={false}
          test={test}
          session={session}
          color="orange"
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
          color="orange"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart test' }).closest('a')).toHaveAttribute(
      'href',
      restartHref
    );
  });
});
