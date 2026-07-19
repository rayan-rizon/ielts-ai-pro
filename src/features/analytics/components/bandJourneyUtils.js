export function isBand(value) {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 9;
}

function halfBandsBetween(start, end) {
  if (end <= start) return [];
  const values = [];
  for (let value = Math.ceil((start + 0.01) * 2) / 2; value < end; value += 0.5) {
    values.push(Number(value.toFixed(1)));
  }
  return values;
}

function mergeDuplicateSteps(steps) {
  return steps.reduce((merged, step) => {
    const previous = merged[merged.length - 1];
    if (previous && Math.abs(previous.value - step.value) < 0.01) {
      previous.keys.push(...step.keys);
      previous.label = `${previous.label} / ${step.label}`;
      return merged;
    }
    merged.push({ ...step, keys: [...step.keys] });
    return merged;
  }, []);
}

function selectEvenly(values, count) {
  if (values.length <= count) return values;
  if (count === 1) return [values[0]];

  return Array.from({ length: count }, (_, index) => {
    const valueIndex = Math.round((index * (values.length - 1)) / (count - 1));
    return values[valueIndex];
  });
}

export function buildJourneyMilestones({ baseline, current, target }) {
  const safeCurrent = isBand(current) ? Number(current) : 0;
  const safeBaseline = isBand(baseline) ? Number(baseline) : safeCurrent;
  const safeTarget = isBand(target) && Number(target) > 0 ? Number(target) : 7;

  const isImproving = safeCurrent >= safeBaseline;
  const past = isImproving ? selectEvenly(halfBandsBetween(safeBaseline, safeCurrent), 2) : [];
  const future = selectEvenly(
    halfBandsBetween(safeCurrent, safeTarget),
    isImproving ? 1 : Math.max(1, 3 - past.length)
  );

  const steps = [
    { key: 'baseline', keys: ['baseline'], label: 'Baseline', value: safeBaseline },
    ...past.map((value, index) => ({
      key: `past-${value}`,
      keys: ['milestone'],
      label: index === 0 ? 'Foundation' : 'Developing',
      value,
    })),
    { key: 'current', keys: ['current'], label: 'Current', value: safeCurrent },
    ...future.map((value, index) => ({
      key: `future-${value}`,
      keys: ['future'],
      label: index === future.length - 1 ? 'Advanced' : 'Next milestone',
      value,
    })),
    { key: 'target', keys: ['target'], label: 'Target', value: safeTarget },
  ];

  return mergeDuplicateSteps(steps).slice(0, 6);
}
