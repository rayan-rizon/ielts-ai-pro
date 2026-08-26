// Benchmark any OpenRouter model against this project's real AI routes.
//
//   OPENROUTER_API_KEY=... npm run ai:bench -- --model z-ai/glm-5.3-flash
//   npm run ai:bench -- --model z-ai/glm-5.3-flash --suite speaking-evaluation --runs 3
//   npm run ai:bench -- --model z-ai/glm-5.3-flash --baseline none --json bench.json
//
// Measures, per route: JSON-contract reliability, accuracy against mechanical
// graders (see scripts/lib/ai-task-suite.mjs), latency, tokens and billed cost.
// The API key is read from the environment only; never pass it as an argument.

import { requestOpenRouterJson } from '../supabase/functions/_shared/textAiProvider.ts';
import { AI_ROUTES } from '../supabase/functions/_shared/aiModelRegistry.ts';
import { selectCases } from './lib/ai-task-suite.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback = null) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : fallback;

const candidateModel = flag('--model');
const baselineModel = flag('--baseline', 'deepseek/deepseek-v4-flash-0731');
const runs = Math.max(1, Number(flag('--runs', '2')));
const jsonOut = flag('--json');
const timeoutMs = Number(flag('--timeout', '30000'));
// Models that cannot disable reasoning spend part of the completion budget on
// hidden tokens, so the production budget must be widened to compare fairly.
const budgetMultiplier = Math.max(1, Number(flag('--budget-multiplier', '1')));

if (!candidateModel) {
  console.error('Usage: npm run ai:bench -- --model <openrouter-model-id> [--baseline <id>|none]');
  console.error('                          [--suite all|<case-id>,<route-id>] [--runs N] [--json out.json]');
  console.error('Flags for models that reject strict routing options:');
  console.error('  --no-json-mode         drop response_format: json_object');
  console.error('  --allow-reasoning      keep the model\'s reasoning enabled');
  console.error('  --any-provider         do not require upstreams to honour every parameter');
  console.error('  --budget-multiplier N  widen max_tokens (for models that force reasoning)');
  console.error('  --reasoning-effort L   none|minimal|low|medium|high (try "low" if "none" is rejected)');
  process.exit(1);
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('Set OPENROUTER_API_KEY in the environment. This script never accepts keys as arguments.');
  process.exit(1);
}

const requestOptions = {
  jsonMode: args.includes('--no-json-mode') ? false : undefined,
  disableReasoning: args.includes('--allow-reasoning') ? false : undefined,
  requireParameters: !args.includes('--any-provider'),
  reasoningEffort: flag('--reasoning-effort') || undefined,
};

