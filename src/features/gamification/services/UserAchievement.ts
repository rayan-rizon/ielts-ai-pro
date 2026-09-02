import { supabase } from '@/lib/supabase';

export interface UserAchievementType {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at?: string;
  [key: string]: any;
}

export const UserAchievement = {
  async list(
    filters: Record<string, any> = {},
    orderBy: string = 'unlocked_at',
    limit: number = 100
  ): Promise<UserAchievementType[]> {
    let query = supabase.from('user_achievements').select('*');
    Object.keys(filters).forEach((key) => {
      query = query.eq(key, filters[key]);
    });
    query = query
      .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
      .limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data as UserAchievementType[]) || [];
  },

  async create(data: Partial<UserAchievementType>): Promise<UserAchievementType> {
    const { data: newUserAchievement, error } = await supabase
      .from('user_achievements')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return newUserAchievement as UserAchievementType;
  },

  async update(id: string, data: Partial<UserAchievementType>): Promise<UserAchievementType> {
    const { data: updatedUserAchievement, error } = await supabase
      .from('user_achievements')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updatedUserAchievement as UserAchievementType;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('user_achievements').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getById(id: string): Promise<UserAchievementType> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as UserAchievementType;
  },
};
