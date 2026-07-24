/**
 * Singleton Supabase Client
 *
 * Creates a single SupabaseClient instance at module load time.
 * All consumers get the same, synchronously-available client.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined) ||
  'https://placeholder.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Get the Supabase client instance (async).
 * Kept for backward compatibility — returns the already-created singleton.
 */
export const getSupabaseClient = async () => supabase;

/**
 * Visibility Change Handler for Token Auto-Refresh
 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/**
 * General purpose file upload utility.
 * Now defaults to R2 for better reliability and higher size limits.
 */
export async function uploadFile(file: File): Promise<{ file_url: string }> {
  try {
    const { file_url } = await uploadToR2(file);
    return { file_url };
  } catch (error) {
    console.error('Upload fallthrough to Supabase storage failed:', error);
    // We could fallback to Supabase here if R2 fails, but R2 is the primary source
    throw error;
  }
}

/**
 * Upload a file to Cloudflare R2 via Edge Function
 * Used for larger files and different content types like PDFs
 */
export async function uploadToR2(file: File): Promise<{ file_url: string; key: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentication required for upload');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${supabaseUrl}/functions/v1/r2-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  return await response.json();
}
