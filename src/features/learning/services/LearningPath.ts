import { supabase } from '@/lib/supabase';

export interface LearningPathType {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export const LearningPath = {
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'created_at',
    limit: number = 100
  ): Promise<LearningPathType[]> {
    let query = supabase.from('learning_paths').select('*');
    Object.keys(filters).forEach((key) => {
      query = query.eq(key, filters[key]);
    });
    query = query
      .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
      .limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data as LearningPathType[]) || [];
  },

  async create(data: Partial<LearningPathType>): Promise<LearningPathType> {
    const { data: newPath, error } = await supabase
      .from('learning_paths')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return newPath as LearningPathType;
  },

  async update(id: string, data: Partial<LearningPathType>): Promise<LearningPathType> {
    const { data: updatedPath, error } = await supabase
      .from('learning_paths')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedPath as LearningPathType;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('learning_paths').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getById(id: string): Promise<LearningPathType> {
    const { data, error } = await supabase.from('learning_paths').select('*').eq('id', id).single();
    if (error) throw error;
    return data as LearningPathType;
  },
};
