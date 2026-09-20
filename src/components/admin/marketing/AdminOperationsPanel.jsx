import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { History, ChevronDown, RefreshCw } from 'lucide-react';
import { AdminButton, PANEL, PanelHeader } from '@/components/admin/ui/primitives';
import { cn } from '@/lib/cn';
import { report } from './operations/operationsConstants';
import { AskAdminData } from './operations/AskAdminData';
import { BriefingFindings } from './operations/BriefingFindings';
import { LearnerTimeline } from './operations/LearnerTimeline';

function useAdminBriefing(refreshKey, enabled) {
  const [brief, setBrief] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadBriefing = async () => {
    setBusy(true);
    setError('');
    try {
      setBrief(await report('admin_briefing'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setError('');
    report('admin_briefing')
      .then((value) => {
        if (active) setBrief(value);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [enabled, refreshKey]);

  return { brief, error, busy, loadBriefing };
}

function BriefingStatus({ brief, error }) {
  if (error) {
    return (
      <p role="alert" className="mt-2 text-xs font-semibold text-[rgb(var(--signal-fault))]">
        {error} Use Refresh briefing to retry.
      </p>
    );
  }

  if (!brief) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <p role="status">Loading briefing…</p>
      </div>
    );
  }

  return null;
}

function AdminHistoryAccordion({ isOpen }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <m.div
          id="admin-history-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            height: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
            opacity: { duration: 0.2, ease: 'easeInOut' },
          }}
          className="overflow-hidden"
        >
          <div className="border-t border-stone-200/80 pt-3.5 mt-3.5 pb-3 px-1 dark:border-white/[0.07]">
            <LearnerTimeline />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export default function AdminOperationsPanel({ refreshKey }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { brief, error, busy, loadBriefing } = useAdminBriefing(refreshKey, workspaceOpen);

  return (
    <div className={cn(PANEL, 'min-w-0 overflow-hidden')} id="admin-ai-workspace">
      <PanelHeader label="Optional analysis" title="Ask Copilot" accent="accent">
        <AdminButton
          variant="outline"
          size="sm"
          onClick={() => setWorkspaceOpen((value) => !value)}
          aria-expanded={workspaceOpen}
          aria-controls="admin-ai-workspace-content"
        >
          {workspaceOpen ? 'Close' : 'Open'}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-150 ease-out',
              workspaceOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </AdminButton>
      </PanelHeader>

      <AnimatePresence initial={false}>
        {workspaceOpen && (
          <m.div
            id="admin-ai-workspace-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden border-t border-stone-200/80 dark:border-white/[0.07]"
          >
            <div className="flex justify-end gap-1.5 px-3.5 pt-3.5">
              <AdminButton
                variant={historyOpen ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setHistoryOpen(!historyOpen)}
                aria-expanded={historyOpen}
                aria-controls="admin-history-panel"
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Learner history</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200 ease-out',
                    historyOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                loading={busy}
                onClick={loadBriefing}
                aria-label="Refresh briefing"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              </AdminButton>
            </div>

            <div className="px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
              <AskAdminData />
              <BriefingStatus brief={brief} error={error} />
              <BriefingFindings brief={brief} />
              <AdminHistoryAccordion isOpen={historyOpen} />
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
