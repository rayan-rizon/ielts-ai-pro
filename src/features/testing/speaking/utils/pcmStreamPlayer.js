// Plays 16-bit little-endian mono PCM while it is still downloading, so the
// practice coach starts talking as soon as the first audio arrives (~1.2s)
// instead of after the whole reply is synthesized.
//
// Each network chunk becomes a short AudioBuffer scheduled back-to-back on
// one Web Audio clock. Total length is unknown until the stream ends, so
// progress uses an estimate from the text and is corrected at the end.

// Scheduling a little ahead of "now" absorbs chunk-arrival jitter.
const START_LEAD_SECONDS = 0.12;
const PROGRESS_INTERVAL_MS = 100;
// Sulafat measured 11.7-14.5 characters per second on 2026-09-28.
const ESTIMATED_CHARACTERS_PER_SECOND = 13;

let activePlayer = null;

/** The stream currently playing, so cancel/interrupt can reach it. */
export function getActivePcmPlayer() {
  return activePlayer;
}

export function pcm16ToFloat32(bytes) {
  const samples = new Float32Array(Math.floor(bytes.byteLength / 2));
  const view = new DataView(bytes.buffer, bytes.byteOffset, samples.length * 2);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = view.getInt16(index * 2, true) / 32768;
  }
  return samples;
}

export function estimateSpeechSeconds(text) {
  return Math.max(1, String(text || '').length / ESTIMATED_CHARACTERS_PER_SECOND);
}

/**
 * Start playing a PCM stream. Returns { done, stop, finish }:
 *   done   - resolves when the last sample has played (or finish() is called)
 *   stop   - silence now and leave `done` pending (cancel: a newer turn owns
 *            what happens next)
 *   finish - silence now and resolve `done` (interrupt: the learner spoke,
 *            carry on as if the speech ended)
 */
export function playPcmStream({
  context,
  stream,
  sampleRate = 24000,
  text = '',
  isMuted = false,
  onPlaybackActive,
  onPlayStart,
  onProgress,
  onPlaybackEnded,
}) {
  const gain = context.createGain();
  gain.gain.value = isMuted ? 0 : 1;
  gain.connect(context.destination);

  const reader = stream.getReader();
  const sources = new Set();
  let leftover = null;
  let startTime = null;
  let nextTime = 0;
  let streamEnded = false;
  let stopped = false;
  let progressTimer = null;
  let resolveDone;
  let rejectDone;
  const done = new Promise((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const estimatedSeconds = estimateSpeechSeconds(text);

  const cleanup = () => {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = null;
    sources.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // Already stopped.
      }
    });
    sources.clear();
    try {
      gain.disconnect();
    } catch {
      // Already disconnected.
    }
    if (activePlayer === player) activePlayer = null;
  };

  const complete = () => {
    if (stopped) return;
    stopped = true;
    onProgress?.(1);
    cleanup();
    onPlaybackEnded?.();
    resolveDone();
  };

  const maybeComplete = () => {
    if (streamEnded && sources.size === 0 && startTime !== null) complete();
    if (streamEnded && startTime === null) complete(); // empty stream
  };

  const schedule = (bytes) => {
    let data = bytes;
    if (leftover) {
      data = new Uint8Array(leftover.byteLength + bytes.byteLength);
      data.set(leftover, 0);
      data.set(bytes, leftover.byteLength);
      leftover = null;
    }
    if (data.byteLength % 2) {
      leftover = data.slice(data.byteLength - 1);
      data = data.subarray(0, data.byteLength - 1);
    }
    const samples = pcm16ToFloat32(data);
    if (!samples.length) return;

    const buffer = context.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    if (startTime === null) {
      startTime = context.currentTime + START_LEAD_SECONDS;
      nextTime = startTime;
      onPlaybackActive?.();
      onPlayStart?.();
      progressTimer = setInterval(() => {
        const played = Math.max(0, context.currentTime - startTime);
        const scheduled = nextTime - startTime;
        const total = streamEnded ? scheduled : Math.max(estimatedSeconds, scheduled);
        onProgress?.(Math.min(streamEnded ? 1 : 0.98, played / total));
      }, PROGRESS_INTERVAL_MS);
    }
    // A late chunk must never be scheduled in the past (it would overlap).
    nextTime = Math.max(nextTime, context.currentTime + 0.01);
    source.start(nextTime);
    nextTime += buffer.duration;
    sources.add(source);
    source.onended = () => {
      sources.delete(source);
      maybeComplete();
    };
  };

  const pump = async () => {
    try {
      while (!stopped) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        if (value?.byteLength && !stopped) schedule(value);
      }
      streamEnded = true;
      maybeComplete();
    } catch (error) {
      if (stopped) return;
      streamEnded = true;
      // Keep whatever already arrived playing; fail only if nothing did.
      if (startTime === null) {
        stopped = true;
        cleanup();
        rejectDone(error);
      } else {
        maybeComplete();
      }
    }
  };

  const player = {
    done,
    setMuted(muted) {
      gain.gain.value = muted ? 0 : 1;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      reader.cancel().catch(() => {});
      cleanup();
    },
    finish() {
      if (stopped) return;
      reader.cancel().catch(() => {});
      complete();
    },
  };

  activePlayer = player;
  if (context.state === 'suspended') context.resume().catch(() => {});
  pump();
  return player;
}
