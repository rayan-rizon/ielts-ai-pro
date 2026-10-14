import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateReadingDraft, saveReadingAiDraft } from '@/lib/aiReadingDraftClient';
import { aiReadingFixture, aiReadingInput } from '../helpers/aiReadingFixture';
import { getSupabaseClient } from '@/lib/supabase';
import { callEdgeFunction } from '@/utils/api';
vi.mock('@/lib/supabase', () => ({ getSupabaseClient: vi.fn() }));
vi.mock('@/utils/api', () => ({ callEdgeFunction: vi.fn() }));
const rpc = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  getSupabaseClient.mockResolvedValue({ rpc });
});

describe('AI Reading client uses only the new draft boundary', () => {
  it('validates the preview returned by the generation-only endpoint', async () => {
    callEdgeFunction.mockResolvedValue({ draft: aiReadingFixture() });
    expect((await generateReadingDraft(aiReadingInput())).draft.title).toBe('Garden Reading');
    expect(callEdgeFunction).toHaveBeenCalledWith(
      'admin-reading-draft',
      expect.objectContaining({ suppliedAnswers: expect.any(Object) })
    );
    expect(rpc).not.toHaveBeenCalled();
  });
  it('calls only the atomic create RPC and ignores arbitrary model IDs/publication flags', async () => {
    rpc.mockResolvedValue({ data: 'new-id', error: null });
    const draft = aiReadingFixture();
    draft.is_active = true;
    draft.id = 'live-id';
    draft.sections[0].groups[0].items[0].id = 'live-question-id';
    const result = await saveReadingAiDraft({
      draft,
      expectedQuestions: 13,
      requestId: 'new-request',
      testFormat: 'Academic',
      accessTier: 'free',
    });
    expect(result).toBe('new-id');
    expect(rpc).toHaveBeenCalledWith(
      'admin_create_ai_reading_draft',
      expect.objectContaining({ p_request_id: 'new-request' })
    );
    const stored = rpc.mock.calls[0][1].p_draft;
    expect(stored).not.toHaveProperty('id');
    expect(stored).not.toHaveProperty('is_active');
    expect(JSON.stringify(stored)).not.toContain('live-question-id');
  });
  it('reports an undeployed RPC without falling back to an existing test-save flow', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    await expect(
      saveReadingAiDraft({
        draft: aiReadingFixture(),
        expectedQuestions: 13,
        requestId: 'new-request',
        testFormat: 'Academic',
        accessTier: 'free',
      })
    ).rejects.toThrow('not deployed');
    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
