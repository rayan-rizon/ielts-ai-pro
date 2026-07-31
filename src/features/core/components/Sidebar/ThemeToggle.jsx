import { memo } from 'react';
import { SunMedium, MoonStar } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar';

export const ThemeToggle = memo(() => {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenuButton
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="group w-full justify-start gap-3 px-3 py-2 text-stone-700 dark:text-stone-200 font-medium hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!gap-0"
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <SunMedium className="h-4 w-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
        <MoonStar className="h-4 w-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
      </div>
      <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">
        Appearance
      </span>
    </SidebarMenuButton>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
