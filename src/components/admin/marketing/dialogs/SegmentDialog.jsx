import { useEffect, useMemo, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import {
  AdminButton,
  FIELD,
  FieldLabel,
  MUTED,
  Pill,
  SectionLabel,
  ToggleChip,
  WELL,
} from '@/components/admin/ui/primitives';
import { arrayToggle, describeRules } from '../shared';

export const INITIAL_SEGMENT = {
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

const SIGNUP_CHANNELS = [
  'paid_social',
  'paid_search',
  'organic_search',
  'organic_social',
  'ai_referral',
  'social',
  'referral',
  'email',
  'direct',
];

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

const formToRules = (form) => {
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
  return rules;
};

const RuleGroup = ({ label, hint, children }) => (
  <div>
    <FieldLabel hint={hint}>{label}</FieldLabel>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const SegmentDialog = ({ open, onOpenChange, segment, onSave, saving }) => {
  const [form, setForm] = useState(INITIAL_SEGMENT);
  useEffect(() => setForm(segmentToForm(segment)), [segment, open]);

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  // The live rule summary is the whole point of this dialog: rules combine with
  // AND, which is easy to forget while ticking chips, so the sentence the
  // segment card will show is rendered here as it is being built.
  const preview = useMemo(() => describeRules(formToRules(form)), [form]);

  const submit = () => {
    if (!form.name.trim()) return toast.error('Segment name is required');
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      rules: formToRules(form),
      is_active: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-2xl overflow-y-auto border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-[#131315]">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit audience' : 'New audience'}</DialogTitle>
          <DialogDescription>
            Every rule you add narrows the audience further. Marketing consent is enforced
            separately for email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Name</FieldLabel>
              <Input
                className={FIELD}
                value={form.name}
                onChange={(event) => set({ name: event.target.value })}
                placeholder="Free learners with low quota"
              />
            </label>
            <label className="block">
              <FieldLabel>Description</FieldLabel>
              <Input
                className={FIELD}
                value={form.description}
                onChange={(event) => set({ description: event.target.value })}
              />
            </label>
          </div>

          <div className={cn(WELL, 'rounded-lg p-3.5')}>
            <SectionLabel accent={preview.length ? 'ok' : 'warn'}>
              {preview.length ? 'This audience is' : 'This audience is everyone'}
            </SectionLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preview.length ? (
                preview.map((chip) => (
                  <Pill key={chip} tone="accent" className="normal-case tracking-normal">
                    {chip}
                  </Pill>
                ))
              ) : (
                <p className={cn('text-[11px] font-medium', MUTED)}>
                  With no rules set this matches every learner. Add at least one rule unless that is
                  what you intend.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RuleGroup label="Subscription tier">
              {['free', 'pro', 'premium'].map((value) => (
                <ToggleChip
                  key={value}
                  active={form.subscription_tiers.includes(value)}
                  onClick={() =>
                    set({ subscription_tiers: arrayToggle(form.subscription_tiers, value) })
                  }
                >
                  {value}
                </ToggleChip>
              ))}
            </RuleGroup>
            <RuleGroup label="Quota state">
              {['low', 'exhausted', 'available'].map((value) => (
                <ToggleChip
                  key={value}
                  active={form.quota_states.includes(value)}
                  onClick={() => set({ quota_states: arrayToggle(form.quota_states, value) })}
                >
                  {value}
                </ToggleChip>
              ))}
            </RuleGroup>
          </div>

          <RuleGroup label="Signup channel" hint="first-touch attribution">
            {SIGNUP_CHANNELS.map((value) => (
              <ToggleChip
                key={value}
                active={form.signup_channels.includes(value)}
                onClick={() => set({ signup_channels: arrayToggle(form.signup_channels, value) })}
              >
                {value.replaceAll('_', ' ')}
              </ToggleChip>
            ))}
          </RuleGroup>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Onboarding</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={form.onboarding_completed}
                onChange={(event) => set({ onboarding_completed: event.target.value })}
              >
                <option value="any">Any</option>
                <option value="true">Completed</option>
                <option value="false">Not completed</option>
              </select>
            </label>
            <label className="block">
              <FieldLabel>Completed practice</FieldLabel>
              <select
                className={cn(FIELD, 'w-full px-3')}
                value={form.has_completed_test}
                onChange={(event) => set({ has_completed_test: event.target.value })}
              >
                <option value="any">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="block">
              <FieldLabel hint="leave blank to ignore">Inactive at least</FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="days"
                className={FIELD}
                value={form.inactive_days_min}
                onChange={(event) => set({ inactive_days_min: event.target.value })}
              />
            </label>
            <label className="block">
              <FieldLabel hint="leave blank to ignore">Referral expires within</FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="days"
                className={FIELD}
                value={form.referral_expiry_days_max}
                onChange={(event) => set({ referral_expiry_days_max: event.target.value })}
              />
            </label>
            <label className="block">
              <FieldLabel hint="leave blank to ignore">Exam within</FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="days"
                className={FIELD}
                value={form.test_date_days_max}
                onChange={(event) => set({ test_date_days_max: event.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['payment_failed', 'Payment failed', 'Last renewal attempt was declined'],
              ['cancel_at_period_end', 'Cancellation scheduled', 'Still paid, but not renewing'],
            ].map(([key, label, detail]) => (
              <label
                key={key}
                className={cn(WELL, 'flex items-center justify-between gap-3 rounded-lg p-3')}
              >
                <span>
                  <span className="block text-xs font-bold text-stone-800 dark:text-stone-100">
                    {label}
                  </span>
                  <span className={cn('block text-[10px] font-medium', MUTED)}>{detail}</span>
                </span>
                <Switch
                  checked={form[key]}
                  onCheckedChange={(checked) => set({ [key]: checked })}
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
            Save audience
          </AdminButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SegmentDialog;
