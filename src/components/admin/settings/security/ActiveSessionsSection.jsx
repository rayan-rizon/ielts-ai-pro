import React from 'react';
import { Clock3, Laptop, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  BODY,
  Empty,
  MICRO,
  NUM,
  PANEL,
  PanelHeader,
  Pill,
} from '@/components/admin/ui/primitives';
import { authMethodsLabel, browserSessionLabel, formatDate } from './securitySessionUtils';

function SessionRow({ session, isCurrent, isSigningOut, onSignOut }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Laptop className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
            {browserSessionLabel(session.user_agent)}
          </p>
          {isCurrent && <Pill tone="ok">Current</Pill>}
        </div>
        <p
          className={cn(
            MICRO,
            'mt-0.5 truncate normal-case tracking-normal text-stone-500 dark:text-stone-400'
          )}
        >
          {authMethodsLabel(session.authentication_methods)} · Last active{' '}
          {formatDate(session.last_seen_at)}
        </p>
      </div>
      <span
        className={cn(
          NUM,
          'hidden text-right text-[10px] font-bold text-stone-500 sm:block dark:text-stone-400'
        )}
      >
        {session.session_id.slice(0, 8)}
      </span>
      {!isCurrent && (
        <button
          type="button"
          disabled={isSigningOut}
          onClick={onSignOut}
          className="rounded-md border border-stone-200 px-2 py-1 text-[10px] font-extrabold text-stone-600 transition-all duration-150 ease-smooth-out hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50 dark:border-white/[0.1] dark:text-stone-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      )}
    </div>
  );
}

export function ActiveSessionsSection({
  sessions = [],
  currentSessionId,
  loading,
  working,
  onRefresh,
  onSignOutSession,
  onSignOutEverywhere,
}) {
  return (
    <section className={cn(PANEL, 'col-span-12 overflow-hidden')}>
      <PanelHeader
        label="Sessions"
        title="Active sessions"
        description="Review and revoke administrator sign-ins."
        accent="ok"
      >
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md p-1.5 text-stone-500 transition-all duration-150 ease-smooth-out hover:bg-stone-100 hover:text-stone-900 active:scale-90 dark:text-stone-400 dark:hover:bg-white/[0.06] dark:hover:text-stone-50"
          aria-label="Refresh security sessions"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
      </PanelHeader>
      <div className="divide-y divide-stone-100 dark:divide-white/[0.07]">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionRow
              key={session.session_id}
              session={session}
              isCurrent={session.session_id === currentSessionId}
              isSigningOut={working === `signout-session-${session.session_id}`}
              onSignOut={() => onSignOutSession(session.session_id)}
            />
          ))
        ) : (
          <Empty icon={Clock3} title="No active administrator sessions">
            New sign-ins will appear here.
          </Empty>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-4 py-3 dark:border-white/[0.07]">
        <p className={cn(BODY, 'max-w-2xl')}>
          Sign out every session if your account may be compromised.
        </p>
        <AdminButton
          variant="destructive"
          loading={working === 'signout-all'}
          onClick={onSignOutEverywhere}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out everywhere
        </AdminButton>
      </div>
    </section>
  );
}
