import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/cn';
import {
  REPORT_LANGUAGES,
  reportLanguage,
} from '../../../../../../supabase/functions/_shared/reportLanguages';
import { QUIET_BUTTON, TEXT_BUTTON } from './reportStyles';

export function ReportToolbar({ t, onLanguageChange, onDownloadPdf, isDownloadingPdf }) {
  return (
    <div
      lang={t.language}
      dir={t.rtl ? 'rtl' : 'ltr'}
      className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end"
    >
      <div className="flex min-w-0 items-center gap-2">
        <label
          id="writing-report-language-label"
          htmlFor="writing-report-language"
          className="sr-only min-[400px]:not-sr-only text-[12.5px] font-medium text-slate-500 dark:text-slate-400"
        >
          {t('reportLanguage')}
        </label>
        <Select value={t.language} onValueChange={onLanguageChange} dir={t.rtl ? 'rtl' : 'ltr'}>
          <SelectTrigger
            id="writing-report-language"
            aria-labelledby="writing-report-language-label"
            className={cn(
              'h-8 w-auto min-w-[7rem] max-w-full gap-2 rounded-lg border border-[#e4e2f0] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-slate-800 shadow-none transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#cfcce4] hover:bg-white focus:outline-none focus:ring-0 focus-visible:border-[#5a63df]/60 focus-visible:ring-1 focus-visible:ring-[#5a63df]/40 active:scale-[0.98] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08]'
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="end"
            className="min-w-[12rem] rounded-xl border border-[#e4e2f0] bg-white p-1 shadow-[0_10px_28px_-8px_rgba(23,24,61,0.14)] dark:border-white/[0.1] dark:bg-[#141319] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
          >
            {REPORT_LANGUAGES.map((language) => (
              <SelectItem
                key={language.code}
                value={language.code}
                lang={language.code}
                className="cursor-pointer rounded-lg py-1.5 ps-2.5 pe-8 text-[12.5px] font-medium text-slate-700 transition-colors duration-100 focus:bg-[#f2f1fb] focus:text-[#3e46b8] data-[state=checked]:font-semibold data-[state=checked]:text-[#5a63df] dark:text-slate-200 dark:focus:bg-white/[0.07] dark:focus:text-white dark:data-[state=checked]:text-[#afb5ff]"
              >
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        className={cn(
          QUIET_BUTTON,
          'min-h-0 h-8 rounded-lg border-[#e4e2f0] bg-white px-3 py-1 text-[12.5px] font-semibold text-slate-800 hover:border-[#cfcce4] hover:text-slate-900 focus-visible:ring-1 focus-visible:ring-[#5a63df]/40 active:scale-[0.98] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-100 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08]'
        )}
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
