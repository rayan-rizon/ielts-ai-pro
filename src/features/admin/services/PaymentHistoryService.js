import { supabase } from '@/lib/supabase';

export const PaymentHistoryService = {
  async manualPage({ status = 'all', search = '', cursor = null } = {}) {
    const { data, error } = await supabase.rpc(
      'admin_payment_requests_page',
      {
        p_status: status,
        p_search: search,
        ...(cursor ? { p_before_date: cursor.date, p_before_id: cursor.id } : {}),
      },
      { get: true }
    );
    if (error) throw error;
    const all = data?.entries || [];
    const entries = all.slice(0, 50);
    const last = entries[entries.length - 1];
    return { entries, cursor: all.length > 50 ? { date: last.created_at, id: last.id } : null };
  },
  async stripePage(cursor) {
    const { data, error } = await supabase.functions.invoke('admin-payment-history', {
      body: { limit: 50, ...(cursor === undefined ? {} : { cursor }) },
    });
    if (error) throw error;
    return data;
  },
};
