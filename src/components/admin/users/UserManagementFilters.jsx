import * as React from 'react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Clock, CreditCard, Mail, Search, Shield, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL } from '../ui/primitives';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const FilterSelect = ({ value, onValueChange, icon: Icon, placeholder, children }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
      <Icon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 mr-1.5 shrink-0" />
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>{children}</SelectContent>
  </Select>
);

export const ThemedDatePicker = ({ value, onChange, placeholder = 'Select date' }) => {
  const [open, setOpen] = React.useState(false);

  let dateObj = undefined;
  if (value) {
    try {
      const parts = value.split('-');
      if (parts.length === 3) {
        dateObj = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      }
    } catch (e) {
      dateObj = undefined;
    }
  }

  const handleSelect = (selectedDate) => {
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${yyyy}-${mm}-${dd}`);
    } else {
      onChange('');
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            FIELD_INPUT,
            'h-8 px-2.5 min-w-[150px] inline-flex items-center justify-between gap-2 text-stone-800 dark:text-stone-100 hover:border-stone-400 dark:hover:border-white/30 transition-colors'
          )}
        >
          <span
            className={cn(
              'truncate text-[11px]',
              !value && 'text-stone-400 dark:text-stone-500 font-normal'
            )}
          >
            {dateObj ? format(dateObj, 'MMM d, yyyy') : placeholder}
          </span>
          <Calendar className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-100 shadow-2xl rounded-xl"
        align="start"
      >
        <CalendarComponent
          mode="single"
          selected={dateObj}
          onSelect={handleSelect}
          initialFocus
          className="rounded-xl border-0 p-3"
        />
        {value && (
          <div className="p-2 border-t border-stone-100 dark:border-white/5 flex justify-end">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className={cn(
                MICRO,
                'px-2 py-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5'
              )}
            >
              Clear date
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

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
  const isCustomRange = filters.dateRange === 'custom';

  return (
    <div className={cn(PANEL, 'p-3.5 space-y-3')}>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
          <Input
            placeholder="Search name or email…"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            className={cn(FIELD_INPUT, 'pl-8 w-full')}
          />
        </div>

        {/* Date Range Preset */}
        <div className="w-[190px] shrink-0">
          <FilterSelect
            value={filters.dateRange || 'all'}
            onValueChange={(value) => updateFilter('dateRange', value)}
            icon={Calendar}
            placeholder="Date range"
          >
            <SelectItem value="all">All dates</SelectItem>
            <SelectItem value="today">Joined today</SelectItem>
            <SelectItem value="7d">Joined last 7 days</SelectItem>
            <SelectItem value="30d">Joined last 30 days</SelectItem>
            <SelectItem value="this_month">Joined this month</SelectItem>
            <SelectItem value="last_month">Joined last month</SelectItem>
            <SelectItem value="custom">Custom date range…</SelectItem>
          </FilterSelect>
        </div>

        {/* Plan Filter */}
        <div className="w-[130px] shrink-0">
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

        {/* Renewal Filter */}
        <div className="w-[150px] shrink-0">
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

        {/* Role Filter */}
        <div className="w-[120px] shrink-0">
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

        {/* Activity Filter */}
        <div className="w-[140px] shrink-0">
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

        {/* Clear Filters Button */}
        <button
          onClick={onReset}
          className={cn(
            MICRO,
            'h-9 px-3 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 shrink-0 ml-auto'
          )}
        >
          Clear filters
        </button>
      </div>

      {/* Custom Date Range Controls */}
      {isCustomRange && (
        <div className="flex flex-wrap items-center gap-3.5 pt-2.5 border-t border-stone-200/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Filter Field:</span>
            <Select
              value={filters.dateField || 'created_at'}
              onValueChange={(val) => updateFilter('dateField', val)}
            >
              <SelectTrigger className={cn(FIELD_INPUT, 'h-8 text-[11px] w-[145px] px-2.5')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Joined Date</SelectItem>
                <SelectItem value="last_active">Last Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>From:</span>
              <ThemedDatePicker
                value={filters.startDate || ''}
                onChange={(val) => updateFilter('startDate', val)}
                placeholder="Start date"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>To:</span>
              <ThemedDatePicker
                value={filters.endDate || ''}
                onChange={(val) => updateFilter('endDate', val)}
                placeholder="End date"
              />
            </div>
          </div>
        </div>
      )}

      <SelectionActions
        count={selectedCount}
        loading={loading}
        onWarn={onWarnSelected}
        onDelete={onDeleteSelected}
      />
    </div>
  );
};
