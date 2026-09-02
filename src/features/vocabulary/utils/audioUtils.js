/**
 * Plays audio pronunciation using browser SpeechSynthesis API.
 * @param {string} text - Word or phrase to pronounce
 * @param {string} [lang='en-US'] - BCP 47 language tag ('en-US' | 'en-GB')
 * @returns {Promise<boolean>}
 */
export function playPronunciation(text, lang = 'en-US') {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[Audio] Speech synthesis not supported');
      resolve(false);
      return;
    }

    try {
      // Cancel ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85; // Slightly slower for clear IELTS phonetic pronunciation
      utterance.pitch = 1.0;

      // Try selecting standard natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice =
          voices.find(
            (v) =>
              (v.lang === lang || v.lang.startsWith(lang.slice(0, 2))) &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Daniel') ||
                v.name.includes('Karen'))
          ) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = (e) => {
        console.error('[Audio] Speech synthesis error:', e);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[Audio] Pronunciation playback error:', err);
      resolve(false);
    }
  });
}
