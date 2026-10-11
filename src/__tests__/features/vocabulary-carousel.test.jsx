import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WordGroupList from '@/features/vocabulary/components/WordGroupList';

vi.mock('@/features/vocabulary/components/Kit3DIcons', () => ({ default: () => null }));
vi.mock('@/features/subscription/components/ContentStatusBadge', () => ({ default: () => null }));

let callback;
let time;
let reduced;
function frame(delta = 16) {
  time += delta;
  act(() => callback(time));
}
function setup() {
  render(
    <MemoryRouter>
      <WordGroupList />
    </MemoryRouter>
  );
  const viewport = screen.getByRole('region', { name: 'Slow-moving Vocabulary Kits carousel' });
  const count = viewport.children.length / 2;
  Object.defineProperty(viewport.children[0], 'offsetLeft', { value: 4 });
  Object.defineProperty(viewport.children[count], 'offsetLeft', { value: 1009 });
  viewport.scrollTo = vi.fn(({ left }) => {
    viewport.scrollLeft = Math.round(left);
  });
  viewport.scrollBy = vi.fn(({ left }) => {
    viewport.scrollLeft += left;
  });
  frame();
  return viewport;
}
beforeEach(() => {
  time = 0;
  reduced = false;
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((fn) => {
      callback = fn;
      return 1;
    })
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query) => ({ matches: query.includes('reduced-motion') ? reduced : true }))
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Vocabulary carousel motion', () => {
  it('accumulates fractional movement even when scrollLeft is rounded', () => {
    const viewport = setup();
    for (let i = 0; i < 60; i++) frame();
    expect(viewport.scrollLeft).toBe(13);
  });
  it('keeps focus paused after the pointer leaves and resumes on blur', () => {
    const viewport = setup();
    fireEvent.mouseEnter(viewport);
    fireEvent.focus(viewport.querySelector('a'));
    fireEvent.mouseLeave(viewport);
    frame(64);
    expect(viewport.scrollLeft).toBe(0);
    fireEvent.blur(viewport.querySelector('a'), { relatedTarget: document.body });
    frame(64);
    expect(viewport.scrollLeft).toBe(1);
  });
  it('wraps at the actual duplicate position', () => {
    const viewport = setup();
    fireEvent.mouseEnter(viewport);
    viewport.scrollLeft = 1004;
    frame();
    fireEvent.mouseLeave(viewport);
    frame(64);
    frame(64);
    expect(viewport.scrollLeft).toBe(1);
  });
  it('resumes after manual navigation without overriding hover', () => {
    const viewport = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Show next Vocabulary Kits' }));
    fireEvent.mouseEnter(viewport);
    for (let i = 0; i < 110; i++) frame();
    expect(viewport.scrollLeft).toBe(230);
    fireEvent.mouseLeave(viewport);
    for (let i = 0; i < 10; i++) frame();
    expect(viewport.scrollLeft).toBeGreaterThan(230);
  });
  it('respects reduced motion for autoplay and arrow navigation', () => {
    reduced = true;
    const viewport = setup();
    frame(64);
    expect(viewport.scrollLeft).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Show next Vocabulary Kits' }));
    expect(viewport.scrollBy).toHaveBeenCalledWith({ left: 230, behavior: 'instant' });
  });
});
