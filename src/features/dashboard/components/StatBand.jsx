import React, { useMemo } from 'react';
import { Stat } from './primitives';
import { buildStatBandModel } from './statBandModel';

/** The five measured numbers worth knowing before anything else on the page. */
const StatBand = React.memo(({ stats, weeklyProgress, user }) => {
  const tiles = useMemo(
    () => buildStatBandModel(stats, weeklyProgress, user),
    [stats, weeklyProgress, user]
  );

  return (
    // 5 tiles into 2 columns (mobile/tablet, below `lg`) always strands the
    // fifth tile alone with an empty cell beside it. Spanning the last child
    // to the full row width below `lg` closes that gap instead of leaving a
    // half-empty row; at `lg` the grid is exactly 5-wide so it reverts to 1.
    <div className="grid grid-cols-2 gap-1.5 [&>*:last-child]:col-span-2 lg:grid-cols-5 lg:[&>*:last-child]:col-span-1">
      {tiles.map(({ key, ...tile }) => (
        <Stat key={key} size="sm" className="px-2.5 py-1.5" {...tile} />
      ))}
    </div>
  );
});

StatBand.displayName = 'StatBand';

export default StatBand;
