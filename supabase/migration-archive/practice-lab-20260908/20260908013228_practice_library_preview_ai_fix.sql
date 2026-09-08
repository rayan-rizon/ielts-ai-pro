set lock_timeout='2s';
set statement_timeout='30s';
CREATE OR REPLACE FUNCTION public.practice_library_ai_reserve(p_auth uuid, p_session uuid, p_id uuid, p_kind text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid; s skill_lab_private.library_sessions; op skill_lab_private.operations; spend numeric; ctx jsonb;
begin
 select id into strict u from public.users where auth_id=p_auth;
 perform pg_advisory_xact_lock(hashtextextended(u::text,713));
 perform pg_advisory_xact_lock(713714);
 select * into strict s from skill_lab_private.library_sessions where id=p_session and user_id=u;
 if p_kind<>'help' then raise exception 'This practice uses question answers, not AI grading'; end if;
 if skill_lab_private.tier(u)='free' then raise exception 'AI explanations are available with Pro or Premium'; end if;
 if not skill_lab_private.library_available(p_auth) then raise exception 'AI help is unavailable'; end if;
 if s.stage=2 then raise exception 'Finish this set before asking for an explanation'; end if;
 select * into op from skill_lab_private.operations where id=p_id;
 if found then
  if op.user_id<>u or op.library_session_id is distinct from s.id then raise exception 'Request unavailable'; end if;
  return jsonb_build_object('state',op.state,'result',op.result);
 end if;
 update skill_lab_private.operations set state='failed',finished_at=now(),cost=reserved_cost where user_id=u and state='pending' and expires_at<=now();
 if exists(select 1 from skill_lab_private.operations where user_id=u and state='pending') then raise exception 'Your previous request is still being processed'; end if;
 if (select count(*) from skill_lab_private.operations where user_id=u and created_at>now()-interval '1 minute')>=6 then raise exception 'Please wait a minute before trying again'; end if;
 if (select count(*) from skill_lab_private.operations where library_session_id=s.id and state in('pending','complete'))>=3 then raise exception 'You have used the three AI questions included in this set'; end if;
 select coalesce(sum(coalesce(cost,reserved_cost)),0) into spend from skill_lab_private.operations where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 if spend+0.1>(select daily_budget from skill_lab_private.settings) then raise exception 'AI help is taking a break today. You can still use the saved tips.'; end if;
 ctx:=jsonb_build_object('focus',s.focus,'previous_mistake',s.snapshot->'mistake');
 if s.completed_at is not null then ctx:=ctx||jsonb_build_object('completed_questions',s.snapshot->'questions','result',s.result,'source',s.snapshot->'source'); end if;
 if coalesce((select enabled from public.skill_lab_memory where user_id=u),true) then
  ctx:=ctx||jsonb_build_object('previous_progress',coalesce((select jsonb_agg(to_jsonb(x)) from
   (select completed_at,result->'correct' as correct,result->'total' as total,familiarity,next_review_at from skill_lab_private.library_sessions
    where user_id=u and focus=s.focus and completed_at is not null order by completed_at desc limit 5)x),'[]'));
 end if;
 if octet_length(ctx::text)>24000 then ctx:=jsonb_build_object('focus',s.focus,'note','Source is too long. Give general strategy only; do not invent evidence.'); end if;
 -- Feedback after submission does not turn an independent answer into a helped answer.
 update skill_lab_private.library_sessions set assisted=true where id=s.id and completed_at is null;
 insert into skill_lab_private.operations(id,user_id,library_session_id,kind) values(p_id,u,s.id,'help');
 return jsonb_build_object('state','reserved','context',ctx,'user_id',u);
end $function$
;
reset lock_timeout;
reset statement_timeout;
