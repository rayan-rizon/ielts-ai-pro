import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { ShieldCheck, Sparkles, Plus, Crown, LogOut } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

// Memoized Nav Item for Admin Sidebar
const AdminNavItem = memo(({ item, isActive, pendingCount = 0, layoutId }) => {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const btnClasses = `group transition-all duration-200 rounded-xl mb-1.5 relative overflow-hidden ${
    isActive
      ? 'bg-red-500/10 text-red-500 font-bold border border-red-500/20 active-glow-red dark:bg-red-500/35 dark:text-white dark:border-red-500/60'
      : 'text-foreground/70 dark:text-foreground/80 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/10 dark:hover:bg-red-500/22 dark:hover:text-red-300 dark:hover:border-red-500/40 border border-transparent'
  }`;

  const iconClasses = `w-4 h-4 transition-colors duration-200 ${
    isActive ? 'text-red-500' : 'text-muted-foreground group-hover:text-red-500'
  }`;

  return (
    <SidebarMenuItem data-oid="lnr1hiz">
      <m.div
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        data-oid="3f:1rc_"
      >
        <SidebarMenuButton asChild className={btnClasses} tooltip={item.title} data-oid="kfo7-mh">
          <Link
            to={item.url}
            className="flex items-center gap-3 px-3 py-2.5 text-sm relative z-10"
            onClick={handleLinkClick}
            data-oid="bi491j7"
          >
            {isActive && (
              <m.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent rounded-xl"
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                data-oid="dm:s8jk"
              />
            )}
            <item.icon className={iconClasses} data-oid="mddicg." />
            <span className="truncate group-data-[collapsible=icon]:hidden" data-oid="nir:fnk">
              {item.title}
            </span>
            {item.title === 'Payments' && pendingCount > 0 && (
              <Badge
                className="ml-auto h-5 px-1.5 min-w-[20px] rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center shadow-lg shadow-red-500/20"
                data-oid="e.16omu"
              >
                {pendingCount}
              </Badge>
            )}
            {isActive && (
              <m.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                className="w-1 h-[60%] bg-red-500 rounded-full absolute left-0 origin-center"
                transition={{ duration: 0.3 }}
                data-oid="cefehf5"
              />
            )}
          </Link>
        </SidebarMenuButton>
      </m.div>
    </SidebarMenuItem>
  );
});
AdminNavItem.displayName = 'AdminNavItem';