let cases;
try {
  cases = selectCases(flag('--suite', 'all'));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const models = [
  { id: candidateModel, role: 'candidate' },
  ...(baselineModel && baselineModel !== 'none' ? [{ id: baselineModel, role: 'baseline' }] : []),
];

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const pct = (value) => `${(value * 100).toFixed(0)}%`;
const usd = (value) => (value ? `$${value.toFixed(6)}` : '$0 (unreported)');

async function runOnce(model, testCase, options = {}) {
  const startedAt = performance.now();
  try {
    const result = await requestOpenRouterJson({
      ...requestOptions,
      model,
      apiKey,
      prompt: testCase.prompt,
      temperature: options.dropTemperature ? undefined : testCase.temperature,
      maxOutputTokens: Math.round(testCase.maxOutputTokens * budgetMultiplier),
      timeoutMs,
      includeUsageAccounting: true,
      validateJson: testCase.validateJson,
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    let checks = [];
    try {
      checks = testCase.grade(result.parsed);
    } catch (error) {
      checks = [{ name: 'grader ran without throwing', passed: false, detail: String(error?.message || error) }];
    }
    return {
      ok: true,
      latencyMs,
      checks,
      tokens: result.usage.tokensUsed,
      outputTokens: result.usage.outputTokens,
      costUsd: result.usage.estimatedProviderCostUsd,
      resolvedModel: result.model,
      parsed: result.parsed,
      note: options.dropTemperature ? 'temperature dropped: unsupported by this model' : null,
    };
  } catch (error) {
    // A 404 under require_parameters means no upstream accepts the parameter
    // set. Temperature is the usual culprit (some models reject it outright),
    // so retry once without it rather than scoring the model as unreachable.
    if (error?.status === 404 && !options.dropTemperature && testCase.temperature !== undefined) {
      return runOnce(model, testCase, { dropTemperature: true });
    }
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      failure: error?.code ? `${error.code}${error.status ? ` (HTTP ${error.status})` : ''}` : String(error?.message || error),
      checks: [],
    };
  }
}

async function benchmarkModel(model) {
  const caseReports = [];
  for (const testCase of cases) {
    const attempts = [];
    for (let run = 0; run < runs; run += 1) {
      if (process.stdout.isTTY) {
        process.stdout.write(`  ${model} · ${testCase.id} · run ${run + 1}/${runs}\r`);
      }
      attempts.push(await runOnce(model, testCase));
    }
    const ok = attempts.filter((attempt) => attempt.ok);
    const checksPassed = ok.reduce((sum, attempt) => sum + attempt.checks.filter((c) => c.passed).length, 0);
    const checksTotal = ok.reduce((sum, attempt) => sum + attempt.checks.length, 0);
    const failedChecks = new Map();
    for (const attempt of ok) {
      for (const item of attempt.checks) {
        if (item.passed) continue;
        const existing = failedChecks.get(item.name) || { count: 0, detail: item.detail };
        failedChecks.set(item.name, { count: existing.count + 1, detail: item.detail || existing.detail });
      }
    }
    caseReports.push({
      id: testCase.id,
      route: testCase.route,
      label: testCase.label,
      runs,
      succeeded: ok.length,
      reliability: ok.length / runs,
      accuracy: checksTotal ? checksPassed / checksTotal : 0,
      checksPassed,
      checksTotal,
      latencyMedianMs: median(ok.map((attempt) => attempt.latencyMs)),
      latencyMaxMs: ok.length ? Math.max(...ok.map((attempt) => attempt.latencyMs)) : null,
      avgTokens: Math.round(mean(ok.map((attempt) => attempt.tokens))),
      avgCostUsd: mean(ok.map((attempt) => attempt.costUsd)),
      failures: attempts.filter((attempt) => !attempt.ok).map((attempt) => attempt.failure),
      failedChecks: [...failedChecks.entries()].map(([name, value]) => ({ name, ...value })),
      resolvedModel: ok[0]?.resolvedModel || null,
      note: ok.find((attempt) => attempt.note)?.note || null,
      sampleOutput: ok[0]?.parsed ?? null,
    });
  }
  if (process.stdout.isTTY) process.stdout.write(`${' '.repeat(72)}\r`);

  const okCases = caseReports.filter((report) => report.succeeded > 0);
  const totalChecks = caseReports.reduce((sum, report) => sum + report.checksTotal, 0);
  const passedChecks = caseReports.reduce((sum, report) => sum + report.checksPassed, 0);
  return {
    model,
    cases: caseReports,
    summary: {
      reliability: mean(caseReports.map((report) => report.reliability)),
      accuracy: totalChecks ? passedChecks / totalChecks : 0,
      // Reliability and accuracy multiplied: what a user actually receives,
      // counting a failed or malformed call as a wrong answer.
      effectiveAccuracy:
        (totalChecks ? passedChecks / totalChecks : 0) * mean(caseReports.map((report) => report.reliability)),
      latencyMedianMs: median(okCases.map((report) => report.latencyMedianMs)),
      latencyMaxMs: okCases.length ? Math.max(...okCases.map((report) => report.latencyMaxMs)) : null,
      avgCostUsd: mean(okCases.map((report) => report.avgCostUsd)),
      costPer1kCallsUsd: mean(okCases.map((report) => report.avgCostUsd)) * 1000,
    },
  };
}

console.log(
  `\nBenchmarking ${cases.length} route(s) × ${runs} run(s) per model` +
    (budgetMultiplier > 1 ? ` · output budget ×${budgetMultiplier}` : '') +
    (requestOptions.disableReasoning === false ? ' · reasoning enabled' : '') +
    (requestOptions.reasoningEffort ? ` · reasoning effort ${requestOptions.reasoningEffort}` : '') +
    '\n'
);
const reports = [];
for (const model of models) {
  console.log(`${model.role}: ${model.id}`);
  reports.push({ role: model.role, ...(await benchmarkModel(model.id)) });
}

// --- report -----------------------------------------------------------------

for (const report of reports) {
  console.log(`\n${'='.repeat(74)}\n${report.role.toUpperCase()}  ${report.model}\n`);
  console.log(
    `${'route'.padEnd(26)}${'ok'.padEnd(7)}${'accuracy'.padEnd(15)}${'p50 ms'.padEnd(9)}${'tokens'.padEnd(8)}cost/call`
  );
  for (const item of report.cases) {
    console.log(
      `${item.id.padEnd(26)}${`${item.succeeded}/${item.runs}`.padEnd(7)}` +
        `${`${pct(item.accuracy)} (${item.checksPassed}/${item.checksTotal})`.padEnd(15)}` +
        `${String(item.latencyMedianMs ?? '—').padEnd(9)}${String(item.avgTokens || '—').padEnd(8)}${usd(item.avgCostUsd)}`
    );
    if (item.note) console.log(`    · ${item.note}`);
    for (const failure of new Set(item.failures)) console.log(`    ✗ call failed: ${failure}`);
    for (const failed of item.failedChecks) {
      console.log(`    ✗ ${failed.name}${failed.detail ? ` — ${failed.detail}` : ''} (${failed.count}/${item.succeeded} runs)`);
    }
  }
  const summary = report.summary;
  console.log(
    `\n  reliability ${pct(summary.reliability)} · accuracy ${pct(summary.accuracy)} · effective ${pct(summary.effectiveAccuracy)}`
  );
  console.log(
    `  latency p50 ${summary.latencyMedianMs ?? '—'}ms · worst ${summary.latencyMaxMs ?? '—'}ms · ${usd(summary.avgCostUsd)}/call · $${summary.costPer1kCallsUsd.toFixed(4)}/1k calls`
  );
}

const candidate = reports.find((report) => report.role === 'candidate');
const baseline = reports.find((report) => report.role === 'baseline');
if (baseline) {
  const delta = (a, b) => {
    const diff = a - b;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(diff > 1 || diff < -1 ? 0 : 3)}`;
  };
  console.log(`\n${'='.repeat(74)}\nVERDICT vs ${baseline.model}\n`);
  console.log(
    `  effective accuracy  ${pct(candidate.summary.effectiveAccuracy)} vs ${pct(baseline.summary.effectiveAccuracy)}  (${delta(candidate.summary.effectiveAccuracy * 100, baseline.summary.effectiveAccuracy * 100)} pts)`
  );
  console.log(
    `  latency p50         ${candidate.summary.latencyMedianMs}ms vs ${baseline.summary.latencyMedianMs}ms  (${delta(candidate.summary.latencyMedianMs, baseline.summary.latencyMedianMs)}ms)`
  );
  const costRatio = baseline.summary.costPer1kCallsUsd
    ? candidate.summary.costPer1kCallsUsd / baseline.summary.costPer1kCallsUsd
    : null;
  console.log(
    `  cost per 1k calls   $${candidate.summary.costPer1kCallsUsd.toFixed(4)} vs $${baseline.summary.costPer1kCallsUsd.toFixed(4)}` +
      (costRatio ? `  (${costRatio.toFixed(2)}×)` : '')
  );
  const accuracyDrop = baseline.summary.effectiveAccuracy - candidate.summary.effectiveAccuracy;
  console.log(
    `\n  ${accuracyDrop > 0.05 ? 'DO NOT PROMOTE — accuracy loss exceeds 5 points.' : accuracyDrop > 0 ? 'Marginal accuracy loss. Promote only where the route tolerates it.' : 'Accuracy holds. Safe to trial on a single route behind a fallback.'}`
  );
  const routes = new Set(cases.map((testCase) => testCase.route));
  console.log(
    `  Routes covered: ${[...routes].map((id) => AI_ROUTES.find((route) => route.id === id)?.surface || id).join(' · ')}`
  );
}

if (jsonOut) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(jsonOut, JSON.stringify({ runs, cases: cases.map((c) => c.id), reports }, null, 2));
  console.log(`\nFull report (including sample outputs) written to ${jsonOut}`);
}
console.log('');
