do $$
declare account_id uuid := gen_random_uuid(); profile_id uuid; conv_id uuid; op_id uuid:=gen_random_uuid(); result jsonb; health jsonb;
begin
 if not exists(select 1 from public.users where email='backfill@example.test') then raise exception 'Established profile was not backfilled'; end if;
 insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at,last_sign_in_at)
 values(account_id,'google@example.test','{"full_name":"Google learner","role":"admin","subscription_tier":"premium"}',now(),now());
 select id into strict profile_id from public.users where auth_id=account_id and role='user' and subscription_tier='free';
 update public.users set subscription_tier='pro' where id=profile_id;
 update auth.users set last_sign_in_at=now() where id=account_id;
 if (select count(*) from public.users where auth_id=account_id)<>1 or (select subscription_tier from public.users where id=profile_id)<>'pro' then raise exception 'Provisioning changed an existing profile'; end if;
 insert into auth.users(email) values('unconfirmed@example.test');
 if exists(select 1 from public.users where email='unconfirmed@example.test') then raise exception 'Unconfirmed account provisioned prematurely'; end if;
 update auth.users set email_confirmed_at=now() where email='unconfirmed@example.test';
 if not exists(select 1 from public.users where email='unconfirmed@example.test') then raise exception 'Email confirmation did not provision'; end if;
 insert into public.ai_coach_conversations(user_id) values(profile_id) returning id into conv_id;
 insert into ai_coach_private.operations(id,user_id,conversation_id,requested_language,reserved_cost) values(op_id,profile_id,conv_id,'en',0.005);
 perform public.ai_coach_finish(op_id,'',null,0.001,120,'openai/gpt-6-luna',4300,false,
 '{"stage":"fallback","attempts":[{"model":"openai/gpt-6-luna","code":"invalid_schema","latencyMs":4200}]}');
 if not exists(select 1 from ai_coach_private.operations where id=op_id and state='failed' and latency_ms=4300 and diagnostics->>'stage'='fallback') then raise exception 'Failure diagnostics missing'; end if;
 -- A replay cannot overwrite billed cost or diagnostic evidence.
 perform public.ai_coach_finish(op_id,'',null,0,0,'',0,false,'{}');
 if (select actual_cost from ai_coach_private.operations where id=op_id)<>0.001 then raise exception 'Replay overwrote billing'; end if;
 -- Old deployed clients may still call the eight-argument function.
 op_id:=gen_random_uuid();
 insert into ai_coach_private.operations(id,user_id,conversation_id,requested_language,reserved_cost) values(op_id,profile_id,conv_id,'en',0.005);
 perform public.ai_coach_finish(op_id,'',null,null,0,'',0,false);
 if (select actual_cost from ai_coach_private.operations where id=op_id) is not null then raise exception 'Unknown cost was changed to free'; end if;
 health:=public.get_platform_health_core_v14(24);
 select value into result from jsonb_array_elements(health->'services') where value->>'key'='personalized_ai_coach';
 if (result#>>'{metrics,failedRequests}')::int<>2 then raise exception 'Health failure count incorrect: %',result; end if;
 if (result#>>'{metrics,p95LatencyMs}')::int<>4300 then raise exception 'Unknown zero latency contaminated P95: %',result; end if;
 if has_function_privilege('authenticated','public.ai_coach_finish(uuid,text,jsonb,numeric,integer,text,integer,boolean,jsonb)','execute') then raise exception 'Learner can finalize billing'; end if;
 if has_schema_privilege('authenticated','auth_provisioning_private','usage') then raise exception 'Private provisioning is exposed'; end if;
 raise notice 'Provisioning, billing replay, diagnostics, permissions and health assertions passed';
end $$;
-- Exercise real success persistence, follow-ups and bounded telemetry.
do $$
declare u uuid; c uuid; op uuid:=gen_random_uuid(); result jsonb;
begin
 select id into u from public.users where email='google@example.test';
 select id into c from public.ai_coach_conversations where user_id=u limit 1;
 insert into ai_coach_private.operations(id,user_id,conversation_id,requested_language,reserved_cost) values(op,u,c,'en',0.005);
 result:=public.ai_coach_finish(op,'How can I practise?', '{"answer":"Practise one paragraph.","followUps":["How do I review it?"],"actions":[],"exercise":null}',0.0003,1350,'openai/gpt-oss-120b',2300,true,'{"stage":"finalize","code":"ok","attempts":[]}');
 if (select follow_ups from public.ai_coach_messages where id=(result->>'messageId')::uuid)<>'["How do I review it?"]'::jsonb then raise exception 'Follow-ups lost during settlement'; end if;
 begin
   update ai_coach_private.operations set diagnostics=jsonb_build_object('content',repeat('x',5000)) where id=op;
   raise exception 'Oversized diagnostics were accepted';
 exception when check_violation then null; end;
 insert into public.users(email,subscription_tier) values('legacy@example.test','premium');
 insert into auth.users(email,email_confirmed_at) values('legacy@example.test',now());
 if not exists(select 1 from public.users where email='legacy@example.test' and auth_id is not null and subscription_tier='premium') then raise exception 'Legacy entitlement lost'; end if;
end $$;

-- A growing retained ledger must not turn a 24-hour dashboard read into a
-- full-history scan. Use PostgreSQL's actual planner with 50k historical rows.
insert into ai_coach_private.operations(id,user_id,conversation_id,state,requested_language,reserved_cost,actual_cost,created_at,latency_ms)
select gen_random_uuid(),c.user_id,c.id,'complete','en',0.005,0.001,now()-interval '30 days',1000
from (select * from public.ai_coach_conversations limit 1)c cross join generate_series(1,50000);
analyze ai_coach_private.operations;
do $$
declare plan json; recent_ms numeric; old_ms numeric;
begin
 execute $q$explain (analyze,buffers,format json) select count(*) filter(where state='complete'),count(*) filter(where state='failed'),percentile_cont(0.95) within group(order by latency_ms) from ai_coach_private.operations where created_at>=now()-interval '24 hours'$q$ into plan;
 if plan::text not like '%ai_coach_operations_budget%' then raise exception 'Recent health read ignored time index: %',plan; end if;
 recent_ms:=(plan->0->>'Execution Time')::numeric;
 execute $q$explain (analyze,buffers,format json) select count(*),count(*) filter(where expires_at<=now()) from ai_coach_private.operations where state='pending'$q$ into plan;
 if plan::text not like '%ai_coach_operations_pending_expiry%' then raise exception 'Pending read ignored partial index: %',plan; end if;
 execute $q$explain (analyze,buffers,format json) select count(*) filter(where state='complete' and created_at>=now()-interval '24 hours'),count(*) filter(where state='failed' and created_at>=now()-interval '24 hours'),percentile_cont(0.95) within group(order by latency_ms) filter(where created_at>=now()-interval '24 hours') from ai_coach_private.operations$q$ into plan;
 old_ms:=(plan->0->>'Execution Time')::numeric;
 raise notice '50k historical rows: recent indexed health % ms; old full-history aggregate % ms',recent_ms,old_ms;
end $$;
