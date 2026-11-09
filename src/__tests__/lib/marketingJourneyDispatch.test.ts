import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import { getCampaignAction } from '../../../supabase/functions/_shared/marketingOfferAction';
import { nextMarketingAttempt } from '../../../supabase/functions/_shared/marketingDelivery';

import {
  countsAsMarketingContact,
  countsTowardsCampaignCap,
} from '../../../supabase/functions/_shared/marketingEmailHealth';

// Execute the actual dispatcher without starting Deno's HTTP server or sending
// network requests. Only the external I/O boundaries are replaced.
const source = readFileSync('supabase/functions/marketing-campaign-dispatch/index.ts', 'utf8');
const code = ts.transpileModule(
  source.slice(source.indexOf('async function mapLimit'), source.indexOf('\nserve(')),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
).outputText;

function setup(
  options: {
    members?: any[];
    history?: any[];
    preferences?: any[];
    channels?: string[];
    profileError?: Error;
  } = {}
) {
  const members = options.members ?? [{ user_id: 'learner', consent_marketing: true }];
  const campaign = {
    id: 'campaign',
    status: 'active',
    channels: options.channels ?? ['in_app'],
    frequency_cap: 1,
    cooldown_hours: 72,
    metadata: {},
  };
  const db = {
    rpc: vi.fn().mockResolvedValue({ data: members, error: null }),
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: campaign, error: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
      upsert: async () => ({ error: null }),
    })),
  };
  const read = vi.fn(async (_db: any, table: string) => {
    if (table === 'users') {
      // Force concurrent workers to overlap while the profile read is pending.
      await Promise.resolve();
      if (options.profileError) throw options.profileError;
      return members.map((member) => ({ id: member.user_id, username: 'Learner' }));
    }
    return table === 'marketing_deliveries' ? (options.history ?? []) : (options.preferences ?? []);
  });
  const reserve = vi.fn().mockResolvedValue({ id: 'delivery', tracking_token: 'token' });
  const send = vi.fn();
  const dispatch = new Function(
    'admin',
    'readMarketingAudienceRows',
    'readMarketingDispatchHistory',
    'reserveMarketingDelivery',
    'nextMarketingAttempt',
    'isUndeliverableEmail',
    'sendEmail',
    'getCampaignAction',
    'countsAsMarketingContact',
    'countsTowardsCampaignCap',
    `${code}\nreturn dispatchCampaign;`
  )(
    db,
    read,
    () => read(db, 'marketing_deliveries'),
    reserve,
    nextMarketingAttempt,
    () => false,
    send,
    getCampaignAction,
    countsAsMarketingContact,
    countsTowardsCampaignCap
  );
  const run = () => dispatch('campaign', { id: 'journey', delay_hours: 0 });
  return { run, read, reserve, send, db };
}

const profileReads = (read: ReturnType<typeof vi.fn>) =>
  read.mock.calls.filter((call) => call[1] === 'users');

describe('marketing journey scan', () => {
  it('does not hydrate profiles for an empty audience', async () => {
    const { run, read } = setup({ members: [] });
    expect(await run()).toMatchObject({ audience: 0, accepted: 0, skipped: 0 });
    expect(profileReads(read)).toHaveLength(0);
  });

  it('keeps frequency-capped members skipped without reading profiles', async () => {
    const history = [
      {
        user_id: 'learner',
        channel: 'in_app',
        campaign_id: 'campaign',
        status: 'accepted',
        attempt: 1,
        created_at: '2020-01-01',
      },
    ];
    const { run, read, reserve, send } = setup({ history });
    expect(await run()).toMatchObject({ audience: 1, accepted: 0, skipped: 1 });
    expect(profileReads(read)).toHaveLength(0);
    expect(reserve.mock.calls[0][1]).toMatchObject({
      status: 'skipped',
      failure_reason: 'frequency_cap',
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps email consent enforced and deduplicates an already recorded skip', async () => {
    const { run, read, reserve } = setup({
      channels: ['email'],
      members: [{ user_id: 'learner', consent_marketing: false }],
      history: [
        {
          user_id: 'learner',
          channel: 'email',
          campaign_id: 'campaign',
          status: 'skipped',
          failure_reason: 'no_eligible_channel',
          created_at: '2020-01-01',
        },
      ],
    });
    expect(await run()).toMatchObject({ accepted: 0, skipped: 1 });
    expect(profileReads(read)).toHaveLength(0);
    expect(reserve).not.toHaveBeenCalled();
  });

  it('does not resend a bounced provider-accepted campaign', async () => {
    const { run, read, send } = setup({
      history: [
        {
          user_id: 'learner',
          channel: 'in_app',
          campaign_id: 'campaign',
          status: 'failed',
          provider_message_id: 'accepted-id',
          attempt: 1,
          created_at: '2020-01-01',
        },
      ],
    });
    expect(await run()).toMatchObject({ accepted: 0, skipped: 1 });
    expect(profileReads(read)).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('shares one lazy profile read across eligible workers and refreshes it next dispatch', async () => {
    const members = Array.from({ length: 5 }, (_, i) => ({
      user_id: `learner-${i}`,
      consent_marketing: true,
    }));
    const { run, read, reserve } = setup({ members });
    expect(await run()).toMatchObject({ accepted: 5, skipped: 0 });
    expect(profileReads(read)).toHaveLength(1);
    expect(reserve).toHaveBeenCalledTimes(5);
    expect(await run()).toMatchObject({ accepted: 5 });
    expect(profileReads(read)).toHaveLength(2);
    expect(read.mock.calls.filter((call) => call[1] === 'marketing_deliveries')).toHaveLength(2);
    expect(
      read.mock.calls.filter((call) => call[1] === 'learner_marketing_preferences')
    ).toHaveLength(2);
  });

  it('fails before reserving a send if the lazy profile read fails', async () => {
    const { run, reserve } = setup({ profileError: new Error('Profile unavailable') });
    await expect(run()).rejects.toThrow('Profile unavailable');
    expect(reserve).not.toHaveBeenCalled();
  });

  it('honours a fresh learner pause without hydrating profiles', async () => {
    const { run, read, reserve } = setup({
      preferences: [{ user_id: 'learner', proactive_paused_until: '2999-01-01' }],
    });
    expect(await run()).toMatchObject({ accepted: 0, skipped: 1 });
    expect(profileReads(read)).toHaveLength(0);
    expect(reserve.mock.calls[0][1].failure_reason).toBe('learner_paused');
  });
});
