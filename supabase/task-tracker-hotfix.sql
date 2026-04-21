create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = auth.uid()
  )
$$;

create or replace function public.ensure_default_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_workspace_id uuid;
  current_owner_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'Oturum acmis bir kullanici gerekiyor.';
  end if;

  select id, owner_user_id
  into current_workspace_id, current_owner_user_id
  from public.workspaces
  where slug = 'benim-site'
  limit 1;

  if current_workspace_id is null then
    insert into public.workspaces (slug, name, description, owner_user_id, is_personal)
    values (
      'benim-site',
      'Benim Site',
      'Tum projeleri tek yerden yonetmek icin ana calisma alani.',
      current_user_id,
      false
    )
    returning id into current_workspace_id;
    current_owner_user_id := current_user_id;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (current_workspace_id, current_user_id, 'owner')
    on conflict (workspace_id, user_id) do update
    set role = 'owner';
  elsif current_owner_user_id = current_user_id then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (current_workspace_id, current_user_id, 'owner')
    on conflict (workspace_id, user_id) do update
    set role = 'owner';
  elsif exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = current_workspace_id
      and wm.user_id = current_user_id
  ) then
    null;
  else
    raise exception 'Bu workspace''e giris icin owner tarafindan uye olarak eklenmeniz gerekiyor.';
  end if;

  insert into public.projects (workspace_id, slug, name, description, color, status, created_by)
  values
    (current_workspace_id, 'fizik-lab', 'Fizik Lab', 'Fizik simulasyonlari ve egitim modulleri.', '#0ea5e9', 'active', current_user_id),
    (current_workspace_id, 'yds-kocum', 'YDS Kocum', 'Dil egitimi ve soru yonetimi uygulamasi.', '#22c55e', 'active', current_user_id),
    (current_workspace_id, 'is-takibi', 'Is Takibi', 'Gorev ve surec yonetimi icin ana proje.', '#f97316', 'active', current_user_id)
  on conflict (workspace_id, slug) do nothing;

  insert into public.project_columns (project_id, title, status_key, sort_order, wip_limit)
  select p.id, c.title, c.status_key::public.task_status, c.sort_order, c.wip_limit
  from public.projects p
  cross join (
    values
      ('Backlog', 'backlog', 10, null),
      ('Yapilacak', 'todo', 20, null),
      ('Devam Ediyor', 'in_progress', 30, 3),
      ('Inceleme', 'review', 40, 2),
      ('Engelli', 'blocked', 50, null),
      ('Tamamlandi', 'done', 60, null)
  ) as c(title, status_key, sort_order, wip_limit)
  where p.workspace_id = current_workspace_id
  on conflict (project_id, status_key) do nothing;

  insert into public.task_labels (workspace_id, name, color)
  values
    (current_workspace_id, 'oncelikli', '#ef4444'),
    (current_workspace_id, 'ui', '#3b82f6'),
    (current_workspace_id, 'backend', '#10b981'),
    (current_workspace_id, 'veritabani', '#8b5cf6'),
    (current_workspace_id, 'test', '#f59e0b')
  on conflict (workspace_id, name) do nothing;

  return current_workspace_id;
end;
$$;

grant execute on function public.ensure_default_workspace() to authenticated;

