import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { usePaymentHistory } from '@/hooks/admin/usePaymentHistory';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  FileSearch,
  Hash,
  Loader2,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { matchesPaymentSearch } from './paymentHistory';
import CustomerBillingSheet from './billing/CustomerBillingSheet';
import RefundLedgerPanel from './billing/RefundLedgerPanel';
import NagadOrdersPanel from './billing/NagadOrdersPanel';
import {
  NUM,
  MICRO,
  PANEL,
  Kpi,
  AdminPageHeader,
  PILL_BASE,
  pillTone,
  STAGGER_CONTAINER,
  FADE_UP,
  AdminButton,
} from './ui/primitives';

const STATUS_TONE = { pending: 'warn', approved: 'ok', rejected: 'fault', refunded: 'accent' };

const StatusPill = ({ status }) => (
  <span className={cn(PILL_BASE, pillTone(STATUS_TONE[status] || 'neutral'), 'shrink-0')}>
    {status}
  </span>
);

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
];

export default function PaymentManagement() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(null);
  const [billingUserId, setBillingUserId] = useState(null);
  const [ledgerKey, setLedgerKey] = useState(0);
  const {
    requests,
    loading,
    busy,
    hasMore,
    loadMore,
    refreshManual,
    retryManual,
    retryStripe,
    refreshStripe,
    stripeLoading,
    manualError,
    stripeError,
  } = usePaymentHistory(filter, search);

  const handleStatusUpdate = async (request, newStatus) => {
    try {
      setIsProcessing(request.id);

      // The DB trigger `handle_payment_approval` upgrades the user's
      // subscription_tier when status changes to 'approved'.
      const { error: requestError } = await supabase
        .from('payment_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', request.id);

      if (requestError) throw requestError;

      if (newStatus === 'approved') {
        toast.success(`User upgraded to ${request.tier.toUpperCase()}`);
      } else {
        toast.info(`Payment request ${newStatus}`);
      }

      await refreshManual();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredRequests = requests.filter((request) => matchesPaymentSearch(request, search));

  // Counts come from the loaded set, so they reflect whatever filter is active.
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending');
    const oldest = pending.reduce(
      (acc, r) => Math.min(acc, new Date(r.created_at).getTime()),
      Date.now()
    );
    return {
      pending: pending.length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      refunded: requests.filter((r) => r.status === 'refunded').length,
      oldestHours: pending.length ? Math.round((Date.now() - oldest) / 3600000) : 0,
    };
  }, [requests]);

  const ActionButtons = ({ request, full = false }) => {
    if (request.institution_id)
      return (
        <Link
          className="text-xs font-bold text-[#5a63df] underline"
          to={`/admin/panel?tab=institutions&institution=${request.institution_id}&section=billing`}
        >
          Manage institution
        </Link>
      );
    const targetUserId = request.user?.id || request.auth_id || request.user_id;

    if (request.status === 'pending') {
      return (
        <div className={cn('flex items-center gap-2', full && 'pt-1')}>
          <button
            type="button"
            disabled={isProcessing === request.id}
            onClick={() => handleStatusUpdate(request, 'approved')}
            className={cn(
              MICRO,
              'inline-flex items-center justify-center gap-1.5 rounded-md text-white bg-[rgb(var(--signal-ok))] hover:opacity-90 transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--signal-ok))]/50',
              full ? 'flex-1 h-9' : 'h-7 w-7'
            )}
            aria-label="Approve payment"
          >
            {isProcessing === request.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {full && <span>Approve</span>}
          </button>
          <button
            type="button"
            disabled={isProcessing === request.id}
            onClick={() => handleStatusUpdate(request, 'rejected')}
            className={cn(
              MICRO,
              'inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--signal-fault))]/50',
              full ? 'flex-1 h-9' : 'h-7 w-7'
            )}
            aria-label="Reject payment"
          >
            {isProcessing === request.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            {full && <span>Reject</span>}
          </button>
        </div>
      );
    }

    if (targetUserId) {
      return (
        <button
          type="button"
          onClick={() => setBillingUserId(targetUserId)}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1 rounded-md border border-stone-300 dark:border-white/15 px-2 h-7 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50',
            full && 'w-full justify-center h-9'
          )}
          aria-label={`Review billing and refund evidence for ${request.user?.full_name || request.user?.email || 'this learner'}`}
        >
          <FileSearch className="w-3 h-3" />
          Review
        </button>
      );
    }

    return (
      <span
        className={cn(MICRO, 'inline-flex items-center gap-1 text-stone-500 dark:text-stone-400')}
      >
        <CheckCircle2 className="w-3 h-3" />
        Processed
      </span>
    );
  };

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Payments"
          description="Approve manual payments, check refund evidence, and issue refunds"
          tip="Approving a manual payment upgrades the learner's plan. Review opens the learner's payments, AI usage since purchase, and refund options."
        >
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <Input
              aria-label="Search payments"
              placeholder="Search TrxID, phone, user…"
              maxLength={160}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-full rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium"
            />
          </div>
        </AdminPageHeader>
      </m.div>

      {(manualError || stripeError) && (
        <div role="alert" className="text-xs text-amber-700 dark:text-amber-300">
          {manualError || stripeError}
          <AdminButton
            variant="outline"
            onClick={() => (manualError ? retryManual() : retryStripe())}
            loading={busy}
          >
            Retry history
          </AdminButton>
        </div>
      )}
      {stripeLoading && (
        <p role="status" className="text-xs text-stone-500">
          Loading Stripe history… Manual payments are available as they load.
        </p>
      )}
      {/* Queue state */}
      <m.div variants={FADE_UP} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi
          label="Awaiting review"
          value={stats.pending}
          sub={
            stats.pending ? `loaded · oldest ${stats.oldestHours}h ago` : 'none in loaded history'
          }
          tip="Pending payments in the loaded history. Select Pending and load older records to review the full queue."
        />
        <Kpi label="Approved" value={stats.approved} sub="in loaded history" />
        <Kpi label="Rejected" value={stats.rejected} sub="in loaded history" />
        <Kpi label="Refunded" value={stats.refunded} sub="in loaded history" />
        <Kpi
          label="Loaded records"
          value={requests.length}
          sub={hasMore ? 'more history available' : 'manual + Stripe'}
          className="col-span-2 lg:col-span-1"
        />
      </m.div>

      {/* Filter row */}
      <m.div
        variants={FADE_UP}
        className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-stone-200/80 bg-stone-100 p-1 dark:border-white/[0.07] dark:bg-white/4 w-full sm:w-fit"
      >
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <button
              type="button"
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'relative h-7 px-3 rounded-md font-bold text-xs transition-colors active:scale-95 shrink-0',
                isActive
                  ? 'text-stone-900 dark:text-stone-50'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              {isActive && (
                <m.span
                  layoutId="paymentFilterPill"
                  className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          );
        })}
      </m.div>

      <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-stone-100 dark:divide-white/5">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-stone-500 dark:text-stone-400" />
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Loading payments</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                No payment requests found
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="animate-panel-in p-4 space-y-3 relative">
                {request.status === 'pending' && (
                  <span className="absolute left-0 top-0 h-full w-[2px] bg-[rgb(var(--signal-warn))]" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/6 grid place-items-center text-stone-500 dark:text-stone-400 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                        {request.user?.full_name || 'Unknown user'}
                      </p>
                      <p
                        className={cn(MICRO, 'text-stone-500 dark:text-stone-400 truncate mt-0.5')}
                      >
                        {request.user?.email}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={request.status} />
                </div>

                <div className="rounded-lg bg-stone-50 dark:bg-white/3 border border-stone-200/70 dark:border-white/6 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}
                    >
                      {request.currency} {request.amount}
                    </span>
                    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      {request.tier} · {request.interval}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-stone-200/60 dark:border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span
                        className={cn(
                          NUM,
                          'text-[11px] text-stone-700 dark:text-stone-200 truncate'
                        )}
                      >
                        {request.transaction_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                      <span className={cn(NUM, 'text-[11px] text-stone-500 truncate')}>
                        {request.sender_phone} ({request.payment_method})
                      </span>
                    </div>
                  </div>
                </div>

                <ActionButtons request={request} full />
              </div>
            ))
          )}
        </div>

        {/* Desktop: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/[0.07]">
                {['Learner', 'Plan', 'Transaction', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={cn(MICRO, 'px-4 py-3 text-stone-500 dark:text-stone-400 font-bold')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-20 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-stone-500 dark:text-stone-400" />
                    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      Loading payments
                    </span>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-20 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-3 text-stone-300 dark:text-stone-600" />
                    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                      No payment requests found
                    </span>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/6 grid place-items-center text-stone-500 dark:text-stone-400 shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                            {request.user?.full_name || 'Unknown user'}
                          </p>
                          <p
                            className={cn(
                              MICRO,
                              'text-stone-500 dark:text-stone-400 truncate mt-0.5'
                            )}
                          >
                            {request.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn(NUM, 'text-sm font-bold text-stone-900 dark:text-stone-50')}>
                        {request.currency} {request.amount}
                      </p>
                      <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                        {request.tier} · {request.interval}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                        <span className={cn(NUM, 'text-[11px] text-stone-700 dark:text-stone-200')}>
                          {request.transaction_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
                        <span className={cn(NUM, 'text-[11px] text-stone-500')}>
                          {request.sender_phone} ({request.payment_method})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={request.status} />
                      <div
                        className={cn(
                          MICRO,
                          'flex items-center gap-1 text-stone-500 dark:text-stone-400 mt-1.5'
                        )}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionButtons request={request} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </m.div>

      {hasMore && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          <AdminButton
            variant="outline"
            onClick={loadMore}
            loading={busy}
            className="w-full sm:w-auto shrink-0"
          >
            Load older payments
          </AdminButton>
          <p className="text-xs text-stone-500">
            Search includes all manual records and loaded Stripe history. Load older payments to
            search further back in Stripe.
          </p>
        </div>
      )}
      <m.div variants={FADE_UP}>
        <NagadOrdersPanel />
      </m.div>
      <m.div variants={FADE_UP}>
        <RefundLedgerPanel onOpenCustomer={setBillingUserId} refreshKey={ledgerKey} />
      </m.div>

      <CustomerBillingSheet
        userId={billingUserId}
        open={Boolean(billingUserId)}
        onOpenChange={(next) => !next && setBillingUserId(null)}
        onChanged={() => {
          setLedgerKey((key) => key + 1);
          refreshManual();
          refreshStripe();
        }}
      />
    </m.div>
  );
}
