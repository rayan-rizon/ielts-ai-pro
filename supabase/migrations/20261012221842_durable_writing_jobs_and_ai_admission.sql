create schema if not exists ai_work;
revoke all on schema ai_work from public,anon,authenticated;
create extension if not exists pgmq;
select pgmq.create('writing_feedback');
-- Queues are worker-only. No Data API exposure or browser queue consumers.
alter table pgmq.q_writing_feedback enable row level security;
alter table pgmq.a_writing_feedback enable row level security;
revoke all on pgmq.q_writing_feedback,pgmq.a_writing_feedback from public,anon,authenticated;

create table ai_work.burst_windows (
  key text primary key, used integer not null, expires_at timestamptz not null
);
create index on ai_work.burst_windows(expires_at);
create table ai_work.text_leases (
  id uuid primary key default gen_random_uuid(), key text not null, expires_at timestamptz not null
);
create index on ai_work.text_leases(expires_at);
create table ai_work.writing_jobs (
  id uuid primary key default gen_random_uuid(), auth_id uuid not null references auth.users(id) on delete cascade,
  input_hash text not null, reservation_id uuid not null references public.ai_api_usage(id) on delete cascade,
  payload jsonb not null, state text not null default 'queued' check(state in('queued','processing','completed','failed')),
  attempts integer not null default 0, lease_token uuid, lease_until timestamptz,
  message_id bigint, response jsonb, response_status integer,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(auth_id,input_hash)
);
create index on ai_work.writing_jobs(state,lease_until);
create index on ai_work.writing_jobs(updated_at) where state in('completed','failed');
create table ai_work.worker_slots (
  id smallint primary key check(id between 1 and 2), token uuid, expires_at timestamptz
);
insert into ai_work.worker_slots(id) values(1),(2);
alter table ai_work.burst_windows enable row level security;
alter table ai_work.text_leases enable row level security;
alter table ai_work.writing_jobs enable row level security;
alter table ai_work.worker_slots enable row level security;
revoke all on all tables in schema ai_work from public,anon,authenticated;

create index if not exists idx_ai_usage_idempotency
on public.ai_api_usage(user_id,endpoint,(request_metadata->>'idempotencyKey'),created_at desc)
where request_metadata->>'idempotencyKey' is not null;

