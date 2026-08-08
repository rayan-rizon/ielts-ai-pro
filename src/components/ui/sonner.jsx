'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

const Toaster = ({ ...props }) => {
  // Resolve the actual app theme before handing it to Sonner. Passing `system`
  // through can produce a dark toast over this app's light theme tokens.
  const { resolvedTheme = 'light' } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
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
