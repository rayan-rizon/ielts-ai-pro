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
import { cn } from '@/lib/utils';
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
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-10"
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
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        data-oid="3n6l.-c"
      >
        <div data-oid="7nmjad-">
          <div className="flex items-center gap-3 mb-1" data-oid="t75rj18">
            <div
              className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner"
              data-oid="_sx8x6c"
            >
              <ClipboardList className="w-6 h-6" data-oid="4sa8au3" />
            </div>
            <div>
              <h2
                className="text-3xl font-black tracking-tight text-foreground"
                data-oid="title-tm"
              >
                Test Management
              </h2>
              <p className="text-muted-foreground font-medium" data-oid="tomx5z0">
                Create and manage your IELTS test content library
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3" data-oid="snzlq7m">
          <DropdownMenu data-oid="dd-actions">
            <DropdownMenuTrigger asChild data-oid="dd-trig">
              <Button
                variant="outline"
                className="h-11 px-5 rounded-2xl font-bold border-border/50 bg-card/50 backdrop-blur-sm hover:bg-muted/50 transition-all"
              >
                <MoreVertical className="w-4 h-4 mr-2" data-oid="mv" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 rounded-2xl bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl"
              data-oid="dd-cont"
            >
              <DropdownMenuItem
                onClick={handleImportClick}
                className="rounded-xl h-10 font-medium cursor-pointer"
                data-oid="dd-imp"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2 text-primary" data-oid="akzevdt" />
                Import Data
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBulkExport}
                disabled={selectedIds.length === 0}
                className="rounded-xl h-10 font-medium cursor-pointer"
                data-oid="dd-exp"
              >
                <Download className="w-4 h-4 mr-2 text-primary" data-oid="dw" />
                Export Selected ({selectedIds.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" data-oid="sep" />
              <DropdownMenuItem
                onClick={() => setIsCreatingTest(true)}
                className="rounded-xl h-10 font-medium cursor-pointer text-primary focus:text-primary"
                data-oid="dd-new"
              >
                <Plus className="w-4 h-4 mr-2" data-oid="pl" />
                New Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setIsCreatingTest(true)}
            className="h-11 px-6 rounded-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
            data-oid="j.xyy95"
          >
            <Plus className="w-4 h-4 mr-2" data-oid="tp5._-7" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-oid="jqkuwoz">
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
            transition={{ delay: i * 0.05 }}
            data-oid="stat-card"
          >
            <Card
              className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm"
              data-oid="2-ihrbw"
            >
              <CardContent className="p-3.5" data-oid="dbd3hf6">
                <div className="flex items-center gap-3" data-oid="v5g1353">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      `bg-${stat.color}-500/10 text-${stat.color}-500 shadow-inner`
                    )}
                    data-oid="xg-_85f"
                  >
                    <stat.icon className="w-5 h-5" data-oid="b7zev4c" />
                  </div>
                  <div className="flex flex-col min-w-0" data-oid="fg5pwx8">
                    <h3
                      className="text-xl font-black text-foreground tracking-tight truncate leading-none mb-0.5"
                      data-oid="vt0ds:5"
                    >
                      {stat.value || 0}
                    </h3>
                    <p
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 truncate"
                      data-oid="whr6bg-"
                    >
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Test Type Tabs */}
      <div
        className="flex items-center gap-1.5 p-1.5 bg-muted/20 backdrop-blur-md rounded-[1.5rem] border border-border/40 w-fit"
        data-oid="rckw:of"
      >
        {testStructures.map((typeInfo) => (
          <button
            key={typeInfo.key}
            onClick={() => handleTestTypeChange(typeInfo.key)}
            className={cn(
              'group relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 whitespace-nowrap overflow-hidden',
              selectedTestType === typeInfo.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.05]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
            )}
            data-oid="4k-gfze"
          >
            <typeInfo.icon
              className={cn(
                'w-4 h-4 transition-all duration-300',
                selectedTestType === typeInfo.key
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
              data-oid="3495u3y"
            />
            <span>{typeInfo.name}</span>
            {selectedTestType === typeInfo.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Content Card (Table with attached toolbar) */}
      <Card
        className="bg-card/50 backdrop-blur-sm border-border/50 shadow-sm overflow-hidden"
        data-oid="x86e9hr"
      >
        {/* Attached Toolbar */}
        <div
          className="flex flex-col xl:flex-row gap-4 items-center bg-card/30 backdrop-blur-sm border-b border-border/30 p-4"
          data-oid="04-c5ik"
        >
          <div className="relative flex-1 w-full" data-oid="4hyep9u">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              data-oid="rvylfoc"
            />

            <Input
              placeholder={`Search ${selectedTestType} tests...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-muted focus-visible:ring-primary/20"
              aria-label={`Search ${selectedTestType} tests`}
              data-oid="ejc3byb"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto" data-oid="_2nne1m">
            <Select value={statusFilter} onValueChange={setStatusFilter} data-oid="ahw9b1h">
              <SelectTrigger
                className="w-[130px] bg-background/50 border-muted text-xs"
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
                className="w-[130px] bg-background/50 border-muted text-xs"
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
                className="w-[150px] bg-background/50 border-muted text-xs"
                data-oid="57ec_tz"
              >
                <div className="flex items-center gap-2 truncate" data-oid="ozwnqz.">
                  <GraduationCap className="w-3.5 h-3.5" data-oid="hs3y90x" />
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
                className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
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
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="flex items-center gap-2 p-1.5 pl-4 bg-primary/10 backdrop-blur-md border border-primary/20 rounded-2xl md:ml-4 shadow-xl shadow-primary/5"
                data-oid="kmq3.p4"
              >
                <div className="flex flex-col" data-oid="count-info">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest text-primary/60"
                    data-oid="c64hlwe"
                  >
                    {selectedIds.length} Selection
                  </span>
                </div>
                <div className="w-px h-6 bg-primary/20 mx-2" data-oid="sep-bulk" />
                <div className="flex items-center gap-1" data-oid="bulk-btns">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 text-primary transition-all"
                    onClick={handleBulkExport}
                    data-oid="m0-:1w2"
                  >
                    <Download className="w-3.5 h-3.5 mr-2" data-oid="e_zh17a" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 text-emerald-600 transition-all"
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
                    className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 text-amber-600 transition-all"
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
                    className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive/10 text-destructive transition-all"
                    onClick={() => setShowBulkDeleteModal(true)}
                    data-oid="k7kgtwb"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" data-oid="del-icon" />
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

          <div className="p-4 border-t border-border/40" data-oid="-w8wnm5">
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
