export const EXAMINER_VOICE_COLORS = {
  'british-female': '#5a63df',
  'british-male': '#0284c7',
  'australian-male': '#0d9488',
  'american-female': '#e11d48',
};

// Exam voices use region-specific Gemini 3.8 Flash-Lite Voice Library IDs.
// Neural2 IDs remain only for the separate practice fallback path.
export const SPEAKING_EXAMINER_VOICES = [
  {
    id: 'british-female',
    name: 'Sulafat',
    accent: 'British',
    region: 'United Kingdom',
    language: 'en-GB',
    gender: 'Female',
    voice: 'en-GB-Neural2-C',
    geminiVoice: 'Sulafat',
    color: '#5a63df',
  },
  {
    id: 'british-male',
    name: 'Oliver',
    accent: 'British',
    region: 'United Kingdom',
    language: 'en-GB',
    gender: 'Male',
    voice: 'en-GB-Neural2-D',
    geminiVoice: 'en-gb-tutor-14',
    color: '#0284c7',
  },
  {
    id: 'australian-male',
    name: 'Noah',
    accent: 'Australian',
    region: 'Australia',
    language: 'en-AU',
    gender: 'Male',
    voice: 'en-AU-Neural2-B',
    geminiVoice: 'en-au-tutor-5',
    color: '#0d9488',
  },
  {
    id: 'american-female',
    name: 'Ava',
    accent: 'American',
    region: 'United States',
    language: 'en-US',
    gender: 'Female',
    voice: 'en-US-Neural2-C',
    geminiVoice: 'despina',
    color: '#e11d48',
  },
];

export const EXAMINER_VOICE_PREVIEW =
  'Good morning. I am your examiner today. Let us begin with a few questions about you.';

export function getSpeakingVoice(value) {
  const legacyAccent = String(value || '').toLowerCase();
  const legacySelection = {
    'australian-female': 'australian-male',
    'american-male': 'american-female',
    australian: 'australian-male',
    american: 'american-female',
  }[legacyAccent];
  return (
    SPEAKING_EXAMINER_VOICES.find((item) => item.id === value) ||
    SPEAKING_EXAMINER_VOICES.find((item) => item.id === legacySelection) ||
    SPEAKING_EXAMINER_VOICES[0]
  );
}
