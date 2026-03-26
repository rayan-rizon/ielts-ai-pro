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
import { cn } from '@/lib/utils';

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

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
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

  const filteredRequests = requests.filter(
    (req) =>
      req.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      req.sender_phone.includes(search) ||
      req.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      req.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-oid="66djezk">
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        data-oid="hhg.nt6"
      >
        <div data-oid="ktp:fpz">
          <h2
            className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2"
            data-oid="u5k8:w-"
          >
            <CreditCard className="w-7 h-7 text-indigo-500" data-oid="8k80j1w" />
            Payment Requests
          </h2>
          <p className="text-slate-500 text-sm mt-1" data-oid="60q36qc">
            Review and approve manual subscription payments
          </p>
        </div>

        <div className="flex items-center gap-3" data-oid="ak9jwuz">
          <div className="relative" data-oid="7i3m2z0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              data-oid="7kg-h.:"
            />

            <Input
              placeholder="Search TrxID, Phone, User..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10"
              data-oid="upereuz"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 px-3 pr-8 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
        data-oid="zki:.j."
      >
        <div className="overflow-x-auto" data-oid="hgd1hrt">
          <table className="w-full text-left border-collapse" data-oid="he0.xbq">
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
