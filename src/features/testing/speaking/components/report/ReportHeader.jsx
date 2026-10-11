import React from 'react';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { MUTED, NUM, PANEL } from '@/features/dashboard/components/primitives';
import { FOCUS_RING, QUIET_BUTTON } from './reportStyles';

export default function ReportHeader({
  testTitle,
  dateLabel,
  dateTime,
  onDownloadPdf,
  isDownloadingPdf,
}) {
  return (
    <header className={cn(PANEL, 'flex items-center gap-3 px-3 py-2.5 sm:px-4')}>
      <Link
        to="/speaking"
        aria-label="Back to Speaking"
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-[#f4f3fb] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-white',
          FOCUS_RING
        )}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <div className="min-w-0 flex-1">
        <p className={cn('text-[11.5px] font-semibold', MUTED)}>Speaking report</p>
        <h1 className="line-clamp-2 text-[16px] leading-snug sm:truncate font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[17px]">
          {testTitle || 'IELTS Speaking test'}
        </h1>
      </div>

      {dateLabel && (
        <time dateTime={dateTime} className={cn(NUM, 'hidden text-xs sm:block', MUTED)}>
          {dateLabel}
        </time>
      )}

      <button
        type="button"
        onClick={onDownloadPdf}
        disabled={isDownloadingPdf}
        className={QUIET_BUTTON}
      >
        {isDownloadingPdf ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {isDownloadingPdf ? 'Preparing PDF' : 'Download PDF'}
        </span>
        <span className="sm:hidden">PDF</span>
      </button>
    </header>
  );
}
