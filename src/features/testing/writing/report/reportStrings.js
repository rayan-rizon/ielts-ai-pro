/**
 * Interface text of the Writing report, shared by the web report and its PDF.
 * Explanations written by the examiner are translated separately.
 * IELTS terms stay in English on purpose: Task 1/Task 2, Band and the four
 * criterion names are what the learner meets in the exam.
 * Wording for languages other than English should be checked by a native speaker.
 */
import {
  isRtlReportLanguage,
  normalizeReportLanguage,
} from '../../../../../supabase/functions/_shared/reportLanguages';
import { en } from './strings/en';
import { bn } from './strings/bn';
import { id } from './strings/id';
import { hi } from './strings/hi';
import { uz } from './strings/uz';
import { ru } from './strings/ru';
import { ur } from './strings/ur';
import { fa } from './strings/fa';

export const REPORT_STRINGS = { en, bn, id, hi, uz, ru, ur, fa };

const translators = new Map();

/** `t(key, values)` for one language, with `t.language` and `t.rtl`. */
export function reportT(language) {
  const code = normalizeReportLanguage(language);
  if (!translators.has(code)) {
    const strings = REPORT_STRINGS[code];
    const t = (key, values = {}) =>
      (strings[key] ?? en[key] ?? key).replace(/\{(\w+)\}/g, (match, name) =>
        name in values ? String(values[name]) : match
      );
    t.language = code;
    t.rtl = isRtlReportLanguage(code);
    translators.set(code, t);
  }
  return translators.get(code);
}
