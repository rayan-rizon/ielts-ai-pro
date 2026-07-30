import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { supabase } from '@/lib/supabase';
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

const ADMIN_EMAIL_TESTER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-email-tester`;

const EMAIL_TRIGGERS = [
  {
    id: 'welcome',
    label: 'Welcome (registration)',
    description: 'Sent when a user signs up successfully.',
  },
  {
    id: 'renewal_confirmation',
    label: 'Subscription renewal',
    description: "Sent when a user's subscription renews and is paid.",
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

  const handleSendTest = async (triggerId) => {
    if (!testEmail || !testEmail.includes('@'))
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
        body: JSON.stringify({ type: triggerId, action: 'send', test_email: testEmail }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Test email sent');
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
        <div className="p-4 border-b border-stone-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
                Email delivery health
              </h3>
              <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>Resend metrics, last 100 emails</p>
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
              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
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
                tip="Emails Resend attempted to send in the sample."
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
        <div className="p-4 border-b border-stone-100 dark:border-white/[0.06] flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
              Email triggers
            </h3>
            <p className={cn(MICRO, 'text-stone-400 mt-0.5')}>Toggle automated lifecycle emails</p>
          </div>
        </div>
        {loadingConfig ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
            {EMAIL_TRIGGERS.map((trigger) => (
              <div
                key={trigger.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1 space-y-0.5">
                  <Label className="text-xs font-extrabold text-stone-900 dark:text-stone-50 flex items-center gap-1.5 cursor-pointer">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    {trigger.label}
                  </Label>
                  <p className={cn(MICRO, 'text-stone-400 pl-5')}>{trigger.description}</p>
                </div>

                <div className="flex items-center gap-3 pl-5 sm:pl-0">
                  <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-white/[0.04] p-0.5 rounded-md border border-stone-200/70 dark:border-white/[0.06]">
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
                        setTestEmail(session?.user?.email || '');
                        handleSendTest(trigger.id);
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
                  <span className={cn(MICRO, 'text-stone-400 hidden lg:block')}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-stone-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-stone-100 dark:bg-white/[0.06] text-stone-500 dark:text-stone-300">
                <MailOpen className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle>Preview: {previewing?.label}</DialogTitle>
                <DialogDescription>
                  Subject:{' '}
                  <span className="text-stone-700 dark:text-stone-200 font-medium">
                    {previewing?.subject || '(loading…)'}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 bg-stone-50 dark:bg-white/[0.02]">
            {previewing?.loading ? (
              <div className="flex flex-col items-center justify-center h-56 gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                <p className={cn(MICRO, 'text-stone-400')}>Generating template…</p>
              </div>
            ) : (
              <div
                className="bg-white rounded-md border border-stone-200 max-w-lg mx-auto overflow-hidden min-h-[380px]"
                dangerouslySetInnerHTML={{ __html: previewing?.html }}
              />
            )}
          </div>

          <DialogFooter className="p-4 border-t border-stone-100 dark:border-white/[0.06]">
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
