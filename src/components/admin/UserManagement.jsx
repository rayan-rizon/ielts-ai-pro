import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Clock,
  CreditCard,
  Edit,
  Loader2,
  Lock,
  Mail,
  RefreshCcw,
  Search,
  Send,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { signUpSchema } from '@/lib/validations';
import { User } from '@/entities';
import { supabase } from '@/lib/supabase';
import PaginationControls from './shared/PaginationControls';
import RefinedDeleteModal from './shared/RefinedDeleteModal';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/cn';
import { NUM, MICRO, PANEL, AdminButton, AdminPageHeader } from './ui/primitives';

const relativeTime = (dateStr) => {
  if (!dateStr) return null;
  const diffDays = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

const TIER_PILL = {
  premium:
    'text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-800/60 bg-violet-500/[0.06]',
  pro: 'text-[rgb(var(--signal-ok))] border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)]',
  free: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/[0.04]',
};

const ROLE_PILL = {
  admin:
    'text-[rgb(var(--signal-fault))] border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)]',
  user: 'text-stone-500 border-stone-200 dark:border-white/10 bg-stone-500/[0.04]',
};

const FIELD_INPUT =
  'h-9 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';
const FIELD_LABEL = cn(MICRO, 'text-stone-400 mb-1.5 block');

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    subscription: 'all',
    role: 'all',
    search: '',
    inactiveDays: 'all',
  });

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    subscription_tier: 'free',
    role: 'user',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDays, setWarningDays] = useState(14);
  const [isSendingWarning, setIsSendingWarning] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userFilters.search), 500);
    return () => clearTimeout(timer);
  }, [userFilters.search]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [debouncedSearch, userFilters.subscription, userFilters.role, userFilters.inactiveDays]);

  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const apiFilters = {
        subscription: userFilters.subscription,
        role: userFilters.role,
        search: debouncedSearch,
        inactiveDays: userFilters.inactiveDays,
      };
      const orderBy = sortDirection === 'desc' ? `-${sortField}` : sortField;

      const { data, count } = await User.list({
        orderBy,
        page: currentPage,
        pageSize,
        filters: apiFilters,
      });

      setUsers(data || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    userFilters.subscription,
    userFilters.role,
    userFilters.inactiveDays,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserSelection = (userId) => {
    const next = new Set(selectedUsers);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelectedUsers(next);
    setSelectAll(next.size === users.length && users.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(users.map((u) => u.id)));
    setSelectAll(!selectAll);
  };

  const getSelectedUserObjects = () => users.filter((u) => selectedUsers.has(u.id));

  const handleSendWarning = async () => {
    const selected = getSelectedUserObjects();
    if (selected.length === 0) return toast.error('No users selected');

    try {
      setIsSendingWarning(true);
      const result = await User.sendInactivityWarning(selected, { daysUntilDeletion: warningDays });
      if (result.failed > 0) toast.warning(`${result.sent} emails sent, ${result.failed} failed`);
      else toast.success(`${result.sent} warning emails sent`);
      setShowWarningModal(false);
      setSelectedUsers(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error sending warnings:', error);
      toast.error('Failed to send warning emails', { description: error.message });
    } finally {
      setIsSendingWarning(false);
    }
  };

  const handleBulkDelete = async () => {
    const selected = getSelectedUserObjects();
    if (selected.length === 0) return toast.error('No users selected');

    try {
      setLoading(true);
      const authIds = selected.map((u) => u.auth_id).filter(Boolean);
      const result = await User.adminBulkDeleteUsers(authIds);
      if (result.failed > 0) toast.warning(`${result.deleted} deleted, ${result.failed} failed`);
      else toast.success(`${result.deleted} users deleted`);
      setSelectedUsers(new Set());
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      try {
        signUpSchema.shape.password.parse(newUser.password);
      } catch (e) {
        toast.error(e.errors?.[0]?.message || 'Password is too weak');
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email: newUser.email,
        full_name: newUser.full_name,
        subscription_tier: newUser.subscription_tier,
        role: newUser.role,
      });
      if (profileError) throw profileError;

      fetchUsers();
      setIsCreatingUser(false);
      setNewUser({
        email: '',
        full_name: '',
        subscription_tier: 'free',
        role: 'user',
        password: '',
      });
      toast.success('User created');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setLoading(true);
      await User.adminUpdateUser(userId, updates);
      fetchUsers();
      setEditingUser(null);
      toast.success('User updated');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setLoading(true);
      await User.adminDeleteUser(userToDelete.auth_id);
      toast.success('User deleted');
      fetchUsers();
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setUserFilters({ subscription: 'all', role: 'all', search: '', inactiveDays: 'all' });
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  const COLUMNS = [
    { field: 'full_name', label: 'User' },
    { field: 'email', label: 'Email' },
    { field: 'subscription_tier', label: 'Plan' },
    { field: 'role', label: 'Role' },
    { field: 'last_active', label: 'Last active' },
  ];

  return (
    <div className="space-y-4 pb-10 pt-12 md:pt-0">
      <RefinedDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Remove Access"
        description="Permanently delete this user or deactivate their session. This cannot be reversed."
        itemIdentifier={userToDelete?.email}
        isLoading={loading}
      />

      {/* Warning email modal */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[rgb(var(--signal-warn))]" />
              Send Inactivity Warning
            </DialogTitle>
            <DialogDescription>
              Send warning emails to {selectedUsers.size} selected user(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className={FIELD_LABEL}>Days until deletion</Label>
            <Input
              type="number"
              min={7}
              max={90}
              value={warningDays}
              onChange={(e) => setWarningDays(parseInt(e.target.value) || 14)}
              className={FIELD_INPUT}
            />
            <p className="text-[11px] text-stone-500">
              Users are warned their account may be deleted if they don&apos;t log in within this
              many days.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowWarningModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendWarning}
              disabled={isSendingWarning}
              className="bg-[rgb(var(--signal-warn))] hover:opacity-90 text-white"
            >
              {isSendingWarning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSendingWarning ? 'Sending…' : 'Send warnings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminPageHeader
        title="Users"
        description="Accounts, access roles, subscription tiers, and inactivity warnings"
        tip="Manage every registered account. Filters and sort apply server-side, so this works the same at 100 or 100,000 users."
      >
        <AdminButton variant="outline" onClick={fetchUsers}>
          <RefreshCcw className={cn('w-3 h-3', loading && 'animate-spin')} />
          Refresh
        </AdminButton>
        <AdminButton onClick={() => setIsCreatingUser(true)}>
          <UserPlus className="w-3.5 h-3.5" />
          New account
        </AdminButton>
      </AdminPageHeader>

      {/* Filters */}
      <div className={cn(PANEL, 'p-3.5 space-y-3')}>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          <div className="min-[480px]:col-span-2 lg:col-span-4 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              placeholder="Search name or email…"
              value={userFilters.search}
              onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
              className={cn(FIELD_INPUT, 'pl-8 w-full')}
            />
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2">
            <Select
              value={userFilters.subscription}
              onValueChange={(value) => setUserFilters({ ...userFilters, subscription: value })}
            >
              <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
                <CreditCard className="w-3.5 h-3.5 text-stone-400 mr-1.5" />
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2">
            <Select
              value={userFilters.role}
              onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}
            >
              <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
                <Shield className="w-3.5 h-3.5 text-stone-400 mr-1.5" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2">
            <Select
              value={userFilters.inactiveDays}
              onValueChange={(value) => setUserFilters({ ...userFilters, inactiveDays: value })}
            >
              <SelectTrigger className={cn(FIELD_INPUT, 'w-full')}>
                <Clock className="w-3.5 h-3.5 text-stone-400 mr-1.5" />
                <SelectValue placeholder="Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All activity</SelectItem>
                <SelectItem value="30">Inactive 30+ days</SelectItem>
                <SelectItem value="60">Inactive 60+ days</SelectItem>
                <SelectItem value="90">Inactive 90+ days</SelectItem>
                <SelectItem value="180">Inactive 180+ days</SelectItem>
                <SelectItem value="365">Inactive 1+ year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2 flex justify-end">
            <button
              onClick={resetFilters}
              className={cn(
                MICRO,
                'h-9 px-3 rounded-md text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              Clear filters
            </button>
          </div>
        </div>

        {selectedUsers.size > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[rgb(var(--signal-warn)/0.08)] border border-[rgb(var(--signal-warn)/0.3)]">
            <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))]')}>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWarningModal(true)}
                className={cn(
                  MICRO,
                  'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-warn)/0.3)] text-[rgb(var(--signal-warn))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-warn)/0.08)] transition-colors'
                )}
              >
                <Mail className="w-3 h-3" />
                Send warning
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className={cn(
                  MICRO,
                  'inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--signal-fault)/0.3)] text-[rgb(var(--signal-fault))] px-2.5 py-1.5 hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors disabled:opacity-50'
                )}
              >
                <Trash2 className="w-3 h-3" />
                Delete selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className={cn(PANEL, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/[0.07]">
                <th className="py-2.5 px-4 w-10">
                  <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} />
                </th>
                {COLUMNS.map(({ field, label }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={cn(
                      MICRO,
                      'py-2.5 px-4 cursor-pointer select-none transition-colors group',
                      sortField === field
                        ? 'text-stone-900 dark:text-stone-50'
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortField === field ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-2.5 h-2.5" />
                        ) : (
                          <ChevronDown className="w-2.5 h-2.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60" />
                      )}
                    </span>
                  </th>
                ))}
                <th className={cn(MICRO, 'py-2.5 px-4 text-stone-400 text-right')}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-stone-100 dark:border-white/[0.05]">
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-4 w-full max-w-xs bg-stone-100 dark:bg-white/[0.05] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Search className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                    <p className={cn(MICRO, 'text-stone-400')}>No users match your filters</p>
                    <button
                      onClick={resetFilters}
                      className={cn(
                        MICRO,
                        'mt-2 text-stone-600 dark:text-stone-300 underline underline-offset-2'
                      )}
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-b border-stone-100 dark:border-white/[0.05] hover:bg-stone-50/70 dark:hover:bg-white/[0.02] transition-colors last:border-0',
                      selectedUsers.has(user.id) && 'bg-stone-50 dark:bg-white/[0.02]'
                    )}
                  >
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-stone-100 dark:bg-white/[0.06] grid place-items-center text-[10px] font-black text-stone-500 dark:text-stone-300 shrink-0">
                          {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-[11px] text-stone-900 dark:text-stone-50 truncate">
                            {user.full_name || 'Anonymous user'}
                          </p>
                          <p className={cn(NUM, 'text-[10px] text-stone-400')}>
                            {user.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-300">
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className={cn(NUM, 'truncate')}>{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 capitalize',
                          MICRO,
                          TIER_PILL[user.subscription_tier] || TIER_PILL.free
                        )}
                      >
                        {user.subscription_tier === 'premium' && (
                          <Sparkles className="w-2.5 h-2.5" />
                        )}
                        {user.subscription_tier || 'free'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-1.5 py-0.5 capitalize',
                          MICRO,
                          ROLE_PILL[user.role] || ROLE_PILL.user
                        )}
                      >
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={cn(NUM, 'flex items-center gap-1 text-[10px] text-stone-500')}
                      >
                        <Clock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
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
                          onClick={() => setEditingUser(user)}
                          aria-label={`Edit ${user.full_name || user.email}`}
                          className="h-7 w-7 grid place-items-center rounded-md text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setUserToDelete(user)}
                          aria-label={`Delete ${user.full_name || user.email}`}
                          className="h-7 w-7 grid place-items-center rounded-md text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-stone-100 dark:border-white/[0.06]">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            totalItems={totalItems}
            itemName="users"
          />
        </div>
      </div>

      {/* Create / edit dialog */}
      {(isCreatingUser || !!editingUser) && (
        <Dialog
          open={isCreatingUser || !!editingUser}
          onOpenChange={() => {
            setIsCreatingUser(false);
            setEditingUser(null);
          }}
        >
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreatingUser ? 'Create user' : 'Edit user'}</DialogTitle>
              <DialogDescription>
                {isCreatingUser
                  ? 'Add a new user to the platform.'
                  : 'Update user information and permissions.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label className={FIELD_LABEL}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <Input
                    type="email"
                    disabled={!!editingUser}
                    value={editingUser ? editingUser.email : newUser.email}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, email: e.target.value })
                        : setNewUser({ ...newUser, email: e.target.value })
                    }
                    className={cn(FIELD_INPUT, 'pl-8')}
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {isCreatingUser && (
                <div>
                  <Label className={FIELD_LABEL}>Initial password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                      <Input
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className={cn(FIELD_INPUT, 'pl-8')}
                        placeholder="Generate or type…"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const chars =
                          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                        const pwd = Array(16)
                          .fill(0)
                          .map(() => chars[Math.floor(Math.random() * chars.length)])
                          .join('');
                        setNewUser((prev) => ({ ...prev, password: pwd }));
                      }}
                      className="h-9 px-3 rounded-md border-stone-300 dark:border-white/15"
                      title="Generate strong password"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className={cn(MICRO, 'text-stone-400 mt-1.5')}>
                    8+ chars, uppercase, lowercase, number, special character.
                  </p>
                </div>
              )}

              <div>
                <Label className={FIELD_LABEL}>Name</Label>
                <div className="relative">
                  <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <Input
                    value={editingUser ? editingUser.full_name : newUser.full_name}
                    onChange={(e) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, full_name: e.target.value })
                        : setNewUser({ ...newUser, full_name: e.target.value })
                    }
                    className={cn(FIELD_INPUT, 'pl-8')}
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={FIELD_LABEL}>Subscription</Label>
                  <Select
                    value={editingUser ? editingUser.subscription_tier : newUser.subscription_tier}
                    onValueChange={(value) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, subscription_tier: value })
                        : setNewUser({ ...newUser, subscription_tier: value })
                    }
                  >
                    <SelectTrigger className={FIELD_INPUT}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Role</Label>
                  <Select
                    value={editingUser ? editingUser.role : newUser.role}
                    onValueChange={(value) =>
                      editingUser
                        ? setEditingUser({ ...editingUser, role: value })
                        : setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger className={FIELD_INPUT}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreatingUser(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  editingUser
                    ? () => handleUpdateUser(editingUser.id, editingUser)
                    : handleCreateUser
                }
                disabled={loading || (!editingUser && !newUser.email)}
              >
                {loading ? 'Processing…' : isCreatingUser ? 'Create user' : 'Update user'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagement;
