import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
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
import { matchesPaymentSearch, mergePaymentHistory } from './paymentHistory';
import { NUM, MICRO, PANEL, Kpi, AdminPageHeader } from './ui/primitives';

const STATUS_PILL = {
  pending:
    'text-[rgb(var(--signal-warn))] border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.08)]',
  approved:
    'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.08)]',
  rejected:
    'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.08)]',
};

const StatusPill = ({ status }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md border px-1.5 py-0.5 shrink-0',
      MICRO,
      STATUS_PILL[status] || STATUS_PILL.pending
    )}
  >
    {status}
  </span>
);

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function PaymentManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_requests')
        .select(
          `
          *,
          user:users!payment_requests_auth_id_fkey (
            full_name,
            email,
            id
          )
        `
        )
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const [{ data, error }, { data: stripeData, error: stripeError }] = await Promise.all([
        query,
        supabase.functions.invoke('admin-payment-history', { method: 'GET' }),
      ]);

      if (error) throw error;

      if (stripeError) {
        // Manual payments are still useful when Stripe history is temporarily unavailable.
        console.error('Error fetching Stripe payment history:', stripeError);
        toast.error('Stripe payment history is temporarily unavailable');
      }

      const paymentHistory = mergePaymentHistory(data || [], stripeData?.payments || []);
      setRequests(
        filter === 'all'
          ? paymentHistory
          : paymentHistory.filter((payment) => payment.status === filter)
      );
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

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

      await fetchRequests();
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
      oldestHours: pending.length ? Math.round((Date.now() - oldest) / 3600000) : 0,
    };
  }, [requests]);

  const ActionButtons = ({ request, full = false }) =>
    request.status === 'pending' ? (
      <div className={cn('flex items-center gap-2', full && 'pt-1')}>
        <button
          disabled={isProcessing === request.id}
          onClick={() => handleStatusUpdate(request, 'approved')}
          className={cn(
            MICRO,
            'inline-flex items-center justify-center gap-1.5 rounded-md text-white bg-[rgb(var(--signal-ok))] hover:opacity-90 transition-opacity disabled:opacity-40',
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
          disabled={isProcessing === request.id}
          onClick={() => handleStatusUpdate(request, 'rejected')}
          className={cn(
            MICRO,
            'inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40',
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
    ) : (
      <span
        className={cn(MICRO, 'inline-flex items-center gap-1 text-stone-500 dark:text-stone-400')}
      >
        <CheckCircle2 className="w-3 h-3" />
        Processed
      </span>
    );

  return (
    <div className="space-y-4 pb-10 pt-12 md:pt-0">
      <AdminPageHeader
        title="Payments"
        description="Review and approve manual subscription payments"
        tip="Manual bKash/Nagad transfers land here as pending requests. Approving one triggers the database rule that upgrades the learner's plan — until you do, they have paid but are still on the free tier."
      >
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
          <Input
            placeholder="Search TrxID, phone, user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-full rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium"
          />
        </div>
      </AdminPageHeader>

      {/* Queue state */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Awaiting review"
          value={stats.pending}
          sub={stats.pending ? `oldest ${stats.oldestHours}h ago` : 'queue is clear'}
          tip="Payments a learner has submitted but nobody has approved yet. Every hour here is a paying user stuck on the free tier."
        />
        <Kpi label="Approved" value={stats.approved} sub="upgrades applied" />
        <Kpi label="Rejected" value={stats.rejected} sub="declined transfers" />
        <Kpi label="Total records" value={requests.length} sub="manual + Stripe" />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              MICRO,
              'rounded-md px-2.5 py-1.5 border transition-colors',
              filter === f.value
                ? 'border-stone-400 dark:border-white/30 text-stone-900 dark:text-stone-50 bg-stone-100 dark:bg-white/[0.06]'
                : 'border-stone-200 dark:border-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={cn(PANEL, 'overflow-hidden')}>
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-stone-100 dark:divide-white/[0.05]">
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
              <div key={request.id} className="p-4 space-y-3 relative">
                {request.status === 'pending' && (
                  <span className="absolute left-0 top-0 h-full w-[2px] bg-[rgb(var(--signal-warn))]" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center text-stone-500 dark:text-stone-400 shrink-0">
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

                <div className="rounded-lg bg-stone-50 dark:bg-white/[0.03] border border-stone-200/70 dark:border-white/[0.06] p-2.5 space-y-2">
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
                  <div className="pt-1.5 border-t border-stone-200/60 dark:border-white/[0.05] space-y-1">
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
            <tbody className="divide-y divide-stone-100 dark:divide-white/[0.05]">
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
                    className="hover:bg-stone-50/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center text-stone-500 dark:text-stone-400 shrink-0">
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
      </div>
    </div>
  );
}
