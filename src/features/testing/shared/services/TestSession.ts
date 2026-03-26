import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

interface TestSessionFilters {
    created_by?: string;
    user_id?: string;
    is_completed?: boolean;
    passage_id?: string;
    [key: string]: any;
}

export interface TestSession {
    id: string;
    user_id: string;
    passage_id: string;
    score?: number;
    total_questions?: number;
    correct_answers?: number;
    time_spent?: number;
    is_completed: boolean;
    completed_at?: string;
    created_at?: string;
    answers?: any;
    [key: string]: any;
}

export const TestSession = {
    async getCountsByPassageIds(passageIds: string[]): Promise<Record<string, number>> {
        if (!passageIds || passageIds.length === 0) return {};

        // Efficiently fetch only passage_ids for counting
        const { data, error } = await supabase
            .from('test_sessions')
            .select('passage_id')
            .in('passage_id', passageIds);

        if (error) throw error;

        // Group and count
        const counts: Record<string, number> = {};
        data.forEach((s) => {
            counts[s.passage_id] = (counts[s.passage_id] || 0) + 1;
        });
        return counts;
    },

    /**
     * List test sessions with filters
     * @param filters Filtering options (user_id, is_completed, etc.)
     * @param orderBy Sorting column (can be prefixed with - for DESC)
     * @param limit Maximum results to return
     * @param select Columns to select (default '*')
     */
    async list(
        filters: TestSessionFilters = {},
        orderBy: string = 'created_at',
        limit: number = 100,
        select: string = '*'
    ): Promise<TestSession[]> {
        let query = supabase.from('test_sessions').select(select);

        // Track a potential is_completed filter separately because the column may not exist
        let isCompletedFilter: boolean | null = null;

        Object.keys(filters).forEach((key) => {
            if (key === 'is_completed') {
                isCompletedFilter = filters[key];
                return; // Skip sending to Supabase if column may not exist
            }
            const column = key === 'created_by' ? 'user_id' : key;
            query = query.eq(column, filters[key]);
        });

        query = query
            .order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') })
            .limit(limit);
        const { data, error } = await query;
        if (error) throw error;

        // Derive additional helper fields and legacy aliases
        let sessions: TestSession[] = data.map((row: any) => ({
            ...row,
            created_by: row.user_id,
            // Derive is_completed if column missing based on completed_at timestamp
            is_completed: typeof row.is_completed === 'boolean' ? row.is_completed : !!row.completed_at,
        }));

        // Apply client-side filtering for is_completed if requested
        if (isCompletedFilter !== null) {
            sessions = sessions.filter((s) => !!s.is_completed === !!isCompletedFilter);
        }

        return sessions;
    },

    async create(data: Partial<TestSession> & { created_by?: string }): Promise<TestSession> {
        // Backward compatibility: map created_by -> user_id if provided
        if (data.created_by && !data.user_id) {
            data.user_id = data.created_by;
            delete data.created_by;
        }
        // Auto-attach current authenticated user if user_id still missing
        if (!data.user_id) {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    // Look up public user ID from 'users' table using auth_id
                    const { data: publicUser } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_id', session.user.id)
                        .single();
                    if (publicUser) {
                        data.user_id = publicUser.id;
                    } else {
                        // Fallback: Lazy create public profile
                        try {
                            const { data: newUser, error: createError } = await supabase
                                .from('users')
                                .insert({
                                    auth_id: session.user.id,
                                    email: session.user.email,
                                    full_name: session.user.user_metadata?.full_name || 'User',
                                })
                                .select('id')
                                .single();

                            if (newUser && !createError) {
                                data.user_id = newUser.id;
                            } else {
                                console.warn('Failed to lazy create user profile:', createError);
                                throw createError;
                            }
                        } catch (err) {
                            console.error('Critical: Could not resolve public user ID', err);
                            // Final fallback attempt (likely to fail RLS but worth trying if policy changed)
                            data.user_id = session.user.id;
                        }
                    }
                }
            } catch (authErr) {
                console.warn('Could not retrieve auth session to attach user_id:', authErr);
            }
        }
        const { data: newSession, error } = await supabase
            .from('test_sessions')
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return newSession;
    },

    async update(id: string, data: Partial<TestSession>): Promise<TestSession> {
        const { data: updatedSession, error } = await supabase
            .from('test_sessions')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return updatedSession;
    },

    async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('test_sessions').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async getById(id: string): Promise<TestSession> {
        const { data, error } = await supabase.from('test_sessions').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },
};
