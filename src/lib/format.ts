/**
 * Format a band score value to a consistent one decimal place string.
 * Returns '0.0' for invalid inputs.
 */
export function formatBand(value: number | string | null | undefined): string {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0.0';
  return v.toFixed(1);
}
