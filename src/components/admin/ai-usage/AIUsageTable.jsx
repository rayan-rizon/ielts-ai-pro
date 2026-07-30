import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';

import PaginationControls from '../shared/PaginationControls';
import AIUsageTableRow from './AIUsageTableRow';

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
  itemVariants,
}) => {
  const SortHeader = ({ field, label }) => (
    <TableHead
      className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-slate-950 dark:hover:text-white transition-colors py-3.5 px-4"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {sortField === field && (
          <span className="text-violet-600 dark:text-violet-400">
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/50 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black">Usage Per Candidate & User</span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                Detailed telemetry per active user account
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <Table className="min-w-[950px]">
            <TableHeader className="bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/5">
              <TableRow>
                <SortHeader field="name" label="Candidate User" />
                <SortHeader field="totalCalls" label="Requests" />
                <SortHeader field="completedCalls" label="Delivery" />
                <SortHeader field="cachedCalls" label="Cache Hits" />
                <SortHeader field="totalTokens" label="Total Tokens" />
                <SortHeader field="cost" label="Tracked Cost" />
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 px-4">
                  Top Endpoints & Models
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3.5 px-4">
                  Last Activity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedUsers.length > 0 ? (
                sortedUsers.map((row, idx) => (
                  <AIUsageTableRow
                    key={row.user?.id || idx}
                    row={row}
                    idx={idx}
                    maxCalls={maxCalls}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 rounded-xl border border-violet-200/50">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-extrabold text-xs text-slate-950 dark:text-white">
                        No AI usage data recorded
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Request delivery, provider cost telemetry, and cache activity will appear
                        here as candidates use AI features.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
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
      </Card>
    </motion.div>
  );
};

export default AIUsageTable;
