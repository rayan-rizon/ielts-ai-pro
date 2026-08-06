import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { Crown, GraduationCap, LogOut, User as UserIcon, ArrowRight, Sparkles } from 'lucide-react';
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
import { userNavigationItems, learningToolsItems } from './navigationItems';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';

const ACCENT_ACTIVE =
  'bg-[#5a63df]/9 text-[#4a52c9] border-[#5a63df]/15 dark:bg-[#5a63df]/22 dark:text-[#c3c7ff] dark:border-[#5a63df]/25';
const ACCENT_HOVER =
  'hover:bg-[#5a63df]/[0.07] hover:text-[#4a52c9] dark:hover:bg-white/8 dark:hover:text-white';
const AI_BADGE =
  'border-[0.5px] border-[#c3c8f2]/80 bg-linear-to-br/srgb from-[#f5f6ff] via-[#eef0ff] to-[#fbfaff] text-[#5b64c8] shadow-[0_1px_5px_rgba(86,97,233,0.08)] dark:border-[#7f87e2]/30 dark:bg-linear-to-br/srgb dark:from-[#30366f]/85 dark:via-[#393474]/70 dark:to-[#2b355e]/85 dark:text-[#cbd0f5] dark:shadow-[0_1px_6px_rgba(86,97,233,0.12)]';
const AI_BADGE_ACTIVE =
  'border-[0.5px] border-[#bdc3f0]/90 bg-linear-to-br/srgb from-[#edf0ff] via-[#e4e7ff] to-[#f5f2ff] text-[#4f58bb] shadow-[0_2px_7px_rgba(86,97,233,0.12)] dark:border-[#a0a7ed]/35 dark:bg-linear-to-br/srgb dark:from-[#4a53a0] dark:via-[#4d438c] dark:to-[#3d4b89] dark:text-[#eef0ff] dark:shadow-[0_2px_8px_rgba(86,97,233,0.16)]';

/** One nav row. Every item shares the same accent — the group label above it does the wayfinding. */
const NavItem = memo(({ item, isActive }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const isNew = item.title === 'Writing Practice' || item.title === 'AI Learning Path';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          'group relative mb-0.5 rounded-lg border border-transparent transition-all duration-200 ease-sidebar',
          isActive ? ACCENT_ACTIVE : cn('text-slate-600 dark:text-slate-300', ACCENT_HOVER)
        )}
        tooltip={item.title}
      >
        <Link
          to={item.url}
          className="flex items-center gap-2.5 px-3 py-2 text-[13px]"
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <span
            className={cn(
              'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#5a63df] transition-all duration-200 ease-sidebar',
              isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
            )}
          />

          <item.icon
            className="h-4 w-4 shrink-0 transition-colors duration-200 ease-sidebar"
            strokeWidth={2}
          />

          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
            {item.title}
          </span>

          {isNew && (
            <span
              className={cn(
                'ml-auto inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.06em] group-data-[collapsible=icon]:hidden',
                isActive ? AI_BADGE_ACTIVE : AI_BADGE
              )}
            >
              AI
            </span>
          )}

          {item.title === 'Study Groups' && (
            <span className="ml-auto shrink-0 rounded-full border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:border-white/10 dark:text-slate-500 group-data-[collapsible=icon]:hidden">
              Soon
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});
NavItem.displayName = 'NavItem';

const isPremiumUser = (user) =>
  user?.subscription_tier === 'pro' || user?.subscription_tier === 'premium';

const resolveMainNavigation = (user) =>
  userNavigationItems.map((item) => {
    if (item.title !== 'AI Learning Path' || isPremiumUser(user)) return item;
    return { ...item, url: createPageUrl('Upgrade') };
  });

const UserSidebarHeader = () => (
  <SidebarHeader className="border-b border-slate-100 p-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 dark:border-white/6">
    <Link
      to="/dashboard"
      className="flex w-full items-center gap-3 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
    >
      <div className="mx-auto hidden h-8 w-8 shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
        <LogoIcon className="h-8 w-8" />
      </div>
      <div className="flex items-center group-data-[collapsible=icon]:hidden">
        <Logo size="md" />
      </div>
    </Link>
  </SidebarHeader>
);

const NavigationSection = ({ label, items, currentPath, className }) => (
  <SidebarGroup className={className}>
    <SidebarGroupLabel className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 group-data-[collapsible=icon]:hidden dark:text-slate-400">
      {label}
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} isActive={currentPath === item.url} />
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
);

