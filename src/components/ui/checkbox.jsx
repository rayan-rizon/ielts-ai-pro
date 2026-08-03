import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/cn';

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow transition-all duration-150 ease-sidebar hover:scale-110 active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
    data-oid="p6iec9t"
  >
    {/* The check mark pops in rather than just appearing — the one moment a
        checkbox actually confirms something happened deserves a beat of its
        own, not just a colour swap. */}
    <CheckboxPrimitive.Indicator
      className={cn(
        'flex items-center justify-center text-current motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-150'
      )}
      data-oid="4v.vax:"
    >
      <Check className="h-4 w-4" data-oid="aw4u1:p" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
