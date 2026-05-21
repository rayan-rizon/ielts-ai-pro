import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, BarChart3, Megaphone, Cookie } from 'lucide-react';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const CONSENT_STORAGE_KEY = 'ielts_cookie_consent';
const CONSENT_VERSION = '1.0';

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
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 dark:border-white/5">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Cookie className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black">Cookie Preferences</h3>
          <p className="text-slate-500 font-medium">
            Manage how we use data to improve your experience.
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {options.map((option) => {
          const Icon = option.icon;
          const isEnabled = preferences[option.id];
          return (
            <div
              key={option.id}
              className={cn(
                'flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200',
                isEnabled
                  ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-500/20'
                  : 'bg-slate-50 border-transparent dark:bg-white/5'
              )}
            >
              <div
                className={cn(
                  'mt-1 p-2 rounded-xl',
                  isEnabled
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">{option.label}</span>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(option.id)}
                    disabled={option.disabled}
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={loading}
          className="rounded-xl h-12 px-8 font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
