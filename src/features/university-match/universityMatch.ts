/**
 * University IELTS requirement matching.
 *
 * Every number a learner sees here comes from a human-verified entry in
 * data/<country>.json, never from a model at request time: a wrong band here
 * sends someone to an application they cannot win. The AI classifier in the
 * curation pipeline proposes entries; a person approves them before they land.
 */

export type StudyLevel = 'undergraduate' | 'postgraduate';

export type SkillName = 'listening' | 'reading' | 'writing' | 'speaking';

export const SKILL_NAMES: readonly SkillName[] = ['listening', 'reading', 'writing', 'speaking'];

export type SkillScores = Partial<Record<SkillName, number>>;

export interface LearnerScores {
  overall: number;
  skills?: SkillScores;
}

export interface Requirement {
  /**
   * The band to match against. Where a university publishes one institution-wide
   * minimum this is that minimum; where it publishes tiers (the common UK case)
   * this is the typical tier, and `range` carries the published spread.
   */
  overall: number;
  /** Floor applied to all four skills unless a per-skill value overrides it. */
  minComponent?: number;
  /** Per-skill minimums that override `minComponent` (Nursing writing 7.0, etc). */
  skills?: SkillScores;
  /**
   * The published spread across courses, for the many universities that set
   * requirements per department rather than centrally. Presenting the typical
   * figure alone would read as a promise the university never made.
   */
  range?: { min: number; max: number };
}

export interface ProgrammeRequirement {
  programme: string;
  level?: StudyLevel;
  requirement: Requirement;
}

export interface UniversityEntry {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
  city?: string;
  /**
   * False for programmes that do not take IELTS at all — common for
   * German-taught degrees wanting TestDaF/DSH. Showing a band for these
   * would be worse than showing nothing.
   */
  ieltsAccepted: boolean;
  /**
   * Whether `requirements` is a university-wide baseline or a figure that only
   * holds for specific programmes. Dutch, German and Swedish entries are
   * usually 'programme'.
   */
  scope: 'university' | 'programme';
  requirements: Partial<Record<StudyLevel, Requirement>>;
  /** Named programmes that sit above the baseline. */
  higherRequirementProgrammes?: ProgrammeRequirement[];
  /** Other accepted proofs of English (TOEFL, Cambridge, prior EMI degree). */
  alternatives?: string[];
  /** University runs a pre-sessional English route for near-miss applicants. */
  preSessional?: boolean;
  notes?: string;
  /** The university's own requirements page. Shown to every learner. */
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) a human last checked `sourceUrl`. */
  lastVerified: string;
}

export type MatchOutcome = 'safe' | 'match' | 'reach' | 'unlikely' | 'not-accepted' | 'unknown';

export interface SkillShortfall {
  skill: SkillName;
  required: number;
  actual: number;
  gap: number;
}

export interface MatchResult {
  entry: UniversityEntry;
  level: StudyLevel;
  outcome: MatchOutcome;
  requirement: Requirement | null;
  /** Overall shortfall in bands; 0 when the overall band is met. */
  overallGap: number;
  /** Every skill below its minimum, worst first. */
  shortfalls: SkillShortfall[];
  /** Skills the learner did not supply, so the match could not check them. */
  unverifiedSkills: SkillName[];
  /**
   * True when the learner clears the top of a published range, i.e. qualifies
   * for the university's most demanding courses rather than only its least.
   * Null when the university publishes no range.
   */
  clearsWholeRange: boolean | null;
  verification: VerificationStatus;
}

export type VerificationStatus = 'fresh' | 'review-due' | 'stale';

const REVIEW_DUE_DAYS = 180;
const STALE_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bands move in half steps, and floating point does not. Comparing raw floats
 * made 6.5 >= 6.5 fail on values parsed from JSON in earlier spikes.
 */
function toHalfSteps(band: number): number {
  return Math.round(band * 2);
}

function meets(actual: number, required: number): boolean {
  return toHalfSteps(actual) >= toHalfSteps(required);
}

function gapBetween(actual: number, required: number): number {
  const gap = (toHalfSteps(required) - toHalfSteps(actual)) / 2;
  return gap > 0 ? gap : 0;
}

