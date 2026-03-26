/**
 * Cross-tab session synchronization utility.
 *
 * Listens for localStorage changes from other tabs to detect session changes
 * and provides window focus handling for session refresh.
 */

import type { SupabaseClient, Session } from '@supabase/supabase-js';

type SessionChangeCallback = (session: Session | null) => void;

/**
 * Sets up cross-tab session synchronization.
 *
 * @param supabase - The Supabase client instance
 * @param onSessionChange - Callback function to run when session changes in another tab
 * @returns Cleanup function to remove event listeners
 */
export const setupCrossTabSync = (
    supabase: SupabaseClient,
    onSessionChange: SessionChangeCallback
): (() => void) => {
    const handleStorageEvent = async (event: StorageEvent): Promise<void> => {
        // Only verify if the changed key is the likely Supabase auth token key
        // Supabase usually uses keys like `sb-<project-ref>-auth-token`
        if (event.key && event.key.includes('auth-token')) {
            // If the storage event (from another tab) indicates a change in auth token,
            // we should re-check our local session state.
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (!error && session) {
                onSessionChange(session);
            } else if (!session) {
                // If no session found after storage change, it might mean logout in other tab
                // However, usually Supabase's onAuthStateChange handles 'SIGNED_OUT'
                // This is a backup check.
                onSessionChange(null);
            }
        }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
        window.removeEventListener('storage', handleStorageEvent);
    };
};
