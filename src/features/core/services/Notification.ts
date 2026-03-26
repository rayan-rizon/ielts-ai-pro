import { supabase } from '@/lib/supabase';

interface NotificationType {
    id: string;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    target_audience?: 'all' | 'free' | 'pro' | 'premium';
    expires_at?: string;
    created_at?: string;
    [key: string]: any;
}

export const Notification = {
    // List active notifications for users
    async listActive(userTier: string = 'free'): Promise<NotificationType[]> {
        const now = new Date().toISOString();

        const query = supabase
            .from('notifications')
            .select('*')
            .or(`expires_at.is.null,expires_at.gt.${now}`)
            .order('created_at', { ascending: false });

        // Client-side filtering for target audience might be needed if RLS is too complex,
        // but we can try to filter in query if possible.
        // For now, fetch all active and filter in UI or simple query
        // Simple audience logic: 'all' OR matches userTier

        const { data, error } = await query;
        if (error) {
            if (error.code === '42P01') return [];
            throw error;
        }

        return (data as NotificationType[]).filter(
            (n) => n.target_audience === 'all' || n.target_audience === userTier
        );
    },

    // Admin: List all notifications
    async listAll(): Promise<NotificationType[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as NotificationType[]) || [];
    },

    // Admin: Create notification
    async create(notification: Partial<NotificationType>): Promise<NotificationType> {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data as NotificationType;
    },

    // Admin: Delete notification
    async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('notifications').delete().eq('id', id);

        if (error) throw error;
        return true;
    },
};