/** The minimum a given skill must reach, or null when nothing constrains it. */
export function skillMinimum(requirement: Requirement, skill: SkillName): number | null {
  const override = requirement.skills?.[skill];
  if (typeof override === 'number') return override;
  if (typeof requirement.minComponent === 'number') return requirement.minComponent;
  return null;
}

export function verificationStatus(
  entry: Pick<UniversityEntry, 'lastVerified'>,
  now: Date = new Date()
): VerificationStatus {
  const verified = Date.parse(`${entry.lastVerified}T00:00:00Z`);
  if (Number.isNaN(verified)) return 'stale';
  const ageDays = (now.getTime() - verified) / DAY_MS;
  if (ageDays > STALE_DAYS) return 'stale';
  if (ageDays > REVIEW_DUE_DAYS) return 'review-due';
  return 'fresh';
}

/**
 * Match one learner against one university at one study level.
 *
 * A learner who clears the overall band but misses a skill floor is NOT a
 * match — that combination (6.5 overall, 5.5 writing) is the single most
 * common real rejection, so it must never surface as qualifying.
 */
export function matchUniversity(
  entry: UniversityEntry,
  level: StudyLevel,
  scores: LearnerScores,
  now: Date = new Date()
): MatchResult {
  const verification = verificationStatus(entry, now);
  const base: Omit<MatchResult, 'outcome' | 'requirement'> = {
    entry,
    level,
    overallGap: 0,
    shortfalls: [],
    unverifiedSkills: [],
    clearsWholeRange: null,
    verification,
  };

  if (!entry.ieltsAccepted) {
    return { ...base, outcome: 'not-accepted', requirement: null };
  }

  const requirement = entry.requirements[level];
  if (!requirement) {
    return { ...base, outcome: 'unknown', requirement: null };
  }

  const overallGap = gapBetween(scores.overall, requirement.overall);

  const shortfalls: SkillShortfall[] = [];
  const unverifiedSkills: SkillName[] = [];

  for (const skill of SKILL_NAMES) {
    const required = skillMinimum(requirement, skill);
    if (required === null) continue;

    const actual = scores.skills?.[skill];
    if (typeof actual !== 'number') {
      unverifiedSkills.push(skill);
      continue;
    }

    if (!meets(actual, required)) {
      shortfalls.push({
        skill,
        required,
        actual,
        gap: gapBetween(actual, required),
      });
    }
  }

  shortfalls.sort((a, b) => b.gap - a.gap);

  const worstGap = Math.max(overallGap, ...shortfalls.map((shortfall) => shortfall.gap), 0);

  let outcome: MatchOutcome;
  if (worstGap === 0) {
    // Only call it safe once every constrained skill was actually checked.
    const clearsComfortably = toHalfSteps(scores.overall) - toHalfSteps(requirement.overall) >= 2;
    outcome = clearsComfortably && unverifiedSkills.length === 0 ? 'safe' : 'match';
  } else if (worstGap <= 1) {
    outcome = 'reach';
  } else {
    outcome = 'unlikely';
  }

  const clearsWholeRange = requirement.range ? meets(scores.overall, requirement.range.max) : null;

  return {
    ...base,
    outcome,
    requirement,
    overallGap,
    shortfalls,
    unverifiedSkills,
    clearsWholeRange,
  };
}

const OUTCOME_ORDER: Record<MatchOutcome, number> = {
  safe: 0,
  match: 1,
  reach: 2,
  unlikely: 3,
  unknown: 4,
  'not-accepted': 5,
};

/**
 * Match a learner against many universities, best fit first.
 * Ties break on the smaller gap, then alphabetically so the list is stable.
 */
export function matchUniversities(
  entries: readonly UniversityEntry[],
  level: StudyLevel,
  scores: LearnerScores,
  now: Date = new Date()
): MatchResult[] {
  return entries
    .map((entry) => matchUniversity(entry, level, scores, now))
    .sort((a, b) => {
      const byOutcome = OUTCOME_ORDER[a.outcome] - OUTCOME_ORDER[b.outcome];
      if (byOutcome !== 0) return byOutcome;

      const aGap = Math.max(a.overallGap, ...a.shortfalls.map((s) => s.gap), 0);
      const bGap = Math.max(b.overallGap, ...b.shortfalls.map((s) => s.gap), 0);
      if (aGap !== bGap) return aGap - bGap;

      return a.entry.name.localeCompare(b.entry.name);
    });
}
