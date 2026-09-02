import { beforeEach, describe, expect, it } from 'vitest';
import {
  PENDING_AUTH_DRAFT_KEY,
  loadCheckerDraft,
  saveCheckerDraft,
} from '@/features/core/pages/checker/checkerDraftStorage';
import { DRAFT_STORAGE_KEY } from '@/features/core/pages/checker/checkerConstants';

describe('writing checker draft storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('uses local storage only for the pending auth handoff', () => {
    const payload = {
      activeTask: 'Task 2',
      drafts: { 'Task 2': { prompt: 'Discuss both views.', essay: 'Response' } },
      pendingAnalysis: true,
      savedAt: Date.now(),
    };

    saveCheckerDraft(payload, { pendingAuth: true });

    expect(JSON.parse(window.sessionStorage.getItem(DRAFT_STORAGE_KEY))).toEqual(payload);
    expect(JSON.parse(window.localStorage.getItem(PENDING_AUTH_DRAFT_KEY))).toEqual(payload);
    window.sessionStorage.clear();
    expect(loadCheckerDraft()).toEqual(payload);
  });

  it('drops an expired cross-tab draft', () => {
    const savedAt = Date.parse('2026-08-09T10:00:00.000Z');
    window.localStorage.setItem(
      PENDING_AUTH_DRAFT_KEY,
      JSON.stringify({ activeTask: 'Task 1', drafts: {}, pendingAnalysis: true, savedAt })
    );

    expect(loadCheckerDraft(savedAt + 2 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(window.localStorage.getItem(PENDING_AUTH_DRAFT_KEY)).toBeNull();
  });
});
