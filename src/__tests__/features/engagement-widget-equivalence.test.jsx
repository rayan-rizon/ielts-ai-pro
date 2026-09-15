import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import EngagementWidget from '@/features/dashboard/components/EngagementWidget';
import OldEngagementWidget from './__fixtures__/EngagementWidget.pre-optimisation';

/**
 * Renders the pre-optimisation widget (copied verbatim from 8b1edee3) beside the
 * current one and asserts the produced DOM is identical.
 *
 * This is the check that matters: the optimisation moved label construction out
 * of the render body and into the memo, so the only thing that must be proven is
 * that nothing a user or a screen reader can observe changed.
 *
 * Delete this file and `__fixtures__/EngagementWidget.pre-optimisation.jsx` once the change has shipped.
 */

function localKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localKey(d);
}

function markup(Component, dailyActivity) {
  const { container, unmount } = render(
    <TooltipProvider>
      <Component dailyActivity={dailyActivity} />
    </TooltipProvider>
  );
  const html = container.innerHTML;
  unmount();
  return html;
}

const FIXTURES = {
  'no activity at all': {},
  'a single session today': { [daysAgo(0)]: 1 },
  'one session yesterday': { [daysAgo(1)]: 1 },
  'a busy scattered quarter': {
    [daysAgo(0)]: 2,
    [daysAgo(1)]: 1,
    [daysAgo(6)]: 9,
    [daysAgo(13)]: 4,
    [daysAgo(27)]: 1,
    [daysAgo(41)]: 7,
    [daysAgo(60)]: 3,
    [daysAgo(83)]: 5,
  },
  'activity on the oldest day in range': { [daysAgo(83)]: 1 },
  'activity outside the window is ignored': { [daysAgo(200)]: 12, [daysAgo(10)]: 2 },
  'a very heavy day rescaling the ramp': { [daysAgo(4)]: 40, [daysAgo(5)]: 1 },
};

describe('EngagementWidget renders identically to the pre-optimisation version', () => {
  for (const [name, dailyActivity] of Object.entries(FIXTURES)) {
    it(name, () => {
      const before = markup(OldEngagementWidget, dailyActivity);
      const after = markup(EngagementWidget, dailyActivity);
      expect(after).toBe(before);
    });
  }
});
