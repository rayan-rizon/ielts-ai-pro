import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import PassageHighlighter from './components/PassageHighlighter';

const mount = () =>
  render(
    <PassageHighlighter storageKey="k">
      <div data-passage-body>We are all explorers.</div>
    </PassageHighlighter>
  );

function select(start, end) {
  const node = document.querySelector('[data-passage-body]').firstChild;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  fireEvent.mouseUp(node.parentElement);
}
const marks = () => [...document.querySelectorAll('.user-highlight')].map((el) => el.textContent);

describe('PassageHighlighter', () => {
  beforeEach(() => sessionStorage.clear());

  it('highlights the selected words and keeps them after reopening', () => {
    const view = mount();
    select(3, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight yellow' }));
    expect(marks()).toEqual(['are']);
    view.unmount();
    mount();
    expect(marks()).toEqual(['are']);
  });

  it('removes one highlight when it is chosen again', () => {
    mount();
    select(3, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Highlight green' }));
    fireEvent.click(document.querySelector('.user-highlight'));
    fireEvent.click(screen.getByRole('button', { name: 'Remove highlight' }));
    expect(marks()).toEqual([]);
  });
});
