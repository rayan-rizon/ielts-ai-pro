import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Gift,
  Loader2,
  Check,
  Trash2,
  Sparkles,
  Ticket,
  ArrowRight,
  ShieldCheck,
  PartyPopper,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

  // Clear feedback only when user starts typing something DIFFERENT
  // (Prevents immediate clearing when handleRedeemCode clears the input)
  useEffect(() => {
    if (feedback.type === 'error' && promoCode !== '') {
      setFeedback({ type: 'idle', message: '', details: '' });
    }
  }, [promoCode, feedback.type]);

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
        message: 'No code entered',
        details: 'Please type your promo code first.',
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
        message: data.message || 'Verification Successful!',
        details:
          data.type === 'grant'
            ? `Your plan has been boosted to ${data.subscription.toUpperCase()}.`
            : `A ${data.discount_value}${data.discount_type === 'percentage' ? '%' : '$'} discount has been attached to your profile.`,
      });

      setIsSuccess(true);
      setPromoCode('');

      // Notify parent to refresh user data
      if (onPromoApplied) onPromoApplied(data);

      toast.success(data.message || 'Promotion applied successfully!');
    } catch (error) {
      console.error('Redemption failed:', error);
      let errorMessage = 'Invalid Code';
      let errorDetails = 'This promo code is either expired, inactive, or already used.';

      if (error.message?.includes('already used')) {
        errorMessage = 'Already Redeemed';
        errorDetails = 'This code has already been applied to your account.';
      }

      setFeedback({ type: 'error', message: errorMessage, details: error.message || errorDetails });
      toast.error(error.message || 'Invalid promotion code');
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
    <Dialog open={isOpen} onOpenChange={setIsOpen} data-oid=":rb.orf">
      <DialogTrigger asChild data-oid="wuvjy4w">
        <button
          type="button"
          className={cn(
            'group relative inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs font-black transition-all duration-300 shadow-2xs border overflow-hidden active:scale-95',
            existingDiscount
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-xs'
          )}
          data-oid="zhja.eo"
        >
          {/* Animated background gradient contained within button pill */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            data-oid="wje94bm"
          />

          <div
            className={cn(
              'relative z-10 p-1 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110',
              existingDiscount
                ? 'bg-emerald-500/15 text-emerald-600'
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            )}
            data-oid="t9nsl7w"
          >
            {existingDiscount ? (
              <Sparkles className="w-3.5 h-3.5" data-oid="f6x7-a9" />
            ) : (
              <Ticket className="w-3.5 h-3.5" data-oid="ypmsyli" />
            )}
          </div>

          <span
            className="relative z-10 tracking-wider uppercase font-extrabold"
            data-oid="dblrs-j"
          >
            {existingDiscount ? 'Manage Offer' : 'Redeem Code'}
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 relative z-10 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300"
            data-oid=":pmhadq"
          />
        </button>
      </DialogTrigger>

      <DialogContent
        hideClose
        className="p-4 border-0 bg-transparent shadow-none w-full sm:max-w-[420px] overflow-hidden focus-visible:outline-none"
        data-oid="d.jj_fd"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-[28px] border border-slate-200/90 dark:border-white/10 shadow-2xl overflow-hidden"
          data-oid="dnm.-.7"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 z-30"
            data-oid="-3l2dpx"
          >
            <span className="sr-only" data-oid="wtavvb5">
              Close
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              data-oid="ofgdfe9"
            >
              <path d="M18 6 6 18" data-oid="7a9y2t9" />
              <path d="m6 6 12 12" data-oid="n:n9r-h" />
            </svg>
          </button>

          {/* Ambient Lighting */}
          <div
            className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"
            data-oid="k7d-qjd"
          />

          <div className="relative z-10" data-oid="9w-nwjb">
            <AnimatePresence mode="wait" data-oid="g1_hmzu">
              {isSuccess ? (
                <motion.div
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="flex flex-col items-center text-center py-2"
                  data-oid="041ri:8"
                >
                  <div className="relative mb-6" data-oid="rrrcyol">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 flex items-center justify-center text-white relative z-10"
                      data-oid="gad-pb."
                    >
                      <Check className="w-8 h-8 stroke-[3px]" data-oid="4depepg" />
                    </motion.div>
                  </div>

                  <h2
                    className="text-2xl font-black text-slate-950 dark:text-white mb-2 tracking-tight"
                    data-oid="at5nzb7"
                  >
                    Congratulations!
                  </h2>
                  <p
                    className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed mb-6 max-w-[280px]"
                    data-oid="ja5cu15"
                  >
                    {feedback.message}
                    <span
                      className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-1"
                      data-oid="l:o.-91"
                    >
                      {feedback.details}
                    </span>
                  </p>

                  <Button
                    onClick={handleClose}
                    className="w-full h-12 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-slate-800 transition-all"
                    data-oid="h4r4dhd"
                  >
                    Start Learning Now
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  data-oid="jy:s.ey"
                >
                  <div className="flex flex-col items-center mb-6 text-center" data-oid="_6.3v0k">
                    <div
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 shadow-md shadow-indigo-500/25 flex items-center justify-center text-white mb-4"
                      data-oid="2a-3up2"
                    >
                      <Gift className="w-7 h-7" data-oid="0ox.klh" />
                    </div>
                    <h2
                      className="text-2xl font-black text-slate-950 dark:text-white mb-1.5 tracking-tight"
                      data-oid="psasrtn"
                    >
                      {existingDiscount && !showNewCodeInput ? 'Promotion Active' : 'Special Offer'}
                    </h2>
                    <p
                      className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium max-w-[280px] leading-relaxed"
                      data-oid="a8rjaze"
                    >
                      {existingDiscount && !showNewCodeInput
                        ? 'You have an exclusive discount applied to your account.'
                        : 'Unlock your full potential with a premium promo code.'}
                    </p>
                  </div>

                  <AnimatePresence mode="wait" data-oid="ca08wno">
                    {existingDiscount && !showNewCodeInput ? (
                      <motion.div
                        key="active-state"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                        data-oid="05mjv0c"
                      >
                        <div
                          className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col items-center gap-2 text-center"
                          data-oid="ngf0koc"
                        >
                          <span
                            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
                            data-oid="t2ljl63"
                          >
                            Active Coupon
                          </span>
                          <span
                            className="text-xl font-mono font-black text-slate-950 dark:text-white tracking-widest"
                            data-oid="r.bewj:"
                          >
                            {existingDiscount.code}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-0.5 px-3 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase"
                            data-oid="fapc5jy"
                          >
                            {existingDiscount.discount_value}
                            {existingDiscount.discount_type === 'percentage' ? '%' : '$'} OFF
                          </Badge>
                        </div>

                        <div className="flex gap-3" data-oid="_:u_g-0">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-11 text-xs font-bold uppercase tracking-wider border-slate-200 dark:border-slate-800"
                            onClick={() => setShowNewCodeInput(true)}
                            data-oid="w22221s"
                          >
                            Use Different Code
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-0"
                            onClick={handleRemoveCode}
                            disabled={isRemoving}
                            data-oid="pvo4dyg"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-4 h-4 animate-spin" data-oid="f7bj2_z" />
                            ) : (
                              <Trash2 className="w-4 h-4" data-oid="0s4svbk" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="input-state"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                        data-oid="t9y6feo"
                      >
                        <div className="relative" data-oid="za:ms2m">
                          <Input
                            ref={inputRef}
                            placeholder="Enter Promo Code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="h-13 sm:h-14 text-center font-mono text-base sm:text-lg font-black tracking-widest uppercase rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-600 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
                            data-oid="vgjrmku"
                          />
                        </div>

                        <AnimatePresence data-oid="rx:wgw8">
                          {feedback.type === 'error' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20"
                              data-oid="x6oux5_"
                            >
                              <div
                                className="text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-0.5"
                                data-oid="4wzwf93"
                              >
                                {feedback.message}
                              </div>
                              <div
                                className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-tight"
                                data-oid="t7qq33z"
                              >
                                {feedback.details}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-3 pt-1" data-oid="hp0f9op">
                          <Button
                            onClick={handleRedeemCode}
                            disabled={isRedeeming || !promoCode.trim()}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed"
                            data-oid="yzl01m3"
                          >
                            {isRedeeming ? (
                              <div className="flex items-center gap-2" data-oid="52_5gqg">
                                <Loader2 className="w-4 h-4 animate-spin" data-oid="bl7ef4r" />
                                <span data-oid="t6m:ruz">VERIFYING...</span>
                              </div>
                            ) : (
                              <>
                                <span>Apply Promotion</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>

                          {existingDiscount && (
                            <button
                              onClick={() => setShowNewCodeInput(false)}
                              className="w-full text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors py-2 uppercase tracking-widest"
                              data-oid="6t9k5mn"
                            >
                              Go Back
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] gap-2.5"
              data-oid="691cwg-"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" data-oid="jnd2cj." />
              Secure Bank-Grade Validation
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
