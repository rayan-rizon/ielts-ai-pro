import { supabase } from '@/lib/supabase';

async function call(name, params, options) {
  const { data, error } = await supabase.rpc(name, params, options);
  if (error) throw error;
  return data;
}

export const featureRequestService = {
  learnerPage: ({ scope = 'board', sort = 'top', search = '', offset = 0 } = {}) =>
    // Institution access can reconcile seats; this lookup requires POST.
    call('feature_request_page', {
      p_scope: scope,
      p_sort: sort,
      p_search: search,
      p_offset: offset,
    }),
  submit: (title, description, category) =>
    call('submit_feature_request', {
      p_title: title,
      p_description: description,
      p_category: category,
    }),
  toggleVote: (id) => call('toggle_feature_request_vote', { p_request_id: id }),
  adminPage: ({ status = 'all', search = '', offset = 0 } = {}) =>
    call(
      'admin_feature_request_page',
      {
        p_status: status,
        p_search: search,
        p_offset: offset,
      },
      { get: true }
    ),
  updateStatus: (id, status, note) =>
    call('admin_update_feature_request', {
      p_request_id: id,
      p_status: status,
      p_note: note,
    }),
};

export const REQUEST_STATUS = {
  pending: { label: 'Pending review', tone: 'amber' },
  approved: { label: 'Open for votes', tone: 'sky' },
  planned: { label: 'Planned', tone: 'accent' },
  in_progress: { label: 'In progress', tone: 'warn' },
  completed: { label: 'Completed', tone: 'ok' },
  declined: { label: 'Not planned', tone: 'neutral' },
};

export const FEATURE_AREAS = {
  reading: { label: 'Reading', tone: 'sky' },
  writing: { label: 'Writing', tone: 'amber' },
  listening: { label: 'Listening', tone: 'accent' },
  speaking: { label: 'Speaking', tone: 'rose' },
  other: { label: 'Other', tone: 'neutral' },
};

export function requestError(error) {
  if (error?.code === '23505') return 'You already submitted an idea with this title.';
  if (error?.message?.includes('allowance reached')) return 'You have used your request allowance.';
  if (error?.code === '22023' || error?.code === 'P0002') return error.message;
  return 'Could not save your change. Please try again.';
}
