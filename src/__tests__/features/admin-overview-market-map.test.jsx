import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Recharts panels on the same page observe their container in a jsdom run.
globalThis.ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// The real world map needs ResizeObserver and an SVG layout pass; the contract
// under test is which countries reach it, so capture its props instead.
const mapCalls = [];
vi.mock('react-svg-worldmap', () => ({
  __esModule: true,
  default: (props) => {
    mapCalls.push(props);
    return <svg data-testid="world-map" />;
  },
  regions: [
    { code: 'BD' },
    { code: 'IN' },
    { code: 'UZ' },
    { code: 'PK' },
    { code: 'NP' },
    { code: 'TW' },
  ],
}));

const { AdminOverviewSections } = await import('@/components/admin/overview/AdminOverviewSections');
const { TooltipProvider } = await import('@/components/ui/tooltip');

const market = (country, signups) => ({
  country,
  signups,
  share: 1,
  activationRate: 50,
  practiceRate: 25,
  paidRate: 0,
});

const renderOverview = (data) =>
  render(
    <TooltipProvider>
      <AdminOverviewSections
        data={data}
        days={90}
        dateLabel="Sep 8"
        greeting="Morning"
        onDaysChange={() => {}}
        hourly={[]}
        maxHourly={0}
        peakHour={null}
      />
    </TooltipProvider>
  );

describe('signup market map', () => {
  it('shades every identified country, not just the ranked list', () => {
    mapCalls.length = 0;
    renderOverview({
      markets: [market('BD', 123), market('IN', 39)],
      marketMap: [
        market('BD', 123),
        market('IN', 39),
        market('UZ', 11),
        market('PK', 4),
        market('NP', 2),
        market('TW', 1),
      ],
      geoSummary: { coverageRate: 69.6, unknownSignups: 99, countries: 6 },
    });

    expect(screen.getByTestId('signup-country-map')).toBeInTheDocument();
    const { data } = mapCalls.at(-1);
    expect(data.map((entry) => entry.country)).toEqual(['bd', 'in', 'uz', 'pk', 'np', 'tw']);
  });

  it('keeps the unknown bucket out of the ranked list and the map', () => {
    mapCalls.length = 0;
    renderOverview({
      markets: [market('unknown', 99), market('BD', 12)],
      marketMap: [market('BD', 12)],
      geoSummary: { coverageRate: 10.8, unknownSignups: 99, countries: 1 },
    });

    expect(mapCalls.at(-1).data).toEqual([{ country: 'bd', value: 12 }]);
    // Only the identified market is ranked; "unknown" stays in the header
    // coverage line rather than taking a slot in the top-market list.
    expect(screen.getByText('Bangladesh')).toBeInTheDocument();
    expect(screen.queryByText((_, node) => node?.textContent === 'Unknown')).toBeNull();
  });

  it('falls back to the ranked list when the map payload is absent', () => {
    mapCalls.length = 0;
    renderOverview({
      markets: [market('BD', 12), market('IN', 3)],
      geoSummary: { coverageRate: 100, unknownSignups: 0, countries: 2 },
    });

    expect(mapCalls.at(-1).data).toEqual([
      { country: 'bd', value: 12 },
      { country: 'in', value: 3 },
    ]);
  });
});
