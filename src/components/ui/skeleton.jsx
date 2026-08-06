import { cn } from '@/lib/cn';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-slate-200/80 dark:bg-slate-800/50',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]',
        'before:bg-linear-to-r/srgb before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
      data-oid="oz.qai1"
    />
  );
}

export { Skeleton };
