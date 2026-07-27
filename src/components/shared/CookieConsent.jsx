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
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-[310px] z-[200]"
      data-oid="h_5l9:v"
    >
      <div
        className="rounded-[18px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-3.5 shadow-lg shadow-slate-900/5 dark:shadow-slate-950/40"
        data-oid="h54q63k"
      >
        <div className="flex items-start gap-2.5 mb-3" data-oid="tj:plw1">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-[#6d55e8] dark:text-violet-300 flex items-center justify-center">
            <Cookie className="w-4 h-4" />
          </div>
          <div className="pt-0.5 flex-1 min-w-0">
            <h4 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">
              Privacy & Cookies
            </h4>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              We use essential cookies to power your IELTS prep experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDetails && (
          <div className="overflow-hidden mb-3">
            <div className="space-y-1.5 pt-0.5">
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
                    'flex items-center justify-between p-2 rounded-lg border transition-colors',
                    preferences[opt.id]
                      ? 'bg-violet-50/60 border-violet-200/80 dark:bg-violet-950/30 dark:border-violet-900/50'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-white/5'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <opt.icon
                      className={cn(
                        'w-3.5 h-3.5',
                        preferences[opt.id]
                          ? 'text-[#6d55e8] dark:text-violet-300'
                          : 'text-slate-400'
                      )}
                    />
                    <div>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200">
                        {opt.label}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {opt.locked ? (
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#6d55e8] dark:text-violet-300 bg-violet-100 dark:bg-violet-900/50 px-1.5 py-0.5 rounded">
                      Req.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, [opt.id]: !p[opt.id] }))}
                      className={cn(
                        'relative w-7 h-4 rounded-full transition-colors focus:outline-hidden',
                        preferences[opt.id] ? 'bg-[#6d55e8]' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <span
                        style={{
                          transform: `translateX(${preferences[opt.id] ? 13 : 2}px)`,
                        }}
                        className="absolute top-0.5 left-0 w-3 h-3 rounded-full bg-white shadow-xs transition-transform"
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 rounded-lg h-8 text-[11px] font-bold border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
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
            className="flex-1 rounded-lg h-8 text-[11px] font-bold bg-[#6d55e8] hover:bg-[#5b43d6] text-white shadow-xs"
          >
            {showDetails ? 'Save Choices' : 'Accept All'}
          </Button>
        </div>

        {!showDetails && (
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="w-full text-[10.5px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors pt-2 pb-0.5 text-center block"
          >
            Reject All
          </button>
        )}
      </div>
    </div>
  );
}
