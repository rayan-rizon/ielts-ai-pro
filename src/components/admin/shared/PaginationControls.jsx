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
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4"
      data-oid=".ljspdl"
    >
      <div className="text-sm text-muted-foreground order-2 sm:order-1" data-oid="ihch7:v">
        Showing{' '}
        <span className="font-medium" data-oid="7c24dd:">
          {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
        </span>{' '}
        to{' '}
        <span className="font-medium" data-oid="9toauz7">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{' '}
        of{' '}
        <span className="font-medium" data-oid="elcf:bh">
          {totalItems}
        </span>{' '}
        {itemName}
      </div>

      <div className="flex items-center space-x-2 order-1 sm:order-2" data-oid="c7aj12i">
        <div className="flex items-center space-x-2 mr-4 hidden sm:flex" data-oid="v_da2:h">
          <span className="text-sm text-muted-foreground" data-oid="hh02uah">
            Rows per page
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
            data-oid="-82u-ij"
          >
            <SelectTrigger className="h-8 w-[70px]" data-oid="5l6t6er">
              <SelectValue placeholder={pageSize} data-oid="chhi2e2" />
            </SelectTrigger>
            <SelectContent data-oid="ydop_gl">
              <SelectItem value="10" data-oid="h8m.m_2">
                10
              </SelectItem>
              <SelectItem value="20" data-oid="gmg-gjp">
                20
              </SelectItem>
              <SelectItem value="50" data-oid="d:q.fl.">
                50
              </SelectItem>
              <SelectItem value="100" data-oid="urdcs-9">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-1" data-oid="tq.z0yc">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            data-oid="6yr:-ax"
          >
            <span className="sr-only" data-oid="p0c1s01">
              Go to first page
            </span>
            <ChevronsLeft className="h-4 w-4" data-oid="5ngnbss" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            data-oid="ggjy4xq"
          >
            <span className="sr-only" data-oid="8f:pz9f">
              Go to previous page
            </span>
            <ChevronLeft className="h-4 w-4" data-oid="7i8bre9" />
          </Button>

          <div
            className="flex items-center justify-center text-sm font-medium w-[100px]"
            data-oid="hw_-fay"
          >
            Page {currentPage} of {totalPages || 1}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            data-oid="ptew0_o"
          >
            <span className="sr-only" data-oid="2mvec3.">
              Go to next page
            </span>
            <ChevronRight className="h-4 w-4" data-oid=":b4q7d9" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            data-oid="le7wvsq"
          >
            <span className="sr-only" data-oid="pj3e.c1">
              Go to last page
            </span>
            <ChevronsRight className="h-4 w-4" data-oid="zgmb3-0" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
