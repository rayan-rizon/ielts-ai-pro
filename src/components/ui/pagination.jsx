import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/cn';
import { buttonVariants } from '@/components/ui/button';

const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
    data-oid="b-rusq1"
  />
);

Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
    data-oid="fp_hc-6"
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} data-oid="i-y0e47" />
));
PaginationItem.displayName = 'PaginationItem';

const PaginationLink = ({ className, isActive, size = 'icon', ...props }) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className
    )}
    {...props}
    data-oid="v08l79."
  />
);

PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
    data-oid="m8xdhva"
  >
    <ChevronLeft className="h-4 w-4" data-oid="82.p-fl" />
    <span data-oid="x88heqd">Previous</span>
  </PaginationLink>
);

PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
    data-oid="a.pv14h"
  >
    <span data-oid="dqryn1e">Next</span>
    <ChevronRight className="h-4 w-4" data-oid="yehh3m8" />
  </PaginationLink>
);

PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
    data-oid="vwjmeye"
  >
    <MoreHorizontal className="h-4 w-4" data-oid="8k9ut09" />
    <span className="sr-only" data-oid="rxa9u1.">
      More pages
    </span>
  </span>
);

PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
