import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { trackAppEvent } from '@/lib/tracking';
import { PANEL } from '@/features/dashboard/components/primitives';

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

export default function ManualPayment({ isOpen, onClose, planData: data }) {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [txnId, setTxnId] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Number copied to clipboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!txnId || !phone) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic structural validation - prevent UI tampering (requires DB constraint for real security)
    if (data.price <= 0 || !['basic', 'pro', 'premium'].includes(data.tier)) {
      toast.error('Invalid payment data or tier detected');
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('payment_requests').insert({
        auth_id: user.id,
        tier: data.tier,
        interval: data.interval,
        amount: data.price,
        currency: 'BDT',
        payment_method: selectedMethod.id,
        transaction_id: txnId,
        sender_phone: phone,
        status: 'pending',
        marketing_campaign_id: data.marketingCampaignId || null,
        marketing_delivery_id: data.marketingDeliveryId || null,
      });

      if (error) throw error;

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

      trackAppEvent('manual_subscription_request_failed', {
        path: '/pricing',
        plan_tier: data?.tier,
        billing_interval: data?.interval,
        payment_method: selectedMethod?.id,
        reason: err?.message || 'manual_payment_request_failed',
      });

      toast.error(err.message || 'Failed to submit payment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence data-oid="llsb_6_">
      <div
        className="fixed inset-0 z-100 flex items-center justify-center pointer-events-auto"
        data-oid="f7cvfkl"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60"
          data-oid="pxun8dp"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(PANEL, 'relative m-4 w-full max-w-md overflow-hidden')}
          data-oid="v_21ppt"
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50"
            data-oid="mn4vexk"
          >
            <div data-oid="gd_fh07">
              <h3
                className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                data-oid="p311ox."
              >
                <CreditCard className="w-5 h-5 text-indigo-500" data-oid="dgjmrl3" />
                Secure Payment Portal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5" data-oid=".g4epxg">
                Upgrade to {data?.planName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close payment portal"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              data-oid="ttubi9v"
            >
              <X className="w-5 h-5" data-oid="8_kymqf" />
            </button>
          </div>

          <div className="p-6" data-oid="1.:c:9a">
            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-4" data-oid="p6d_-c0">
                {/* Plan Info Card */}
                <div
                  className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20"
                  data-oid="230357n"
                >
                  <div className="flex justify-between items-center mb-0.5" data-oid="6row7_v">
                    <span
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest"
                      data-oid="76..9-h"
                    >
                      Selected Tier
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-none text-[10px] px-2 py-0"
                      data-oid="dhmle7n"
                    >
                      {data?.interval}
                    </Badge>
                  </div>
                  <div
                    className="text-xl font-black text-slate-900 dark:text-white"
                    data-oid="4czjn-x"
                  >
                    {data?.currencySymbol}
                    {data?.price}{' '}
                    <span className="text-xs font-medium text-slate-500" data-oid="mp2mtc-">
                      / {data?.interval === 'monthly' ? 'month' : '3 months'}
                    </span>
                  </div>
                </div>

                {/* Method Selection */}
                <div className="space-y-2" data-oid="1og4a.x">
                  <Label
                    className="text-[10px] font-bold uppercase tracking-widest opacity-60"
                    data-oid="c02r-m5"
                  >
                    Payment Method
                  </Label>
                  <div className="grid grid-cols-2 gap-2" data-oid=".5i1vhe">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => !method.disabled && setSelectedMethod(method)}
                        className={cn(
                          'relative p-3 rounded-xl border-2 transition-all duration-300 text-left group',
                          selectedMethod.id === method.id
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                            : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-200 dark:hover:border-white/10',
                          method.disabled && 'opacity-60 cursor-not-allowed grayscale-[0.8]'
                        )}
                        data-oid="za6s2vz"
                      >
                        <div
                          className="w-10 h-10 rounded-lg mb-2 overflow-hidden flex items-center justify-center bg-white"
                          data-oid="92is44n"
                        >
                          <img
                            src={method.logo}
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div
                          className="font-bold text-sm text-slate-900 dark:text-white"
                          data-oid="21gp2ed"
                        >
                          {method.name}
                        </div>
                        <div
                          className="text-[9px] text-slate-500 uppercase font-black"
                          data-oid="qdqa9o0"
                        >
                          {method.disabled ? 'Coming Soon' : method.type}
                        </div>

                        {method.disabled ? (
                          <div className="absolute top-2 right-2" data-oid="soon-badge">
                            <Badge
                              variant="outline"
                              className="text-[8px] leading-3 px-1 py-0 h-4 border-slate-200 dark:border-white/10 text-slate-400 capitalize"
                            >
                              Soon
                            </Badge>
                          </div>
                        ) : (
                          selectedMethod.id === method.id && (
                            <div className="absolute top-2 right-2" data-oid="zwy6jcy">
                              <CheckCircle2
                                className="w-3.5 h-3.5 text-indigo-500"
                                data-oid="4x3hqqz"
                              />
                            </div>
                          )
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Details */}
                <div
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-3"
                  data-oid="cpiyuml"
                >
                  <div className="flex items-center justify-between" data-oid="o7ce10m">
                    <div className="space-y-0.5" data-oid="opc_zc9">
                      <div
                        className="text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                        data-oid="-m_8gtr"
                      >
                        Send Money To
                      </div>
                      <div
                        className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400"
                        data-oid=".tomk1_"
                      >
                        {selectedMethod.number}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => copyToClipboard(selectedMethod.number)}
                      className="h-8 px-2 hover:bg-white dark:hover:bg-slate-700 text-xs"
                      data-oid="vd-v5ld"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" data-oid="aw1yoo4" />
                      Copy
                    </Button>
                  </div>
                  <div
                    className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-100 dark:border-amber-500/20"
                    data-oid="4v9ljb1"
                  >
                    <AlertCircle
                      className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                      data-oid="7b_kqp4"
                    />

                    <p
                      className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-500 font-medium"
                      data-oid="r1g:_sb"
                    >
                      Send exact amount of{' '}
                      <b data-oid="62_1w:1">
                        {data?.currencySymbol}
                        {data?.price}
                      </b>
                      . Use the "Send Money" feature (Personal account).
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-3" data-oid="uw8hi8:">
                  <div className="space-y-1.5" data-oid="ywd8nc5">
                    <Label
                      className="text-[10px] font-bold uppercase tracking-widest opacity-60"
                      data-oid="ypbm995"
                    >
                      Sender Phone
                    </Label>
                    <Input
                      placeholder="017 XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 rounded-xl font-bold text-sm"
                      data-oid="-iy2l4n"
                    />
                  </div>
                  <div className="space-y-1.5" data-oid="3umv1:p">
                    <Label
                      className="text-[10px] font-bold uppercase tracking-widest opacity-60"
                      data-oid="4zg60ln"
                    >
                      TrxID
                    </Label>
                    <Input
                      placeholder="A1B2C3D4"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 rounded-xl font-bold uppercase text-sm"
                      data-oid="ty:882e"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-xl shadow-indigo-500/25 transition-all active:scale-[0.98]"
                  data-oid="z7ji6kc"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" data-oid="znda2e7" />
                  ) : (
                    <>
                      Submit Payment Request
                      <ArrowRight className="w-4 h-4 ml-2" data-oid="d812hde" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div
                className="py-8 flex flex-col items-center text-center space-y-4"
                data-oid="2b8m3xn"
              >
                <div
                  className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center"
                  data-oid="gq344o1"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" data-oid="ae4wah:" />
                </div>
                <div className="space-y-1" data-oid="0786_gi">
                  <h4
                    className="text-xl font-black text-slate-900 dark:text-white"
                    data-oid="xwrhsq_"
                  >
                    Submission Successful
                  </h4>
                  <p
                    className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto"
                    data-oid="jg7u2.q"
                  >
                    Our team will verify the transaction and upgrade your account within 2-4 hours.
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2"
                  data-oid="px2s3j7"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" data-oid="e7bli4g" />
                  <span
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest"
                    data-oid="1f.xzok"
                  >
                    Verification In Progress
                  </span>
                </div>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full h-11 rounded-lg border-slate-200 dark:border-white/10 font-bold"
                  data-oid="rbprn4o"
                >
                  Back to Hub
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
