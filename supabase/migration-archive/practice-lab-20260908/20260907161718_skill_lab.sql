-- Practice Lab is opt-in at deployment. Client roles cannot read answer keys or write results.
create schema if not exists skill_lab_private;
revoke all on schema skill_lab_private from public, anon, authenticated;
create table skill_lab_private.settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 daily_budget numeric not null default 10 check(daily_budget between 0 and 1000)
);
insert into skill_lab_private.settings(id) values(true);
create table skill_lab_private.lessons (
 skill text not null, module text not null, version integer not null, content jsonb not null,
 published boolean not null default false, primary key(skill,version)
);
create unique index skill_lab_current_lesson on skill_lab_private.lessons(skill) where published;
create table public.skill_lab_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
 skill text not null, content_version integer not null, request_id uuid not null,
 activity_id uuid references public.learning_path_activities(id) on delete set null,
 source_id uuid references public.test_sessions(id) on delete set null,
 return_to text not null default '/practice-lab',
 item_ids jsonb not null, position integer not null default -1,
 repeated boolean not null default false, is_review boolean not null default false,
 created_at timestamptz not null default now(), completed_at timestamptz,
 independent_correct integer not null default 0, independent_count integer not null default 0,
 next_review_at timestamptz, retained boolean not null default false,
 unique(user_id, request_id)
);
create index skill_lab_session_history on public.skill_lab_sessions(user_id,skill,created_at desc);
create table public.skill_lab_responses (
 session_id uuid not null references public.skill_lab_sessions(id) on delete cascade,
 item_id text not null, answer jsonb not null, correct boolean not null,
 assisted boolean not null default false, created_at timestamptz not null default now(),
 primary key(session_id,item_id)
);
create table public.skill_lab_memory (
 user_id uuid primary key references public.users(id) on delete cascade,
 enabled boolean not null default true, since_at timestamptz not null default '1970-01-01 UTC',
 disputed_skills text[] not null default '{}'
);
create table skill_lab_private.operations (
 id uuid primary key, user_id uuid not null references public.users(id) on delete cascade,
 session_id uuid not null references public.skill_lab_sessions(id) on delete cascade,
 kind text not null check(kind in ('help','evaluate','audio')), state text not null default 'pending',
 reserved_cost numeric not null default 0.1, cost numeric, tokens integer, model text, latency_ms integer,
 result jsonb, created_at timestamptz not null default now(), finished_at timestamptz,
 expires_at timestamptz not null default now()+interval '2 minutes'
);
create index skill_lab_operations_user on skill_lab_private.operations(user_id,created_at desc);
create table skill_lab_private.audio_cleanup (
 path text primary key, created_at timestamptz not null default now(), deleted_at timestamptz
);
-- Exposed tables have owner-read policies only. Writes go through the checked RPC.
alter table public.skill_lab_sessions enable row level security;
alter table public.skill_lab_responses enable row level security;
alter table public.skill_lab_memory enable row level security;
revoke all on public.skill_lab_sessions,public.skill_lab_responses,public.skill_lab_memory from public,anon,authenticated;
grant select on public.skill_lab_sessions,public.skill_lab_responses,public.skill_lab_memory to authenticated;
create policy skill_lab_session_owner on public.skill_lab_sessions for select to authenticated using(user_id in(select id from public.users where auth_id=(select auth.uid())));
create policy skill_lab_response_owner on public.skill_lab_responses for select to authenticated using(exists(select 1 from public.skill_lab_sessions s where s.id=session_id));
create policy skill_lab_memory_owner on public.skill_lab_memory for select to authenticated using(user_id in(select id from public.users where auth_id=(select auth.uid())));

create function skill_lab_private.tier(p_user uuid) returns text language sql stable set search_path='' as $$
 select case when role='admin' then 'premium' when subscription_end_date is not null and subscription_end_date<=now() then 'free' when subscription_tier in ('pro','premium') then subscription_tier else 'free' end from public.users where id=p_user
