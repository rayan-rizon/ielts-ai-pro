import { Loader2 } from 'lucide-react';

/**
 * Loading fallback component for React.lazy Suspense boundaries.
 * Shows a centered spinner with optional message.
 *
 * @param {Object} props
 * @param {string} props.message - Loading message to display
 */
export default function LoadingFallback({ message = 'Loading...' }) {
  return (
    <div
      className="relative h-full w-full p-8 md:p-12 space-y-8 animate-in fade-in duration-500 overflow-hidden"
      data-oid="ix6c9yo"
    >
      {/* Structural Page Shell Skeleton */}
      <div className="flex flex-col gap-4" data-oid="n:q476l">
        <div className="h-10 w-48 bg-slate-200/60 dark:bg-slate-800/40 rounded-xl animate-pulse" />
        <div className="h-4 w-32 bg-slate-200/40 dark:bg-slate-800/20 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8" data-oid="shell-grid">
        <div className="md:col-span-8 space-y-6">
          <div className="h-64 w-full bg-slate-200/60 dark:bg-slate-800/40 rounded-[2.5rem] animate-pulse" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-32 bg-slate-200/40 dark:bg-slate-800/20 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-200/40 dark:bg-slate-800/20 rounded-3xl animate-pulse" />
          </div>
        </div>
        <div className="md:col-span-4 space-y-6">
          <div className="h-[400px] w-full bg-slate-200/40 dark:bg-slate-800/20 rounded-[2.5rem] animate-pulse" />
        </div>
      </div>

      {/* Floating Spinner Overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-2xl flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" data-oid="px2jgv8" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-500 animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
