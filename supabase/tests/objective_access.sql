-- Disposable database test. Adds permissive fixture policies to model the old
-- client access and proves the restrictive gate wins. Always rolls back.
begin;
insert into public.passages(id,title,test_type,test_format,topic,is_active,access_tier,content)
values
 ('31000000-0000-4000-8000-000000000001','ACCESS FIXTURE','reading','academic','fixture',true,'free','SECRET OBJECTIVE CONTENT'),
 ('31000000-0000-4000-8000-000000000002','ACCESS FIXTURE','writing','academic','fixture',true,'free','WRITING PROMPT'),
 ('31000000-0000-4000-8000-000000000003','ACCESS FIXTURE','speaking','academic','fixture',true,'free','SPEAKING PROMPT');
insert into public.questions(id,passage_id) values
 ('32000000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001'),
 ('32000000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000002'),
 ('32000000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000003');
alter table public.passages enable row level security;
alter table public.questions enable row level security;
grant select on public.passages,public.questions to authenticated;
create policy fixture_passage_access on public.passages for select to authenticated using(true);
create policy fixture_question_access on public.questions for select to authenticated using(true);
update objective_private.settings set protect_keys=true;
select set_config('request.jwt.claim.sub','33000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.passages where id='31000000-0000-4000-8000-000000000001') then raise exception 'Raw passage leaked'; end if;
 if exists(select 1 from public.questions where id='32000000-0000-4000-8000-000000000001') then raise exception 'Raw question leaked'; end if;
 if not exists(select 1 from public.library_passages where id='31000000-0000-4000-8000-000000000001' and content is null and transcript is null) then raise exception 'Safe metadata missing or leaked'; end if;
 if (select count(*) from public.questions where id in('32000000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000003'))<>2 then raise exception 'Writing/Speaking questions hidden'; end if;
 if not exists(select 1 from public.library_passages where id='31000000-0000-4000-8000-000000000002' and content='WRITING PROMPT') then raise exception 'Writing prompt lost'; end if;
end $$;
reset role;
rollback;
