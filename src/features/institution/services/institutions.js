import { supabase } from '@/lib/supabase';
import { getCsrfHeaders } from '@/lib/csrf';
export async function institutionRequest(action, data = {}) {
  const result = await supabase.functions.invoke('institutions', {
    body: { action, data },
    headers: getCsrfHeaders(),
  });
  if (result.error) {
    let message = result.error.message;
    try {
      const body = await result.error.context?.json();
      message = body?.error || message;
    } catch {
      /* Network failure has no response body. */
    }
    throw new Error(message);
  }
  if (result.data?.error) throw new Error(result.data.error);
  return result.data?.data;
}
export async function loadInstitutionAccess() {
  try {
    const { data, error } = await supabase.rpc('get_my_institution_access');
    if (error) {
      if (!['PGRST202', '42883'].includes(error.code))
        console.warn('Institution access could not be verified', error.code);
      return {};
    }
    return data || {};
  } catch {
    return {};
  }
}
