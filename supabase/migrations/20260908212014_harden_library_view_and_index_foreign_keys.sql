-- Replace the definer-rights catalogue view without exposing protected
-- Reading or Listening source content. The small companion table contains
-- only the values that the browser may read, and a trigger keeps it aligned
-- with public.passages.
set lock_timeout = '2s';
set statement_timeout = '30s';

create table objective_private.library_passage_catalog (
  id uuid primary key references public.passages(id) on delete cascade,
  title text,
  topic text,
  content text,
  audio_url text,
  is_active boolean,
  task_type text,
  test_type text,
  created_at timestamptz,
  transcript text,
  updated_at timestamptz,
  access_tier text,
  test_format text,
  cambridge_year integer,
  question_count integer,
  cambridge_title text,
  total_questions integer,
  duration_minutes integer,
  cambridge_test_number integer,
  is_official_cambridge boolean
);

alter table objective_private.library_passage_catalog enable row level security;
revoke all on objective_private.library_passage_catalog from public, anon, authenticated;
grant usage on schema objective_private to authenticated, service_role;
grant select on objective_private.library_passage_catalog to authenticated, service_role;

create policy library_passage_catalog_read
on objective_private.library_passage_catalog
for select
to authenticated
using ((select auth.uid()) is not null and is_active);

create or replace function objective_private.sync_library_passage_catalog()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from objective_private.library_passage_catalog where id = old.id;
    return old;
  end if;

  insert into objective_private.library_passage_catalog (
    id, title, topic, content, audio_url, is_active, task_type, test_type,
    created_at, transcript, updated_at, access_tier, test_format,
    cambridge_year, question_count, cambridge_title, total_questions,
    duration_minutes, cambridge_test_number, is_official_cambridge
  ) values (
    new.id,
    new.title,
    new.topic,
    case when new.test_type in ('reading', 'listening') then null else new.content end,
    case when new.test_type in ('reading', 'listening') then null else new.audio_url end,
    new.is_active,
    new.task_type,
    new.test_type,
    new.created_at,
    case when new.test_type in ('reading', 'listening') then null else new.transcript end,
    new.updated_at,
    new.access_tier,
    new.test_format,
    new.cambridge_year,
    new.question_count,
    new.cambridge_title,
    new.total_questions,
    new.duration_minutes,
    new.cambridge_test_number,
    new.is_official_cambridge
  )
  on conflict (id) do update set
    title = excluded.title,
    topic = excluded.topic,
    content = excluded.content,
    audio_url = excluded.audio_url,
    is_active = excluded.is_active,
    task_type = excluded.task_type,
    test_type = excluded.test_type,
    created_at = excluded.created_at,
    transcript = excluded.transcript,
    updated_at = excluded.updated_at,
    access_tier = excluded.access_tier,
    test_format = excluded.test_format,
    cambridge_year = excluded.cambridge_year,
    question_count = excluded.question_count,
    cambridge_title = excluded.cambridge_title,
    total_questions = excluded.total_questions,
    duration_minutes = excluded.duration_minutes,
    cambridge_test_number = excluded.cambridge_test_number,
    is_official_cambridge = excluded.is_official_cambridge;

  return new;
end;
$$;

revoke all on function objective_private.sync_library_passage_catalog()
from public, anon, authenticated;

insert into objective_private.library_passage_catalog (
  id, title, topic, content, audio_url, is_active, task_type, test_type,
  created_at, transcript, updated_at, access_tier, test_format,
  cambridge_year, question_count, cambridge_title, total_questions,
  duration_minutes, cambridge_test_number, is_official_cambridge
)
select
  id,
  title,
  topic,
  case when test_type in ('reading', 'listening') then null else content end,
  case when test_type in ('reading', 'listening') then null else audio_url end,
  is_active,
  task_type,
  test_type,
  created_at,
  case when test_type in ('reading', 'listening') then null else transcript end,
  updated_at,
  access_tier,
  test_format,
  cambridge_year,
  question_count,
  cambridge_title,
  total_questions,
  duration_minutes,
  cambridge_test_number,
  is_official_cambridge
from public.passages;

create trigger sync_library_passage_catalog
after insert or update on public.passages
for each row execute function objective_private.sync_library_passage_catalog();

create trigger remove_library_passage_catalog
after delete on public.passages
for each row execute function objective_private.sync_library_passage_catalog();

create or replace view public.library_passages
with (security_invoker = true, security_barrier = true)
as
select
  id, title, topic, content, audio_url, is_active, task_type, test_type,
  created_at, transcript, updated_at, access_tier, test_format,
  cambridge_year, question_count, cambridge_title, total_questions,
  duration_minutes, cambridge_test_number, is_official_cambridge
from public.passages
where public.is_admin()
union all
select
  id, title, topic, content, audio_url, is_active, task_type, test_type,
  created_at, transcript, updated_at, access_tier, test_format,
  cambridge_year, question_count, cambridge_title, total_questions,
  duration_minutes, cambridge_test_number, is_official_cambridge
from objective_private.library_passage_catalog
where not public.is_admin();

revoke all on public.library_passages from public, anon, authenticated;
grant select on public.library_passages to authenticated, service_role;

