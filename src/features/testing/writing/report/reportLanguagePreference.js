import {
  normalizeReportLanguage,
  savedReportLanguage,
} from '../../../../../supabase/functions/_shared/reportLanguages';
import { mergeOwnSettings, readOwnSettings } from '../../../auth/services/userSettings';

/* The report language lives in `users.settings.report_language`. */

/** The stored choice, read fresh, or null if the learner has not been asked. */
export async function readSavedReportLanguage({ client } = {}) {
  return savedReportLanguage(await readOwnSettings({ client }));
}

/** Merges the choice into the stored settings, keeping every other key. */
export function saveReportLanguage(language, { client } = {}) {
  return mergeOwnSettings({ report_language: normalizeReportLanguage(language) }, { client });
}