$$;
create function skill_lab_private.resolve_skill(p_module text,p_value text) returns text language plpgsql immutable set search_path='' as $$
declare v text:=lower(regexp_replace(coalesce(p_value,''),'[^a-zA-Z0-9]+','_','g'));
begin
 return case
 when p_module='reading' and v ~ 'true.*false|not_given' then 'reading_true_false_not_given'
 when p_module='reading' and v ~ 'paraphras' then 'reading_paraphrase_matching'
 when p_module='reading' and v ~ 'heading' then 'reading_matching_headings'
 when p_module='listening' and v ~ 'distract|correction' then 'listening_distractors'
 when p_module='listening' and v ~ 'spelling|word_limit|number|answer_limits' then 'listening_answer_limits'
 when p_module='listening' and v ~ 'paraphras' then 'listening_paraphrase'
 when p_module='writing' and v ~ 'support|idea.*develop|task_response' then 'writing_paragraph_support'
 when p_module='writing' and v ~ 'cohesion|coherence' then 'writing_cohesion'
 when p_module='writing' and v ~ 'overview' then 'writing_task1_overview'
 when p_module='speaking' and v ~ 'extend|extension|develop|relevance' then 'speaking_answer_extension'
 when p_module='speaking' and v ~ 'organis|organiz' then 'speaking_organisation'
 when p_module='speaking' and v ~ 'paraphras' then 'speaking_paraphrasing'
 else null end;
end $$;

create function skill_lab_private.source_excerpt(p_session uuid) returns jsonb language plpgsql set search_path='' as $$
declare content jsonb; original_response text; annotation jsonb; selected_skill text;
begin
 select t.content_data,coalesce(t.user_responses::text,''),s.skill into content,original_response,selected_skill
 from public.skill_lab_sessions s join public.test_sessions t on t.id=s.source_id and t.user_id=s.user_id where s.id=p_session;
 if content is null or selected_skill not like 'writing_%' then return null; end if;
 select a.value into annotation from jsonb_each(case when jsonb_typeof(content->'ai_feedbacks')='object' then content->'ai_feedbacks' else '{}'::jsonb end) f
 cross join lateral jsonb_array_elements(case when jsonb_typeof(f.value->'annotations')='array' then f.value->'annotations' else '[]'::jsonb end) a
 where a.value->>'severity'<>'positive' and length(a.value->>'originalText') between 5 and 1200
 and length(a.value->>'suggestion') between 1 and 1200
 and position(a.value->>'originalText' in original_response)>0
 and case selected_skill
  when 'writing_cohesion' then lower(coalesce(a.value->>'criterion','')||' '||coalesce(a.value->>'explanation','')) ~ 'cohe|connect|order|paragraph'
  when 'writing_paragraph_support' then lower(coalesce(a.value->>'criterion','')||' '||coalesce(a.value->>'explanation','')) ~ 'support|develop|example|reason'
  when 'writing_task1_overview' then lower(coalesce(a.value->>'explanation','')) ~ 'overview|trend'
  else false end limit 1;
 if annotation is null then return null; end if;
 return jsonb_build_object('original',annotation->>'originalText','explanation',left(annotation->>'explanation',600));
end $$;

