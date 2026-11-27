import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { REPORT_LANGUAGES } from '../../../../../../supabase/functions/_shared/reportLanguages';
import { reportT } from '../reportStrings';
import { reportFontFamily, useReportFonts } from '../useReportFonts';
import { PRIMARY_BUTTON, QUIET_BUTTON } from './reportStyles';

/**
 * Asked once, with the learner's first report. Closing it keeps English, so it
 * never comes back. The wording follows the language being considered.
 */
export function LanguagePromptDialog({ onChoose }) {
  const [selected, setSelected] = useState('en');
  const t = reportT(selected);
  useReportFonts(selected);
  return (
    <Dialog open onOpenChange={(open) => !open && onChoose('en')}>
      <DialogContent
        className="motion-reduce:animate-none! max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md gap-3 overflow-y-auto rounded-2xl border-[#e4e2f0] p-4 shadow-none sm:p-5 dark:border-white/10 dark:bg-[#121217]"
        lang={selected}
        dir={t.rtl ? 'rtl' : 'ltr'}
        style={{ fontFamily: reportFontFamily(selected) }}
        hideClose
      >
        <DialogTitle className="text-[18px] font-extrabold tracking-[-0.01em]">
          {t('promptTitle')}
        </DialogTitle>
        <DialogDescription className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
          {t('promptBody')} {t('creditPrompt')}
        </DialogDescription>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">{t('reportLanguage')}</legend>
          {REPORT_LANGUAGES.map((language) => (
            <label
              key={language.code}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13.5px] font-bold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#5a63df]',
                selected === language.code
                  ? 'border-[#5a63df] bg-[#5a63df]/8 text-[#3a41ad] dark:text-[#c3c7ff]'
                  : 'border-[#e4e2f0] text-slate-800 hover:border-[#5a63df]/40 dark:border-white/10 dark:text-slate-100'
              )}
            >
              <input
                type="radio"
                name="report-language"
                value={language.code}
                checked={selected === language.code}
                onChange={() => setSelected(language.code)}
                className="sr-only"
              />
              <span lang={language.code}>{language.name}</span>
              {selected === language.code && (
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </label>
          ))}
        </fieldset>
        <p className="text-[12px] text-slate-500 dark:text-slate-400">{t('promptLater')}</p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            className={cn(PRIMARY_BUTTON, 'flex-1')}
            onClick={() => onChoose(selected)}
          >
            {t(selected === 'en' ? 'promptKeep' : 'promptSave')}
          </button>
          {selected !== 'en' && (
            <button type="button" className={QUIET_BUTTON} onClick={() => onChoose('en')}>
              {t('promptKeep')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
