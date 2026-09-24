import { supabase } from '@/lib/supabase';

export const testIssueReportsService = {
  async submit({
    testType,
    issueType,
    description,
    testId,
    testTitle,
    sectionLabel,
    questionReference,
    testMode,
  }) {
    const { data, error } = await supabase.rpc('submit_test_issue_report', {
      p_test_type: testType,
      p_issue_type: issueType,
      p_description: description,
      p_test_id: testId || null,
      p_test_title: testTitle || null,
      p_section_label: sectionLabel || null,
      p_question_reference: questionReference || null,
      p_test_mode: testMode || null,
    });
    if (error) throw error;
    return data;
  },
};
