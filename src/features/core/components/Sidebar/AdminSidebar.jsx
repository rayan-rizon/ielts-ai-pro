import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { Plus, Crown, LogOut } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { createPageUrl } from '@/utils';
import { adminNavigationItems, analyticsNavigationItems } from './navigationItems';
import { ThemeToggle } from './ThemeToggle';
import { supabase } from '@/lib/supabase';

/*
 * Same instrument-panel language as the rest of the admin area: graphite
 * surfaces, hairline rules, a neutral filled state for "active" rather than
 * a colour that could be mistaken for the health system's fault/warn/ok.
 */
const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';

// Memoized Nav Item for Admin Sidebar
const AdminNavItem = memo(({ item, isActive, pendingCount = 0 }) => {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const btnClasses = `group transition-colors rounded-md mb-0.5 relative overflow-hidden ${
    isActive
      ? 'bg-stone-900 dark:bg-white/10 text-white dark:text-stone-50 font-bold'
      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5'
  }`;

  const iconClasses = `w-4 h-4 transition-colors ${
    isActive
      ? 'text-white dark:text-stone-50'
      : 'text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
  }`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className={btnClasses} tooltip={item.title}>
        <Link
          to={item.url}
          className="flex items-center gap-3 px-3 py-2 text-[13px] relative z-10"
          onClick={handleLinkClick}
        >
          <item.icon className={iconClasses} />
          <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
          {item.title === 'Payments' && pendingCount > 0 && (
            <span
              className={`ml-auto h-4.5 px-1.5 min-w-[18px] rounded-full grid place-items-center shrink-0 ${MICRO} ${
                isActive ? 'bg-white/20 text-white' : 'bg-[rgb(var(--signal-warn))] text-white'
              }`}
            >
              {pendingCount}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
AdminNavItem.displayName = 'AdminNavItem';

const AdminSidebarHeader = memo(() => (
  <SidebarHeader className="border-b border-stone-200/70 dark:border-white/[0.06] p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
    <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
      <Link
        to="/admin"
        className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto"
      >
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center shrink-0 w-8 h-8 mx-auto">
          <LogoIcon className="w-8 h-8" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2">
          <Logo size="sm" />
          <span
            className={`${MICRO} text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/[0.06] border border-stone-200 dark:border-white/10 px-1.5 py-0.5 rounded-md shrink-0`}
          >
            Admin
          </span>
        </div>
      </Link>
    </div>
  </SidebarHeader>
));
AdminSidebarHeader.displayName = 'AdminSidebarHeader';

const AdminSidebarQuickActions = memo(({ isMobile, setOpenMobile }) => {
  const handleLinkClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  return (
    <SidebarGroup className="mt-4">
      <SidebarGroupLabel className={`${MICRO} text-stone-400 px-3 py-2`}>
        Quick actions
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="w-full justify-start gap-3 px-3 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors"
              tooltip="Create Test"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=tests&action=create'}
                onClick={handleLinkClick}
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">
                  Create test
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="w-full justify-start gap-3 px-3 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors"
              tooltip="Add Promo"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=promo&action=create'}
                onClick={handleLinkClick}
              >
                <Crown className="w-4 h-4" />
                <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">
                  Add promo
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
AdminSidebarQuickActions.displayName = 'AdminSidebarQuickActions';

const AdminSidebarFooter = memo(({ user, isMobile, setOpenMobile, handleLogout }) => {
  const onLogoutClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
    handleLogout();
  }, [isMobile, setOpenMobile, handleLogout]);

  return (
    <SidebarFooter className="border-t border-stone-200/70 dark:border-white/[0.06] p-3 group-data-[collapsible=icon]:p-2">
      <div className="space-y-2">
        <div className="flex justify-center mb-1">
          <SidebarTrigger
            className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md h-9 w-9 transition-colors"
            aria-label="Toggle admin sidebar"
          />
        </div>

        <ThemeToggle />

        <div className="bg-stone-50 dark:bg-white/[0.03] hover:bg-stone-100 dark:hover:bg-white/[0.06] p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition-colors border border-stone-200/70 dark:border-white/[0.06] group-data-[collapsible=icon]:justify-center">
          <div className="w-9 h-9 bg-stone-900 dark:bg-white/10 rounded-md flex items-center justify-center flex-shrink-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
            <span className="text-white dark:text-stone-50 font-bold text-sm">
              {user?.full_name?.[0] || 'A'}
            </span>
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="font-bold text-stone-900 dark:text-stone-50 text-xs truncate leading-none mb-1">
              {user?.full_name || 'Admin User'}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
              <span className={`${MICRO} text-stone-400`}>Administrator</span>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <SidebarMenuButton
            onClick={onLogoutClick}
            className="w-full justify-start gap-3 px-3 text-stone-500 dark:text-stone-400 hover:text-[rgb(var(--signal-fault))] hover:bg-[rgb(var(--signal-fault)/0.08)] rounded-md transition-colors group-data-[collapsible=icon]:px-2.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-[13px] group-data-[collapsible=icon]:hidden">
              Sign out
            </span>
          </SidebarMenuButton>
        </div>
      </div>
    </SidebarFooter>
  );
});
AdminSidebarFooter.displayName = 'AdminSidebarFooter';

export const AdminSidebar = memo(({ user, location, handleLogout }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const [pendingCount, setPendingCount] = useState(0);

  const currentPath = location.pathname;
  const currentSearch = location.search || '';
  const isOnPaymentsTab = currentSearch.includes('tab=payments');

  useEffect(() => {
    let mounted = true;

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!mounted || error || isOnPaymentsTab) return;
      setPendingCount(count || 0);
    };

    fetchPendingCount();

    let channel;
    if (typeof window !== 'undefined' && window.WebSocket) {
      try {
        channel = supabase
          .channel('payment_updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () =>
            fetchPendingCount()
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.warn('Realtime subscription error in AdminSidebar: Connection failed');
            }
          });
      } catch (err) {
        console.warn('Failed to initialize Realtime subscription in AdminSidebar:', err.message);
      }
    } else {
      console.info('WebSockets not available or disabled (AdminSidebar)');
    }

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isOnPaymentsTab]);

  useEffect(() => {
    if (isOnPaymentsTab) {
      setPendingCount(0);
    }
  }, [isOnPaymentsTab]);

  const isActiveAdminRoute = useMemo(
    () => (itemUrl) => {
      const fullPath = currentPath + currentSearch;
      if (fullPath === itemUrl) return true;
      if (!itemUrl.includes('AdminPanel')) return false;
      if (!currentPath.includes('AdminPanel')) return false;

      const hasTab = itemUrl.includes('tab=');
      if (hasTab && currentSearch.includes(itemUrl.split('?')[1])) return true;
      if (!hasTab && !currentSearch.includes('tab=')) return true;

      return false;
    },
    [currentPath, currentSearch]
  );

  return (
    <>
      <AdminSidebarHeader />
      <SidebarContent className="p-3 group-data-[collapsible=icon]:p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={`${MICRO} text-stone-400 px-3 py-2`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavigationItems.map((item) => (
                <AdminNavItem
                  key={item.title}
                  item={item}
                  isActive={isActiveAdminRoute(item.url)}
                  pendingCount={pendingCount}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={`${MICRO} text-stone-400 px-3 py-2`}>
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsNavigationItems.map((item) => (
                <AdminNavItem
                  key={item.title}
                  item={item}
                  isActive={isActiveAdminRoute(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <AdminSidebarQuickActions isMobile={isMobile} setOpenMobile={setOpenMobile} />
      </SidebarContent>

      <AdminSidebarFooter
        user={user}
        isMobile={isMobile}
        setOpenMobile={setOpenMobile}
        handleLogout={handleLogout}
      />
    </>
  );
});

AdminSidebar.displayName = 'AdminSidebar';