create or replace function public.list_workspace_members(target_workspace_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.workspace_role
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Bu workspace icin erisim izniniz yok.';
  end if;

  return query
  select wm.user_id, u.email::text, wm.role
  from public.workspace_members wm
  join auth.users u on u.id = wm.user_id
  where wm.workspace_id = target_workspace_id
  order by u.email asc;
end;
$$;

grant execute on function public.list_workspace_members(uuid) to authenticated;

create or replace function public.list_task_assignees(target_task_id uuid)
returns table (
  user_id uuid,
  email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_workspace_id uuid;
begin
  select p.workspace_id
  into target_workspace_id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where t.id = target_task_id;

  if target_workspace_id is null then
    raise exception 'Gorev bulunamadi.';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Bu gorev icin erisim izniniz yok.';
  end if;

  return query
  select ta.user_id, u.email::text
  from public.task_assignees ta
  join auth.users u on u.id = ta.user_id
  where ta.task_id = target_task_id
  order by u.email asc;
end;
$$;

grant execute on function public.list_task_assignees(uuid) to authenticated;

create or replace function public.add_workspace_member_by_email(
  target_workspace_id uuid,
  target_email text,
  target_role public.workspace_role default 'member'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  member_user_id uuid;
begin
  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'Bu workspace icin uye ekleme izniniz yok.';
  end if;

  select id
  into member_user_id
  from auth.users
  where lower(email) = lower(trim(target_email))
  limit 1;

  if member_user_id is null then
    raise exception 'Bu e-posta ile kayitli kullanici bulunamadi.';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (target_workspace_id, member_user_id, target_role)
  on conflict (workspace_id, user_id) do update
  set role = excluded.role;

  return member_user_id;
end;
$$;

grant execute on function public.add_workspace_member_by_email(uuid, text, public.workspace_role) to authenticated;

create or replace function public.assign_task_by_email(
  target_task_id uuid,
  target_email text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  assignee_user_id uuid;
  target_workspace_id uuid;
begin
  select p.workspace_id
  into target_workspace_id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where t.id = target_task_id;

  if target_workspace_id is null then
    raise exception 'Gorev bulunamadi.';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Bu gorev icin atama izniniz yok.';
  end if;

  select public.add_workspace_member_by_email(target_workspace_id, target_email, 'member')
  into assignee_user_id;

  insert into public.task_assignees (task_id, user_id)
  values (target_task_id, assignee_user_id)
  on conflict (task_id, user_id) do nothing;

  return assignee_user_id;
end;
$$;

grant execute on function public.assign_task_by_email(uuid, text) to authenticated;

create or replace function public.remove_task_assignee(
  target_task_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_workspace_id uuid;
begin
  select p.workspace_id
  into target_workspace_id
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where t.id = target_task_id;

  if target_workspace_id is null then
    raise exception 'Gorev bulunamadi.';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'Bu gorev icin atama izniniz yok.';
  end if;

  delete from public.task_assignees
  where task_id = target_task_id
    and user_id = target_user_id;
end;
$$;

grant execute on function public.remove_task_assignee(uuid, uuid) to authenticated;

create or replace function public.get_dashboard_bootstrap()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_workspace_id uuid;
begin
  current_workspace_id := public.ensure_default_workspace();

  return jsonb_build_object(
    'workspace',
    (
      select to_jsonb(w)
      from (
        select id, slug, name, description
        from public.workspaces
        where id = current_workspace_id
        limit 1
      ) w
    ),
    'projects',
    (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at asc), '[]'::jsonb)
      from (
        select id, workspace_id, slug, name, description, color, status, created_at
        from public.projects
        where workspace_id = current_workspace_id
      ) p
    ),
    'columns',
    (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order asc), '[]'::jsonb)
      from (
        select pc.id, pc.project_id, pc.title, pc.status_key, pc.sort_order
        from public.project_columns pc
        join public.projects p on p.id = pc.project_id
        where p.workspace_id = current_workspace_id
      ) c
    ),
    'tasks',
    (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.sort_order asc), '[]'::jsonb)
      from (
        select id, project_id, column_id, title, description, status, priority, due_date, estimated_minutes, spent_minutes, updated_at, sort_order
        from public.tasks
        where project_id in (
          select id from public.projects where workspace_id = current_workspace_id
        )
      ) t
    )
  );
end;
$$;

grant execute on function public.get_dashboard_bootstrap() to authenticated;

update public.workspaces
set owner_user_id = (
  select id from auth.users where email = 'cagrikani@gmail.com' limit 1
)
where slug = 'benim-site'
  and exists (
    select 1 from auth.users where email = 'cagrikani@gmail.com'
  );

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, u.id, 'owner'
from public.workspaces w
join auth.users u on u.email = 'cagrikani@gmail.com'
where w.slug = 'benim-site'
on conflict (workspace_id, user_id) do update
set role = 'owner';
