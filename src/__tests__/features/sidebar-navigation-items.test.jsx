import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { learningToolsItems } from '@/features/core/components/Sidebar/navigationItems';
import { ReiconTarget } from '@/components/icons/ReiconTarget';

describe('Sidebar Learning Tools Navigation Items', () => {
  it('assigns distinct icons to Grammar Lab and Practice Lab', () => {
    const grammarItem = learningToolsItems.find((item) => item.title === 'Grammar Lab');
    const practiceItem = learningToolsItems.find((item) => item.title === 'Practice Lab');

    expect(grammarItem).toBeDefined();
    expect(practiceItem).toBeDefined();
    expect(grammarItem.icon).not.toBe(practiceItem.icon);
    expect(practiceItem.icon).toBe(ReiconTarget);
  });

  it('keeps the toured learning tools together in the sidebar', () => {
    expect(learningToolsItems.slice(0, 3).map((item) => item.title)).toEqual([
      'Grammar Lab',
      'Practice Lab',
      'Resources',
    ]);
  });

  it('renders ReiconTarget with correct SVG attributes', () => {
    const { container } = render(<ReiconTarget className="h-4 w-4 text-blue-500" />);
    const svg = container.querySelector('svg');

    expect(svg).toBeDefined();
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('none');
    expect(svg.classList.contains('h-4')).toBe(true);
    expect(svg.classList.contains('w-4')).toBe(true);
  });
});
