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
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 dark:border-white/5"
      data-oid="itixo-l"
    >
      <div className="flex items-start gap-4 mb-6" data-oid="7wx47o7">
        <div
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0"
          data-oid="d5ol-1u"
        >
          <Shield className="w-6 h-6 text-white" data-oid="wb4fyik" />
        </div>
        <div data-oid="hht2:p3">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white" data-oid="61mnn3e">
            Your Data, Your Rights
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1" data-oid="nn0yb57">
            GDPR Article 20 - Right to Data Portability
          </p>
        </div>
      </div>

      <div className="space-y-6" data-oid="ju:jc25">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed" data-oid="grj:kd:">
          You have the right to receive a copy of all personal data we hold about you in a commonly
          used, machine-readable format. This includes your profile information, test history,
          vocabulary, achievements, and consent records.
        </p>

        {/* Data Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-oid="4yel4ir">
          {[
            { label: 'Profile', icon: '👤' },
            { label: 'Test History', icon: '📊' },
            { label: 'Vocabulary', icon: '📚' },
            { label: 'Achievements', icon: '🏆' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center"
              data-oid="jls.y3h"
            >
              <span className="text-2xl mb-2 block" data-oid="u7plml.">
                {item.icon}
              </span>
              <span
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
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
              ? { scale: [1, 1.02, 1] }
              : exportStatus === 'error'
                ? { x: [0, -5, 5, -5, 5, 0] }
                : {}
          }
          transition={{ duration: 0.4 }}
          data-oid="nbttsc2"
        >
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              'w-full h-14 rounded-2xl font-bold text-base transition-all shadow-lg',
              exportStatus === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : exportStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/25'
                  : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-slate-500/25'
            )}
            data-oid="xxb5sk8"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" data-oid=":5fj5:a" />
                Preparing Export...
              </>
            ) : exportStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" data-oid="_aef_4m" />
                Download Complete!
              </>
            ) : exportStatus === 'error' ? (
              <>
                <AlertCircle className="w-5 h-5 mr-2" data-oid="vf5fmdj" />
                Try Again
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" data-oid="o5:orgh" />
                Download My Data (JSON)
              </>
            )}
          </Button>
        </motion.div>

        {/* Info Box */}
        <div
          className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
          data-oid="zs3yjgh"
        >
          <div className="flex items-start gap-3" data-oid="g:6lntr">
            <FileJson
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              data-oid="px0taup"
            />

            <div className="text-sm text-blue-700 dark:text-blue-300" data-oid="2gm7i.b">
              <p className="font-semibold mb-1" data-oid="3ua0vjy">
                About Your Export
              </p>
              <p className="opacity-80" data-oid="7dze0bz">
                Your data will be exported in JSON format, which can be opened by any text editor or
                imported into other services. The export includes all data associated with your
                account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
