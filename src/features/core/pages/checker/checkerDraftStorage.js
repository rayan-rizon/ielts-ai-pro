import { DRAFT_STORAGE_KEY } from './checkerConstants';

export const PENDING_AUTH_DRAFT_KEY = `${DRAFT_STORAGE_KEY}-pending-auth`;
const TASK_IMAGE_DB_NAME = 'ielts-writing-checker';
const TASK_IMAGE_STORE_NAME = 'pending-files';
const TASK_IMAGE_KEY = 'task-1-visual';
const PENDING_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

function parseFreshDraft(raw, now = Date.now()) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.drafts || !parsed.activeTask || !Number.isFinite(Number(parsed.savedAt))) {
      return null;
    }
    return now - Number(parsed.savedAt) <= PENDING_DRAFT_TTL_MS ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCheckerDraft(payload, { pendingAuth = false } = {}) {
  const serialized = JSON.stringify(payload);
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
  if (pendingAuth) window.localStorage.setItem(PENDING_AUTH_DRAFT_KEY, serialized);
}

export function loadCheckerDraft(now = Date.now()) {
  const sessionDraft = parseFreshDraft(window.sessionStorage.getItem(DRAFT_STORAGE_KEY), now);
  if (sessionDraft) return sessionDraft;

  const pendingDraft = parseFreshDraft(window.localStorage.getItem(PENDING_AUTH_DRAFT_KEY), now);
  if (!pendingDraft) window.localStorage.removeItem(PENDING_AUTH_DRAFT_KEY);
  return pendingDraft;
}

function openImageDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('This browser cannot preserve the Task 1 image across signup.'));
      return;
    }

    const request = window.indexedDB.open(TASK_IMAGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TASK_IMAGE_STORE_NAME)) {
        request.result.createObjectStore(TASK_IMAGE_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open draft storage.'));
  });
}

async function accessStoredImage(mode, action) {
  const database = await openImageDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(TASK_IMAGE_STORE_NAME, mode);
      const store = transaction.objectStore(TASK_IMAGE_STORE_NAME);
      const request = action(store);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () =>
        reject(request.error || new Error('Could not access the saved image.'));
    });
  } finally {
    database.close();
  }
}

export async function savePendingTaskImage(file) {
  if (!file) return;
  await accessStoredImage('readwrite', (store) => store.put(file, TASK_IMAGE_KEY));
}

export async function loadPendingTaskImage() {
  try {
    const stored = await accessStoredImage('readonly', (store) => store.get(TASK_IMAGE_KEY));
    return stored instanceof File ? stored : null;
  } catch {
    return null;
  }
}

export async function clearPendingCheckerDraft() {
  window.localStorage.removeItem(PENDING_AUTH_DRAFT_KEY);
  try {
    await accessStoredImage('readwrite', (store) => store.delete(TASK_IMAGE_KEY));
  } catch {
    // IndexedDB can be unavailable in privacy modes; the expiring text draft is still cleared.
  }
}

export function clearCheckerDraft() {
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  return clearPendingCheckerDraft();
}
