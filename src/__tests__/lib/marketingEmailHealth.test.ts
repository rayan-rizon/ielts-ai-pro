import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';
import {
  countsAsMarketingContact,
  countsTowardsCampaignCap,
  marketingFeedback,
  recordMarketingFeedback,
  marketingEmailBlockReason,
} from '../../../supabase/functions/_shared/marketingEmailHealth';
import {
  emailDomainSuggestion,
  isUndeliverableEmail,
} from '../../../supabase/functions/_shared/emailAddress';
import { signUpSchema, emailSchema } from '../../lib/validations';

describe('marketing bounce safety', () => {
  it('counts a bounced accepted send against campaign limits', () => {
    const row = { status: 'failed', provider_message_id: 'accepted-provider-id' };
    expect(countsAsMarketingContact(row)).toBe(true);
    expect(countsTowardsCampaignCap(row)).toBe(true);
    expect(countsAsMarketingContact({ status: 'failed' })).toBe(false);
    expect(countsTowardsCampaignCap({ status: 'processing' })).toBe(true);
    expect(countsTowardsCampaignCap({ status: 'skipped' })).toBe(false);
  });
  it('keeps full mailboxes temporary but treats invalid-domain SMTP as permanent', () => {
    expect(
      marketingFeedback({
        type: 'email.bounced',
        data: {
          bounce: {
            type: 'Transient',
            subType: 'MailboxFull',
            diagnosticCode: ['452 4.2.2 OverQuotaTemp'],
          },
        },
      })?.permanent
    ).toBe(false);
    expect(
      marketingFeedback({
        type: 'email.bounced',
        data: { bounce: { type: 'Transient', diagnosticCode: ['550 5.4.4 Invalid domain'] } },
      })?.permanent
    ).toBe(true);
    expect(marketingFeedback({ type: 'email.complained' })?.permanent).toBe(true);
    expect(marketingFeedback({ type: 'email.delivered' })).toBeNull();
  });
  it('records normalized recipients once on webhook replay without requiring a campaign delivery', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const db = { from: vi.fn(() => ({ upsert })) };
    await recordMarketingFeedback(db, {
      type: 'email.bounced',
      created_at: '2026-11-10T00:00:00Z',
      data: {
        email_id: 'provider-id',
        to: [' A@Gmail.com ', 'a@gmail.com'],
        bounce: { subType: 'MailboxFull' },
      },
    });
    expect(upsert.mock.calls[0][0]).toHaveLength(1);
    expect(upsert.mock.calls[0][0][0].email).toBe('a@gmail.com');
    expect(upsert.mock.calls[0][1]).toEqual({
      onConflict: 'email,provider_message_id',
      ignoreDuplicates: true,
    });
  });
  it('fails closed if feedback persistence or health lookup fails', async () => {
    const failure = { message: 'database unavailable' };
    await expect(
      recordMarketingFeedback(
        { from: () => ({ upsert: async () => ({ error: failure }) }) },
        { type: 'email.bounced', data: { email_id: 'id', to: ['a@gmail.com'] } }
      )
    ).rejects.toEqual(failure);
    await expect(
      marketingEmailBlockReason({ rpc: async () => ({ error: failure }) }, 'a@gmail.com')
    ).rejects.toEqual(failure);
  });
  it('rejects known signup typos with a suggestion without changing sign-in rules', () => {
    expect(emailDomainSuggestion('a@gmail.come')).toBe('gmail.com');
    expect(isUndeliverableEmail('a@gamil.com')).toBe(true);
    expect(isUndeliverableEmail('a@gmail.com')).toBe(false);
    const result = signUpSchema.safeParse({
      email: 'a@gmail.come',
      password: 'Testing123!',
      username: 'learner',
    });
    expect(result.success).toBe(false);
    expect(emailSchema.safeParse('a@gmail.come').success).toBe(true);
  });
});

describe('actual provider dispatch boundary', () => {
  const source = readFileSync('supabase/functions/_shared/resend.ts', 'utf8');
  const code = ts.transpileModule(
    source.slice(source.indexOf('export async function sendEmail(')).replace('export ', ''),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  function sender(reason: string | null, failure: any = null) {
    const dispatch = vi.fn().mockResolvedValue({ success: true, id: 'provider-id' });
    const db = { rpc: vi.fn().mockResolvedValue({ data: reason, error: failure }) };
    const send = new Function(
      'supabase',
      'marketingEmailBlockReason',
      'dispatchEmail',
      `${code}; return sendEmail;`
    )(db, marketingEmailBlockReason, dispatch);
    return { send, dispatch, db };
  }
  it('never contacts the provider for a blocked marketing recipient', async () => {
    const { send, dispatch } = sender('email_bounce_cooldown');
    expect(await send({ to: 'a@gmail.com', type: 'marketing_campaign' })).toMatchObject({
      skipped: true,
      reason: 'email_bounce_cooldown',
    });
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('never contacts the provider if health lookup fails', async () => {
    const { send, dispatch } = sender(null, new Error('unavailable'));
    expect(await send({ to: 'a@gmail.com', type: 'marketing_campaign' })).toHaveProperty('error');
    expect(dispatch).not.toHaveBeenCalled();
  });
  it('allows healthy marketing and preserves transactional email access', async () => {
    const { send, dispatch, db } = sender(null);
    await send({ to: 'a@gmail.com', type: 'marketing_campaign' });
    expect(dispatch).toHaveBeenCalledTimes(1);
    db.rpc.mockClear();
    await send({ to: 'a@gmail.com', type: 'payment_failed' });
    expect(db.rpc).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
