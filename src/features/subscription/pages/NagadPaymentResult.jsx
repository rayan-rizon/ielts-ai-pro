import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentHead from '@/components/shared/DocumentHead';
import { useAuth } from '@/features/auth/context/AuthContext';
import { trackAuthenticatedAppEvent } from '@/lib/tracking';
import { clearMarketingAttribution } from '@/lib/marketingAttribution';
import { cn } from '@/lib/cn';
import { fetchNagadPaymentStatus } from '@/features/subscription/services/nagadPayment';
import {
  IconChip,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  TILE,
  TITLE,
} from '@/features/dashboard/components/primitives';

const POLL_MS = 3000;
// Nagad usually confirms within seconds; after this the page stops asking and
// the reconcile job finishes the order in the background.
const POLL_LIMIT = 40;
const ORDER_ID = /^[A-Za-z0-9]{5,20}$/;

const VIEW = {
  checking: {
    icon: Loader2,
    tone: 'accent',
    pill: ['accent', 'Confirming'],
    title: 'Confirming your Nagad payment',
    body: 'This usually takes a few seconds. Please keep this page open.',
  },
  paid: {
    icon: CheckCircle2,
    tone: 'emerald',
    pill: ['ok', 'Paid'],
    title: 'Payment received',
    body: 'Your plan is active. Thank you for choosing IELTS Ai Pro.',
  },
  // Admin test on Nagad's sandbox: verified, but nothing is granted or billed.
  test: {
    icon: CheckCircle2,
    tone: 'emerald',
    pill: ['accent', 'Test mode'],
    title: 'Test payment verified',
    body: "Nagad's sandbox confirmed this payment. Test payments don't change your plan or count as revenue.",
  },
  pending: {
    icon: Clock,
    tone: 'amber',
    pill: ['warn', 'Awaiting Nagad'],
    title: 'Waiting for Nagad to confirm',
    body: 'If you completed the payment, your plan activates automatically as soon as Nagad confirms it. You do not need to pay again.',
  },
  failed: {
    icon: XCircle,
    tone: 'rose',
    pill: ['fault', 'Not paid'],
    title: 'The payment did not go through',
    body: 'Nagad did not take any money for this order. You can try again.',
  },
  expired: {
    icon: XCircle,
    tone: 'neutral',
    pill: ['neutral', 'Expired'],
    title: 'This payment was not completed',
    body: 'The Nagad session ended before payment. You can start a new one.',
  },
  // Nagad's confirmation did not match the order. Never shown as success.
  review: {
    icon: AlertTriangle,
    tone: 'rose',
    pill: ['fault', 'Payment error'],
    title: 'We could not confirm this payment',
    body: "Nagad's confirmation did not match this order, so your plan has not been activated. Our team will check it with Nagad and email you within one working day. Please do not pay again.",
  },
  invalid: {
    icon: AlertTriangle,
    tone: 'neutral',
    pill: ['neutral', 'Not found'],
    title: 'Payment not found',
    body: 'We could not find this Nagad payment on your account.',
  },
};

// Why an order is held, as returned by nagad-payment-status. Each states what
// did not match; the shared ending says what happens next.
const REVIEW_REASONS = {
  amount_mismatch: 'Nagad confirmed a payment, but the amount does not match this order.',
  merchant_mismatch: "Nagad's confirmation was not issued for IELTS Ai Pro.",
  reference_mismatch: "Nagad's confirmation refers to a different payment.",
  order_mismatch: "Nagad's confirmation refers to a different order.",
  status_code_mismatch: "Nagad's confirmation was incomplete.",
  success_after_failure: 'Nagad reported this payment as failed and later as successful.',
};
const REVIEW_NEXT =
  'Your plan has not been activated. Our team will check it with Nagad and email you within one working day. Please do not pay again.';

// Nagad statuses where the customer chose not to pay.
const LEFT_NAGAD = new Set(['aborted', 'cancelled']);

function viewFor(state, order) {
  const base = VIEW[state];
  if (state === 'review' && REVIEW_REASONS[order?.review_reason]) {
    return { ...base, body: `${REVIEW_REASONS[order.review_reason]} ${REVIEW_NEXT}` };
  }
  if (state === 'failed' && LEFT_NAGAD.has(String(order?.nagad_status || '').toLowerCase())) {
    return {
      ...base,
      title: 'Payment cancelled',
      body: 'You left the Nagad page before paying, so no money was taken. You can try again.',
    };
  }
  return base;
}

