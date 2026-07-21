const PRONUNCIATION_PARTS = new Set([1, 3]);
const MIN_SAMPLE_DURATION_MS = 6000;
const MAX_SAMPLE_DURATION_MS = 30000;

export function shouldRequestPronunciationSample({ partNumber, durationMs, existingSamples = {} }) {
  const numericPart = Number(partNumber);
  if (!PRONUNCIATION_PARTS.has(numericPart)) return false;
  if (!Number.isFinite(durationMs)) return false;
  if (durationMs < MIN_SAMPLE_DURATION_MS || durationMs > MAX_SAMPLE_DURATION_MS) return false;

  const partSamples =
    existingSamples?.[String(numericPart)] || existingSamples?.[numericPart] || [];
  return !partSamples.some((sample) => sample?.provider === 'azure-speech');
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function mixToMono(audioBuffer) {
  const mono = new Float32Array(audioBuffer.length);
  const channelCount = Math.max(1, audioBuffer.numberOfChannels);

  for (let channel = 0; channel < channelCount; channel += 1) {
    const source = audioBuffer.getChannelData(channel);
    for (let index = 0; index < source.length; index += 1) {
      mono[index] += source[index] / channelCount;
    }
  }

  return mono;
}

function resampleLinear(input, sourceRate, targetRate) {
  if (sourceRate === targetRate) return input;
  const outputLength = Math.max(1, Math.round((input.length * targetRate) / sourceRate));
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;

  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const weight = position - left;
    output[index] = input[left] * (1 - weight) + input[right] * weight;
  }

  return output;
}

function writeAscii(view, offset, text) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}

function encodePcm16Wav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function convertAudioBlobToWav16kMono(blob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio decoding is unavailable in this browser');

  const context = new AudioContextClass();
  try {
    const encoded = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(encoded.slice(0));
    const mono = mixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, 16000);
    return encodePcm16Wav(resampled, 16000);
  } finally {
    await context.close().catch(() => {});
  }
}
