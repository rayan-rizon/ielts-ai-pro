import { supabase } from '@/lib/supabase';

export interface AchievementType {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    criteria?: any;
    points?: number;
    created_at?: string;
    [key: string]: any;
}

export const Achievement = {
    async list(
        filters: Record<string, any> = {},
        orderBy: string = 'created_at',
        limit: number = 100
    ): Promise<AchievementType[]> {
        let query = supabase.from('achievements').select('*');
        Object.keys(filters).forEach((key) => {
            query = query.eq(key, filters[key]);
        });
        query = query
            .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
            .limit(limit);
        const { data, error } = await query;
        if (error) throw error;
        return (data as AchievementType[]) || [];
    },

    async create(data: Partial<AchievementType>): Promise<AchievementType> {
        const { data: newAchievement, error } = await supabase
            .from('achievements')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return newAchievement as AchievementType;
    },

    async update(id: string, data: Partial<AchievementType>): Promise<AchievementType> {
        const { data: updatedAchievement, error } = await supabase
            .from('achievements')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updatedAchievement as AchievementType;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('achievements').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async getById(id: string): Promise<AchievementType> {
        const { data, error } = await supabase.from('achievements').select('*').eq('id', id).single();
        if (error) throw error;
        return data as AchievementType;
    },
};
