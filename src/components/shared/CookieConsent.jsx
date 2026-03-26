import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Megaphone, Check, ChevronDown, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const CONSENT_STORAGE_KEY = 'ielts_cookie_consent';
const CONSENT_VERSION = '1.0';

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
        // Only show if no consent is stored.
        // Small delay for better UX (don't slam the user immediately)
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Logic for when localStorage is blocked (e.g. strict security settings)
      console.warn('LocalStorage access denied:', e);
    }
  }, []);

  const saveConsent = (consentData) => {
    // 1. Optimistic UI Update - Dismiss immediately
    setIsVisible(false);

    // 2. Persist to LocalStorage
    try {
      const payload = {
        ...consentData,
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));

      // Notify other tabs/components if needed
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Failed to save consent locally:', error);
    }

    // 3. Sync to Backend (Fire and forget)
    // We don't await this to avoid blocking the UI
    syncConsentToDatabase(consentData);
  };

  const syncConsentToDatabase = async (consentData) => {
    try {
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
      // Silent fail for analytics sync
      console.warn('Background consent sync failed:', error);
    }
  };

  return (
    <AnimatePresence data-oid="pjs-7me">
      {isVisible && (
        <m.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-[320px] z-[200]"
          data-oid="h_5l9:v"
        >
          <div className="relative group overflow-hidden" data-oid="rd7nz0m">
            {/* Ambient Background Glow */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              data-oid="nr0c.h4"
            />

            <div
              className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl border border-zinc-200 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3.5"
              data-oid="h54q63k"
            >
              <div className="flex items-start gap-2.5 mb-3" data-oid="tj:plw1">
                <div className="relative" data-oid="glpra6z">
                  <div
                    className="relative w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20"
                    data-oid=".t1n1cq"
                  >
                    <Cookie className="w-4 h-4" data-oid="wv7xoxb" />
                  </div>
                </div>
                <div className="pt-0.5 flex-1" data-oid="jvidzpt">
                  <div
                    className="text-sm font-black tracking-tight text-zinc-900 dark:text-white mb-0.5"
                    data-oid="e9k95kq"
                  >
                    Privacy & Cookies
                  </div>
                  <p
                    className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-tight"
                    data-oid="48-pi98"
                  >
                    We use essential cookies to power your IELTS prep experience.
                  </p>
                </div>
                <button
                  onClick={() =>
                    saveConsent({ functional: true, analytics: false, marketing: false })
                  }
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                  data-oid="585tjgt"
                >
                  <span
                    className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 text-xs font-black"
                    data-oid="b32h4b6"
                  >
                    ×
                  </span>
                </button>
              </div>

              <AnimatePresence data-oid="ul0uif8">
                {showDetails && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                    data-oid="kozxe_4"
                  >
                    <div className="pt-1 pb-4 space-y-2" data-oid="sh2g0:u">
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
                            'flex items-center justify-between p-3 rounded-xl border transition-all duration-300',
                            preferences[opt.id]
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/5'
                          )}
                          data-oid="eebmwu7"
                        >
                          <div className="flex items-center gap-2.5" data-oid="_02s665">
                            <opt.icon
                              className={cn(
                                'w-4 h-4',
                                preferences[opt.id] ? 'text-primary' : 'text-zinc-400'
                              )}
                              data-oid="k3mbted"
                            />

                            <div data-oid="28c1ko0">
                              <p
                                className="text-xs font-black text-zinc-900 dark:text-zinc-100"
                                data-oid="djb3wlf"
                              >
                                {opt.label}
                              </p>
                              <p
                                className="text-[11px] font-medium text-zinc-500"
                                data-oid="nfo8194"
                              >
                                {opt.desc}
                              </p>
                            </div>
                          </div>
                          {opt.locked ? (
                            <span
                              className="text-[11px] font-black uppercase tracking-widest text-primary/60"
                              data-oid="2ownkh-"
                            >
                              Req.
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setPreferences((p) => ({ ...p, [opt.id]: !p[opt.id] }))
                              }
                              className={cn(
                                'relative w-8 h-4 rounded-full transition-colors duration-300',
                                preferences[opt.id] ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                              )}
                              data-oid="9k1nbyy"
                            >
                              <m.div
                                animate={{ x: preferences[opt.id] ? 16 : 2 }}
                                className="absolute top-0.5 left-0 w-3 h-3 rounded-full bg-white shadow-sm"
                                data-oid="5-v9814"
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2" data-oid="81sqc.p">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex-1 rounded-lg h-9 text-[11px] font-medium border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  data-oid="q:e5e8h"
                >
                  {showDetails ? 'Hide' : 'Customize'}
                </Button>
                <Button
                  onClick={() => saveConsent(preferences)}
                  className="flex-1 rounded-lg h-9 text-[11px] font-black bg-primary hover:bg-primary/90 text-white"
                  data-oid="80dss-w"
                >
                  Accept All
                </Button>
              </div>

              {!showDetails && (
                <button
                  onClick={() =>
                    saveConsent({ functional: true, analytics: false, marketing: false })
                  }
                  className="w-full text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors py-2"
                  data-oid="m_18h5m"
                >
                  Reject All
                </button>
              )}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function useCookieConsent() {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }
  }, []);

  const hasConsent = (type) => consent?.[type] === true;

  return { consent, hasConsent };
}
