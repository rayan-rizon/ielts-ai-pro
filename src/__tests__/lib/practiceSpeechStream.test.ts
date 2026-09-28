import { describe, expect, it, vi } from 'vitest';

import {
  buildGeminiSpeechRequest,
  readGeminiSpeechEvents,
} from '../../../supabase/functions/_shared/geminiSpeechStream.ts';
import {
  estimateSpeechSeconds,
  getActivePcmPlayer,
  pcm16ToFloat32,
  playPcmStream,
} from '@/features/testing/speaking/utils/pcmStreamPlayer';

const encoder = new TextEncoder();

function streamOf(parts: (string | Uint8Array)[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(typeof part === 'string' ? encoder.encode(part) : part);
      }
      controller.close();
    },
  });
}

describe('Gemini speech stream parsing', () => {
  it('decodes PCM chunks and usage from events split across reads', async () => {
    const chunkA = btoa(String.fromCharCode(1, 0, 2, 0));
    const chunkB = btoa(String.fromCharCode(3, 0));
    const eventA = `data: {"candidates":[{"content":{"parts":[{"inlineData":{"mimeType":"audio/l16; rate=24000","data":"${chunkA}"}}]}}]}\n\n`;
    const eventB = `data: {"candidates":[{"content":{"parts":[{"inlineData":{"data":"${chunkB}"}}]}}],"usageMetadata":{"promptTokenCount":11,"candidatesTokenCount":168}}\n\n`;
    const usage = { promptTokens: 0, outputTokens: 0 };

    const chunks: Uint8Array[] = [];
    // Split mid-line to prove only complete lines are parsed.
    for await (const chunk of readGeminiSpeechEvents(
      streamOf([eventA.slice(0, 30), eventA.slice(30) + eventB.slice(0, 50), eventB.slice(50)]),
      usage
    )) {
      chunks.push(chunk);
    }

    expect(chunks.map((c) => Array.from(c))).toEqual([
      [1, 0, 2, 0],
      [3, 0],
    ]);
    expect(usage).toEqual({ promptTokens: 11, outputTokens: 168 });
  });

  it('surfaces a stream error event', async () => {
    const usage = { promptTokens: 0, outputTokens: 0 };
    const events = readGeminiSpeechEvents(
      streamOf(['data: {"error":{"message":"quota"}}\n']),
      usage
    );
    await expect(events.next()).rejects.toThrow('quota');
  });

  it('keeps the style out of the spoken text', () => {
    const body = buildGeminiSpeechRequest('Hello.', 'Sulafat', 'warm British coach') as any;
    expect(body.contents[0].parts[0]).toEqual({
      text: 'Hello.',
      speechMetadata: { style: 'warm British coach' },
    });
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
      'Sulafat'
    );
  });
});

class FakeSource {
  buffer: any = null;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stop = vi.fn();
  connect() {}
  start(when: number) {
    this.startedAt = when;
  }
}

function fakeContext() {
  const sources: FakeSource[] = [];
  return {
    sources,
    state: 'running',
    currentTime: 0,
    destination: {},
    createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
    createBuffer: (_channels: number, length: number, rate: number) => ({
      duration: length / rate,
      copyToChannel() {},
    }),
    createBufferSource() {
      const source = new FakeSource();
      sources.push(source);
      return source;
    },
    resume: () => Promise.resolve(),
  };
}

describe('PCM stream player', () => {
  it('converts little-endian 16-bit samples', () => {
    expect(Array.from(pcm16ToFloat32(new Uint8Array([0x00, 0x40, 0x00, 0xc0])))).toEqual([
      0.5, -0.5,
    ]);
    expect(estimateSpeechSeconds('x'.repeat(130))).toBe(10);
  });

  it('schedules chunks back to back, carries odd bytes, and finishes when the last one ends', async () => {
    const context = fakeContext();
    const onPlaybackActive = vi.fn();
    const onPlaybackEnded = vi.fn();
    const player = playPcmStream({
      context: context as any,
      // 3 bytes, then 3 bytes: the odd byte is carried into the next chunk.
      stream: streamOf([new Uint8Array([1, 0, 2]), new Uint8Array([0, 3, 0])]),
      sampleRate: 2,
      text: 'Hi.',
      onPlaybackActive,
      onPlaybackEnded,
    });
    expect(getActivePcmPlayer()).toBe(player);

    await vi.waitFor(() => expect(context.sources).toHaveLength(2));
    const [first, second] = context.sources;
    expect(onPlaybackActive).toHaveBeenCalledTimes(1);
    expect(second.startedAt).toBeCloseTo((first.startedAt as number) + first.buffer.duration);

    first.onended?.();
    second.onended?.();
    await player.done;
    expect(onPlaybackEnded).toHaveBeenCalledTimes(1);
    expect(getActivePcmPlayer()).toBeNull();
  });

  it('finish() resolves immediately for an interruption; stop() leaves it pending', async () => {
    const context = fakeContext();
    const endless = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 0, 2, 0]));
      },
    });
    const interrupted = playPcmStream({ context: context as any, stream: endless, sampleRate: 2 });
    await vi.waitFor(() => expect(context.sources).toHaveLength(1));
    interrupted.finish();
    await expect(interrupted.done).resolves.toBeUndefined();
    expect(context.sources[0].stop).toHaveBeenCalled();

    const cancelled = playPcmStream({
      context: context as any,
      stream: new ReadableStream<Uint8Array>({ start() {} }),
      sampleRate: 2,
    });
    cancelled.stop();
    const settled = await Promise.race([
      cancelled.done.then(() => 'settled'),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 50)),
    ]);
    expect(settled).toBe('pending');
  });
});
