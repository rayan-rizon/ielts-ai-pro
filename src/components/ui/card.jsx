import * as React from 'react';
import PropTypes from 'prop-types';

import { cn } from '@/lib/utils';

/** Shared propTypes for card components */
const cardPropTypes = {
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Card content */
  children: PropTypes.node,
};

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
    {...props}
    data-oid="f4ckbhz"
  />
));
Card.displayName = 'Card';
Card.propTypes = cardPropTypes;

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
    data-oid="qqza517"
  />
));
CardHeader.displayName = 'CardHeader';
CardHeader.propTypes = cardPropTypes;

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
    data-oid="kpzb1gf"
  />
));
CardTitle.displayName = 'CardTitle';
CardTitle.propTypes = cardPropTypes;

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
    data-oid="v9gyds_"
  />
));
CardDescription.displayName = 'CardDescription';
CardDescription.propTypes = cardPropTypes;

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} data-oid=".:iqywc" />
));
CardContent.displayName = 'CardContent';
CardContent.propTypes = cardPropTypes;

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
    data-oid="mc6hom_"
  />
));
CardFooter.displayName = 'CardFooter';
CardFooter.propTypes = cardPropTypes;

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
