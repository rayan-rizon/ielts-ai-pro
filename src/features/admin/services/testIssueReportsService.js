import { supabase } from '@/lib/supabase';

export const testIssueReportsService = {
  async adminPage({ status = 'open', search = '', offset = 0 } = {}) {
    const { data, error } = await supabase.rpc('admin_test_issue_reports_page', {
      p_status: status,
      p_search: search,
      p_offset: offset,
    });
    if (error) throw error;
    return data;
  },

  async updateStatus(reportId, status, adminNote) {
    const { error } = await supabase.rpc('admin_update_test_issue_report', {
      p_report_id: reportId,
      p_status: status,
      p_admin_note: adminNote || null,
    });
    if (error) throw error;
  },
};
