-- Verified against user-supplied screenshots (C18 L3 Q5-10), the original
-- stored transcript (C13 L1 Q37-38), and passage/explanation (C18 R3 Q26).
set lock_timeout='2s';
set statement_timeout='30s';
create table if not exists objective_private.library_repairs (
 migration text not null, question_id uuid not null, old_question jsonb not null,
 old_passage_content text not null, repaired_at timestamptz not null default now(),
 primary key(migration,question_id)
);
alter table objective_private.library_repairs enable row level security;
revoke all on objective_private.library_repairs from public,anon,authenticated;
do $$
declare q public.questions; p public.passages; replacement jsonb; part record; grp record; item record;
 v_content jsonb; matches integer; field text; target uuid; table_value jsonb;
begin
 table_value:=$table${
  "title":"Photography competitions",
  "headers":["Title of competition","Instructions","Feedback to Dan"],
  "rows":[
   ["'[gap]'","A scene in the home","The picture's composition was not good."],
   ["'Beautiful Sunsets'","Scene must show some [gap]","The [gap] was wrong."],
   ["'[gap]'","Scene must show [gap]","The photograph was too [gap]"]
  ],
  "blanks":[
   {"row":0,"col":0,"blankNumber":5,"answer":"Domestic Life"},
   {"row":1,"col":1,"blankNumber":6,"answer":"clouds"},
   {"row":1,"col":2,"blankNumber":7,"answer":"timing"},
   {"row":2,"col":0,"blankNumber":8,"answer":"Animal Magic"},
   {"row":2,"col":1,"blankNumber":9,"answer":"movement / animal movement"},
   {"row":2,"col":2,"blankNumber":10,"answer":"dark"}
  ],"blanks_count":6
 }$table$::jsonb;
 table_value:=table_value||jsonb_build_object('table_headers',table_value->'headers','table_rows',table_value->'rows','blank_positions',table_value->'blanks');
 foreach target in array array['f86d3c53-eb77-4038-bd39-58ec1ca224eb','5d9604ec-9268-4879-a98a-3516810237e6','02374502-02e5-4cff-b569-e0a28fb4845e']::uuid[] loop
  select * into strict q from public.questions where id=target for update;
  select * into strict p from public.passages where id=q.passage_id for update;
  insert into objective_private.library_repairs(migration,question_id,old_question,old_passage_content)
   values('20260907185038',q.id,to_jsonb(q),p.content);
  if target='f86d3c53-eb77-4038-bd39-58ec1ca224eb' then
   if q.type<>'table_completion' or jsonb_array_length(q.table_data->'blanks')<>0 then raise exception 'Table changed since audit'; end if;
   field:='table_data'; replacement:=table_value;
   update public.questions set table_data=replacement,question_count=6,
    group_instructions=E'Questions 5–10\n\nComplete the table below.\n\nWrite **NO MORE THAN TWO WORDS** for each answer.',updated_at=now() where id=q.id;
  elsif target='5d9604ec-9268-4879-a98a-3516810237e6' then
   if q.gap_fill#>>'{answers,7}' is distinct from 'new' or q.gap_fill#>'{answers,6}' is not null
    or position('under stress' in p.content)=0 or position('anything new' in p.content)=0 then raise exception 'Transcript/key changed since audit'; end if;
   field:='gap_fill'; replacement:=jsonb_set(q.gap_fill,'{answers}',(q.gap_fill->'answers')||'{"6":"new","7":"stress"}'::jsonb);
   update public.questions set gap_fill=replacement,updated_at=now() where id=q.id;
  else
   if q.gap_fill#>'{answers,26}' is not null or position('pretty strict' in p.content)=0
    or position('Strict' in q.explanation_data#>>'{blanks,26,why_correct}')=0 then raise exception 'Passage/key changed since audit'; end if;
   field:='gap_fill';replacement:=jsonb_set(q.gap_fill,'{answers}',(q.gap_fill->'answers')||'{"26":"strict"}'::jsonb);
   update public.questions set gap_fill=replacement,updated_at=now() where id=q.id;
  end if;
  v_content:=p.content::jsonb;matches:=0;
  for part in select value,ordinality from jsonb_array_elements(v_content) with ordinality loop
   if coalesce((part.value->>'section_number')::integer,part.ordinality::integer)<>q.section then continue; end if;
   for grp in select value,ordinality from jsonb_array_elements(coalesce(part.value->'question_groups','[]')) with ordinality loop
    for item in select value,ordinality from jsonb_array_elements(coalesce(grp.value->'questions','[]')) with ordinality loop
     if item.value->>'type'=q.type and (item.value->>'question_number')::integer=q.question_number then
      v_content:=jsonb_set(v_content,array[(part.ordinality-1)::text,'question_groups',(grp.ordinality-1)::text,'questions',(item.ordinality-1)::text,field],replacement);
      if field='table_data' then
       v_content:=jsonb_set(v_content,array[(part.ordinality-1)::text,'question_groups',(grp.ordinality-1)::text,'questions',(item.ordinality-1)::text,'question_count'],'6');
       v_content:=jsonb_set(v_content,array[(part.ordinality-1)::text,'question_groups',(grp.ordinality-1)::text,'instructions'],to_jsonb(E'Questions 5–10\n\nComplete the table below.\n\nWrite **NO MORE THAN TWO WORDS** for each answer.'::text));
      end if;
      matches:=matches+1;
     end if;
    end loop;
   end loop;
  end loop;
  if matches<>1 then raise exception 'Expected exactly one embedded question, found %',matches; end if;
  update public.passages set content=v_content::text,updated_at=now() where id=p.id;
 end loop;
end $$;
reset lock_timeout;
reset statement_timeout;
