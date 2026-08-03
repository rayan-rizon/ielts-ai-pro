/**
 * Shared, gesture-unlocked audio playback for the examiner voice.
 *
 * WebKit (Safari, and every iOS browser) only lets an HTMLMediaElement play
 * when `play()` is reached while the page still holds a *transient user
 * activation*. Awaiting the TTS edge function consumes that activation, so a
 * freshly constructed `new Audio(url).play()` after the fetch is rejected with
 * NotAllowedError and the examiner is silent.
 *
 * The element itself keeps its "allowed to play" flag once it has played from
 * inside a gesture, so we unlock ONE element on the first interaction and reuse
 * it for every utterance afterwards. Chrome never needed this, but reusing a
 * single element is harmless there.
 */

// 0.1s of 8-bit silence. Playing real (silent) samples is what sets WebKit's
// per-element playback flag — a muted play() does not count.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

let playbackAudio = null;
let unlocked = false;

/** The one element every examiner utterance plays through. */
export function getPlaybackAudio() {
  if (playbackAudio || typeof window === 'undefined' || typeof window.Audio !== 'function') {
    return playbackAudio;
  }

  playbackAudio = new window.Audio();
  playbackAudio.preload = 'auto';
  // Stops iOS Safari from hijacking playback into the fullscreen video player.
  playbackAudio.playsInline = true;
  playbackAudio.setAttribute('playsinline', '');
  return playbackAudio;
}

export function isSpeechPlaybackUnlocked() {
  return unlocked;
}

/**
 * Must be called synchronously from inside a real user gesture handler.
 * Safe to call repeatedly; only the first call does any work.
 */
export function unlockSpeechPlayback() {
  if (unlocked) return;
  const audio = getPlaybackAudio();
  if (!audio) return;

  unlocked = true;

  try {
    audio.src = SILENT_WAV;
    const playback = audio.play();
    if (playback && typeof playback.then === 'function') {
      playback
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {
          // Autoplay still refused — speakText retries a real play() later,
          // and the Web Speech fallback remains available.
        });
    }
  } catch {
    // Older WebKit throws synchronously; the fallback path still applies.
  }

  primeSpeechSynthesis();
}

/**
 * Safari also gates speechSynthesis behind a gesture and resolves getVoices()
 * lazily. Speaking one silent utterance inside the gesture satisfies both.
 */
function primeSpeechSynthesis() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.getVoices();
    const primer = new window.SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  } catch {
    // Nothing to recover — TTS audio remains the primary path.
  }
}

/** Detaches handlers and stops playback without discarding the unlock. */
export function releasePlaybackAudio() {
  const audio = playbackAudio;
  if (!audio) return;

  audio.onplay = null;
  audio.ontimeupdate = null;
  audio.onended = null;
  audio.onerror = null;
  try {
    audio.pause();
  } catch {
    // Pausing a never-started element can throw in older WebKit.
  }
  // Keep the element (and its unlock) alive; just drop the media resource.
  audio.removeAttribute('src');
  audio.load();
}

/** Test seam — resets module state between specs. */
export function resetSpeechPlaybackForTests() {
  playbackAudio = null;
  unlocked = false;
}
