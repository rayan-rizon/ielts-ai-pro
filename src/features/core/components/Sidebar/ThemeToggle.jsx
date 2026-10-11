import { memo } from 'react';
import { SunMedium, MoonStar } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar';

export const ThemeToggle = memo(() => {
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <SidebarMenuButton
      onClick={() => setTheme(nextTheme)}
      className="group/theme-toggle w-full justify-start gap-2.5 px-2.5 h-7.5 text-xs text-slate-700 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/8 rounded-md transition-colors group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0!"
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === 'dark'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <SunMedium className="h-4 w-4 text-slate-500 dark:text-slate-300 group-hover/theme-toggle:text-slate-900 dark:group-hover/theme-toggle:text-white rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute" />
        <MoonStar className="h-4 w-4 text-slate-500 dark:text-slate-300 group-hover/theme-toggle:text-slate-900 dark:group-hover/theme-toggle:text-white rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
      </div>
      <span className="font-medium text-xs group-data-[collapsible=icon]:hidden">Appearance</span>
    </SidebarMenuButton>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
