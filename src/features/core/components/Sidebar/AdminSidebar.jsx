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
import { useAdminBadges } from './useAdminBadges';

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

const AdminNavItem = memo(({ item, isActive, badges = {} }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const tab = new URLSearchParams(item.url.split('?')[1] || '').get('tab');
  const paymentCount =
    (badges.pendingCount || 0) +
    (badges.stripePaymentCount || 0) +
    (badges.stripeFailureCount || 0);
  const badgeByTab = {
    payments: [paymentCount, 'new payment alerts'],
    'feature-requests': [badges.featureRequestCount || 0, 'feature requests awaiting review'],
    'test-reports': [badges.testReportCount || 0, 'unresolved test reports'],
    institutions: [badges.institutionRequestCount || 0, 'institution requests awaiting review'],
  };
  const [badgeCount, badgeLabel] = badgeByTab[tab] || [0, ''];
  const showBadge = badgeCount > 0;

  const handleLinkClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const btnClasses = `group transition-all duration-quick ease-smooth-out rounded-md relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] active:scale-[0.98] ${
    isActive
      ? 'bg-stone-900 hover:bg-stone-800 text-white hover:text-white dark:bg-white/10 dark:hover:bg-white/15 dark:text-stone-50 dark:hover:text-stone-50 font-bold'
      : 'text-stone-700 dark:text-stone-200 font-medium hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5'
  }`;

  const iconClasses = `w-4 h-4 shrink-0 transition-transform duration-quick ease-smooth-out group-hover:scale-105 ${
    isActive
      ? 'text-white dark:text-stone-50'
      : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100'
  }`;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={btnClasses}
        tooltip={showBadge ? `${item.title} (${badgeCount > 99 ? '99+' : badgeCount})` : item.title}
      >
        <Link
          to={item.url}
          className="flex h-7.5 items-center gap-2.5 px-2.5 text-xs relative z-10"
          onClick={handleLinkClick}
        >
          <item.icon className={iconClasses} />
          <span className={`${COLLAPSIBLE_LABEL} truncate`}>{item.title}</span>
          {showBadge && (
            <span
              role="status"
              aria-label={`${badgeCount > 99 ? '99+' : badgeCount} ${badgeLabel}${badges.stale ? ' (last known count)' : ''}`}
              className={`ml-auto h-4 px-1 min-w-[16px] rounded-full grid place-items-center shrink-0 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:size-1.5 group-data-[collapsible=icon]:min-w-0 group-data-[collapsible=icon]:p-0 ${MICRO} font-mono tabular-nums tracking-tight transition-all duration-quick ease-bounce animate-in fade-in zoom-in-75 ${
                isActive ? 'bg-white/20 text-white' : 'bg-[rgb(var(--signal-warn))] text-white'
              }`}
            >
              <span className="group-data-[collapsible=icon]:sr-only">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
AdminNavItem.displayName = 'AdminNavItem';

const AdminSidebarHeader = memo(() => (
  <SidebarHeader className="border-b border-stone-200/70 dark:border-white/6 px-3 py-2.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
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
    <SidebarGroup className="mt-1">
      <SidebarGroupLabel
        className={`${MICRO} h-5 px-2 text-stone-400 dark:text-stone-500 font-extrabold`}
      >
        Quick actions
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group w-full justify-start rounded-md text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors font-medium active:scale-[0.98]"
              tooltip="Create Test"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=tests&action=create'}
                className="flex h-7.5 items-center gap-2.5 px-2.5 text-xs relative z-10"
                onClick={handleLinkClick}
              >
                <Plus className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0" />
                <span className={`${COLLAPSIBLE_LABEL} text-xs`}>Create test</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="group w-full justify-start rounded-md text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors font-medium active:scale-[0.98]"
              tooltip="Add Promo"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=promo&action=create'}
                className="flex h-7.5 items-center gap-2.5 px-2.5 text-xs relative z-10"
                onClick={handleLinkClick}
              >
                <Crown className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0" />
                <span className={`${COLLAPSIBLE_LABEL} text-xs`}>Add promo</span>
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
    <SidebarFooter className="border-t border-stone-200/70 dark:border-white/6 p-2 group-data-[collapsible=icon]:p-1.5 space-y-1">
      <div className="flex justify-center">
        <SidebarTrigger
          className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md h-7.5 w-7.5 transition-colors"
          aria-label="Toggle admin sidebar"
        />
      </div>

      <div className="flex justify-center">
        <ThemeToggle />
      </div>

      <div className="bg-stone-50 dark:bg-white/3 hover:bg-stone-100 dark:hover:bg-white/6 px-2 py-1.5 rounded-lg flex items-center gap-2.5 overflow-hidden cursor-pointer transition-colors border border-stone-200/70 dark:border-white/6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 my-0.5">
        <div className="w-7 h-7 bg-stone-900 dark:bg-white/10 rounded-md flex items-center justify-center shrink-0">
          <span className="text-white dark:text-stone-50 font-bold text-xs">
            {user?.full_name?.[0] || 'A'}
          </span>
        </div>
        <div className={COLLAPSIBLE_PROFILE_DETAILS}>
          <p className="font-bold text-stone-900 dark:text-stone-50 text-xs truncate leading-none mb-0.5">
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
        className="group w-full justify-start gap-2.5 px-2.5 h-7.5 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-white/5 rounded-md transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#131315] group-data-[collapsible=icon]:px-2 text-xs"
      >
        <LogOut className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors shrink-0" />
        <span className={`${COLLAPSIBLE_LABEL} text-xs`}>Sign out</span>
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
  const isOnPaymentsTab = new URLSearchParams(currentSearch).get('tab') === 'payments';
  const badges = useAdminBadges({ adminId: user?.auth_id || user?.id, isOnPaymentsTab });

  const isActiveAdminRoute = useCallback(
    (itemUrl) => checkIsActiveAdminRoute(currentPath, currentSearch, itemUrl),
    [currentPath, currentSearch]
  );

  return (
    <>
      <AdminSidebarHeader />
      <SidebarContent className="px-2 py-1.5 gap-0.5 group-data-[collapsible=icon]:p-1.5">
        <SidebarGroup>
          <SidebarGroupLabel className={`${MICRO} h-5 px-2 text-stone-400 dark:text-stone-500`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {adminNavigationItems.map((item) => (
                <AdminNavItem
                  key={item.title}
                  item={item}
                  isActive={isActiveAdminRoute(item.url)}
                  badges={badges}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-1">
          <SidebarGroupLabel className={`${MICRO} h-5 px-2 text-stone-400 dark:text-stone-500`}>
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
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
