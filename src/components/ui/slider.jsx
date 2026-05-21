import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/cn';

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center group', className)}
    {...props}
    data-oid="89bjq0m"
  >
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-primary/20 dark:bg-primary/10 transition-all duration-200 group-hover:bg-primary/30 dark:group-hover:bg-primary/20"
      data-oid="xr8_6fh"
    >
      <SliderPrimitive.Range
        className="absolute h-full bg-gradient-to-r from-primary to-violet-600 dark:from-primary dark:to-violet-400 transition-all duration-200 shadow-sm"
        data-oid="ahgyjo8"
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-primary/50 dark:border-primary/60 bg-background dark:bg-slate-800 shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-110 hover:border-primary hover:shadow-xl hover:shadow-primary/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
      data-oid="-nn06ly"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
