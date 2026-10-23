// The coach is released by default. Operators can still hide the client surface with
// an explicit false value, while the server-side database gate remains authoritative.
export const AI_COACH_ENABLED = import.meta.env.VITE_AI_COACH_ENABLED !== 'false';
export const AI_COACH_NAV_VISIBLE = import.meta.env.VITE_AI_COACH_NAV_VISIBLE !== 'false';

export const AI_COACH_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ur', label: 'اردو', rtl: true },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'ne', label: 'नेपाली' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'es', label: 'Español' },
  { code: 'tr', label: 'Türkçe' },
];

export const isRtlLanguage = (language) => language === 'ar' || language === 'ur';

export const COACH_DRAFT_KEY = 'ielts-ai-coach-draft-v1';

// `canned` marks a draft the app wrote in English, such as an "Ask Ava" button's
// starter. If the learner sends it unedited, Ava answers in their saved language
// instead of guessing the language from the wording.
export function saveCoachDraft({ message, sourceReference = null, canned = true }) {
  if (!AI_COACH_ENABLED || typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    COACH_DRAFT_KEY,
    JSON.stringify({ message: String(message || '').slice(0, 2000), sourceReference, canned })
  );
}

export function takeCoachDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(COACH_DRAFT_KEY) || 'null');
    window.sessionStorage.removeItem(COACH_DRAFT_KEY);
    return value;
  } catch {
    window.sessionStorage.removeItem(COACH_DRAFT_KEY);
    return null;
  }
}
