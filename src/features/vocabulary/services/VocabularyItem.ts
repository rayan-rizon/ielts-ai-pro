import { supabase } from '@/lib/supabase';

interface VocabularyItemType {
  id: string;
  word: string;
  definition: string;
  example?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  created_by?: string;
  source?: string;
  mastery_level?: number;
  [key: string]: any;
}

interface ListResult {
  data: VocabularyItemType[];
  count: number;
}

export const VocabularyItem = {
  /**
   * List vocabulary items with optional pagination
   * @param filters - Filter criteria
   * @param orderBy - Order by column (prefix with - for descending)
   * @param limit - Max items to return (ignored if page is provided)
   * @param page - Page number for pagination (1-indexed)
   * @param pageSize - Items per page (default 30)
   * @returns Items or paginated result
   */
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'created_at',
    limit: number = 100,
    page: number | null = null,
    pageSize: number = 30,
    selectFields: string = '*'
  ): Promise<VocabularyItemType[] | ListResult> {
    let query = supabase
      .from('vocabulary_items')
      .select(selectFields, { count: page !== null ? 'exact' : undefined });

    // Apply filters
    Object.keys(filters).forEach((key) => {
      // Map created_by to user_id or vice versa if one is missing but the other exists in filters
      // But generally, we want to filter by exactly what's provided.
      query = query.eq(key, filters[key]);
    });

    // Apply ordering
    query = query.order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') });

    // Apply pagination or limit
    if (page !== null) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    } else {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Normalize user identifiers for backward compatibility
    let results: VocabularyItemType[] = (data || []).map((row: any) => ({
      ...row,
      user_id: row.user_id ?? row.created_by,
      created_by: row.created_by ?? row.user_id,
    }));

    // Return paginated format if page was requested
    if (page !== null) {
      return { data: results, count: count || 0 };
    }

    return results;
  },

  /**
   * Get total count of vocabulary items matching filters
   * @param filters - Filter criteria
   * @returns Total count
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    let query = supabase.from('vocabulary_items').select('*', { count: 'exact', head: true });

    // Apply filters
    Object.keys(filters).forEach((key) => {
      query = query.eq(key, filters[key]);
    });

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async create(data: Partial<VocabularyItemType>): Promise<VocabularyItemType> {
    const { data: newItem, error } = await supabase
      .from('vocabulary_items')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return newItem as VocabularyItemType;
  },

  async update(id: string, data: Partial<VocabularyItemType>): Promise<VocabularyItemType> {
    const { data: updatedItem, error } = await supabase
      .from('vocabulary_items')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedItem as VocabularyItemType;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('vocabulary_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getById(id: string): Promise<VocabularyItemType> {
    const { data, error } = await supabase
      .from('vocabulary_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as VocabularyItemType;
  },
};
