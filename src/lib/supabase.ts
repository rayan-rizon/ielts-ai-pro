/**
 * Singleton Supabase Client
 *
 * Creates a single SupabaseClient instance at module load time.
 * All consumers get the same, synchronously-available client.
 */

import { createClient } from '@supabase/supabase-js';
import { requirePublicEnv } from '@/lib/publicEnv';
import { rewriteEdgeFunctionRequest } from '@/lib/edgeFunctionEndpoint';

const supabaseUrl = requirePublicEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = requirePublicEnv('VITE_SUPABASE_ANON_KEY');
const clientHostname = typeof window === 'undefined' ? '' : window.location.hostname;

// Keep the hosted function's CORS policy strict. In local Vite development,
// invoke functions through the same-origin proxy instead of asking the hosted
// service to allow a loopback browser origin.
const edgeFunctionProxyFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(
    rewriteEdgeFunctionRequest(input, {
      supabaseUrl,
      isDevelopment: import.meta.env.DEV,
      hostname: clientHostname,
    }),
    init
  );

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: edgeFunctionProxyFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Passkeys are currently an opt-in Supabase Auth experimental API. Keeping
    // this explicit makes an accidental SDK downgrade fail loudly in tests.
    experimental: { passkey: true },
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
type UploadPurpose = 'admin-content' | 'writing-checker';

export async function uploadFile(
  file: File,
  options: { purpose?: UploadPurpose } = {}
): Promise<{ file_url: string }> {
  try {
    const { file_url } = await uploadToR2(file, options);
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
export async function uploadToR2(
  file: File,
  { purpose = 'admin-content' }: { purpose?: UploadPurpose } = {}
): Promise<{ file_url: string; key: string; expires_at?: string | null }> {
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
      'X-Upload-Purpose': purpose,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  return await response.json();
}
