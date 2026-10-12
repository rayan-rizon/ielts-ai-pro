-- Late background results may only update the session generation that submitted them.
create index if not exists idx_writing_jobs_reservation on ai_work.writing_jobs(reservation_id);

create or replace function public.finish_writing_feedback(p_job_id uuid,p_slot_token uuid,p_status integer,p_response jsonb,p_retry boolean default false)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_job ai_work.writing_jobs; v_retry boolean;
begin
  select * into v_job from ai_work.writing_jobs where id=p_job_id and lease_token=p_slot_token and state='processing' for update;
  if v_job.id is null then return false; end if;
  v_retry:=p_retry and v_job.attempts<3;
  update ai_work.writing_jobs set state=case when v_retry then 'queued' when p_status=200 and p_response->>'success'='true' then 'completed' else 'failed' end,
    response=case when v_retry then null else p_response end,response_status=case when v_retry then null else p_status end,
    payload=case when v_retry then payload else '{}'::jsonb end,lease_token=null,lease_until=null,updated_at=now() where id=p_job_id;
  if p_status=200 and p_response->>'success'='true' and v_job.payload->>'sessionId' is not null then
    -- Save each completed part even if the browser has disconnected. Final
    -- weighted scores and XP remain owned by the existing completion flow.
    update public.test_sessions ts set content_data=jsonb_set(coalesce(ts.content_data,'{}'),'{ai_feedbacks}',
      coalesce(ts.content_data->'ai_feedbacks','{}') || jsonb_build_object(v_job.payload->>'taskType',p_response->'data')),
      updated_at=now()
    where ts.id=(v_job.payload->>'sessionId')::uuid and ts.user_id=(select id from public.users where auth_id=v_job.auth_id)
      and ts.test_type='writing' and ts.evaluation_status='pending'
      and ts.content_data->>'evaluationRequestedAt'=v_job.payload->>'evaluationRequestedAt';
  end if;
  if v_retry then
    perform pgmq.set_vt('writing_feedback',v_job.message_id,least(60,5*v_job.attempts));
  else
    perform pgmq.delete('writing_feedback',v_job.message_id);
  end if;
  update ai_work.worker_slots set token=null,expires_at=null where token=p_slot_token;
  return true;
end $$;
