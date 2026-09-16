import React, { memo, useCallback } from 'react';
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
import { useAdminPaymentAlerts } from './useAdminPaymentAlerts';

/*
 * Same instrument-panel language as the rest of the admin area: graphite
 * surfaces, hairline rules, a neutral filled state for "active" rather than
 * a colour that could be mistaken for the health system's fault/warn/ok.
 */
const MICRO = 'text-[9px] font-bold uppercase tracking-[0.14em]';
const COLLAPSIBLE_LABEL =
  'inline-flex min-w-0 max-w-[12rem] overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none';
const COLLAPSIBLE_PROFILE_DETAILS =
  'flex min-w-0 flex-1 flex-col justify-center overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none';

const AdminNavItem = memo(
  ({ item, isActive, pendingCount = 0, stripePaymentCount = 0, stripeFailureCount = 0 }) => {
    const { isMobile, setOpenMobile } = useSidebar();
    const isPaymentsItem = item.title === 'Payments';
    const isNotificationsItem = item.title === 'Notifications';
    const badgeCount = pendingCount + stripePaymentCount + stripeFailureCount;
    const showBadge = (isPaymentsItem || isNotificationsItem) && badgeCount > 0;

    const handleLinkClick = useCallback(() => {
      if (isMobile) setOpenMobile(false);
    }, [isMobile, setOpenMobile]);

    const btnClasses = `group transition-all duration-quick ease-smooth-out rounded-md mb-0.5 relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] active:scale-[0.98] ${
      isActive
        ? 'bg-stone-900 hover:bg-stone-800 text-white hover:text-white dark:bg-white/10 dark:hover:bg-white/15 dark:text-stone-50 dark:hover:text-stone-50 font-bold'
        : 'text-stone-700 dark:text-stone-200 font-medium hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5'
    }`;

    const iconClasses = `w-4 h-4 transition-transform duration-quick ease-smooth-out group-hover:scale-105 ${
      isActive
        ? 'text-white dark:text-stone-50'
        : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100'
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
            <span className={`${COLLAPSIBLE_LABEL} truncate`}>{item.title}</span>
            {showBadge && (
              <span
                role="status"
                aria-label={
                  isNotificationsItem
                    ? `${pendingCount} pending payment approval${pendingCount === 1 ? '' : 's'}, ${stripePaymentCount} new Stripe payment${stripePaymentCount === 1 ? '' : 's'}, and ${stripeFailureCount} Stripe payment failure${stripeFailureCount === 1 ? '' : 's'}`
                    : `${badgeCount} payment alert${badgeCount === 1 ? '' : 's'}`
                }
                className={`ml-auto h-4.5 px-1.5 min-w-[18px] rounded-full grid place-items-center shrink-0 ${MICRO} font-mono tabular-nums tracking-tight transition-all duration-quick ease-bounce animate-in fade-in zoom-in-75 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[rgb(var(--signal-warn))] text-white'
                }`}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
);
AdminNavItem.displayName = 'AdminNavItem';

const AdminSidebarHeader = memo(() => (
  <SidebarHeader className="border-b border-stone-200/70 dark:border-white/6 p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
    <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
      <Link
        to={createPageUrl('AdminPanel')}
        className="relative flex h-8 items-center w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:mx-auto"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-95 transition-[opacity,transform] duration-150 ease-sidebar pointer-events-none group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:scale-100">
          <LogoIcon className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 max-w-[12rem] overflow-hidden opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:hidden">
          <Logo size="sm" />
          <span
            className={`${MICRO} text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/6 border border-stone-200 dark:border-white/10 px-1.5 py-0.5 rounded-md shrink-0`}
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
      <SidebarGroupLabel
        className={`${MICRO} text-stone-500 dark:text-stone-400 px-3 py-2 font-extrabold`}
      >
        Quick actions
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group w-full justify-start gap-3 px-3 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors font-medium"
              tooltip="Create Test"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=tests&action=create'}
                onClick={handleLinkClick}
              >
                <Plus className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                <span className={`${COLLAPSIBLE_LABEL} text-[13px]`}>Create test</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group w-full justify-start gap-3 px-3 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors font-medium"
              tooltip="Add Promo"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=promo&action=create'}
                onClick={handleLinkClick}
              >
                <Crown className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
                <span className={`${COLLAPSIBLE_LABEL} text-[13px]`}>Add promo</span>
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
    <SidebarFooter className="border-t border-stone-200/70 dark:border-white/6 p-3 group-data-[collapsible=icon]:p-2 space-y-1">
      <div className="flex justify-center mb-1">
        <SidebarTrigger
          className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md h-9 w-9 transition-colors"
          aria-label="Toggle admin sidebar"
        />
      </div>

      <div className="flex justify-center">
        <ThemeToggle />
      </div>

      <div className="bg-stone-50 dark:bg-white/3 hover:bg-stone-100 dark:hover:bg-white/6 p-2 rounded-xl flex items-center gap-3 overflow-hidden cursor-pointer transition-colors border border-stone-200/70 dark:border-white/6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 my-1">
        <div className="w-8 h-8 bg-stone-900 dark:bg-white/10 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-white dark:text-stone-50 font-bold text-xs">
            {user?.full_name?.[0] || 'A'}
          </span>
        </div>
        <div className={COLLAPSIBLE_PROFILE_DETAILS}>
          <p className="font-bold text-stone-900 dark:text-stone-50 text-xs truncate leading-none mb-1">
            {user?.full_name || 'Admin User'}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--signal-ok))]" />
            <span className={`${MICRO} text-stone-500 dark:text-stone-400`}>Administrator</span>
          </div>
        </div>
      </div>

      <SidebarMenuButton
        onClick={onLogoutClick}
        aria-label="Sign out"
        tooltip="Sign out"
        className="group w-full justify-start gap-3 px-3 py-2 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] group-data-[collapsible=icon]:px-2.5"
      >
        <LogOut className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors" />
        <span className={`${COLLAPSIBLE_LABEL} text-[13px]`}>Sign out</span>
      </SidebarMenuButton>
    </SidebarFooter>
  );
});
AdminSidebarFooter.displayName = 'AdminSidebarFooter';

function checkIsActiveAdminRoute(currentPath, currentSearch, itemUrl) {
  const fullPath = currentPath + currentSearch;
  if (fullPath === itemUrl) return true;
  if (!itemUrl.includes('AdminPanel')) return false;
  if (!currentPath.includes('AdminPanel')) return false;

  const hasTab = itemUrl.includes('tab=');
  if (hasTab) {
    const [, tabParam] = itemUrl.split('?');
    return tabParam ? currentSearch.includes(tabParam) : false;
  }

  return !currentSearch.includes('tab=');
}

export const AdminSidebar = memo(({ user, location, handleLogout }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const currentPath = location.pathname;
  const currentSearch = location.search || '';
  const isOnPaymentsTab = currentSearch.includes('tab=payments');
  const { pendingCount, stripePaymentCount, stripeFailureCount } = useAdminPaymentAlerts({
    isOnPaymentsTab,
  });

  const isActiveAdminRoute = useCallback(
    (itemUrl) => checkIsActiveAdminRoute(currentPath, currentSearch, itemUrl),
    [currentPath, currentSearch]
  );

  return (
    <>
      <AdminSidebarHeader />
      <SidebarContent className="p-3 group-data-[collapsible=icon]:p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={`${MICRO} text-stone-500 dark:text-stone-400 px-3 py-2`}>
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
                  stripePaymentCount={stripePaymentCount}
                  stripeFailureCount={stripeFailureCount}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={`${MICRO} text-stone-500 dark:text-stone-400 px-3 py-2`}>
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
