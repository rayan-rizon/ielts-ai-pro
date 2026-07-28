import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, BarChart3, Megaphone, Cookie } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CONSENT_STORAGE_KEY, CONSENT_VERSION, refreshTrackingBootstrap } from '@/lib/tracking';

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

  const options = [
    {
      id: 'functional',
      label: 'Essential Cookies',
      description: 'Required for the app to work securely (e.g., login sessions).',
      icon: Shield,
      disabled: true,
    },
    {
      id: 'analytics',
      label: 'Analytics Cookies',
      description: 'Help us improve by tracking which features you use most.',
      icon: BarChart3,
      disabled: false,
    },
    {
      id: 'marketing',
      label: 'Marketing Cookies',
      description: 'Used to show you relevant offers and promotions.',
      icon: Megaphone,
      disabled: false,
    },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-2xs">
          <Cookie className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Cookie Preferences
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage how we use data to improve your experience.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          const isEnabled = preferences[option.id];
          return (
            <div
              key={option.id}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200',
                isEnabled
                  ? 'bg-blue-50/40 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-500/20'
                  : 'bg-slate-50/80 border-slate-200/80 dark:bg-slate-950/40 dark:border-white/5'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-lg shrink-0',
                  isEnabled
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block mb-0.5">
                  {option.label}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed truncate sm:whitespace-normal">
                  {option.description}
                </p>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={() => handleToggle(option.id)}
                disabled={option.disabled}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={savePreferences}
          disabled={loading}
          size="sm"
          className="rounded-xl h-10 px-5 font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-white text-xs sm:text-sm border-0"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
