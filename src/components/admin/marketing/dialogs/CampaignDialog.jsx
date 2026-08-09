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
import { cn } from '@/lib/cn';
import {
  AdminButton,
  FIELD,
  FieldLabel,
  MICRO,
  MUTED,
  SectionLabel,
  TITLE,
  ToggleChip,
  WELL,
} from '@/components/admin/ui/primitives';
import { CHANNELS, OBJECTIVES, arrayToggle, toIso, toLocalDateTime } from '../shared';

export const INITIAL_CAMPAIGN = {
  name: '',
  objective: 'paid_conversion',
  status: 'draft',
  segment_id: '',
  channels: ['in_app'],
  subject: '',
  title: '',
  message: '',
  cta_label: 'View plans',
  cta_url: '/pricing',
  promo_code_id: '',
  starts_at: '',
  ends_at: '',
  frequency_cap: 1,
  cooldown_hours: 72,
};

/**
 * The campaign editor is grouped into three named steps — who it reaches, what
 * it says, and when it may send. The previous flat two-column grid put the
 * delivery cadence next to the headline, so the fields that decide whether a
 * learner gets spammed sat in the same visual weight as the CTA label.
 */
const Step = ({ index, label, description, children }) => (
  <section className="space-y-3">
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          MICRO,
          'grid h-4 w-4 place-items-center rounded-full bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300'
        )}
      >
        {index}
      </span>
      <SectionLabel>{label}</SectionLabel>
      {description && <span className={cn('text-[10px] font-medium', MUTED)}>· {description}</span>}
    </div>
    {children}
  </section>
);

