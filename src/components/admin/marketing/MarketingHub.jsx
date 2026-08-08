import { useCallback, useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import {
  Activity,
  Ban,
  BarChart3,
  CheckCircle2,
  Edit3,
  Eye,
  Gift,
  Megaphone,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Send,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import MarketingService from '@/features/admin/services/MarketingService';
import { PromoCode } from '@/entities';
import {
  Empty,
  FADE_UP,
  Meter,
  MICRO,
  NUM,
  PANEL,
  Pill,
  STAGGER_CONTAINER,
  Stat,
  TITLE,
  WELL,
} from '@/features/dashboard/components/primitives';
import {
  ADMIN_TABS_LIST,
  ADMIN_TAB_TRIGGER,
  AdminButton,
  AdminPageHeader,
  AdminPageSkeleton,
} from '@/components/admin/ui/primitives';

const FIELD =
  'h-9 rounded-md border-stone-300 bg-white text-xs font-medium dark:border-white/15 dark:bg-[#131315]';
const INITIAL_CAMPAIGN = {
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

const INITIAL_SEGMENT = {
  name: '',
  description: '',
  subscription_tiers: [],
  signup_channels: [],
  onboarding_completed: 'any',
  has_completed_test: 'any',
  inactive_days_min: '',
  quota_states: [],
  payment_failed: false,
  cancel_at_period_end: false,
  referral_expiry_days_max: '',
  test_date_days_max: '',
};

const STATUS_TONE = {
  active: 'ok',
  scheduled: 'accent',
  paused: 'warn',
  completed: 'neutral',
  cancelled: 'fault',
  draft: 'neutral',
};

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const toIso = (value) => (value ? new Date(value).toISOString() : null);

const FieldLabel = ({ children }) => (
  <Label className={cn(MICRO, 'mb-1.5 block text-stone-500 dark:text-stone-400')}>{children}</Label>
);

const ToggleChip = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'rounded-md border px-2.5 py-1.5 text-[10px] font-extrabold transition-colors',
      active
        ? 'border-[#5a63df]/40 bg-[#5a63df]/8 text-[#5a63df] dark:text-[#afb5ff]'
        : 'border-stone-200 text-stone-500 hover:border-stone-300 dark:border-white/10 dark:text-stone-400'
    )}
  >
    {children}
  </button>
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

  const toggleChannel = (channel) => {
    setForm((current) => {
      const channels = current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel];
      return { ...current, channels };
    });
  };

  const submit = () => {
    if (!form.name.trim() || !form.title.trim() || !form.message.trim()) {
      toast.error('Campaign name, title, and message are required');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-3xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit campaign' : 'Create campaign'}</DialogTitle>
          <DialogDescription>
            One audience, one measurable offer, coordinated across selected channels.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          {!campaign && (
            <div className="md:col-span-2">
              <FieldLabel>Start from a template</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={templateId}
                onChange={(event) => applyTemplate(event.target.value)}
              >
                <option value="">Blank campaign draft</option>
                {templates
                  .filter((template) => template.is_active)
                  .map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.description ? ` · ${template.description}` : ''}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-[10px] font-medium text-stone-500 dark:text-stone-400">
                Templates only prefill this draft. Nothing is sent until you activate and dispatch
                it.
              </p>
            </div>
          )}
          <div>
            <FieldLabel>Campaign name</FieldLabel>
            <Input
              className={FIELD}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Free learner upgrade · August"
            />
          </div>
          <div>
            <FieldLabel>Objective</FieldLabel>
            <select
              className={cn(FIELD, 'w-full px-3')}
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            >
              <option value="paid_conversion">Paid conversion</option>
              <option value="activation">Activation</option>
              <option value="retention">Retention</option>
              <option value="referral">Referral</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <div>
            <FieldLabel>Audience segment</FieldLabel>
            <select
              className={cn(FIELD, 'w-full px-3')}
              value={form.segment_id}
              onChange={(e) => setForm({ ...form, segment_id: e.target.value })}
            >
              <option value="">Choose segment…</option>
              {segments
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <FieldLabel>Promo code</FieldLabel>
            <select
              className={cn(FIELD, 'w-full px-3')}
              value={form.promo_code_id}
              onChange={(e) => setForm({ ...form, promo_code_id: e.target.value })}
            >
              <option value="">No offer attached</option>
              {promos
                .filter((item) => item.is_active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code}
                    {item.label ? ` · ${item.label}` : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Channels</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {[
                ['in_app', 'In-app notification'],
                ['banner', 'Dashboard banner'],
                ['email', 'Marketing email'],
              ].map(([id, label]) => (
                <ToggleChip
                  key={id}
                  active={form.channels.includes(id)}
                  onClick={() => toggleChannel(id)}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
          </div>
          {form.channels.includes('email') && (
            <div className="md:col-span-2">
              <FieldLabel>Email subject</FieldLabel>
              <Input
                className={FIELD}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="A focused offer for your IELTS target"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <FieldLabel>Headline</FieldLabel>
            <Input
              className={FIELD}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Keep your progress moving"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Message</FieldLabel>
            <Textarea
              className="min-h-24 border-stone-300 text-xs dark:border-white/15 dark:bg-[#131315]"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Explain the next useful action in one or two sentences."
            />
          </div>
          <div>
            <FieldLabel>CTA label</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_label}
              onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>CTA URL</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_url}
              onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              placeholder="/pricing"
            />
          </div>
          <div>
            <FieldLabel>Starts</FieldLabel>
            <Input
              type="datetime-local"
              className={FIELD}
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Ends</FieldLabel>
            <Input
              type="datetime-local"
              className={FIELD}
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Frequency cap</FieldLabel>
            <Input
              type="number"
              min="1"
              max="20"
              className={FIELD}
              value={form.frequency_cap}
              onChange={(e) => setForm({ ...form, frequency_cap: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Cooldown hours</FieldLabel>
            <Input
              type="number"
              min="0"
              className={FIELD}
              value={form.cooldown_hours}
              onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })}
            />
          </div>
          <div className={cn(WELL, 'md:col-span-2 rounded-lg p-3')}>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Learner preview</p>
            <p className={cn(TITLE, 'mt-2')}>{form.title || 'Campaign headline'}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
              {form.message || 'Campaign message preview.'}
            </p>
            {form.cta_label && (
              <span className="mt-3 inline-flex rounded-md bg-[#5a63df] px-2.5 py-1.5 text-[10px] font-extrabold text-white">
                {form.cta_label}
              </span>
            )}
          </div>
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

const EmailPreviewDialog = ({ campaign, open, onOpenChange }) => {
  if (!campaign) return null;
  const subject = campaign.subject || campaign.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>Email preview</DialogTitle>
          <DialogDescription>
            Live emails use the recipient&apos;s username. This preview uses a sample username; the
            inbox subject is shown as metadata and is not repeated in the email body.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-xl border border-[#e4e2f0] bg-[#f6f5f3] p-3 dark:border-white/10 dark:bg-[#0d0d10] sm:p-5">
          <div className="mx-auto mb-3 max-w-[600px] rounded-lg border border-[#e4e2f0] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#18171d]">
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Inbox subject</p>
            <p className="mt-1 truncate text-sm font-extrabold text-stone-900 dark:text-stone-50">
              {subject}
            </p>
            <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
              This is sent as the email subject, not repeated in the message body.
            </p>
          </div>
          <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl border border-[#e9e7e3] bg-white dark:border-white/10 dark:bg-[#18171d]">
            <div className="bg-[#111113] px-6 py-5 text-center">
              <span className="inline-flex min-h-[42px] items-center justify-center">
                <img
                  src="/footer.svg"
                  width="176"
                  height="42"
                  alt="IELTS AI Pro"
                  className="mx-auto h-auto w-44"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                    event.currentTarget.nextElementSibling.hidden = false;
                  }}
                />
                <span hidden className="text-sm font-extrabold tracking-tight text-[#f7f8ff]">
                  IELTS AI Pro
                </span>
              </span>
            </div>
            <div className="p-6 sm:p-10">
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                  {campaign.title}
                </h3>
                <p className="mt-5 text-base leading-7 text-stone-700 dark:text-stone-200">
                  Hi alex,
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-200">
                  {campaign.message}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-700 dark:text-stone-200">
                  A focused next step can make your preparation more consistent. Use your dashboard
                  to continue from where you left off, review your recent feedback, and decide what
                  will help you move closer to your target band.
                </p>
                {campaign.promo?.code && (
                  <div className="mt-6 rounded-lg border border-dashed border-[#c9c5f4] bg-[#f7f6ff] p-4 text-center text-sm font-extrabold text-[#4c43a8]">
                    Offer code: {campaign.promo.code}
                    <span className="mt-1 block text-xs font-medium text-[#625d82]">
                      Use it when you choose your next plan.
                    </span>
                  </div>
                )}
                <div className="mt-7 text-center">
                  <span className="inline-flex rounded-lg bg-[#6c4cff] px-5 py-3 text-sm font-extrabold text-white">
                    {campaign.cta_label || 'Learn more'}
                  </span>
                </div>
                <p className="mt-7 text-sm leading-6 text-stone-500 dark:text-stone-400">
                  Your progress and practice history are saved in your account, so you can return
                  whenever you are ready.
                </p>
              </div>
            </div>
            <div className="border-t border-[#ebe9e5] bg-[#faf9f7] px-6 py-7 text-center dark:border-white/10 dark:bg-[#141419]">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                <a
                  href="/settings?tab=subscription"
                  className="font-semibold text-stone-600 dark:text-stone-300"
                >
                  Manage
                </a>
                <span className="mx-2">•</span>
                <a href="/privacy" className="font-semibold text-stone-600 dark:text-stone-300">
                  Privacy
                </a>
                <span className="mx-2">•</span>
                <a href="/terms" className="font-semibold text-stone-600 dark:text-stone-300">
                  Terms
                </a>
                <span className="mx-2">•</span>
                <a
                  href="/settings?tab=preferences"
                  className="font-semibold text-stone-600 dark:text-stone-300"
                >
                  Unsubscribe
                </a>
              </p>
              <p className="mt-3 text-[11px] leading-5 text-stone-500 dark:text-stone-400">
                You are receiving this because you enabled marketing communications.
              </p>
              <p className="mt-2 text-[10px] text-stone-500 dark:text-stone-400">
                © {new Date().getFullYear()} IELTS AI Pro · support@ieltsai.pro
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const INITIAL_TEMPLATE = {
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

  const toggleChannel = (channel) => {
    setForm((current) => ({
      ...current,
      channels: arrayToggle(current.channels, channel),
    }));
  };

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
          <DialogTitle>{template?.id ? 'Edit template' : 'Create template'}</DialogTitle>
          <DialogDescription>
            Templates are reusable draft content and never send on their own.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div>
            <FieldLabel>Template name</FieldLabel>
            <Input
              className={FIELD}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Objective</FieldLabel>
            <select
              className={cn(FIELD, 'w-full px-3')}
              value={form.objective}
              onChange={(event) => setForm({ ...form, objective: event.target.value })}
            >
              <option value="paid_conversion">Paid conversion</option>
              <option value="activation">Activation</option>
              <option value="retention">Retention</option>
              <option value="referral">Referral</option>
              <option value="announcement">Announcement</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <Input
              className={FIELD}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="When this template is useful"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Channels</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {[
                ['in_app', 'In-app notification'],
                ['banner', 'Dashboard banner'],
                ['email', 'Marketing email'],
              ].map(([id, label]) => (
                <ToggleChip
                  key={id}
                  active={form.channels.includes(id)}
                  onClick={() => toggleChannel(id)}
                >
                  {label}
                </ToggleChip>
              ))}
            </div>
          </div>
          {form.channels.includes('email') && (
            <div className="md:col-span-2">
              <FieldLabel>Email subject</FieldLabel>
              <Input
                className={FIELD}
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <FieldLabel>Headline</FieldLabel>
            <Input
              className={FIELD}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Message</FieldLabel>
            <Textarea
              className="min-h-24 border-stone-300 text-xs dark:border-white/15 dark:bg-[#131315]"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </div>
          <div>
            <FieldLabel>CTA label</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_label}
              onChange={(event) => setForm({ ...form, cta_label: event.target.value })}
            />
          </div>
          <div>
            <FieldLabel>CTA URL</FieldLabel>
            <Input
              className={FIELD}
              value={form.cta_url}
              onChange={(event) => setForm({ ...form, cta_url: event.target.value })}
            />
          </div>
          <label
            className={cn(
              WELL,
              'md:col-span-2 flex items-center justify-between rounded-lg p-3 text-xs font-bold'
            )}
          >
            Available in campaign editor
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
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

const arrayToggle = (items, value) =>
  items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

const segmentToForm = (segment) => {
  if (!segment) return INITIAL_SEGMENT;
  const rules = segment.rules || {};
  return {
    ...INITIAL_SEGMENT,
    ...rules,
    name: segment.name,
    description: segment.description || '',
    onboarding_completed:
      rules.onboarding_completed === undefined ? 'any' : String(rules.onboarding_completed),
    has_completed_test:
      rules.has_completed_test === undefined ? 'any' : String(rules.has_completed_test),
    inactive_days_min: rules.inactive_days_min ?? '',
    referral_expiry_days_max: rules.referral_expiry_days_max ?? '',
    test_date_days_max: rules.test_date_days_max ?? '',
  };
};

const SegmentDialog = ({ open, onOpenChange, segment, onSave, saving }) => {
  const [form, setForm] = useState(INITIAL_SEGMENT);
  useEffect(() => setForm(segmentToForm(segment)), [segment, open]);

  const submit = () => {
    if (!form.name.trim()) return toast.error('Segment name is required');
    const rules = {};
    ['subscription_tiers', 'signup_channels', 'quota_states'].forEach((key) => {
      if (form[key].length) rules[key] = form[key];
    });
    if (form.onboarding_completed !== 'any')
      rules.onboarding_completed = form.onboarding_completed === 'true';
    if (form.has_completed_test !== 'any')
      rules.has_completed_test = form.has_completed_test === 'true';
    ['inactive_days_min', 'referral_expiry_days_max', 'test_date_days_max'].forEach((key) => {
      if (form[key] !== '') rules[key] = Number(form[key]);
    });
    if (form.payment_failed) rules.payment_failed = true;
    if (form.cancel_at_period_end) rules.cancel_at_period_end = true;
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      rules,
      is_active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit segment' : 'Create segment'}</DialogTitle>
          <DialogDescription>
            All selected rules are combined. Marketing consent is enforced separately for email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Name</FieldLabel>
              <Input
                className={FIELD}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <Input
                className={FIELD}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Subscription tier</FieldLabel>
            <div className="flex gap-2">
              {['free', 'pro', 'premium'].map((value) => (
                <ToggleChip
                  key={value}
                  active={form.subscription_tiers.includes(value)}
                  onClick={() =>
                    setForm({
                      ...form,
                      subscription_tiers: arrayToggle(form.subscription_tiers, value),
                    })
                  }
                >
                  {value}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Signup channel</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {[
                'paid_social',
                'paid_search',
                'organic_search',
                'organic_social',
                'referral',
                'email',
                'direct',
              ].map((value) => (
                <ToggleChip
                  key={value}
                  active={form.signup_channels.includes(value)}
                  onClick={() =>
                    setForm({ ...form, signup_channels: arrayToggle(form.signup_channels, value) })
                  }
                >
                  {value.replaceAll('_', ' ')}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Quota state</FieldLabel>
            <div className="flex gap-2">
              {['low', 'exhausted', 'available'].map((value) => (
                <ToggleChip
                  key={value}
                  active={form.quota_states.includes(value)}
                  onClick={() =>
                    setForm({ ...form, quota_states: arrayToggle(form.quota_states, value) })
                  }
                >
                  {value}
                </ToggleChip>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Onboarding</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={form.onboarding_completed}
                onChange={(e) => setForm({ ...form, onboarding_completed: e.target.value })}
              >
                <option value="any">Any</option>
                <option value="true">Completed</option>
                <option value="false">Not completed</option>
              </select>
            </div>
            <div>
              <FieldLabel>Completed practice</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={form.has_completed_test}
                onChange={(e) => setForm({ ...form, has_completed_test: e.target.value })}
              >
                <option value="any">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <FieldLabel>Inactive at least (days)</FieldLabel>
              <Input
                type="number"
                min="0"
                className={FIELD}
                value={form.inactive_days_min}
                onChange={(e) => setForm({ ...form, inactive_days_min: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Referral expiry within (days)</FieldLabel>
              <Input
                type="number"
                min="0"
                className={FIELD}
                value={form.referral_expiry_days_max}
                onChange={(e) => setForm({ ...form, referral_expiry_days_max: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Exam within (days)</FieldLabel>
              <Input
                type="number"
                min="0"
                className={FIELD}
                value={form.test_date_days_max}
                onChange={(e) => setForm({ ...form, test_date_days_max: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['payment_failed', 'Payment failed'],
              ['cancel_at_period_end', 'Cancellation scheduled'],
            ].map(([key, label]) => (
              <label
                key={key}
                className={cn(
                  WELL,
                  'flex items-center justify-between rounded-lg p-3 text-xs font-bold'
                )}
              >
                <span>{label}</span>
                <Switch
                  checked={form[key]}
                  onCheckedChange={(checked) => setForm({ ...form, [key]: checked })}
                />
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <AdminButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </AdminButton>
          <AdminButton loading={saving} onClick={submit}>
            Save segment
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CampaignsPanel = ({ campaigns, segments, promos, templates, onRefresh }) => {
  const [editor, setEditor] = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(null);
  const [estimates, setEstimates] = useState({});
  const [dispatching, setDispatching] = useState(null);

  const save = async (payload) => {
    setSaving(true);
    try {
      if (editor?.id) await MarketingService.updateCampaign(editor.id, payload);
      else await MarketingService.createCampaign(payload);
      toast.success(editor?.id ? 'Campaign updated' : 'Campaign draft created');
      setEditor(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not save campaign');
    } finally {
      setSaving(false);
    }
  };

  const estimate = async (campaign) => {
    if (!campaign.segment_id) return;
    setEstimating(campaign.id);
    try {
      const result = await MarketingService.estimateSegment(campaign.segment_id);
      setEstimates((value) => ({ ...value, [campaign.id]: result }));
    } catch (error) {
      toast.error(error.message || 'Could not estimate audience');
    } finally {
      setEstimating(null);
    }
  };

  const setStatus = async (campaign, status) => {
    try {
      await MarketingService.setCampaignStatus(campaign.id, status);
      toast.success(`Campaign ${status}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update campaign');
    }
  };

  const dispatch = async (campaign) => {
    setDispatching(campaign.id);
    try {
      const result = await MarketingService.dispatchCampaign(campaign.id);
      toast.success(`Campaign processed for ${result?.audience || 0} learners`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not dispatch campaign');
    } finally {
      setDispatching(null);
    }
  };

  const orderedCampaigns = useMemo(
    () =>
      [...campaigns].sort((a, b) => {
        const aCore = a.objective === 'paid_conversion' ? 0 : 1;
        const bCore = b.objective === 'paid_conversion' ? 0 : 1;
        if (aCore !== bCore) return aCore - bCore;
        const aLive = a.status === 'active' ? 0 : 1;
        const bLive = b.status === 'active' ? 0 : 1;
        if (aLive !== bLive) return aLive - bLive;
        return a.name.localeCompare(b.name);
      }),
    [campaigns]
  );

  const liveConversionCount = orderedCampaigns.filter(
    (campaign) => campaign.objective === 'paid_conversion' && campaign.status === 'active'
  ).length;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          PANEL,
          'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
        )}
      >
        <div>
          <p className={cn(MICRO, 'text-[#5a63df]')}>Now running</p>
          <p className={cn(TITLE, 'mt-1')}>Paid conversion is the live focus</p>
          <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
            {liveConversionCount} conversion journeys are live. Activation and retention stay staged
            until the core funnel has enough signal.
          </p>
        </div>
        <AdminButton onClick={() => setEditor({})}>
          <Plus className="h-3.5 w-3.5" />
          New campaign
        </AdminButton>
      </div>
      {orderedCampaigns.length === 0 ? (
        <Empty icon={Megaphone}>
          Create a draft, estimate its audience, then activate it when the message is ready.
        </Empty>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {orderedCampaigns.map((campaign) => {
            const estimateData = estimates[campaign.id];
            const isCore = campaign.objective === 'paid_conversion';
            return (
              <div key={campaign.id} className={cn(PANEL, 'flex min-h-[285px] flex-col p-4')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={TITLE}>{campaign.name}</h3>
                      <Pill tone={STATUS_TONE[campaign.status]}>{campaign.status}</Pill>
                      <Pill tone={isCore ? 'accent' : 'neutral'}>
                        {campaign.objective.replaceAll('_', ' ')}
                      </Pill>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      {campaign.segment?.name || 'No audience'}
                    </p>
                  </div>
                  <Pill tone={isCore ? 'ok' : 'neutral'}>{isCore ? 'core' : 'staged'}</Pill>
                </div>
                <div className={cn(WELL, 'mt-3 rounded-lg p-3')}>
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Learner message</p>
                  <p className="mt-1 text-xs font-extrabold text-stone-800 dark:text-stone-100">
                    {campaign.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
                    {campaign.message}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {campaign.channels.map((channel) => (
                    <Pill key={channel} tone="accent">
                      {channel.replace('_', ' ')}
                    </Pill>
                  ))}
                  {campaign.promo?.code && <Pill tone="warn">{campaign.promo.code}</Pill>}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eceafa] pt-3 dark:border-white/[0.07]">
                  <span
                    className={cn(NUM, 'text-[10px] font-bold text-stone-500 dark:text-stone-400')}
                  >
                    {estimateData
                      ? `${estimateData.total} total · ${estimateData.email_eligible} email-ready`
                      : `${campaign.cooldown_hours}h cooldown`}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      loading={estimating === campaign.id}
                      onClick={() => estimate(campaign)}
                    >
                      <Users className="h-3 w-3" />
                      Estimate
                    </AdminButton>
                    {campaign.channels.includes('email') && (
                      <AdminButton
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewCampaign(campaign)}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </AdminButton>
                    )}
                    <AdminButton variant="outline" size="sm" onClick={() => setEditor(campaign)}>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </AdminButton>
                    {['draft', 'paused', 'scheduled'].includes(campaign.status) && (
                      <AdminButton
                        size="sm"
                        onClick={() =>
                          setStatus(
                            campaign,
                            campaign.starts_at && new Date(campaign.starts_at) > new Date()
                              ? 'scheduled'
                              : 'active'
                          )
                        }
                      >
                        <Play className="h-3 w-3" />
                        Activate
                      </AdminButton>
                    )}
                    {campaign.status === 'active' && (
                      <>
                        <AdminButton
                          size="sm"
                          loading={dispatching === campaign.id}
                          onClick={() => dispatch(campaign)}
                        >
                          <Send className="h-3 w-3" />
                          Dispatch
                        </AdminButton>
                        <AdminButton
                          variant="outline"
                          size="sm"
                          onClick={() => setStatus(campaign, 'paused')}
                        >
                          <Pause className="h-3 w-3" />
                          Pause
                        </AdminButton>
                      </>
                    )}
                    {!['completed', 'cancelled'].includes(campaign.status) && (
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus(campaign, 'cancelled')}
                      >
                        <Ban className="h-3 w-3" />
                        Cancel
                      </AdminButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CampaignDialog
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
        campaign={editor?.id ? editor : null}
        segments={segments}
        promos={promos}
        templates={templates}
        onSave={save}
        saving={saving}
      />
      <EmailPreviewDialog
        campaign={previewCampaign}
        open={previewCampaign !== null}
        onOpenChange={(open) => !open && setPreviewCampaign(null)}
      />
    </div>
  );
};

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

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <AdminButton onClick={() => setEditor({})}>
          <Plus className="h-3.5 w-3.5" />
          New template
        </AdminButton>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className={cn(PANEL, 'p-4')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className={TITLE}>{template.name}</h3>
                <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {template.description || 'Reusable campaign starting point'}
                </p>
              </div>
              <Pill tone={template.is_active ? 'ok' : 'neutral'}>
                {template.is_active ? 'ready' : 'hidden'}
              </Pill>
            </div>
            <p className="mt-3 text-xs font-bold text-stone-800 dark:text-stone-100">
              {template.title}
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-600 dark:text-stone-300">
              {template.message}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {template.channels.map((channel) => (
                  <Pill key={channel} tone="accent">
                    {channel.replace('_', ' ')}
                  </Pill>
                ))}
              </div>
              <AdminButton size="sm" variant="outline" onClick={() => setEditor(template)}>
                <Edit3 className="h-3 w-3" /> Edit
              </AdminButton>
            </div>
          </div>
        ))}
      </div>
      {!templates.length && (
        <Empty icon={Megaphone}>Create a reusable draft for your next campaign.</Empty>
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
      toast.success('Segment saved');
      setEditor(null);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not save segment');
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
      toast.error(error.message || 'Could not estimate segment');
    }
  };
  const toggle = async (segment, isActive) => {
    setToggling(segment.id);
    try {
      await MarketingService.updateSegment(segment.id, { is_active: isActive });
      toast.success(`${segment.name} ${isActive ? 'enabled' : 'paused'}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update segment');
    } finally {
      setToggling(null);
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <AdminButton onClick={() => setEditor({})}>
          <Plus className="h-3.5 w-3.5" />
          New segment
        </AdminButton>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {segments.map((segment) => {
          const estimateData = estimates[segment.id];
          return (
            <div key={segment.id} className={cn(PANEL, 'p-4')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className={TITLE}>{segment.name}</h3>
                  <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                    {segment.description || 'Reusable dynamic audience'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
              <div className={cn(WELL, 'mt-3 rounded-lg p-2.5')}>
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Rules</p>
                <p className="mt-1 break-words font-mono text-[10px] leading-relaxed text-stone-600 dark:text-stone-300">
                  {Object.entries(segment.rules || {})
                    .map(
                      ([key, value]) =>
                        `${key.replaceAll('_', ' ')}: ${Array.isArray(value) ? value.join(', ') : value}`
                    )
                    .join(' · ') || 'All learners'}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span
                  className={cn(NUM, 'text-[11px] font-bold text-stone-600 dark:text-stone-300')}
                >
                  {estimateData?.loading
                    ? 'Estimating…'
                    : estimateData
                      ? `${estimateData.total} total · ${estimateData.email_suppressed} email suppressed`
                      : 'Not estimated'}
                </span>
                <div className="flex gap-1.5">
                  <AdminButton size="sm" variant="outline" onClick={() => estimate(segment)}>
                    <Users className="h-3 w-3" />
                    Estimate
                  </AdminButton>
                  <AdminButton size="sm" variant="outline" onClick={() => setEditor(segment)}>
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </AdminButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

const JourneysPanel = ({ journeys, campaigns, metrics, onRefresh }) => {
  const toggle = async (journey, checked) => {
    try {
      await MarketingService.updateJourney(journey.id, { is_active: checked });
      toast.success(`${journey.name} ${checked ? 'enabled' : 'paused'}`);
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update journey');
    }
  };
  const assign = async (journey, campaignId) => {
    try {
      await MarketingService.updateJourney(journey.id, { campaign_id: campaignId || null });
      toast.success('Journey campaign updated');
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Could not update journey');
    }
  };
  return (
    <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {journeys.map((journey) => {
        const metric = metrics.find((row) => row.id === journey.id) || {};
        return (
          <div key={journey.id} className={cn(PANEL, 'p-4')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-[#5a63df]" />
                  <h3 className={TITLE}>{journey.name}</h3>
                </div>
                <p className="mt-1 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  {journey.segment?.name || 'No segment'} · cooldown {journey.cooldown_hours}h
                </p>
              </div>
              <Switch
                checked={journey.is_active}
                disabled={!journey.campaign_id}
                onCheckedChange={(checked) => toggle(journey, checked)}
              />
            </div>
            <div className="mt-3">
              <FieldLabel>Campaign</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={journey.campaign_id || ''}
                onChange={(e) => assign(journey, e.target.value)}
              >
                <option value="">Choose campaign…</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} · {campaign.status}
                  </option>
                ))}
              </select>
            </div>
            <div className={cn(WELL, 'mt-3 grid grid-cols-5 gap-2 rounded-lg p-2.5')}>
              {[
                ['Enrolled', metric.enrolled],
                ['Converted', metric.converted],
                ['Exited', metric.exited],
                ['Cooldown', metric.cooldown_skips],
                ['Failed', metric.failures],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className={cn(MICRO, 'text-stone-400')}>{label}</p>
                  <p className={cn(NUM, 'mt-1 text-xs font-bold')}>{value || 0}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Pill tone={journey.is_active ? 'ok' : 'neutral'}>
                {journey.is_active ? 'running' : 'paused'}
              </Pill>
              <span className={cn(MICRO, 'text-stone-400')}>
                {journey.trigger_type.replaceAll('_', ' ')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalyticsPanel = ({ dashboard, intelligence, breakdowns }) => {
  const revenueByCurrency = useMemo(() => {
    const totals = {};
    (dashboard.revenue || []).forEach((row) => {
      totals[row.currency] = (totals[row.currency] || 0) + Number(row.net || 0);
    });
    return totals;
  }, [dashboard.revenue]);
  const campaignRows = dashboard.campaigns || [];
  const metricTotal = (key) =>
    campaignRows.reduce((total, campaign) => total + Number(campaign[key] || 0), 0);
  const delivered = metricTotal('delivered');
  const views = metricTotal('views');
  const clicks = metricTotal('clicks');
  const checkouts = metricTotal('checkouts');
  const purchases = metricTotal('purchases');
  const funnelStart = delivered || Number(dashboard.totals?.reach || 0);
  const funnel = [
    ['Delivered', delivered || Number(dashboard.totals?.reach || 0)],
    ['Viewed', views],
    ['Clicked', clicks],
    ['Checkout started', checkouts],
    ['Purchased', purchases],
  ];
  const liveConversionCampaigns = campaignRows.filter(
    (campaign) => campaign.objective === 'paid_conversion' && campaign.status === 'active'
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Stat
          size="sm"
          icon={Activity}
          label="Live campaigns"
          value={dashboard.totals?.active || 0}
          tone="accent"
        />
        <Stat
          size="sm"
          icon={Users}
          label="Reach"
          value={dashboard.totals?.reach || 0}
          tone="sky"
        />
        <Stat
          size="sm"
          icon={MousePointerClick}
          label="Clicks"
          value={dashboard.totals?.clicks || 0}
          tone="amber"
        />
        <Stat
          size="sm"
          icon={CheckCircle2}
          label="Purchases"
          value={dashboard.totals?.purchases || 0}
          tone="emerald"
        />
        <Stat
          size="sm"
          icon={BarChart3}
          label="Revenue"
          value={
            Object.entries(revenueByCurrency)
              .map(([currency, value]) => `${currency} ${value.toFixed(2)}`)
              .join(' · ') || '—'
          }
          tone="emerald"
        />
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.85fr]">
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn(MICRO, 'text-[#5a63df]')}>30-day funnel</p>
              <h3 className={cn(TITLE, 'mt-1')}>From delivery to paid learner</h3>
            </div>
            <span className={cn(NUM, 'text-xs font-bold text-stone-500 dark:text-stone-400')}>
              {funnelStart || 0} entered
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {funnel.map(([label, value]) => (
              <Meter
                key={label}
                label={label}
                value={Number(value || 0)}
                pct={funnelStart ? (100 * Number(value || 0)) / funnelStart : 0}
                trailing={
                  <span
                    className={cn(NUM, 'text-[10px] font-bold text-stone-500 dark:text-stone-400')}
                  >
                    {funnelStart
                      ? `${((100 * Number(value || 0)) / funnelStart).toFixed(1)}%`
                      : '—'}
                  </span>
                }
              />
            ))}
          </div>
          {!funnelStart && (
            <p className="mt-4 text-[11px] font-medium text-stone-500 dark:text-stone-400">
              The funnel will populate after the first eligible learner receives a campaign.
            </p>
          )}
        </div>
        <div className={cn(PANEL, 'p-4')}>
          <p className={cn(MICRO, 'text-[#5a63df]')}>Current focus</p>
          <h3 className={cn(TITLE, 'mt-1')}>Paid conversion first</h3>
          <p className="mt-2 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
            Keep the core upgrade paths live long enough to see a reliable funnel before adding
            activation or retention pressure.
          </p>
          <div className={cn(WELL, 'mt-4 rounded-lg p-3')}>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Live conversion paths</p>
            <p
              className={cn(NUM, 'mt-1 text-2xl font-extrabold text-stone-900 dark:text-stone-50')}
            >
              {liveConversionCampaigns.length}
            </p>
            <p className="mt-1 text-[10px] font-medium text-stone-500 dark:text-stone-400">
              First result · low quota · referral expiry · checkout recovery
            </p>
          </div>
        </div>
      </div>
      <div className={cn(PANEL, 'overflow-x-auto')}>
        <div className="flex items-center justify-between gap-3 border-b border-[#eceafa] px-4 py-3 dark:border-white/[0.07]">
          <div>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>Campaign drill-down</p>
            <p className={cn(TITLE, 'mt-1')}>Compare campaign conversion quality</p>
          </div>
          <span className={cn(MICRO, 'text-stone-400')}>30 days</span>
        </div>
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-stone-100 dark:border-white/6">
              {[
                'Campaign',
                'Reach',
                'Delivered',
                'Views',
                'Clicks',
                'CTR',
                'Checkouts',
                'Purchases',
                'Failed / skipped',
                'Conversion',
              ].map((label) => (
                <th
                  key={label}
                  className={cn(MICRO, 'px-4 py-3 text-stone-500 dark:text-stone-400')}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(dashboard.campaigns || []).map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-100 last:border-0 dark:border-white/5"
              >
                <td className="px-4 py-3">
                  <p className="text-xs font-extrabold text-stone-900 dark:text-stone-50">
                    {row.name}
                  </p>
                  <Pill tone={STATUS_TONE[row.status]}>{row.status}</Pill>
                </td>
                {['reach', 'delivered', 'views', 'clicks'].map((key) => (
                  <td key={key} className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>
                    {row[key] || 0}
                  </td>
                ))}
                <td className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>{row.ctr || 0}%</td>
                <td className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>{row.checkouts || 0}</td>
                <td className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>{row.purchases || 0}</td>
                <td className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>
                  {row.failed || 0} / {row.skipped || 0}
                </td>
                <td className={cn(NUM, 'px-4 py-3 text-xs font-bold')}>
                  {row.conversion_rate || 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {[
          ['Delivery channel', breakdowns.delivery_channels, 'channel', 'recipients'],
          ['Acquisition source', breakdowns.acquisition_sources, 'source', 'purchases'],
          ['Purchased plan', breakdowns.plans, 'plan', 'purchases'],
          ['First-touch source', breakdowns.first_touch, 'source', 'purchases'],
        ].map(([title, rows, labelKey, valueKey]) => (
          <div key={title} className={cn(PANEL, 'p-3')}>
            <h3 className={TITLE}>{title}</h3>
            <div className="mt-2 space-y-1.5">
              {(rows || []).slice(0, 6).map((row, index) => (
                <div
                  key={`${row[labelKey]}-${index}`}
                  className="flex items-center justify-between text-[10px] font-bold"
                >
                  <span className="truncate text-stone-500">
                    {row[labelKey] || 'unknown'}
                    {row.currency ? ` · ${row.currency}` : ''}
                  </span>
                  <span className={NUM}>{row[valueKey] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[rgb(var(--signal-warn))]" />
            <h3 className={TITLE}>Offer intelligence</h3>
          </div>
          <div className="mt-3 space-y-2">
            {(intelligence.promos || []).slice(0, 8).map((promo) => (
              <div
                key={promo.id}
                className={cn(WELL, 'flex items-center justify-between rounded-lg p-2.5')}
              >
                <div>
                  <p className="font-mono text-xs font-extrabold">{promo.code}</p>
                  <p className="text-[10px] font-medium text-stone-500">
                    {promo.purchasers || 0} purchasers
                  </p>
                </div>
                <span className={cn(NUM, 'text-xs font-bold')}>{promo.redemptions || 0} uses</span>
              </div>
            ))}
            {!intelligence.promos?.length && (
              <p className="py-6 text-center text-xs text-stone-500">
                No attributed promo activity yet.
              </p>
            )}
          </div>
        </div>
        <div className={cn(PANEL, 'p-4')}>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#5a63df]" />
            <h3 className={TITLE}>Referral conversion</h3>
          </div>
          <div className="mt-3 space-y-2">
            {(intelligence.referrals || []).slice(0, 8).map((row) => (
              <div key={row.referrer_id} className={cn(WELL, 'rounded-lg p-2.5')}>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-extrabold">{row.name || row.email}</p>
                  <span className={cn(NUM, 'text-xs font-bold')}>{row.paid || 0} paid</span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-stone-500">
                  {row.signups || 0} signups · {row.activated || 0} activated
                  {row.risk_flags?.length ? ` · ${row.risk_flags.length} risk flag(s)` : ''}
                </p>
              </div>
            ))}
            {!intelligence.referrals?.length && (
              <p className="py-6 text-center text-xs text-stone-500">No referral activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MarketingHub() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    campaigns: [],
    segments: [],
    templates: [],
    promos: [],
    journeys: [],
    dashboard: { campaigns: [], revenue: [], totals: {} },
    intelligence: { promos: [], referrals: [] },
    breakdowns: { delivery_channels: [], acquisition_sources: [], plans: [], first_touch: [] },
    journeyMetrics: [],
  });
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        campaigns,
        segments,
        templates,
        promos,
        journeys,
        dashboard,
        intelligence,
        breakdowns,
        journeyMetrics,
      ] = await Promise.all([
        MarketingService.listCampaigns(),
        MarketingService.listSegments(),
        MarketingService.listTemplates(),
        PromoCode.list(),
        MarketingService.listJourneys(),
        MarketingService.getDashboard(30),
        MarketingService.getOfferIntelligence(),
        MarketingService.getBreakdowns(30),
        MarketingService.getJourneyMetrics(30),
      ]);
      setData({
        campaigns,
        segments,
        templates,
        promos,
        journeys,
        dashboard,
        intelligence,
        breakdowns,
        journeyMetrics,
      });
    } catch (error) {
      console.error('Marketing hub load failed:', error);
      toast.error(error.message || 'Could not load Marketing Hub');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (loading && !data.campaigns.length) return <AdminPageSkeleton kpis={4} panels={2} />;
  return (
    <m.div
      variants={STAGGER_CONTAINER}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-10 pt-12 md:pt-0"
    >
      <m.div variants={FADE_UP}>
        <AdminPageHeader
          title="Marketing"
          description="Consent-aware campaigns, conversion journeys, offers, and attributed revenue"
          tip="Revenue appears only after server-confirmed payment. Email audiences always exclude learners without marketing consent."
        >
          <AdminButton variant="outline" onClick={load} loading={loading}>
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </AdminButton>
        </AdminPageHeader>
      </m.div>
      <Tabs defaultValue="campaigns" className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className={ADMIN_TABS_LIST}>
            {[
              ['campaigns', 'Campaigns', Megaphone],
              ['segments', 'Segments', Users],
              ['templates', 'Templates', Edit3],
              ['journeys', 'Journeys', Workflow],
              ['analytics', 'Analytics', BarChart3],
            ].map(([value, label, Icon]) => (
              <TabsTrigger key={value} value={value} className={ADMIN_TAB_TRIGGER}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="campaigns">
          <CampaignsPanel
            campaigns={data.campaigns}
            segments={data.segments}
            promos={data.promos}
            templates={data.templates}
            onRefresh={load}
          />
        </TabsContent>
        <TabsContent value="segments">
          <SegmentsPanel segments={data.segments} onRefresh={load} />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesPanel templates={data.templates} onRefresh={load} />
        </TabsContent>
        <TabsContent value="journeys">
          <JourneysPanel
            journeys={data.journeys}
            campaigns={data.campaigns}
            metrics={data.journeyMetrics}
            onRefresh={load}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <AnalyticsPanel
            dashboard={data.dashboard}
            intelligence={data.intelligence}
            breakdowns={data.breakdowns}
          />
        </TabsContent>
      </Tabs>
    </m.div>
  );
}
