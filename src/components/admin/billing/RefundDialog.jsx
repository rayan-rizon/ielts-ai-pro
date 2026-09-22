import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
  API_REFUND_PROVIDERS,
  BillingService,
  REFUND_REASONS,
} from '@/features/admin/services/BillingService';
import { AdminButton, BODY, FIELD, FieldLabel, NUM, Notice, TITLE } from '../ui/primitives';
import { UNUSED_PURCHASE_VERDICTS, formatMoney, providerLabel, verdictMeta } from './billingFormat';

/**
 * Refund one payment. Stripe refunds are executed through Stripe; bKash/Nagad
 * refunds are sent from the merchant wallet first and recorded here with the
 * transfer's transaction ID, so the ledger always points at real money.
 */
export default function RefundDialog({ payment, userId, open, onOpenChange, onDone }) {
  const evidence = payment?.evidence || {};
  const provider = String(payment?.provider || '').toLowerCase();
  const viaApi = API_REFUND_PROVIDERS.has(provider);
  const refundable = Number(evidence.refundableAmount || 0);
  const currency = payment?.currency || 'USD';
  const unusedAllowed = UNUSED_PURCHASE_VERDICTS.has(evidence.verdict);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [providerRef, setProviderRef] = useState('');
  const [endAccess, setEndAccess] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(refundable ? String(refundable) : '');
    setReason(unusedAllowed ? 'unused_purchase' : '');
    setNote('');
    setProviderRef('');
    setEndAccess(true);
    setConfirming(false);
  }, [open, refundable, unusedAllowed]);

  const numericAmount = Number(amount);
  const isFull = Math.abs(numericAmount - refundable) < 0.005;
  const problem = useMemo(() => {
    if (!refundable) return 'Nothing left to refund on this payment.';
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'Enter an amount.';
    if (numericAmount > refundable + 0.005)
      return `At most ${formatMoney(refundable, currency)} can be refunded.`;
    if (!reason) return 'Choose why this is being refunded.';
    if (reason === 'unused_purchase' && !unusedAllowed)
      return 'The evidence does not support an unused-purchase refund. Choose the reason that applies.';
    if (!viaApi && providerRef.trim().length < 4)
      return `Enter the ${providerLabel(provider)} transaction ID of the money you sent back.`;
    return null;
  }, [refundable, numericAmount, currency, reason, unusedAllowed, viaApi, providerRef, provider]);

  const submit = async () => {
    if (problem) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      setSubmitting(true);
      if (viaApi) {
        const result = await BillingService.refundStripePayment({
          paymentRequestId: payment.id,
          amount: numericAmount,
          reason,
          note,
          endAccess,
        });
        toast.success(
          result?.refund?.status === 'succeeded'
            ? `Refunded ${formatMoney(numericAmount, currency)} through Stripe`
            : `Stripe accepted the refund; it is ${result?.refund?.status || 'processing'}`
        );
        if (result?.accessError)
          toast.error(`Refunded, but access was not ended: ${result.accessError}`);
        if (result?.ledgerWarning) toast.info(result.ledgerWarning);
      } else {
        const refund = await BillingService.recordManualRefund({
          paymentRequestId: payment.id,
          amount: numericAmount,
          reason,
          providerRefundRef: providerRef.trim(),
          note,
        });
        toast.success(
          `Recorded ${providerLabel(provider)} refund of ${formatMoney(numericAmount, currency)}`
        );
        if (endAccess && userId) {
          try {
            await BillingService.endPaidAccess({ userId, refundId: refund?.id });
          } catch (error) {
            toast.error(`Refund recorded, but access was not ended: ${error.message}`);
          }
        }
      }
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error.message || 'Refund failed');
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  };

  const meta = verdictMeta(evidence.verdict);

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="w-[95vw] max-w-md rounded-xl border border-stone-200/90 bg-white p-4 dark:border-white/10 dark:bg-[#131315] sm:p-5">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className={TITLE}>
            Refund {formatMoney(payment?.amount, currency)} · {providerLabel(provider)}
          </DialogTitle>
          <DialogDescription className={BODY}>
            {viaApi
              ? 'The refund is sent to the customer’s card through Stripe. It cannot be undone.'
              : `Send the money back from the ${providerLabel(provider)} merchant wallet first, then record it here.`}
          </DialogDescription>
        </DialogHeader>

        <Notice
          tone={meta.tone}
          icon={meta.tone === 'ok' ? ShieldCheck : AlertTriangle}
          title={`Evidence: ${meta.title}`}
          className="mt-3"
        >
          {meta.detail}
        </Notice>

        <div className="mt-4 space-y-3">
          <label className="block">
            <FieldLabel hint={`up to ${formatMoney(refundable, currency)}`}>Amount</FieldLabel>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setConfirming(false);
              }}
              className={cn(FIELD, NUM)}
              aria-label="Refund amount"
            />
          </label>

          <div>
            <FieldLabel>Reason</FieldLabel>
            <Select
              value={reason}
              onValueChange={(value) => {
                setReason(value);
                setConfirming(false);
              }}
            >
              <SelectTrigger className={FIELD} aria-label="Refund reason">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === 'unused_purchase' && !unusedAllowed}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!viaApi && (
            <label className="block">
              <FieldLabel hint="of the money you sent back">
                {providerLabel(provider)} transaction ID
              </FieldLabel>
              <Input
                value={providerRef}
                onChange={(event) => {
                  setProviderRef(event.target.value);
                  setConfirming(false);
                }}
                maxLength={64}
                className={cn(FIELD, NUM)}
                aria-label="Refund transaction ID"
              />
            </label>
          )}

          <label className="block">
            <FieldLabel hint="optional">Note</FieldLabel>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              rows={2}
              className="rounded-md border-stone-300 bg-white text-xs dark:border-white/15 dark:bg-[#131315]"
              aria-label="Refund note"
            />
          </label>

          <label className="flex items-start gap-2">
            <Checkbox
              checked={endAccess}
              onCheckedChange={(checked) => setEndAccess(checked === true)}
              aria-label="End paid access now"
            />
            <span className={BODY}>
              End paid access now
              {viaApi ? ' and cancel the Stripe subscription' : ''}.
              {!isFull && ' Usually left off for a partial refund.'}
            </span>
          </label>
        </div>

        {problem && amount !== '' && (
          <p className="mt-3 text-[11px] font-semibold text-[rgb(var(--signal-fault))]">
            {problem}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <AdminButton variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={confirming ? 'destructive' : 'primary'}
            onClick={submit}
            disabled={Boolean(problem)}
            loading={submitting}
          >
            {confirming
              ? `Confirm ${formatMoney(numericAmount, currency)} refund`
              : viaApi
                ? 'Refund through Stripe'
                : 'Record refund'}
          </AdminButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