create or replace function public.check_shared_ai_burst(p_key text,p_max integer,p_window_ms integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_now timestamptz:=clock_timestamp(); v_window ai_work.burst_windows;
begin
  if length(p_key)>200 or p_key is null or p_max not between 1 and 1000 or p_window_ms not between 1000 and 3600000 then
    raise exception 'Invalid burst parameters';
  end if;
  insert into ai_work.burst_windows as b(key,used,expires_at)
  values(p_key,1,v_now + p_window_ms * interval '1 millisecond')
  on conflict(key) do update set
    used=case when b.expires_at<=v_now then 1 else least(b.used+1,p_max+1) end,
    expires_at=case when b.expires_at<=v_now then v_now+p_window_ms*interval '1 millisecond' else b.expires_at end
  returning * into v_window;
  return jsonb_build_object('allowed',v_window.used<=p_max,'remaining',greatest(p_max-v_window.used,0),
    'resetIn',greatest(1,ceil(extract(epoch from(v_window.expires_at-v_now))*1000)));
end $$;

create or replace function public.acquire_text_ai_lease(p_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if p_key is null or length(p_key)>200 then raise exception 'Invalid lease key'; end if;
  perform pg_advisory_xact_lock(hashtextextended('text-ai-admission',0));
  delete from ai_work.text_leases where expires_at<=clock_timestamp();
  if (select count(*) from ai_work.text_leases)>=8
     or (p_key like 'writing:%' and (select count(*) from ai_work.text_leases where key like 'writing:%') + (select count(*) from ai_work.writing_jobs where state='processing' and lease_until>clock_timestamp())>=2)
     or (select count(*) from ai_work.text_leases where key=p_key)>=2 then
    return jsonb_build_object('allowed',false,'retryAfterSeconds',3);
  end if;
  insert into ai_work.text_leases(key,expires_at) values(p_key,clock_timestamp()+interval '180 seconds') returning id into v_id;
  return jsonb_build_object('allowed',true,'leaseId',v_id);
end $$;
create or replace function public.release_text_ai_lease(p_lease uuid)
returns void language sql security definer set search_path='' as $$
  delete from ai_work.text_leases where id=p_lease;
$$;

do $$ begin
  if not exists(select 1 from vault.secrets where name='writing_worker_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'writing_worker_secret');
  end if;
end $$;
create or replace function public.verify_writing_worker(p_token text)
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(length(p_token)=64 and p_token=(select decrypted_secret from vault.decrypted_secrets where name='writing_worker_secret'),false);
$$;

create or replace function public.enqueue_writing_feedback(p_auth_id uuid,p_input_hash text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_job ai_work.writing_jobs; v_quota record; v_usage jsonb; v_message bigint;
begin
  if p_input_hash !~ '^[0-9a-f]{64}$' or p_auth_id is null or octet_length(p_payload::text)>16000 then
    raise exception 'Invalid Writing job';
  end if;
  if p_payload->>'sessionId' is not null and not exists(
    select 1 from public.test_sessions ts join public.users u on u.id=ts.user_id
    where ts.id=(p_payload->>'sessionId')::uuid and u.auth_id=p_auth_id and ts.test_type='writing'
  ) then raise exception 'Writing session unavailable' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('writing-job:'||p_auth_id::text||':'||p_input_hash,0));
  select * into v_job from ai_work.writing_jobs where auth_id=p_auth_id and input_hash=p_input_hash for update;
  if found and v_job.state in('queued','processing','completed') then
    return jsonb_build_object('allowed',true,'jobId',v_job.id,'state',v_job.state,
      'retainedImageUrl',v_job.payload->>'imageUrl','response',v_job.response);
  end if;
  if (select count(*) from ai_work.writing_jobs where state in('queued','processing'))>=100 then
    return jsonb_build_object('allowed',false,'capacity',true,'retryAfterSeconds',10);
  end if;
  select * into v_quota from public.reserve_ai_api_usage(p_auth_id,'generateDetailedFeedback','writing',
    'writing-feedback:'||p_input_hash,jsonb_build_object('taskType',p_payload->>'taskType','inputHash',p_input_hash));
  if not v_quota.allowed then return to_jsonb(v_quota)||jsonb_build_object('allowed',false); end if;
  select request_metadata into v_usage from public.ai_api_usage where id=v_quota.reservation_id;
  if v_usage->>'reservationStatus'='completed' and v_usage->'response'->>'success'='true' then
    return jsonb_build_object('allowed',true,'state','completed','response',v_usage->'response');
  end if;
  if v_quota.already_reserved and v_job.id is null then
    -- A legacy synchronous request owns this reservation; never start a second provider call.
    return jsonb_build_object('allowed',false,'capacity',true,'retryAfterSeconds',5);
  end if;
  insert into ai_work.writing_jobs(auth_id,input_hash,reservation_id,payload)
  values(p_auth_id,p_input_hash,v_quota.reservation_id,p_payload)
  on conflict(auth_id,input_hash) do update set state='queued',payload=excluded.payload,
    reservation_id=excluded.reservation_id,attempts=0,lease_token=null,lease_until=null,
    response=null,response_status=null,updated_at=now()
  returning * into v_job;
  select pgmq.send('writing_feedback',jsonb_build_object('jobId',v_job.id)) into v_message;
  update ai_work.writing_jobs set message_id=v_message where id=v_job.id;
  return jsonb_build_object('allowed',true,'state','queued','jobId',v_job.id,'retainedImageUrl',p_payload->>'imageUrl');
end $$;

create or replace function public.dispatch_writing_feedback_worker()
returns integer language plpgsql security definer set search_path='' as $$
declare v_url text; v_secret text; v_slot record; v_token uuid; v_count integer:=0; v_ready integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('writing-worker-dispatch',0));
  select count(*) into v_ready from pgmq.q_writing_feedback where vt<=clock_timestamp();
  if v_ready=0 then return 0; end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name='project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name='writing_worker_secret';
  if v_url is null or v_secret is null then return 0; end if;
  for v_slot in select id from ai_work.worker_slots where token is null or expires_at<=clock_timestamp() order by id for update loop
    exit when v_count>=v_ready;
    v_token:=gen_random_uuid();
    update ai_work.worker_slots set token=v_token,expires_at=clock_timestamp()+interval '30 seconds' where id=v_slot.id;
    perform net.http_post(url:=rtrim(v_url,'/')||'/functions/v1/writing-feedback-worker',
      headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_secret),
      body:=jsonb_build_object('slotToken',v_token),timeout_milliseconds:=1000);
    v_count:=v_count+1;
  end loop;
  return v_count;
end $$;

create or replace function public.claim_writing_feedback(p_slot_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_slot smallint; v_msg record; v_job ai_work.writing_jobs; v_saved jsonb;
begin
  select id into v_slot from ai_work.worker_slots where token=p_slot_token and expires_at>clock_timestamp() for update;
  if v_slot is null then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('text-ai-admission',0));
  if (select count(*) from ai_work.text_leases where key like 'writing:%') + (select count(*) from ai_work.writing_jobs where state='processing' and lease_until>clock_timestamp())>=2 then
    update ai_work.worker_slots set token=null,expires_at=null where id=v_slot;
    return null;
  end if;
  -- A crashed worker can be redelivered only after its visibility lease expires.
  for v_msg in select * from pgmq.read('writing_feedback',180,1) loop
    select * into v_job from ai_work.writing_jobs where id=(v_msg.message->>'jobId')::uuid for update;
    if v_job.id is null or v_job.state in('completed','failed') then
      perform pgmq.delete('writing_feedback',v_msg.msg_id);
      update ai_work.worker_slots set token=null,expires_at=null where id=v_slot;
      return null;
    end if;
    if v_job.state='processing' and v_job.lease_until>clock_timestamp() then
      update ai_work.worker_slots set token=null,expires_at=null where id=v_slot;
      return null;
    end if;
    if v_job.attempts>=3 then
      select request_metadata->'response' into v_saved from public.ai_api_usage
        where id=v_job.reservation_id and request_metadata->>'reservationStatus'='completed';
      if v_saved->>'success'='true' then
        update ai_work.writing_jobs set state='processing',lease_token=p_slot_token where id=v_job.id;
        perform public.finish_writing_feedback(v_job.id,p_slot_token,200,v_saved,false);
        return null;
      end if;
      update ai_work.writing_jobs set state='failed',payload='{}',response=jsonb_build_object('error','The review was interrupted. Please retry.'),response_status=503,updated_at=now() where id=v_job.id;
      perform public.finalize_ai_api_usage(v_job.reservation_id,0,false,jsonb_build_object('failureReason','Writing worker retry limit'),'failed');
      perform pgmq.delete('writing_feedback',v_msg.msg_id);
      update ai_work.worker_slots set token=null,expires_at=null where id=v_slot;
      return null;
    end if;
    update ai_work.worker_slots set expires_at=clock_timestamp()+interval '180 seconds' where id=v_slot;
    update ai_work.writing_jobs set state='processing',attempts=attempts+1,lease_token=p_slot_token,
      lease_until=clock_timestamp()+interval '180 seconds',updated_at=now() where id=v_job.id returning * into v_job;
    return jsonb_build_object('id',v_job.id,'authId',v_job.auth_id,'payload',v_job.payload,
      'inputHash',v_job.input_hash,'reservationId',v_job.reservation_id,'attempts',v_job.attempts);
  end loop;
  update ai_work.worker_slots set token=null,expires_at=null where id=v_slot;
  return null;
end $$;

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
      and ts.test_type='writing';
  end if;
  if v_retry then
    perform pgmq.set_vt('writing_feedback',v_job.message_id,least(60,5*v_job.attempts));
  else
    perform pgmq.delete('writing_feedback',v_job.message_id);
  end if;
  update ai_work.worker_slots set token=null,expires_at=null where token=p_slot_token;
  return true;
end $$;

create or replace function public.get_writing_feedback_job(p_job_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_job ai_work.writing_jobs;
begin
  select * into v_job from ai_work.writing_jobs where id=p_job_id and auth_id=(select auth.uid());
  if v_job.id is null then raise exception 'Writing job unavailable' using errcode='42501'; end if;
  return jsonb_build_object('jobId',v_job.id,'state',v_job.state,'response',v_job.response,
    'responseStatus',v_job.response_status,'updatedAt',v_job.updated_at);
end $$;

-- Expired burst windows and completed job payloads do not accumulate on Free.
create or replace function public.cleanup_ai_work()
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from ai_work.burst_windows where expires_at<now()-interval '1 day';
  delete from ai_work.text_leases where expires_at<=now();
  delete from ai_work.writing_jobs where state in('completed','failed') and updated_at<now()-interval '1 day';
end $$;

revoke all on function public.check_shared_ai_burst(text,integer,integer),public.acquire_text_ai_lease(text),public.release_text_ai_lease(uuid),
 public.verify_writing_worker(text),public.enqueue_writing_feedback(uuid,text,jsonb),public.dispatch_writing_feedback_worker(),
 public.claim_writing_feedback(uuid),public.finish_writing_feedback(uuid,uuid,integer,jsonb,boolean),public.cleanup_ai_work() from public,anon,authenticated;
grant execute on function public.check_shared_ai_burst(text,integer,integer),public.acquire_text_ai_lease(text),public.release_text_ai_lease(uuid),
 public.verify_writing_worker(text),public.enqueue_writing_feedback(uuid,text,jsonb),public.dispatch_writing_feedback_worker(),
 public.claim_writing_feedback(uuid),public.finish_writing_feedback(uuid,uuid,integer,jsonb,boolean),public.cleanup_ai_work() to service_role;
revoke all on function public.get_writing_feedback_job(uuid) from public,anon;
grant execute on function public.get_writing_feedback_job(uuid) to authenticated;

select cron.schedule('writing-feedback-recovery','* * * * *','select public.dispatch_writing_feedback_worker()');
select cron.schedule('ai-work-cleanup','17 3 * * *','select public.cleanup_ai_work()');
