// Practice-mode voice benchmark: latency, size and billed cost of the
// OpenRouter speech fallback, plus the Cloudflare R2 cache path the Edge
// Function uses (upload, existence check, CDN fetch).
//
//   npm run tts:bench
//   npm run tts:bench -- --runs 3
//   npm run tts:bench -- --voice google/gemini-3.8-flash-lite-tts=Kore --no-r2
//
// Reads OPENROUTER_API_KEY and the R2 credentials from the environment
// (npm script loads supabase/functions/.env). Nothing here touches Supabase or
// the live site. R2 objects go under tts-cache/practice/bench/, apart from the
// production cache prefix. WAV files are saved to --out for listening.

import {
  buildOpenRouterSpeechRequest,
  estimatePracticeTtsCostUsd,
  toPlayableAudio,
  OPENROUTER_SPEECH_URL,
  PRACTICE_TTS_MODELS,
} from '../supabase/functions/_shared/practiceTts.ts';
import { createR2Objects, readR2Config } from '../supabase/functions/_shared/r2Objects.ts';

declare const Deno: any;

const TEXTS = {
  short: 'Good. Now, can you tell me a little about your hometown?',
  medium:
    "That's a clear answer. One small fix: say 'I have lived there for ten years', not 'I am living there since ten years'. A more natural way is: 'I've lived there for about ten years, and I really love how green it is.' So, what do you like most about living there?",
  long: "Nice work, you gave a direct answer and a reason, which is exactly what the examiner wants. Let me fix two things. First, you said 'the peoples are very friendly'. 'People' is already plural, so say 'the people are really friendly'. Second, instead of repeating 'good' three times, try 'welcoming', 'lively' or 'close-knit'. A Band 7 version could be: 'What I like most is how close-knit the community is. Everyone knows each other, and people are really welcoming to newcomers.' Now, let's keep going. How has your hometown changed over the last few years?",
};
// A 10-minute practice session: the coach speaks about 4,800 characters.
const SESSION_CHARACTERS = 4800;

function arg(name: string, fallback?: string) {
  const index = Deno.args.indexOf(`--${name}`);
  return index >= 0 ? Deno.args[index + 1] : fallback;
}
const flag = (name: string) => Deno.args.includes(`--${name}`);

const apiKey = Deno.env.get('OPENROUTER_API_KEY');
if (!apiKey) {
  console.error('OPENROUTER_API_KEY is not set. Add it to supabase/functions/.env or export it.');
  Deno.exit(1);
}

const models = (arg('models') || Object.keys(PRACTICE_TTS_MODELS).join(','))
  .split(',')
  .map((model: string) => model.trim())
  .filter(Boolean);
const voiceOverrides = new Map<string, string>(
  (Deno.args.filter((_: string, i: number) => Deno.args[i - 1] === '--voice') as string[]).map(
    (pair) => pair.split('=') as [string, string]
  )
);
const runs = Math.max(1, Number(arg('runs', '2')));
const textKeys = (arg('texts', 'short,medium,long') as string).split(',') as (keyof typeof TEXTS)[];
const outDir = arg('out', `${Deno.env.get('TMPDIR') || '/tmp'}/ielts-practice-tts-bench`) as string;
const r2Config = flag('no-r2') ? null : readR2Config();
const r2 = r2Config ? createR2Objects(r2Config) : null;

