import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnv();

const apiKey = process.env.AI_GATEWAY_API_KEY;
if (!apiKey) {
  console.error('Set AI_GATEWAY_API_KEY in .env');
  process.exit(1);
}

const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

const MODELS = ['google/gemini-2.5-flash', 'deepseek/deepseek-v4-flash-0731'];

const prompt = `You are an IELTS Writing Task 2 evaluator. Evaluate the synthetic essay below against the four official criteria.
Do not invent facts, do not award a band from a single sentence, and distinguish language errors from arguable style choices.
Return JSON only with this exact shape:
{"overallBand":0,"criteria":{"taskResponse":0,"coherenceCohesion":0,"lexicalResource":0,"grammar":0},"strengths":["evidence-based point"],"corrections":[{"quote":"exact quote","issue":"criterion-grounded issue","correction":"better wording"}],"uncertainty":["what cannot be judged reliably"]}

ESSAY:
Some people believe universities should focus only on employable skills, while others argue that broad education benefits society. Discuss both views and give your opinion.

Universities are often expected to produce workers for the economy. This view has merit because engineering, nursing and data skills can lead directly to employment, and public investment should have visible returns. However, reducing higher education to immediate job training is short-sighted. Employers also need people who can reason, communicate and adapt when technologies change.

For example, a student who studies history may not enter a history profession, but the student can learn to evaluate evidence and recognise biased narratives. These abilities are useful in journalism, public administration and business. Nevertheless, universities should not ignore labour-market needs: partnerships with employers and practical projects can connect abstract learning with responsible work.

In my view, universities should offer both pathways. Students deserve access to disciplines that develop independent judgement, while every programme should explain how its knowledge and skills transfer to work or civic life. This balanced approach protects the social value of education without treating students as units of production.`;

function validate(value) {
  return (
    Number.isFinite(Number(value?.overallBand)) &&
    value?.criteria &&
    ['taskResponse', 'coherenceCohesion', 'lexicalResource', 'grammar'].every((key) =>
      Number.isFinite(Number(value.criteria[key]))
    ) &&
    Array.isArray(value?.strengths) &&
    Array.isArray(value?.corrections) &&
    Array.isArray(value?.uncertainty)
  );
}

function parseJson(text) {
  const stripped = String(text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('malformed JSON');
  }
}

async function runModel(model) {
  const startedAt = performance.now();
  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.15,
      max_tokens: 1100,
    }),
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const body = await response.text();
    return { model, latencyMs, error: `HTTP ${response.status}: ${body.slice(0, 300)}` };
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  let parsed;
  let parseError = null;
  try {
    parsed = parseJson(text);
  } catch (error) {
    parseError = error.message;
  }
  const valid = parsed ? validate(parsed) : false;

  return {
    model,
    latencyMs,
    usage: data?.usage,
    valid,
    parseError,
    parsed,
  };
}

const results = [];
for (const model of MODELS) {
  const result = await runModel(model);
  results.push(result);
  console.log(`\n=== ${model} ===`);
  if (result.error) {
    console.log(`ERROR: ${result.error}`);
    continue;
  }
  console.log(`Latency: ${result.latencyMs}ms`);
  console.log(`Tokens: ${JSON.stringify(result.usage)}`);
  console.log(`Valid schema: ${result.valid}${result.parseError ? ` (parse error: ${result.parseError})` : ''}`);
  console.log(JSON.stringify(result.parsed, null, 2));
}

console.log('\n=== Summary ===');
for (const result of results) {
  console.log(
    `${result.model}: ${result.error ? 'FAILED' : `${result.latencyMs}ms, valid=${result.valid}, overallBand=${result.parsed?.overallBand}`}`
  );
}
