import { mergeOwnSettings, readOwnSettings } from '../../../auth/services/userSettings';
import { PLAN_SETTINGS_KEY, readPlanItems } from './planAdditions';

export const readPlanPractice = async (options) => readPlanItems(await readOwnSettings(options));

/** `change` receives the stored list, so a save from another device survives. */
export async function updatePlanPractice(change, options) {
  const row = await mergeOwnSettings(
    (settings) => ({ [PLAN_SETTINGS_KEY]: change(readPlanItems(settings)) }),
    options
  );
  return readPlanItems(row.settings);
}
