import { supabase } from '@/lib/supabase';

export const SystemSetting = {
  // Get all settings (public view)
  async getAll(): Promise<Record<string, any>> {
    const { data, error } = await supabase.from('system_settings').select('*');

    if (error) {
      // If table doesn't exist yet, return empty array to prevent app crash
      if (error.code === '42P01') return {};
      throw error;
    }

    // Convert array to object for easier access { key: value }
    return data.reduce((acc: Record<string, any>, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  },

  // Get a specific setting
  async get(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data.value;
  },

  // Set/Update a setting (Admin only)
  async set(key: string, value: any, description: string = ''): Promise<any> {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
