'use client';
import { useTheme } from '@/components/theme-provider';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  // Use the same provider as the rest of the app so toast surfaces follow the
  // user's selected theme instead of reading an unmounted next-themes context.
  const { theme = 'light' } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-xl !border !border-stone-200 !bg-white !p-4 !text-stone-900 dark:!border-white/10 dark:!bg-[#18171d] dark:!text-white',
          title: '!text-sm !font-bold !text-stone-900 dark:!text-white',
          description: '!text-xs !font-medium !text-stone-600 !opacity-100 dark:!text-stone-300',
          actionButton: 'group-[.toast]:!bg-[#5a63df] group-[.toast]:!text-white !font-bold',
          cancelButton:
            'group-[.toast]:!bg-stone-100 group-[.toast]:!text-stone-700 dark:group-[.toast]:!bg-white/10 dark:group-[.toast]:!text-stone-200 !font-medium',
        },
      }}
      {...props}
      data-oid="au_d3h6"
    />
  );
};

export { Toaster };
