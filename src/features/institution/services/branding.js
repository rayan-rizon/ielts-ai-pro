import { supabase } from '@/lib/supabase';

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const BUCKET = 'institution-logos';

export function validateInstitutionLogo(file) {
  if (!EXTENSIONS[file.type]) throw new Error('Choose a PNG, JPG or WebP image.');
  if (!file.size || file.size > LOGO_MAX_BYTES)
    throw new Error('Choose an image smaller than 2 MB.');
}

export async function uploadInstitutionLogo(institutionId, file) {
  validateInstitutionLogo(file);
  const path = `${institutionId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error('Unable to upload your logo. Please try again.');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Only remove managed assets belonging to this institution, never external URLs.
export async function removeInstitutionLogo(institutionId, url) {
  if (!url) return;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${institutionId}/`);
  if (!url.startsWith(data.publicUrl)) return;
  const filename = url.slice(data.publicUrl.length);
  if (!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(filename)) return;
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([`${institutionId}/${filename}`]);
    if (error) console.warn('Institution logo cleanup could not be completed');
  } catch {
    console.warn('Institution logo cleanup could not be completed');
  }
}
