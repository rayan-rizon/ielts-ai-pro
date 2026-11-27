import React from 'react';
import { ChevronDown, Download, Languages, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  REPORT_LANGUAGES,
  reportLanguage,
} from '../../../../../../supabase/functions/_shared/reportLanguages';
import { FOCUS_RING, QUIET_BUTTON, TEXT_BUTTON } from './reportStyles';

export function ReportToolbar({ t, onLanguageChange, onDownloadPdf, isDownloadingPdf }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Languages
          className="h-4 w-4 shrink-0 text-[#5a63df] dark:text-[#afb5ff]"
          aria-hidden="true"
        />
        <label
          htmlFor="writing-report-language"
          className="sr-only @sm:not-sr-only @sm:text-[12.5px] @sm:font-bold @sm:text-slate-600 @sm:dark:text-slate-300"
        >
          {t('reportLanguage')}
        </label>
        <span className="relative">
          <select
            id="writing-report-language"
            value={t.language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className={cn(
              'min-h-10 max-w-full appearance-none rounded-lg border border-[#dcdaea] bg-white py-1.5 pe-8 ps-3 text-[13px] font-bold text-slate-900 cursor-pointer dark:border-white/12 dark:bg-[#16151c] dark:text-white',
              FOCUS_RING
            )}
          >
            {REPORT_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        </span>
      </div>
      <button
        type="button"
        className={QUIET_BUTTON}
        onClick={onDownloadPdf}
        disabled={isDownloadingPdf}
      >
        {isDownloadingPdf ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {isDownloadingPdf ? t('pdfPreparing') : t('pdf')}
      </button>
    </div>
  );
}

export function LanguageNotice({ t, status, onRetry, onTranslate, saveFailed }) {
  if (t.language === 'en' && !saveFailed) return null;
  const name = reportLanguage(t.language).name;
  return (
    <div className="space-y-2" aria-live="polite">
      {saveFailed && (
        <p className="rounded-lg border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] px-3 py-2 text-[12.5px] text-slate-800 dark:text-slate-100">
          {t('languageSaveFailed')}
        </p>
      )}
      {status === 'loading' && (
        <p className="flex items-center gap-2 rounded-lg bg-[#efeef8] px-3 py-2 text-[12.5px] text-slate-700 dark:bg-white/[0.07] dark:text-slate-200">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
          {t('translating')}
        </p>
      )}
      {status === 'offer' && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg bg-[#efeef8] px-3 py-2 dark:bg-white/[0.07]">
          <p className="min-w-0 flex-1 basis-52 text-[12.5px] text-slate-700 dark:text-slate-200">
            {t('creditOffer')}
          </p>
          <button type="button" className={QUIET_BUTTON} onClick={onTranslate}>
            {t('creditButton')}
          </button>
        </div>
      )}
      {status === 'no_credit' && (
        <p className="rounded-lg border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] px-3 py-2 text-[12.5px] text-slate-800 dark:text-slate-100">
          {t('noCredit')}
        </p>
      )}
      {status === 'failed' && (
        <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-[rgb(var(--signal-warn)/0.35)] bg-[rgb(var(--signal-warn)/0.08)] px-3 py-2 text-[12.5px] text-slate-800 dark:text-slate-100">
          <span>{t('translateFailed')}</span>
          <button type="button" className={TEXT_BUTTON} onClick={onRetry}>
            {t('tryAgain')}
          </button>
        </p>
      )}
      {status === 'ready' && (
        <p className="rounded-lg bg-[#efeef8] px-3 py-2 text-[12.5px] text-slate-700 dark:bg-white/[0.07] dark:text-slate-200">
          {t('languageNote', { language: name })}
        </p>
      )}
    </div>
  );
}
