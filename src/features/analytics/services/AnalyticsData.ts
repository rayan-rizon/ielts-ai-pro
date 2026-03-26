import { supabase } from '@/lib/supabase';

interface AnalyticsRecord {
    id: string;
    user_id: string;
    event_name: string;
    event_data?: any;
    recorded_at?: string;
    [key: string]: any;
}

export const AnalyticsData = {
    async list(
        filters: Record<string, any> = {},
        orderBy: string = 'recorded_at',
        limit: number = 100
    ): Promise<AnalyticsRecord[]> {
        let query = supabase.from('analytics_data').select('*');
        Object.keys(filters).forEach((key) => {
            query = query.eq(key, filters[key]);
        });
        query = query
            .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
            .limit(limit);
        const { data, error } = await query;
        if (error) throw error;
        return (data as AnalyticsRecord[]) || [];
    },

    async create(data: Partial<AnalyticsRecord>): Promise<AnalyticsRecord> {
        const { data: newData, error } = await supabase
            .from('analytics_data')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return newData as AnalyticsRecord;
    },

    async update(id: string, data: Partial<AnalyticsRecord>): Promise<AnalyticsRecord> {
        const { data: updatedData, error } = await supabase
            .from('analytics_data')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updatedData as AnalyticsRecord;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('analytics_data').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async getById(id: string): Promise<AnalyticsRecord> {
        const { data, error } = await supabase.from('analytics_data').select('*').eq('id', id).single();
        if (error) throw error;
        return data as AnalyticsRecord;
    },
};
