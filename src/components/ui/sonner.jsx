'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white/95 dark:group-[.toaster]:bg-slate-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-white group-[.toaster]:border-slate-200/90 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4',
          title: 'text-slate-900! dark:text-white! font-bold! text-sm',
          description: 'text-slate-600! dark:text-slate-300! font-medium! text-xs opacity-100!',
          actionButton: 'group-[.toast]:bg-indigo-600 group-[.toast]:text-white font-bold',
          cancelButton:
            'group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300 font-medium',
        },
      }}
      {...props}
      data-oid="au_d3h6"
    />
  );
};

export { Toaster };
