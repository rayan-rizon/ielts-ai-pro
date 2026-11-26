import {
  libraryGroupSource,
  libraryListeningScript,
} from '../_shared/skill-lab/libraryPractice.js';

const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 8;

// Every autosave redraws the session, so a recording's passage is read once.
const passageCache = new Map<string, { expiresAt: number; passage: any }>();

export function clearPassageCache() {
  passageCache.clear();
}

async function loadPassage(client: any, id: string) {
  const cached = passageCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.passage;
  const { data, error } = await client
    .from('passages')
    .select('id,title,test_type,content,audio_url,duration_minutes')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  if (passageCache.size >= CACHE_MAX_ENTRIES) {
    passageCache.delete(passageCache.keys().next().value as string);
  }
  passageCache.set(id, { expiresAt: Date.now() + CACHE_TTL_MS, passage: data });
  return data;
}

const canAddDisplayText = (source: any, questions: any) =>
  Boolean(source.id) && Array.isArray(questions);

const lacksDisplayText = (source: any) => !source.passage_title || Boolean(source.audio_url);

/** The part a stored source belongs to, read the way a new set reads it. */
function passageMetadata(passage: any, source: any, questions: any[]) {
  return libraryGroupSource(
    passage,
    questions.map((question: any) => ({
      ...question,
      section: question.section || question.part_number || source.section,
    }))
  );
}

/**
 * Display text the stored snapshot does not carry: the passage heading of older
 * sessions, and a recording's audioscript. Questions are never touched.
 */
export async function withDisplayText(client: any, rawSource: any, questions: any[] = []) {
  const source = { ...(rawSource || {}) };
  if (!lacksDisplayText(source) || !canAddDisplayText(source, questions)) return source;
  const passage = await loadPassage(client, source.id);
  if (!passage) return source;
  const metadata = passageMetadata(passage, source, questions);
  source.passage_title = source.passage_title || metadata.passage_title;
  return source.audio_url
    ? { ...source, ...libraryListeningScript(passage, metadata.section) }
    : source;
}
