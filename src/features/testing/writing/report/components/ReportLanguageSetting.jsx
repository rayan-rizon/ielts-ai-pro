import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MUTED, PANEL, PanelTitle, TILE } from '@/features/dashboard/components/primitives.jsx';
import { REPORT_LANGUAGES } from '../../../../../../supabase/functions/_shared/reportLanguages';
import { reportT } from '../reportStrings';
import { reportFontFamily, useReportFonts } from '../useReportFonts';
import { useReportLanguage } from '../useReportLanguage';
import { FOCUS_RING, PRIMARY_BUTTON } from './reportStyles';

/**
 * The report language in profile settings. It has its own save so choosing a
 * language never triggers the goal save (which rebuilds paid study plans).
 */
export function ReportLanguageSetting() {
  const { language, choose } = useReportLanguage();
  const [draft, setDraft] = useState(null);
  const [state, setState] = useState('idle');
  const selected = draft ?? language;
  const preview = reportT(selected);
  useReportFonts(selected);
  // After a failed save the choice must stay saveable.
  const changed = selected !== language || state === 'failed';

  const save = async () => {
    setState('saving');
    const saved = await choose(selected);
    setState(saved ? 'saved' : 'failed');
    setDraft(saved ? null : selected);
  };

  return (
    <div className={cn(PANEL, 'p-4 sm:p-5')}>
      <PanelTitle label="Report language" accent />
      <p className={cn('-mt-2 mb-3 text-xs font-medium', MUTED)}>
        The language that explains your Writing results.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Report language"
          value={selected}
          onChange={(event) => {
            setDraft(event.target.value);
            setState('idle');
          }}
          className={cn(
            'min-h-10 min-w-0 flex-1 rounded-lg border border-[#e2e5f2] bg-white px-3 text-sm font-bold text-slate-900 cursor-pointer dark:border-white/10 dark:bg-[#16151c] dark:text-white',
            FOCUS_RING
          )}
        >
          {REPORT_LANGUAGES.map((option) => (
            <option key={option.code} value={option.code}>
              {option.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={PRIMARY_BUTTON}
          onClick={save}
          disabled={!changed || state === 'saving'}
        >
          {state === 'saving' && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
          Save language
        </button>
      </div>
      <p
        data-testid="report-language-preview"
        lang={selected}
        dir={preview.rtl ? 'rtl' : 'ltr'}
        style={{ fontFamily: reportFontFamily(selected) }}
        className={cn(
          TILE,
          'mt-3 px-3 py-2 text-[12.5px] leading-relaxed text-slate-700 dark:text-slate-200'
        )}
      >
        {preview('settingsLanguageHelp')}
      </p>
      <div aria-live="polite">
        {state === 'saved' && (
          <p className="mt-2 text-xs font-bold text-[rgb(var(--signal-ok))]">
            Report language saved.
          </p>
        )}
      </div>
      {state === 'failed' && (
        <p role="alert" className="mt-2 text-xs font-bold text-[rgb(var(--signal-fault))]">
          {reportT('en')('languageSaveFailed')}
        </p>
      )}
    </div>
  );
}