const LearnerNavigation = ({ user, currentPath }) => {
  const cambridgeTests = {
    title: 'Cambridge Tests',
    url: createPageUrl('CambridgeTests'),
    icon: GraduationCap,
  };

  return (
    <SidebarContent className="flex-1 p-2.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-6">
      <NavigationSection
        label="Main menu"
        items={resolveMainNavigation(user)}
        currentPath={currentPath}
      />
      <NavigationSection
        label="Official tests"
        items={[cambridgeTests]}
        currentPath={currentPath}
        className="pt-0.5"
      />
      <NavigationSection
        label="Learning tools"
        items={learningToolsItems}
        currentPath={currentPath}
        className="pt-0.5"
      />
    </SidebarContent>
  );
};

const UpgradeCard = ({ isFree, onNavigate }) => {
  if (!isFree) return null;
  return (
    <Link
      to={createPageUrl('Pricing')}
      className="group relative block overflow-hidden rounded-xl border border-[#5a63df]/30 bg-linear-to-r/srgb from-[#5a63df]/8 via-[#7a82ed]/[0.14] to-[#5a63df]/6 p-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#5a63df]/60 hover:shadow-[0_6px_20px_-4px_rgba(90,99,223,0.25)] active:scale-[0.98] dark:border-[#8f97ff]/30 dark:from-[#5a63df]/22 dark:via-[#7a82ed]/16 dark:to-[#5a63df]/18 dark:hover:border-[#8f97ff]/60 dark:hover:shadow-[0_6px_20px_-4px_rgba(143,151,255,0.25)]"
      onClick={onNavigate}
    >
      <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
        {/* Crown Icon Chip */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr/srgb from-[#5a63df] to-[#7880ed] text-white shadow-sm shadow-[#5a63df]/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:from-[#6c74ec] dark:to-[#969dff]">
          <Crown className="h-4 w-4 text-white" strokeWidth={2.2} />
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <p className="text-[12px] font-extrabold leading-tight text-[#3c44c7] transition-colors duration-200 group-hover:text-[#2a31b0] dark:text-[#d4d7ff] dark:group-hover:text-white">
            Upgrade to Pro
          </p>
          <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500 transition-colors duration-200 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
            Unlock all features
          </p>
        </div>

        {/* Action Nudge Arrow */}
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#5a63df] opacity-60 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 dark:text-[#a9afff] group-data-[collapsible=icon]:hidden" />
      </div>
    </Link>
  );
};

const getAvatarUrl = (user) =>
  user?.avatar_url ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.full_name || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

const UserProfileLink = ({ user, onNavigate }) => (
  <Link to={createPageUrl('Settings')} className="block" onClick={onNavigate}>
    <div className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition-all duration-200 ease-sidebar hover:border-slate-200/80 hover:bg-slate-50/80 group-data-[collapsible=icon]:justify-center dark:hover:border-white/8 dark:hover:bg-white/5">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-2 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800">
        <img
          src={getAvatarUrl(user)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
          {user?.full_name || 'Student'}
        </p>
        <span
          className={cn(
            'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border',
            isPremiumUser(user)
              ? 'border-[#5a63df]/30 bg-[#5a63df]/10 text-[#5a63df] dark:border-[#5a63df]/40 dark:bg-[#5a63df]/25 dark:text-[#c3c7ff]'
              : 'border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300'
          )}
        >
          {user?.subscription_tier || 'Free'}
        </span>
      </div>
      <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-data-[collapsible=icon]:hidden" />
    </div>
  </Link>
);

const UserSidebarFooter = ({ user, handleLogout }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const isFree = user?.subscription_tier === 'free' || !user?.subscription_tier;
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };
  const signOut = () => {
    closeMobileSidebar();
    handleLogout();
  };

  return (
    <SidebarFooter className="p-2.5 group-data-[collapsible=icon]:p-2">
      <div className="space-y-1.5">
        <div className="mb-1 flex justify-center">
          <SidebarTrigger
            className="text-slate-500 transition-colors duration-200 ease-sidebar hover:text-[#5a63df] dark:text-slate-300 dark:hover:text-white"
            aria-label="Toggle sidebar"
          />
        </div>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <UpgradeCard isFree={isFree} onNavigate={closeMobileSidebar} />
        <UserProfileLink user={user} onNavigate={closeMobileSidebar} />
        <SidebarMenuButton
          onClick={signOut}
          className="w-full justify-start gap-2.5 rounded-lg px-3 text-slate-600 transition-colors duration-200 ease-sidebar hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          <span className="text-[13px] font-semibold group-data-[collapsible=icon]:hidden">
            Sign out
          </span>
        </SidebarMenuButton>
      </div>
    </SidebarFooter>
  );
};

export const UserSidebar = memo(({ user, location, handleLogout }) => {
  const currentPath = location.pathname;
  return (
    <>
      <UserSidebarHeader />
      <LearnerNavigation user={user} currentPath={currentPath} />
      <UserSidebarFooter user={user} handleLogout={handleLogout} />
    </>
  );
});

UserSidebar.displayName = 'UserSidebar';
