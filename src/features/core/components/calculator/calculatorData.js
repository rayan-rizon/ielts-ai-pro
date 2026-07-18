// Shared data for the IELTS band score calculator page.

// IELTS rounding: average of the four skills, rounded to the nearest half band.
// Exact .25 rounds up to .5 and exact .75 rounds up to the next whole band,
// which Math.round(x * 2) / 2 reproduces for every reachable average.
export function roundOverallBand(average) {
  return Math.round(average * 2) / 2;
}

export function getRecommendation(score) {
  if (score >= 8.0) {
    return {
      level: 'Expert User',
      desc: 'You have a fully operational command of the English language, demonstrating high fluency, flow, and precision. Keep your skills sharp with regular practice.',
      hours: '20–30 hours of targeted practice',
      focus: 'Refine nuance in Writing Task 2 essays and maintain speed/accuracy in Reading.',
    };
  } else if (score >= 7.0) {
    return {
      level: 'Good User',
      desc: 'You have an operational command of the language with only occasional inaccuracies. You are well-positioned to achieve your target band with slight refinements.',
      hours: '40–60 hours of structured study',
      focus: 'Expand your advanced lexical resource and refine Speaking coherence under pressure.',
    };
  } else if (score >= 6.0) {
    return {
      level: 'Competent User',
      desc: 'You have a generally effective command of the language. You handle complex structures well, though minor inaccuracies remain.',
      hours: '80–100 hours of focused practice',
      focus:
        'Eliminate grammatical errors in Writing and develop complex sentence structures in Speaking.',
    };
  }
  return {
    level: 'Modest User',
    desc: 'You have a partial command of the language. Focus on strengthening your core skills, grammar, paragraph structure, and academic vocabulary.',
    hours: '120+ hours of foundational study',
    focus:
      'Master basic IELTS essay templates, practice listening for details, and build grammar confidence.',
  };
}

// Raw score (out of 40) → band. Each entry is [minimum correct answers, band],
// checked top-down. Typical published conversions; exact thresholds vary
// slightly between test versions.
export const RAW_SCORE_TABLES = {
  listening: {
    label: 'Listening',
    note: 'Same conversion for Academic and General Training.',
    thresholds: [
      [39, 9],
      [37, 8.5],
      [35, 8],
      [32, 7.5],
      [30, 7],
      [26, 6.5],
      [23, 6],
      [18, 5.5],
      [16, 5],
      [13, 4.5],
      [10, 4],
      [0, 3.5],
    ],
  },
  readingAcademic: {
    label: 'Reading · Academic',
    note: 'Academic Reading conversion.',
    thresholds: [
      [39, 9],
      [37, 8.5],
      [35, 8],
      [33, 7.5],
      [30, 7],
      [27, 6.5],
      [23, 6],
      [19, 5.5],
      [15, 5],
      [13, 4.5],
      [10, 4],
      [0, 3.5],
    ],
  },
  readingGeneral: {
    label: 'Reading · General Training',
    note: 'GT Reading needs more correct answers for the same band.',
    thresholds: [
      [40, 9],
      [39, 8.5],
      [37, 8],
      [36, 7.5],
      [34, 7],
      [32, 6.5],
      [30, 6],
      [27, 5.5],
      [23, 5],
      [19, 4.5],
      [15, 4],
      [0, 3.5],
    ],
  },
};

export function rawScoreToBand(testKey, raw) {
  const clamped = Math.max(0, Math.min(40, raw));
  const { thresholds } = RAW_SCORE_TABLES[testKey];
  for (const [min, band] of thresholds) {
    if (clamped >= min) return band;
  }
  return 3.5;
}

// Display ranges for the conversion reference table, derived from thresholds.
export function tableRows(testKey) {
  const { thresholds } = RAW_SCORE_TABLES[testKey];
  return thresholds
    .map(([min, band], i) => {
      const max = i === 0 ? 40 : thresholds[i - 1][0] - 1;
      if (min === 0) return null; // skip the catch-all bottom row
      return { range: min === max ? `${min}` : `${min}–${max}`, band: band.toFixed(1) };
    })
    .filter(Boolean);
}
