import { describe, expect, it } from 'vitest';
import {
  describeExamCoverage,
  EXAM_PASS_DEFAULT_MIN_DAYS,
  getExamPlanContext,
} from '@/lib/examPlan';

// Local noon, so the calendar-day arithmetic is independent of the runner's zone.
const TODAY = new Date(2026, 8, 27, 12, 0, 0);
const booked = (date) => getExamPlanContext(date, TODAY, 'confirmed');

describe('getExamPlanContext', () => {
  it('has nothing to say without a usable, future exam date', () => {
    expect(getExamPlanContext(null, TODAY)).toBeNull();
    expect(getExamPlanContext('', TODAY)).toBeNull();
    expect(getExamPlanContext('not-a-date', TODAY)).toBeNull();
    expect(getExamPlanContext('2026-09-26', TODAY)).toBeNull();
  });

  it('defaults to the Exam Pass only when more than 45 days remain', () => {
    expect(EXAM_PASS_DEFAULT_MIN_DAYS).toBe(45);
    // 27 Sep + 45 days = 11 Nov; + 46 days = 12 Nov.
    expect(getExamPlanContext('2026-11-11', TODAY)).toMatchObject({
      daysUntilExam: 45,
      recommendedInterval: 'monthly',
    });
    expect(getExamPlanContext('2026-11-12', TODAY)).toMatchObject({
      daysUntilExam: 46,
      recommendedInterval: 'quarterly',
    });
    expect(getExamPlanContext('2026-09-27', TODAY)).toMatchObject({
      daysUntilExam: 0,
      recommendedInterval: 'monthly',
    });
  });

  it('reads test_date as a calendar day, not UTC midnight', () => {
    // new Date('2026-12-10') is 9 Dec in the Americas; the exam is on the 10th.
    const context = booked('2026-12-10');
    expect(context.examDate.getDate()).toBe(10);
    expect(context.examDate.getMonth()).toBe(11);
  });
});

describe('describeExamCoverage', () => {
  it('says the pass covers an exam inside its three months', () => {
    const context = booked('2026-12-10');
    expect(describeExamCoverage('quarterly', context, TODAY)).toBe(
      'Covers you until your exam on 10 Dec'
    );
  });

  it('says the monthly plan covers an exam inside one month', () => {
    const context = booked('2026-10-15');
    expect(describeExamCoverage('monthly', context, TODAY)).toBe(
      'Covers you until your exam on 15 Oct'
    );
  });

  it('does not claim a month covers an exam that is further away', () => {
    const context = booked('2026-12-10');
    expect(describeExamCoverage('monthly', context, TODAY)).toBeNull();
  });

  it('is honest when the exam is beyond the pass, and names the year', () => {
    const context = booked('2027-03-10');
    expect(describeExamCoverage('quarterly', context, TODAY)).toBe(
      'Covers 3 months of your prep · exam on 10 Mar 2027'
    );
  });

  it('counts the last day of the pass as covered', () => {
    const context = booked('2026-12-27');
    expect(describeExamCoverage('quarterly', context, TODAY)).toBe(
      'Covers you until your exam on 27 Dec'
    );
  });

  it('calls an estimated or older date a target, not an exam', () => {
    const estimated = getExamPlanContext('2026-12-10', TODAY, 'estimated');
    expect(describeExamCoverage('quarterly', estimated, TODAY)).toBe(
      'Covers you until your target date, 10 Dec'
    );
    const legacy = getExamPlanContext('2027-03-10', TODAY);
    expect(describeExamCoverage('quarterly', legacy, TODAY)).toBe(
      'Covers 3 months of your prep · target date 10 Mar 2027'
    );
    // The plan length default does not depend on whether the date is booked.
    expect(estimated.recommendedInterval).toBe('quarterly');
  });

  it('stays silent without an exam date', () => {
    expect(describeExamCoverage('quarterly', null, TODAY)).toBeNull();
  });
});
