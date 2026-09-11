import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { OUTAGE_COPY, isServiceOutageError, trackServiceError } from '@/lib/serviceOutage';
import { savePendingManualPayment } from '@/features/subscription/services/pendingManualPayment';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { trackAppEvent } from '@/lib/tracking';
import {
  PANEL,
  WELL,
  TILE,
  NUM,
  MICRO,
  TITLE,
  MUTED,
  Pill,
  IconChip,
} from '@/features/dashboard/components/primitives';

const PAYMENT_METHODS = [
  {
    id: 'bkash',
    name: 'bKash',
    number: '01676663311',
    type: 'Personal',
    logo: '/bkash.webp',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    number: 'Coming Soon',
    type: 'Personal',
    logo: '/nagad.webp',
    disabled: true,
  },
];

export default function ManualPayment({ isOpen, onClose, planData: data, userId }) {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [txnId, setTxnId] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll and register Escape key listener while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Number copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanTxnId = txnId.trim();

    if (!cleanPhone || !cleanTxnId) {
      toast.error('Please enter both your phone number and Transaction ID');
      return;
    }

    if (cleanPhone.length < 11) {
      toast.error('Please enter a valid 11-digit mobile number');
      return;
    }

    if (cleanTxnId.length < 6) {
      toast.error('Please enter a valid Transaction ID');
      return;
    }

    // Basic structural validation - prevent UI tampering (requires DB constraint for real security)
    if (!data || data.price <= 0 || !['basic', 'pro', 'premium'].includes(data.tier)) {
      toast.error('Invalid payment data or tier detected');
      return;
    }

    setIsSubmitting(true);
    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentUserId = user?.id;
      }
      if (!currentUserId) throw new Error('User not authenticated');

      const paymentRequest = {
        auth_id: currentUserId,
        tier: data.tier,
        interval: data.interval,
        amount: data.price,
        currency: 'BDT',
        payment_method: selectedMethod.id,
        transaction_id: cleanTxnId,
        sender_phone: cleanPhone,
        status: 'pending',
        marketing_campaign_id: data.marketingCampaignId || null,
        marketing_delivery_id: data.marketingDeliveryId || null,
      };

      const { error } = await supabase.from('payment_requests').insert(paymentRequest);

      if (error) {
        // The learner has already sent the money at this point. If we cannot
        // reach the backend, hold the reference locally and replay it rather
        // than losing a real payment behind a generic error toast.
        if (isServiceOutageError(error)) {
          error.__paymentRequest = paymentRequest;
        }
        throw error;
      }

      trackAppEvent('manual_subscription_request_submitted', {
        path: '/pricing',
        plan_tier: data.tier,
        billing_interval: data.interval,
        value: data.price,
        currency: 'BDT',
        payment_method: selectedMethod.id,
        campaign_id: data.marketingCampaignId || null,
      });

      setIsSuccess(true);
      toast.success('Payment request submitted successfully');
    } catch (err) {
      console.error('Payment submission error:', err);
      const kind = trackServiceError(err, 'manualPayment.submit');

      trackAppEvent('manual_subscription_request_failed', {
        path: '/pricing',
        plan_tier: data?.tier,
        billing_interval: data?.interval,
        payment_method: selectedMethod?.id,
        reason: err?.message || 'manual_payment_request_failed',
        failure_kind: kind,
      });

      if (isServiceOutageError(err)) {
        const held = savePendingManualPayment(err.__paymentRequest);
        toast.error(
          held
            ? "We couldn't reach our servers, so your transaction ID is saved on this device and will be submitted automatically. Do NOT send the money again."
            : `${OUTAGE_COPY.body} Please keep your transaction ID and try again in a few minutes — do NOT send the money again.`,
          { duration: 12000 }
        );
      } else {
        toast.error(err.message || 'Failed to submit payment request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-payment-title"
      className="fixed inset-0 z-100 flex min-h-full items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          PANEL,
          'relative z-10 my-auto flex max-h-[min(90vh,620px)] w-full max-w-[416px] flex-col overflow-hidden shadow-2xl dark:shadow-black/70'
        )}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#e4e2f0] dark:border-white/[0.07] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <IconChip icon={CreditCard} tone="accent" size="sm" />
            <div>
              <h3 id="manual-payment-title" className={TITLE}>
                Manual Payment Portal
              </h3>
              <p className={cn(MICRO, MUTED, 'text-[8.5px] mt-0.5')}>
                Upgrade to {data?.planName || 'Pro'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment portal"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-3.5 space-y-3">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Plan Info Card */}
              <div
                className={cn(
                  WELL,
                  'rounded-lg border border-[#e4e2f0] dark:border-white/[0.07] p-2.5 sm:p-3 flex items-center justify-between'
                )}
              >
                <div className="space-y-0.5">
                  <span className={cn(MICRO, MUTED, 'text-[8.5px] block')}>Selected Plan</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      {data?.planName || (data?.tier ? data.tier.toUpperCase() : 'Pro')}
                    </span>
                    <Pill tone="accent" className="text-[8px] py-0 px-1.5">
                      {data?.interval === 'quarterly' ? 'Quarterly' : 'Monthly'}
                    </Pill>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      NUM,
                      'text-lg sm:text-xl font-black text-slate-900 dark:text-white'
                    )}
                  >
                    {data?.currencySymbol || '৳'}
                    {data?.price}
                  </div>
                  <span className={cn(MICRO, MUTED, 'text-[8px] block')}>
                    / {data?.interval === 'monthly' ? 'month' : '3 months'}
                  </span>
                </div>
              </div>

              {/* Method Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={cn(MICRO, MUTED, 'text-[8.5px]')}>Payment Method</label>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    Personal bKash
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod.id === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={method.disabled}
                        onClick={() => !method.disabled && setSelectedMethod(method)}
                        className={cn(
                          'relative flex items-center gap-2 p-2 sm:p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer',
                          isSelected
                            ? 'border-[#5a63df] bg-[#5a63df]/[0.05] dark:border-[#5a63df] dark:bg-[#5a63df]/[0.10] ring-1 ring-[#5a63df]/30'
                            : 'border-[#e4e2f0] dark:border-white/[0.07] bg-[#fbfbfe] dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/15',
                          method.disabled &&
                            'opacity-60 cursor-not-allowed grayscale-[0.6] hover:border-[#e4e2f0] dark:hover:border-white/[0.07]'
                        )}
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md shrink-0 flex items-center justify-center p-0.5 bg-white dark:bg-white/90 border border-slate-100 dark:border-white/10 shadow-2xs">
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {method.name}
                          </div>
                          <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {method.disabled ? 'Coming Soon' : method.type}
                          </div>
                        </div>

                        {method.disabled ? (
                          <Pill
                            tone="neutral"
                            className="absolute top-2 right-2 text-[7.5px] py-0 px-1"
                          >
                            Soon
                          </Pill>
                        ) : (
                          isSelected && (
                            <div className="absolute top-2 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5a63df] text-white">
                              <Check className="h-2 w-2 stroke-[3]" />
                            </div>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Details & Instructions */}
              <div className={cn(TILE, 'p-2.5 sm:p-3 space-y-2 rounded-lg')}>
                <div className="flex items-center justify-between">
                  <div className={cn(MICRO, MUTED, 'text-[8.5px]')}>Send Money Details</div>
                  <Pill tone="neutral" className="text-[8px] py-0 px-1.5">
                    {selectedMethod.type} Account
                  </Pill>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-white dark:bg-white/[0.04] border border-[#e4e2f0] dark:border-white/[0.07]">
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                      Recipient Number
                    </div>
                    <div
                      className={cn(
                        NUM,
                        'text-sm sm:text-base font-black tracking-wider text-[#5a63df] dark:text-[#a9afff] select-all'
                      )}
                    >
                      {selectedMethod.number}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedMethod.number)}
                    className={cn(
                      'inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-95',
                      copied
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 border border-[#e4e2f0] dark:border-white/10'
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-start gap-1.5 p-2 rounded-md border border-amber-500/25 bg-amber-500/[0.07] dark:bg-amber-400/[0.10] dark:border-amber-400/30">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-snug text-amber-900 dark:text-amber-200 font-medium">
                    Send exact amount of{' '}
                    <strong className={cn(NUM, 'font-bold')}>
                      {data?.currencySymbol || '৳'}
                      {data?.price}
                    </strong>{' '}
                    via bKash <u>Send Money</u>. Enter sender phone and Transaction ID below.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className={cn(MICRO, MUTED, 'text-[8.5px] block')}>
                    Sender Phone Number
                  </label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    maxLength={11}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (val.startsWith('+880')) val = '0' + val.slice(4);
                      else if (val.startsWith('880')) val = '0' + val.slice(3);
                      setPhone(val);
                    }}
                    className={cn(
                      NUM,
                      'h-8.5 rounded-md border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-white/5 font-medium text-xs focus-visible:ring-2 focus-visible:ring-[#5a63df]'
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className={cn(MICRO, MUTED, 'text-[8.5px] block')}>
                    Transaction ID (TrxID)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. BL9A4K8..."
                    value={txnId}
                    maxLength={20}
                    onChange={(e) =>
                      setTxnId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    }
                    className={cn(
                      NUM,
                      'h-8.5 rounded-md border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-white/5 uppercase font-bold text-xs tracking-wider focus-visible:ring-2 focus-visible:ring-[#5a63df]'
                    )}
                  />
                </div>
              </div>

              {/* Action Button & Security */}
              <div className="space-y-1.5 pt-0.5">
                <Button
                  type="submit"
                  disabled={isSubmitting || !phone || !txnId}
                  className="w-full h-9.5 rounded-lg bg-[#5a63df] hover:bg-[#4a52c9] text-white font-bold text-xs tracking-tight transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      Submit Payment Request
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                  <ShieldCheck className="w-3 h-3 text-[#5a63df]" />
                  <span>Manual verification completed within 2–4 hours</span>
                </div>
              </div>
            </form>
          ) : (
            <div className="py-4 px-1 flex flex-col items-center text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-3 ring-emerald-500/10">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>

              <div className="space-y-0.5">
                <h4 className={cn(TITLE, 'text-sm font-extrabold text-slate-900 dark:text-white')}>
                  Payment Request Submitted
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  We've received your transaction details for{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {data?.planName || 'Pro'}
                  </span>
                  . Our team will verify and upgrade your account within 2–4 hours.
                </p>
              </div>

              <div className={cn(TILE, 'w-full p-2.5 space-y-1.5 text-left rounded-lg')}>
                <div className="flex justify-between items-center text-xs">
                  <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Transaction ID</span>
                  <span
                    className={cn(
                      NUM,
                      'font-bold uppercase text-slate-800 dark:text-slate-200 text-xs'
                    )}
                  >
                    {txnId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Sender Phone</span>
                  <span className={cn(NUM, 'font-bold text-slate-800 dark:text-slate-200 text-xs')}>
                    {phone}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Amount</span>
                  <span className={cn(NUM, 'font-bold text-slate-800 dark:text-slate-200 text-xs')}>
                    {data?.currencySymbol || '৳'}
                    {data?.price}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-[#e4e2f0] dark:border-white/[0.07] flex justify-between items-center">
                  <span className={cn(MICRO, MUTED, 'text-[8.5px]')}>Status</span>
                  <Pill tone="ok" className="text-[8px] py-0 px-1.5">
                    Pending Verification
                  </Pill>
                </div>
              </div>

              <Button
                type="button"
                onClick={onClose}
                className="w-full h-8.5 rounded-lg bg-[#5a63df] hover:bg-[#4a52c9] text-white font-bold text-xs"
              >
                Return to Pricing
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
