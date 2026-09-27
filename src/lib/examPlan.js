import {
  addMonths,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { EXAM_PASS_MONTHS } from '@/lib/pricingUtils';

/**
 * Picks the plan length from the learner's exam date.
 *
 * Almost every learner sits the exam within 90 days of signing up, so the
 * 3-Month Exam Pass is the natural default for anyone with more than a month
 * and a half left. Closer than that, one month is what they need and a
 * three-month charge would read as an upsell.
 */
export const EXAM_PASS_DEFAULT_MIN_DAYS = 45;

// `test_date` is a calendar date. parseISO keeps it in local time; `new Date`
// would read it as UTC midnight and show the previous day west of Greenwich.
function parseExamDate(testDate) {
  if (!testDate) return null;
  const parsed = typeof testDate === 'string' ? parseISO(testDate) : new Date(testDate);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

/**
 * `testDateSource` is 'confirmed' only when the learner picked a real date;
 * 'estimated' (a number of weeks) and 'unknown' (older accounts) are study
 * targets, which plenty of learners set and then study past. The copy only
 * calls the date an exam when it is booked.
 */
export function getExamPlanContext(testDate, now = new Date(), testDateSource = 'unknown') {
  const examDate = parseExamDate(testDate);
  if (!examDate) return null;

  const today = startOfDay(now);
  const daysUntilExam = differenceInCalendarDays(examDate, today);
  if (daysUntilExam < 0) return null;

  return {
    examDate,
    daysUntilExam,
    isBooked: testDateSource === 'confirmed',
    recommendedInterval: daysUntilExam > EXAM_PASS_DEFAULT_MIN_DAYS ? 'quarterly' : 'monthly',
  };
}

function formatExamDate(examDate, today) {
  return format(examDate, examDate.getFullYear() === today.getFullYear() ? 'd MMM' : 'd MMM yyyy');
}

/**
 * One line telling the learner whether the selected plan reaches their exam.
 * Returns null when there is nothing true and useful to say.
 */
export function describeExamCoverage(interval, context, now = new Date()) {
  if (!context) return null;

  const today = startOfDay(now);
  const accessEnds = addMonths(today, interval === 'quarterly' ? EXAM_PASS_MONTHS : 1);
  const examLabel = formatExamDate(context.examDate, today);
  const dateName = context.isBooked ? 'your exam on' : 'your target date,';

  if (context.examDate <= accessEnds) {
    return `Covers you until ${dateName} ${examLabel}`;
  }
  if (interval === 'quarterly') {
    return `Covers ${EXAM_PASS_MONTHS} months of your prep · ${context.isBooked ? 'exam on' : 'target date'} ${examLabel}`;
  }
  return null;
}
