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
      className="fixed bottom-3 right-3 left-auto sm:bottom-4 sm:right-4 max-w-[calc(100vw-1.5rem)] xs:max-w-[290px] sm:max-w-[315px] z-[200] animate-in fade-in slide-in-from-bottom-3 duration-300"
      data-oid="h_5l9:v"
    >
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-[18px] border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 sm:p-3.5 shadow-[0_10px_35px_-10px_rgba(109,85,232,0.18),0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)]"
        data-oid="h54q63k"
      >
        {/* Subtle accent highlight at top */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500" />

        <div className="flex items-start gap-2.5 mb-2.5 sm:mb-3 pt-0.5" data-oid="tj:plw1">
          <div className="shrink-0 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#6d55e8] to-indigo-500 text-white shadow-sm shadow-violet-500/30 flex items-center justify-center">
            <Cookie className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="pt-0.5 flex-1 min-w-0">
            <h4 className="text-[12px] sm:text-[12.5px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5">
              Privacy & Cookies
            </h4>
            <p className="text-[10px] sm:text-[11px] font-normal text-slate-600 dark:text-slate-300 leading-snug">
              We use essential cookies to power your IELTS prep experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
            aria-label="Close cookie banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showDetails && (
          <div className="overflow-hidden mb-2.5 sm:mb-3">
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
                    'flex items-center justify-between p-1.5 sm:p-2 rounded-xl border transition-all duration-200',
                    preferences[opt.id]
                      ? 'bg-violet-50/70 border-violet-200/90 dark:bg-violet-950/40 dark:border-violet-800/60'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <div
                      className={cn(
                        'p-1 rounded-lg shrink-0',
                        preferences[opt.id]
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-[#6d55e8] dark:text-violet-300'
                          : 'bg-slate-200/60 dark:bg-slate-700/50 text-slate-400'
                      )}
                    >
                      <opt.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10.5px] sm:text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {opt.label}
                      </p>
                      <p className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {opt.locked ? (
                    <span className="shrink-0 text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-wider text-[#6d55e8] dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 px-1.5 py-0.5 rounded-md">
                      Req.
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreferences((p) => ({ ...p, [opt.id]: !p[opt.id] }))}
                      className={cn(
                        'shrink-0 relative w-7 sm:w-7.5 h-4 sm:h-4.5 rounded-full transition-colors duration-200 focus:outline-hidden',
                        preferences[opt.id] ? 'bg-[#6d55e8]' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-[2px] left-[2px] w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-white shadow-xs transition-transform duration-200',
                          preferences[opt.id] ? 'translate-x-3 sm:translate-x-3' : 'translate-x-0'
                        )}
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
            className="flex-1 rounded-xl h-7.5 sm:h-8 text-[10.5px] sm:text-[11px] font-bold border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-all px-2 shadow-none"
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
            className="flex-1 rounded-xl h-7.5 sm:h-8 text-[10.5px] sm:text-[11px] font-bold bg-gradient-to-r from-[#6d55e8] to-[#5b43d6] hover:from-[#5b43d6] hover:to-[#4a32c5] text-white shadow-sm shadow-violet-500/25 active:scale-[0.98] transition-all px-2"
          >
            {showDetails ? 'Save Choices' : 'Accept All'}
          </Button>
        </div>

        {!showDetails && (
          <button
            type="button"
            onClick={() => saveConsent({ functional: true, analytics: false, marketing: false })}
            className="w-full text-[10px] sm:text-[10.5px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors pt-2 pb-0.5 text-center block cursor-pointer"
          >
            Reject All
          </button>
        )}
      </div>
    </div>
  );
}
