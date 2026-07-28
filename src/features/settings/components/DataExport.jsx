import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

/**
 * Data Export Component
 * GDPR Article 20 - Right to Data Portability compliance
 */
export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // null | 'success' | 'error'

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      // Call the database RPC function
      const { data, error } = await supabase.rpc('export_user_data');

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to export data');
      }

      // Create a downloadable JSON file
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

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `ielts-ai-pro-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      toast.success('Data Export Complete', {
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      toast.error('Export Failed', {
        description: error.message || 'Failed to export your data. Please try again.',
      });
    }

    setIsExporting(false);
  };

  return (
    <div
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-5"
      data-oid="itixo-l"
    >
      <div className="flex items-center gap-3" data-oid="7wx47o7">
        <div
          className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xs"
          data-oid="d5ol-1u"
        >
          <Shield className="w-5 h-5" data-oid="wb4fyik" />
        </div>
        <div data-oid="hht2:p3">
          <div className="flex items-center gap-2">
            <h3
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              data-oid="61mnn3e"
            >
              Your Data, Your Rights
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider">
              GDPR Art. 20
            </span>
          </div>
          <p
            className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium"
            data-oid="nn0yb57"
          >
            Right to Data Portability & Machine-Readable Export
          </p>
        </div>
      </div>

      <div className="space-y-4" data-oid="ju:jc25">
        <p
          className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium"
          data-oid="grj:kd:"
        >
          You have the right to receive a copy of all personal data we hold about you in a
          machine-readable format (profile, test history, vocabulary, achievements, and consent
          records).
        </p>

        {/* Data Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" data-oid="4yel4ir">
          {[
            { label: 'Profile', icon: '👤' },
            { label: 'Test History', icon: '📊' },
            { label: 'Vocabulary', icon: '📚' },
            { label: 'Achievements', icon: '🏆' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/5 text-center transition-all hover:border-slate-300 dark:hover:border-white/10"
              data-oid="jls.y3h"
            >
              <span className="text-lg mb-1 block" data-oid="u7plml.">
                {item.icon}
              </span>
              <span
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                data-oid="06bjzw0"
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Export Button */}
        <motion.div
          initial={false}
          animate={
            exportStatus === 'success'
              ? { scale: [1, 1.01, 1] }
              : exportStatus === 'error'
                ? { x: [0, -4, 4, -4, 4, 0] }
                : {}
          }
          transition={{ duration: 0.3 }}
          data-oid="nbttsc2"
        >
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'w-full h-11 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 border-0',
              exportStatus === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : exportStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
            )}
            data-oid="xxb5sk8"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" data-oid=":5fj5:a" />
                Preparing Export...
              </>
            ) : exportStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" data-oid="_aef_4m" />
                Download Complete!
              </>
            ) : exportStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" data-oid="vf5fmdj" />
                Try Again
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" data-oid="o5:orgh" />
                Download My Data (JSON)
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Box */}
        <div
          className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20"
          data-oid="zs3yjgh"
        >
          <div className="flex items-start gap-2.5" data-oid="g:6lntr">
            <FileJson
              className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              data-oid="px0taup"
            />

            <div className="text-xs text-blue-700 dark:text-blue-300" data-oid="2gm7i.b">
              <p className="font-bold mb-0.5" data-oid="3ua0vjy">
                About Your Export
              </p>
              <p className="opacity-85 font-medium leading-relaxed" data-oid="7dze0bz">
                Your data will be exported in JSON format, which can be opened by any text editor or
                imported into other services.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
