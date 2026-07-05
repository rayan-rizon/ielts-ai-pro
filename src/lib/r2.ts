import { supabase } from '@/lib/supabase';

/**
 * Upload a file to Cloudflare R2 via Supabase Edge Function
 * @param {File} file - The file object to upload
 * @returns {Promise<{file_url: string, key: string}>} - The public URL and key of the uploaded file
 */
export async function uploadToR2(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke('r2-upload', {
    body: formData,
  });

  if (error) {
    console.error('Error invoking r2-upload function:', error);
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
