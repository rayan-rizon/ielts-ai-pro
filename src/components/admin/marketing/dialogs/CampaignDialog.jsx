import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemedDateTimePicker } from '@/components/admin/ui/ThemedDateTimePicker';
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

const Step = ({ index, label, description, children }) => (
  <section className="space-y-2.5">
    <div className="flex items-center gap-2">
      <span
        className={cn(
          MICRO,
          'grid h-4 w-4 place-items-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-700 dark:bg-white/10 dark:text-stone-300'
        )}
      >
        {index}
      </span>
      <SectionLabel>{label}</SectionLabel>
      {description && (
        <span className={cn('text-[10px] font-medium leading-none', MUTED)}>· {description}</span>
      )}
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
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-stone-200/80 bg-white p-5 dark:border-white/10 dark:bg-[#121115] shadow-lg">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit campaign' : 'New campaign'}</DialogTitle>
          <DialogDescription>
            One audience, one measurable offer. Nothing sends until you activate and dispatch it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {!campaign && activeTemplates.length > 0 && (
            <div className={cn(WELL, 'rounded-lg p-2.5')}>
              <div className="block">
                <FieldLabel hint="prefills this draft only">Start from a template</FieldLabel>
                <Select
                  value={templateId || 'none'}
                  onValueChange={(val) => applyTemplate(val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="h-8 w-full px-3 text-xs bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-md">
                    <SelectValue placeholder="Blank campaign draft" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#16151a] dark:border-white/10 text-xs z-50">
                    <SelectItem value="none" className="text-xs text-stone-400">
                      Blank campaign draft
                    </SelectItem>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id} className="text-xs">
                        {template.name}
                        {template.description ? ` · ${template.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Step index="1" label="Audience" description="who receives it">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="block">
                <FieldLabel>Campaign name</FieldLabel>
                <Input
                  className={FIELD}
                  value={form.name}
                  onChange={(event) => set({ name: event.target.value })}
                  placeholder="Free learner upgrade · August"
                />
              </div>
              <div className="block">
                <FieldLabel>Objective</FieldLabel>
                <Select value={form.objective} onValueChange={(val) => set({ objective: val })}>
                  <SelectTrigger className="h-8 w-full px-3 text-xs bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-md">
                    <SelectValue placeholder="Choose objective" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#16151a] dark:border-white/10 text-xs z-50">
                    {OBJECTIVES.map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="block">
                <FieldLabel>Segment</FieldLabel>
                <Select
                  value={form.segment_id || 'none'}
                  onValueChange={(val) => set({ segment_id: val === 'none' ? '' : val })}
                >
                  <SelectTrigger className="h-8 w-full px-3 text-xs bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-md">
                    <SelectValue placeholder="Choose segment…" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#16151a] dark:border-white/10 text-xs z-50">
                    <SelectItem value="none" className="text-xs text-stone-400">
                      Choose segment…
                    </SelectItem>
                    {activeSegments.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-xs">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!activeSegments.length && (
                  <span className={cn('mt-1 block text-[10px] font-medium', MUTED)}>
                    No active segments yet — create one under Audiences first.
                  </span>
                )}
              </div>
              <div className="block">
                <FieldLabel>Offer code</FieldLabel>
                <p className="mb-1 text-[10px] text-stone-500">
                  Select the personal signup offer to reuse each recipient's existing code.
                  Conflicting discounts are skipped.
                </p>
                <Select
                  value={form.promo_code_id || 'none'}
                  onValueChange={(val) => set({ promo_code_id: val === 'none' ? '' : val })}
                >
                  <SelectTrigger className="h-8 w-full px-3 text-xs bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-md">
                    <SelectValue placeholder="No offer attached" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#16151a] dark:border-white/10 text-xs z-50">
                    <SelectItem value="none" className="text-xs text-stone-400">
                      No offer attached
                    </SelectItem>
                    {activePromos.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-xs">
                        {item.code}
                        {item.label ? ` · ${item.label}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Step>

          <Step index="2" label="Message" description="what the learner sees">
            <div className="space-y-3">
              <div>
                <FieldLabel>Channels</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
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
                  className="min-h-20 border-stone-300 text-xs dark:border-white/15 dark:bg-[#131315]"
                  value={form.message}
                  onChange={(event) => set({ message: event.target.value })}
                  placeholder="Explain the next useful action in one or two sentences."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className={cn(WELL, 'rounded-lg p-3')}>
                <SectionLabel accent="ok">Learner preview</SectionLabel>
                <p className={cn(TITLE, 'mt-1.5 text-xs font-bold')}>
                  {form.title || 'Campaign headline'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                  {form.message || 'Campaign message preview.'}
                </p>
                {form.cta_label && (
                  <span className="mt-2.5 inline-flex rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs">
                    {form.cta_label}
                  </span>
                )}
              </div>
            </div>
          </Step>

          <Step index="3" label="Delivery" description="when and how often">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="block">
                  <FieldLabel>Starts</FieldLabel>
                  <ThemedDateTimePicker
                    value={form.starts_at}
                    onChange={(val) => set({ starts_at: val })}
                    placeholder="Select start date & time"
                  />
                </div>
                <div className="block">
                  <FieldLabel>Ends</FieldLabel>
                  <ThemedDateTimePicker
                    value={form.ends_at}
                    onChange={(val) => set({ ends_at: val })}
                    placeholder="Select end date & time"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
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
