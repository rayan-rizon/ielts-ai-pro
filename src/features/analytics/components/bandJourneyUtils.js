export const BAND_PROGRESS_TABS = ['reading', 'writing', 'listening', 'speaking', 'overall'];

export function isBand(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 9;
}

export function getSeriesChange(series = []) {
  if (series.length < 2) return null;
  return Number((Number(series.at(-1).score) - Number(series.at(-2).score)).toFixed(1));
}

export function buildBandProgressView({ tab, moduleHistory = {}, overallProgress = {} }) {
  if (tab === 'overall') {
    return {
      series: overallProgress.history || [],
      qualified: Boolean(overallProgress.qualified),
      hasTrend: Boolean(overallProgress.hasTrend),
      current: overallProgress.current ?? null,
      change: overallProgress.hasTrend ? getSeriesChange(overallProgress.history) : null,
    };
  }

  const series = moduleHistory[tab] || [];
  return {
    series,
    qualified: true,
    hasTrend: series.length >= 2,
    current: series.at(-1)?.score ?? null,
    change: getSeriesChange(series),
  };
}
