const SKILL_LABELS = {
  matching_features: 'Matching Features',
  notes_completion: 'Notes Completion',
  yes_no_not_given: 'Yes/No/Not Given',
  true_false_not_given: 'True/False/Not Given',
};

function formatEvidenceLabel(value) {
  const original = String(value || 'Learning evidence').trim();
  const raw = original.replace(/[_:]+/g, ' ');
  const skill = original.match(
    /^(reading|writing|listening|speaking|grammar|vocabulary)[_:](.+)$/i
  );
  if (skill) {
    const module = skill[1][0].toUpperCase() + skill[1].slice(1).toLowerCase();
    const skillKey = skill[2].trim().toLowerCase().replace(/\s+/g, '_');
    const name =
      SKILL_LABELS[skillKey] ||
      skill[2].trim().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    return `${module} · ${name}`;
  }
  return raw.replace(/\b[a-z]/g, (letter) => letter.toUpperCase()).replace(/\bIelts\b/g, 'IELTS');
}

function formatEvidenceDate(value) {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

const hasNumber = (value) => value != null && value !== '' && Number.isFinite(Number(value));

/** Convert legacy citation JSON into a concise, learner-readable evidence label. */
export function formatEvidenceClaim(ref) {
  const claim = typeof ref?.claim === 'string' ? ref.claim.trim() : '';
  if (!claim) return 'Learning evidence';

  const legacy = claim.match(/^(.+?):\s*(\{[\s\S]*\})$/);
  if (!legacy) {
    if (claim.startsWith('{')) return 'Learning evidence';
    return /^[a-z][a-z0-9_]*$/i.test(claim) ? formatEvidenceLabel(claim) : claim;
  }

  let value;
  try {
    value = JSON.parse(legacy[2]);
  } catch {
    return formatEvidenceLabel(legacy[1]);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return formatEvidenceLabel(legacy[1]);

  const details = [];
  if (hasNumber(value.score)) details.push(`score ${Number(value.score)}`);
  for (const key of ['latest', 'previous', 'delta']) {
    if (hasNumber(value[key]))
      details.push(
        `${key} ${key === 'delta' && Number(value[key]) > 0 ? '+' : ''}${Number(value[key])}`
      );
  }
  if (hasNumber(value.mastery)) {
    const mastery = Number(value.mastery);
    details.push(
      `mastery estimate ${mastery <= 1 ? Math.round(mastery * 100) : Math.round(mastery)}%`
    );
  }
  if (hasNumber(value.observations)) details.push(`${Number(value.observations)} observations`);
  if (hasNumber(value.correct) && hasNumber(value.total))
    details.push(`${Number(value.correct)} of ${Number(value.total)} correct`);
  if (hasNumber(value.weeklyHours)) details.push(`${Number(value.weeklyHours)} hours per week`);
  const completed = formatEvidenceDate(value.completedAt);
  if (completed) details.push(`completed ${completed}`);

  return [formatEvidenceLabel(legacy[1]), ...details].filter(Boolean).join(' · ');
}
