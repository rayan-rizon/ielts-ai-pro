import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { NUM } from '@/features/dashboard/components/primitives';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems,
  itemName = 'items',
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-xs text-stone-500 dark:text-stone-400 order-2 sm:order-1">
        Showing{' '}
        <span className={cn(NUM, 'font-semibold text-stone-800 dark:text-stone-200')}>
          {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
        </span>{' '}
        to{' '}
        <span className={cn(NUM, 'font-semibold text-stone-800 dark:text-stone-200')}>
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of{' '}
        <span className={cn(NUM, 'font-semibold text-stone-800 dark:text-stone-200')}>
          {totalItems}
        </span>{' '}
        {itemName}
      </div>

      <div className="flex items-center space-x-2 order-1 sm:order-2">
        <div className="flex items-center space-x-2 mr-4 hidden sm:flex">
          <span className="text-xs text-stone-500 dark:text-stone-400">Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="h-8 w-[70px] text-xs font-mono border-stone-200 dark:border-white/10 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
            >
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10" className="text-xs font-mono">
                10
              </SelectItem>
              <SelectItem value="20" className="text-xs font-mono">
                20
              </SelectItem>
              <SelectItem value="50" className="text-xs font-mono">
                50
              </SelectItem>
              <SelectItem value="100" className="text-xs font-mono">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Go to first page"
            className="h-8 w-8 lg:flex border-stone-200 dark:border-white/10 transition-all duration-150 ease-smooth-out active:scale-90 hover:bg-stone-100 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Go to previous page"
            className="h-8 w-8 border-stone-200 dark:border-white/10 transition-all duration-150 ease-smooth-out active:scale-90 hover:bg-stone-100 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center justify-center text-xs font-medium text-stone-600 dark:text-stone-300 w-[110px]">
            Page <span className={cn(NUM, 'mx-1 font-semibold')}>{currentPage}</span> of{' '}
            <span className={cn(NUM, 'mx-1 font-semibold')}>{totalPages || 1}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Go to next page"
            className="h-8 w-8 border-stone-200 dark:border-white/10 transition-all duration-150 ease-smooth-out active:scale-90 hover:bg-stone-100 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Go to last page"
            className="h-8 w-8 lg:flex border-stone-200 dark:border-white/10 transition-all duration-150 ease-smooth-out active:scale-90 hover:bg-stone-100 dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#5a63df]/50"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
