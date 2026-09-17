import React, { useState } from 'react';
import { m } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  FileJson,
  Loader2,
  Trophy,
  User,
} from 'lucide-react';
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
  { label: 'Profile', icon: User, tone: 'accent' },
  { label: 'Test history', icon: BarChart3, tone: 'sky' },
  { label: 'Vocabulary', icon: BookOpen, tone: 'emerald' },
  { label: 'Achievements', icon: Trophy, tone: 'amber' },
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
          <div
            key={item.label}
            className={cn(
              TILE,
              'group flex flex-col items-center justify-center p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5a63df]/35 dark:hover:border-white/18'
            )}
          >
            <IconChip
              icon={item.icon}
              tone={item.tone}
              size="md"
              className="mb-2 h-9 w-9 rounded-lg transition-transform duration-200 group-hover:scale-105 [&>svg]:h-4.5 [&>svg]:w-4.5"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
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
            'flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold text-white transition-all duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]',
            exportStatus === 'success'
              ? 'bg-[rgb(var(--signal-ok))] hover:brightness-105'
              : exportStatus === 'error'
                ? 'bg-[rgb(var(--signal-fault))] hover:brightness-105'
                : 'bg-[#5a63df] hover:bg-[#4d55cc] shadow-xs'
          )}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Preparing export...</span>
            </>
          ) : exportStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Download complete!</span>
            </>
          ) : exportStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Try again</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 shrink-0" />
              <span>Download my data (JSON)</span>
            </>
          )}
        </button>
      </m.div>

      <div className={cn(TILE, 'mt-4 flex items-start gap-3 rounded-lg p-3.5')}>
        <IconChip
          icon={FileJson}
          tone="accent"
          size="md"
          className="h-8 w-8 shrink-0 rounded-lg [&>svg]:h-4 [&>svg]:w-4"
        />
        <div className="min-w-0 flex-1 text-xs">
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
