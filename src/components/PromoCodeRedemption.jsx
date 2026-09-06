import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Ticket, Loader2, Check, Trash2, Sparkles, ArrowRight, AlertCircle, X } from 'lucide-react';
import { Pill, NUM, MICRO } from '@/features/dashboard/components/primitives';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';

export default function PromoCodeRedemption({ onPromoApplied, existingDiscount }) {
  const [isOpen, setIsOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showNewCodeInput, setShowNewCodeInput] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '', details: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (!existingDiscount || showNewCodeInput) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      setIsSuccess(false);
      setFeedback({ type: 'idle', message: '', details: '' });
    }
  }, [isOpen, showNewCodeInput, existingDiscount]);

  const handleRedeemCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setFeedback({
        type: 'error',
        message: 'No Code Entered',
        details: 'Please enter a valid promo code before applying.',
      });
      return;
    }

    setIsRedeeming(true);
    setFeedback({ type: 'idle', message: '', details: '' });

    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', {
        code_lookup: code,
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || 'Invalid promo code');
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Promo Code Applied!',
        details:
          data.type === 'grant'
            ? `Your account has been upgraded to the ${data.subscription?.toUpperCase() || 'PREMIUM'} plan.`
            : `An exclusive ${data.discount_value}${data.discount_type === 'percentage' ? '%' : '$'} discount has been applied to your plan.`,
      });

      setIsSuccess(true);
      setPromoCode('');

      // Notify parent to refresh user data
      if (onPromoApplied) onPromoApplied(data);

      toast.success(data.message || 'Promo code applied successfully!');
    } catch (error) {
      console.error('Redemption failed:', error);
      let errorMessage = 'Invalid Code';
      let errorDetails = 'This promo code is either expired, inactive, or not recognized.';

      const rawMsg = error?.message || '';
      if (rawMsg.includes('Not logged in') || rawMsg.includes('User not found')) {
        errorMessage = 'Sign In Required';
        errorDetails = 'Please sign in to your account to redeem promo codes.';
      } else if (rawMsg.includes('already used') || rawMsg.includes('already applied')) {
        errorMessage = 'Already Redeemed';
        errorDetails = 'This promo code has already been applied to your account.';
      } else if (rawMsg.includes('fully claimed') || rawMsg.includes('expired')) {
        errorMessage = 'Offer Expired';
        errorDetails = 'This promo code has expired or reached its maximum redemptions.';
      } else if (rawMsg && rawMsg !== 'Invalid promo code') {
        errorDetails = rawMsg;
      }

      setFeedback({ type: 'error', message: errorMessage, details: errorDetails });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRemoveCode = async () => {
    setIsRemoving(true);
    try {
      const { error } = await supabase.rpc('clear_promo_discount');
      if (error) throw error;

      setFeedback({ type: 'idle', message: '', details: '' });
      setShowNewCodeInput(true);
      if (onPromoApplied) onPromoApplied();
      toast.success('Promotion removed');
    } catch (error) {
      console.error('Removal failed:', error);
      toast.error('Failed to remove promotion');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setIsSuccess(false);
      setFeedback({ type: 'idle', message: '', details: '' });
      setShowNewCodeInput(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'group relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 border cursor-pointer active:scale-[0.98]',
            existingDiscount
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/15'
              : 'bg-white dark:bg-[#131315] text-slate-700 dark:text-slate-200 border-[#e4e2f0] dark:border-white/10 hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:hover:border-[#5a63df]/40 dark:hover:text-[#afb5ff]'
          )}
        >
          <div
            className={cn(
              'p-1 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-105',
              existingDiscount
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff]'
            )}
          >
            {existingDiscount ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <Ticket className="w-3.5 h-3.5" />
            )}
          </div>

          <span className="tracking-wide uppercase text-[11px] font-bold">
            {existingDiscount ? 'Manage Offer' : 'Redeem Code'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
        </button>
      </DialogTrigger>

      <DialogContent
        hideClose
        className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto border-0 bg-transparent p-4 shadow-none focus-visible:outline-none sm:max-w-[400px]"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          className="relative rounded-2xl border border-[#e4e2f0] dark:border-white/10 bg-white dark:bg-[#131315] p-6 sm:p-7 shadow-xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center justify-center z-30"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.94, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -6 }}
                  className="flex flex-col items-center text-center py-1"
                >
                  <div className="relative mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.05 }}
                      className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center relative z-10"
                    >
                      <Check className="w-6 h-6 stroke-[2.5]" />
                    </motion.div>
                  </div>

                  <DialogTitle asChild>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight">
                      Offer Activated!
                    </h2>
                  </DialogTitle>
                  <DialogDescription asChild>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] font-medium leading-relaxed mb-6 max-w-[280px]">
                      {feedback.message}
                      {feedback.details && (
                        <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 mt-1">
                          {feedback.details}
                        </span>
                      )}
                    </p>
                  </DialogDescription>

                  <Button
                    onClick={handleClose}
                    className="w-full h-11 rounded-xl bg-[#5a63df] hover:bg-[#4b54d1] text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99]"
                  >
                    Continue
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col items-center mb-5 text-center">
                    <div className="w-11 h-11 rounded-xl border border-[#5a63df]/20 bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#afb5ff] flex items-center justify-center mb-3">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <DialogTitle asChild>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
                        {existingDiscount && !showNewCodeInput
                          ? 'Active Promotion'
                          : 'Redeem Promo Code'}
                      </h2>
                    </DialogTitle>
                    <DialogDescription asChild>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] font-medium max-w-[290px] leading-relaxed">
                        {existingDiscount && !showNewCodeInput
                          ? 'You have an active promotional discount applied to your account.'
                          : 'Enter your code to unlock exclusive discounts or subscription upgrades.'}
                      </p>
                    </DialogDescription>
                  </div>

                  <AnimatePresence mode="wait">
                    {existingDiscount && !showNewCodeInput ? (
                      <motion.div
                        key="active-state"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-xl border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/5 flex flex-col items-center gap-1.5 text-center">
                          <span className={cn(MICRO, 'text-slate-500 dark:text-slate-400')}>
                            Applied Promo Code
                          </span>
                          <span
                            className={cn(
                              NUM,
                              'text-xl font-bold text-slate-900 dark:text-white tracking-widest'
                            )}
                          >
                            {existingDiscount.code}
                          </span>
                          <Pill tone="emerald">
                            {existingDiscount.discount_value}
                            {existingDiscount.discount_type === 'percentage' ? '%' : '$'} OFF
                          </Pill>
                        </div>

                        <div className="flex gap-2.5">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-10 text-xs font-bold uppercase tracking-wider border-[#e4e2f0] dark:border-white/10 hover:bg-[#f4f3fb] dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                            onClick={() => setShowNewCodeInput(true)}
                          >
                            Use Different Code
                          </Button>
                          <Button
                            variant="outline"
                            className="h-10 w-10 rounded-xl border-[#e4e2f0] dark:border-white/10 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 p-0"
                            onClick={handleRemoveCode}
                            disabled={isRemoving}
                            title="Remove promo code"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="input-state"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="space-y-3.5"
                      >
                        <div>
                          <Input
                            ref={inputRef}
                            placeholder="ENTER PROMO CODE"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              if (feedback.type !== 'idle') {
                                setFeedback({ type: 'idle', message: '', details: '' });
                              }
                            }}
                            className="h-11 text-center font-mono text-sm font-bold tracking-widest uppercase rounded-xl border border-[#e4e2f0] dark:border-white/10 bg-[#f4f3fb] dark:bg-white/5 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-[#5a63df]/30 focus-visible:border-[#5a63df] transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:text-xs"
                            onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
                          />
                        </div>

                        <AnimatePresence>
                          {feedback.type === 'error' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.97, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97, y: -4 }}
                              className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/90 dark:bg-rose-950/30 flex items-start gap-2.5 text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2.5]" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                  {feedback.message}
                                </div>
                                <div className="text-xs font-medium text-rose-600 dark:text-rose-300 leading-snug">
                                  {feedback.details}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-2 pt-1">
                          <Button
                            onClick={handleRedeemCode}
                            disabled={isRedeeming || !promoCode.trim()}
                            className="w-full h-11 rounded-xl bg-[#5a63df] hover:bg-[#4b54d1] text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-none"
                          >
                            {isRedeeming ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Validating...</span>
                              </div>
                            ) : (
                              <>
                                <span>Apply Promo Code</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>

                          {existingDiscount && (
                            <button
                              onClick={() => setShowNewCodeInput(false)}
                              className="w-full text-xs font-semibold text-slate-400 hover:text-[#5a63df] dark:hover:text-[#afb5ff] transition-colors py-1 uppercase tracking-wider"
                            >
                              Back to current offer
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
