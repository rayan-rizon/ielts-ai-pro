import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarketingService from '@/features/admin/services/MarketingService';
import { supabase } from '@/lib/supabase';
vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() }, rpc: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
describe('Copilot worker compatibility', () => {
  it('never sends an action request to an older worker', async () => {
    supabase.functions.invoke.mockResolvedValue({
      data: { dry_run: true, matched: 4 },
      error: null,
    });
    await expect(MarketingService.prepareCopilotActions()).rejects.toThrow('not deployed');
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('retention-autopilot', {
      body: { action: 'copilot_capabilities', dry_run: true },
    });
  });
  it('preserves the exact revision and the actual delivery outcome', async () => {
    supabase.functions.invoke
      .mockResolvedValueOnce({ data: { version: 1 }, error: null })
      .mockResolvedValueOnce({
        data: { status: 'suppressed', reason: 'payment_pending' },
        error: null,
      });
    await expect(MarketingService.approveIntervention('action', 'revision')).resolves.toEqual({
      status: 'suppressed',
      reason: 'payment_pending',
    });
    expect(supabase.functions.invoke).toHaveBeenLastCalledWith('retention-autopilot', {
      body: { action: 'approve', intervention_id: 'action', revision: 'revision' },
    });
  });

  it('falls back to the existing read-only snapshot without exposing a fatal page error', async () => {
    supabase.functions.invoke.mockResolvedValueOnce({
      data: { dry_run: true, matched: 4 },
      error: null,
    });
    supabase.rpc.mockResolvedValue({
      data: {
        interventions: [
          {
            id: 'prepared-action',
            status: 'prepared',
            created_at: '2026-09-13T10:00:00.000Z',
            playbook_key: 'checkout_recovery',
          },
          {
            id: 'sent-action',
            status: 'sent',
            created_at: '2026-09-12T10:00:00.000Z',
            playbook_key: 're_engagement',
          },
        ],
        counts: { prepared: 1 },
      },
      error: null,
    });

    await expect(MarketingService.getCopilotState()).resolves.toMatchObject({
      available: false,
      setupPending: true,
      total: 1,
      queue: [{ id: 'prepared-action', updated_at: '2026-09-13T10:00:00.000Z' }],
      history: [{ id: 'sent-action', updated_at: '2026-09-12T10:00:00.000Z' }],
    });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_marketing_autopilot_snapshot',
      { p_days: 30 },
      { get: true }
    );
  });
});
