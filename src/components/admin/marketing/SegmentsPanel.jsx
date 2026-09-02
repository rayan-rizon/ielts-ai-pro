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
  TITLE,
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
        <div key={label}>
          <p className={cn(MICRO, MUTED)}>{label}</p>
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
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-[11px] font-medium', MUTED)}>
          Audiences are evaluated at send time, so membership stays current without a re-run.
        </p>
        <AdminButton onClick={() => setEditor({})}>
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
          {segments.map((segment) => {
            const chips = describeRules(segment.rules);
            return (
              <div key={segment.id} className={cn(PANEL, 'flex flex-col p-2.5 pl-3.5 text-xs')}>
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
                    <Pill
                      tone={segment.is_active ? 'ok' : 'neutral'}
                      className="px-1.5 py-0 text-[9px]"
                    >
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

                <div className={cn(WELL, 'mt-2 rounded-md p-2')}>
                  <SectionLabel accent={chips.length ? 'ok' : 'warn'}>
                    {chips.length ? 'Matches learners who are' : 'Matches everyone'}
                  </SectionLabel>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {chips.length ? (
                      chips.map((chip) => (
                        <Pill
                          key={chip}
                          tone="neutral"
                          className="px-1.5 py-0 text-[9px] normal-case tracking-normal"
                        >
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

                <div className="mt-2 min-h-[36px]">
                  <EstimateReadout estimate={estimates[segment.id]} />
                </div>

                <div className="mt-2 flex items-center justify-end gap-1 border-t border-stone-200/80 pt-2 dark:border-white/[0.07]">
                  <AdminButton
                    size="sm"
                    variant="outline"
                    loading={estimates[segment.id]?.loading}
                    onClick={() => estimate(segment)}
                    className="h-7 px-2 text-[11px]"
                  >
                    <Users className="mr-0.5 h-2.5 w-2.5" />
                    Estimate
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="outline"
                    onClick={() => setEditor(segment)}
                    className="h-7 px-2 text-[11px]"
                  >
                    <Pencil className="mr-0.5 h-2.5 w-2.5" />
                    Edit
                  </AdminButton>
                </div>
              </div>
            );
          })}
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
