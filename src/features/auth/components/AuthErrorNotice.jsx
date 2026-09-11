import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { OUTAGE_COPY } from '@/lib/serviceOutage';

/**
 * The single error surface for both the learner and admin sign-in forms.
 *
 * An outage is styled and worded differently from a rejected credential on
 * purpose: red + "invalid password" teaches the user to doubt their account and
 * sends them to the password-reset flow, which is also down. Amber + "this is
 * on our side" keeps them calm and keeps support quiet.
 *
 * @param {string} message      Plain error text (credential, validation, etc.).
 * @param {boolean} isOutage    Render the reassuring backend-outage variant.
 * @param {function} [onRetry]  Retry handler shown only in the outage variant.
 * @param {boolean} [retrying]  Disables and spins the retry button.
 */
export function AuthErrorNotice({ message, isOutage = false, onRetry, retrying = false }) {
  const visible = Boolean(isOutage || message);

  return (
    <AnimatePresence>
      {visible && (
        // One stable key for both variants: switching between the outage and
        // credential wording is a content change, not a swap. Keyed per-variant
        // with mode="wait" it left a visible empty gap while one exited.
        <motion.div
          key="auth-error-notice"
          layout
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          role="alert"
          aria-live="assertive"
          className={cn(
            'flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed transition-colors shadow-2xs',
            isOutage
              ? 'border-amber-500/25 bg-amber-50/70 text-amber-950 dark:border-amber-400/25 dark:bg-amber-400/[0.07] dark:text-amber-100'
              : 'border-rose-500/25 bg-rose-50/70 text-rose-950 dark:border-rose-400/25 dark:bg-rose-400/[0.07] dark:text-rose-100'
          )}
        >
          {isOutage ? (
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300">
              <CloudOff className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
          ) : (
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-300">
              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
            </span>
          )}

          {isOutage ? (
            <div className="min-w-0 flex-1 space-y-1">
              <h4 className="text-[12px] font-bold leading-tight tracking-tight text-amber-950 dark:text-amber-200">
                {OUTAGE_COPY.title}
              </h4>
              <p className="text-[11px] font-normal leading-relaxed text-amber-900/80 dark:text-amber-200/85">
                {message || OUTAGE_COPY.body}
              </p>
              {onRetry && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={retrying}
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-2xs transition-[background-color,border-color,transform] hover:border-amber-500/40 hover:bg-amber-50/90 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 dark:border-amber-400/30 dark:bg-amber-400/12 dark:text-amber-200 dark:hover:bg-amber-400/20"
                  >
                    <RefreshCw
                      className={cn('h-2.5 w-2.5', retrying && 'animate-spin')}
                      strokeWidth={2.25}
                    />
                    <span>{retrying ? 'Trying…' : 'Try again'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[12px] font-semibold leading-relaxed text-rose-950 dark:text-rose-200">
                {message}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthErrorNotice;
