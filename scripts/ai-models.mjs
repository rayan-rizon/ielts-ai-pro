// Prints the AI model map: which model runs where, what it falls back to,
// and what each one costs. Single source of truth is
// supabase/functions/_shared/aiModelRegistry.ts.
//
//   npm run ai:models
//   npm run ai:models -- --json
//   npm run ai:models -- --route speaking-evaluation

import {
  AI_ROUTES,
  MODELS,
  routesUsingModel,
} from '../supabase/functions/_shared/aiModelRegistry.ts';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const routeFilter = args.includes('--route') ? args[args.indexOf('--route') + 1] : null;

const routes = routeFilter ? AI_ROUTES.filter((route) => route.id === routeFilter) : AI_ROUTES;
if (routeFilter && routes.length === 0) {
  console.error(`Unknown route "${routeFilter}". Known routes:`);
  for (const route of AI_ROUTES) console.error(`  ${route.id}`);
  process.exit(1);
}

if (asJson) {
  console.log(JSON.stringify({ routes, models: MODELS }, null, 2));
  process.exit(0);
}

const ROLE_MARK = { primary: '●', fallback: '↳', repair: '↺' };

function priceLabel(modelId) {
  const model = MODELS[modelId];
  if (!model) return 'unregistered model';
  if (!model.pricing) return model.pricingNote || 'no token pricing';
  const { inputPerMillion, cachedInputPerMillion, outputPerMillion } = model.pricing;
  return `in $${inputPerMillion}/M · cached $${cachedInputPerMillion}/M · out $${outputPerMillion}/M`;
}

console.log('\nAI ROUTES — where each model runs and what backs it up\n');
for (const route of routes) {
  console.log(`${route.surface}`);
  console.log(`  route: ${route.id}   ${route.file}`);
  const limits = [
    route.maxOutputTokens ? `maxOutputTokens ${route.maxOutputTokens}` : null,
    route.timeoutMs ? `timeout ${route.timeoutMs}ms` : null,
  ].filter(Boolean);
  if (limits.length) console.log(`  limits: ${limits.join(' · ')}`);
  for (const step of route.steps) {
    console.log(`  ${ROLE_MARK[step.role]} ${step.role.padEnd(8)} ${step.model}`);
    console.log(`      ${step.when}`);
    console.log(`      ${priceLabel(step.model)}`);
  }
  if (route.notes) console.log(`  note: ${route.notes}`);
  console.log('');
}

console.log('MODEL PRICING\n');
for (const model of Object.values(MODELS)) {
  const used = routesUsingModel(model.id);
  console.log(`${model.id}  (${model.vendor} via ${model.access})`);
  console.log(`  ${priceLabel(model.id)}`);
  if (model.pricingSource) console.log(`  source: ${model.pricingSource}`);
  console.log(
    `  used by: ${used.length ? used.map((entry) => `${entry.route} (${entry.role})`).join(', ') : 'nothing — dead entry'}`
  );
  console.log('');
}

console.log('Benchmark a candidate against these routes:');
console.log('  npm run ai:bench -- --model z-ai/glm-5.3-flash\n');