create function skill_lab_private.session_view(p_id uuid) returns jsonb language plpgsql set search_path='' as $$
declare s public.skill_lab_sessions; l jsonb; item jsonb; r public.skill_lab_responses; current_id text;
begin
 select * into strict s from public.skill_lab_sessions where id=p_id;
 select content into l from skill_lab_private.lessons where skill=s.skill and version=s.content_version;
 current_id:=s.item_ids->>s.position;
 select value into item from jsonb_array_elements(l->'items') where value->>'id'=current_id;
 select * into r from public.skill_lab_responses where session_id=s.id and item_id=current_id;
 if item is not null then
   if r.item_id is null then item:=item-'answer'-'evidence_answer'-'explanation'-'transcript'; end if;
   item:=item-'answer'-'evidence_answer';
   if item->>'stage'='independent' then item:=item-'hint'; end if;
 end if;
 return to_jsonb(s)-'item_ids' || jsonb_build_object('source_excerpt',skill_lab_private.source_excerpt(s.id),'lesson',l-'items','item',item,'response',case when r.item_id is null then null else to_jsonb(r) end,'total',jsonb_array_length(s.item_ids),'tier',skill_lab_private.tier(s.user_id),
 'answered',coalesce((select jsonb_agg(jsonb_build_object('prompt',q.value->>'prompt','explanation',q.value->>'explanation','answer',rr.answer,'correct',rr.correct,'transcript',q.value->>'transcript') order by rr.created_at) from public.skill_lab_responses rr join lateral jsonb_array_elements(l->'items') q(value) on q.value->>'id'=rr.item_id where rr.session_id=s.id),'[]'),
 'progress',case when s.retained then 'Ready for later review' when s.independent_count>0 then 'Practising on your own' else 'Learning' end,
 'help_used',(select count(*) from skill_lab_private.operations where session_id=s.id and kind='help' and state in ('pending','complete')),
 'feedback_used',(select count(*) from skill_lab_private.operations where session_id=s.id and kind in ('evaluate','audio') and state in ('pending','complete')),
 'audio_used',(select count(*) from skill_lab_private.operations where session_id=s.id and kind='audio' and state in ('pending','complete')));
end $$;

