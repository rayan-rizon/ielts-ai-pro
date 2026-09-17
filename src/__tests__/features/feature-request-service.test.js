import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: mocks.rpc },
}));

import {
  featureRequestService,
  requestError,
} from '@/features/feature-requests/featureRequestService';

describe('feature request service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses read-only RPCs for learner and admin pages', async () => {
    mocks.rpc.mockResolvedValue({ data: { items: [], total: 0 }, error: null });

    await featureRequestService.learnerPage({ scope: 'mine', sort: 'new', search: 'audio' });
    await featureRequestService.adminPage({ status: 'pending', search: 'audio' });

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      'feature_request_page',
      { p_scope: 'mine', p_sort: 'new', p_search: 'audio', p_offset: 0 },
      { get: true }
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      'admin_feature_request_page',
      { p_status: 'pending', p_search: 'audio', p_offset: 0 },
      { get: true }
    );
  });

  it('keeps submissions, vote toggles, and admin updates on POST RPCs', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await featureRequestService.submit(
      'Feature title',
      'A sufficiently descriptive feature idea.',
      'speaking'
    );
    await featureRequestService.toggleVote('request-id');
    await featureRequestService.updateStatus('request-id', 'approved', 'Looks useful.');

    expect(mocks.rpc).toHaveBeenNthCalledWith(
      1,
      'submit_feature_request',
      {
        p_title: 'Feature title',
        p_description: 'A sufficiently descriptive feature idea.',
        p_category: 'speaking',
      },
      undefined
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      2,
      'toggle_feature_request_vote',
      { p_request_id: 'request-id' },
      undefined
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(
      3,
      'admin_update_feature_request',
      { p_request_id: 'request-id', p_status: 'approved', p_note: 'Looks useful.' },
      undefined
    );
  });

  it('maps quota, duplicate, validation, and transport failures to learner copy', () => {
    expect(requestError({ message: 'Feature request allowance reached' })).toMatch(/allowance/);
    expect(requestError({ code: '23505' })).toMatch(/already submitted/);
    expect(requestError({ code: '22023', message: 'Invalid request filters' })).toBe(
      'Invalid request filters'
    );
    expect(requestError({ message: 'Network failed' })).toMatch(/try again/);
  });

  it('surfaces Supabase failures to the caller', async () => {
    const error = { code: '42501', message: 'Admin access required' };
    mocks.rpc.mockResolvedValue({ data: null, error });

    await expect(featureRequestService.adminPage()).rejects.toBe(error);
  });
});
