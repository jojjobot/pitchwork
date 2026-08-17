--------------------------------------------------------------------------------
-- PITCHWORK — cloud backup and sync.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query →
-- paste → Run). It is safe to run twice.
--
-- ONE TABLE, ON PURPOSE. Everything the app owns is already a list of objects with
-- an `id`, stored as JSON in the browser: your history, the drills you wrote, the
-- sessions you built, the challenges you started, your settings. Giving each its own
-- table would mean five schemas, five policies and a migration every time the app
-- learns a new field — and the server has no opinion about what is inside a session
-- anyway. So the row is the unit: (who, which bucket, which id) and the JSON.
--
-- `deleted` is what makes deleting work across devices. Without it, sync is a union
-- of two devices' rows and anything you delete on your phone comes straight back
-- from your laptop. A deleted row therefore stays here as a tombstone rather than
-- disappearing — it is the only record that the deletion ever happened.
--------------------------------------------------------------------------------

create table if not exists public.pitchwork_rows (
  user_id    uuid        not null references auth.users on delete cascade,
  bucket     text        not null check (bucket in ('sessions','customWorkouts','customExercises','challenges','settings')),
  id         text        not null,
  data       jsonb       not null,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket, id)
);

-- Sync always asks the same question: "everything of mine that changed since X".
create index if not exists pitchwork_rows_sync_idx
  on public.pitchwork_rows (user_id, updated_at desc);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY.
--
-- On from the first migration, never bolted on later: the anon key ships inside the
-- app bundle and is meant to be public, so RLS is not one layer of defence, it is
-- the only one. Without these policies every user's training would be readable by
-- anyone who opened devtools.
--------------------------------------------------------------------------------

alter table public.pitchwork_rows enable row level security;

drop policy if exists "own rows: read"   on public.pitchwork_rows;
drop policy if exists "own rows: insert" on public.pitchwork_rows;
drop policy if exists "own rows: update" on public.pitchwork_rows;
drop policy if exists "own rows: delete" on public.pitchwork_rows;

create policy "own rows: read"   on public.pitchwork_rows
  for select using (auth.uid() = user_id);

create policy "own rows: insert" on public.pitchwork_rows
  for insert with check (auth.uid() = user_id);

create policy "own rows: update" on public.pitchwork_rows
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows: delete" on public.pitchwork_rows
  for delete using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- `updated_at` is what the client syncs against, so the client is not allowed to
-- be the one who sets it. A phone with a wrong clock would otherwise write rows
-- dated next week and quietly win every merge from then on.
--------------------------------------------------------------------------------

create or replace function public.pitchwork_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pitchwork_rows_touch on public.pitchwork_rows;
create trigger pitchwork_rows_touch
  before insert or update on public.pitchwork_rows
  for each row execute function public.pitchwork_touch();
