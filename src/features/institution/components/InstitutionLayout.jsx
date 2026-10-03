import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Settings,
  ArrowLeft,
  LogOut,
  SunMedium,
  MoonStar,
  ShieldCheck,
  Building,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { Logo, LogoIcon } from '@/components/shared/Logo';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from './NativeSelect';
import { cn } from '@/lib/cn';
import DocumentHead from '@/components/shared/DocumentHead';

const INSTITUTION_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'subscription', label: 'Buy seats', icon: CreditCard },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ACCENT_ACTIVE =
  'bg-[#5a63df]/10 text-[#4a52c9] border-[#5a63df]/20 dark:bg-[#5a63df]/20 dark:text-[#c3c7ff] dark:border-[#5a63df]/25';
const ACCENT_HOVER =
  'hover:bg-[#5a63df]/[0.07] hover:text-[#4a52c9] dark:hover:bg-white/8 dark:hover:text-white';

function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('institution_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('institution_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return [isCollapsed, toggleCollapse];
}

function InstitutionSidebarHeader({ isCollapsed }) {
  if (isCollapsed) {
    return (
      <div className="flex items-center min-w-0 h-8 justify-center w-full">
        <Link
          to="/dashboard"
          aria-label="IELTS Ai Pro Homepage"
          title="IELTS Ai Pro Homepage"
          className="flex items-center justify-center p-1"
        >
          <LogoIcon className="h-7 w-7" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center min-w-0 h-8 justify-start gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Link to="/dashboard" aria-label="IELTS Ai Pro Homepage">
          <Logo className="h-7 w-auto" />
        </Link>
        <Badge
          variant="secondary"
          className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 shrink-0"
        >
          Institution
        </Badge>
      </div>
    </div>
  );
}

function InstitutionSidebarCard({ institution, institutions, isCollapsed, onSwitchInstitution }) {
  if (!institution) return null;

  if (isCollapsed) {
    return (
      <div
        className="mt-4 rounded-xl border border-border/80 bg-card p-2.5 shadow-xs transition-all md:flex md:items-center md:justify-center md:p-2"
        title={`${institution.name} (Institution)`}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
          <Building className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border/80 bg-card p-2.5 shadow-xs transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-[#8f97ff]/18 dark:text-[#afb5ff]">
          <Building className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Institution
          </p>
          <p className="truncate text-xs font-bold text-card-foreground">{institution.name}</p>
        </div>
      </div>

      {institutions.length > 1 && (
        <label className="mt-2.5 block text-[11px] font-medium text-muted-foreground">
          Switch institution
          <NativeSelect
            aria-label="Choose institution"
            wrapperClassName="mt-1"
            className="h-8 text-xs py-1"
            value={institution.id}
            onChange={(e) => onSwitchInstitution(e.target.value)}
          >
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </NativeSelect>
        </label>
      )}
    </div>
  );
}

function InstitutionNavLinks({ navigation, currentTab, institutionId, isCollapsed }) {
  if (!navigation) return null;

  return (
    <nav
      aria-label="Institution navigation"
      className="mt-4 flex gap-1 overflow-x-auto pb-1 md:pb-0 md:overflow-visible md:flex-col"
    >
      {INSTITUTION_SECTIONS.map(({ key, label, icon: Icon }) => {
        const isActive = currentTab === key;
        const targetParams = new URLSearchParams({
          ...(institutionId ? { institution: institutionId } : {}),
          tab: key,
        });

        return (
          <Link
            key={key}
            to={`/institution?${targetParams}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={label}
            title={label}
            className={cn(
              'group relative mb-0.5 flex items-center rounded-lg border border-transparent font-semibold transition-all duration-150 ease-smooth-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isCollapsed
                ? 'justify-center p-2.5 md:h-10 md:w-full'
                : 'gap-2.5 px-3 py-2 text-[13px]',
              isActive ? ACCENT_ACTIVE : cn('text-slate-600 dark:text-slate-300', ACCENT_HOVER)
            )}
          >
            {!isCollapsed && (
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#5a63df] transition-all duration-200 ease-sidebar',
                  isActive ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                )}
              />
            )}
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className={cn('truncate whitespace-nowrap', isCollapsed && 'sr-only')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function InstitutionCollapseButton({ isCollapsed, onToggle }) {
  return (
    <div className="hidden justify-center mb-1 md:flex">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <PanelLeft
          className={cn('h-5 w-5 transition-transform duration-200', isCollapsed && 'rotate-180')}
        />
        <span className="sr-only">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
      </button>
    </div>
  );
}

function InstitutionThemeToggle({ isCollapsed, theme, onToggleTheme }) {
  const isDark = theme === 'dark';
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onToggleTheme}
        className={cn(
          'group flex items-center rounded-md text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          isCollapsed
            ? 'h-9 w-9 justify-center'
            : 'w-auto justify-start gap-2 px-2 py-2 md:w-full md:gap-3 md:px-3'
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <SunMedium className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute text-muted-foreground group-hover:text-foreground" />
          <MoonStar className="h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute text-muted-foreground group-hover:text-foreground" />
        </div>
        {!isCollapsed && <span className="hidden truncate md:inline">Appearance</span>}
      </button>
    </div>
  );
}

function InstitutionReturnLink({ isCollapsed, preview }) {
  const to = preview ? '/admin/panel?tab=institutions' : '/dashboard';
  const label = preview ? 'Platform admin' : 'Learner dashboard';
  const mobileLabel = preview ? 'Admin' : 'Learner';

  return (
    <Link
      className={cn(
        'group flex items-center rounded-md text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isCollapsed
          ? 'h-9 w-9 justify-center mx-auto'
          : 'w-auto justify-start gap-2 px-2 py-2 md:w-full md:gap-3 md:px-3'
      )}
      to={to}
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <span className="truncate">
          <span className="md:hidden">{mobileLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </span>
      )}
    </Link>
  );
}

function InstitutionSignOutButton({ isCollapsed, onSignOut }) {
  return (
    <button
      type="button"
      className={cn(
        'group flex items-center rounded-md text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isCollapsed
          ? 'h-9 w-9 justify-center mx-auto'
          : 'w-auto justify-start gap-2 px-2 py-2 md:w-full md:gap-3 md:px-3'
      )}
      onClick={onSignOut}
      title="Sign out"
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">Sign out</span>}
    </button>
  );
}

function InstitutionSidebarFooter({
  isCollapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
  preview,
  onSignOut,
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-1 md:mt-4 md:flex-col md:items-stretch rounded-t-2xl border-t border-x border-border/80 bg-card/40 dark:bg-white/[0.03] -mx-1 -mb-3 p-2.5 pt-3 shadow-2xs md:mt-auto md:-mx-2 md:-mb-4">
      <InstitutionCollapseButton isCollapsed={isCollapsed} onToggle={onToggleCollapse} />
      <InstitutionThemeToggle
        isCollapsed={isCollapsed}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <InstitutionReturnLink isCollapsed={isCollapsed} preview={preview} />
      <InstitutionSignOutButton isCollapsed={isCollapsed} onSignOut={onSignOut} />
    </div>
  );
}

function InstitutionPreviewBanner({ preview }) {
  if (!preview) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 dark:border-[#8f97ff]/25 bg-primary/5 dark:bg-[#8f97ff]/[0.06] p-4 text-xs text-foreground shadow-xs">
      <ShieldCheck className="h-5 w-5 shrink-0 text-primary dark:text-[#afb5ff] mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-extrabold text-primary dark:text-[#afb5ff]">
            Institution panel preview
          </p>
          <Badge
            variant="outline"
            className="border-primary/30 dark:border-[#8f97ff]/30 text-primary dark:text-[#afb5ff] dark:bg-[#8f97ff]/10"
          >
            Admin Preview
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Previewing as platform admin. Manage pricing and free seats in Platform admin.
        </p>
      </div>
    </div>
  );
}

export default function InstitutionLayout({
  children,
  institution,
  institutions = [],
  preview = false,
  navigation = true,
}) {
  const [params, setParams] = useSearchParams();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isCollapsed, toggleCollapse] = useSidebarCollapse();

  const tab = INSTITUTION_SECTIONS.some((s) => s.key === params.get('tab'))
    ? params.get('tab')
    : 'overview';

  const handleSwitchInstitution = (nextId) => {
    setParams({ institution: nextId, tab });
  };

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/institution/login');
  };

  return (
    <div className="min-h-dvh w-full bg-background text-foreground md:flex">
      <DocumentHead
        title={institution?.name ? `${institution.name} — Institution` : 'Institution portal'}
        noIndex
        noFollow
      />
      <a
        href="#institution-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border focus:border-primary focus:bg-background focus:p-3 focus:text-xs focus:font-semibold focus:shadow-md"
      >
        Skip to institution content
      </a>

      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'shrink-0 border-b border-border bg-sidebar md:bg-linear-to-b md:from-white md:to-[#faf9ff] dark:md:from-[#141319] dark:md:to-[#100f15] md:border-b-0 md:border-r border-[#e4e2f0] dark:border-white/[0.07] p-3 md:sticky md:top-0 md:flex md:h-dvh md:flex-col transition-[width] duration-200 ease-sidebar',
          isCollapsed ? 'md:w-16 md:p-2' : 'md:w-64 md:p-4'
        )}
      >
        <InstitutionSidebarHeader isCollapsed={isCollapsed} />

        <InstitutionSidebarCard
          institution={institution}
          institutions={institutions}
          isCollapsed={isCollapsed}
          onSwitchInstitution={handleSwitchInstitution}
        />

        <InstitutionNavLinks
          navigation={navigation}
          currentTab={tab}
          institutionId={institution?.id}
          isCollapsed={isCollapsed}
        />

        <InstitutionSidebarFooter
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          preview={preview}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Main Content Area */}
      <main id="institution-content" className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <InstitutionPreviewBanner preview={preview} />
          {children}
        </div>
      </main>
    </div>
  );
}
