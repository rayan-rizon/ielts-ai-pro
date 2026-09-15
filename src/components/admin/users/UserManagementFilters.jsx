import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Calendar, Clock, CreditCard, Mail, Radio, Search, Shield, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL } from '../ui/primitives';
import { SIGNUP_CHANNELS, SIGNUP_CHANNEL_KEYS } from '../shared/signupChannel';

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const FilterSelect = ({ value, onValueChange, icon: Icon, placeholder, children }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger
      aria-label={placeholder}
      className={cn(FIELD_INPUT, 'w-full focus-visible:ring-2 focus-visible:ring-[#5a63df]/50')}
    >
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
          aria-label={placeholder}
          className={cn(
            FIELD_INPUT,
            'h-8 px-2.5 w-full sm:w-auto sm:min-w-[140px] inline-flex items-center justify-between gap-2 text-stone-800 dark:text-stone-100 hover:border-stone-400 dark:hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
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
        className="w-auto p-0 border border-stone-200 dark:border-white/10 bg-white dark:bg-[#131315] text-stone-900 dark:text-stone-100 shadow-md rounded-xl"
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
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
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
                  'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-warn)/0.3)] text-[rgb(var(--signal-warn))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-warn)/0.08)] transition-all duration-150 ease-smooth-out active:scale-95'
                )}
              >
                <Mail className="w-3 h-3" /> Send warning
              </button>
              <button
                onClick={onDelete}
                disabled={loading}
                className={cn(
                  MICRO,
                  'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-fault)/0.3)] text-[rgb(var(--signal-fault))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-fault)/0.08)] transition-all duration-150 ease-smooth-out active:scale-95 disabled:opacity-50'
                )}
              >
                <Trash2 className="w-3 h-3" /> Delete selected
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const countActiveFilters = (filters) =>
  [
    Boolean(filters.search && filters.search.trim()),
    filters.dateRange !== 'all',
    filters.channel !== 'all',
    filters.subscription !== 'all',
    filters.subscriptionStatus !== 'all',
    filters.role !== 'all',
    filters.inactiveDays !== 'all',
    Boolean(filters.startDate || filters.endDate),
  ].filter(Boolean).length;

const SearchFilterInput = ({ value, onChange, onClear }) => (
  <div className="relative w-full sm:min-w-[200px] sm:flex-1">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 dark:text-stone-400 pointer-events-none" />
    <Input
      placeholder="Search name or email…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(FIELD_INPUT, 'pl-8 pr-7 w-full')}
    />
    {value && (
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear search"
        className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 grid place-items-center rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 focus-visible:outline-none"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

const FilterDropdowns = ({ filters, updateFilter }) => (
  <div className="grid grid-cols-2 gap-2 w-full sm:contents">
    {/* Date Range Preset */}
    <div className="w-full sm:w-[170px] sm:shrink-0">
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
    <div className="w-full sm:w-[125px] sm:shrink-0">
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

    {/* Acquisition Channel Filter */}
    <div className="w-full sm:w-[155px] sm:shrink-0">
      <FilterSelect
        value={filters.channel || 'all'}
        onValueChange={(value) => updateFilter('channel', value)}
        icon={Radio}
        placeholder="Channel"
      >
        <SelectItem value="all">All channels</SelectItem>
        <SelectItem value="paid">Paid only</SelectItem>
        {SIGNUP_CHANNEL_KEYS.map((key) => (
          <SelectItem key={key} value={key}>
            {SIGNUP_CHANNELS[key].label}
          </SelectItem>
        ))}
      </FilterSelect>
    </div>

    {/* Role Filter */}
    <div className="w-full sm:w-[120px] sm:shrink-0">
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

    {/* Renewal Filter */}
    <div className="w-full sm:w-[150px] sm:shrink-0">
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

    {/* Activity Filter */}
    <div className="w-full sm:w-[140px] sm:shrink-0">
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
  </div>
);

const FilterActionsFooter = ({ activeCount, onReset }) => (
  <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-white/5 w-full sm:border-0 sm:pt-0 sm:w-auto sm:ml-auto">
    <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 sm:hidden')}>
      {activeCount} active filter{activeCount > 1 ? 's' : ''}
    </span>
    <button
      type="button"
      onClick={onReset}
      className={cn(
        MICRO,
        'h-8 px-2.5 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-150 ease-smooth-out active:scale-95 ml-auto'
      )}
    >
      Clear filters
    </button>
  </div>
);

const CustomDateRangeControls = ({ filters, updateFilter }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3.5 pt-2.5 border-t border-stone-200/60 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
    <div className="flex items-center gap-2 shrink-0">
      <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Filter Field:</span>
      <Select
        value={filters.dateField || 'created_at'}
        onValueChange={(val) => updateFilter('dateField', val)}
      >
        <SelectTrigger
          aria-label="Filter Field"
          className={cn(
            FIELD_INPUT,
            'h-8 text-[11px] w-full sm:w-[145px] px-2.5 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Joined Date</SelectItem>
          <SelectItem value="last_active">Last Active</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 sm:inline')}>From:</span>
        <ThemedDatePicker
          value={filters.startDate || ''}
          onChange={(val) => updateFilter('startDate', val)}
          placeholder="Start date"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 sm:inline')}>To:</span>
        <ThemedDatePicker
          value={filters.endDate || ''}
          onChange={(val) => updateFilter('endDate', val)}
          placeholder="End date"
        />
      </div>
    </div>
  </div>
);

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
  const activeCount = countActiveFilters(filters);
  const isCustomRange = filters.dateRange === 'custom';

  return (
    <div className={cn(PANEL, 'p-3 sm:p-3.5 space-y-2.5 sm:space-y-3')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
        <SearchFilterInput
          value={filters.search}
          onChange={(val) => updateFilter('search', val)}
          onClear={() => updateFilter('search', '')}
        />

        <FilterDropdowns filters={filters} updateFilter={updateFilter} />

        {activeCount > 0 && <FilterActionsFooter activeCount={activeCount} onReset={onReset} />}
      </div>

      {isCustomRange && <CustomDateRangeControls filters={filters} updateFilter={updateFilter} />}

      <SelectionActions
        count={selectedCount}
        loading={loading}
        onWarn={onWarnSelected}
        onDelete={onDeleteSelected}
      />
    </div>
  );
};
