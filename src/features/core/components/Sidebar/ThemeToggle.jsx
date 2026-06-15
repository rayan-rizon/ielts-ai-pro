import { memo } from 'react';
import { m } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { SidebarMenuButton } from '@/components/ui/sidebar';

export const ThemeToggle = memo(() => {
  const { theme, setTheme } = useTheme();

  return (
    <m.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
      data-oid="2ygmuhb"
    >
      <SidebarMenuButton
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-full gap-3 px-3 text-foreground/80 dark:text-foreground/80 hover:text-primary hover:bg-primary/10 dark:hover:bg-indigo-500/22 dark:hover:text-indigo-300 rounded-xl transition-all duration-300 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center border border-transparent hover:border-primary/20 dark:hover:border-indigo-400/40"
        aria-label="Toggle theme"
        data-oid="u5pktta"
      >
        <div className="relative w-4 h-4 flex items-center justify-center" data-oid="3gfk7xp">
          <Sun
            className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute"
            data-oid="z.-9mm5"
          />

          <Moon
            className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute"
            data-oid="ry:u2rw"
          />
        </div>
        <span
          className="font-semibold text-sm group-data-[collapsible=icon]:hidden"
          data-oid="avz.9tb"
        >
          Appearance
        </span>
      </SidebarMenuButton>
    </m.div>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
