// Shared surface tokens for the band score calculator page. Flat fills only —
// the page deliberately avoids gradient surfaces so the numbers stay dominant.

export const panelClass =
  'overflow-hidden rounded-[20px] border border-[#e2e5fa] bg-white shadow-[0_20px_50px_-30px_rgba(79,66,220,0.22)] dark:border-white/8 dark:bg-[#111114] dark:shadow-none';

export const railLabelClass =
  'block text-[10px] font-black uppercase tracking-[0.13em] text-[#8b93ad] dark:text-slate-500';

export const segmentBaseClass =
  'h-8 rounded-[10px] px-3 text-[11.5px] font-black transition-colors duration-150';

export const segmentActiveClass = 'bg-[#6256ef] text-white';

export const segmentIdleClass =
  'bg-[#f3f4fb] text-[#5c6687] hover:bg-[#e8eaf6] dark:bg-white/[0.05] dark:text-slate-400 dark:hover:bg-white/10';
