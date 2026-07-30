import { ChevronDown, ChevronUp, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO, PANEL, InfoTip } from '../ui/primitives';
import PaginationControls from '../shared/PaginationControls';
import AIUsageTableRow from './AIUsageTableRow';

const COLUMNS = [
  { field: 'name', label: 'User' },
  { field: 'totalCalls', label: 'Requests' },
  { field: 'completedCalls', label: 'Delivery' },
  { field: 'cachedCalls', label: 'Cache' },
  { field: 'totalTokens', label: 'Tokens' },
  { field: 'cost', label: 'Cost' },
  { field: null, label: 'Top endpoints' },
  { field: null, label: 'Last activity' },
];

const AIUsageTable = ({
  sortedUsers,
  loading,
  sortField,
  sortDirection,
  handleSort,
  maxCalls,
  currentPage,
  totalPages,
  setCurrentPage,
  pageSize,
  setPageSize,
  totalItems,
}) => (
  <div className={cn(PANEL, 'overflow-hidden')}>
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-white/[0.06]">
      <div className="flex items-center gap-1.5">
        <h3 className={cn(MICRO, 'text-stone-400')}>Usage per user</h3>
        <InfoTip>
          Every user with at least one AI call in this window. Click a column header to sort.
        </InfoTip>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200 dark:border-white/[0.07]">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                onClick={col.field ? () => handleSort(col.field) : undefined}
                className={cn(
                  MICRO,
                  'px-4 py-2.5 text-stone-400 font-bold',
                  col.field &&
                    'cursor-pointer select-none hover:text-stone-700 dark:hover:text-stone-200'
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortField === col.field &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-2.5 h-2.5" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                <span className={cn(MICRO, 'text-stone-400')}>Loading usage data</span>
              </td>
            </tr>
          ) : sortedUsers.length > 0 ? (
            sortedUsers.map((row, idx) => (
              <AIUsageTableRow key={row.user?.id || idx} row={row} maxCalls={maxCalls} />
            ))
          ) : (
            <tr>
              <td colSpan={8} className="py-16 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                <p className={cn(MICRO, 'text-stone-400')}>No AI usage data recorded</p>
              </td>
            </tr>
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
);

export default AIUsageTable;
