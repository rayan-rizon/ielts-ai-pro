import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarketingService from '@/features/admin/services/MarketingService';

// Held in vi.hoisted so the test body talks to the mocks directly rather than
// through the real `supabase` type, whose rpc/invoke signatures do not carry
// vitest's mock methods. Matches admin-security-service.test.ts.
const supabaseMock = vi.hoisted(() => ({
  invoke: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: supabaseMock.invoke }, rpc: supabaseMock.rpc },
}));
beforeEach(() => vi.clearAllMocks());
describe('Copilot worker compatibility', () => {
  it('never sends an action request to an older worker', async () => {
    supabaseMock.invoke.mockResolvedValue({
      data: { dry_run: true, matched: 4 },
      error: null,
    });
    await expect(MarketingService.prepareCopilotActions()).rejects.toThrow('not deployed');
    expect(supabaseMock.invoke).toHaveBeenCalledTimes(1);
    expect(supabaseMock.invoke).toHaveBeenCalledWith('retention-autopilot', {
      body: { action: 'copilot_capabilities', dry_run: true },
    });
  });
  it('preserves the exact revision and the actual delivery outcome', async () => {
    supabaseMock.invoke
      .mockResolvedValueOnce({ data: { version: 1 }, error: null })
      .mockResolvedValueOnce({
        data: { status: 'suppressed', reason: 'payment_pending' },
        error: null,
      });
    await expect(MarketingService.approveIntervention('action', 'revision')).resolves.toEqual({
      status: 'suppressed',
      reason: 'payment_pending',
    });
    expect(supabaseMock.invoke).toHaveBeenLastCalledWith('retention-autopilot', {
      body: { action: 'approve', intervention_id: 'action', revision: 'revision' },
    });
  });

  it('falls back to the existing read-only snapshot without exposing a fatal page error', async () => {
    supabaseMock.invoke.mockResolvedValueOnce({
      data: { dry_run: true, matched: 4 },
      error: null,
    });
    supabaseMock.rpc.mockResolvedValue({
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
    expect(supabaseMock.invoke).toHaveBeenCalledTimes(1);
    expect(supabaseMock.rpc).toHaveBeenCalledWith(
      'get_marketing_autopilot_snapshot',
      { p_days: 30 },
      { get: true }
    );
  });
});
