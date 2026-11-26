import { dashboardView, loadOverview } from './libraryOverview.ts';
import { clearPassageCache } from './libraryDisplayText.ts';
import { practiceDb, sessionView, SESSION_ACTIONS } from './librarySession.ts';
import { startSession } from './libraryStart.ts';

const CATALOGUE_CACHE_TTL_MS = 30 * 60 * 1000;
const CATALOGUE_CACHE_MAX_ENTRIES = 8;
const catalogueCache = new Map<
  string,
  { expiresAt: number; value: Promise<{ passages: any[]; questions: any[] }> }
>();

function evictCatalogueCache(now = Date.now()) {
  for (const [key, entry] of catalogueCache) {
    if (entry.expiresAt <= now) catalogueCache.delete(key);
  }
  while (catalogueCache.size >= CATALOGUE_CACHE_MAX_ENTRIES) {
    const oldest = catalogueCache.keys().next().value;
    if (!oldest) break;
    catalogueCache.delete(oldest);
  }
}

export function clearPracticeLibraryCatalogueCache() {
  catalogueCache.clear();
  clearPassageCache();
}

async function loadStaticCatalogue(
  rpc: (name: string, args: any) => Promise<any>,
  authId: string,
  includeExplanations: boolean
) {
  const version = await rpc('practice_library_catalogue_version', { p_auth: authId });
  if (!version?.tier || !version?.version) throw new Error('Practice library is unavailable');

  const key = `${version.tier}:${version.version}:${includeExplanations ? 'full' : 'summary'}`;
  const now = Date.now();
  const cached = catalogueCache.get(key);
  if (cached && cached.expiresAt > now) return await cached.value;

  evictCatalogueCache(now);
  const value = rpc('practice_library_catalogue_static', {
    p_auth: authId,
    p_include_explanations: includeExplanations,
  });
  catalogueCache.set(key, { expiresAt: now + CATALOGUE_CACHE_TTL_MS, value });
  try {
    return await value;
  } catch (error) {
    if (catalogueCache.get(key)?.value === value) catalogueCache.delete(key);
    throw error;
  }
}

export async function handleLibraryPractice(client: any, authId: string, body: any) {
  const db = practiceDb(client, authId, body);
  const sessionAction = SESSION_ACTIONS.get(body.action);
  if (sessionAction) return await sessionView(client, await sessionAction(db));
  if (!['dashboard', 'start'].includes(body.action)) throw new Error('Unknown practice action');
  const overview = await loadOverview(db);
  if (body.action === 'dashboard') return dashboardView(overview);
  return await sessionView(client, await startSession(db, overview));
}
