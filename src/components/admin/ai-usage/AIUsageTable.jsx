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
      className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-slate-950 dark:hover:text-white transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-violet-600 dark:text-violet-400">
            {sortDirection === 'asc' ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <motion.div variants={itemVariants}>
      <Card className="border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900/90 rounded-2xl shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-100 dark:border-white/5">
          <CardTitle className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40">
              <Users className="w-4 h-4" />
            </div>
            <span>Usage Per Candidate & User</span>
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-white/5">
            <TableRow>
              <SortHeader field="name" label="Candidate User" />
              <SortHeader field="totalCalls" label="Total Calls" />
              <SortHeader field="cachedCalls" label="Cache Hits" />
              <SortHeader field="totalTokens" label="Total Tokens" />
              <SortHeader field="cost" label="Estimated Cost" />
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Top Endpoints & Models
              </TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Last Activity
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-4">
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
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="p-3 bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 rounded-xl border border-violet-200/50">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-extrabold text-xs text-slate-950 dark:text-white">
                      No AI usage data recorded
                    </p>
                    <p className="text-[11px] text-slate-500">
                      API consumption metrics will automatically stream here when candidates
                      initiate tests
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
