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
      className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300 cursor-pointer select-none hover:bg-violet-100/50 dark:hover:bg-violet-900/30 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-violet-500">
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
      <Card className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            Usage Per User
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20">
            <TableRow>
              <SortHeader field="name" label="User" />
              <SortHeader field="totalCalls" label="Total Calls" />
              <SortHeader field="cachedCalls" label="Cached" />
              <SortHeader field="totalTokens" label="Tokens" />
              <SortHeader field="cost" label="Cost" />
              <TableHead className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300">
                Top Endpoints & Models
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300">
                Last Activity
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-4">
                    <Skeleton className="h-12 w-full" />
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
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="p-4 bg-violet-500/10 rounded-full">
                      <Users className="w-8 h-8 text-violet-500" />
                    </div>
                    <p className="font-medium">No usage data found</p>
                    <p className="text-sm opacity-70">
                      AI API calls will appear here once users start using AI features
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-border/40">
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
