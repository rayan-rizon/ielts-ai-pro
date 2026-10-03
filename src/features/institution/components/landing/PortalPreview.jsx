import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Crown,
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  PANEL,
  TILE,
  WELL,
  NUM,
  MICRO,
  TITLE,
  MUTED,
} from '@/features/dashboard/components/primitives.jsx';
import { cn } from '@/lib/cn';
import { institutionLanding as content } from '../../content/landingContent';

const demoStudents = [
  {
    name: 'Ava Thompson',
    initials: 'AT',
    email: 'ava.thompson@riverside.edu',
    plan: 'Premium',
    status: 'Active',
    date: '25 Nov 2026',
  },
  {
    name: 'Jacob Lee',
    initials: 'JL',
    email: 'jacob.lee@riverside.edu',
    plan: 'Pro',
    status: 'Active',
    date: '14 Nov 2026',
  },
  {
    name: 'Sofia Malik',
    initials: 'SM',
    email: 'sofia.malik@riverside.edu',
    plan: 'Premium',
    status: 'Invited',
    date: 'Invitation sent',
  },
  {
    name: 'Daniel Rocha',
    initials: 'DR',
    email: 'daniel.rocha@riverside.edu',
    plan: 'Pro',
    status: 'Waiting',
    date: 'After current access',
  },
];

function PortalPreviewTopBar() {
  return (
    <figcaption className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-[#e4e2f0] dark:border-white/[0.07]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5a63df]/10 text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#a9afff]">
            <Building2 className="h-4 w-4" />
          </span>
          <h3 className={cn(TITLE, 'text-sm sm:text-base')}>Riverside Language Institute</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Verified Partner
          </span>
        </div>
        <p className={cn(MICRO, MUTED, 'text-[9px]')}>
          Sample Institution · Coordinator Command Center
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3 sm:gap-4 divide-x divide-[#e4e2f0] dark:divide-white/[0.07] bg-white/60 dark:bg-white/[0.02] border border-[#e4e2f0]/60 dark:border-white/[0.05] rounded-xl px-3 py-2">
        <div className="text-center px-2">
          <dt className={cn(MICRO, MUTED, 'text-[8px]')}>Total</dt>
          <dd
            className={cn(
              NUM,
              'text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100'
            )}
          >
            120
          </dd>
        </div>
        <div className="text-center pl-3 pr-2">
          <dt className={cn(MICRO, 'text-[8px] text-emerald-600 dark:text-emerald-400')}>Active</dt>
          <dd
            className={cn(
              NUM,
              'text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400'
            )}
          >
            84
          </dd>
        </div>
        <div className="text-center pl-3">
          <dt className={cn(MICRO, 'text-[8px] text-[#5a63df] dark:text-[#a9afff]')}>Available</dt>
          <dd
            className={cn(
              NUM,
              'text-sm sm:text-base font-extrabold text-[#5a63df] dark:text-[#a9afff]'
            )}
          >
            36
          </dd>
        </div>
      </dl>
    </figcaption>
  );
}

function PortalPreviewTabsHeader() {
  return (
    <div className="flex items-center gap-4 sm:gap-6 px-5 sm:px-6 border-b border-[#e4e2f0] dark:border-white/[0.07] text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto">
      <span className="py-3 text-[#5a63df] dark:text-[#a9afff] border-b-2 border-[#5a63df] dark:border-[#a9afff] font-bold flex items-center gap-1.5 whitespace-nowrap">
        <Users className="h-3.5 w-3.5" />
        Students Roster (84)
      </span>
      <span className="py-3 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
        Seat Pools & Tiers
      </span>
      <span className="py-3 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap">
        Invoices & Billing
      </span>
      <span className="py-3 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap hidden sm:inline-block">
        Audit Activity
      </span>
    </div>
  );
}

function PortalPreviewSearchBar() {
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        <div
          className={cn(
            TILE,
            'flex items-center pl-8 pr-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 cursor-text select-none'
          )}
        >
          Search students by name or email…
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-2xs dark:border-white/10 dark:bg-[#141319] dark:text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          70% Seats Allocated
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#5a63df] hover:bg-[#4a52c9] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-default select-none">
          <UserPlus className="h-3.5 w-3.5" />
          Invite Students
        </span>
      </div>
    </div>
  );
}

function StudentTableRow({ student }) {
  const isPremium = student.plan === 'Premium';
  return (
    <tr className="group hover:bg-[#5a63df]/[0.03] dark:hover:bg-white/[0.02] transition-colors">
      <td className="py-3 pl-3 pr-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              NUM,
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5a63df]/10 text-[10px] font-bold text-[#5a63df] dark:bg-[#5a63df]/20 dark:text-[#bfc3ff]'
            )}
            aria-hidden="true"
          >
            {student.initials}
          </span>
          <div className="min-w-0">
            <strong className="block text-xs font-semibold text-slate-900 dark:text-white truncate">
              {student.name}
            </strong>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {student.email}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
            isPremium
              ? 'border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border border-[#5a63df]/25 bg-[#5a63df]/10 text-[#5a63df] dark:text-[#bfc3ff]'
          )}
        >
          {isPremium && <Crown className="h-2.5 w-2.5" />}
          {student.plan}
        </span>
      </td>
      <td className="py-3 px-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            student.status === 'Active' &&
              'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
            student.status === 'Invited' && 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
            student.status === 'Waiting' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              student.status === 'Active' && 'bg-emerald-500 animate-pulse',
              student.status === 'Invited' && 'bg-indigo-500',
              student.status === 'Waiting' && 'bg-amber-500'
            )}
          />
          {student.status}
        </span>
      </td>
      <td className="py-3 px-3">
        <span className={cn(NUM, 'text-[11px] text-slate-600 dark:text-slate-300')}>
          {student.date}
        </span>
      </td>
      <td className="py-3 pr-3 pl-2 text-right">
        <span className="inline-flex p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </td>
    </tr>
  );
}

