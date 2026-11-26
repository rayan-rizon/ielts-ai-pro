import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { resultRows, resultLink, resultNotes } from './practiceResultRows';
import ResultList from './components/home/ResultList';

const need = {
  focus: 'reading:matching_information',
  sources: [
    { sessionId: 'p1', practice: true, title: 'IELTS 13 Test 4', completedAt: '2026-09-18' },
    { sessionId: 't1', practice: false, title: 'IELTS 15 Test 1', completedAt: '2026-09-10' },
  ],
  history: [
    { correct: 3, total: 5, answered: 5, status: 'repeat', completedAt: '2026-09-18' },
    { correct: 1, total: 6, answered: 2, status: 'counted', completedAt: '2026-09-10' },
  ],
};

describe('result rows', () => {
  it('joins each result with its source and keeps the focus', () => {
    expect(resultRows(need)[1]).toMatchObject({
      focus: need.focus,
      sessionId: 't1',
      title: 'IELTS 15 Test 1',
      correct: 1,
      total: 6,
    });
  });
  it('opens a practice result and a full test result at their own pages', () => {
    const [practiceRow, testRow] = resultRows(need);
    expect(resultLink(practiceRow)).toBe('/practice-lab/session/p1?library=1');
    expect(resultLink(testRow)).toBe('/reading-test/t1?view-results=true');
    expect(resultLink({ ...testRow, focus: 'listening:multiple_choice' })).toBe(
      '/listening-test/t1?view-results=true'
    );
  });
  it('says what was left blank and why a result is not counted', () => {
    const [practiceRow, testRow] = resultRows(need);
    expect(resultNotes(practiceRow)).toEqual(['Not counted: you had answered these before']);
    expect(resultNotes(testRow)).toEqual(['4 not answered']);
    expect(resultNotes({ ...testRow, answered: 0, status: 'blank' })).toEqual([
      '6 not answered',
      'Not counted: nothing was answered',
    ]);
  });
  it('adds no note when the server does not send these details yet', () => {
    expect(resultNotes({ correct: 1, total: 5 })).toEqual([]);
  });
});

describe('ResultList', () => {
  it('shows the test name, score and note as one link', () => {
    render(
      <MemoryRouter>
        <ResultList rows={resultRows(need)} />
      </MemoryRouter>
    );
    const [first] = screen.getAllByRole('link');
    expect(first).toHaveAttribute('href', '/practice-lab/session/p1?library=1');
    expect(first).toHaveTextContent('IELTS 13 Test 4');
    expect(first).toHaveTextContent('Practice set');
    expect(first).toHaveTextContent('3 of 5 correct');
    expect(first).toHaveTextContent('Not counted: you had answered these before');
  });
  it('falls back to a plain name when a practice result has no title', () => {
    render(
      <MemoryRouter>
        <ResultList
          rows={[{ ...resultRows(need)[0], title: undefined, kind: 'Familiar passage or audio' }]}
        />
      </MemoryRouter>
    );
    const link = screen.getByRole('link');
    expect(within(link).getByText('Untitled test')).toBeInTheDocument();
    expect(link).not.toHaveTextContent('Familiar passage or audio');
    fireEvent.focus(link);
  });
});
