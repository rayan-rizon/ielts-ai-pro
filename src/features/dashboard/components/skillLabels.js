/**
 * `skill_proficiency.skill_code` is written by the DB triggers in
 * update_skill_proficiency_from_test/_activity as `${module}_${suffix}`,
 * where suffix is either snake_case (`multiple_choice`) or camelCase
 * (`lexicalResource`, `taskAchievement`) depending on which caller wrote it.
 * There is no fixed enum — format algorithmically rather than against a
 * lookup table, since a lookup table drifts the moment the taxonomy does.
 */
export function formatSkill(code) {
  if (!code) return 'General practice';
  const words = String(code)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // camelCase boundary: lexicalResource -> lexical Resource
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  if (!words) return 'General practice';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Many skill codes are stored module-prefixed (`reading_multiple_choice`), so a
 * formatted label sat next to its module tag reads "Reading multiple choice ·
 * Reading". Drop the prefix and let the tag carry the module.
 */
export function stripModulePrefix(label, module) {
  if (!label || !module) return label;
  const prefix = `${module} `.toLowerCase();
  if (!label.toLowerCase().startsWith(prefix)) return label;
  const rest = label.slice(prefix.length);
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : label;
}

/** Module name → the route segment used by createPageUrl. */
export function modulePage(module) {
  if (!module) return 'Reading';
  return module.charAt(0).toUpperCase() + module.slice(1).toLowerCase();
}
