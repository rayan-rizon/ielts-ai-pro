// Exam voices use locale-specific Google Neural2 voices. The server checks its
// own allowlist before accepting a selected voice.
export const SPEAKING_EXAMINER_VOICES = [
  {
    id: 'british-female',
    name: 'Sophie',
    accent: 'British',
    region: 'United Kingdom',
    language: 'en-GB',
    gender: 'Female',
    voice: 'en-GB-Neural2-C',
  },
  {
    id: 'british-male',
    name: 'Oliver',
    accent: 'British',
    region: 'United Kingdom',
    language: 'en-GB',
    gender: 'Male',
    voice: 'en-GB-Neural2-D',
  },
  {
    id: 'australian-female',
    name: 'Harper',
    accent: 'Australian',
    region: 'Australia',
    language: 'en-AU',
    gender: 'Female',
    voice: 'en-AU-Neural2-A',
  },
  {
    id: 'australian-male',
    name: 'Noah',
    accent: 'Australian',
    region: 'Australia',
    language: 'en-AU',
    gender: 'Male',
    voice: 'en-AU-Neural2-B',
  },
  {
    id: 'american-female',
    name: 'Ava',
    accent: 'American',
    region: 'United States',
    language: 'en-US',
    gender: 'Female',
    voice: 'en-US-Neural2-C',
  },
  {
    id: 'american-male',
    name: 'Ethan',
    accent: 'American',
    region: 'United States',
    language: 'en-US',
    gender: 'Male',
    voice: 'en-US-Neural2-D',
  },
];

export const EXAMINER_VOICE_PREVIEW =
  'Good morning. I am your examiner today. Let us begin with a few questions about you.';

export function getSpeakingVoice(value) {
  const legacyAccent = String(value || '').toLowerCase();
  return (
    SPEAKING_EXAMINER_VOICES.find((item) => item.id === value) ||
    SPEAKING_EXAMINER_VOICES.find((item) => item.id === `${legacyAccent}-female`) ||
    SPEAKING_EXAMINER_VOICES[0]
  );
}
