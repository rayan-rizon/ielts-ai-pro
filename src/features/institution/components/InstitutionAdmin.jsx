import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  Mail,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  PANEL,
  MICRO,
  MUTED,
  Kpi,
  AdminPageHeader,
  LiveDot,
  Empty,
  Pill,
} from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { institutionRequest } from '../services/institutions';
import { StatusBadge } from './StatusBadge';
import { PricingTable } from './PricingTable';
import { OperationDialog } from './OperationDialog';
import InstitutionWorkspace from './InstitutionWorkspace';
import InstitutionApplications from './InstitutionApplications';

function InstitutionCard({ institution, onSelect }) {
  const formattedDate = useMemo(() => {
    if (!institution.updated_at) return null;
    const d = new Date(institution.updated_at);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [institution.updated_at]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        PANEL,
        'group relative flex flex-col justify-between p-4 sm:p-4.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs hover:border-[#5a63df]/35 active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]'
      )}
      onClick={() => onSelect(institution.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(institution.id);
        }
      }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#8f97ff]/15 dark:text-[#bfc3ff] transition-transform duration-200 group-hover:scale-105 mt-0.5">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm font-bold text-foreground group-hover:text-[#5a63df] transition-colors leading-tight line-clamp-1"
                title={institution.name}
              >
                {institution.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                <span className="truncate">{institution.owner_email}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 pt-0.5">
            <StatusBadge status={institution.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/[0.07] flex items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          {institution.currency && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200/80 dark:bg-white/5 dark:text-stone-300 dark:border-white/10 shrink-0">
              {institution.currency}
            </span>
          )}
          {formattedDate && (
            <span className={cn(MICRO, MUTED, 'whitespace-nowrap font-normal truncate')}>
              Updated {formattedDate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 font-semibold text-[#5a63df] dark:text-[#bfc3ff] text-xs shrink-0 whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
          <span>Manage</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

function shouldRedirectToRequests(selected, hasViewParam, pendingCount) {
  if (selected) return false;
  if (hasViewParam) return false;
  return Number(pendingCount) > 0;
}

function InstitutionAdminLoading({ error, onRetry }) {
  return (
    <div className={cn(PANEL, 'p-12 space-y-4 text-center')}>
      <RefreshCw className="h-7 w-7 animate-spin text-[#5a63df] mx-auto" />
      <p className="text-sm font-semibold text-foreground">{error || 'Loading institutions…'}</p>
      {error && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs">
          Retry
        </Button>
      )}
    </div>
  );
}

function InstitutionRolloutBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1">
        <span className="font-bold">Rollout gate paused:</span> New institution registrations and
        self-service student onboarding are temporarily restricted.
      </div>
    </div>
  );
}

function InstitutionAdminHeader({ enabled, busy, onTogglePilotGate, onCreateClick }) {
  return (
    <AdminPageHeader
      title="Institutions"
      description="Manage institutional partners, pilot availability, seat grants, and negotiated pricing."
      responsive="xl"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Pill
          tone={enabled ? 'ok' : 'warn'}
          className="h-8 px-2.5 rounded-lg border text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <LiveDot tone={enabled ? 'ok' : 'warn'} />
          <span>{enabled ? 'Operations active' : 'Pilot paused'}</span>
        </Pill>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onTogglePilotGate}
          className="h-8 rounded-lg border-stone-200/80 bg-white px-3 text-xs font-semibold text-stone-700 hover:border-[#5a63df]/40 hover:text-[#5a63df] hover:bg-[#f7f6fd] dark:border-white/10 dark:bg-[#141319] dark:text-stone-300 dark:hover:bg-white/5 transition-all shadow-2xs active:scale-[0.98] cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <LiveDot tone={enabled ? 'ok' : 'warn'} />
          <span>
            {enabled ? 'Disable new institution operations' : 'Enable institution access'}
          </span>
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={onCreateClick}
          className="h-8 px-3.5 bg-[#5a63df] text-white hover:bg-[#4d55c7] text-xs font-bold rounded-lg shadow-xs active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create institution</span>
        </Button>
      </div>
    </AdminPageHeader>
  );
}

function InstitutionAdminStats({
  totalCount,
  activeCount,
  archivedCount,
  pricingRulesCount,
  isEnabled,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Kpi label="Total Partners" value={totalCount} sub="Enrolled institutions" />
      <Kpi
        label="Active Partners"
        value={activeCount}
        sub={archivedCount > 0 ? `${archivedCount} archived` : 'Operational accounts'}
        live={activeCount > 0}
      />
      <Kpi label="Global Pricing" value={pricingRulesCount} sub="Tier & bulk rules" />
      <Kpi
        label="Rollout Status"
        value={isEnabled ? 'Open' : 'Gated'}
        sub={isEnabled ? 'Operations active' : 'New operations blocked'}
      />
    </div>
  );
}

function InstitutionAdminToolbar({
  showRequests,
  totalCount,
  pendingCount,
  search,
  onSearchChange,
  onSelectView,
}) {
  return (
    <div
      className={cn(PANEL, 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5')}
    >
      <nav
        aria-label="Institution administration"
        className="inline-flex items-center gap-1 rounded-lg bg-stone-100/80 dark:bg-white/5 p-1"
      >
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            'h-7 px-3 text-xs font-semibold transition-all cursor-pointer',
            !showRequests
              ? 'bg-white text-stone-900 shadow-xs hover:bg-white hover:text-stone-900 dark:bg-[#1f1e24] dark:text-white dark:hover:bg-[#1f1e24]'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/5'
          )}
          aria-current={!showRequests ? 'page' : undefined}
          onClick={() => onSelectView('partners')}
        >
          <Building2 className="mr-1.5 h-3.5 w-3.5 text-[#5a63df]" />
          Institutions
          <span className="ml-1.5 rounded-full bg-stone-200/80 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-bold">
            {totalCount}
          </span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            'h-7 px-3 text-xs font-semibold transition-all cursor-pointer',
            showRequests
              ? 'bg-white text-stone-900 shadow-xs hover:bg-white hover:text-stone-900 dark:bg-[#1f1e24] dark:text-white dark:hover:bg-[#1f1e24]'
              : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/5'
          )}
          aria-current={showRequests ? 'page' : undefined}
          onClick={() => onSelectView('requests')}
        >
          Institution requests
          {pendingCount !== null && (
            <span
              className="ml-1.5 font-mono tabular-nums"
              aria-label={`${pendingCount} pending requests`}
            >
              {pendingCount}
            </span>
          )}
        </Button>
      </nav>

      {!showRequests && (
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 pr-7 text-xs bg-background/80"
            aria-label="Search institutions"
            placeholder="Search by name, email, currency…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InstitutionPartnersList({ institutions, search, onSelect }) {
  if (institutions.length === 0) {
    return (
      <div className={cn(PANEL, 'p-8 text-center')}>
        <Empty
          icon={Building2}
          title={search ? 'No matching institutions' : 'No institutions yet'}
          message={
            search
              ? `No partner matches "${search}". Try another search term.`
              : 'Create an institution, configure its pricing, and invite the owner.'
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
      {institutions.map((i) => (
        <InstitutionCard key={i.id} institution={i} onSelect={onSelect} />
      ))}
    </div>
  );
}

function InstitutionGlobalPricingSection({ rules, onAddPricing, onEditPricing }) {
  return (
    <div className={cn(PANEL, 'overflow-hidden')}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 p-4">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Default and bulk pricing</h2>
          <p className={cn(MICRO, MUTED, 'mt-0.5 normal-case tracking-normal')}>
            Fallback rates used when an institution does not have negotiated custom rates.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold hover:border-[#5a63df]/40 hover:text-[#5a63df]"
          onClick={onAddPricing}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add pricing
        </Button>
      </div>
      <div className="p-4 sm:p-5">
        <PricingTable rules={rules} onEdit={onEditPricing} />
      </div>
    </div>
  );
}

function matchesInstitutionSearch(institution, query) {
  if (institution.name.toLowerCase().includes(query)) return true;
  if (institution.owner_email.toLowerCase().includes(query)) return true;
  return Boolean(institution.currency && institution.currency.toLowerCase().includes(query));
}

function filterInstitutions(institutions, search) {
  if (!institutions) return [];
  const trimmed = search.trim().toLowerCase();
  if (!trimmed) return institutions;
  return institutions.filter((item) => matchesInstitutionSearch(item, trimmed));
}

function useInstitutionAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(null);
  const [requestsError, setRequestsError] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      const result = await institutionRequest('applications_list', { status: 'pending' });
      setPendingCount(result.pending_count);
      setRequestsError('');
    } catch (e) {
      setRequestsError(e.message);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setData(await institutionRequest('list'));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadRequests();
    const refresh = () => {
      if (document.visibilityState !== 'hidden') {
        loadRequests();
      }
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadRequests]);

  return {
    data,
    error,
    pendingCount,
    setPendingCount,
    requestsError,
    load,
    loadRequests,
  };
}

function useInstitutionMutations(data, load, setParams) {
  const [operation, setOperation] = useState(null);
  const [busy, setBusy] = useState(false);

  const togglePilotGate = async () => {
    setBusy(true);
    try {
      await institutionRequest('enable', {
        enabled: !data?.enabled,
        reason: 'Admin changed institution rollout gate',
      });
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (fields) => {
    setBusy(true);
    try {
      const result = await institutionRequest(operation.action, {
        ...fields,
        institution_id: null,
        id: operation.pricing?.id,
        enabled: fields.enabled === 'true',
      });
      setOperation(null);
      await load();
      if (operation.action === 'create') {
        setParams({ tab: 'institutions', institution: result.id });
      }
      toast.success('Saved');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return {
    operation,
    setOperation,
    busy,
    togglePilotGate,
    submit,
  };
}

function InstitutionSelectedView({ selected, onBack, onInstitutionChanged }) {
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-semibold hover:border-[#5a63df]/40 hover:text-[#5a63df]"
        onClick={onBack}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to institutions
      </Button>
      <InstitutionWorkspace
        key={selected}
        institutionId={selected}
        admin
        onInstitutionChanged={onInstitutionChanged}
      />
    </div>
  );
}

function InstitutionRequestsErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className={cn(PANEL, 'p-3 text-sm')}>
      Could not load institution requests: {error}{' '}
      <button type="button" className="underline" onClick={onRetry}>
        Retry requests
      </button>
    </div>
  );
}

function InstitutionPartnersTab({
  institutions,
  search,
  onSelectInstitution,
  pricingRules,
  onAddPricing,
  onEditPricing,
}) {
  return (
    <>
      <InstitutionPartnersList
        institutions={institutions}
        search={search}
        onSelect={onSelectInstitution}
      />
      <InstitutionGlobalPricingSection
        rules={pricingRules}
        onAddPricing={onAddPricing}
        onEditPricing={onEditPricing}
      />
    </>
  );
}

function computeInstitutionStats(data) {
  const institutions = data?.institutions ?? [];
  let active = 0;
  let archived = 0;
  for (const item of institutions) {
    if (item.status === 'active') {
      active += 1;
    } else if (item.status === 'archived') {
      archived += 1;
    }
  }
  const globalPricingRules = (data?.pricing ?? []).filter((r) => !r.institution_id);
  return {
    totalCount: institutions.length,
    activeCount: active,
    archivedCount: archived,
    globalPricingRules,
  };
}

function InstitutionAdminDashboard({
  data,
  busy,
  togglePilotGate,
  setOperation,
  stats,
  showRequests,
  pendingCount,
  setPendingCount,
  search,
  setSearch,
  setParams,
  requestsError,
  loadRequests,
  load,
  filteredInstitutions,
  operation,
  submit,
}) {
  return (
    <div className="min-w-0 space-y-5">
      <InstitutionAdminHeader
        enabled={data.enabled}
        busy={busy}
        onTogglePilotGate={togglePilotGate}
        onCreateClick={() => setOperation({ action: 'create', title: 'Create institution' })}
      />

      {!data.enabled && <InstitutionRolloutBanner />}

      <InstitutionAdminStats
        totalCount={stats.totalCount}
        activeCount={stats.activeCount}
        archivedCount={stats.archivedCount}
        pricingRulesCount={stats.globalPricingRules.length}
        isEnabled={data.enabled}
      />

      <InstitutionAdminToolbar
        showRequests={showRequests}
        totalCount={stats.totalCount}
        pendingCount={pendingCount}
        search={search}
        onSearchChange={setSearch}
        onSelectView={(view) => setParams({ tab: 'institutions', view })}
      />

      {!showRequests && (
        <InstitutionRequestsErrorBanner error={requestsError} onRetry={loadRequests} />
      )}

      {showRequests ? (
        <InstitutionApplications onApproved={load} onPendingCountChanged={setPendingCount} />
      ) : (
        <InstitutionPartnersTab
          institutions={filteredInstitutions}
          search={search}
          onSelectInstitution={(id) => setParams({ tab: 'institutions', institution: id })}
          pricingRules={stats.globalPricingRules}
          onAddPricing={() =>
            setOperation({
              action: 'pricing',
              title: 'Add default or bulk pricing',
              kind: 'default',
            })
          }
          onEditPricing={(pricing) =>
            setOperation({
              action: 'pricing',
              title: 'Edit global pricing',
              pricing,
              kind: pricing.kind,
            })
          }
        />
      )}

      <OperationDialog
        key={operation?.title}
        operation={operation}
        onClose={() => setOperation(null)}
        onSubmit={submit}
        busy={busy}
      />
    </div>
  );
}

export function InstitutionAdmin() {
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const selected = params.get('institution');
  const showRequests = params.get('view') === 'requests';

  const { data, error, pendingCount, setPendingCount, requestsError, load, loadRequests } =
    useInstitutionAdmin();

  const { operation, setOperation, busy, togglePilotGate, submit } = useInstitutionMutations(
    data,
    load,
    setParams
  );

  useEffect(() => {
    if (shouldRedirectToRequests(selected, params.has('view'), pendingCount)) {
      const next = new URLSearchParams(params);
      next.set('view', 'requests');
      setParams(next, { replace: true });
    }
  }, [selected, params, pendingCount, setParams]);

  const stats = useMemo(() => computeInstitutionStats(data), [data]);

  const filteredInstitutions = useMemo(
    () => filterInstitutions(data?.institutions, search),
    [data?.institutions, search]
  );

  if (!data) {
    return <InstitutionAdminLoading error={error} onRetry={load} />;
  }

  if (selected) {
    return (
      <InstitutionSelectedView
        selected={selected}
        onBack={() => setParams({ tab: 'institutions' })}
        onInstitutionChanged={load}
      />
    );
  }

  return (
    <InstitutionAdminDashboard
      data={data}
      busy={busy}
      togglePilotGate={togglePilotGate}
      setOperation={setOperation}
      stats={stats}
      showRequests={showRequests}
      pendingCount={pendingCount}
      setPendingCount={setPendingCount}
      search={search}
      setSearch={setSearch}
      setParams={setParams}
      requestsError={requestsError}
      loadRequests={loadRequests}
      load={load}
      filteredInstitutions={filteredInstitutions}
      operation={operation}
      submit={submit}
    />
  );
}

export default InstitutionAdmin;
