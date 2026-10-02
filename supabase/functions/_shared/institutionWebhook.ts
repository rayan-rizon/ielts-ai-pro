// Existing personal-subscription webhook delegates institution events before its handlers.
export async function handleInstitutionWebhook(event: any, stripe: any, db: any): Promise<boolean> {
  const object = event.data.object;
  if (event.type.startsWith('checkout.session.') && object.metadata?.institution_order_id) {
    const session = await stripe.checkout.sessions.retrieve(object.id, {
      expand: ['payment_intent.latest_charge', 'invoice'],
    });
    const orderId = session.metadata.institution_order_id;
    if (
      ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(
        event.type
      ) &&
      session.payment_status === 'paid'
    ) {
      const intent = session.payment_intent;
      const invoice = session.invoice;
      const { error } = await db.rpc('institution_settle_order', {
        p_order: orderId,
        p_session: session.id,
        p_intent: typeof intent === 'string' ? intent : intent?.id,
        p_amount: session.amount_total,
        p_currency: session.currency,
        p_paid_at: new Date(event.created * 1000).toISOString(),
        p_invoice: typeof invoice === 'object' ? invoice?.hosted_invoice_url : null,
        p_receipt: typeof intent === 'object' ? intent?.latest_charge?.receipt_url : null,
      });
      if (error) throw error;
      // A refund event may have arrived before checkout fulfilment. Re-read charge evidence.
      const charge = typeof intent === 'object' ? intent?.latest_charge : null;
      if (charge?.amount_refunded > 0) {
        const { error: refundError } = await db.rpc('institution_refund_order', {
          p_intent: intent.id,
          p_refunded: charge.amount_refunded,
        });
        if (refundError) throw refundError;
      }
    } else if (
      event.type === 'checkout.session.async_payment_failed' ||
      event.type === 'checkout.session.expired'
    ) {
      const { error } = await db
        .from('institution_orders')
        .update({ status: 'failed' })
        .eq('id', orderId)
        .eq('status', 'pending');
      if (error) throw error;
    }
    return true;
  }
  if (['charge.refunded', 'charge.refund.updated', 'refund.updated'].includes(event.type)) {
    const chargeId =
      event.type === 'charge.refunded'
        ? object.id
        : typeof object.charge === 'string'
          ? object.charge
          : object.charge?.id;
    if (!chargeId) return false;
    const charge = await stripe.charges.retrieve(chargeId);
    const intent =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (!intent) return false;
    const { data: handled, error } = await db.rpc('institution_refund_order', {
      p_intent: intent,
      p_refunded: charge.amount_refunded,
    });
    if (error) throw error;
    return Boolean(handled);
  }
  if (['invoice.paid', 'invoice.finalized'].includes(event.type) && !object.subscription) {
    // Metadata is attached at invoice creation; do not look up a link that may not exist yet.
    const orderId = object.metadata?.institution_order_id;
    if (!orderId) return false;
    const { error } = await db
      .from('institution_orders')
      .update({ invoice_url: object.hosted_invoice_url })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  }
  return false;
}
