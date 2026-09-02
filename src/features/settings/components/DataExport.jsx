import React, { useState } from 'react';
import { m } from 'framer-motion';
import { AlertCircle, CheckCircle2, Download, FileJson, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  IconChip,
  MUTED,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

const CATEGORIES = [
  { label: 'Profile', icon: '👤' },
  { label: 'Test history', icon: '📊' },
  { label: 'Vocabulary', icon: '📚' },
  { label: 'Achievements', icon: '🏆' },
];

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const { data, error } = await supabase.rpc('export_user_data');

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to export data');
      }

      const exportData = {
        export_info: {
          date: new Date().toISOString(),
          format_version: '1.0',
          service: 'IELTS Ai Pro',
          gdpr_article: 'Article 20 - Right to Data Portability',
        },
        user_profile: data.profile,
        test_sessions: data.test_sessions,
        consent_history: data.consent_history,
        vocabulary: data.vocabulary,
        achievements: data.achievements,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `ielts-ai-pro-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      toast.success('Data export complete', {
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      toast.error('Export failed', {
        description: error.message || 'Failed to export your data. Please try again.',
      });
    }

    setIsExporting(false);
  };

  return (
    <div className={cn(PANEL, 'p-4 sm:p-5')}>
      <div className="flex items-center justify-between">
        <PanelTitle label="Your data, your rights" accent />
        <Pill tone="emerald">GDPR Art. 20</Pill>
      </div>
      <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
        Right to Data Portability &amp; machine-readable export.
      </p>

      <p className="mb-4 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
        You have the right to receive a copy of all personal data we hold about you in a
        machine-readable format (profile, test history, vocabulary, achievements, and consent
        records).
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {CATEGORIES.map((item) => (
          <div key={item.label} className={cn(TILE, 'p-2.5 text-center')}>
            <span className="mb-1 block text-lg">{item.icon}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <m.div
        initial={false}
        animate={
          exportStatus === 'success'
            ? { scale: [1, 1.01, 1] }
            : exportStatus === 'error'
              ? { x: [0, -4, 4, -4, 4, 0] }
              : {}
        }
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            'flex h-10 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-70',
            exportStatus === 'success'
              ? 'bg-[rgb(var(--signal-ok))]'
              : exportStatus === 'error'
                ? 'bg-[rgb(var(--signal-fault))]'
                : 'bg-[#5a63df]'
          )}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing export...
            </>
          ) : exportStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Download complete!
            </>
          ) : exportStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4" />
              Try again
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download my data (JSON)
            </>
          )}
        </button>
      </m.div>

      <div className={cn(TILE, 'mt-4 flex items-start gap-2.5 p-3.5')}>
        <IconChip icon={FileJson} size="sm" />
        <div className="text-xs">
          <p className="mb-0.5 font-bold text-slate-900 dark:text-white">About your export</p>
          <p className={cn('font-medium leading-relaxed', MUTED)}>
            Your data will be exported in JSON format, which can be opened by any text editor or
            imported into other services.
          </p>
        </div>
      </div>
    </div>
  );
}
