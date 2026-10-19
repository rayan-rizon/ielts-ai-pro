export const PRODUCTION_WORKER = 'ielts-ai-pro';
export const PRODUCTION_TAG = '9940a4902ec34bddbf4d8bb9ffeab491';

export function validateReleaseTarget(scripts, subdomain, manifest, env = {}, domains = []) {
  const script = scripts.find(item => item.id === PRODUCTION_WORKER);
  if (!script || script.tag !== PRODUCTION_TAG) throw Error('Production Worker identity changed');
  for (const hostname of ['ieltsai.pro', 'www.ieltsai.pro']) {
    if (!domains.some(domain => domain.hostname === hostname &&
        domain.service === PRODUCTION_WORKER && domain.zone_id === 'a0f923f4119e50e011eadaba1fcf48d5' &&
        domain.enabled === true && domain.previews_enabled === false)) {
      throw Error(`Production custom domain differs: ${hostname}`);
    }
  }
  if (subdomain.enabled || subdomain.previews_enabled) throw Error('Production preview URLs must remain disabled');
  if (manifest.profile !== 'production' || manifest.output !== 'cloudflare/dist-production') {
    throw Error('Rebuild the production profile before release');
  }
  if (env.WORKERS_CI_BRANCH && env.WORKERS_CI_BRANCH !== 'main') throw Error('Only main may deploy production');
  if (env.WRANGLER_CI_MATCH_TAG && env.WRANGLER_CI_MATCH_TAG !== PRODUCTION_TAG) throw Error('Build belongs to another Worker');
}

export function uploadedVersion(output) {
  const records = output.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const upload = records.findLast(item => item.type === 'version-upload');
  if (upload?.worker_name !== PRODUCTION_WORKER || upload?.worker_tag !== PRODUCTION_TAG ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(upload?.version_id || '')) {
    throw Error('No verified production version in Wrangler structured output');
  }
  return upload.version_id;
}
