import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  ClipboardList,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Loader2,
  Users,
  Filter,
  GraduationCap,
  ArrowDownCircle,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { useTestManagement } from '@/hooks/admin/useTestManagement';
import { useTestSaving } from '@/hooks/admin/useTestSaving';
import TestCreator from './creation/TestCreator';
import TestTable from './list/TestTable';
import DeleteTestModal from './list/DeleteTestModal';
import BulkDeleteModal from './list/BulkDeleteModal';
import PaginationControls from '../shared/PaginationControls';

import { useSearchParams } from 'react-router-dom';

// Test type configurations
const testStructures = [
  { key: 'reading', name: 'Reading', icon: BookOpen },
  { key: 'listening', name: 'Listening', icon: Headphones },
  { key: 'writing', name: 'Writing', icon: PenTool },
  { key: 'speaking', name: 'Speaking', icon: Mic },
];

const TestManagement = () => {
  // UI State
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTestType, setSelectedTestType] = useState(
    searchParams.get('testType') || 'reading'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [testToDelete, setTestToDelete] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, draft
  const [tierFilter, setTierFilter] = useState('all'); // all, free, pro, premium
  const [cambridgeFilter, setCambridgeFilter] = useState('all'); // all, cambridge, standard
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Custom Hooks
  const {
    passages,
    questions,
    sessions,
    pagination,
    loading,
    fetchAllData,
    deleteTest,
    duplicateTest,
    bulkDeleteTests,
    bulkUpdateStatus,
    exportTest,
    importTest,
    bulkExportTests,
    bulkImportTests,
  } = useTestManagement();

  // Use test saving hook
  const { saveTest } = useTestSaving(() => {
    setIsCreatingTest(false);
    setEditingTest(null);
    fetchAllData(getApiFilters(), pagination.page, pagination.pageSize);
  });

  const getApiFilters = () => ({
    test_type: selectedTestType,
    searchQuery: debouncedSearch,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    access_tier: tierFilter === 'all' ? undefined : tierFilter,
    is_official_cambridge:
      cambridgeFilter === 'all' ? undefined : cambridgeFilter === 'cambridge' ? true : false,
  });

  // Fetch data when filters/page change
  useEffect(() => {
    // We only trigger fetch if filters change. Page changes are handled by PaginationControls calling fetchAllData directly.
    // Reset to page 1 on filter change
    fetchAllData(getApiFilters(), 1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestType, debouncedSearch, statusFilter, tierFilter, cambridgeFilter, fetchAllData]);

  // Note: Stats and sorting logic might need adjustment for server-side
  // For now using passages directly
  const filteredTests = passages; // Server-side filtered

  // Calculate stats from the current page of passages
  const stats = {
    total: pagination.totalItems || passages.length,
    active: passages.filter((p) => p.is_active).length,
    draft: passages.filter((p) => !p.is_active).length,
    totalUsage: passages.reduce((sum, p) => sum + (p.usage_count || 0), 0),
  };

  // Handler for saving test
  const onSaveTest = async (testData, isDraft = false) => {
    return await saveTest(testData, isDraft);
  };

  // Handler for confirming delete
  const confirmDelete = async () => {
    if (testToDelete) {
      await deleteTest(testToDelete.id, getApiFilters());
      setTestToDelete(null);
    }
  };

  // Handler for test type change
  const handleTestTypeChange = (type) => {
    setSelectedTestType(type);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('testType', type);
      return newParams;
    });
  };

  // Handler for editing a test
  const handleEditTest = (test) => {
    setEditingTest(test);
  };

  // Handler for duplicating a test
  const handleDuplicate = async (test) => {
    await duplicateTest(test.id, getApiFilters());
  };

  // Handler for importing test
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true; // Allow multiple file selection
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 1) {
        await importTest(files[0], getApiFilters());
      } else if (files.length > 1) {
        await bulkImportTests(files, getApiFilters());
      }
    };
    input.click();
  };

  // Handler for bulk export
  const handleBulkExport = async () => {
    if (selectedIds.length > 0) {
      await bulkExportTests(selectedIds);
      setSelectedIds([]); // Clear selection after export
    }
  };

  // Handler for bulk delete with confirmation
  const handleBulkDeleteConfirm = async () => {
    await bulkDeleteTests(selectedIds, getApiFilters());
    setShowBulkDeleteModal(false);
    setSelectedIds([]);
  };

  // Handler for sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading && passages.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4" data-oid="nmxbcje">
        <Loader2 className="w-10 h-10 animate-spin text-primary" data-oid="2t7uyda" />
        <p className="text-muted-foreground animate-pulse" data-oid="rrew74e">
          Loading tests...
        </p>
      </div>
    );
  }

  if (isCreatingTest || editingTest) {
    return (
      <TestCreator
        initialData={editingTest}
        onSave={onSaveTest}
        onCancel={() => {
          const wasCreating = isCreatingTest;
          setIsCreatingTest(false);
          setEditingTest(null);
          // Refresh data to show any auto-saved drafts
          // If we were creating a test, go to page 1 to see it
          // If we were editing, stay on the current page
          fetchAllData(getApiFilters(), wasCreating ? 1 : pagination.page, pagination.pageSize);
        }}
        testType={editingTest ? editingTest.test_type : selectedTestType}
        data-oid="y48hr7i"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 pb-6 pt-12 md:pt-0"
      data-oid="hw-n65o"
    >
      <DeleteTestModal
        test={testToDelete}
        isOpen={!!testToDelete}
        onClose={() => setTestToDelete(null)}
        onConfirm={confirmDelete}
        data-oid="xc3_fs9"
      />

      <BulkDeleteModal
        count={selectedIds.length}
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
        data-oid="m63wyh9"
      />

      {/* Header Section */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
        data-oid="3n6l.-c"
      >
        <div className="space-y-0.5 min-w-0 flex-1" data-oid="7nmjad-">
          <h2
            className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-2.5"
            data-oid="title-tm"
          >
            <div
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 shadow-2xs shrink-0"
              data-oid="_sx8x6c"
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" data-oid="4sa8au3" />
            </div>
            <span className="truncate">Test Management</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
            data-oid="tomx5z0"
          >
            Create, filter, and manage your IELTS test content library
          </p>
        </div>

        <div
          className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-1 sm:mt-0"
          data-oid="snzlq7m"
        >
          <DropdownMenu data-oid="dd-actions">
            <DropdownMenuTrigger asChild data-oid="dd-trig">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none justify-center h-9 px-3.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs shadow-2xs"
              >
                <MoreVertical className="w-4 h-4 mr-1.5 text-slate-500" data-oid="mv" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 rounded-xl bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl"
              data-oid="dd-cont"
            >
              <DropdownMenuItem
                onClick={handleImportClick}
                className="rounded-lg h-9 font-medium cursor-pointer"
                data-oid="dd-imp"
              >
                <ArrowDownCircle
                  className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400"
                  data-oid="akzevdt"
                />
                Import Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBulkExport}
                disabled={selectedIds.length === 0}
                className="rounded-lg h-9 font-medium cursor-pointer"
                data-oid="dd-exp"
              >
                <Download
                  className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400"
                  data-oid="dw"
                />
                Export Selected ({selectedIds.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" data-oid="sep" />
              <DropdownMenuItem
                onClick={() => setIsCreatingTest(true)}
                className="rounded-lg h-9 font-medium cursor-pointer text-indigo-600 dark:text-indigo-400"
                data-oid="dd-new"
              >
                <Plus className="w-4 h-4 mr-2" data-oid="pl" />
                New Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setIsCreatingTest(true)}
            className="flex-1 sm:flex-none justify-center h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-2xs rounded-xl text-xs gap-1 transition-all"
            data-oid="j.xyy95"
          >
            <Plus className="w-3.5 h-3.5" data-oid="tp5._-7" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Stats Section (2 Columns on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5" data-oid="jqkuwoz">
        {[
          { label: 'Total Tests', value: stats.total, icon: ClipboardList, color: 'blue' },
          { label: 'Active', value: stats.active, icon: BookOpen, color: 'emerald' },
          { label: 'Drafts', value: stats.draft, icon: PenTool, color: 'amber' },
          { label: 'Total Usage', value: stats.totalUsage, icon: Users, color: 'indigo' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            data-oid="stat-card"
          >
            <Card
              className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden"
              data-oid="2-ihrbw"
            >
              <CardContent
                className="p-3.5 px-4 flex items-center justify-between"
                data-oid="dbd3hf6"
              >
                <div className="space-y-0.5" data-oid="fg5pwx8">
                  <p
                    className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                    data-oid="whr6bg-"
                  >
                    {stat.label}
                  </p>
                  <h3
                    className="text-xl font-black text-slate-950 dark:text-white leading-none"
                    data-oid="vt0ds:5"
                  >
                    {(stat.value || 0).toLocaleString()}
                  </h3>
                </div>
                <div
                  className={cn(
                    'p-2.5 rounded-xl border shrink-0',
                    stat.color === 'blue' &&
                      'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/80 dark:border-blue-900',
                    stat.color === 'emerald' &&
                      'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900',
                    stat.color === 'amber' &&
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200/80 dark:border-amber-900',
                    stat.color === 'indigo' &&
                      'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900'
                  )}
                  data-oid="xg-_85f"
                >
                  <stat.icon className="w-4 h-4" data-oid="b7zev4c" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Test Type Tabs */}
      <div
        className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-2xs w-full sm:w-fit overflow-x-auto no-scrollbar"
        data-oid="rckw:of"
      >
        {testStructures.map((typeInfo) => {
          const isActive = selectedTestType === typeInfo.key;
          const Icon = typeInfo.icon;
          return (
            <button
              key={typeInfo.key}
              onClick={() => handleTestTypeChange(typeInfo.key)}
              className={cn(
                'h-10 px-5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 whitespace-nowrap border cursor-pointer select-none',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-white hover:shadow-2xs'
              )}
              data-oid="4k-gfze"
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                )}
                data-oid="3495u3y"
              />
              <span>{typeInfo.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Card (Table with attached toolbar) */}
      <Card
        className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-2xs rounded-2xl overflow-hidden"
        data-oid="x86e9hr"
      >
        {/* Attached Toolbar */}
        <div
          className="flex flex-col xl:flex-row gap-3 items-center bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-white/5 p-3"
          data-oid="04-c5ik"
        >
          <div className="relative flex-1 w-full" data-oid="4hyep9u">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
              data-oid="rvylfoc"
            />

            <Input
              placeholder={`Search ${selectedTestType} tests...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/60 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-none"
              aria-label={`Search ${selectedTestType} tests`}
              data-oid="ejc3byb"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto" data-oid="_2nne1m">
            <Select value={statusFilter} onValueChange={setStatusFilter} data-oid="ahw9b1h">
              <SelectTrigger
                className="h-8 w-[120px] bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-white/10 text-xs font-bold rounded-xl"
                data-oid=".2ea2e-"
              >
                <SelectValue placeholder="Status" data-oid="ukc:-p5" />
              </SelectTrigger>
              <SelectContent data-oid="bvt0j0s">
                <SelectItem value="all" data-oid="r2raj6d">
                  All Status
                </SelectItem>
                <SelectItem value="active" data-oid="unppyz9">
                  Active
                </SelectItem>
                <SelectItem value="draft" data-oid="mfewb0y">
                  Draft
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter} data-oid="rhja8d7">
              <SelectTrigger
                className="h-8 w-[120px] bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-white/10 text-xs font-bold rounded-xl"
                data-oid="_6:5qz7"
              >
                <SelectValue placeholder="Tier" data-oid="rvj283:" />
              </SelectTrigger>
              <SelectContent data-oid="24i:tqh">
                <SelectItem value="all" data-oid="o_w-znl">
                  All Tiers
                </SelectItem>
                <SelectItem value="free" data-oid="7v:5fby">
                  Free
                </SelectItem>
                <SelectItem value="pro" data-oid="5x0w97o">
                  Pro
                </SelectItem>
                <SelectItem value="premium" data-oid=".76q-1r">
                  Premium
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={cambridgeFilter} onValueChange={setCambridgeFilter} data-oid="i6y535a">
              <SelectTrigger
                className="h-8 w-[140px] bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-white/10 text-xs font-bold rounded-xl"
                data-oid="57ec_tz"
              >
                <div className="flex items-center gap-1.5 truncate" data-oid="ozwnqz.">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" data-oid="hs3y90x" />
                  <span className="truncate" data-oid="05149ms">
                    {cambridgeFilter === 'all'
                      ? 'All Sources'
                      : cambridgeFilter === 'cambridge'
                        ? 'Cambridge'
                        : 'Standard'}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent data-oid="0a.i5cq">
                <SelectItem value="all" data-oid=":_exkj7">
                  All Sources
                </SelectItem>
                <SelectItem value="cambridge" data-oid="n1va0cd">
                  Cambridge Only
                </SelectItem>
                <SelectItem value="standard" data-oid="5i:jvma">
                  Standard Tests
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery ||
              statusFilter !== 'all' ||
              tierFilter !== 'all' ||
              cambridgeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTierFilter('all');
                  setCambridgeFilter('all');
                }}
                className="h-8 px-2.5 text-xs text-slate-500 hover:text-slate-900 font-bold"
                data-oid="_7wcg2d"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Floating Bulk Actions Indicator */}
          <AnimatePresence data-oid="o:62xkz">
            {selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="flex items-center gap-2 p-1 px-3 bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl shadow-2xs"
                data-oid="kmq3.p4"
              >
                <span
                  className="text-[10px] font-black uppercase tracking-wider shrink-0"
                  data-oid="c64hlwe"
                >
                  {selectedIds.length} Selected
                </span>
                <div
                  className="w-px h-4 bg-indigo-200 dark:bg-indigo-800 mx-1"
                  data-oid="sep-bulk"
                />
                <div className="flex items-center gap-1" data-oid="bulk-btns">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-[10px] font-extrabold uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                    onClick={handleBulkExport}
                    data-oid="m0-:1w2"
                  >
                    <Download className="w-3 h-3 mr-1" data-oid="e_zh17a" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-[10px] font-extrabold uppercase hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                    onClick={async () => {
                      await bulkUpdateStatus(selectedIds, true, getApiFilters());
                      setSelectedIds([]);
                    }}
                    data-oid="urunt_:"
                  >
                    Activate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-[10px] font-extrabold uppercase hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300"
                    onClick={async () => {
                      await bulkUpdateStatus(selectedIds, false, getApiFilters());
                      setSelectedIds([]);
                    }}
                    data-oid="g7o8zb0"
                  >
                    Draft
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg text-[10px] font-extrabold uppercase hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300"
                    onClick={() => setShowBulkDeleteModal(true)}
                    data-oid="k7kgtwb"
                  >
                    <Trash2 className="w-3 h-3 mr-1" data-oid="del-icon" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-0" data-oid=":p1d.w7">
          <TestTable
            tests={filteredTests}
            questions={questions}
            onEdit={handleEditTest}
            onDelete={setTestToDelete}
            onDuplicate={handleDuplicate}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSort={handleSort}
            sortConfig={sortConfig}
            onExport={exportTest}
            data-oid="2ozrkqr"
          />

          <div className="p-3 border-t border-slate-100 dark:border-white/5" data-oid="-w8wnm5">
            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => fetchAllData(getApiFilters(), page, pagination.pageSize)}
              pageSize={pagination.pageSize}
              onPageSizeChange={(size) => fetchAllData(getApiFilters(), 1, size)}
              totalItems={pagination.totalItems}
              itemName="tests"
              data-oid="vgpy3:m"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TestManagement;
