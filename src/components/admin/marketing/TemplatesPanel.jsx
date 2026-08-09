import { useMemo, useState } from 'react';
import { Edit3, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import {
  AdminButton,
  Empty,
  MICRO,
  MUTED,
  PANEL,
  Pill,
  SectionLabel,
  TITLE,
} from '@/components/admin/ui/primitives';
import TemplateDialog from './dialogs/TemplateDialog';
import { CHANNEL_SHORT, OBJECTIVES } from './shared';

/**
 * Templates are grouped by objective rather than listed flat. A dozen
 * same-looking cards gave no sense of coverage; grouped, it is obvious at a
 * glance that (say) retention has no starting point written yet.
 */
const TemplatesPanel = ({ templates, onRefresh }) => {
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (payload) => {
    setSaving(true);
    try {
      if (editor?.id) await MarketingService.updateTemplate(editor.id, payload);
      else await MarketingService.createTemplate(payload);
      toast.success(editor?.id ? 'Template updated' : 'Template created');
      setEditor(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const groups = useMemo(
    () =>
      OBJECTIVES.map(([value, label]) => ({
        value,
        label,
        items: templates.filter((template) => template.objective === value),
      })).filter((group) => group.items.length),
    [templates]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-[11px] font-medium', MUTED)}>
          Reusable draft content. Templates prefill a campaign and never send on their own.
        </p>
        <AdminButton onClick={() => setEditor({})}>
          <Plus className="h-3.5 w-3.5" />
          New template
        </AdminButton>
      </div>

      {!templates.length ? (
        <div className={PANEL}>
          <Empty
            icon={FileText}
            title="No templates yet"
            action={
              <AdminButton size="sm" onClick={() => setEditor({})}>
                <Plus className="h-3 w-3" />
                Create a template
              </AdminButton>
            }
          >
            Save the message you keep rewriting — objective, channels, headline, and CTA — so the
            next campaign starts from something proven.
          </Empty>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.value} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <SectionLabel>{group.label}</SectionLabel>
              <span className={cn(MICRO, MUTED)}>
                {group.items.length} template{group.items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((template) => (
                <div key={template.id} className={cn(PANEL, 'flex flex-col p-4')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={cn(TITLE, 'truncate')}>{template.name}</h3>
                      <p className={cn('mt-1 text-[11px] font-medium', MUTED)}>
                        {template.description || 'Reusable campaign starting point'}
                      </p>
                    </div>
                    <Pill tone={template.is_active ? 'ok' : 'neutral'}>
                      {template.is_active ? 'ready' : 'hidden'}
                    </Pill>
                  </div>
                  <p className="mt-3 text-xs font-bold leading-snug text-stone-800 dark:text-stone-100">
                    {template.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                    {template.message}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {template.channels.map((channel) => (
                        <Pill key={channel} tone="neutral">
                          {CHANNEL_SHORT[channel] || channel.replace('_', ' ')}
                        </Pill>
                      ))}
                    </div>
                    <AdminButton size="sm" variant="outline" onClick={() => setEditor(template)}>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <TemplateDialog
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        template={editor?.id ? editor : null}
        onSave={save}
        saving={saving}
      />
    </div>
  );
};

export default TemplatesPanel;