create function public.skill_lab_action(p_action text,p_session uuid default null,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid; tier text; allowance integer; used integer; skill_id text; l jsonb; s public.skill_lab_sessions;
 ids jsonb; is_repeat boolean:=false; current_item jsonb; previous public.skill_lab_responses;
 ok boolean; total integer; correct_count integer; first_pass timestamptz; passes integer; next_at timestamptz;
 source uuid; activity uuid; return_path text:='/practice-lab'; selected_activity public.learning_path_activities; mem public.skill_lab_memory;
begin
 if auth.uid() is null then raise exception 'Please sign in' using errcode='42501'; end if;
 select id into u from public.users where auth_id=auth.uid();
 if u is null then raise exception 'Account unavailable' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,713));
 insert into public.skill_lab_memory(user_id) values(u) on conflict do nothing;
 select * into mem from public.skill_lab_memory where user_id=u;
 tier:=skill_lab_private.tier(u); allowance:=case tier when 'premium' then 20 when 'pro' then 10 else 2 end;
 select count(*) into used from public.skill_lab_sessions where user_id=u and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if p_action='memory' then
  if p_data->>'operation'='reset' then update public.skill_lab_memory set enabled=false,since_at=now(),disputed_skills='{}' where user_id=u;
  elsif p_data->>'operation'='dispute' then
   if exists(select 1 from skill_lab_private.lessons where skill=p_data->>'skill') then
    update public.skill_lab_memory set disputed_skills=array(select distinct unnest(disputed_skills||array[p_data->>'skill'])) where user_id=u;
   end if;
  elsif p_data->>'operation'='enabled' then update public.skill_lab_memory set enabled=(p_data->>'enabled')::boolean where user_id=u;
  else raise exception 'Unknown progress setting'; end if;
  return jsonb_build_object('saved',true);
 end if;
 if p_action='dashboard' then
  return jsonb_build_object('enabled',(select enabled from skill_lab_private.settings),'tier',tier,'remaining',greatest(0,allowance-used),'limit',allowance,
   'reset_at',(date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC',
   'lessons',coalesce((select jsonb_agg(content-'items' order by module,skill) from skill_lab_private.lessons where published),'[]'),
   'sessions',coalesce((select jsonb_agg(to_jsonb(x)-'item_ids') from (select * from public.skill_lab_sessions where user_id=u order by created_at desc limit 60)x),'[]'),
   'evidence',coalesce((select jsonb_agg(to_jsonb(x)) from (select skill_code,module,practice_count,mastery_probability,confidence_level,next_review_at from public.skill_proficiency where user_id=u order by last_practiced_at desc nulls last limit 40)x),'[]'),
   'memory',to_jsonb(mem)-'user_id');
 end if;
 if p_action='start' then
  select * into s from public.skill_lab_sessions where user_id=u and request_id=(p_data->>'request_id')::uuid;
  if found then return skill_lab_private.session_view(s.id); end if;
  if not (select enabled from skill_lab_private.settings) then raise exception 'Practice Lab is not available yet'; end if;
  if used>=allowance then raise exception 'You have used today’s lessons. Your allowance resets at 00:00 UTC.'; end if;
  skill_id:=p_data->>'skill';
  select content into l from skill_lab_private.lessons where skill=skill_id and published;
  if l is null then raise exception 'Choose a supported skill from the library'; end if;
  source:=nullif(p_data->>'source_id','')::uuid; activity:=nullif(p_data->>'activity_id','')::uuid;
  if source is not null and not exists(select 1 from public.test_sessions where id=source and user_id=u and is_completed and lower(coalesce(module,test_type))=l->>'module') then raise exception 'Result unavailable' using errcode='42501'; end if;
  if source is not null then
   return_path:=case when l->>'module'='writing' then '/writing-task?sessionId='||source::text||'&view-results=true' else '/'||(l->>'module')||'-test/'||source::text||'?view-results=true' end;
  end if;
  if activity is not null then
   select * into selected_activity from public.learning_path_activities where id=activity and user_id=u and module=l->>'module' and activity_type in ('targeted_drill','targeted_repair','spaced_review') and not is_completed for update;
   if not found then raise exception 'Learning activity unavailable' using errcode='42501'; end if;
   return_path:='/learning-path';
   if exists(select 1 from unnest(selected_activity.skill_targets) target where skill_lab_private.resolve_skill(selected_activity.module,target) is not null)
     and not exists(select 1 from unnest(selected_activity.skill_targets) target where skill_lab_private.resolve_skill(selected_activity.module,target)=skill_id) then
     raise exception 'Choose the skill linked to this learning activity';
   elsif cardinality(coalesce(selected_activity.skill_targets,'{}'))>0 and not exists(select 1 from unnest(selected_activity.skill_targets) target where skill_lab_private.resolve_skill(selected_activity.module,target)=skill_id) then
     -- A broad recommendation is a starting point, not proof that another task was completed.
     activity:=null;
   end if;
  end if;
  select jsonb_agg(x.value->>'id') into ids from (
   select value from jsonb_array_elements(l->'items') where value->>'stage'='independent'
   and not exists(select 1 from public.skill_lab_sessions old where old.user_id=u and old.skill=skill_id and old.item_ids ? (value->>'id'))
   order by value->>'id' limit 5)x;
  if coalesce(jsonb_array_length(ids),0)<5 then
   is_repeat:=true;
   select jsonb_agg(x.value->>'id') into ids from (select value from jsonb_array_elements(l->'items') where value->>'stage'='independent' order by random() limit 5)x;
  end if;
  if coalesce(jsonb_array_length(ids),0)<5 then raise exception 'The examples for this lesson are being prepared. No lesson was used.'; end if;
  if coalesce(p_data->>'mode','learn')<>'check' then ids:=jsonb_build_array(l->'items'->(used%4)->>'id')||ids; end if;
  insert into public.skill_lab_sessions(user_id,skill,content_version,request_id,activity_id,source_id,item_ids,repeated,is_review,position,return_to)
   values(u,skill_id,(l->>'version')::integer,(p_data->>'request_id')::uuid,activity,source,ids,is_repeat,
   exists(select 1 from public.skill_lab_sessions where user_id=u and skill=skill_id and completed_at is not null),case when p_data->>'mode'='check' then 0 else -1 end,return_path) returning * into s;
  return skill_lab_private.session_view(s.id);
 end if;
 select * into s from public.skill_lab_sessions where id=p_session and user_id=u for update;
 if not found then raise exception 'Lesson unavailable' using errcode='42501'; end if;
 select content into l from skill_lab_private.lessons where skill=s.skill and version=s.content_version;
 select value into current_item from jsonb_array_elements(l->'items') where value->>'id'=s.item_ids->>s.position;
 if p_action='get' then return skill_lab_private.session_view(s.id); end if;
 if s.completed_at is not null then return skill_lab_private.session_view(s.id); end if;
 if p_action='answer' then
  if current_item is null or p_data->>'item_id'<>current_item->>'id' then raise exception 'This question has changed. Please reload.'; end if;
  select * into previous from public.skill_lab_responses where session_id=s.id and item_id=current_item->>'id';
  if not found then
   if length(coalesce(p_data->>'answer',''))>3000 then raise exception 'Answer is too long'; end if;
   ok:=case when current_item->>'kind'='short' then lower(trim(p_data->>'answer'))=lower(current_item->>'answer') else p_data->'answer'=current_item->'answer' end;
   if current_item ? 'evidence_answer' then ok:=ok and p_data->>'evidence'=current_item->>'evidence_answer'; end if;
   insert into public.skill_lab_responses(session_id,item_id,answer,correct,assisted) values(s.id,current_item->>'id',coalesce(p_data->'answer','null'),coalesce(ok,false),current_item->>'stage'='guided');
  end if;
 elsif p_action='next' then
  -- Expected position prevents a retried request from advancing twice.
  if (p_data->>'position')::integer<>s.position then return skill_lab_private.session_view(s.id); end if;
  if s.position>=0 and not exists(select 1 from public.skill_lab_responses where session_id=s.id and item_id=current_item->>'id') then raise exception 'Answer this question first'; end if;
  if s.position<jsonb_array_length(s.item_ids)-1 then update public.skill_lab_sessions set position=position+1 where id=s.id;
  else
   select count(*),count(*) filter(where correct) into total,correct_count from public.skill_lab_responses where session_id=s.id and not assisted;
   select min(completed_at),count(*) into first_pass,passes from public.skill_lab_sessions where user_id=u and skill=s.skill and not repeated and independent_count=5 and independent_correct>=4 and completed_at is not null
    and completed_at>coalesce((select max(f.completed_at) from public.skill_lab_sessions f where f.user_id=u and f.skill=s.skill and f.independent_count=5 and f.independent_correct<4 and not f.repeated),'-infinity'::timestamptz);
   next_at:=now()+case when correct_count<4 then interval '2 days' when passes=0 then interval '2 days' when passes=1 then interval '7 days' else interval '21 days' end;
   update public.skill_lab_sessions set completed_at=now(),independent_count=case when s.repeated then 0 else total end,independent_correct=case when s.repeated then 0 else correct_count end,
    retained=not s.repeated and total=5 and correct_count>=4 and coalesce(first_pass<=now()-interval '48 hours',false),next_review_at=case when s.repeated then null else next_at end where id=s.id;
   -- Adapter into existing proficiency: only fresh independent observations, never a fixed completion bonus.
   if not s.repeated and total=5 then
    insert into public.skill_proficiency(user_id,skill_code,module,practice_count,correct_count,mastery_probability,confidence_level,last_practiced_at,next_review_at)
     values(u,s.skill,l->>'module',total,correct_count,correct_count::float/total,0.4,now(),next_at)
     on conflict(user_id,skill_code) do update set
      practice_count=public.skill_proficiency.practice_count+excluded.practice_count,
      correct_count=public.skill_proficiency.correct_count+excluded.correct_count,
      mastery_probability=(public.skill_proficiency.correct_count+excluded.correct_count)::float/(public.skill_proficiency.practice_count+excluded.practice_count),
      confidence_level=least(0.8,public.skill_proficiency.confidence_level+0.1),last_practiced_at=now(),next_review_at=next_at,updated_at=now();
   end if;
   if s.activity_id is not null then update public.learning_path_activities set is_completed=true,completed_at=now(),outcome_data=jsonb_build_object('source','skill_lab','session_id',s.id,'practice_only',true),updated_at=now() where id=s.activity_id and user_id=u and not is_completed; end if;
  end if;
 else raise exception 'Unknown lesson action'; end if;
 return skill_lab_private.session_view(s.id);
end $$;
revoke all on function public.skill_lab_action(text,uuid,jsonb) from public,anon;
grant execute on function public.skill_lab_action(text,uuid,jsonb) to authenticated;

-- Service-only atomic reservation. The edge verifies the JWT and resolves the user.
create function public.skill_lab_ai_reserve(p_auth uuid,p_session uuid,p_id uuid,p_kind text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid; s public.skill_lab_sessions; op skill_lab_private.operations; spend numeric; ctx jsonb; mem public.skill_lab_memory;
begin
 select id into u from public.users where auth_id=p_auth;
 if u is null then raise exception 'Account unavailable'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,713));
 perform pg_advisory_xact_lock(713714);
 select * into s from public.skill_lab_sessions where id=p_session and user_id=u;
 if not found then raise exception 'Lesson unavailable'; end if;
 select * into op from skill_lab_private.operations where id=p_id;
 if found then
  if op.user_id<>u or op.session_id<>p_session or op.kind<>p_kind then raise exception 'Request unavailable'; end if;
  if op.state='pending' and op.expires_at<=now() then
   update skill_lab_private.operations set state='failed',finished_at=now(),cost=reserved_cost where id=p_id;
   return jsonb_build_object('state','failed','result',null);
  end if;
  return jsonb_build_object('state',op.state,'result',op.result);
 end if;
 if not(select enabled from skill_lab_private.settings) then raise exception 'AI help is unavailable'; end if;
 if skill_lab_private.tier(u)='free' then raise exception 'AI help is available with Pro or Premium'; end if;
 if s.completed_at is not null or (s.position>=0 and not exists(select 1 from skill_lab_private.lessons lc,jsonb_array_elements(lc.content->'items') qi where lc.skill=s.skill and lc.version=s.content_version and qi->>'id'=s.item_ids->>s.position and qi->>'stage'='guided')) then raise exception 'AI help is available while learning, before the independent check'; end if;
 update skill_lab_private.operations set state='failed',finished_at=now(),cost=reserved_cost where user_id=u and state='pending' and expires_at<=now();
 if exists(select 1 from skill_lab_private.operations where user_id=u and state='pending') then raise exception 'Your previous request is still being processed'; end if;
 if (select count(*) from skill_lab_private.operations where user_id=u and created_at>now()-interval '1 minute')>=6 then raise exception 'Please wait a minute before trying again'; end if;
 if p_kind='help' and (select count(*) from skill_lab_private.operations where session_id=s.id and kind='help' and state in ('pending','complete'))>=3 then raise exception 'You have used the three questions included in this lesson'; end if;
 if p_kind in ('evaluate','audio') and (select count(*) from skill_lab_private.operations where session_id=s.id and kind in ('evaluate','audio') and state in ('pending','complete'))>=6 then raise exception 'You have used the six feedback requests included in this lesson'; end if;
 if p_kind='audio' and (select count(*) from skill_lab_private.operations where session_id=s.id and kind='audio' and state in ('pending','complete'))>=3 then raise exception 'You have used the three recordings included in this lesson'; end if;
 if p_kind not in ('help','evaluate','audio') then raise exception 'Unsupported request'; end if;
 select coalesce(sum(coalesce(cost,reserved_cost)),0) into spend from skill_lab_private.operations where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if spend+0.1>(select daily_budget from skill_lab_private.settings) then raise exception 'AI help is taking a break today. You can continue with the lesson examples.'; end if;
 select content-'items' into ctx from skill_lab_private.lessons where skill=s.skill and version=s.content_version;
 if p_kind='audio' and ctx->>'module'<>'speaking' then raise exception 'Recording is only available in Speaking'; end if;
 if p_kind='evaluate' and ctx->>'module' not in ('writing','speaking') then raise exception 'Use the question answers for this lesson'; end if;
 select * into mem from public.skill_lab_memory where user_id=u;
 -- Progress only. No chat history, inferred personality or unrelated answers.
 if mem.enabled and not(s.skill=any(mem.disputed_skills)) then
  if mem.since_at='1970-01-01 UTC'::timestamptz then
   ctx:=ctx||jsonb_build_object('saved_skill_progress',(select jsonb_build_object('answers_recorded',sp.practice_count,'answers_correct',sp.correct_count,'last_practised_at',sp.last_practiced_at) from public.skill_proficiency sp where sp.user_id=u and sp.skill_code=s.skill));
  end if;
  ctx:=ctx||jsonb_build_object('previous_progress',coalesce((select jsonb_agg(to_jsonb(x)) from
   (select completed_at,independent_count,independent_correct,repeated,next_review_at from public.skill_lab_sessions where user_id=u and skill=s.skill and completed_at>=mem.since_at order by completed_at desc limit 5)x),'[]'));
 end if;
 ctx:=ctx||jsonb_build_object('current_source',skill_lab_private.source_excerpt(s.id));
 insert into skill_lab_private.operations(id,user_id,session_id,kind) values(p_id,u,s.id,p_kind);
 return jsonb_build_object('state','reserved','context',ctx,'user_id',u);
