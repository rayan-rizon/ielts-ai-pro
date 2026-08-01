import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCcw, UserPlus } from 'lucide-react';
import { signUpSchema } from '@/lib/validations';
import { User } from '@/entities';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/cn';
import RefinedDeleteModal from './shared/RefinedDeleteModal';
import { AdminButton, AdminPageHeader } from './ui/primitives';
import { UserManagementFilters } from './users/UserManagementFilters';
import { UserManagementTable } from './users/UserManagementTable';
import { UserEditorDialog, WarningDialog } from './users/UserManagementDialogs';

const EMPTY_USER = {
  email: '',
  full_name: '',
  subscription_tier: 'free',
  role: 'user',
  password: '',
};

const DEFAULT_FILTERS = {
  subscription: 'all',
  subscriptionStatus: 'all',
  role: 'all',
  search: '',
  inactiveDays: 'all',
};

const createUserAccount = async (user) => {
  signUpSchema.shape.password.parse(user.password);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
  });
  if (authError) throw authError;

  const { error: profileError } = await supabase.from('users').insert({
    auth_id: authData.user.id,
    email: user.email,
    full_name: user.full_name,
    subscription_tier: user.subscription_tier,
    role: user.role,
  });
  if (profileError) throw profileError;
};

const userCreationErrorMessage = (error) =>
  error.errors?.[0]?.message || error.message || 'Failed to create user';

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState(DEFAULT_FILTERS);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDays, setWarningDays] = useState(14);
  const [isSendingWarning, setIsSendingWarning] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const requestId = useRef(0);

  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscriptionStatus');
    if (subscriptionStatus === 'cancelling' || subscriptionStatus === 'expiring') {
      setUserFilters((filters) =>
        filters.subscriptionStatus === subscriptionStatus
          ? filters
          : { ...filters, subscriptionStatus }
      );
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(userFilters.search), 500);
    return () => clearTimeout(timer);
  }, [userFilters.search]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [
    debouncedSearch,
    userFilters.subscription,
    userFilters.subscriptionStatus,
    userFilters.role,
    userFilters.inactiveDays,
  ]);

  const fetchUsers = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      const filters = {
        subscription: userFilters.subscription,
        subscriptionStatus: userFilters.subscriptionStatus,
        role: userFilters.role,
        search: debouncedSearch,
        inactiveDays: userFilters.inactiveDays,
      };
      const orderBy = sortDirection === 'desc' ? `-${sortField}` : sortField;
      const result = await User.list({ orderBy, page: currentPage, pageSize, filters });
      if (currentRequest !== requestId.current) return;

      setUsers(result.data || []);
      setTotalItems(result.count || 0);
      setTotalPages(Math.max(1, Math.ceil((result.count || 0) / pageSize)));
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    userFilters.subscription,
    userFilters.subscriptionStatus,
    userFilters.role,
    userFilters.inactiveDays,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection((previous) => (previous === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleUserSelection = (userId) => {
    const next = new Set(selectedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelectedUsers(next);
    setSelectAll(next.size === users.length && users.length > 0);
  };

  const toggleSelectAll = () => {
    setSelectedUsers(selectAll ? new Set() : new Set(users.map((user) => user.id)));
    setSelectAll(!selectAll);
  };

  const selectedUserObjects = () => users.filter((user) => selectedUsers.has(user.id));

  const handleSendWarning = async () => {
    const selected = selectedUserObjects();
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
    const selected = selectedUserObjects();
    if (selected.length === 0) return toast.error('No users selected');
    try {
      setLoading(true);
      const authIds = selected.map((user) => user.auth_id).filter(Boolean);
      const result = await User.adminBulkDeleteUsers(authIds);
      if (result.failed > 0) toast.warning(`${result.deleted} deleted, ${result.failed} failed`);
      else toast.success(`${result.deleted} users deleted`);
      setSelectedUsers(new Set());
      setSelectAll(false);
      await fetchUsers();
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
      await createUserAccount(newUser);
      await fetchUsers();
      setIsCreatingUser(false);
      setNewUser(EMPTY_USER);
      toast.success('User created');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(userCreationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      setLoading(true);
      await User.adminUpdateUser(userId, updates);
      await fetchUsers();
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
      await fetchUsers();
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setUserFilters(DEFAULT_FILTERS);
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

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
      <WarningDialog
        open={showWarningModal}
        onOpenChange={setShowWarningModal}
        selectedCount={selectedUsers.size}
        days={warningDays}
        onDaysChange={setWarningDays}
        sending={isSendingWarning}
        onSend={handleSendWarning}
      />
      <AdminPageHeader
        title="Users"
        description="Accounts, access roles, subscription tiers, and inactivity warnings"
        tip="Manage registered accounts. Filters and sorting run server-side."
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
      <UserManagementFilters
        filters={userFilters}
        onFiltersChange={setUserFilters}
        onReset={resetFilters}
        selectedCount={selectedUsers.size}
        loading={loading}
        onWarnSelected={() => setShowWarningModal(true)}
        onDeleteSelected={handleBulkDelete}
      />
      <UserManagementTable
        users={users}
        loading={loading}
        selectedUsers={selectedUsers}
        selectAll={selectAll}
        onToggleAll={toggleSelectAll}
        onToggleUser={toggleUserSelection}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEditUser={setEditingUser}
        onDeleteUser={setUserToDelete}
        onReset={resetFilters}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
          pageSize,
          onPageSizeChange: setPageSize,
          totalItems,
        }}
      />
      <UserEditorDialog
        creating={isCreatingUser}
        editingUser={editingUser}
        newUser={newUser}
        isAdmin={isAdmin}
        loading={loading}
        onCreatingChange={setIsCreatingUser}
        onEditingChange={setEditingUser}
        onNewUserChange={setNewUser}
        onCreate={handleCreateUser}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
};

export default UserManagement;
