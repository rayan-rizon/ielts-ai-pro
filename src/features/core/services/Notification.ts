import { supabase } from '@/lib/supabase';
import { isNotificationVisible, notificationState } from '@/lib/communications';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'announcement';
  target_audience?: 'all' | 'free' | 'pro' | 'premium';
  priority?: 'low' | 'normal' | 'high';
  link_url?: string | null;
  link_label?: string | null;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  created_at?: string;
  [key: string]: any;
}

export interface LearnerNotification extends NotificationRecord {
  read_at: string | null;
  dismissed_at: string | null;
  is_unread: boolean;
}

const TABLE = 'notifications';
const READS_TABLE = 'notification_reads';

/** A missing table (pre-migration database) must not take the app down. */
const isMissingTable = (error: any) => error?.code === '42P01';

export const Notification = {
  /**
   * Broadcasts this learner should see, with their own read/dismiss state
   * attached. RLS already filters by audience and schedule; the client-side
   * pass keeps behaviour correct against a database where the delivery policy
   * has not been applied yet.
   */
  async listForUser(userId?: string | null, tier: string = 'free'): Promise<LearnerNotification[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }

    const visible = ((data || []) as NotificationRecord[]).filter((notification) =>
      isNotificationVisible(notification, { tier })
    );

    if (!visible.length || !userId) {
      return visible.map((notification) => ({
        ...notification,
        read_at: null,
        dismissed_at: null,
        is_unread: true,
      }));
    }

    const reads = await Notification.readStateFor(
      userId,
      visible.map((notification) => notification.id)
    );

    return visible
      .map((notification) => {
        const state = reads.get(notification.id);
        return {
          ...notification,
          read_at: state?.read_at ?? null,
          dismissed_at: state?.dismissed_at ?? null,
          is_unread: !state?.read_at,
        };
      })
      .filter((notification) => !notification.dismissed_at);
  },

  async readStateFor(
    userId: string,
    notificationIds: string[]
  ): Promise<Map<string, { read_at: string | null; dismissed_at: string | null }>> {
    const state = new Map<string, { read_at: string | null; dismissed_at: string | null }>();
    if (!notificationIds.length) return state;

    const { data, error } = await supabase
      .from(READS_TABLE)
      .select('notification_id, read_at, dismissed_at')
      .eq('user_id', userId)
      .in('notification_id', notificationIds);

    if (error) {
      // Pre-migration database: treat everything as unread rather than failing
      // the whole notification panel.
      if (isMissingTable(error)) return state;
      throw error;
    }

    (data || []).forEach((row: any) => {
      state.set(row.notification_id, { read_at: row.read_at, dismissed_at: row.dismissed_at });
    });
    return state;
  },

  async markRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(READS_TABLE)
      .upsert(
        { notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() },
        { onConflict: 'notification_id,user_id' }
      );
    if (error && !isMissingTable(error)) throw error;
  },

  async markAllRead(notificationIds: string[], userId: string): Promise<void> {
    if (!notificationIds.length) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from(READS_TABLE).upsert(
      notificationIds.map((notification_id) => ({
        notification_id,
        user_id: userId,
        read_at: readAt,
      })),
      { onConflict: 'notification_id,user_id' }
    );
    if (error && !isMissingTable(error)) throw error;
  },

  /** Hides one broadcast for this learner only. */
  async dismiss(notificationId: string, userId: string): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from(READS_TABLE)
      .upsert(
        { notification_id: notificationId, user_id: userId, read_at: now, dismissed_at: now },
        { onConflict: 'notification_id,user_id' }
      );
    if (error && !isMissingTable(error)) throw error;
  },

  // --- Admin ---------------------------------------------------------------

  /** Every broadcast, live or not, newest first. */
  async listAll(): Promise<NotificationRecord[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data as NotificationRecord[]) || [];
  },

  /**
   * How many learners have opened each broadcast — the only honest measure of
   * whether a send actually landed.
   */
  async readCounts(): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const { data, error } = await supabase
      .from(READS_TABLE)
      .select('notification_id')
      .not('read_at', 'is', null);

    if (error) {
      if (isMissingTable(error)) return counts;
      throw error;
    }

    (data || []).forEach((row: any) => {
      counts.set(row.notification_id, (counts.get(row.notification_id) || 0) + 1);
    });
    return counts;
  },

  async create(notification: Partial<NotificationRecord>): Promise<NotificationRecord> {
    const { data, error } = await supabase.from(TABLE).insert(notification).select().single();
    if (error) throw error;
    return data as NotificationRecord;
  },

  async update(id: string, patch: Partial<NotificationRecord>): Promise<NotificationRecord> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as NotificationRecord;
  },

  /** Pause/resume without losing the record or its read history. */
  async setActive(id: string, isActive: boolean): Promise<NotificationRecord> {
    return Notification.update(id, { is_active: isActive });
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  state: notificationState,
};
