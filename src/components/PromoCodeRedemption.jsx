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
          className={cn(
            'group relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black transition-all duration-300 shadow-sm border active:scale-95',
            existingDiscount
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md'
          )}
          data-oid="zhja.eo"
        >
          {/* Subtle animated background gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-[shimmer_2s_linear_infinite]"
            data-oid="wje94bm"
          />

          <div
            className={cn(
              'relative p-1 rounded-lg shrink-0 transition-transform duration-500 group-hover:rotate-12',
              existingDiscount ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
            )}
            data-oid="t9nsl7w"
          >
            {existingDiscount ? (
              <Sparkles className="w-3.5 h-3.5" data-oid="f6x7-a9" />
            ) : (
              <Ticket className="w-3.5 h-3.5 text-indigo-500" data-oid="ypmsyli" />
            )}
          </div>

          <span className="relative z-10 tracking-wide uppercase" data-oid="dblrs-j">
            {existingDiscount ? 'Manage Offer' : 'Redeem Code'}
          </span>
          <ArrowRight
            className="w-3.5 h-3.5 relative z-10 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white dark:bg-[#0f172a] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden"
          data-oid="dnm.-.7"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300 hover:rotate-90 hover:scale-110 z-30"
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
              className="w-5 h-5"
              data-oid="ofgdfe9"
            >
              <path d="M18 6 6 18" data-oid="7a9y2t9" />
              <path d="m6 6 12 12" data-oid="n:n9r-h" />
            </svg>
          </button>

          {/* Premium Ambient Background Elements */}
          <div
            className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"
            data-oid="k7d-qjd"
          />

          <div
            className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"
            data-oid=":dg_xsa"
          />

          <div className="relative z-10" data-oid="9w-nwjb">
            <AnimatePresence mode="wait" data-oid="g1_hmzu">
              {isSuccess ? (
                <motion.div
                  key="success-view"
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="flex flex-col items-center text-center py-4"
                  data-oid="041ri:8"
                >
                  <div className="relative mb-8" data-oid="rrrcyol">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                      className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-white relative z-10"
                      data-oid="gad-pb."
                    >
                      <Check className="w-12 h-12 stroke-[4px]" data-oid="4depepg" />
                    </motion.div>

                    {/* Animated rings */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], scale: [1, 1.8, 2] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-[2.5rem] bg-emerald-500/20 z-0"
                      data-oid="jurc2gu"
                    />

                    <div className="absolute -top-4 -right-4" data-oid=".967u57">
                      <PartyPopper
                        className="w-10 h-10 text-amber-500 animate-bounce"
                        data-oid="g6mp_br"
                      />
                    </div>
                  </div>

                  <h2
                    className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight"
                    data-oid="at5nzb7"
                  >
                    Congratulations!
                  </h2>
                  <p
                    className="text-slate-600 dark:text-slate-400 text-lg font-medium leading-relaxed mb-8 max-w-[300px]"
                    data-oid="ja5cu15"
                  >
                    {feedback.message}
                    <span
                      className="block text-sm font-normal text-slate-500 mt-2"
                      data-oid="l:o.-91"
                    >
                      {feedback.details}
                    </span>
                  </p>

                  <Button
                    onClick={handleClose}
                    className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                  <div className="flex flex-col items-center mb-10" data-oid="_6.3v0k">
                    <div
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white mb-6 relative group"
                      data-oid="2a-3up2"
                    >
                      <div
                        className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                        data-oid="nieqi_j"
                      />

                      <Gift
                        className="w-8 h-8 sm:w-10 sm:h-10 relative z-10 group-hover:scale-110 transition-transform duration-500"
                        data-oid="0ox.klh"
                      />
                    </div>
                    <h2
                      className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight"
                      data-oid="psasrtn"
                    >
                      {existingDiscount && !showNewCodeInput ? 'Promotion Active' : 'Special Offer'}
                    </h2>
                    <p
                      className="text-slate-500 dark:text-slate-400 text-sm font-medium text-center max-w-[280px] leading-relaxed"
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
                        className="space-y-6"
                        data-oid="05mjv0c"
                      >
                        <div
                          className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 flex flex-col items-center gap-3 text-center relative overflow-hidden group"
                          data-oid="ngf0koc"
                        >
                          <div
                            className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"
                            data-oid="gw5_nei"
                          />

                          <span
                            className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]"
                            data-oid="t2ljl63"
                          >
                            Active Coupon
                          </span>
                          <span
                            className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white tracking-[0.15em] sm:tracking-[0.2em]"
                            data-oid="r.bewj:"
                          >
                            {existingDiscount.code}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 py-1 px-4 text-[10px] sm:text-xs font-black rounded-full border border-emerald-500/20 uppercase tracking-wider"
                            data-oid="fapc5jy"
                          >
                            {existingDiscount.discount_value}
                            {existingDiscount.discount_type === 'percentage' ? '%' : '$'} OFF
                          </Badge>
                        </div>

                        <div className="flex gap-4" data-oid="_:u_g-0">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-14 text-sm font-black uppercase tracking-wider border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-800"
                            onClick={() => setShowNewCodeInput(true)}
                            data-oid="w22221s"
                          >
                            Use Different
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-14 w-14 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-2 border-transparent hover:border-rose-200 dark:hover:border-rose-500/20"
                            onClick={handleRemoveCode}
                            disabled={isRemoving}
                            data-oid="pvo4dyg"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-6 h-6 animate-spin" data-oid="f7bj2_z" />
                            ) : (
                              <Trash2 className="w-6 h-6" data-oid="0s4svbk" />
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
                        className="space-y-6"
                        data-oid="t9y6feo"
                      >
                        <div className="relative group" data-oid="za:ms2m">
                          <div
                            className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"
                            data-oid="sxi1m8n"
                          />

                          <Input
                            ref={inputRef}
                            placeholder="REDEEM CODE"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            className="relative h-14 sm:h-16 text-center font-mono text-xl sm:text-2xl font-black tracking-[0.15em] sm:tracking-[0.3em] uppercase rounded-xl sm:rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-0 focus-visible:border-indigo-500 transition-all placeholder:text-sm sm:placeholder:text-base"
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
                              className="text-center p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20"
                              data-oid="x6oux5_"
                            >
                              <div
                                className="text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider mb-1"
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

                        <div className="space-y-3" data-oid="hp0f9op">
                          <Button
                            onClick={handleRedeemCode}
                            disabled={isRedeeming || !promoCode.trim()}
                            className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base sm:text-lg tracking-wide shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                            data-oid="yzl01m3"
                          >
                            {isRedeeming ? (
                              <div className="flex items-center gap-3" data-oid="52_5gqg">
                                <Loader2 className="w-6 h-6 animate-spin" data-oid="bl7ef4r" />
                                <span data-oid="t6m:ruz">VERIFYING...</span>
                              </div>
                            ) : (
                              <div
                                className="flex items-center justify-center gap-3"
                                data-oid="ln::m5x"
                              >
                                <span data-oid="dquy9cp">Apply Promotion</span>
                                <ArrowRight
                                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                                  data-oid="pkzdjyo"
                                />
                              </div>
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