await Deno.mkdir(outDir, { recursive: true });

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function billedCost(generationId: string | null) {
  if (!generationId) return null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const response = await fetch(
      `https://openrouter.ai/api/v1/generation?id=${encodeURIComponent(generationId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (response.ok) {
      // Speech generations are sometimes not queryable here; fall back to the estimate.
      const body = await response.json().catch(() => null);
      const cost = body?.data?.total_cost;
      if (typeof cost === 'number') return { cost, provider: body?.data?.provider_name };
    }
  }
  return null;
}

async function synthesize(model: string, voice: string, text: string) {
  const startedAt = performance.now();
  const response = await fetch(OPENROUTER_SPEECH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'IELTS Ai Pro (tts bench)',
    },
    body: JSON.stringify(buildOpenRouterSpeechRequest({ model, voice }, text)),
    signal: AbortSignal.timeout(30000),
  });
  const headersAt = performance.now();
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  let firstByteAt = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!firstByteAt) firstByteAt = performance.now();
    chunks.push(value);
  }
  const doneAt = performance.now();
  const bytes = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const contentType = response.headers.get('Content-Type');
  const audio = response.ok ? toPlayableAudio(contentType, bytes) : null;
  return {
    ok: Boolean(audio),
    status: response.status,
    contentType,
    audio,
    generationId: response.headers.get('X-Generation-Id'),
    headersMs: headersAt - startedAt,
    firstByteMs: (firstByteAt || doneAt) - startedAt,
    totalMs: doneAt - startedAt,
    bytes,
  };
}

async function measureR2(
  model: string,
  text: string,
  audio: { bytes: Uint8Array; contentType: string }
) {
  if (!r2) return null;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${model}|${text}`)
  );
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  const key = `tts-cache/practice/bench/${hash}.wav`;

  let startedAt = performance.now();
  await r2.put(key, audio.bytes, {
    contentType: audio.contentType,
    cacheControl: 'public, max-age=3600',
  });
  const putMs = performance.now() - startedAt;

  startedAt = performance.now();
  const exists = await r2.exists(key);
  const headMs = performance.now() - startedAt;

  const fetchPublic = async () => {
    const t0 = performance.now();
    const response = await fetch(r2.publicUrl(key));
    await response.arrayBuffer();
    return {
      ms: performance.now() - t0,
      status: response.status,
      cache: response.headers.get('cf-cache-status') || '-',
    };
  };
  const cold = await fetchPublic();
  const warm = await fetchPublic();
  return { putMs, headMs, exists, cold, warm };
}

type Row = Record<string, string | number>;
const rows: Row[] = [];

for (const model of models) {
  const entry = PRACTICE_TTS_MODELS[model];
  if (!entry) {
    console.warn(`Skipping ${model}: not in PRACTICE_TTS_MODELS.`);
    continue;
  }
  const voice = voiceOverrides.get(model) || entry.defaultVoice;
  for (const textKey of textKeys) {
    const text = TEXTS[textKey];
    const samples: Awaited<ReturnType<typeof synthesize>>[] = [];
    for (let run = 0; run < runs; run += 1) {
      try {
        const sample = await synthesize(model, voice, text);
        samples.push(sample);
        if (!sample.ok) {
          const detail = new TextDecoder().decode(sample.bytes.slice(0, 300));
          console.warn(
            `  ${model} ${textKey} run ${run + 1}: HTTP ${sample.status} ${sample.contentType} ${detail}`
          );
        }
      } catch (error: any) {
        console.warn(`  ${model} ${textKey} run ${run + 1}: ${error?.name || error?.message}`);
      }
    }
    const good = samples.filter((sample) => sample.ok);
    if (!good.length) {
      rows.push({ model, voice, text: textKey, result: 'FAILED' });
      continue;
    }
    const audio = good[0].audio!;
    const file = `${outDir}/${model.replace(/\//g, '__')}__${voice}__${textKey}.wav`;
    await Deno.writeFile(file, audio.bytes);
    const billed = await billedCost(good[0].generationId);
    const r2Result = await measureR2(model, text, audio).catch((error) => {
      console.warn(`  R2 measurement failed: ${error?.message}`);
      return null;
    });
    const costPerCall = billed?.cost ?? estimatePracticeTtsCostUsd(model, text);
    rows.push({
      model,
      voice,
      text: `${textKey} (${text.length}ch)`,
      ok: `${good.length}/${samples.length}`,
      firstByteMs: Math.round(median(good.map((s) => s.firstByteMs))),
      totalMs: Math.round(median(good.map((s) => s.totalMs))),
      kb: Math.round(audio.bytes.byteLength / 1024),
      costUsd: Number(costPerCall.toFixed(6)),
      costSource: billed ? `billed (${billed.provider || 'openrouter'})` : 'estimate',
      sessionUsd: Number(((costPerCall / text.length) * SESSION_CHARACTERS).toFixed(4)),
      r2PutMs: r2Result ? Math.round(r2Result.putMs) : '-',
      r2HeadMs: r2Result ? Math.round(r2Result.headMs) : '-',
      cdnColdMs: r2Result ? `${Math.round(r2Result.cold.ms)} ${r2Result.cold.cache}` : '-',
      cdnWarmMs: r2Result ? `${Math.round(r2Result.warm.ms)} ${r2Result.warm.cache}` : '-',
    });
    console.log(`done: ${model} ${voice} ${textKey}`);
  }
}

console.log('\nfirstByteMs/totalMs are medians from this machine to OpenRouter.');
console.log(
  `sessionUsd scales the per-call cost to a ${SESSION_CHARACTERS}-character practice session.`
);
console.table(rows);
console.log(`\nAudio saved to ${outDir}`);
if (r2) console.log('R2 bench objects are under tts-cache/practice/bench/ (safe to delete).');
