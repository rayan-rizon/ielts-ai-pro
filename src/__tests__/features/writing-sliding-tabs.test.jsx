import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SlidingTabs } from '@/features/testing/writing/report/components/SlidingTabs';

const options = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Second' },
  { value: 'c', label: 'Third' },
];

function Controlled({ onChange = () => {}, dir = 'ltr', role }) {
  const [value, setValue] = useState('a');
  return (
    <div dir={dir}>
      <SlidingTabs
        label="Views"
        role={role}
        options={options}
        value={value}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    </div>
  );
}

const indicator = () => document.querySelector('[data-indicator]');
const nextFrame = () => act(() => new Promise((done) => requestAnimationFrame(() => done())));

describe('sliding tabs', () => {
  it('marks the chosen option and reports a new choice once', () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'First' })).toBeChecked();

    fireEvent.click(screen.getByRole('radio', { name: 'Second' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Second' }));

    expect(screen.getByRole('radio', { name: 'Second' })).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('can speak as a tab list', () => {
    render(<Controlled role="tablist" />);
    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves with the arrow keys, mirrored when the page reads right to left', () => {
    const { unmount } = render(<Controlled />);
    fireEvent.keyDown(screen.getByRole('radio', { name: 'First' }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Second' })).toBeChecked();
    unmount();

    render(<Controlled dir="rtl" />);
    fireEvent.keyDown(screen.getByRole('radio', { name: 'First' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { name: 'Second' })).toBeChecked();
  });

  it('glides after a tap, but jumps for the keyboard and never flies in on arrival', async () => {
    render(<Controlled />);
    // First placement is instant.
    expect(indicator().className).not.toContain('transition-');
    await nextFrame();

    fireEvent.click(screen.getByRole('radio', { name: 'Second' }));
    expect(indicator().className).toContain('transition-[transform,width,height]');
    expect(indicator().className).toContain('motion-reduce:transition-none');

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Second' }), { key: 'ArrowRight' });
    expect(indicator().className).not.toContain('transition-[transform,width,height]');
  });
});

describe('the writing page’s tabs', () => {
  const page = readFileSync(resolve('src/features/testing/writing/pages/WritingTask.jsx'), 'utf8');

  it('use the sliding indicator', () => {
    expect(page.match(/<SlidingTabs/g)).toHaveLength(2);
    expect(page).not.toContain('layoutId=');
  });

  it('swap panes at once, without waiting for the old one to fade out', () => {
    const body = page.slice(page.indexOf('function WritingPaneBody('));
    expect(body.slice(0, body.indexOf('\nfunction '))).not.toContain('mode="wait"');
    expect(page).toContain('starting:opacity-0');
  });
});
