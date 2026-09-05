// Return compact indices instead of repeating long activity keys in a small JSON budget.
export const COACH_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    headline: { type: 'STRING' },
    explanation: { type: 'STRING' },
    rankedActivityIndices: { type: 'ARRAY', items: { type: 'INTEGER' }, maxItems: 3 },
  },
  required: ['headline', 'explanation', 'rankedActivityIndices'],
};

export function isCoachResponse(value: any): boolean {
  return (
    typeof value?.headline === 'string' &&
    Boolean(value.headline.trim()) &&
    typeof value?.explanation === 'string' &&
    Boolean(value.explanation.trim()) &&
    Array.isArray(value?.rankedActivityIndices) &&
    value.rankedActivityIndices.length <= 3 &&
    value.rankedActivityIndices.every(
      (index: unknown) => Number.isInteger(index) && Number(index) >= 0
    )
  );
}

export function resolveCoachRanking(keys: string[], indices: number[]): string[] {
  const preferred = [
    ...new Set(
      indices.filter((index) => Number.isInteger(index) && index >= 0 && index < keys.length)
    ),
  ].slice(0, 3);
  return [
    ...preferred.map((index) => keys[index]),
    ...keys.filter((_, index) => !preferred.includes(index)),
  ];
}
