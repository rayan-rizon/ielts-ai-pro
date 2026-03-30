import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SystemSetting } from '@/features/admin/services/SystemSetting';
import { supabase } from '@/lib/supabase';
import {
  Mail,
  Loader2,
  RefreshCcw,
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  BarChart3,
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
import { Input } from '@/components/ui/input';

const ADMIN_EMAIL_STATS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-email-stats`;
const ADMIN_EMAIL_TESTER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-email-tester`;

const EMAIL_TRIGGERS = [
  {
    id: 'welcome',
    label: 'Welcome (Registration)',
    description: 'Sent when a user signs up successfully.',
  },
  {
    id: 'renewal_confirmation',
    label: 'Subscription Renewal',
    description: "Sent when a user's subscription renews successfully paid.",
  },
  {
    id: 'payment_failed',
    label: 'Payment Failed',
    description: 'Sent to notify user about failed subscription payments (Support).',
  },
  {
    id: 'quota_conversion',
    label: 'Low Quota Upgrade',
    description: 'Sent when free user drops to 1 practice credit to drive upgrades.',
  },
  {
    id: 'renewal_reminder',
    label: 'Renewal Reminder (7 Days)',
    description: 'Sent 7 days before an active subscription renews.',
  },
  {
    id: 'trial_expiry',
    label: 'Trial/Referral Expiry (3 Days)',
    description: 'Sent 3 days before referral bonus/trial quotas expire.',
  },
  {
    id: 'inactivity_warning',
    label: 'Inactivity Warning (7 Days)',
    description: 'Re-engagement email sent when user has been inactive for 7 days.',
  },
];

export default function AdminEmailSettings() {
  const [session, setSession] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [stats, setStats] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(null); // { id, label, html, subject, loading }
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(null); // triggerId

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    fetchEmailConfig();
    fetchStats();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      setLoadingConfig(true);
      const data = (await SystemSetting.get('email_preferences')) || {};

      // Initialize with defaults if empty
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('No active session');

      await fetch(ADMIN_EMAIL_STATS_URL, {
        method: 'OPTIONS',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const res = await fetch(ADMIN_EMAIL_STATS_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const resData = await res.json();
      setStats(resData.metrics);
    } catch (err) {
      console.error('Failed to fetch Resend stats:', err);
      // Suppress toast, just fail gracefully in UI
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
      // Revert if fail
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
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid test email address');
      return;
    }

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
        body: JSON.stringify({
          type: triggerId,
          action: 'send',
          test_email: testEmail,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.success('Test email sent successfully!');
    } catch (err) {
      console.error('Test send failed:', err);
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Overview & Stats */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Email Delivery Health</CardTitle>
                  <CardDescription>Resend API delivery metrics (Last 100 emails)</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={loadingStats}
                className="h-9 gap-2"
              >
                <RefreshCcw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                Refresh Stats
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats?.error ? (
              <div className="flex items-center gap-2 p-4 text-amber-600 bg-amber-50 rounded-xl dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">
                  Could not fetch Resend delivery health. Please check Edge Function configuration.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Total Sent
                  </span>
                  <span className="text-2xl font-bold">{stats?.total || 0}</span>
                </div>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                  </span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {stats?.delivered || 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Failed/Bounced
                  </span>
                  <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {(stats?.failed || 0) + (stats?.bounced || 0)}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Delivery Rate
                  </span>
                  <span className="text-2xl font-bold">
                    {stats?.total ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Triggers Configuration */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Email Event Triggers</CardTitle>
                <CardDescription>
                  Turn on or off automated lifecycle emails globally.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingConfig ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {EMAIL_TRIGGERS.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-base font-semibold leading-none cursor-pointer flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {trigger.label}
                      </Label>
                      <p className="text-sm text-muted-foreground pl-6">{trigger.description}</p>
                    </div>

                    <div className="flex items-center gap-4 ml-6 sm:ml-0">
                      <div className="flex bg-muted/30 p-1 rounded-lg border border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 gap-1.5 text-xs hover:bg-background"
                          onClick={() => handlePreview(trigger)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 gap-1.5 text-xs hover:bg-background"
                          onClick={() => {
                            setTestEmail(session?.user?.email || '');
                            setSendingTest(null); // Just opens the logic indirectly later
                            handleSendTest(trigger.id);
                          }}
                          disabled={sendingTest === trigger.id}
                        >
                          {sendingTest === trigger.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Test
                        </Button>
                      </div>

                      <div className="h-8 w-[1px] bg-border/40 mx-1 hidden sm:block" />

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden lg:block">
                          {preferences[trigger.id] ? 'Active' : 'Disabled'}
                        </span>
                        <Switch
                          checked={!!preferences[trigger.id]}
                          onCheckedChange={(checked) => handleToggle(trigger.id, checked)}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={!!previewing} onOpenChange={() => setPreviewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/50">
          <DialogHeader className="p-6 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                <MailOpen className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Email Preview: {previewing?.label}</DialogTitle>
                <DialogDescription>
                  Subject:{' '}
                  <span className="text-foreground font-medium">
                    {previewing?.subject || '(Loading...)'}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
            {previewing?.loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm text-muted-foreground">Generating template...</p>
              </div>
            ) : (
              <div
                className="bg-white rounded-lg shadow-sm border border-border/50 max-w-lg mx-auto overflow-hidden min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: previewing?.html }}
              />
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/10 gap-3">
            <div className="flex-1 flex items-center gap-2 px-2">
              <Input
                placeholder="Test recipient email..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-9 max-w-[240px]"
              />
              <Button
                size="sm"
                className="gap-2"
                onClick={() => handleSendTest(previewing?.id)}
                disabled={sendingTest === previewing?.id || !testEmail}
              >
                {sendingTest === previewing?.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Test Email
              </Button>
            </div>
            <Button variant="outline" onClick={() => setPreviewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
