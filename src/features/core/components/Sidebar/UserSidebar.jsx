import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  ChevronRight,
  User as UserIcon,
  LogOut,
  GraduationCap,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { userNavigationItems, learningToolsItems } from './navigationItems';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';

// Memoized Navigation Item component for better performance
const NavItem = memo(({ item, isActive, variant = 'primary' }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  const isSpecial = item.title === 'Writing Practice' || item.title === 'AI Learning Path';

  // Choose colors based on variant
  const activeClasses = {
    primary:
      'bg-primary/10 text-primary border-primary/20 dark:bg-indigo-500/35 dark:text-white dark:border-indigo-400/60 active-glow',
    orange:
      'bg-orange-500/10 text-orange-500 border-orange-500/20 dark:bg-orange-500/35 dark:text-white dark:border-orange-400/60 active-glow-orange',
    purple:
      'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-500/35 dark:text-white dark:border-purple-400/60 active-glow-purple',
  };

  const hoverClasses = {
    primary:
      'hover:bg-primary/5 hover:text-primary hover:border-primary/10 dark:hover:bg-indigo-500/22 dark:hover:text-indigo-300 dark:hover:border-indigo-400/40',
    orange:
      'hover:bg-orange-500/5 hover:text-orange-500 hover:border-orange-500/10 dark:hover:bg-orange-500/22 dark:hover:text-orange-300 dark:hover:border-orange-400/40',
    purple:
      'hover:bg-purple-500/5 hover:text-purple-500 hover:border-purple-500/10 dark:hover:bg-purple-500/22 dark:hover:text-purple-300 dark:hover:border-purple-400/40',
  };

  const iconColorClasses = {
    primary: isActive
      ? 'text-primary dark:text-indigo-300'
      : 'text-muted-foreground group-hover:text-primary dark:group-hover:text-indigo-300',
    orange: isActive
      ? 'text-orange-500 dark:text-orange-300'
      : 'text-foreground/70 dark:text-foreground/85 group-hover:text-orange-500 dark:group-hover:text-orange-300',
    purple: isActive
      ? 'text-purple-500 dark:text-purple-300'
      : 'text-foreground/70 dark:text-foreground/85 group-hover:text-purple-500 dark:group-hover:text-purple-300',
  };

  const activeBarClasses = {
    primary: 'bg-primary dark:bg-indigo-500',
    orange: 'bg-orange-500 dark:bg-orange-500',
    purple: 'bg-purple-500 dark:bg-purple-500',
  };

  return (
    <SidebarMenuItem data-oid="i.s1nmp">
      <m.div
        whileHover={{ x: 4, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        data-oid="r9kga:k"
      >
        <SidebarMenuButton
          asChild
          className={`group relative mb-0.5 rounded-xl overflow-hidden transition-all duration-200 ${
            isActive
              ? `${activeClasses[variant]} border`
              : `text-foreground/70 dark:text-foreground/80 border border-transparent ${hoverClasses[variant]}`
          }`}
          tooltip={item.title}
          data-oid="xw6wqbd"
        >
          <Link
            to={item.url}
            className="flex items-center gap-3 px-3 py-2.5 text-sm relative z-10"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            data-oid="brbc3o2"
          >
            {/* Active indicator background */}
            {isActive && (
              <m.div
                layoutId={`activeTab-${variant}`}
                className={`absolute inset-0 bg-gradient-to-r ${
                  variant === 'primary'
                    ? 'from-primary/20'
                    : variant === 'orange'
                      ? 'from-orange-500/20'
                      : 'from-purple-500/20'
                } to-transparent`}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
                data-oid="fia5s73"
              />
            )}

            {/* Icon with hover animation */}
            <m.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`relative transition-colors duration-200 ${iconColorClasses[variant]}`}
              data-oid="b9sjey0"
            >
              <item.icon className="w-4 h-4" data-oid="4h-jnri" />
            </m.div>

            <span
              className="font-semibold truncate relative z-10 group-data-[collapsible=icon]:hidden"
              data-oid="lrvlqj7"
            >
              {item.title}
            </span>

            {/* AI Badge */}
            {isSpecial && (
              <div className="group-data-[collapsible=icon]:hidden ml-auto" data-oid="hn4xo4.">
                <Badge
                  variant="secondary"
                  className={`bg-gradient-to-r animate-pulse-subtle ${item.title === 'Writing Practice' ? 'from-orange-400 to-red-500' : 'from-blue-400 to-indigo-500'} text-white text-xs px-1.5 py-0.5 font-bold shadow-sm`}
                  data-oid="rp.9ghx"
                >
                  AI
                </Badge>
              </div>
            )}

            {/* Soon Badge */}
            {item.title === 'Study Groups' && (
              <Badge
                variant="outline"
                className="ml-auto text-xs bg-white/5 border-white/10 text-muted-foreground group-data-[collapsible=icon]:hidden"
                data-oid="def62mk"
              >
                Soon
              </Badge>
            )}

            {/* Active indicator bar - Optimized animation */}
            {isActive && (
              <m.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                className={`w-1 h-[60%] ${activeBarClasses[variant]} rounded-full absolute left-0 origin-center`}
                transition={{ duration: 0.3 }}
                data-oid="vja5jfe"
              />
            )}
          </Link>
        </SidebarMenuButton>
      </m.div>
    </SidebarMenuItem>
  );
});

NavItem.displayName = 'NavItem';

export const UserSidebar = memo(({ user, location, handleLogout }) => {
  const { isMobile, setOpenMobile } = useSidebar();

  const getSubscriptionIcon = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
        return <Zap className="w-3 h-3" data-oid="h8p74ee" />;
      case 'premium':
        return <Crown className="w-3 h-3" data-oid="l.o5bj5" />;
      default:
        return <ShieldCheck className="w-3 h-3" data-oid="gy9r3_z" />;
    }
  };

  const currentPath = location.pathname;

  return (
    <>
      {/* Enhanced Header with Logo */}
      <SidebarHeader
        className="border-b border-border p-4 group-data-[collapsible=icon]:p-2"
        data-oid="dt1ps9c"
      >
        <div
          className="flex items-center justify-between group-data-[collapsible=icon]:justify-center"
          data-oid=".evd_wm"
        >
          <div className="flex items-center gap-3" data-oid="d589.-y">
            <m.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-12 h-12 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
              data-oid="5jo1y60"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                data-oid="rqrs.dj"
              />

              <Brain
                className="w-6 h-6 text-white relative z-10 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4"
                data-oid="crapl_:"
              />
            </m.div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden" data-oid="03:p4g9">
              <h2 className="font-bold text-base truncate text-brand-primary" data-oid="zpyd:z.">
                IELTS Ai Pro
              </h2>
              <div
                className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5"
                data-oid="70s5cti"
              >
                <Sparkles
                  className="w-2.5 h-2.5 text-yellow-500/80 animate-spin-slow"
                  data-oid=".59199j"
                />
                AI-Powered Platform
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent
        className="p-2.5 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-6 flex-1"
        data-oid="2dtz0gl"
      >
        <SidebarGroup data-oid="ku-4gdt">
          <SidebarGroupLabel
            className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-1.5 group-data-[collapsible=icon]:hidden"
            data-oid="grskv2u"
          >
            Practice Tests
          </SidebarGroupLabel>
          <SidebarGroupContent data-oid="cir0b64">
            <SidebarMenu data-oid="eqz1bwr">
              {userNavigationItems.map((item) => {
                // Gate AI Learning Path for free users — redirect to Pricing
                const isPro =
                  user?.subscription_tier === 'pro' || user?.subscription_tier === 'premium';
                const effectiveItem =
                  item.title === 'AI Learning Path' && !isPro
                    ? { ...item, url: createPageUrl('Upgrade') }
                    : item;

                return (
                  <NavItem
                    key={item.title}
                    item={effectiveItem}
                    isActive={currentPath === effectiveItem.url}
                    variant="primary"
                    data-oid="wr23k2i"
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-0.5" data-oid="a1:913-">
          <SidebarGroupLabel
            className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-1.5 group-data-[collapsible=icon]:hidden"
            data-oid="l_-pik4"
          >
            Official Tests
          </SidebarGroupLabel>
          <SidebarGroupContent data-oid="cjhfjpo">
            <SidebarMenu data-oid="91fyfol">
              <NavItem
                item={{
                  title: 'Cambridge Tests',
                  url: createPageUrl('CambridgeTests'),
                  icon: GraduationCap,
                }}
                isActive={currentPath === createPageUrl('CambridgeTests')}
                variant="orange"
                data-oid="fw5_8qz"
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-0.5" data-oid="328_5dv">
          <SidebarGroupLabel
            className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/90 uppercase tracking-[0.2em] px-3 py-1.5 group-data-[collapsible=icon]:hidden"
            data-oid=".w0xhz5"
          >
            Learning Tools
          </SidebarGroupLabel>
          <SidebarGroupContent data-oid="9jlymm0">
            <SidebarMenu data-oid="6.1ivfp">
              {learningToolsItems.map((item) => (
                <NavItem
                  key={item.title}
                  item={item}
                  isActive={currentPath === item.url}
                  variant="purple"
                  data-oid=":bam51r"
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className="border-t border-border p-2.5 group-data-[collapsible=icon]:p-2"
        data-oid="760._cj"
      >
        <div className="space-y-1 group-data-[collapsible=icon]:space-y-1" data-oid="8-xxa.v">
          {/* Toggle Button in Footer */}
          <div className="flex justify-center mb-1" data-oid="yttznw5">
            <SidebarTrigger
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Toggle sidebar"
              data-oid="uzql-ky"
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle data-oid="ro8_ngn" />

          {/* Upgrade Badge - Enhanced for free users */}
          {user?.subscription_tier === 'free' && (
            <Link
              to={createPageUrl('Pricing')}
              className="block"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              data-oid="4srbyty"
            >
              <m.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-3 rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
                data-oid="ytwhium"
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"
                  data-oid="en394ey"
                />

                <div
                  className="flex items-center gap-3 text-white relative z-10 justify-center group-data-[collapsible=icon]:p-0"
                  data-oid="lz:_wkm"
                >
                  <div
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 animate-bounce-subtle"
                    data-oid="v_:v6mx"
                  >
                    <Crown className="w-4 h-4" data-oid="5esa4s4" />
                  </div>
                  <div
                    className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
                    data-oid="srvjyee"
                  >
                    <p className="font-semibold text-sm" data-oid="4aj_sg6">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs opacity-90" data-oid="p7rlh-.">
                      Unlock all features
                    </p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 opacity-80 group-data-[collapsible=icon]:hidden"
                    data-oid="2g02j5p"
                  />
                </div>
              </m.div>
            </Link>
          )}

          {/* Enhanced User Profile Card */}
          <Link
            to={createPageUrl('Settings')}
            className="block"
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            data-oid="fak2dy2"
          >
            <m.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 dark:bg-white/5 hover:bg-white/10 p-2 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-300 border border-white/5 hover:border-primary/30 group-data-[collapsible=icon]:justify-center shadow-sm"
              data-oid="q9eqepq"
            >
              {/* Enhanced User Avatar */}
              <div
                className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
                data-oid="61hindx"
              >
                <img
                  src={
                    user?.avatar_url && user.avatar_url !== ''
                      ? user.avatar_url
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.full_name || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
                  }
                  alt="User"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  data-oid="jg:ogpl"
                />
              </div>

              {/* User Info */}
              <div
                className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
                data-oid="0ppscko"
              >
                <p className="font-semibold text-foreground text-sm truncate" data-oid="hzhtjdd">
                  {user?.full_name || 'Student'}
                </p>
                <m.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  data-oid=".d09a.6"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md border font-black uppercase tracking-wider flex items-center gap-1.5 w-fit mt-1.5 transition-all duration-300 shadow-sm',
                      user?.subscription_tier === 'premium'
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/20'
                        : user?.subscription_tier === 'pro'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-500/20'
                          : 'bg-slate-500/10 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    )}
                    data-oid="i32vaz5"
                  >
                    {(user?.subscription_tier === 'premium' ||
                      user?.subscription_tier === 'pro') && (
                      <m.div
                        className={cn(
                          'absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none',
                          user?.subscription_tier === 'premium'
                            ? 'via-purple-400/5'
                            : 'via-blue-400/5'
                        )}
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          repeatDelay: 4,
                        }}
                      />
                    )}

                    <m.div
                      animate={
                        user?.subscription_tier === 'premium' || user?.subscription_tier === 'pro'
                          ? { scale: [1, 1.1, 1] }
                          : {}
                      }
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="relative z-10"
                    >
                      {getSubscriptionIcon(user?.subscription_tier)}
                    </m.div>

                    <span className="relative z-10">{user?.subscription_tier || 'Free'}</span>
                  </Badge>
                </m.div>
              </div>

              {/* Settings Icon */}
              <UserIcon
                className="w-4 h-4 text-foreground/60 group-data-[collapsible=icon]:hidden"
                data-oid="imnz-tb"
              />
            </m.div>
          </Link>

          {/* Enhanced Sign Out Button */}
          <div className="pt-1" data-oid="h.0_gaq">
            <SidebarMenuButton
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                handleLogout();
              }}
              className="w-full justify-start gap-3 px-3 text-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-200 border border-transparent hover:border-destructive/20 dark:hover:text-red-400 dark:hover:bg-red-500/20 dark:hover:border-red-500/40"
              data-oid=".qpxonp"
            >
              <LogOut className="w-4 h-4" data-oid="-cby38k" />
              <span
                className="font-medium text-sm group-data-[collapsible=icon]:hidden"
                data-oid="d8mgvr9"
              >
                Sign Out
              </span>
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
});

UserSidebar.displayName = 'UserSidebar';
