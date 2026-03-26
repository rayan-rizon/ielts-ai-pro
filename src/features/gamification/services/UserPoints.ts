import { supabase } from '@/lib/supabase';

export interface UserPointsType {
    id: string;
    user_id: string;
    points: number;
    current_streak?: number;
    longest_streak?: number;
    last_activity_date?: string | null;
    updated_at?: string;
    created_at?: string;
    [key: string]: any;
}

export const UserPoints = {
    async list(
        filters: Record<string, any> = {},
        orderBy: string = 'updated_at',
        limit: number = 100
    ): Promise<UserPointsType[]> {
        let query = supabase.from('user_points').select('*');
        Object.keys(filters).forEach((key) => {
            query = query.eq(key, filters[key]);
        });
        query = query
            .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
            .limit(limit);
        const { data, error } = await query;
        if (error) throw error;
        return (data as UserPointsType[]) || [];
    },

    async getLeaderboard(
        from: number = 0,
        to: number = 24,
        timeFilter: string = 'all_time'
    ): Promise<{ data: any[], count: number | null }> {
        // Use the safe public RPC to get leaderboard data
        const { data, error } = await supabase.rpc('get_leaderboard', {
            limit_count: to - from + 1,
            offset_count: from,
            time_filter: timeFilter
        });

        if (error) throw error;

        // Map flat RPC result to the expected format for the frontend
        const formattedData = (data || []).map((row: any, index: number) => ({
            user_id: row.is_me ? 'current_user' : `rank_${from + index}`,
            is_me: row.is_me,
            points: row.points,
            current_streak: row.current_streak,
            users: {
                full_name: row.full_name,
                avatar_url: row.avatar_url,
                country: row.country || 'Global'
            },
            real_avg_score: row.real_avg_score || 0,
        }));

        // Use estimated count for performance — avoids full table scan on every call
        const { count } = await supabase.from('user_points').select('*', { count: 'estimated', head: true });

        return { data: formattedData, count: count };
    },

    async create(data: Partial<UserPointsType>): Promise<UserPointsType> {
        const { data: newPoints, error } = await supabase
            .from('user_points')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return newPoints as UserPointsType;
    },

    async update(id: string, data: Partial<UserPointsType>): Promise<UserPointsType> {
        const { data: updatedPoints, error } = await supabase
            .from('user_points')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updatedPoints as UserPointsType;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('user_points').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async getById(id: string): Promise<UserPointsType> {
        const { data, error } = await supabase.from('user_points').select('*').eq('id', id).single();
        if (error) throw error;
        return data as UserPointsType;
    },

    async getByUserId(userId: string): Promise<UserPointsType | null> {
        const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found, return null
                return null;
            }
            throw error;
        }
        return data as UserPointsType;
    },

    // Get or create user points record
    async getOrCreate(userId: string): Promise<UserPointsType> {
        let record = await this.getByUserId(userId);
        if (!record) {
            record = await this.create({
                user_id: userId,
                points: 0,
                current_streak: 0,
                longest_streak: 0,
                last_activity_date: null,
            });
        }
        return record;
    },

    // Add points to a user's account (atomic via RPC)
    // Note: userId is still accepted for getOrCreate/fallback, but the RPC
    // derives the user from auth.uid() server-side (no client-supplied ID)
    async addPoints(userId: string, points: number, reason: string = 'test_completion'): Promise<UserPointsType> {
        // Ensure the record exists before calling RPC
        const record = await this.getOrCreate(userId);

        const { error: rpcError } = await supabase.rpc('add_user_points', {
            p_points: points,
        });

        if (rpcError) {
            console.error('Failed to add points via RPC:', rpcError);
            return record;
        }

        // Fetch the updated record to return fresh data
        const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error('Failed to fetch updated points:', error);
            return { ...record, points: (record.points || 0) + points };
        }
        return data as UserPointsType;
    },

    // Update user's streak (atomic via RPC)
    // Note: userId is still accepted for getOrCreate/fallback, but the RPC
    // derives the user from auth.uid() server-side (no client-supplied ID)
    async updateStreak(userId: string): Promise<UserPointsType> {
        // Ensure the record exists before calling RPC
        const record = await this.getOrCreate(userId);

        const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_streak');

        if (rpcError) {
            console.error('Failed to update streak via RPC:', rpcError);
            return record;
        }

        // Fetch the updated record to return fresh data
        const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error('Failed to fetch updated streak:', error);
            return record;
        }
        return data as UserPointsType;
    },

    // Calculate XP for a test
    calculateTestXP(correctAnswers: number, totalQuestions: number): number {
        const baseXP = 100;
        const perCorrectXP = 20;
        const perfectBonusXP = 250;

        let xp = baseXP + correctAnswers * perCorrectXP;

        if (correctAnswers === totalQuestions && totalQuestions > 0) {
            xp += perfectBonusXP;
        }

        return xp;
    },
};
