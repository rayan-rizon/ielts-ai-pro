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
      className="relative h-2 w-full grow overflow-hidden rounded-full bg-[#5a63df]/[0.14] transition-all duration-200 group-hover:bg-[#5a63df]/20 dark:bg-white/[0.07] dark:group-hover:bg-white/10"
      data-oid="xr8_6fh"
    >
      <SliderPrimitive.Range
        className="absolute h-full bg-[#5a63df] dark:bg-[#8f97ff] transition-all duration-200"
        data-oid="ahgyjo8"
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="block h-5 w-5 rounded-full border-2 border-[#5a63df] bg-white shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer dark:border-[#8f97ff] dark:bg-[#131315] dark:focus-visible:ring-[#8f97ff]/40"
      data-oid="-nn06ly"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
