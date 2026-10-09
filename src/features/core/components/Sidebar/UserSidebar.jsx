import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { Crown, GraduationCap, LogOut, User as UserIcon, ArrowRight } from 'lucide-react';
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
import { AiBadge, TierBadge } from '@/features/dashboard/components/primitives';

const ACCENT_ACTIVE =
  'bg-[#5a63df]/9 text-[#4a52c9] border-[#5a63df]/15 dark:bg-[#5a63df]/22 dark:text-[#c3c7ff] dark:border-[#5a63df]/25';
const ACCENT_HOVER =
  'hover:bg-[#5a63df]/[0.07] hover:text-[#4a52c9] dark:hover:bg-white/8 dark:hover:text-white';
const COLLAPSIBLE_LABEL =
  'inline-flex min-w-0 max-w-[11rem] overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none';
const COLLAPSIBLE_DETAILS =
  'flex min-w-0 flex-1 flex-col items-start overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none';

/** One nav row. Every item shares the same accent — the group label above it does the wayfinding. */
const NavItem = memo(({ item, isActive }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const hasAiBadge =
    item.title === 'Writing Practice' ||
    item.title === 'AI Coach' ||
    item.title === 'AI Learning Path' ||
    item.title === 'Practice Lab';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          'group relative rounded-lg border border-transparent transition-all duration-150 ease-smooth-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#100f15]',
          isActive ? ACCENT_ACTIVE : cn('text-slate-600 dark:text-slate-300', ACCENT_HOVER)
        )}
        tooltip={item.title}
      >
        <Link
          to={item.url}
          data-tour={item.tourKey}
          className="flex h-7.5 items-center gap-2.5 px-2.5 text-xs"
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <span
            className={cn(
              'absolute left-0 top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-full bg-[#5a63df] transition-all duration-200 ease-sidebar',
              isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
            )}
          />

          <item.icon
            className="h-4 w-4 shrink-0 transition-colors duration-200 ease-sidebar"
            strokeWidth={2}
          />

          <span className={cn('truncate font-semibold', COLLAPSIBLE_LABEL)}>{item.title}</span>

          {hasAiBadge ? (
            <AiBadge active={isActive} className={cn('ml-auto', COLLAPSIBLE_LABEL)} />
          ) : null}

          {item.title === 'Study Groups' && (
            <span
              className={cn(
                'ml-auto shrink-0 rounded-full border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:border-white/10 dark:text-slate-500',
                COLLAPSIBLE_LABEL
              )}
            >
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
  <SidebarHeader className="border-b border-slate-100 px-3 py-2.5 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2 dark:border-white/6">
    <Link
      to="/dashboard"
      className="relative flex h-8 w-full items-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center scale-95 opacity-0 transition-[opacity,transform] duration-150 ease-sidebar group-data-[collapsible=icon]:scale-100 group-data-[collapsible=icon]:opacity-100">
        <LogoIcon className="h-8 w-8" />
      </div>
      <div className="flex max-w-[12rem] items-center overflow-hidden opacity-100 transition-[max-width,opacity] duration-150 ease-sidebar group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:hidden">
        <Logo size="md" />
      </div>
    </Link>
  </SidebarHeader>
);

const NavigationSection = ({ label, items, currentPath, className }) => (
  <SidebarGroup className={className}>
    <SidebarGroupLabel className="h-5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
      {label}
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu className="gap-0.5">
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
    <SidebarContent className="flex-1 px-2 py-1.5 gap-0.5 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:pt-4">
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
      aria-label="Upgrade to Pro"
      className="group relative block overflow-hidden rounded-xl border border-[#5a63df]/30 bg-linear-to-r/srgb from-[#5a63df]/8 via-[#7a82ed]/[0.14] to-[#5a63df]/6 p-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#5a63df]/60 hover:shadow-xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:border-[#8f97ff]/30 dark:from-[#5a63df]/22 dark:via-[#7a82ed]/16 dark:to-[#5a63df]/18 dark:hover:border-[#8f97ff]/60 dark:focus-visible:ring-offset-[#100f15] group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:px-0"
      onClick={onNavigate}
    >
      <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
        {/* Crown Icon Chip */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr/srgb from-[#5a63df] to-[#7880ed] text-white shadow-xs transition-transform duration-300 group-hover:scale-105 dark:from-[#6c74ec] dark:to-[#969dff]">
          <Crown className="h-4 w-4 text-white" strokeWidth={2.2} />
        </div>

        {/* Text Details */}
        <div className={cn(COLLAPSIBLE_DETAILS, 'group-data-[collapsible=icon]:hidden')}>
          <div className="flex items-center gap-1.5">
            <p className="text-[12px] font-extrabold leading-tight text-[#3c44c7] transition-colors duration-200 group-hover:text-[#2a31b0] dark:text-[#d4d7ff] dark:group-hover:text-white">
              Upgrade to
            </p>
            <TierBadge tier="pro" />
          </div>
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
  <Link
    to={createPageUrl('Settings')}
    aria-label="Account and profile settings"
    className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#100f15]"
    onClick={onNavigate}
  >
    <div className="flex items-center gap-2.5 overflow-hidden rounded-lg border border-transparent px-2 py-1.5 transition-all duration-150 ease-smooth-out hover:border-slate-200/80 hover:bg-slate-50/80 active:scale-[0.98] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0 dark:hover:border-white/8 dark:hover:bg-white/5">
      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-white/10">
        <img
          src={getAvatarUrl(user)}
          alt={user?.full_name ? `${user.full_name}'s avatar` : 'User avatar'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className={cn(COLLAPSIBLE_DETAILS, 'group-data-[collapsible=icon]:hidden')}>
        <p className="w-full truncate text-xs font-bold leading-tight text-slate-800 dark:text-slate-100">
          {user?.full_name || 'Student'}
        </p>
        {isPremiumUser(user) ? (
          <TierBadge tier={user.subscription_tier} className="mt-0.5 shrink-0" />
        ) : (
          <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            Free
          </span>
        )}
      </div>
      <UserIcon
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-slate-400 transition-[color,max-width,opacity] duration-150 ease-sidebar group-hover:text-slate-600 dark:group-hover:text-slate-300 group-data-[collapsible=icon]:hidden',
          'group-data-[collapsible=icon]:overflow-hidden'
        )}
      />
    </div>
  </Link>
);

const UserSidebarFooter = ({ user, handleLogout, showUpgradeOffer }) => {
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
    <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-1.5">
      <div className="space-y-1">
        <div className="flex justify-center">
          <SidebarTrigger
            className="text-slate-500 transition-colors duration-200 ease-sidebar hover:text-[#5a63df] dark:text-slate-300 dark:hover:text-white h-7.5 w-7.5"
            aria-label="Toggle sidebar"
          />
        </div>
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <UpgradeCard isFree={showUpgradeOffer && isFree} onNavigate={closeMobileSidebar} />
        <UserProfileLink user={user} onNavigate={closeMobileSidebar} />
        {!!user?.institution_owner_ids?.length && (
          <SidebarMenuButton asChild tooltip="Switch to institution panel">
            <Link
              to="/institution"
              onClick={closeMobileSidebar}
              className="gap-2.5 px-2.5 h-7.5 text-xs text-slate-600 dark:text-slate-300"
            >
              <GraduationCap className="h-4 w-4" />
              <span className={cn('text-xs font-semibold', COLLAPSIBLE_LABEL)}>
                Switch to institution panel
              </span>
            </Link>
          </SidebarMenuButton>
        )}
        <div className="flex justify-center">
          <SidebarMenuButton
            onClick={signOut}
            aria-label="Sign out"
            tooltip="Sign out"
            className="w-full justify-start gap-2.5 rounded-lg px-2.5 h-7.5 text-xs text-slate-600 transition-all duration-150 ease-smooth-out hover:bg-red-50 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400 group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:gap-0! group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:size-8"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            <span
              className={cn(
                'text-xs font-semibold',
                COLLAPSIBLE_LABEL,
                'group-data-[collapsible=icon]:hidden'
              )}
            >
              Sign out
            </span>
          </SidebarMenuButton>
        </div>
      </div>
    </SidebarFooter>
  );
};

export const UserSidebar = memo(({ user, location, handleLogout, showUpgradeOffer = false }) => {
  const currentPath = location.pathname;
  return (
    <>
      <UserSidebarHeader />
      <LearnerNavigation user={user} currentPath={currentPath} />
      <UserSidebarFooter
        user={user}
        handleLogout={handleLogout}
        showUpgradeOffer={showUpgradeOffer}
      />
    </>
  );
});

UserSidebar.displayName = 'UserSidebar';
