import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { supabase } from '@/lib/supabase';
import { requirePublicEnv } from '@/lib/publicEnv';
import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  Mail,
  Loader2,
  RefreshCcw,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Zap,
  Eye,
  MailOpen,
  Monitor,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import {
  NUM,
  MICRO,
  PANEL,
  Kpi,
  AdminButton,
  STAGGER_CONTAINER,
  FADE_UP,
} from '@/components/admin/ui/primitives';

const ADMIN_EMAIL_TESTER_URL = `${requirePublicEnv('VITE_SUPABASE_URL')}/functions/v1/admin-email-tester`;

const EMAIL_TRIGGERS = [
  {
    id: 'welcome',
    label: 'Subscription activated',
    description: 'Sent after a paid Pro or Premium subscription starts.',
  },
  {
    id: 'renewal_confirmation',
    label: 'Subscription renewed',
    description: "Sent after a user's paid subscription renewal succeeds.",
  },
  {
    id: 'payment_failed',
    label: 'Payment failed',
    description: 'Sent to notify a user their subscription payment failed.',
  },
  {
    id: 'quota_conversion',
    label: 'Low quota upgrade',
    description: 'Sent when a free user drops to 1 practice credit.',
  },
  {
    id: 'renewal_reminder',
    label: 'Renewal reminder (7 days)',
    description: 'Sent 7 days before an active subscription renews.',
  },
  {
    id: 'trial_expiry',
    label: 'Trial/referral expiry (3 days)',
    description: 'Sent 3 days before referral bonus quota expires.',
  },
  {
    id: 'inactivity_warning',
    label: 'Inactivity warning (7 days)',
    description: 'Re-engagement email after 7 days inactive.',
  },
];

