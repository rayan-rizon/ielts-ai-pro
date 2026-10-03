import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { RefreshCw, ShieldAlert, CheckCircle2, Copy, DollarSign, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { institutionRequest } from '../services/institutions';
import InstitutionHistory from './InstitutionHistory';
import PricingTable from './PricingTable';
import OperationDialog from './OperationDialog';
import StatusBadge from './StatusBadge';
import OverviewTab from './tabs/OverviewTab';
import StudentsTab from './tabs/StudentsTab';
import SubscriptionTab from './tabs/SubscriptionTab';
import BillingTab from './tabs/BillingTab';
import SettingsTab from './tabs/SettingsTab';
import { TABS, ADMIN_TABS, TAB_LABELS } from './institutionUtils';

// Re-export shared components for backwards compatibility
export { PricingTable } from './PricingTable';
export { InstitutionAdmin } from './InstitutionAdmin';
export { StatusBadge } from './StatusBadge';

function AdminToolbar({ busy, open, act, ownerEmail }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-[#e4e2f0] text-xs font-semibold hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
        onClick={() => open('update', 'Edit institution')}
      >
        Edit institution
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        className="h-8 border-[#e4e2f0] text-xs font-semibold hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
        onClick={() => act('invite_owner', { email: ownerEmail })}
      >
        Invite owner
      </Button>
      <Button
        size="sm"
        className="h-8 bg-[#5a63df] text-white hover:bg-[#4d55c7] active:scale-[0.98] text-xs font-bold shadow-xs cursor-pointer"
        onClick={() => open('grant', 'Grant free seats')}
      >
        <Gift className="mr-1.5 h-3.5 w-3.5" />
        Grant free seats
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-[#e4e2f0] text-xs font-semibold hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
        onClick={() => open('pricing', 'Set institution pricing')}
      >
        <DollarSign className="mr-1.5 h-3.5 w-3.5" />
        Set pricing
      </Button>
    </div>
  );
}

function InviteResultBanner({ result, onDismiss }) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.url);
    toast.success('Link copied');
  };

  return (
    <Card className="p-4 space-y-3 border-[#5a63df]/30 bg-[#5a63df]/5 dark:border-[#8f97ff]/25 dark:bg-[#8f97ff]/[0.06]">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#5a63df] dark:text-[#afb5ff]" />
        <p className="text-xs font-bold text-foreground">
          {result.delivery_error || 'Invitation email sent. You can also share this direct link.'}
        </p>
      </div>
      <div className="flex gap-2">
        <Input aria-label="Invitation link" readOnly value={result.url} className="h-9 text-xs" />
        <Button
          variant="outline"
          size="sm"
          className="border-[#e4e2f0] text-xs hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
          onClick={handleCopy}
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-[#e4e2f0] text-xs hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white cursor-pointer"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  );
}

function TabNavigation({ tabs, activeTab, onTabSelect }) {
  return (
    <nav
      aria-label="Institution sections"
      className="flex flex-wrap gap-1.5 border-b border-[#e4e2f0] dark:border-white/10 pb-3"
    >
      {tabs.map((t) => (
        <Button
          key={t}
          variant="ghost"
          size="sm"
          aria-current={activeTab === t ? 'page' : undefined}
          onClick={() => onTabSelect(t)}
          className={cn(
            'h-8 px-3 text-xs font-semibold transition-all cursor-pointer',
            activeTab === t
              ? 'bg-[#5a63df] text-white hover:bg-[#4d55c7] hover:text-white shadow-xs'
              : 'border border-[#e4e2f0] bg-white text-muted-foreground hover:bg-[#f7f6fd] hover:border-[#5a63df]/40 hover:text-[#5a63df] dark:border-white/10 dark:bg-[#141319] dark:hover:bg-white/5 dark:hover:text-white'
          )}
        >
          {TAB_LABELS[t]}
        </Button>
      ))}
    </nav>
  );
}

function isUsableSeat(s) {
  return !s.allocation_blocked && new Date(s.activation_deadline) > new Date();
}

function computeSeatCounts(seats) {
  const counts = { available: 0, invited: 0, waiting: 0, active: 0 };
  for (const s of seats) {
    if (s.status === 'waiting') {
      counts.waiting += 1;
    } else if (s.status === 'active') {
      counts.active += 1;
    } else if (s.status === 'available' && isUsableSeat(s)) {
      counts.available += 1;
    } else if (s.status === 'invited' && isUsableSeat(s)) {
      counts.invited += 1;
    }
  }
  return counts;
}

function filterStudentSeats(seats, search, filter) {
  const query = search.trim().toLowerCase();
  return seats.filter((s) => {
    if (!s.recipient_email) return false;
    if (filter !== 'all' && s.status !== filter) return false;
    if (!query) return true;
    const combined = `${s.recipient_email} ${s.recipient_name || ''}`.toLowerCase();
    return combined.includes(query);
  });
}

function filterAllocations(orders) {
  const now = new Date();
  return orders.filter(
    (o) => ['paid', 'complimentary'].includes(o.status) && new Date(o.activation_deadline) > now
  );
}

function buildOperationPayload(operation, fields, institutionId) {
  let payload = { ...fields };
  const { action, seat, pricing, order } = operation;
  if (action === 'pricing') {
    payload = {
      ...payload,
      id: pricing?.id,
      institution_id: ['default', 'bulk'].includes(fields.kind) ? null : institutionId,
      enabled: fields.enabled === 'true',
    };
  }
  if (action === 'reconcile_refund') {
    payload = {
      ...payload,
      order_id: order?.id,
      seat_ids: Array.isArray(fields.seat_ids)
        ? fields.seat_ids
        : fields.seat_ids
          ? [fields.seat_ids]
          : [],
    };
  }
  if (seat) {
    payload.seat_id = seat.id;
  }
  return payload;
}

function WorkspaceHeader({ institution, refreshing, busy, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {institution.name}
          </h1>
          <StatusBadge status={institution.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Student subscription access · Currency:{' '}
          <span className="font-mono font-medium text-foreground">{institution.currency}</span> ·
          Owner: <span className="font-medium text-foreground">{institution.owner_email}</span>
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={busy || refreshing}
        aria-label="Refresh institution details"
        className="h-9 font-medium"
      >
        <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', refreshing && 'animate-spin')} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  );
}

function WorkspaceAdminPricingSection({ pricing, onOpenPricing }) {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-primary dark:bg-[#8f97ff]" />
        <h2 className="text-base font-bold text-foreground">Institution pricing</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Custom packages take priority, followed by institution, bulk, and standard rates. Discounts
        do not stack.
      </p>
      <PricingTable
        rules={pricing}
        onEdit={(p) => onOpenPricing('pricing', 'Edit pricing', { pricing: p, kind: p.kind })}
      />
    </Card>
  );
}

function WorkspaceAdminTabContent({ tab, pricing, institutionId, seats, open }) {
  if (tab === 'pricing') {
    return <WorkspaceAdminPricingSection pricing={pricing} onOpenPricing={open} />;
  }
  if (tab === 'history') {
    return <InstitutionHistory key={institutionId} institutionId={institutionId} seats={seats} />;
  }
  return null;
}

function WorkspaceTabContent({
  tab,
  admin,
  data,
  seats,
  counts,
  allocations,
  studentSeats,
  orderId,
  setOrderId,
  open,
  act,
  busy,
  search,
  setSearch,
  filter,
  setFilter,
  csv,
  setCsv,
  importResults,
  setImportResults,
  importCsv,
  purchase,
  setPurchase,
  quote,
  buy,
  checkoutSuccess,
  institutionId,
}) {
  if (admin) {
    const adminTab = WorkspaceAdminTabContent({
      tab,
      pricing: data.pricing,
      institutionId,
      seats,
      open,
    });
    if (adminTab) return adminTab;
  }

  if (tab === 'overview') {
    return <OverviewTab counts={counts} seats={seats} />;
  }

  if (tab === 'students') {
    return (
      <StudentsTab
        institution={data.institution}
        seats={seats}
        allocations={allocations}
        studentSeats={studentSeats}
        orderId={orderId}
        setOrderId={setOrderId}
        open={open}
        act={act}
        busy={busy}
        usable={isUsableSeat}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        csv={csv}
        setCsv={setCsv}
        importResults={importResults}
        setImportResults={setImportResults}
        importCsv={importCsv}
        admin={admin}
      />
    );
  }

  if (tab === 'subscription') {
    return (
      <SubscriptionTab
        institution={data.institution}
        purchase={purchase}
        setPurchase={setPurchase}
        quote={quote}
        buy={buy}
        busy={busy}
      />
    );
  }

  if (tab === 'billing') {
    return (
      <BillingTab
        orders={data.orders}
        seats={seats}
        admin={admin}
        open={open}
        busy={busy}
        checkoutSuccess={checkoutSuccess}
      />
    );
  }

  if (tab === 'settings') {
    return <SettingsTab institution={data.institution} act={act} busy={busy} />;
  }

  return null;
}

export default function InstitutionWorkspace({
  institutionId,
  admin = false,
  standalone = false,
  onInstitutionChanged,
}) {
  const [params, setParams] = useSearchParams();
  const sectionKey = admin ? 'section' : 'tab';
  const tabs = admin ? ADMIN_TABS : TABS;
  const tab = tabs.includes(params.get(sectionKey)) ? params.get(sectionKey) : 'overview';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [operation, setOperation] = useState(null);
  const [inviteResult, setInviteResult] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [csv, setCsv] = useState(null);
  const [importResults, setImportResults] = useState([]);
  const [orderId, setOrderId] = useState('');

  const [purchase, setPurchase] = useState({ tier: 'pro', months: 1, quantity: 10 });
  const [quote, setQuote] = useState(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await institutionRequest('detail', { institution_id: institutionId }));
    } catch (e) {
      setError(e.message);
    }
  }, [institutionId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setError('');
      const updated = await institutionRequest('detail', { institution_id: institutionId });
      setData(updated);
      toast.success('Institution details refreshed');
    } catch (e) {
      setError(e.message);
      toast.error(e.message || 'Failed to refresh institution details');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setData(null);
    setOrderId('');
    setQuote(null);
    setInviteResult(null);
    load();
  }, [load]);

  useEffect(() => {
    setQuote(null);
    setRequestId(crypto.randomUUID());
  }, [purchase, institutionId]);

  const act = async (action, fields = {}) => {
    setBusy(true);
    try {
      const result = await institutionRequest(action, { institution_id: institutionId, ...fields });
      if (result?.url && action.startsWith('invite')) setInviteResult(result);
      toast.success(
        result?.delivery_error ? 'Invitation created; email delivery needs attention' : 'Saved'
      );
      await load();
      onInstitutionChanged?.();
      return result;
    } catch (e) {
      toast.error(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (fields) => {
    const payload = buildOperationPayload(operation, fields, institutionId);
    const result = await act(operation.action, payload);
    if (result) setOperation(null);
  };

  const open = (action, title, extra = {}) =>
    setOperation({ action, title, institution: data?.institution, ...extra });

  const buy = async (checkout) => {
    setBusy(true);
    try {
      const result = await institutionRequest(checkout ? 'checkout' : 'quote', {
        institution_id: institutionId,
        ...purchase,
        request_id: requestId,
      });
      if (checkout) window.location.assign(result.url);
      else setQuote(result);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async () => {
    setBusy(true);
    const results = [];
    const rows = csv.filter((r) => !r.error);
    for (let start = 0; start < rows.length; start += 50) {
      const batch = rows.slice(start, start + 50);
      try {
        const result = await institutionRequest('import', {
          institution_id: institutionId,
          order_id: orderId,
          rows: batch.map(({ email, name }) => ({ email, name })),
        });
        results.push(
          ...result.results.map((r) => ({ ...r, delivery_error: r.error || r.delivery_error }))
        );
      } catch (e) {
        results.push(...batch.map((r) => ({ ...r, delivery_error: e.message })));
      }
      setImportResults([...results]);
    }
    await load();
    setBusy(false);
  };

  if (!data) {
    return (
      <Card className="p-8 space-y-4 text-center" role="status">
        <RefreshCw className="h-6 w-6 animate-spin text-primary dark:text-[#afb5ff] mx-auto" />
        <p className="text-sm font-semibold text-foreground">{error || 'Loading institution…'}</p>
        {error && (
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        )}
      </Card>
    );
  }

  const i = data.institution;
  const seats = data.seats;
  const counts = computeSeatCounts(seats);
  const allocations = filterAllocations(data.orders);
  const studentSeats = filterStudentSeats(seats, search, filter);

  return (
    <div className="min-w-0 space-y-5">
      {error && (
        <Card
          className="p-4 flex items-center justify-between gap-3 text-xs text-destructive border-destructive/30"
          role="alert"
        >
          <span>Could not refresh: {error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </Card>
      )}

      {admin && (
        <Card className="p-4 text-xs border-primary/30 dark:border-[#8f97ff]/25 bg-primary/5 dark:bg-[#8f97ff]/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="text-foreground font-bold">Platform admin management</strong>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Manage the institution, pricing, access, and history here.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={`/institution?institution=${i.id}`}>Open institution panel</Link>
            </Button>
          </div>
        </Card>
      )}

      <WorkspaceHeader
        institution={i}
        refreshing={refreshing}
        busy={busy}
        onRefresh={handleRefresh}
      />

      {admin && <AdminToolbar busy={busy} open={open} act={act} ownerEmail={i.owner_email} />}

      {i.status !== 'active' && (
        <Card className="flex items-start gap-3 border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <span>
            New purchases and invitations are paused. Activated student access continues unless
            admin explicitly revokes it.
          </span>
        </Card>
      )}

      {inviteResult && (
        <InviteResultBanner result={inviteResult} onDismiss={() => setInviteResult(null)} />
      )}

      {!standalone && (
        <TabNavigation
          tabs={tabs}
          activeTab={tab}
          onTabSelect={(selectedTab) =>
            setParams((previous) => {
              const next = new URLSearchParams(previous);
              next.set(sectionKey, selectedTab);
              return next;
            })
          }
        />
      )}

      <WorkspaceTabContent
        tab={tab}
        admin={admin}
        data={data}
        seats={seats}
        counts={counts}
        allocations={allocations}
        studentSeats={studentSeats}
        orderId={orderId}
        setOrderId={setOrderId}
        open={open}
        act={act}
        busy={busy}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        csv={csv}
        setCsv={setCsv}
        importResults={importResults}
        setImportResults={setImportResults}
        importCsv={importCsv}
        purchase={purchase}
        setPurchase={setPurchase}
        quote={quote}
        buy={buy}
        checkoutSuccess={params.get('checkout') === 'success'}
        institutionId={institutionId}
      />

      <OperationDialog
        key={operation?.title}
        operation={operation}
        onClose={() => setOperation(null)}
        onSubmit={(fields) =>
          submit({ ...fields, ...(operation?.action === 'invite' ? { order_id: orderId } : {}) })
        }
        busy={busy}
      />
    </div>
  );
}
