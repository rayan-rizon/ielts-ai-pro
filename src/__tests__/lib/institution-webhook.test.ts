import { describe, it, expect, vi } from 'vitest';
import { handleInstitutionWebhook } from '../../../supabase/functions/_shared/institutionWebhook';
const session = {
  id: 'cs_school',
  created: 1780000000,
  metadata: { institution_order_id: 'order' },
  payment_status: 'paid',
  amount_total: 10000,
  currency: 'usd',
  payment_intent: { id: 'pi_school', latest_charge: { receipt_url: 'https://stripe.com/receipt' } },
  invoice: { hosted_invoice_url: 'https://stripe.com/invoice' },
};
const event = (type: string, object: any) => ({ type, created: 1780086400, data: { object } });
describe('Institution Stripe routing', () => {
  it('fulfils verified institution payments using the order identity', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true });
    const stripe = { checkout: { sessions: { retrieve: vi.fn().mockResolvedValue(session) } } };
    expect(
      await handleInstitutionWebhook(event('checkout.session.completed', session), stripe, { rpc })
    ).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      'institution_settle_order',
      expect.objectContaining({
        p_order: 'order',
        p_session: 'cs_school',
        p_amount: 10000,
        p_intent: 'pi_school',
        p_paid_at: new Date(1780086400 * 1000).toISOString(),
      })
    );
  });
  it('does not fulfil an unpaid completion, but handles delayed success', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true });
    const retrieve = vi.fn().mockResolvedValue({ ...session, payment_status: 'unpaid' });
    const stripe = { checkout: { sessions: { retrieve } } };
    await handleInstitutionWebhook(event('checkout.session.completed', session), stripe, { rpc });
    expect(rpc).not.toHaveBeenCalled();
    retrieve.mockResolvedValue(session);
    await handleInstitutionWebhook(
      event('checkout.session.async_payment_succeeded', session),
      stripe,
      { rpc }
    );
    expect(rpc).toHaveBeenCalledOnce();
  });
  it('leaves personal subscription events to existing handlers', async () =>
    expect(
      await handleInstitutionWebhook(
        event('checkout.session.completed', { metadata: { tier: 'premium' } }),
        {},
        {}
      )
    ).toBe(false));
  it('propagates settlement failures for webhook retries', async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ error: new Error('DB unavailable') }) };
    await expect(
      handleInstitutionWebhook(
        event('checkout.session.completed', session),
        { checkout: { sessions: { retrieve: vi.fn().mockResolvedValue(session) } } },
        db
      )
    ).rejects.toThrow('DB unavailable');
  });
  it('routes refunds by payment intent without touching personal plans', async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: true }) };
    await handleInstitutionWebhook(
      event('charge.refunded', { id: 'ch_school' }),
      {
        charges: {
          retrieve: vi
            .fn()
            .mockResolvedValue({ payment_intent: 'pi_school', amount_refunded: 5000 }),
        },
      },
      db
    );
    expect(db.rpc).toHaveBeenCalledWith('institution_refund_order', {
      p_intent: 'pi_school',
      p_refunded: 5000,
    });
  });
  it('reconciles refunds that arrived before checkout fulfilment', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true });
    const refunded = {
      ...session,
      payment_intent: { id: 'pi_school', latest_charge: { amount_refunded: 10000 } },
    };
    await handleInstitutionWebhook(
      event('checkout.session.completed', refunded),
      { checkout: { sessions: { retrieve: vi.fn().mockResolvedValue(refunded) } } },
      { rpc }
    );
    expect(rpc.mock.calls.map((x) => x[0])).toEqual([
      'institution_settle_order',
      'institution_refund_order',
    ]);
  });
  it('stores an invoice link that becomes available after fulfilment', async () => {
    const eq = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockReturnValue({ eq });
    expect(
      await handleInstitutionWebhook(
        event('invoice.finalized', {
          metadata: { institution_order_id: 'order' },
          hosted_invoice_url: 'https://invoice.stripe.com/test',
        }),
        {},
        { from: () => ({ update }) }
      )
    ).toBe(true);
    expect(eq).toHaveBeenCalledWith('id', 'order');
    expect(update).toHaveBeenCalledWith({ invoice_url: 'https://invoice.stripe.com/test' });
  });
});
