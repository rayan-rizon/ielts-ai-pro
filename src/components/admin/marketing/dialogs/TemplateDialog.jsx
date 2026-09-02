import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  FIELD,
  FieldLabel,
  MUTED,
  ToggleChip,
  WELL,
} from '@/components/admin/ui/primitives';
import { CHANNELS, OBJECTIVES, arrayToggle } from '../shared';

export const INITIAL_TEMPLATE = {
  name: '',
  description: '',
  objective: 'paid_conversion',
  channels: ['in_app'],
  subject: '',
  title: '',
  message: '',
  cta_label: 'View plans',
  cta_url: '/pricing',
  is_active: true,
};

const TemplateDialog = ({ open, onOpenChange, template, onSave, saving }) => {
  const [form, setForm] = useState(INITIAL_TEMPLATE);

  useEffect(() => {
    setForm(template ? { ...INITIAL_TEMPLATE, ...template } : INITIAL_TEMPLATE);
  }, [template, open]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error('Template name, headline, and message are required');
      return;
    }
    if (!form.channels.length) {
      toast.error('Choose at least one delivery channel');
      return;
    }
    onSave({
      ...form,
      subject: form.channels.includes('email') ? form.subject.trim() || form.title.trim() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit template' : 'New template'}</DialogTitle>
          <DialogDescription>
            Templates are reusable draft content. They never send on their own.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 md:grid-cols-2">
          <label className="block">
            <FieldLabel>Template name</FieldLabel>
            <Input
              className={FIELD}
              value={form.name}
              onChange={(event) => set({ name: event.target.value })}
            />
          </label>
          <label className="block">
            <FieldLabel>Objective</FieldLabel>
            <select
              className={cn(FIELD, 'w-full px-3')}
              value={form.objective}
              onChange={(event) => set({ objective: event.target.value })}
            >
              {OBJECTIVES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <FieldLabel hint="shown in the campaign editor">Description</FieldLabel>
            <Input
              className={FIELD}
              value={form.description}
              onChange={(event) => set({ description: event.target.value })}
              placeholder="When this template is useful"
            />
          </label>
          <div className="md:col-span-2">
            <FieldLabel>Channels</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(([id, label]) => (
                <ToggleChip
                  key={id}
                  active={form.channels.includes(id)}
                  onClick={() => set({ channels: arrayToggle(form.channels, id) })}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
          </div>
          {form.channels.includes('email') && (
            <label className="block md:col-span-2">
              <FieldLabel hint="falls back to the headline">Email subject</FieldLabel>
              <Input
                className={FIELD}
                value={form.subject}
                onChange={(event) => set({ subject: event.target.value })}
              />
            </label>
          )}
          <label className="block md:col-span-2">
            <FieldLabel>Headline</FieldLabel>
            <Input
              className={FIELD}
              value={form.title}
              onChange={(event) => set({ title: event.target.value })}
            />
          </label>
          <label className="block md:col-span-2">
            <FieldLabel>Message</FieldLabel>
            <Textarea
              className="min-h-24 border-stone-300 text-xs dark:border-white/15 dark:bg-[#131315]"
              value={form.message}
              onChange={(event) => set({ message: event.target.value })}
            />
          </label>
          <label className="block">
            <FieldLabel>CTA label</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_label}
              onChange={(event) => set({ cta_label: event.target.value })}
            />
          </label>
          <label className="block">
            <FieldLabel>CTA URL</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_url}
              onChange={(event) => set({ cta_url: event.target.value })}
            />
          </label>
          <label
            className={cn(
              WELL,
              'flex items-center justify-between gap-3 rounded-lg p-3 md:col-span-2'
            )}
          >
            <span>
              <span className="block text-xs font-bold text-stone-800 dark:text-stone-100">
                Available in campaign editor
              </span>
              <span className={cn('block text-[10px] font-medium', MUTED)}>
                Hidden templates stay saved but are not offered when drafting.
              </span>
            </span>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => set({ is_active: checked })}
            />
          </label>
        </div>
        <DialogFooter>
          <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton loading={saving} onClick={submit}>
            Save template
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateDialog;
