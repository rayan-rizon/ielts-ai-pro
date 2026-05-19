import { supabase } from '@/lib/supabase';
// @ts-ignore
import { withCache, CACHE_TTL } from '@/lib/apiCache';
import { Question as QuestionType } from '@/types';

export const Question = {
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'created_at',
    limit: number = 10000
  ): Promise<QuestionType[]> {
    console.log('[Question.list] Filters:', filters, 'OrderBy:', orderBy);
    let query = supabase.from('questions').select('*');
    Object.keys(filters).forEach((key) => {
      query = query.eq(key, filters[key]);
    });
    query = query
      .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
      .limit(limit);
    const { data, error } = await query;
    if (error) {
      console.error('[Question.list] Error:', error);
      throw error;
    }
    console.log('[Question.list] Returned:', data?.length, 'questions');
    return (data as QuestionType[]) || [];
  },

  async listByPassageIds(passageIds: string[]): Promise<QuestionType[]> {
    if (!passageIds || passageIds.length === 0) return [];
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .in('passage_id', passageIds);
    if (error) throw error;
    return (data as QuestionType[]) || [];
  },

  async create(data: Partial<QuestionType>): Promise<QuestionType> {
    const { data: newQuestion, error } = await supabase
      .from('questions')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return newQuestion as QuestionType;
  },

  async bulkCreate(items: Partial<QuestionType>[]): Promise<QuestionType[]> {
    if (!Array.isArray(items) || items.length === 0) return [];

    console.log('[Question.bulkCreate] Input items:', items.length);

    // Known columns that should NEVER be stripped (even if PostgREST schema cache is stale)
    const PROTECTED_COLUMNS = [
      'gap_fill',
      'table_data',
      'flowchart',
      'map_labeling',
      'matching_features',
      'static_text',
      'question_number',
      'mcq_title',
      'group_instructions',
      'explanation_data',
    ];

    // Create a working payload we can mutate if we need to drop missing columns
    let payload = items.map((i) => ({ ...i }));

    // Helper to remove a missing column from all items
    const dropColumnFromAll = (col: string) => {
      if (PROTECTED_COLUMNS.includes(col)) {
        console.warn(
          `[Question.bulkCreate] Refusing to drop protected column "${col}" - schema cache may be stale`
        );
        return false; // Signal that we couldn't drop this column
      }
      console.warn(`[Question.bulkCreate] Dropping column "${col}" from all items`);
      // @ts-ignore
      payload = payload.map(({ [col]: _omit, ...rest }) => rest);
      return true;
    };

    // Try insert with retry logic for unknown columns (but not protected ones)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      const { data, error } = await supabase.from('questions').insert(payload).select();

      if (!error) {
        console.log('[Question.bulkCreate] Success, inserted:', data?.length);
        return (data as QuestionType[]) || [];
      }

      console.error('[Question.bulkCreate] Attempt', attempts, 'Error:', error);

      // If error indicates an unknown column, try to strip it (unless protected)
      if (
        error.code === 'PGRST204' ||
        (error.message &&
          error.message.includes('column') &&
          error.message.includes('does not exist'))
      ) {
        const match = error.message?.match(/"([^"]+)"/);
        const match2 = error.message?.match(/'([^']+)' column/);
        const match3 = error.message?.match(/the '([^']+)' column/);
        const colToRemove = match?.[1] || match2?.[1] || match3?.[1];

        if (colToRemove) {
          const wasDropped = dropColumnFromAll(colToRemove);
          if (wasDropped) {
            continue; // Retry with column dropped
          } else {
            // Protected column can't be dropped, throw error with helpful message
            throw new Error(
              `Database schema cache is stale. Column "${colToRemove}" exists but PostgREST doesn't recognize it. Please reload the Supabase schema cache or restart the Supabase services.`
            );
          }
        }
      }

      // Other error - throw it
      throw error;
    }

    throw new Error('Max retry attempts reached in bulkCreate');
  },

  async bulkUpsert(items: Partial<QuestionType>[]): Promise<QuestionType[]> {
    if (!Array.isArray(items) || items.length === 0) return [];

    console.log('[Question.bulkUpsert] Input items:', items.length);

    // Known columns that should NEVER be stripped (even if PostgREST schema cache is stale)
    const PROTECTED_COLUMNS = [
      'gap_fill',
      'table_data',
      'flowchart',
      'map_labeling',
      'matching_features',
      'static_text',
      'question_number',
      'mcq_title',
      'group_instructions',
      'explanation_data',
    ];

    // Create a working payload we can mutate if we need to drop missing columns
    let payload = items.map((i) => ({ ...i }));

    // Helper to remove a missing column from all items
    const dropColumnFromAll = (col: string) => {
      if (PROTECTED_COLUMNS.includes(col)) {
        console.warn(
          `[Question.bulkUpsert] Refusing to drop protected column "${col}" - schema cache may be stale`
        );
        return false;
      }
      console.warn(`[Question.bulkUpsert] Dropping column "${col}" from all items`);
      // @ts-ignore
      payload = payload.map(({ [col]: _omit, ...rest }) => rest);
      return true;
    };

    // Try upsert with retry logic for unknown columns (but not protected ones)
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      attempts++;
      const { data, error } = await supabase.from('questions').upsert(payload).select();

      if (!error) {
        console.log('[Question.bulkUpsert] Success, upserted:', data?.length);
        return (data as QuestionType[]) || [];
      }

      console.error('[Question.bulkUpsert] Attempt', attempts, 'Error:', error);

      // If error indicates an unknown column, try to strip it (unless protected)
      if (
        error.code === 'PGRST204' ||
        (error.message &&
          error.message.includes('column') &&
          error.message.includes('does not exist'))
      ) {
        const match = error.message?.match(/"([^"]+)"/);
        const match2 = error.message?.match(/'([^']+)' column/);
        const match3 = error.message?.match(/the '([^']+)' column/);
        const colToRemove = match?.[1] || match2?.[1] || match3?.[1];

        if (colToRemove) {
          const wasDropped = dropColumnFromAll(colToRemove);
          if (wasDropped) {
            continue;
          } else {
            throw new Error(
              `Database schema cache is stale. Column "${colToRemove}" exists but PostgREST doesn't recognize it. Please reload the Supabase schema cache.`
            );
          }
        }
      }

      throw error;
    }

    throw new Error('Max retry attempts reached in bulkUpsert');
  },

  async update(id: string, data: Partial<QuestionType>): Promise<QuestionType> {
    const { data: updatedQuestion, error } = await supabase
      .from('questions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedQuestion as QuestionType;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async bulkDelete(ids: string[]): Promise<boolean> {
    if (!Array.isArray(ids) || ids.length === 0) return true;

    console.log('[Question.bulkDelete] Deleting:', ids.length, 'questions');
    const { error } = await supabase.from('questions').delete().in('id', ids);
    if (error) {
      console.error('[Question.bulkDelete] Error:', error);
      throw error;
    }
    console.log('[Question.bulkDelete] Success');
    return true;
  },

  async getById(id: string): Promise<QuestionType> {
    const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
    if (error) throw error;
    return data as QuestionType;
  },

  // Cached version for test pages - questions rarely change (1 hour TTL)
  listByPassageIdCached: withCache(
    async (passageId: string) => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('passage_id', passageId)
        .order('question_number', { ascending: true });
      if (error) throw error;
      return (data as QuestionType[]) || [];
    },
    'questions',
    CACHE_TTL.VERY_LONG
  ),
};
