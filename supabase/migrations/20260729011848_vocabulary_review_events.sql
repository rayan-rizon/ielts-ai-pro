-- Preserve each review outcome so retention is measured from learner responses,
-- rather than inferred from the current state of a vocabulary item.
create table if not exists public.vocabulary_review_events (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  vocabulary_item_id uuid not null references public.vocabulary_items(id) on delete cascade,
  quality smallint not null check (quality between 0 and 5),
  reviewed_at timestamp with time zone not null default now()
);

create index if not exists vocabulary_review_events_user_reviewed_at_idx
  on public.vocabulary_review_events (user_id, reviewed_at desc);

alter table public.vocabulary_review_events enable row level security;

create policy "Users can read their vocabulary review events"
  on public.vocabulary_review_events
  for select
  to authenticated
  using (
    user_id = (select public.get_my_public_user_id())
    or user_id = (select auth.uid())
  );

create policy "Users can add their vocabulary review events"
  on public.vocabulary_review_events
  for insert
  to authenticated
  with check (
    user_id = (select public.get_my_public_user_id())
    or user_id = (select auth.uid())
  );

grant select, insert on public.vocabulary_review_events to authenticated;
grant all on public.vocabulary_review_events to service_role;
