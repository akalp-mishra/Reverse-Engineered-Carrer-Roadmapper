alter table public.roadmaps
  add column if not exists username text;

alter table public.roadmaps enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roadmaps'
      and policyname = 'careerx users can read own roadmaps'
  ) then
    create policy "careerx users can read own roadmaps"
      on public.roadmaps
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roadmaps'
      and policyname = 'careerx users can create own roadmaps'
  ) then
    create policy "careerx users can create own roadmaps"
      on public.roadmaps
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;
end
$$;
