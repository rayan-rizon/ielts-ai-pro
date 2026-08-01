import React, { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart3, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  refreshTrackingBootstrap,
  trackPageView,
} from '@/lib/tracking';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: true,
    marketing: false,
  });

  // Check for consent on mount
  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!storedConsent) {
        // Small delay for better UX (don't slam the user immediately)
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('LocalStorage access denied:', e);
    }
  }, []);

  const saveConsent = (consentData) => {
    setIsVisible(false);

    try {
      const payload = {
        ...consentData,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));

      window.dispatchEvent(new Event('storage'));
      refreshTrackingBootstrap();
      trackPageView(window.location.pathname);
    } catch (error) {
      console.error('Failed to save consent locally:', error);
    }

    syncConsentToDatabase(consentData);
  };

  const syncConsentToDatabase = async (consentData) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_consent', {
          p_consent_analytics: consentData.analytics,
          p_consent_marketing: consentData.marketing,
          p_consent_functional: consentData.functional,
          p_user_agent: navigator.userAgent,
        });
      }
    } catch (error) {
      console.warn('Background consent sync failed:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-3 right-3 left-auto sm:bottom-4 sm:right-4 max-w-[calc(100vw-1.5rem)] min-[480px]:max-w-[290px] sm:max-w-[310px] z-[200] animate-in fade-in slide-in-from-bottom-3 duration-300"
      data-oid="h_5l9:v"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-3.5 shadow-xl shadow-slate-900/10 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.08)]"
        data-oid="h54q63k"
      >
        <div className="flex items-start gap-2.5 mb-2.5" data-oid="tj:plw1">
          <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary dark:bg-indigo-500/20 dark:text-indigo-300 dark:border dark:border-indigo-500/30 flex items-center justify-center">
            <Cookie className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            {/* h2 (not h4) so the banner never breaks the page heading order */}
            <h2 className="text-[12px] font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-0.5 leading-tight">
              Privacy & Cookies
            </h2>
            <p className="text-[10.5px] font-normal text-slate-600 dark:text-slate-300/90 leading-snug">
              We use essential cookies to power your IELTS prep experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="shrink-0 p-0.5 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDetails && (
          <div className="overflow-hidden mb-2.5">
            <div className="space-y-1 pt-0.5">
              {[
                {
                  id: 'functional',
                  label: 'Essential',
                  desc: 'Secure login & basics.',
                  icon: Shield,
                  locked: true,
                },
                {
                  id: 'analytics',
                  label: 'Analytics',
                  desc: 'Improving score tools.',
                  icon: BarChart3,
                  locked: false,
                },
                {
                  id: 'marketing',
                  label: 'Personalization',
                  desc: 'Relevant tips.',
                  icon: Megaphone,
                  locked: false,
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    'flex items-center justify-between p-1.5 rounded-lg border transition-all duration-200',
                    preferences[opt.id]
                      ? 'bg-primary/5 border-primary/20 dark:bg-indigo-950/40 dark:border-indigo-800/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <div
                      className={cn(
                        'p-1 rounded-md shrink-0',
                        preferences[opt.id]
                          ? 'bg-primary/15 text-primary dark:bg-indigo-500/20 dark:text-indigo-300'
                          : 'bg-slate-200/60 dark:bg-slate-700/50 text-slate-400'
                      )}
                    >
                      <opt.icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {opt.label}
                      </p>
                      <p className="text-[9.5px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {opt.locked ? (
                    <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-wider text-primary bg-primary/10 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border dark:border-indigo-500/30 px-1.5 py-0.5 rounded-md">
                      Req.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, [opt.id]: !p[opt.id] }))}
                      className={cn(
                        'shrink-0 relative w-7 h-4 rounded-full transition-colors duration-200 focus:outline-hidden',
                        preferences[opt.id]
                          ? 'bg-primary dark:bg-indigo-600'
                          : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-[2px] left-[2px] w-3 h-3 rounded-full bg-white shadow-xs transition-transform duration-200',
                          preferences[opt.id] ? 'translate-x-3' : 'translate-x-0'
                        )}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 rounded-lg h-7 text-[10.5px] font-bold border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-all px-2 shadow-none"
          >
            {showDetails ? 'Hide' : 'Customize'}
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveConsent(
                showDetails ? preferences : { functional: true, analytics: true, marketing: true }
              )
            }
            className="flex-1 rounded-lg h-7 text-[10.5px] font-bold bg-primary hover:bg-primary/90 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white shadow-xs dark:shadow-indigo-500/20 active:scale-[0.98] transition-all px-2"
          >
            {showDetails ? 'Save Choices' : 'Accept All'}
          </Button>
        </div>

        {!showDetails && (
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="w-full min-h-[28px] text-[10px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors mt-1 py-1.5 block text-center cursor-pointer hover:underline"
          >
            Reject All
          </button>
        )}
      </div>
    </div>
  );
}
