import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync('src/components/admin/overview/AdminOverviewSections.jsx', 'utf8');

/**
 * The overview is a 12-column grid with no explicit row starts, so every panel
 * simply flows. A panel whose width does not complete a row pushes a ragged gap
 * through every row below it — which is exactly what happened when the
 * onboarding offer panel was added as a 4 next to an already-full set of rows.
 * This locks the packing so the next panel cannot quietly do it again.
 */
// Tailwind breakpoints cascade upward, so an xl layout inherits any lg span
// that xl does not override. Resolving in that order is what makes the xl row
// check meaningful rather than a second copy of the lg one.
const CASCADE = { lg: ['lg'], xl: ['xl', 'lg'] };

const spanOf = (component, breakpoint) => {
  const declaration = SOURCE.slice(SOURCE.indexOf(`const ${component} = `));
  const className = declaration.match(/className="(col-span-12[^"]*)"/)?.[1];
  if (!className) throw new Error(`No grid wrapper found for ${component}`);
  for (const prefix of CASCADE[breakpoint]) {
    const scoped = className.match(new RegExp(`${prefix}:col-span-(\\d+)`));
    if (scoped) return Number(scoped[1]);
  }
  // Panels that stay full width at this breakpoint own a whole row.
  return 12;
};

const renderOrder = () => {
  const grid = SOURCE.slice(SOURCE.indexOf('<div className="grid grid-cols-12 gap-3">'));
  return [...grid.matchAll(/<([A-Z]\w+)(?:\s|\/|>)/g)]
    .map((match) => match[1])
    .filter((name) => SOURCE.includes(`const ${name} = `));
};

const packIntoRows = (spans) =>
  spans.reduce((rows, span) => {
    const current = rows[rows.length - 1];
    if (!current || current + span > 12) rows.push(span);
    else rows[rows.length - 1] = current + span;
    return rows;
  }, []);

describe('admin overview grid packing', () => {
  it.each(['lg', 'xl'])('fills every %s row to exactly 12 columns', (breakpoint) => {
    const panels = renderOrder();
    expect(panels.length).toBeGreaterThan(5);

    const rows = packIntoRows(panels.map((panel) => spanOf(panel, breakpoint)));

    expect(rows.every((row) => row === 12)).toBe(true);
  });

  it('keeps the plan offer inside the signup card rather than beside it', () => {
    const panels = renderOrder();

    expect(panels).toContain('RecentSignupsPanel');
    expect(panels).not.toContain('OnboardingOfferPanel');
    expect(SOURCE).toContain('<OfferSummary offer={offer} displayDays={displayDays} />');
  });
});
