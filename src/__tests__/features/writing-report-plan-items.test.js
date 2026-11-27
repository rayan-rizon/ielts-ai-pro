import { describe, expect, it } from 'vitest';
import {
  DRILL_MINUTES,
  MAX_PLAN_ITEMS,
  addPlanItems,
  allPlanned,
  planItemLink,
  planItems,
  readPlanItems,
  removePlanItem,
  setPlanItemDone,
} from '@/features/testing/writing/report/planAdditions';

const drills = [
  {
    id: 'rewrite',
    count: 3,
    action: 'revise',
    paragraph: { role: 'body', number: 1, index: 1, note: 'x'.repeat(900), words: 80 },
  },
  { id: 'grammar', count: 2, total: 4, to: '/grammar' },
  { id: 'vocabulary', words: [{ original: 'big', alternatives: ['large'] }], to: '/vocabulary' },
];
const from = (sessionId, list = drills, now = '2026-11-28T10:00:00Z') =>
  planItems(list, { sessionId, taskType: 'Task 2', now });

describe('turning drills into study plan items', () => {
  it('keeps only what the plan needs to show and open each drill', () => {
    const [rewrite] = from('s1');
    expect(rewrite).toEqual({
      id: 's1:Task 2:rewrite',
      sessionId: 's1',
      taskType: 'Task 2',
      addedAt: '2026-11-28T10:00:00Z',
      doneAt: null,
      drill: { id: 'rewrite', count: 3, paragraph: { role: 'body', number: 1 } },
    });
  });

  it('gives every kind of drill a time estimate', () => {
    for (const kind of ['rewrite', 'grammar', 'vocabulary', 'words', 'criterion'])
      expect(DRILL_MINUTES[kind]).toBeGreaterThan(0);
  });

  it('needs a saved report', () => {
    expect(planItems(drills, { sessionId: null, taskType: 'Task 2', now: 'x' })).toEqual([]);
  });
});

describe('the stored list', () => {
  it('does not duplicate a report that was already added, or untick it', () => {
    let list = addPlanItems([], from('s1'));
    list = setPlanItemDone(list, 's1:Task 2:grammar', '2026-11-29T00:00:00Z');
    const again = addPlanItems(list, from('s1'));
    expect(again).toEqual(list);
    expect(allPlanned(again, from('s1'))).toBe(true);
    expect(allPlanned(again, from('s2'))).toBe(false);
    expect(allPlanned(again, [])).toBe(false);
  });

  it('replaces an unfinished drill of the same kind but keeps finished ones', () => {
    let list = addPlanItems([], from('s1'));
    list = setPlanItemDone(list, 's1:Task 2:grammar', '2026-11-29T00:00:00Z');
    const words = [{ id: 'words', count: 2, to: '/vocabulary' }];
    list = addPlanItems(list, [...from('s2', [drills[1]]), ...from('s2', words)]);
    expect(list.map((item) => item.id)).toEqual([
      's1:Task 2:rewrite',
      's1:Task 2:grammar',
      's2:Task 2:grammar',
      // Word choice and stronger words are the same kind of practice.
      's2:Task 2:words',
    ]);
  });

  it('stays small, dropping finished items first', () => {
    const many = Array.from({ length: MAX_PLAN_ITEMS }, (_, i) => ({
      ...from(`s${i}`, [drills[0]])[0],
      drill: { id: 'rewrite', count: 1, paragraph: { role: 'body', number: 1 } },
      doneAt: i === 5 ? '2026-11-01' : null,
    }));
    const list = addPlanItems(many, from('new', [drills[1]]));
    expect(list).toHaveLength(MAX_PLAN_ITEMS);
    expect(list.map((item) => item.sessionId)).not.toContain('s5');
    expect(list.at(-1).sessionId).toBe('new');
  });

  it('unticks and removes one item', () => {
    let list = addPlanItems([], from('s1'));
    list = setPlanItemDone(list, 's1:Task 2:rewrite', 'now');
    list = setPlanItemDone(list, 's1:Task 2:rewrite', null);
    expect(list[0].doneAt).toBeNull();
    expect(removePlanItem(list, 's1:Task 2:rewrite')).toHaveLength(2);
  });

  it('ignores anything malformed in settings', () => {
    const good = from('s1')[0];
    const settings = {
      plan_practice: [good, null, 7, { id: 'x' }, { ...good, drill: { id: 'unknown' } }],
    };
    expect(readPlanItems(settings)).toEqual([good]);
    expect(readPlanItems(null)).toEqual([]);
    expect(readPlanItems({ plan_practice: 'no' })).toEqual([]);
  });
});

describe('where each item opens', () => {
  const item = (drill) => ({ ...from('s 1', [drills[0]])[0], drill });
  const report = '/writing-task?sessionId=s%201&view=true';

  it('opens the practice area, or the report itself for a rewrite', () => {
    expect(planItemLink(item({ id: 'rewrite' }))).toBe(report);
    expect(planItemLink(item({ id: 'grammar' }))).toBe('/grammar');
    expect(planItemLink(item({ id: 'words' }))).toBe('/vocabulary');
    expect(planItemLink(item({ id: 'vocabulary' }))).toBe('/vocabulary');
    expect(planItemLink(item({ id: 'criterion', to: '/grammar' }))).toBe('/grammar');
  });

  it('never follows a stored address that is not one of ours', () => {
    expect(planItemLink(item({ id: 'criterion', to: 'https://evil.test' }))).toBe(report);
    expect(planItemLink(item({ id: 'criterion' }))).toBe(report);
  });
});