export default function NagadPaymentResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const { refreshProfile } = useAuth();
  const [state, setState] = useState(() => (ORDER_ID.test(orderId || '') ? 'checking' : 'invalid'));
  const [order, setOrder] = useState(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!ORDER_ID.test(orderId || '')) return undefined;
    let cancelled = false;
    let timer = null;

    const poll = async (attempt) => {
      try {
        const result = await fetchNagadPaymentStatus(orderId);
        if (cancelled) return;
        setOrder(result);
        if (result.status === 'paid' && result.test_mode) {
          setState('test');
          return;
        }
        if (result.status === 'paid') {
          setState('paid');
          onPaid(result);
          return;
        }
        if (['failed', 'expired', 'review'].includes(result.status)) {
          setState(result.status);
          return;
        }
      } catch (error) {
        if (cancelled) return;
        if (error.status === 404 || error.status === 400) {
          setState('invalid');
          return;
        }
        // Network blips: keep polling; the order is safe either way.
      }
      if (attempt + 1 >= POLL_LIMIT) {
        setState('pending');
        return;
      }
      timer = setTimeout(() => poll(attempt + 1), POLL_MS);
    };

    const onPaid = async (result) => {
      if (tracked.current) return;
      tracked.current = true;
      try {
        sessionStorage.removeItem('auth_profile_cache');
        await refreshProfile?.();
      } catch {
        /* the dashboard refetches anyway */
      }
      // Once per order, even across reloads of this page.
      const key = `nagad_purchase_tracked:${result.order_id}`;
      try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch {
        /* storage blocked: track anyway */
      }
      trackAuthenticatedAppEvent('subscription_purchase', {
        path: '/payment/nagad',
        plan_tier: result.tier,
        billing_interval: result.interval,
        value: result.amount,
        currency: 'BDT',
        transaction_id: result.order_id,
        event_id: result.order_id,
        source: 'nagad',
      });
      clearMarketingAttribution();
    };

    poll(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, refreshProfile]);

  const view = viewFor(state, order);
  const Icon = view.icon;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <DocumentHead
        title="Nagad Payment | IELTS Ai Pro"
        description="Status of your Nagad payment."
        canonicalUrl="https://www.ieltsai.pro/payment/nagad"
        noIndex={true}
        noFollow={true}
      />
      <section className={cn(PANEL, 'w-full max-w-[420px] p-4 sm:p-5 space-y-4')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/nagad.webp"
              alt="Nagad"
              className="h-8 w-8 rounded-md border border-[#e4e2f0] bg-white object-contain p-0.5 dark:border-white/10"
            />
            <div>
              <p className={cn(MICRO, MUTED)}>Nagad payment</p>
              <h1 className={cn(TITLE, 'mt-0.5')}>{view.title}</h1>
            </div>
          </div>
          <Pill tone={view.pill[0]}>{view.pill[1]}</Pill>
        </div>

        <div className="flex items-start gap-2.5">
          <IconChip
            icon={Icon}
            tone={view.tone}
            size="md"
            className={state === 'checking' ? '[&>svg]:animate-spin' : undefined}
          />
          <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
            {view.body}
          </p>
        </div>

        {order && (
          <dl className={cn(TILE, 'p-3 space-y-1.5 text-xs')}>
            <Row label="Plan">
              {order.tier === 'premium' ? 'Premium' : 'Pro'} ·{' '}
              {order.interval === 'quarterly' ? '3-Month Pass' : 'Monthly'}
            </Row>
            <Row label="Amount">৳{order.amount}</Row>
            <Row label="Order">{order.order_id}</Row>
            {['failed', 'review'].includes(state) && order.nagad_status_code && (
              <Row label="Nagad code">{order.nagad_status_code}</Row>
            )}
          </dl>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {['paid', 'test'].includes(state) && (
            <Button asChild className="w-full bg-[#5a63df] hover:bg-[#4a52c9] text-white">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          )}
          {['failed', 'expired', 'invalid'].includes(state) && (
            <Button asChild className="w-full bg-[#5a63df] hover:bg-[#4a52c9] text-white">
              <Link to="/pricing">Back to pricing</Link>
            </Button>
          )}
          {['pending', 'review'].includes(state) && (
            <>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
              <p className={cn('text-center text-[11px]', MUTED)}>
                Questions? Email{' '}
                <a
                  href="mailto:support@ieltsai.pro"
                  className="font-semibold text-[#4a52c9] hover:underline dark:text-[#a9afff]"
                >
                  support@ieltsai.pro
                </a>{' '}
                with your order number.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn(MICRO, MUTED, 'text-[8.5px]')}>{label}</dt>
      <dd className={cn(NUM, 'font-bold text-slate-800 dark:text-slate-100')}>{children}</dd>
    </div>
  );
}