const CampaignDialog = ({
  open,
  onOpenChange,
  campaign,
  segments,
  promos,
  templates,
  onSave,
  saving,
}) => {
  const [form, setForm] = useState(INITIAL_CAMPAIGN);
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    setTemplateId('');
    setForm(
      campaign
        ? {
            ...INITIAL_CAMPAIGN,
            ...campaign,
            segment_id: campaign.segment_id || '',
            promo_code_id: campaign.promo_code_id || '',
            starts_at: toLocalDateTime(campaign.starts_at),
            ends_at: toLocalDateTime(campaign.ends_at),
          }
        : INITIAL_CAMPAIGN
    );
  }, [campaign, open]);

  const applyTemplate = (id) => {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setForm((current) => ({
      ...current,
      name: current.name || template.name,
      objective: template.objective,
      channels: template.channels || ['in_app'],
      subject: template.subject || '',
      title: template.title,
      message: template.message,
      cta_label: template.cta_label || '',
      cta_url: template.cta_url || '',
    }));
  };

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const submit = () => {
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error('Campaign name, headline, and message are required');
      return;
    }
    if (!form.segment_id || form.channels.length === 0) {
      toast.error('Choose an audience and at least one channel');
      return;
    }
    onSave({
      ...form,
      segment_id: form.segment_id,
      promo_code_id: form.promo_code_id || null,
      subject: form.channels.includes('email') ? form.subject.trim() || form.title.trim() : null,
      starts_at: toIso(form.starts_at),
      ends_at: toIso(form.ends_at),
      frequency_cap: Number(form.frequency_cap) || 1,
      cooldown_hours: Number(form.cooldown_hours) || 0,
    });
  };

  const activeSegments = segments.filter((item) => item.is_active);
  const activePromos = promos.filter((item) => item.is_active);
  const activeTemplates = templates.filter((item) => item.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-3xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit campaign' : 'New campaign'}</DialogTitle>
          <DialogDescription>
            One audience, one measurable offer. Nothing sends until you activate and dispatch it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {!campaign && activeTemplates.length > 0 && (
            <div className={cn(WELL, 'rounded-lg p-3')}>
              <label className="block">
                <FieldLabel hint="prefills this draft only">Start from a template</FieldLabel>
                <select
                  className={cn(FIELD, 'w-full px-3')}
                  value={templateId}
                  onChange={(event) => applyTemplate(event.target.value)}
                >
                  <option value="">Blank campaign draft</option>
                  {activeTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.description ? ` · ${template.description}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <Step index="1" label="Audience" description="who receives it">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <FieldLabel>Campaign name</FieldLabel>
                <Input
                  className={FIELD}
                  value={form.name}
                  onChange={(event) => set({ name: event.target.value })}
                  placeholder="Free learner upgrade · August"
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
              <label className="block">
                <FieldLabel>Segment</FieldLabel>
                <select
                  className={cn(FIELD, 'w-full px-3')}
                  value={form.segment_id}
                  onChange={(event) => set({ segment_id: event.target.value })}
                >
                  <option value="">Choose segment…</option>
                  {activeSegments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {!activeSegments.length && (
                  <span className={cn('mt-1.5 block text-[10px] font-medium', MUTED)}>
                    No active segments yet — create one under Audiences first.
                  </span>
                )}
              </label>
              <label className="block">
                <FieldLabel>Offer code</FieldLabel>
                <select
                  className={cn(FIELD, 'w-full px-3')}
                  value={form.promo_code_id}
                  onChange={(event) => set({ promo_code_id: event.target.value })}
                >
                  <option value="">No offer attached</option>
                  {activePromos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code}
                      {item.label ? ` · ${item.label}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Step>

          <Step index="2" label="Message" description="what the learner sees">
            <div className="space-y-3">
              <div>
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
                <label className="block">
                  <FieldLabel hint="falls back to the headline">Email subject</FieldLabel>
                  <Input
                    className={FIELD}
                    value={form.subject}
                    onChange={(event) => set({ subject: event.target.value })}
                    placeholder="A focused offer for your IELTS target"
                  />
                </label>
              )}
              <label className="block">
                <FieldLabel>Headline</FieldLabel>
                <Input
                  className={FIELD}
                  value={form.title}
                  onChange={(event) => set({ title: event.target.value })}
                  placeholder="Keep your progress moving"
                />
              </label>
              <label className="block">
                <FieldLabel>Message</FieldLabel>
                <Textarea
                  className="min-h-24 border-stone-300 text-xs dark:border-white/15 dark:bg-[#131315]"
                  value={form.message}
                  onChange={(event) => set({ message: event.target.value })}
                  placeholder="Explain the next useful action in one or two sentences."
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
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
                    placeholder="/pricing"
                  />
                </label>
              </div>
              <div className={cn(WELL, 'rounded-lg p-3.5')}>
                <SectionLabel accent="ok">Learner preview</SectionLabel>
                <p className={cn(TITLE, 'mt-2 text-sm')}>{form.title || 'Campaign headline'}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  {form.message || 'Campaign message preview.'}
                </p>
                {form.cta_label && (
                  <span className="mt-3 inline-flex rounded-md bg-indigo-600 px-2.5 py-1.5 text-[10px] font-extrabold text-white">
                    {form.cta_label}
                  </span>
                )}
              </div>
            </div>
          </Step>

          <Step index="3" label="Delivery" description="when and how often">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <FieldLabel>Starts</FieldLabel>
                <Input
                  type="datetime-local"
                  className={FIELD}
                  value={form.starts_at}
                  onChange={(event) => set({ starts_at: event.target.value })}
                />
              </label>
              <label className="block">
                <FieldLabel>Ends</FieldLabel>
                <Input
                  type="datetime-local"
                  className={FIELD}
                  value={form.ends_at}
                  onChange={(event) => set({ ends_at: event.target.value })}
                />
              </label>
              <label className="block">
                <FieldLabel hint="sends per learner">Frequency cap</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  className={FIELD}
                  value={form.frequency_cap}
                  onChange={(event) => set({ frequency_cap: event.target.value })}
                />
              </label>
              <label className="block">
                <FieldLabel hint="quiet period">Cooldown hours</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  className={FIELD}
                  value={form.cooldown_hours}
                  onChange={(event) => set({ cooldown_hours: event.target.value })}
                />
              </label>
            </div>
          </Step>
        </div>

        <DialogFooter>
          <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton loading={saving} onClick={submit}>
            {campaign ? 'Save changes' : 'Create draft'}
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignDialog;
