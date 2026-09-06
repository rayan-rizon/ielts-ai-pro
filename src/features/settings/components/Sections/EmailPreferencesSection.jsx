import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Bell, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { IconChip, MUTED, PANEL, TILE } from '@/features/dashboard/components/primitives';
import MarketingDelivery from '@/features/marketing/services/MarketingDelivery';

/**
 * Email preferences.
 *
 * This tab is what the "Unsubscribe" link in every email footer points at.
 * Before it existed the link went to `?tab=preferences`, which matched no tab,
 * so Settings silently fell back to Profile and there was no way to opt out
 * from inside the product at all.
 *
 * Marketing email is opt-out: everyone is subscribed unless they turn this off.
 * Account and billing email is deliberately not switchable — a receipt or a
 * failed-payment warning is not marketing, and hiding it behind a toggle would
 * mean a learner could silently lose access without being told why.
 */
export default function EmailPreferencesSection() {
  const [subscribed, setSubscribed] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('users')
      .select('id,marketing_email_unsubscribed_at')
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn('[settings] Could not load email preferences:', error.message);
          setSubscribed(true);
          return;
        }
        setProfileId(data?.id || null);
        setSubscribed(!data?.marketing_email_unsubscribed_at);
        const preference = data?.id ? await MarketingDelivery.getPreferences(data.id) : null;
        if (active) setPushEnabled(Boolean(preference?.push_enabled));
      })
      .catch((error) => {
        console.warn('[settings] Could not load communication preferences:', error.message);
        if (active) setPushEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = async (next) => {
    const previous = subscribed;
    setSubscribed(next);
    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_my_marketing_email_subscription', {
        p_subscribed: next,
      });
      if (error) throw error;
      if (profileId) await MarketingDelivery.savePreferences(profileId, { email_enabled: next });
      toast.success(next ? 'Subscribed to product email' : 'Unsubscribed from product email');
    } catch (error) {
      setSubscribed(previous);
      toast.error(error.message || 'Could not save your email preference');
    } finally {
      setSaving(false);
    }
  };

  const togglePush = async (next) => {
    if (!profileId) return;
    const previous = pushEnabled;
    setPushEnabled(next);
    setSaving(true);
    try {
      if (next) await MarketingDelivery.enablePush(profileId);
      else await MarketingDelivery.disablePush(profileId);
      toast.success(next ? 'Push practice reminders enabled' : 'Push reminders disabled');
    } catch (error) {
      setPushEnabled(previous);
      toast.error(error.message || 'Could not save your push preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <m.div
      key="preferences"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-4"
    >
      <div className={cn(PANEL, 'p-5')}>
        <div className="flex items-start gap-3">
          <IconChip icon={Mail} tone="accent" size="md" />
          <div className="min-w-0">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Communication preferences
            </h2>
            <p className={cn('mt-1 text-[13px] leading-relaxed', MUTED)}>
              Choose what lands in your inbox. Changes apply immediately.
            </p>
          </div>
        </div>

        <label
          className={cn(
            TILE,
            'mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl p-4'
          )}
        >
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900 dark:text-slate-50">
              Practice tips and offers
            </span>
            <span className={cn('mt-1 block text-[12px] leading-relaxed', MUTED)}>
              Occasional email about your practice, study reminders, and plan offers. Turn this off
              and we stop sending them.
            </span>
          </span>
          <Switch
            checked={Boolean(subscribed)}
            disabled={subscribed === null || saving}
            onCheckedChange={toggle}
            aria-label="Practice tips and offers by email"
          />
        </label>

        <label
          className={cn(
            TILE,
            'mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-xl p-4'
          )}
        >
          <span className="flex min-w-0 items-start gap-3">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <span className="block text-sm font-bold text-slate-900 dark:text-slate-50">
                Push practice reminders
              </span>
              <span className={cn('mt-1 block text-[12px] leading-relaxed', MUTED)}>
                Optional, generic lock-screen reminders. Enabling this asks for browser permission;
                turning it off removes this browser subscription.
              </span>
            </span>
          </span>
          <Switch
            checked={Boolean(pushEnabled)}
            disabled={pushEnabled === null || saving}
            onCheckedChange={togglePush}
            aria-label="Push practice reminders"
          />
        </label>

        <div
          className={cn(TILE, 'mt-3 flex items-start gap-3 rounded-xl p-4 opacity-90')}
          aria-disabled="true"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900 dark:text-slate-50">
              Account and billing email
            </span>
            <span className={cn('mt-1 block text-[12px] leading-relaxed', MUTED)}>
              Sign-in links, password changes, receipts, renewal notices and failed payments. These
              are always sent — they are how you keep access to your account.
            </span>
          </span>
        </div>
      </div>
    </m.div>
  );
}
