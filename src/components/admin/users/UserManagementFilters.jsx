import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, CreditCard, Mail, Search, Shield, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL } from '../ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const FilterSelect = ({ value, onValueChange, icon: Icon, placeholder, children }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
      <Icon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 mr-1.5" />
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
);

const SelectionActions = ({ count, loading, onWarn, onDelete }) => {
  if (count === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[rgb(var(--signal-warn)/0.08)] border border-[rgb(var(--signal-warn)/0.3)]">
      <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
        {count} user{count > 1 ? 's' : ''} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onWarn}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-warn)/0.3)] text-[rgb(var(--signal-warn))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-warn)/0.08)] transition-colors'
          )}
        >
          <Mail className="w-3 h-3" /> Send warning
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className={cn(
            MICRO,
            'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-fault)/0.3)] text-[rgb(var(--signal-fault))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors disabled:opacity-50'
          )}
        >
          <Trash2 className="w-3 h-3" /> Delete selected
        </button>
      </div>
    </div>
  );
};

export const UserManagementFilters = ({
  filters,
  onFiltersChange,
  onReset,
  selectedCount,
  loading,
  onWarnSelected,
  onDeleteSelected,
}) => {
  const updateFilter = (field, value) => onFiltersChange({ ...filters, [field]: value });
  return (
    <div className={cn(PANEL, 'p-3.5 space-y-3')}>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        <div className="min-[480px]:col-span-2 lg:col-span-4 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
          <Input
            placeholder="Search name or email…"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            className={cn(FIELD_INPUT, 'pl-8 w-full')}
          />
        </div>
        <div className="min-[480px]:col-span-1 lg:col-span-2">
          <FilterSelect
            value={filters.subscription}
            onValueChange={(value) => updateFilter('subscription', value)}
            icon={CreditCard}
            placeholder="Plan"
          >
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </FilterSelect>
        </div>
        <div className="min-[480px]:col-span-1 lg:col-span-2">
          <FilterSelect
            value={filters.subscriptionStatus}
            onValueChange={(value) => updateFilter('subscriptionStatus', value)}
            icon={CreditCard}
            placeholder="Renewal"
          >
            <SelectItem value="all">All renewals</SelectItem>
            <SelectItem value="cancelling">Cancelling at period end</SelectItem>
            <SelectItem value="expiring">Expiring within 7 days</SelectItem>
          </FilterSelect>
        </div>
        <div className="min-[480px]:col-span-1 lg:col-span-2">
          <FilterSelect
            value={filters.role}
            onValueChange={(value) => updateFilter('role', value)}
            icon={Shield}
            placeholder="Role"
          >
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </FilterSelect>
        </div>
        <div className="min-[480px]:col-span-1 lg:col-span-2">
          <FilterSelect
            value={filters.inactiveDays}
            onValueChange={(value) => updateFilter('inactiveDays', value)}
            icon={Clock}
            placeholder="Activity"
          >
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="30">Inactive 30+ days</SelectItem>
            <SelectItem value="60">Inactive 60+ days</SelectItem>
            <SelectItem value="90">Inactive 90+ days</SelectItem>
            <SelectItem value="180">Inactive 180+ days</SelectItem>
            <SelectItem value="365">Inactive 1+ year</SelectItem>
          </FilterSelect>
        </div>
        <div className="min-[480px]:col-span-1 lg:col-span-2 flex justify-end">
          <button
            onClick={onReset}
            className={cn(
              MICRO,
              'h-9 px-3 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            )}
          >
            Clear filters
          </button>
        </div>
      </div>
      <SelectionActions
        count={selectedCount}
        loading={loading}
        onWarn={onWarnSelected}
        onDelete={onDeleteSelected}
      />
    </div>
  );
};
