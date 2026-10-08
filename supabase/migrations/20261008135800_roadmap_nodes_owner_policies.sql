alter table public.roadmap_nodes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roadmap_nodes'
      and policyname = 'careerx users can read own roadmap nodes'
  ) then
    create policy "careerx users can read own roadmap nodes"
      on public.roadmap_nodes
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.roadmaps
          where roadmaps.id = roadmap_nodes.roadmap_id
            and roadmaps.user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roadmap_nodes'
      and policyname = 'careerx users can create own roadmap nodes'
  ) then
    create policy "careerx users can create own roadmap nodes"
      on public.roadmap_nodes
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.roadmaps
          where roadmaps.id = roadmap_nodes.roadmap_id
            and roadmaps.user_id = (select auth.uid())
        )
      );
  end if;
end
$$;