-- All affected tables are currently under 1.1 MB. Regular transactional
-- indexes keep the migration atomic, while the short lock timeout prevents a
-- busy writer from being held up if production traffic overlaps this change.
create index if not exists attempts_user_id_fkey_idx on objective_private.attempts (user_id);
create index if not exists billing_history_marketing_delivery_id_fkey_idx on public.billing_history (marketing_delivery_id);
create index if not exists grammar_attempts_learning_path_activity_id_fkey_idx on public.grammar_attempts (learning_path_activity_id);
create index if not exists grammar_items_skill_code_fkey_idx on public.grammar_items (skill_code);
create index if not exists grammar_resources_skill_code_fkey_idx on public.grammar_resources (skill_code);
create index if not exists marketing_autopilot_policies_campaign_id_fkey_idx on public.marketing_autopilot_policies (campaign_id);
create index if not exists marketing_autopilot_policies_created_by_fkey_idx on public.marketing_autopilot_policies (created_by);
create index if not exists marketing_autopilot_policies_updated_by_fkey_idx on public.marketing_autopilot_policies (updated_by);
create index if not exists marketing_campaign_templates_created_by_fkey_idx on public.marketing_campaign_templates (created_by);
create index if not exists marketing_campaigns_created_by_fkey_idx on public.marketing_campaigns (created_by);
create index if not exists marketing_campaigns_promo_code_id_fkey_idx on public.marketing_campaigns (promo_code_id);
create index if not exists marketing_campaigns_segment_id_fkey_idx on public.marketing_campaigns (segment_id);
create index if not exists marketing_contact_feedback_delivery_id_fkey_idx on public.marketing_contact_feedback (delivery_id);
create index if not exists marketing_contact_feedback_intervention_id_fkey_idx on public.marketing_contact_feedback (intervention_id);
create index if not exists marketing_events_user_id_fkey_idx on public.marketing_events (user_id);
create index if not exists marketing_experiment_assignments_user_id_fkey_idx on public.marketing_experiment_assignments (user_id);
create index if not exists marketing_experiments_created_by_fkey_idx on public.marketing_experiments (created_by);
create index if not exists marketing_experiments_playbook_key_fkey_idx on public.marketing_experiments (playbook_key);
create index if not exists marketing_interventions_approved_by_fkey_idx on public.marketing_interventions (approved_by);
create index if not exists marketing_interventions_campaign_id_fkey_idx on public.marketing_interventions (campaign_id);
create index if not exists marketing_interventions_context_snapshot_id_fkey_idx on public.marketing_interventions (context_snapshot_id);
create index if not exists marketing_interventions_experiment_id_fkey_idx on public.marketing_interventions (experiment_id);
create index if not exists marketing_interventions_journey_id_fkey_idx on public.marketing_interventions (journey_id);
create index if not exists marketing_journeys_campaign_id_fkey_idx on public.marketing_journeys (campaign_id);
create index if not exists marketing_journeys_created_by_fkey_idx on public.marketing_journeys (created_by);
create index if not exists marketing_journeys_segment_id_fkey_idx on public.marketing_journeys (segment_id);
create index if not exists marketing_push_subscriptions_user_id_fkey_idx on public.marketing_push_subscriptions (user_id);
create index if not exists marketing_segments_created_by_fkey_idx on public.marketing_segments (created_by);
create index if not exists notifications_campaign_id_fkey_idx on public.notifications (campaign_id);
create index if not exists payment_requests_marketing_campaign_id_fkey_idx on public.payment_requests (marketing_campaign_id);
create index if not exists payment_requests_marketing_delivery_id_fkey_idx on public.payment_requests (marketing_delivery_id);
create index if not exists practice_library_exposure_source_id_fkey_idx on public.practice_library_exposure (source_id);
create index if not exists promo_codes_assigned_user_id_fkey_idx on public.promo_codes (assigned_user_id);
create index if not exists promo_codes_marketing_delivery_id_fkey_idx on public.promo_codes (marketing_delivery_id);
create index if not exists skill_lab_sessions_activity_id_fkey_idx on public.skill_lab_sessions (activity_id);
create index if not exists skill_lab_sessions_source_id_fkey_idx on public.skill_lab_sessions (source_id);
create index if not exists speaking_session_state_passage_id_fkey_idx on public.speaking_session_state (passage_id);
create index if not exists speaking_session_state_processing_turn_fkey_idx on public.speaking_session_state (processing_turn_id);
create index if not exists speaking_session_state_user_id_fkey_idx on public.speaking_session_state (user_id);
create index if not exists speaking_testing_override_sessions_override_id_fkey_idx on public.speaking_testing_override_sessions (override_id);
create index if not exists speaking_testing_overrides_created_by_fkey_idx on public.speaking_testing_overrides (created_by);
create index if not exists speaking_testing_overrides_user_id_fkey_idx on public.speaking_testing_overrides (user_id);
create index if not exists speaking_turns_question_id_fkey_idx on public.speaking_turns (question_id);
create index if not exists library_groups_source_id_fkey_idx on skill_lab_private.library_groups (source_id);
create index if not exists library_sessions_activity_id_fkey_idx on skill_lab_private.library_sessions (activity_id);
create index if not exists library_sessions_source_id_fkey_idx on skill_lab_private.library_sessions (source_id);
create index if not exists library_sessions_source_session_id_fkey_idx on skill_lab_private.library_sessions (source_session_id);
create index if not exists operations_library_session_id_fkey_idx on skill_lab_private.operations (library_session_id);
create index if not exists operations_session_id_fkey_idx on skill_lab_private.operations (session_id);

reset lock_timeout;
reset statement_timeout;
