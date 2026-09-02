import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  GraduationCap,
  ArrowDownCircle,
  Download,
  MoreVertical,
  Trash2,
} from 'lucide-react';
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
import {
  MICRO,
  PANEL,
  Kpi,
  AdminButton,
  AdminPageHeader,
  STAGGER_CONTAINER,
  FADE_UP,
  AdminPageSkeleton,
} from '../ui/primitives';

import { useSearchParams } from 'react-router-dom';

const TEST_STRUCTURES = [
  { key: 'reading', name: 'Reading', icon: BookOpen, accent: 'text-sky-600 dark:text-sky-400' },
  {
    key: 'listening',
    name: 'Listening',
    icon: Headphones,
    accent: 'text-violet-600 dark:text-violet-400',
  },
  {
    key: 'writing',
    name: 'Writing',
    icon: PenTool,
    accent: 'text-amber-600 dark:text-amber-400',
  },
  { key: 'speaking', name: 'Speaking', icon: Mic, accent: 'text-rose-600 dark:text-rose-400' },
];

const FIELD_INPUT =
  'h-8 rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs font-medium';

const TestManagement = () => {
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

  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [cambridgeFilter, setCambridgeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    passages,
    questions,
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

  useEffect(() => {
    fetchAllData(getApiFilters(), 1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestType, debouncedSearch, statusFilter, tierFilter, cambridgeFilter, fetchAllData]);

  const filteredTests = passages;

  const stats = {
    total: pagination.totalItems || passages.length,
    active: passages.filter((p) => p.is_active).length,
    draft: passages.filter((p) => !p.is_active).length,
    totalUsage: passages.reduce((sum, p) => sum + (p.usage_count || 0), 0),
  };

  const onSaveTest = async (testData, isDraft = false) => saveTest(testData, isDraft);

  const confirmDelete = async () => {
    if (testToDelete) {
      await deleteTest(testToDelete.id, getApiFilters());
      setTestToDelete(null);
    }
  };

  const handleTestTypeChange = (type) => {
    setSelectedTestType(type);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('testType', type);
      return newParams;
    });
  };

  const handleDuplicate = async (test) => duplicateTest(test.id, getApiFilters());

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 1) await importTest(files[0], getApiFilters());
      else if (files.length > 1) await bulkImportTests(files, getApiFilters());
    };
    input.click();
  };

  const handleBulkExport = async () => {
    if (selectedIds.length > 0) {
      await bulkExportTests(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    await bulkDeleteTests(selectedIds, getApiFilters());
    setShowBulkDeleteModal(false);
    setSelectedIds([]);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== 'all' || tierFilter !== 'all' || cambridgeFilter !== 'all';

  if (loading && passages.length === 0) {
    return <AdminPageSkeleton kpis={4} panels={0} rows={6} />;
  }

  if (isCreatingTest || editingTest) {
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="test-creator"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          <TestCreator
            initialData={editingTest}
            onSave={onSaveTest}
            onCancel={() => {
              const wasCreating = isCreatingTest;
              setIsCreatingTest(false);
              setEditingTest(null);
              fetchAllData(getApiFilters(), wasCreating ? 1 : pagination.page, pagination.pageSize);
            }}
            testType={editingTest ? editingTest.test_type : selectedTestType}
          />
        </m.div>
      </AnimatePresence>
    );
  }

  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-6 pt-12 md:pt-0"
    >
      <DeleteTestModal
        test={testToDelete}
        isOpen={!!testToDelete}
        onClose={() => setTestToDelete(null)}
        onConfirm={confirmDelete}
      />
      <BulkDeleteModal
        count={selectedIds.length}
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
      />

      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Test Management"
          description="Create, filter, and manage your IELTS test content library"
          tip="All tests, filterable by module."
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <AdminButton variant="outline">
                <MoreVertical className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                Actions
              </AdminButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleImportClick}>
                <ArrowDownCircle className="w-4 h-4 mr-2 text-stone-500" />
                Import data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkExport} disabled={selectedIds.length === 0}>
                <Download className="w-4 h-4 mr-2 text-stone-500" />
                Export selected ({selectedIds.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreatingTest(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AdminButton onClick={() => setIsCreatingTest(true)}>
            <Plus className="w-3.5 h-3.5" />
            Create test
          </AdminButton>
        </AdminPageHeader>
      </m.div>

      <m.div variants={FADE_UP} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Total tests" value={stats.total.toLocaleString()} />
        <Kpi label="Active" value={stats.active.toLocaleString()} />
        <Kpi label="Drafts" value={stats.draft.toLocaleString()} />
        <Kpi label="Total usage" value={stats.totalUsage.toLocaleString()} sub="sessions started" />
      </m.div>

      {/* Module tabs */}
      <m.div
        variants={FADE_UP}
        className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-white/4 rounded-lg border border-stone-200/80 dark:border-white/[0.07] w-full sm:w-fit overflow-x-auto no-scrollbar"
      >
        {TEST_STRUCTURES.map((typeInfo) => {
          const isActive = selectedTestType === typeInfo.key;
          const Icon = typeInfo.icon;
          return (
            <button
              key={typeInfo.key}
              onClick={() => handleTestTypeChange(typeInfo.key)}
              className={cn(
                'relative h-8 px-3.5 rounded-md font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors active:scale-[0.96]',
                isActive
                  ? 'text-stone-900 dark:text-stone-50'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              {isActive && (
                <m.span
                  layoutId="testTypeActivePill"
                  className="absolute inset-0 bg-white dark:bg-[#131315] rounded-md shadow-2xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  'relative z-10 w-3.5 h-3.5 transition-colors',
                  isActive && typeInfo.accent
                )}
              />
              <span className="relative z-10">{typeInfo.name}</span>
            </button>
          );
        })}
      </m.div>

      <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row gap-2.5 items-center p-3 border-b border-stone-100 dark:border-white/6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
            <Input
              placeholder={`Search ${selectedTestType} tests…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(FIELD_INPUT, 'pl-8 w-full')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(FIELD_INPUT, 'w-[110px]')}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className={cn(FIELD_INPUT, 'w-[110px]')}>
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cambridgeFilter} onValueChange={setCambridgeFilter}>
              <SelectTrigger className={cn(FIELD_INPUT, 'w-[130px]')}>
                <GraduationCap className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400 mr-1" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="cambridge">Cambridge only</SelectItem>
                <SelectItem value="standard">Standard tests</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTierFilter('all');
                  setCambridgeFilter('all');
                }}
                className={cn(
                  MICRO,
                  'h-8 px-2.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                )}
              >
                Reset
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)]">
              <span className={cn(MICRO, 'text-[rgb(var(--signal-warn))] shrink-0')}>
                {selectedIds.length} selected
              </span>
              <div className="w-px h-3.5 bg-[rgb(var(--signal-warn)/0.3)]" />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleBulkExport}
                  className={cn(
                    MICRO,
                    'px-1.5 py-1 rounded text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-white/5'
                  )}
                >
                  Export
                </button>
                <button
                  onClick={async () => {
                    await bulkUpdateStatus(selectedIds, true, getApiFilters());
                    setSelectedIds([]);
                  }}
                  className={cn(
                    MICRO,
                    'px-1.5 py-1 rounded text-[rgb(var(--signal-ok))] hover:bg-white/60 dark:hover:bg-white/5'
                  )}
                >
                  Activate
                </button>
                <button
                  onClick={async () => {
                    await bulkUpdateStatus(selectedIds, false, getApiFilters());
                    setSelectedIds([]);
                  }}
                  className={cn(
                    MICRO,
                    'px-1.5 py-1 rounded text-stone-500 hover:bg-white/60 dark:hover:bg-white/5'
                  )}
                >
                  Draft
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className={cn(
                    MICRO,
                    'inline-flex items-center gap-1 px-1.5 py-1 rounded text-[rgb(var(--signal-fault))] hover:bg-white/60 dark:hover:bg-white/5'
                  )}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={selectedTestType}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <TestTable
              tests={filteredTests}
              questions={questions}
              onEdit={setEditingTest}
              onDelete={setTestToDelete}
              onDuplicate={handleDuplicate}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onSort={handleSort}
              sortConfig={sortConfig}
              onExport={exportTest}
            />
          </m.div>
        </AnimatePresence>

        <div className="px-4 py-3 border-t border-stone-100 dark:border-white/6">
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => fetchAllData(getApiFilters(), page, pagination.pageSize)}
            pageSize={pagination.pageSize}
            onPageSizeChange={(size) => fetchAllData(getApiFilters(), 1, size)}
            totalItems={pagination.totalItems}
            itemName="tests"
          />
        </div>
      </m.div>
    </m.div>
  );
};

export default TestManagement;