const AdminSidebarHeader = memo(() => (
  <SidebarHeader
    className="border-b border-border/50 p-4 group-data-[collapsible=icon]:p-2"
    data-oid="s169erg"
  >
    <div
      className="flex items-center justify-between group-data-[collapsible=icon]:justify-center"
      data-oid="ja5oba."
    >
      <Link to="/admin" className="flex items-center gap-3 w-full" data-oid="_sq00kt">
        {/* Collapsed Icon: animated logo-icon.svg */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center shrink-0 w-8 h-8">
          <LogoIcon className="w-8 h-8" />
        </div>

        {/* Expanded Logo */}
        <div
          className="group-data-[collapsible=icon]:hidden flex items-center gap-2"
          data-oid="21p78tx"
        >
          <Logo size="sm" />
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded-full shrink-0">
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
    <SidebarGroup className="mt-4" data-oid="cm5afwe">
      <SidebarGroupLabel
        className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-3"
        data-oid="yk1l9ra"
      >
        Quick Actions
      </SidebarGroupLabel>
      <SidebarGroupContent data-oid="k-03jzg">
        <SidebarMenu data-oid="np1uu3_">
          <SidebarMenuItem data-oid="bab:dfr">
            <SidebarMenuButton
              asChild
              className="w-full justify-start gap-3 px-3 text-foreground/70 dark:text-foreground/80 hover:text-emerald-500 dark:hover:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/22 rounded-xl transition-all duration-200 border border-transparent hover:border-emerald-500/20 dark:hover:border-emerald-500/40"
              tooltip="Create Test"
              data-oid="b.mxalc"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=tests&action=create'}
                onClick={handleLinkClick}
                data-oid="vdqakrb"
              >
                <Plus className="w-4 h-4" data-oid="ki7pyw2" />
                <span
                  className="font-medium text-sm group-data-[collapsible=icon]:hidden"
                  data-oid="p5n:qy:"
                >
                  Create Test
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem data-oid="cvv86s3">
            <SidebarMenuButton
              asChild
              className="w-full justify-start gap-3 px-3 text-foreground/70 dark:text-foreground/80 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/22 rounded-xl transition-all duration-200 border border-transparent hover:border-amber-500/20 dark:hover:border-amber-500/40"
              tooltip="Add Promo"
              data-oid="4mznefw"
            >
              <Link
                to={createPageUrl('AdminPanel') + '?tab=promo&action=create'}
                onClick={handleLinkClick}
                data-oid="ra.tlvd"
              >
                <Crown className="w-4 h-4" data-oid="fmi6hnl" />
                <span
                  className="font-medium text-sm group-data-[collapsible=icon]:hidden"
                  data-oid="jkj-1ix"
                >
                  Add Promo
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
    <SidebarFooter
      className="border-t border-border/50 p-3 group-data-[collapsible=icon]:p-2"
      data-oid="8ah-46y"
    >
      <div className="space-y-2" data-oid="bwg4hny">
        <div className="flex justify-center mb-1" data-oid="jso1a4u">
          <SidebarTrigger
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-9 transition-colors"
            aria-label="Toggle admin sidebar"
            data-oid="8jj1-01"
          />
        </div>

        <ThemeToggle data-oid="sr246dj" />

        <div
          className="bg-card hover:bg-red-500/5 p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all duration-300 border border-border/50 hover:border-red-500/40 group-data-[collapsible=icon]:justify-center shadow-sm hover:shadow-md"
          data-oid="mraruz3"
        >
          <div
            className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
            data-oid="h9j3ooc"
          >
            <div className="absolute inset-0 bg-white/10" data-oid="238cow0" />
            <span className="text-white font-bold text-sm relative z-10" data-oid="cskko-3">
              {user?.full_name?.[0] || 'A'}
            </span>
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden" data-oid="m:m9iun">
            <p
              className="font-bold text-foreground text-xs truncate leading-none mb-1"
              data-oid="4ql4pxi"
            >
              {user?.full_name || 'Admin User'}
            </p>
            <div className="flex items-center gap-1" data-oid="pt_pi9e">
              <div
                className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"
                data-oid="bei_zlp"
              />
              <span className="text-[10px] font-semibold text-muted-foreground" data-oid="2e9kng_">
                ADMINISTRATOR
              </span>
            </div>
          </div>
        </div>

        <div className="pt-1" data-oid="4rmq4vy">
          <SidebarMenuButton
            onClick={onLogoutClick}
            className="w-full justify-start gap-3 px-3 text-foreground/70 dark:text-foreground/80 hover:text-destructive hover:bg-destructive/15 rounded-xl transition-all duration-200 group-data-[collapsible=icon]:px-2.5 border border-transparent hover:border-destructive/20 dark:hover:text-red-300 dark:hover:bg-red-500/22 dark:hover:border-red-500/40"
            data-oid="cu9yi_8"
          >
            <LogOut className="w-4 h-4" data-oid=".xkhml9" />
            <span
              className="font-medium text-sm group-data-[collapsible=icon]:hidden"
              data-oid="_u:1-_k"
            >
              Sign Out
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
      <SidebarContent className="p-3 group-data-[collapsible=icon]:p-2" data-oid="qz8y--f">
        <SidebarGroup data-oid="919hgsw">
          <SidebarGroupLabel
            className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-3"
            data-oid="ar3:f-f"
          >
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent data-oid="vexp44f">
            <SidebarMenu data-oid="cpctjc_">
              {adminNavigationItems.map((item) => (
                <AdminNavItem
                  key={item.title}
                  item={item}
                  isActive={isActiveAdminRoute(item.url)}
                  pendingCount={pendingCount}
                  layoutId="activeAdminTab"
                  data-oid="1x:79ek"
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4" data-oid="5glbou1">
          <SidebarGroupLabel
            className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-3"
            data-oid="6uwi2ti"
          >
            Intelligence
          </SidebarGroupLabel>
          <SidebarGroupContent data-oid="n1vq_jr">
            <SidebarMenu data-oid="ks3vi-p">
              {analyticsNavigationItems.map((item) => (
                <AdminNavItem
                  key={item.title}
                  item={item}
                  isActive={isActiveAdminRoute(item.url)}
                  layoutId="activeAnalyticsTab"
                  data-oid="xa:o-wq"
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
