import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { BarChart3, Loader2, Megaphone, Save, Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, refreshTrackingBootstrap } from '@/lib/tracking';
import {
  IconChip,
  MUTED,
  PANEL,
  PanelTitle,
  Pill,
  TILE,
} from '@/features/dashboard/components/primitives';

const OPTIONS = [
  {
    id: 'functional',
    label: 'Essential cookies',
    description: 'Required for the app to work securely (e.g., login sessions).',
    icon: Shield,
    tone: 'accent',
    disabled: true,
  },
  {
    id: 'analytics',
    label: 'Analytics cookies',
    description: 'Help us improve by tracking which features you use most.',
    icon: BarChart3,
    tone: 'sky',
    disabled: false,
  },
  {
    id: 'marketing',
    label: 'Marketing cookies',
    description: 'Used to show you relevant offers and promotions.',
    icon: Megaphone,
    tone: 'amber',
    disabled: false,
  },
];

export default function CookieSettings() {
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error('Error parsing cookie preferences', e);
      }
    }
  }, []);

  const handleToggle = (key) => {
    if (key === 'functional') return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const consentData = {
        ...preferences,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      window.dispatchEvent(new Event('storage'));
      refreshTrackingBootstrap();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_consent', {
          p_consent_analytics: preferences.analytics,
          p_consent_marketing: preferences.marketing,
          p_consent_functional: preferences.functional,
          p_user_agent: navigator.userAgent,
        });
      }
      toast.success('Privacy preferences updated successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(PANEL, 'p-4 sm:p-5')}>
      <PanelTitle label="Cookie preferences" accent />
      <p className={cn('-mt-2 mb-4 text-xs font-medium', MUTED)}>
        Manage how we use data to improve your experience.
      </p>

      <div className="space-y-2.5">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isEnabled = preferences[option.id];
          return (
            <label
              key={option.id}
              htmlFor={`cookie-switch-${option.id}`}
              className={cn(
                TILE,
                'flex items-center gap-3.5 p-3.5 transition-all duration-200',
                option.disabled
                  ? 'cursor-default'
                  : 'cursor-pointer hover:border-[#5a63df]/35 dark:hover:border-white/18 hover:shadow-xs',
                isEnabled &&
                  !option.disabled &&
                  'border-[#5a63df]/30 bg-[#5a63df]/[0.03] dark:bg-[#5a63df]/[0.06]'
              )}
            >
              <IconChip
                icon={Icon}
                tone={isEnabled ? option.tone : 'neutral'}
                size="md"
                className="h-9 w-9 shrink-0 rounded-lg transition-colors duration-200 [&>svg]:h-4.5 [&>svg]:w-4.5"
              />
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="mb-0.5 block text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                    {option.label}
                  </span>
                  {option.disabled && (
                    <Pill tone="neutral" className="text-[9px] font-bold">
                      Required
                    </Pill>
                  )}
                </div>
                <p
                  className={cn(
                    'truncate text-xs font-medium leading-relaxed sm:whitespace-normal',
                    MUTED
                  )}
                >
                  {option.description}
                </p>
              </div>
              <Switch
                id={`cookie-switch-${option.id}`}
                checked={isEnabled}
                onCheckedChange={() => handleToggle(option.id)}
                disabled={option.disabled}
                className="shrink-0"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end border-t border-[#eeedf7] pt-4 dark:border-white/[0.07]">
        <button
          type="button"
          onClick={savePreferences}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#5a63df] px-4 text-xs font-bold text-white transition-all duration-150 hover:bg-[#4a52c9] active:scale-[0.96] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a63df] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131315]"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              <span>Save preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