end $$;
create function public.skill_lab_ai_finish(p_id uuid,p_result jsonb,p_cost numeric,p_tokens integer,p_model text,p_latency integer,p_ok boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 update skill_lab_private.operations set state=case when p_ok then 'complete' else 'failed' end,
 result=p_result,cost=greatest(0,coalesce(p_cost,reserved_cost)),tokens=p_tokens,model=p_model,latency_ms=p_latency,finished_at=now()
 where id=p_id and state='pending';
end $$;
revoke all on function public.skill_lab_ai_reserve(uuid,uuid,uuid,text),public.skill_lab_ai_finish(uuid,jsonb,numeric,integer,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.skill_lab_ai_reserve(uuid,uuid,uuid,text),public.skill_lab_ai_finish(uuid,jsonb,numeric,integer,text,integer,boolean) to service_role;
-- Edge storage actions use the service role. No browser upload or listing policy.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('skill-lab-audio','skill-lab-audio',false,6000000,array['audio/wav']) on conflict(id) do nothing;
create function public.skill_lab_audio_cleanup(p_action text,p_path text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if p_action='register' then
  if p_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.wav$' then raise exception 'Invalid recording path'; end if;
  insert into skill_lab_private.audio_cleanup(path) values(p_path) on conflict do nothing;
 elsif p_action='done' then update skill_lab_private.audio_cleanup set deleted_at=now() where path=p_path;
 elsif p_action='list' then
  -- Delete operation outputs after one day. They are retry receipts, not tutor memory.
  update skill_lab_private.operations set result=null where finished_at<now()-interval '24 hours' and result is not null;
  return coalesce((select jsonb_agg(path) from (select path from skill_lab_private.audio_cleanup where deleted_at is null and created_at<now()-interval '1 hour' order by created_at limit 100)x),'[]');
 else raise exception 'Unknown cleanup action'; end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.skill_lab_audio_cleanup(text,text) from public,anon,authenticated;
grant execute on function public.skill_lab_audio_cleanup(text,text) to service_role;

-- Install the hourly recovery sweep where pg_cron exists. No calls until enabled.
-- Vault skill_lab_cleanup_secret must match the Edge SKILL_LAB_CLEANUP_SECRET.
do $schedule$
begin
 if to_regnamespace('cron') is not null then
  perform cron.schedule('skill-lab-audio-cleanup','17 * * * *',$job$
   select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/skill-lab-cleanup',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='skill_lab_cleanup_secret')),
    body := '{}'::jsonb
   ) where exists(select 1 from vault.decrypted_secrets where name='skill_lab_cleanup_secret')
       and exists(select 1 from vault.decrypted_secrets where name='project_url');
  $job$);
 end if;
end $schedule$;

-- PostgREST can keep its routine cache after a migration is applied. Reload it
-- explicitly so the new RPC is immediately available to the web client.
select pg_notify('pgrst', 'reload schema');
