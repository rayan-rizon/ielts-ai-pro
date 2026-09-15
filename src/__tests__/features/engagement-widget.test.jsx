import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import EngagementWidget from '@/features/dashboard/components/EngagementWidget';

/**
 * The heat grid renders 84 cells. It used to build a fresh Intl.DateTimeFormat
 * for each cell twice per render — once for the tooltip, once for the
 * aria-label. These tests pin the rendered output so the memoised formatter
 * cannot drift from what those two call sites used to produce, and count
 * formatter construction directly.
 */

const TOTAL_DAYS = 84;

function localKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderWidget(dailyActivity = {}) {
  return render(
    <TooltipProvider>
      <EngagementWidget dailyActivity={dailyActivity} />
    </TooltipProvider>
  );
}

describe('EngagementWidget', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders one labelled cell per day of the 12-week window', () => {
    renderWidget();
    // The panel header also renders an InfoTip button, so select the grid cells
    // by their label shape rather than taking every button on the panel.
    const cells = screen
      .getAllByRole('button')
      .filter((el) => /^\d+ sessions? on /.test(el.getAttribute('aria-label') || ''));

    expect(cells).toHaveLength(TOTAL_DAYS);

    // Every label must carry a real formatted date, never "Invalid Date".
    for (const cell of cells) {
      expect(cell.getAttribute('aria-label')).not.toMatch(/Invalid Date/);
    }
    // Labels are distinct per day, which is what the per-cell formatting produced.
    const labels = new Set(cells.map((el) => el.getAttribute('aria-label')));
    expect(labels.size).toBe(TOTAL_DAYS);
  });

  it('labels each cell with the session count for that day', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    renderWidget({ [localKey(yesterday)]: 3 });

    const expected = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(yesterday);

    expect(screen.getByLabelText(`3 sessions on ${expected}`)).toBeInTheDocument();
  });

  it('singularises a one-session day', () => {
    const target = new Date();
    target.setDate(target.getDate() - 5);
    renderWidget({ [localKey(target)]: 1 });

    const expected = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(target);

    expect(screen.getByLabelText(`1 session on ${expected}`)).toBeInTheDocument();
  });

  it("marks today's cell with the (Today) suffix", () => {
    renderWidget();
    const today = new Date();
    const expected = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(today);

    expect(screen.getByLabelText(`0 sessions on ${expected} (Today)`)).toBeInTheDocument();
  });

  it('summarises totals in the footnote', () => {
    const a = new Date();
    a.setDate(a.getDate() - 2);
    const b = new Date();
    b.setDate(b.getDate() - 9);

    renderWidget({ [localKey(a)]: 2, [localKey(b)]: 5 });

    expect(screen.getByText('7')).toBeInTheDocument(); // total sessions
    expect(screen.getByText('2')).toBeInTheDocument(); // active days
  });

  it('builds no Intl.DateTimeFormat during render', () => {
    // The formatter is constructed once at module load, before this spy exists.
    // Any construction observed here is a per-render one.
    const spy = vi.spyOn(Intl, 'DateTimeFormat');
    renderWidget({ [localKey(new Date())]: 4 });
    expect(spy).not.toHaveBeenCalled();
  });
});