function PortalPreviewStudentTable() {
  return (
    <div className="overflow-x-auto px-4 sm:px-6 pb-2">
      <table className="w-full min-w-[540px] text-left text-xs border-collapse">
        <thead>
          <tr
            className={cn(
              WELL,
              'border-y border-[#e4e2f0]/70 dark:border-white/[0.07] text-slate-500 dark:text-slate-400'
            )}
          >
            <th
              scope="col"
              className="py-2.5 pl-3 pr-2 font-bold uppercase tracking-wider text-[10px]"
            >
              Student
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
              Plan Tier
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
              Access Status
            </th>
            <th scope="col" className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">
              Valid Until
            </th>
            <th scope="col" className="py-2.5 pr-3 pl-2 text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e4e2f0]/60 dark:divide-white/[0.05]">
          {demoStudents.map((student) => (
            <StudentTableRow key={student.name} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PortalPreviewFootnote() {
  return (
    <div className="p-4 sm:px-6 bg-slate-50/70 dark:bg-white/[0.01] border-t border-[#e4e2f0]/70 dark:border-white/[0.05] flex items-center justify-between gap-4">
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Interactive sample data preview. Your institution portal provides dedicated management for
        your own students.
      </p>
      <Link
        to={content.primaryHref}
        className="shrink-0 text-xs font-bold text-[#5a63df] dark:text-[#8f97ff] hover:underline inline-flex items-center gap-1"
      >
        Request your portal <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function PortalPreview() {
  return (
    <figure
      className={cn(
        PANEL,
        'relative overflow-hidden p-0 shadow-sm transition-all duration-200 hover:shadow-md'
      )}
      aria-label="Illustrative institution portal preview"
    >
      <PortalPreviewTopBar />
      <PortalPreviewTabsHeader />
      <PortalPreviewSearchBar />
      <PortalPreviewStudentTable />
      <PortalPreviewFootnote />
    </figure>
  );
}