export default function AdminEmailSettings() {
  const [session, setSession] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [stats, setStats] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(null);
  const [previewViewport, setPreviewViewport] = useState('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    fetchEmailConfig();
    fetchStats();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = (await SystemSetting.get('email_preferences')) || {};
      const defaultPrefs = {};
      EMAIL_TRIGGERS.forEach((t) => {
        defaultPrefs[t.id] = Object.prototype.hasOwnProperty.call(data, t.id) ? data[t.id] : true;
      });
      setPreferences(defaultPrefs);
    } catch (err) {
      console.error('Failed to load email preferences:', err);
      toast.error('Could not load email configurations');
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const { data, error } = await supabase.functions.invoke('admin-email-stats', {
        method: 'GET',
      });
      if (error) {
        let message = error.message;
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null);
          message = body?.error || message;
        }
        throw new Error(message);
      }
      setStats(data?.metrics || null);
    } catch (err) {
      console.error('Failed to fetch Resend stats:', err);
      setStats({ error: true });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggle = async (triggerId, checked) => {
    const updated = { ...preferences, [triggerId]: checked };
    setPreferences(updated);
    try {
      setSaving(true);
      await SystemSetting.set('email_preferences', updated);
      toast.success(`Email trigger ${checked ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update email preferences', err);
      toast.error('Failed to update email preference');
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (trigger) => {
    try {
      setPreviewViewport('desktop');
      setPreviewing({ ...trigger, loading: true });
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(ADMIN_EMAIL_TESTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: trigger.id, action: 'preview' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPreviewing({ ...trigger, ...data, loading: false });
    } catch (err) {
      console.error('Preview failed:', err);
      toast.error('Failed to load email preview');
      setPreviewing(null);
    }
  };

  const handleSendTest = async (triggerId, recipient = testEmail) => {
    if (!recipient || !recipient.includes('@'))
      return toast.error('Please enter a valid test email address');
    try {
      setSendingTest(triggerId);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(ADMIN_EMAIL_TESTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: triggerId, action: 'send', test_email: recipient }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Test email sent to ${recipient}`);
    } catch (err) {
      console.error('Test send failed:', err);
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(null);
    }
  };

  const deliveryRate = stats?.total ? Math.round((stats.delivered / stats.total) * 100) : 0;

  return (
    <m.div variants={STAGGER_CONTAINER} initial="hidden" animate="visible" className="space-y-4">
      {/* Delivery health */}
      <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        <div className="p-4 border-b border-stone-100 dark:border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/6 text-stone-500 dark:text-stone-300">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
                Email delivery health
              </h3>
              <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
                Resend metrics, last 100 emails
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            className={cn(
              MICRO,
              'inline-flex items-center gap-1.5 rounded-md border border-stone-300 dark:border-white/15 px-2.5 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50'
            )}
          >
            <RefreshCcw className={cn('w-3 h-3', loadingStats && 'animate-spin')} />
            Refresh
          </button>
        </div>
        <div className="p-4">
          {loadingStats ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-stone-500 dark:text-stone-400" />
            </div>
          ) : stats?.error ? (
            <div className="flex items-center gap-2 p-3 rounded-md border border-[rgb(var(--signal-warn)/0.3)] bg-[rgb(var(--signal-warn)/0.06)] text-[rgb(var(--signal-warn))]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">
                Could not fetch Resend delivery health. Check the edge function config.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi
                label="Total sent"
                value={(stats?.total || 0).toLocaleString()}
                tip="Emails Resend attempted to send."
              />
              <div className="rounded-md border border-[rgb(var(--signal-ok)/0.3)] bg-[rgb(var(--signal-ok)/0.06)] p-4">
                <span className={cn(MICRO, 'text-[rgb(var(--signal-ok))] flex items-center gap-1')}>
                  <CheckCircle2 className="w-3 h-3" /> Delivered
                </span>
                <p className={cn(NUM, 'text-2xl font-bold text-[rgb(var(--signal-ok))] mt-1.5')}>
                  {stats?.delivered || 0}
                </p>
              </div>
              <div className="rounded-md border border-[rgb(var(--signal-fault)/0.3)] bg-[rgb(var(--signal-fault)/0.06)] p-4">
                <span
                  className={cn(MICRO, 'text-[rgb(var(--signal-fault))] flex items-center gap-1')}
                >
                  <XCircle className="w-3 h-3" /> Failed/bounced
                </span>
                <p className={cn(NUM, 'text-2xl font-bold text-[rgb(var(--signal-fault))] mt-1.5')}>
                  {(stats?.failed || 0) + (stats?.bounced || 0)}
                </p>
              </div>
              <Kpi label="Delivery rate" value={`${deliveryRate}%`} />
            </div>
          )}
        </div>
      </m.div>

      {/* Triggers */}
      <m.div variants={FADE_UP} className={cn(PANEL, 'overflow-hidden')}>
        <div className="p-4 border-b border-stone-100 dark:border-white/6 flex items-start justify-between gap-3">
          <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/6 text-stone-500 dark:text-stone-300">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
              Email studio
            </h3>
            <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 mt-0.5')}>
              Review, test, and control each learner lifecycle email
            </p>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--signal-ok)/0.25)] bg-[rgb(var(--signal-ok)/0.06)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--signal-ok))]">
            <ShieldCheck className="w-3 h-3" />
            Brand checked
          </div>
        </div>
        {loadingConfig ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-stone-500 dark:text-stone-400" />
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-white/6">
            {EMAIL_TRIGGERS.map((trigger) => (
              <div
                key={trigger.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 space-y-0.5">
                  <Label className="text-xs font-extrabold text-stone-900 dark:text-stone-50 flex items-center gap-1.5 cursor-pointer">
                    <Mail className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                    {trigger.label}
                  </Label>
                  <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400 pl-5')}>
                    {trigger.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pl-5 sm:pl-0">
                  <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-white/4 p-0.5 rounded-md border border-stone-200/70 dark:border-white/6">
                    <button
                      onClick={() => handlePreview(trigger)}
                      className={cn(
                        MICRO,
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-white/5 transition-colors'
                      )}
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        const recipient = session?.user?.email || '';
                        setTestEmail(recipient);
                        handleSendTest(trigger.id, recipient);
                      }}
                      disabled={sendingTest === trigger.id}
                      className={cn(
                        MICRO,
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white dark:hover:bg-white/5 transition-colors disabled:opacity-50'
                      )}
                    >
                      {sendingTest === trigger.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Test
                    </button>
                  </div>
                  <span className={cn(MICRO, 'text-stone-500 dark:text-stone-400 hidden lg:block')}>
                    {preferences[trigger.id] ? 'Active' : 'Disabled'}
                  </span>
                  <Switch
                    checked={!!preferences[trigger.id]}
                    onCheckedChange={(checked) => handleToggle(trigger.id, checked)}
                    disabled={saving}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </m.div>

      {/* Preview dialog */}
      <Dialog open={!!previewing} onOpenChange={() => setPreviewing(null)}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-[#111113]">
          <DialogHeader className="p-5 border-b border-stone-200 dark:border-white/8 bg-white dark:bg-[#161618]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#6c4cff]/10 text-[#6c4cff]">
                  <MailOpen className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base">{previewing?.label}</DialogTitle>
                  <DialogDescription className="mt-0.5">
                    {previewing?.preview_context?.is_sample_data
                      ? `Preview for ${previewing.preview_context.recipient_name}; dates are illustrative.`
                      : 'Live rendering of the message a learner receives.'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/4 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    previewViewport === 'desktop'
                      ? 'bg-white dark:bg-white/10 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    previewViewport === 'mobile'
                      ? 'bg-white dark:bg-white/10 text-stone-900 dark:text-stone-50 shadow-sm'
                      : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[radial-gradient(circle_at_top,rgba(108,76,255,0.12),transparent_34%),#f4f3f1] dark:bg-[radial-gradient(circle_at_top,rgba(108,76,255,0.14),transparent_32%),#0d0d0f]">
            {previewing?.loading ? (
              <div className="flex flex-col items-center justify-center h-56 gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-stone-500 dark:text-stone-400" />
                <p className={cn(MICRO, 'text-stone-500 dark:text-stone-400')}>
                  Generating template…
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'mx-auto overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_20px_50px_rgba(24,24,27,0.16)] transition-[max-width] duration-300',
                  previewViewport === 'mobile' ? 'max-w-[390px]' : 'max-w-[640px]'
                )}
              >
                <div className="flex items-center gap-1.5 border-b border-stone-100 bg-stone-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-stone-300" />
                  <span className="h-2 w-2 rounded-full bg-stone-300" />
                  <span className="h-2 w-2 rounded-full bg-stone-300" />
                  <span className="ml-2 truncate text-[10px] font-medium text-stone-500">
                    {previewing?.subject}
                  </span>
                </div>
                <iframe
                  title={`${previewing?.label || 'Email'} preview`}
                  sandbox=""
                  srcDoc={previewing?.html || ''}
                  className="h-[560px] w-full border-0 bg-white"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-stone-100 dark:border-white/6">
            <div className="flex-1 flex items-center gap-2">
              <Input
                placeholder="Test recipient email…"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-9 max-w-[220px] rounded-md border-stone-300 dark:border-white/15 bg-white dark:bg-[#131315] text-xs"
              />
              <AdminButton
                onClick={() => handleSendTest(previewing?.id)}
                disabled={sendingTest === previewing?.id || !testEmail}
                loading={sendingTest === previewing?.id}
              >
                <Send className="w-3.5 h-3.5" />
                Send test
              </AdminButton>
            </div>
            <AdminButton variant="outline" onClick={() => setPreviewing(null)}>
              Close
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </m.div>
  );
}
