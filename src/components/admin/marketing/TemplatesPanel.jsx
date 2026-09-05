import { useMemo, useState } from 'react';
import { FileText, Pencil, Plus } from 'lucide-react';
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
  WELL,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <p className={cn('text-[11px] font-medium', MUTED)}>
          Reusable draft content. Templates prefill a campaign and never send on their own.
        </p>
        <AdminButton
          onClick={() => setEditor({})}
          className="w-full sm:w-auto shrink-0 justify-center"
        >
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
            <div className="flex items-center gap-2">
              <SectionLabel>{group.label}</SectionLabel>
              <span className={cn(MICRO, MUTED, 'text-[10px] leading-none')}>
                {group.items.length} template{group.items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((template) => (
                <div key={template.id} className={cn(PANEL, 'flex flex-col p-3 pl-3.5 text-xs')}>
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[12px] font-extrabold leading-snug text-stone-900 dark:text-stone-50 line-clamp-1">
                        {template.name}
                      </h3>
                      <p
                        className={cn(
                          'mt-0.5 text-[10px] font-medium leading-normal line-clamp-2',
                          MUTED
                        )}
                      >
                        {template.description || 'Reusable campaign starting point'}
                      </p>
                    </div>
                    <Pill
                      tone={template.is_active ? 'ok' : 'neutral'}
                      className="px-1.5 py-0 text-[9px] shrink-0"
                    >
                      {template.is_active ? 'ready' : 'hidden'}
                    </Pill>
                  </div>

                  <div className={cn(WELL, 'mt-2 rounded-md p-2')}>
                    <p className="text-[11px] font-bold leading-snug text-stone-800 dark:text-stone-100 line-clamp-2">
                      {template.title}
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-stone-600 dark:text-stone-300 line-clamp-2">
                      {template.message}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-1.5 pt-2 border-t border-stone-200/80 mt-2 dark:border-white/[0.07]">
                    <div className="flex flex-wrap items-center gap-1">
                      {template.channels.map((channel) => (
                        <Pill key={channel} tone="neutral" className="px-1.5 py-0 text-[9px]">
                          {CHANNEL_SHORT[channel] || channel.replace('_', ' ')}
                        </Pill>
                      ))}
                    </div>
                    <AdminButton
                      size="sm"
                      variant="outline"
                      onClick={() => setEditor(template)}
                      className="h-6 px-2 text-[10px] shrink-0"
                    >
                      <Pencil className="mr-0.5 h-2.5 w-2.5" />
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
