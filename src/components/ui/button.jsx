import * as React from 'react';
import PropTypes from 'prop-types';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/cn';

/**
 * Every button on the site renders through here, so this is the single
 * highest-leverage place to add feel: a shared press-scale on every variant,
 * plus a small hover lift on the variants that read as solid, physical
 * surfaces. `ghost` and `link` skip the lift — they usually sit inline with
 * text, where a rising surface reads as a layout glitch rather than polish.
 * `ease-sidebar` is the same expo-out curve the sidebar's active state
 * already uses, so this doesn't introduce a second motion "voice".
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-sidebar active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:-translate-y-px hover:shadow-md',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:-translate-y-px hover:shadow-md',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-y-px hover:shadow-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:-translate-y-px hover:shadow-md',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
      data-oid="1j7fvzc"
    />
  );
});
Button.displayName = 'Button';

Button.propTypes = {
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Button style variant */
  variant: PropTypes.oneOf(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
  /** Button size */
  size: PropTypes.oneOf(['default', 'sm', 'lg', 'icon']),
  /** Render as child component (Slot) */
  asChild: PropTypes.bool,
  /** Button content */
  children: PropTypes.node,
  /** Disabled state */
  disabled: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Button type */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export { Button, buttonVariants };
