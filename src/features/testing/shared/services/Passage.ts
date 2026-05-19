import { supabase } from '@/lib/supabase';
// @ts-ignore
import { withCache, CACHE_TTL } from '@/lib/apiCache';
import { Passage as PassageType } from '@/types';

interface ListOptions {
  page?: number | null;
  limit?: number;
  orderBy?: string;
  filters?: Record<string, any>;
}

export const PassageService = {
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'created_at',
    limit: number = 10000,
    page: number | null = null,
    select: string = '*'
  ): Promise<any> {
    let query = supabase
      .from('passages')
      .select(select, { count: page !== null ? 'exact' : undefined });

    Object.keys(filters).forEach((key) => {
      const value = filters[key];

      // Skip undefined, null, empty strings
      if (value === undefined || value === null || value === '' || value === 'all') {
        return;
      }

      // Handle special searchQuery filter
      if (key === 'searchQuery') {
        query = query.ilike('title', `%${value}%`);
      } else {
        // Standard equality filter
        query = query.eq(key, value);
      }
    });

    query = query.order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') });

    if (page !== null) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    if (page !== null) {
      return { data: data as unknown as PassageType[], count };
    }
    return data as unknown as PassageType[];
  },

  async create(data: Partial<PassageType>): Promise<PassageType> {
    const { data: newPassage, error } = await supabase
      .from('passages')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return newPassage as PassageType;
  },

  async update(id: string, data: Partial<PassageType>): Promise<PassageType> {
    const { data: updatedPassage, error } = await supabase
      .from('passages')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedPassage as PassageType;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('passages').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getById(id: string): Promise<PassageType> {
    console.log('[Passage.getById] Fetching passage:', id);
    const { data, error } = await supabase.from('passages').select('*').eq('id', id).single();
    if (error) {
      console.error('[Passage.getById] Error:', error);
      throw error;
    }
    console.log('[Passage.getById] Found:', data?.id, data?.title);
    return data as PassageType;
  },

  // Cached version for test pages - passages rarely change (1 hour TTL)
  getByIdCached: withCache(
    async (id: string) => {
      const { data, error } = await supabase.from('passages').select('*').eq('id', id).single();
      if (error) throw error;
      return data as PassageType;
    },
    'passage',
    CACHE_TTL.VERY_LONG
  ),
};

// Export as named export to match import convention in some files if needed,
// but originally it was default or named 'Passage'.
// The original file exported 'export const Passage = ...'
export const Passage = PassageService;
