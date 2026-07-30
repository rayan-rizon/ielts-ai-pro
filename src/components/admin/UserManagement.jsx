import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Edit,
  Trash2,
  UserPlus,
  Search,
  Sparkles,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  RefreshCcw,
  Users,
  Lock,
  Wand2,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import { signUpSchema } from '@/lib/validations';
import { User } from '@/entities';
import { supabase } from '@/lib/supabase';
import PaginationControls from './shared/PaginationControls';
import RefinedDeleteModal from './shared/RefinedDeleteModal';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/cn';

const UserManagement = () => {
  const { isAdmin } = useAuth();
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    subscription: 'all',
    role: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
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

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Warning email modal
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningDays, setWarningDays] = useState(14);
  const [isSendingWarning, setIsSendingWarning] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userFilters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [userFilters.search]);

  // Reset page when filters change
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
        pageSize: pageSize,
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

  // Selection handlers
  const toggleUserSelection = (userId) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    setSelectAll(newSelection.size === users.length && users.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const getSelectedUserObjects = () => {
    return users.filter((u) => selectedUsers.has(u.id));
  };

  // Send warning email handler
  const handleSendWarning = async () => {
    const selected = getSelectedUserObjects();
    if (selected.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      setIsSendingWarning(true);
      const result = await User.sendInactivityWarning(selected, {
        daysUntilDeletion: warningDays,
      });

      if (result.failed > 0) {
        toast.warning(`${result.sent} emails sent, ${result.failed} failed`);
      } else {
        toast.success(`${result.sent} warning emails sent successfully`);
      }

      setShowWarningModal(false);
      setSelectedUsers(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error sending warnings:', error);
      toast.error('Failed to send warning emails', {
        description: error.message,
      });
    } finally {
      setIsSendingWarning(false);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const selected = getSelectedUserObjects();
    if (selected.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      setLoading(true);
      const authIds = selected.map((u) => u.auth_id).filter(Boolean);
      const result = await User.adminBulkDeleteUsers(authIds);

      if (result.failed > 0) {
        toast.warning(`${result.deleted} users deleted, ${result.failed} failed`);
      } else {
        toast.success(`${result.deleted} users deleted successfully`);
      }

      setSelectedUsers(new Set());
      setSelectAll(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast.error('Failed to delete users', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);

      // Validate password
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
      setIsCreatingUser(false);
      setNewUser({
        email: '',
        full_name: '',
        subscription_tier: 'free',
        role: 'user',
        password: '',
      });
      toast.success('User created successfully!');
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
      toast.success('User updated successfully');
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
      toast.success('User deleted successfully');
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
    setUserFilters({
      subscription: 'all',
      role: 'all',
      search: '',
      dateFrom: '',
      dateTo: '',
      inactiveDays: 'all',
    });
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-10 pt-12 md:pt-0"
      data-oid="z_23py6"
    >
      <RefinedDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Remove Access"
        description="Permanently delete this user or deactivate their session. This cannot be reversed."
        itemIdentifier={userToDelete?.email}
        isLoading={loading}
        data-oid="xiiwf3q"
      />

      {/* Warning Email Modal */}
      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal} data-oid="izpzncj">
        <DialogContent
          className="sm:max-w-md bg-card border-border/50 backdrop-blur-2xl rounded-lg shadow-lg"
          data-oid="sc1f646"
        >
          <DialogHeader data-oid="z-sglky">
            <DialogTitle
              className="text-xl font-bold tracking-tight flex items-center gap-2"
              data-oid="8v06f:q"
            >
              <Mail className="w-5 h-5 text-amber-500" data-oid="_jie9rh" />
              Send Inactivity Warning
            </DialogTitle>
            <DialogDescription className="text-muted-foreground" data-oid="ooxivjt">
              Send warning emails to {selectedUsers.size} selected user(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" data-oid="0jgk5bz">
            <div className="space-y-2" data-oid="se_bk8d">
              <Label className="text-sm font-semibold" data-oid=":cndjnr">
                Days Until Deletion
              </Label>
              <Input
                type="number"
                min={7}
                max={90}
                value={warningDays}
                onChange={(e) => setWarningDays(parseInt(e.target.value) || 14)}
                className="bg-muted/30 border-border/50"
                data-oid="p95nxjs"
              />

              <p className="text-xs text-muted-foreground" data-oid="7ryop07">
                Users will be warned their account may be deleted if they don&apos;t log in within
                this many days.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2" data-oid="e0uq5ib">
            <Button variant="ghost" onClick={() => setShowWarningModal(false)} data-oid="26xtm_3">
              Cancel
            </Button>
            <Button
              onClick={handleSendWarning}
              disabled={isSendingWarning}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-oid="hy:x1bd"
            >
              {isSendingWarning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid="he2n2zg" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" data-oid="su4wlug" />
                  Send Warnings
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
        data-oid="7zo3538"
      >
        <motion.div variants={itemVariants} className="space-y-0.5 min-w-0" data-oid="85swrl-">
          <h2
            className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="9t49n:l"
          >
            <div
              className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs shrink-0"
              data-oid="_::hin1"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" data-oid="9w0m6vz" />
            </div>
            <span className="truncate">User Directory</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400"
            data-oid="olwcxub"
          >
            Manage candidate platform accounts, access roles, subscription tiers, and inactivity
            warnings
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
          data-oid="lb2009i"
        >
          <Button
            variant="outline"
            onClick={fetchUsers}
            className="flex-1 sm:flex-none justify-center h-9 px-3.5 font-extrabold text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/10 shadow-2xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
            data-oid="iiog8.p"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`}
              data-oid="dcmurjz"
            />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setIsCreatingUser(true)}
            className="flex-1 sm:flex-none justify-center h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2"
            data-oid="5yf.zvf"
          >
            <UserPlus className="w-4 h-4" data-oid="izku-.9" />
            <span>New Account</span>
          </Button>
        </motion.div>
      </div>

      {/* Modern Filter Toolbar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-3 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 p-3.5 rounded-2xl shadow-2xs"
        data-oid="6l6kxmo"
      >
        <div
          className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center"
          data-oid="we320wu"
        >
          <div className="min-[480px]:col-span-2 lg:col-span-4 relative group" data-oid="8bpgm8k">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
              data-oid=":agny.j"
            />

            <Input
              placeholder="Search candidate name or email address..."
              value={userFilters.search}
              onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
              className="h-9 pl-9 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10 rounded-xl font-medium text-xs text-slate-900 dark:text-white placeholder:text-slate-400 w-full"
              data-oid="n0fsc29"
            />
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2" data-oid="t.er117">
            <Select
              value={userFilters.subscription}
              onValueChange={(value) => setUserFilters({ ...userFilters, subscription: value })}
              data-oid="cr47ek3"
            >
              <SelectTrigger
                className="h-9 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10 rounded-xl px-3 text-xs w-full"
                data-oid="sv33jb2"
              >
                <div className="flex items-center gap-2" data-oid="9pc6ua1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-500" data-oid=".eowcjc" />
                  <SelectValue placeholder="Plan" data-oid="l5wxgke" />
                </div>
              </SelectTrigger>
              <SelectContent
                className="rounded-xl border-slate-200 dark:border-white/10"
                data-oid="gff7zdk"
              >
                <SelectItem value="all" data-oid="6o6_t-r">
                  All Subscriptions
                </SelectItem>
                <SelectItem value="free" data-oid="vc4sy8.">
                  Free Learner
                </SelectItem>
                <SelectItem value="pro" data-oid="tx6kde5">
                  Pro Member
                </SelectItem>
                <SelectItem value="premium" data-oid="etan.yy">
                  Premium Elite
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2" data-oid="828ulek">
            <Select
              value={userFilters.role}
              onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}
              data-oid="pxuzgl5"
            >
              <SelectTrigger
                className="h-9 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10 rounded-xl px-3 text-xs w-full"
                data-oid="le5yfh_"
              >
                <div className="flex items-center gap-2" data-oid="m8uoj4x">
                  <Shield className="w-4 h-4 text-primary/60" data-oid="4e7e.qc" />
                  <SelectValue placeholder="Role" data-oid="hemo3xo" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50" data-oid="qwozqt-">
                <SelectItem value="all" data-oid="c.95-4s">
                  All Roles
                </SelectItem>
                <SelectItem value="user" data-oid="ue64g6t">
                  Standard User
                </SelectItem>
                <SelectItem value="admin" data-oid="mbtblf-">
                  Administrator
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2 space-y-1" data-oid="fq76h81">
            <Select
              value={userFilters.inactiveDays}
              onValueChange={(value) => setUserFilters({ ...userFilters, inactiveDays: value })}
              data-oid="7yr43eq"
            >
              <SelectTrigger
                className="h-9 bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-white/10 rounded-xl px-3 text-xs w-full"
                data-oid="8xwumsc"
              >
                <div className="flex items-center gap-2" data-oid="s835xyf">
                  <Clock className="w-3.5 h-3.5 text-amber-500/80" data-oid="d4bb-1t" />
                  <SelectValue placeholder="Activity" data-oid="035uysa" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border/50" data-oid="c6t4_.u">
                <SelectItem value="all" data-oid="0n3caks">
                  All Activity
                </SelectItem>
                <SelectItem value="30" data-oid=":3cr5hd">
                  Inactive 30+ days
                </SelectItem>
                <SelectItem value="60" data-oid="hqq686q">
                  Inactive 60+ days
                </SelectItem>
                <SelectItem value="90" data-oid="k758ha:">
                  Inactive 90+ days
                </SelectItem>
                <SelectItem value="180" data-oid="p33d7nq">
                  Inactive 180+ days
                </SelectItem>
                <SelectItem value="365" data-oid="z7bfv52">
                  Inactive 1+ year
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-[480px]:col-span-1 lg:col-span-2 flex justify-end" data-oid="5.zub_x">
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-9 w-full lg:w-auto px-4 rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all uppercase tracking-tight"
              data-oid="e6-0y21"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar - Appears when users are selected */}
        {selectedUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
            data-oid="bpt0ege"
          >
            <span
              className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400"
              data-oid="2nm4h46"
            >
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2" data-oid="3x92mt_">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWarningModal(true)}
                className="flex-1 sm:flex-none justify-center rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 text-xs h-8"
                data-oid="oyllzm0"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" data-oid="89qxbsa" />
                Send Warning
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex-1 sm:flex-none justify-center rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 text-xs h-8"
                data-oid="cxx3tre"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" data-oid="wig6x3e" />
                Delete Selected
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* User Table Card */}
      <motion.div variants={itemVariants} data-oid="g2h1f:8">
        <Card
          className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xs rounded-2xl overflow-hidden"
          data-oid="n7uwuzb"
        >
          <div
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
            data-oid="_h_qjay"
          >
            <Table className="min-w-[850px]" data-oid="hu_q:cf">
              <TableHeader
                className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5"
                data-oid="86l2vgq"
              >
                <TableRow className="hover:bg-transparent" data-oid="l-3o7fy">
                  <TableHead className="py-3 px-4 w-10" data-oid="t_vyh-u">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      className="border-slate-300 dark:border-slate-700"
                      data-oid="gh2wvpr"
                    />
                  </TableHead>

                  {[
                    { field: 'full_name', label: 'Candidate Identity' },
                    { field: 'email', label: 'Email Address' },
                    { field: 'subscription_tier', label: 'Plan Tier' },
                    { field: 'role', label: 'Access Role' },
                    { field: 'last_active', label: 'Last Active' },
                  ].map(({ field, label }) => (
                    <TableHead
                      key={field}
                      onClick={() => handleSort(field)}
                      className={cn(
                        'py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/head',
                        sortField === field && 'text-indigo-600 dark:text-indigo-400'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{label}</span>
                        {sortField === field ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover/head:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                    </TableHead>
                  ))}

                  <TableHead
                    className="py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right"
                    data-oid="6.f:lub"
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-oid=":weyby:">
                <AnimatePresence mode="popLayout" data-oid="9x409i1">
                  {loading && users.length === 0
                    ? [...Array(5)].map((_, i) => (
                        <TableRow
                          key={`skeleton-${i}`}
                          className="border-b border-slate-100 dark:border-white/5"
                          data-oid="23-s5ji"
                        >
                          <TableCell colSpan={7} className="py-3 px-4" data-oid="1ur8xdw">
                            <div className="flex items-center gap-3" data-oid="d8b3ext">
                              <div
                                className="w-8 h-8 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg"
                                data-oid="2cag4p5"
                              />

                              <div className="space-y-1.5" data-oid="i.h29fm">
                                <div
                                  className="w-28 h-3 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md"
                                  data-oid="88atqaf"
                                />

                                <div
                                  className="w-40 h-2 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md opacity-50"
                                  data-oid="-ix3bfa"
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : users.map((user) => (
                        <motion.tr
                          layout
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group ${selectedUsers.has(user.id) ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                          data-oid="0to3y3p"
                        >
                          <TableCell className="py-3 px-4" data-oid="q._hlld">
                            <Checkbox
                              checked={selectedUsers.has(user.id)}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                              className="border-slate-300 dark:border-slate-700"
                              data-oid="hqgp7a3"
                            />
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="u9jbf8p">
                            <div className="flex items-center gap-3" data-oid="y41cfp5">
                              <div
                                className={`w-8 h-8 rounded-xl shadow-2xs flex items-center justify-center text-white text-xs font-black shrink-0 ${
                                  user.subscription_tier === 'premium'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                    : user.subscription_tier === 'pro'
                                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                      : 'bg-slate-400 dark:bg-slate-700 text-slate-100'
                                }`}
                                data-oid="a8yf-:e"
                              >
                                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col" data-oid="iqlvq4j">
                                <span
                                  className="font-extrabold text-xs text-slate-950 dark:text-white leading-tight"
                                  data-oid="r4nbvxn"
                                >
                                  {user.full_name || 'Anonymous User'}
                                </span>
                                <span
                                  className="text-[10px] font-mono text-slate-400"
                                  data-oid="31gfg8q"
                                >
                                  ID: {user.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="68g61oq">
                            <div
                              className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono"
                              data-oid="qq.5l2."
                            >
                              <Mail className="w-3 h-3 text-slate-400" data-oid="seea_kw" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="w8-dgll">
                            <Badge
                              variant="outline"
                              className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded-lg border ${
                                user.subscription_tier === 'premium'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900'
                                  : user.subscription_tier === 'pro'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                              data-oid="bb47k.f"
                            >
                              {user.subscription_tier === 'premium' && (
                                <Sparkles className="w-3 h-3 mr-1" data-oid="4avi6h5" />
                              )}
                              {user.subscription_tier || 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="6cvejgz">
                            <Badge
                              variant="outline"
                              className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded-lg border ${
                                user.role === 'admin'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                              data-oid="j5:s9fp"
                            >
                              {user.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-4" data-oid="t88r-iu">
                            <div
                              className="flex items-center gap-1 text-[11px] font-mono text-slate-500"
                              data-oid="4vhilry"
                            >
                              <Clock className="w-3 h-3 text-slate-400" data-oid="wzi.gsg" />
                              {user.last_active ? (
                                (() => {
                                  const now = new Date();
                                  const lastActive = new Date(user.last_active);
                                  const diffDays = Math.floor(
                                    (now - lastActive) / (1000 * 60 * 60 * 24)
                                  );
                                  if (diffDays === 0) return 'Today';
                                  if (diffDays === 1) return 'Yesterday';
                                  if (diffDays < 30) return `${diffDays} days ago`;
                                  if (diffDays < 365)
                                    return `${Math.floor(diffDays / 30)} months ago`;
                                  return `${Math.floor(diffDays / 365)} years ago`;
                                })()
                              ) : (
                                <span className="text-amber-500 font-bold" data-oid="4.g:jl_">
                                  Never
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right" data-oid="mif35_-">
                            <div className="flex justify-end items-center gap-1" data-oid="m63j8uo">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                                onClick={() => setEditingUser(user)}
                                aria-label={`Edit user ${user.full_name || user.email}`}
                                data-oid="o9e:-09"
                              >
                                <Edit className="w-4 h-4" data-oid="fc9yvuj" />
                              </Button>
                              <div className="w-px h-4 bg-border/50" data-oid="r4xzuym" />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 border border-transparent hover:border-rose-500/20"
                                onClick={() => setUserToDelete(user)}
                                aria-label={`Delete user ${user.full_name || user.email}`}
                                data-oid="bzb6ikx"
                              >
                                <Trash2 className="w-4 h-4" data-oid="5w66d0y" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          <div className="p-4 border-t border-border/40 bg-muted/5" data-oid="1bbo0if">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={totalItems}
              itemName="users"
              data-oid="svgw4kd"
            />
          </div>

          {!loading && users.length === 0 && (
            <div
              className="py-16 flex flex-col items-center justify-center text-center"
              data-oid="1ydo2h:"
            >
              <div
                className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mb-4"
                data-oid="8qoi-0g"
              >
                <Search className="w-8 h-8 text-muted-foreground opacity-20" data-oid="n:s.mol" />
              </div>
              <h3 className="text-lg font-semibold text-foreground" data-oid="86emoq6">
                No Users Found
              </h3>
              <p className="text-muted-foreground mt-1 max-w-xs text-sm" data-oid="15_jmf0">
                No users match your criteria. Try adjusting your filters.
              </p>
              <Button
                onClick={resetFilters}
                variant="outline"
                className="mt-4 rounded-lg font-semibold h-9 px-6 text-sm"
                data-oid="memf9c5"
              >
                RESET DIRECTORY
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Account Dialogs */}
      <AnimatePresence data-oid="m1qy5eq">
        {(isCreatingUser || !!editingUser) && (
          <Dialog
            open={isCreatingUser || !!editingUser}
            onOpenChange={() => {
              setIsCreatingUser(false);
              setEditingUser(null);
            }}
            data-oid="mk63_9i"
          >
            <DialogContent
              className="w-[95vw] sm:w-full sm:max-w-md bg-card border-border/50 backdrop-blur-2xl rounded-2xl p-0 overflow-hidden shadow-lg max-h-[90vh] overflow-y-auto"
              data-oid="oj2mbu."
            >
              <div
                className="h-2 bg-gradient-to-r from-primary via-indigo-500 to-rose-500"
                data-oid="ai_iry:"
              />

              <DialogHeader className="p-6 pb-3" data-oid="gfrojpi">
                <DialogTitle className="text-xl font-bold tracking-tight" data-oid=".x7k73b">
                  {isCreatingUser ? 'Create User' : 'Edit User'}
                </DialogTitle>
                <DialogDescription
                  className="text-sm text-muted-foreground leading-relaxed"
                  data-oid="ewp7xd."
                >
                  {isCreatingUser
                    ? 'Add a new user to the platform.'
                    : 'Update user information and permissions.'}
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-3 space-y-5" data-oid="92x7qqe">
                <div className="space-y-4" data-oid="jsquxal">
                  <div className="space-y-2" data-oid="yd-mgz8">
                    <Label
                      className="text-xs font-semibold uppercase tracking-wide opacity-70 ml-1"
                      data-oid=":rks63z"
                    >
                      Email
                    </Label>
                    <div className="relative" data-oid=":o3da68">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                        data-oid="om9g3ti"
                      />

                      <Input
                        type="email"
                        disabled={!!editingUser}
                        value={editingUser ? editingUser.email : newUser.email}
                        onChange={(e) =>
                          editingUser
                            ? setEditingUser({ ...editingUser, email: e.target.value })
                            : setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="h-12 pl-12 bg-muted/30 border-border/50 text-foreground font-bold rounded-2xl focus-visible:ring-primary/20"
                        placeholder="user@enterprise.com"
                        data-oid="qrzfuxh"
                      />
                    </div>
                  </div>

                  {isCreatingUser && (
                    <div className="space-y-2" data-oid="xigm7s5">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide opacity-70 ml-1"
                        data-oid="wqee1yk"
                      >
                        Initial Password
                      </Label>
                      <div className="relative flex gap-2" data-oid="0b5k1sm">
                        <div className="relative flex-1" data-oid="2zuel99">
                          <Lock
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                            data-oid="dkoyte3"
                          />

                          <Input
                            type="text"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className="h-12 pl-12 bg-muted/30 border-border/50 text-foreground font-bold rounded-2xl focus-visible:ring-primary/20"
                            placeholder="Generate or type..."
                            data-oid="csrs3jo"
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
                          className="h-12 px-4 rounded-2xl border-border/50 bg-muted/30 hover:bg-muted/50"
                          title="Generate Strong Password"
                          data-oid="2-gi9kk"
                        >
                          <Wand2 className="w-4 h-4" data-oid="yt0ig5r" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground ml-1" data-oid="jo88f1m">
                        Must be 8+ chars with uppercase, lowercase, special char & number.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2" data-oid="o0g8-5-">
                    <Label
                      className="text-xs font-semibold uppercase tracking-wide opacity-70 ml-1"
                      data-oid="tvsd.4-"
                    >
                      Name
                    </Label>
                    <div className="relative" data-oid="-ci223m">
                      <Users
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
                        data-oid="gxm4k3z"
                      />

                      <Input
                        value={editingUser ? editingUser.full_name : newUser.full_name}
                        onChange={(e) =>
                          editingUser
                            ? setEditingUser({ ...editingUser, full_name: e.target.value })
                            : setNewUser({ ...newUser, full_name: e.target.value })
                        }
                        className="h-12 pl-12 bg-muted/30 border-border/50 text-foreground font-bold rounded-2xl focus-visible:ring-primary/20"
                        placeholder="Legal Full Name"
                        data-oid="idzdtjz"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4" data-oid="ikdgih0">
                    <div className="space-y-2" data-oid="ea2vaq8">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide opacity-70 ml-1"
                        data-oid="8w6jpaz"
                      >
                        Subscription
                      </Label>
                      <Select
                        value={
                          editingUser ? editingUser.subscription_tier : newUser.subscription_tier
                        }
                        onValueChange={(value) =>
                          editingUser
                            ? setEditingUser({ ...editingUser, subscription_tier: value })
                            : setNewUser({ ...newUser, subscription_tier: value })
                        }
                        data-oid="vt.lwam"
                      >
                        <SelectTrigger
                          className="h-10 bg-muted/30 border-border/50 rounded-lg px-3 font-medium text-sm"
                          data-oid=".5.tilq"
                        >
                          <SelectValue data-oid="tmj0.7v" />
                        </SelectTrigger>
                        <SelectContent
                          className="rounded-lg border-border/50 font-medium"
                          data-oid="a8_9d52"
                        >
                          <SelectItem value="free" data-oid="2k7.ngp">
                            Free
                          </SelectItem>
                          <SelectItem value="pro" data-oid="jy_rrhz">
                            Pro
                          </SelectItem>
                          <SelectItem value="premium" data-oid="4mb8srb">
                            Premium
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2" data-oid="w5z3n0f">
                      <Label
                        className="text-xs font-semibold uppercase tracking-wide opacity-70 ml-1"
                        data-oid="gte9hmo"
                      >
                        Role
                      </Label>
                      <Select
                        value={editingUser ? editingUser.role : newUser.role}
                        onValueChange={(value) =>
                          editingUser
                            ? setEditingUser({ ...editingUser, role: value })
                            : setNewUser({ ...newUser, role: value })
                        }
                        data-oid="f95ir:s"
                      >
                        <SelectTrigger
                          className="h-10 bg-muted/30 border-border/50 rounded-lg px-3 font-medium text-sm"
                          data-oid="-iaeev0"
                        >
                          <SelectValue data-oid="0qaa_77" />
                        </SelectTrigger>
                        <SelectContent
                          className="rounded-lg border-border/50 font-medium"
                          data-oid="e473we4"
                        >
                          <SelectItem value="user" data-oid="8jn26pa">
                            User
                          </SelectItem>
                          {isAdmin && (
                            <SelectItem value="admin" data-oid="ii.sac:">
                              Admin
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter
                className="p-6 pt-3 bg-muted/5 flex-row sm:justify-between items-center"
                data-oid="9x6lwfs"
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingUser(false);
                    setEditingUser(null);
                  }}
                  className="rounded-lg font-medium h-10 text-sm"
                  data-oid="oksp_s_"
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
                  className="h-10 px-6 rounded-lg font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/10 transition-all text-sm"
                  data-oid="3zbmi0h"
                >
                  {loading ? 'Processing...' : isCreatingUser ? 'Create User' : 'Update User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserManagement;
