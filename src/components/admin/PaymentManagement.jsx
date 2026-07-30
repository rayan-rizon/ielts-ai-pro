import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ExternalLink,
  Phone,
  Hash,
  Clock,
  User,
  MoreVertical,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { matchesPaymentSearch, mergePaymentHistory } from './paymentHistory';

export default function PaymentManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(null); // ID of request being processed

  useEffect(() => {
    fetchRequests();
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

      // Update the payment request status
      // The DB trigger `handle_payment_approval` automatically upgrades
      // the user's subscription_tier when status changes to 'approved'
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

  return (
    <div className="space-y-6 pb-10 pt-12 md:pt-0" data-oid="66djezk">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
        data-oid="hhg.nt6"
      >
        <div className="space-y-0.5 min-w-0" data-oid="ktp:fpz">
          <h2
            className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5"
            data-oid="u5k8:w-"
          >
            <div
              className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs shrink-0"
              data-oid="3a1l_ft"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" data-oid="8k80j1w" />
            </div>
            <span className="truncate">Payment Requests</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400"
            data-oid="60q36qc"
          >
            Review and approve manual subscription payments
          </p>
        </div>

        <div
          className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
          data-oid="ak9jwuz"
        >
          <div className="relative flex-1 sm:flex-initial w-full sm:w-64" data-oid="7i3m2z0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              data-oid="7kg-h.:"
            />

            <Input
              placeholder="Search TrxID, Phone, User..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 w-full bg-white dark:bg-slate-900 border-slate-200/90 dark:border-white/10 rounded-xl text-xs font-medium"
              data-oid="upereuz"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 px-3 pr-8 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
            data-oid="9sv59ch"
          >
            <option value="all" data-oid="xs0kyxv">
              All Requests
            </option>
            <option value="pending" data-oid="wvgrwd8">
              Pending
            </option>
            <option value="approved" data-oid="prm-2l.">
              Approved
            </option>
            <option value="rejected" data-oid="ykz1aqw">
              Rejected
            </option>
          </select>
        </div>
      </div>

      <div
        className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden shadow-2xs"
        data-oid="zki:.j."
      >
        {/* Mobile View: Card List */}
        <div
          className="md:hidden divide-y divide-slate-100 dark:divide-white/5"
          data-oid="mobile-payment-list"
        >
          {loading ? (
            <div className="p-12 text-center text-slate-500" data-oid="mob-loading">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
              <p className="text-xs font-bold">Loading payment requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-500" data-oid="mob-empty">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-xs font-bold">No payment requests found</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="p-4 space-y-3" data-oid={`mob-req-${request.id}`}>
                {/* Header: User Info & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {request.user?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{request.user?.email}</p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'rounded-full px-2.5 py-0.5 border-none font-bold uppercase text-[9px] shrink-0',
                      request.status === 'pending' &&
                        'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
                      request.status === 'approved' &&
                        'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
                      request.status === 'rejected' &&
                        'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    )}
                  >
                    {request.status}
                  </Badge>
                </div>

                {/* Plan & Transaction details */}
                <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        className={cn(
                          'uppercase text-[9px] px-1.5 py-0.2',
                          request.tier === 'premium'
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-none'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none'
                        )}
                      >
                        {request.tier}
                      </Badge>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {request.currency} {request.amount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal uppercase">
                        ({request.interval})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-xs pt-1 border-t border-slate-200/40 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold uppercase truncate">{request.transaction_id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {request.sender_phone} ({request.payment_method})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                {request.status === 'pending' ? (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={isProcessing === request.id}
                      onClick={() => handleStatusUpdate(request, 'approved')}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white h-9 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Approve Payment</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isProcessing === request.id}
                      onClick={() => handleStatusUpdate(request, 'rejected')}
                      className="flex-1 h-9 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                    >
                      {isProcessing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end text-xs text-slate-400 font-medium pt-1 gap-1">
                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                    <span>Processed</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div
          className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          data-oid="hgd1hrt"
        >
          <table className="w-full min-w-[750px] text-left border-collapse" data-oid="he0.xbq">
            <thead data-oid="qq3nc7e">
              <tr
                className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5"
                data-oid="bjf8igo"
              >
                <th
                  className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest"
                  data-oid="k5vso_4"
                >
                  User Details
                </th>
                <th
                  className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest"
                  data-oid="qhsvn6o"
                >
                  Plan & Amount
                </th>
                <th
                  className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest"
                  data-oid="mw3xsh-"
                >
                  Payment Info
                </th>
                <th
                  className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest"
                  data-oid="uupxies"
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-widest"
                  data-oid="hgd0lkg"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5" data-oid="mmnwpgf">
              {loading ? (
                <tr data-oid="htu4dgm">
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-slate-500"
                    data-oid="xgh29dh"
                  >
                    <Loader2
                      className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-500"
                      data-oid="23.y6tf"
                    />
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr data-oid="io.:g33">
                  <td
                    colSpan="5"
                    className="px-6 py-20 text-center text-slate-500"
                    data-oid="2aw:wk-"
                  >
                    <AlertCircle className="w-10 h-10 mx-auto mb-4 opacity-20" data-oid=":vudw94" />
                    No payment requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                    data-oid="u5_1kuh"
                  >
                    <td className="px-6 py-4" data-oid="1tgvzd6">
                      <div className="flex items-center gap-3" data-oid="j4rpn6g">
                        <div
                          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"
                          data-oid="g.1z0ys"
                        >
                          <User className="w-5 h-5" data-oid="o0o0nz8" />
                        </div>
                        <div data-oid="dmixn2l">
                          <p
                            className="font-bold text-slate-900 dark:text-white leading-none mb-1"
                            data-oid="nx:olko"
                          >
                            {request.user?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-slate-500" data-oid="q.u5k0j">
                            {request.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" data-oid="0w8_-ul">
                      <div className="space-y-1" data-oid="crw5nrl">
                        <div
                          className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"
                          data-oid="4g75k0s"
                        >
                          <Badge
                            className={cn(
                              'uppercase text-[10px]',
                              request.tier === 'premium'
                                ? 'bg-violet-500/10 text-violet-600 border-none'
                                : 'bg-indigo-500/10 text-indigo-600 border-none'
                            )}
                            data-oid="_uzemtu"
                          >
                            {request.tier}
                          </Badge>
                          <span data-oid="e.zpko7">
                            {request.currency} {request.amount}
                          </span>
                        </div>
                        <p
                          className="text-[10px] text-slate-500 font-bold uppercase tracking-widest"
                          data-oid="cgmx0pc"
                        >
                          {request.interval}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono" data-oid="wuaycwh">
                      <div className="space-y-1" data-oid="cy_hf60">
                        <div className="flex items-center gap-2 text-sm" data-oid="l7kyy_1">
                          <Hash className="w-3.5 h-3.5 text-slate-400" data-oid="3v4n-9z" />
                          <span
                            className="font-bold text-slate-700 dark:text-slate-300 uppercase"
                            data-oid="3a8s-bn"
                          >
                            {request.transaction_id}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-xs text-slate-500"
                          data-oid="h3:7tnp"
                        >
                          <Phone className="w-3 h-3 text-slate-400" data-oid="h98:cfe" />
                          <span data-oid="ywj9td1">
                            {request.sender_phone} ({request.payment_method})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4" data-oid="ab5-9wo">
                      <Badge
                        className={cn(
                          'rounded-full px-3 py-1 border-none font-bold uppercase text-[9px]',
                          request.status === 'pending' && 'bg-amber-100 text-amber-600',
                          request.status === 'approved' && 'bg-emerald-100 text-emerald-600',
                          request.status === 'rejected' && 'bg-rose-100 text-rose-600'
                        )}
                        data-oid="uy18ozy"
                      >
                        {request.status}
                      </Badge>
                      <div
                        className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 font-bold"
                        data-oid="acl-39j"
                      >
                        <Clock className="w-3 h-3" data-oid=".r8t2wa" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4" data-oid="x_t.cn2">
                      <div className="flex items-center gap-2" data-oid="4y_nz9g">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              disabled={isProcessing === request.id}
                              onClick={() => handleStatusUpdate(request, 'approved')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 w-8 p-0 rounded-lg shadow-lg shadow-emerald-500/20"
                              data-oid="7iwchgm"
                            >
                              {isProcessing === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" data-oid="fi4sq0z" />
                              ) : (
                                <Check className="w-4 h-4" data-oid="8fhl.ig" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isProcessing === request.id}
                              onClick={() => handleStatusUpdate(request, 'rejected')}
                              className="h-8 w-8 p-0 rounded-lg shadow-lg shadow-rose-500/20"
                              data-oid="frq_rw."
                            >
                              {isProcessing === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" data-oid="q93niw_" />
                              ) : (
                                <X className="w-4 h-4" data-oid="ff7i0hd" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <div className="text-slate-300 dark:text-slate-700" data-oid="u7-meu.">
                            <CheckCircle2 className="w-5 h-5" data-oid="3g.b:oa" />
                          </div>
                        )}
                      </div>
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
