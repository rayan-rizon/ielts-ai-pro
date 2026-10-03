-- Restore the missing production table using the original learner-owned contract.
-- An explicit learner choice, separate from opening or viewing a guide.
create table if not exists public.grammar_guide_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  guide_slug text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, guide_slug)
);

create index if not exists grammar_guide_progress_user_completed_idx
  on public.grammar_guide_progress (user_id, completed_at desc);

alter table public.grammar_guide_progress enable row level security;

revoke all on table public.grammar_guide_progress from anon, authenticated;
grant select, insert, update, delete on table public.grammar_guide_progress to authenticated;

drop policy if exists "Learners can read their own grammar guide progress"
  on public.grammar_guide_progress;
create policy "Learners can read their own grammar guide progress"
  on public.grammar_guide_progress
  for select
  to authenticated
  using (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  );

drop policy if exists "Learners can add their own grammar guide progress"
  on public.grammar_guide_progress;
create policy "Learners can add their own grammar guide progress"
  on public.grammar_guide_progress
  for insert
  to authenticated
  with check (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  );

drop policy if exists "Learners can update their own grammar guide progress"
  on public.grammar_guide_progress;
create policy "Learners can update their own grammar guide progress"
  on public.grammar_guide_progress
  for update
  to authenticated
  using (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  )
  with check (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  );

drop policy if exists "Learners can remove their own grammar guide progress"
  on public.grammar_guide_progress;
create policy "Learners can remove their own grammar guide progress"
  on public.grammar_guide_progress
  for delete
  to authenticated
  using (
    user_id in (
      select u.id
      from public.users u
      where u.id = (select auth.uid()) or u.auth_id = (select auth.uid())
    )
  );

comment on table public.grammar_guide_progress is
  'Explicit, reversible guide-completion choices. Viewing a guide never writes to this table.';
