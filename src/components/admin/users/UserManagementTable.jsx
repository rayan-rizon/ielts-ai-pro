import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  Edit,
  Mail,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import PaginationControls from '../shared/PaginationControls';
import { SignupSourceCell } from '../shared/signupChannel';
import { NUM, MICRO, PANEL, Tip } from '../ui/primitives';
import { countryName, countryFlag, normalizeCountryCode } from '../shared/country';

const COLUMNS = [
  { field: 'full_name', label: 'User' },
  { field: 'email', label: 'Email' },
  { field: 'country', label: 'Country' },
  { field: 'signup_channel', label: 'Source' },
  { field: 'subscription_tier', label: 'Plan' },
  { field: 'role', label: 'Role' },
  { field: 'last_active', label: 'Last active' },
];

const CountryCell = ({ country }) => {
  const code = normalizeCountryCode(country);
  if (code === 'unknown') {
    return <span className={cn(MICRO, 'text-stone-400 dark:text-stone-500 font-normal')}>—</span>;
  }

  const name = countryName(code);
  const flag = countryFlag(code);

  return (
    <Tip content={`${name} (${code})`}>
      <span
        aria-label={`${name} (${code})`}
        className="inline-flex min-w-0 items-center gap-1.5 cursor-default"
      >
        {flag ? (
          <span
            className="inline-grid h-5 w-5 shrink-0 place-items-center text-sm leading-none select-none rounded bg-stone-100 dark:bg-white/[0.06] ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            aria-hidden="true"
          >
            {flag}
          </span>
        ) : (
          <span
            className={cn(
              NUM,
              'inline-grid h-5 min-w-[20px] px-1 shrink-0 place-items-center text-[9px] font-bold text-stone-600 dark:text-stone-300 rounded bg-stone-100 dark:bg-white/[0.06] ring-1 ring-black/[0.04] dark:ring-white/[0.06]'
            )}
            aria-hidden="true"
          >
            {code}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[11px] font-extrabold text-stone-900 dark:text-stone-50 leading-tight truncate max-w-[120px]">
            {name}
          </span>
          <span
            className={cn(
              NUM,
              MICRO,
              'text-[10px] text-stone-500 dark:text-stone-400 leading-tight block'
            )}
          >
            {code}
          </span>
        </span>
      </span>
    </Tip>
  );
};

const TIER_PILL = {
  premium:
    'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/6',
  pro: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
  free: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/4',
};

const ROLE_PILL = {
  admin:
    'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)]',
  user: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/4',
};

const relativeTime = (dateValue) => {
  if (!dateValue) return null;
  const days = Math.floor((Date.now() - new Date(dateValue)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const SortIcon = ({ active, direction }) => {
  if (!active) return <ChevronsUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60" />;
  return direction === 'asc' ? (
    <ChevronUp className="w-2.5 h-2.5" />
  ) : (
    <ChevronDown className="w-2.5 h-2.5" />
  );
};

const UserRow = ({ user, selected, onToggle, onEdit, onDelete }) => {
  const tier = user.subscription_tier || 'free';
  const role = user.role || 'user';
  return (
    <tr
      className={cn(
        'animate-panel-in border-b border-stone-100 dark:border-white/5 hover:bg-stone-50/70 dark:hover:bg-white/2 transition-colors last:border-0',
        selected && 'bg-stone-50 dark:bg-white/2'
      )}
    >
      <td className="py-3 px-4">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/6 grid place-items-center text-[10px] font-black text-stone-500 dark:text-stone-300 shrink-0">
            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
              {user.full_name || 'Anonymous user'}
            </p>
            <p className={cn(NUM, 'text-[10px] text-stone-500 dark:text-stone-400')}>
              {user.id.slice(0, 8)}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-300">
          <Mail className="w-3 h-3 text-stone-500 dark:text-stone-400 shrink-0" />
          <span className={cn(NUM, 'truncate')}>{user.email}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <CountryCell country={user.country} />
      </td>
      <td className="py-3 px-4">
        <SignupSourceCell
          channel={user.signup_channel}
          source={user.signup_utm_source}
          campaign={user.signup_utm_campaign}
        />
      </td>
      <td className="py-3 px-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 capitalize',
            MICRO,
            TIER_PILL[tier] || TIER_PILL.free
          )}
        >
          {tier === 'premium' && <Sparkles className="w-2.5 h-2.5" />}
          {tier}
        </span>
      </td>
      <td className="py-3 px-4">
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-1.5 py-0.5 capitalize',
            MICRO,
            ROLE_PILL[role] || ROLE_PILL.user
          )}
        >
          {role}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className={cn(NUM, 'flex items-center gap-1 text-[10px] text-stone-500')}>
          <Clock className="w-2.5 h-2.5 text-stone-500 dark:text-stone-400 shrink-0" />
          {user.last_active ? (
            relativeTime(user.last_active)
          ) : (
            <span className="text-[rgb(var(--signal-warn))] font-bold">Never</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex justify-end items-center gap-1">
          <button
            onClick={onEdit}
            aria-label={`Edit ${user.full_name || user.email}`}
            className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete ${user.full_name || user.email}`}
            className="h-7 w-7 grid place-items-center rounded-md text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const TableBody = ({
  users,
  loading,
  selectedUsers,
  onToggleUser,
  onEditUser,
  onDeleteUser,
  onReset,
}) => {
  if (loading && users.length === 0) {
    return Array.from({ length: 6 }).map((_, index) => (
      <tr key={index} className="border-b border-stone-100 dark:border-white/5">
        <td colSpan={9} className="py-3.5 px-4">
          <div className="h-4 w-full max-w-xs bg-stone-100 dark:bg-white/5 rounded animate-pulse" />
        </td>
      </tr>
    ));
  }
  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={9} className="py-16 text-center">
          <Search className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
          <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
            No users match your filters
          </p>
          <button
            onClick={onReset}
            className={cn(
              MICRO,
              'mt-2 text-stone-600 dark:text-stone-300 underline underline-offset-2'
            )}
          >
            Reset filters
          </button>
        </td>
      </tr>
    );
  }
  return users.map((user) => (
    <UserRow
      key={user.id}
      user={user}
      selected={selectedUsers.has(user.id)}
      onToggle={() => onToggleUser(user.id)}
      onEdit={() => onEditUser(user)}
      onDelete={() => onDeleteUser(user)}
    />
  ));
};

export const UserManagementTable = ({
  users,
  loading,
  selectedUsers,
  selectAll,
  onToggleAll,
  onToggleUser,
  sortField,
  sortDirection,
  onSort,
  onEditUser,
  onDeleteUser,
  onReset,
  pagination,
}) => (
  <div className={cn(PANEL, 'overflow-hidden')}>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200 dark:border-white/[0.07]">
            <th className="py-2.5 px-4 w-10">
              <Checkbox checked={selectAll} onCheckedChange={onToggleAll} />
            </th>
            {COLUMNS.map(({ field, label }) => (
              <th
                key={field}
                onClick={() => onSort(field)}
                className={cn(
                  MICRO,
                  'py-2.5 px-4 cursor-pointer select-none transition-colors group',
                  sortField === field
                    ? 'text-stone-900 dark:text-stone-50'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  <SortIcon active={sortField === field} direction={sortDirection} />
                </span>
              </th>
            ))}
            <th className={cn(MICRO, 'py-2.5 px-4 text-stone-500 dark:text-stone-400 text-right')}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <TableBody
            users={users}
            loading={loading}
            selectedUsers={selectedUsers}
            onToggleUser={onToggleUser}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
            onReset={onReset}
          />
        </tbody>
      </table>
    </div>
    <div className="px-4 py-3 border-t border-stone-100 dark:border-white/6">
      <PaginationControls {...pagination} itemName="users" />
    </div>
  </div>
);
