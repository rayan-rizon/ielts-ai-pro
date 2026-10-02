import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  CreditCard,
  Receipt,
  Settings,
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTheme } from '@/components/theme-provider';
import { MICRO, MUTED } from '@/features/dashboard/components/primitives';

const INSTITUTION_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'subscription', label: 'Buy seats', icon: CreditCard },
  { key: 'billing', label: 'Billing', icon: Receipt },
  { key: 'settings', label: 'Settings', icon: Settings },
];
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
  const tab = INSTITUTION_SECTIONS.some((s) => s.key === params.get('tab'))
    ? params.get('tab')
    : 'overview';
  const control =
    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-[#5a63df]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df]';
  return (
    <div className="h-dvh w-full overflow-y-auto bg-[#f7f7fc] text-slate-800 dark:bg-[#0c0b11] dark:text-slate-100 md:flex">
      <a
        href="#institution-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3"
      >
        Skip to institution content
      </a>
      <aside className="shrink-0 border-b border-[#e4e2f0] bg-white p-4 dark:border-white/[0.07] dark:bg-[#100f15] md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-3 md:block">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 shrink-0 text-[#5a63df]" />
            <div>
              <p className="text-sm font-extrabold">IELTS Ai Pro</p>
              <p className={`${MICRO} ${MUTED}`}>Institution panel</p>
            </div>
          </div>
          <button
            type="button"
            className={control}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Appearance</span>
          </button>
        </div>
        {institution && <p className="mt-4 break-words text-sm font-bold">{institution.name}</p>}
        {institutions.length > 1 && (
          <label className="mt-3 block text-xs">
            Choose institution
            <select
              className="mt-1 w-full rounded-md border border-[#e4e2f0] bg-white p-2 dark:border-white/10 dark:bg-[#141319]"
              value={institution?.id}
              onChange={(e) => setParams({ institution: e.target.value, tab })}
            >
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {navigation && (
          <nav
            aria-label="Institution navigation"
            className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-5 md:grid-cols-1"
          >
            {INSTITUTION_SECTIONS.map(({ key, label, icon: Icon }) => (
              <Link
                key={key}
                to={`/institution?${new URLSearchParams({ ...(institution ? { institution: institution.id } : {}), tab: key })}`}
                aria-current={tab === key ? 'page' : undefined}
                className={`${control} ${tab === key ? 'bg-[#5a63df]/10 text-[#5a63df] dark:text-[#bfc3ff]' : MUTED}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="mt-4 flex flex-wrap gap-1 border-t border-[#e4e2f0] pt-3 dark:border-white/[0.07] md:mt-auto md:block">
          <Link className={control} to={preview ? '/admin/panel?tab=institutions' : '/dashboard'}>
            <ArrowLeft className="h-4 w-4" />
            {preview ? 'Platform admin' : 'Learner dashboard'}
          </Link>
          <button
            className={control}
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main id="institution-content" className="min-w-0 flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          {preview && (
            <div className="rounded-lg border border-[#5a63df]/20 bg-[#5a63df]/5 p-3 text-sm">
              <strong>Institution panel preview</strong>
              <p className={`${MUTED} mt-1 text-xs`}>
                You are viewing the owner's panel using your platform-admin session. Manage pricing,
                free seats, and history in Platform admin.
              </p>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
