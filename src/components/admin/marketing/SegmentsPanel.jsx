import { m, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Pencil, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  Empty,
  MICRO,
  MUTED,
  NUM,
  PANEL,
  Pill,
  SectionLabel,
  WELL,
} from '@/components/admin/ui/primitives';
import SegmentDialog from './dialogs/SegmentDialog';
import { describeRules } from './shared';

/**
 * The estimate read-out. Three numbers matter here and they are not
 * interchangeable: how many learners match, how many of those can legally be
 * emailed, and how many are suppressed. The old card printed only "total ·
 * suppressed", which left the actually-mailable figure to mental arithmetic.
 */
const EstimateReadout = ({ estimate }) => {
  if (!estimate) {
    return (
      <p className={cn('text-[11px] font-medium', MUTED)}>
        Not estimated yet — run an estimate to see how many learners match.
      </p>
    );
  }
  if (estimate.loading) {
    return <p className={cn('text-[11px] font-medium', MUTED)}>Estimating…</p>;
  }
  const rows = [
    ['In segment', estimate.total, 'neutral'],
    ['Email-ready', estimate.email_eligible, 'ok'],
    ['Suppressed', estimate.email_suppressed, 'warn'],
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {rows.map(([label, value, tone]) => (
        <div key={label} className="min-w-0">
          <p className={cn(MICRO, MUTED, 'truncate')}>{label}</p>
          <p
            className={cn(
              NUM,
              'mt-1 text-sm font-bold',
              tone === 'warn' && Number(value) > 0
                ? 'text-[rgb(var(--signal-warn))]'
                : 'text-stone-900 dark:text-stone-50'
            )}
          >
            {Number(value || 0).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

const SegmentsPanel = ({ segments, onRefresh }) => {
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [estimates, setEstimates] = useState({});
  const [toggling, setToggling] = useState(null);

  const save = async (payload) => {
    setSaving(true);
    try {
      if (editor?.id) await MarketingService.updateSegment(editor.id, payload);
      else await MarketingService.createSegment(payload);
      toast.success('Audience saved');
      setEditor(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not save audience');
    } finally {
      setSaving(false);
    }
  };

  const estimate = async (segment) => {
    try {
      setEstimates((value) => ({ ...value, [segment.id]: { loading: true } }));
      const data = await MarketingService.estimateSegment(segment.id);
      setEstimates((value) => ({ ...value, [segment.id]: data }));
    } catch (error) {
      setEstimates((value) => ({ ...value, [segment.id]: undefined }));
      toast.error(error.message || 'Could not estimate audience');
    }
  };

  const toggle = async (segment, isActive) => {
    setToggling(segment.id);
    try {
      await MarketingService.updateSegment(segment.id, { is_active: isActive });
      toast.success(`${segment.name} ${isActive ? 'enabled' : 'paused'}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update audience');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className={cn('text-[11px] font-medium', MUTED)}>
          Audiences are evaluated at send time, so membership stays current without a re-run.
        </p>
        <AdminButton
          onClick={() => setEditor({})}
          className="w-full sm:w-auto shrink-0 justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
          New audience
        </AdminButton>
      </div>

      {segments.length === 0 ? (
        <div className={PANEL}>
          <Empty
            icon={Users}
            title="No audiences defined"
            action={
              <AdminButton size="sm" onClick={() => setEditor({})}>
                <Plus className="h-3 w-3" />
                Create an audience
              </AdminButton>
            }
          >
            An audience is a set of rules — tier, activity, quota, exam date — that campaigns and
            journeys target.
          </Empty>
        </div>
      ) : (
        <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {segments.map((segment) => {
              const chips = describeRules(segment.rules);
              return (
                <m.div
                  key={segment.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    PANEL,
                    'flex flex-col p-3 text-xs transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-xs hover:border-stone-300 dark:hover:border-white/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-[12px] font-extrabold text-stone-900 dark:text-stone-50">
                        {segment.name}
                      </h3>
                      <p className={cn('truncate text-[10px] font-medium leading-tight', MUTED)}>
                        {segment.description || 'Reusable dynamic audience'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Pill tone={segment.is_active ? 'ok' : 'neutral'}>
                        {segment.is_active ? 'active' : 'paused'}
                      </Pill>
                      <Switch
                        aria-label={`Toggle ${segment.name}`}
                        checked={segment.is_active}
                        disabled={toggling === segment.id}
                        onCheckedChange={(checked) => toggle(segment, checked)}
                      />
                    </div>
                  </div>

                  <div className={cn(WELL, 'mt-2.5 rounded-md p-2')}>
                    <SectionLabel accent={chips.length ? 'ok' : 'warn'}>
                      {chips.length ? 'Matches learners who are' : 'Matches everyone'}
                    </SectionLabel>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {chips.length ? (
                        chips.map((chip) => (
                          <Pill key={chip} tone="neutral" className="normal-case tracking-normal">
                            {chip}
                          </Pill>
                        ))
                      ) : (
                        <p className={cn('text-[10px] font-medium', MUTED)}>
                          No rules set — every learner matches.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto min-h-[36px] pt-2.5">
                    <EstimateReadout estimate={estimates[segment.id]} />
                  </div>

                  <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-stone-200/80 pt-2.5 dark:border-white/[0.07]">
                    <AdminButton
                      size="sm"
                      variant="outline"
                      loading={estimates[segment.id]?.loading}
                      onClick={() => estimate(segment)}
                    >
                      <Users className="h-2.5 w-2.5" />
                      Estimate
                    </AdminButton>
                    <AdminButton size="sm" variant="outline" onClick={() => setEditor(segment)}>
                      <Pencil className="h-2.5 w-2.5" />
                      Edit
                    </AdminButton>
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <SegmentDialog
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        segment={editor?.id ? editor : null}
        onSave={save}
        saving={saving}
      />
    </div>
  );
};

export default SegmentsPanel;
