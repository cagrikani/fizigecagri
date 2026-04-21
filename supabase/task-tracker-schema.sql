create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'workspace_role'
  ) then
    create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'project_status'
  ) then
    create type public.project_status as enum ('planning', 'active', 'paused', 'completed', 'archived');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'task_priority'
  ) then
    create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'task_status'
  ) then
    create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'review', 'blocked', 'done');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'task_activity_type'
  ) then
    create type public.task_activity_type as enum (
      'task_created',
      'task_updated',
      'status_changed',
      'priority_changed',
      'assignee_added',
      'assignee_removed',
      'comment_added',
      'attachment_added'
    );
  end if;
end
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  color text not null default '#2563eb',
  status public.project_status not null default 'active',
  start_date date,
  due_date date,
  archived_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.project_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status_key public.task_status not null,
  sort_order integer not null default 0,
  wip_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, status_key)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid references public.project_columns(id) on delete set null,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  task_number bigint generated always as identity,
  title text not null,
  description text not null default '',
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  sort_order numeric(18,6) not null default 1000,
  start_date date,
  due_date date,
  completed_at timestamptz,
  estimated_minutes integer,
  spent_minutes integer not null default 0,
  reporter_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_project_status_idx
  on public.tasks (project_id, status, priority, due_date);

create index if not exists tasks_parent_idx
  on public.tasks (parent_task_id);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.task_label_links (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.task_labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_idx
  on public.task_comments (task_id, created_at desc);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  bucket_name text not null default 'task-files',
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.task_activity_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  activity_type public.task_activity_type not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists task_activity_logs_task_idx
  on public.task_activity_logs (task_id, created_at desc);

create or replace function public.app_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  )
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_user_id = auth.uid()
  )
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_task_changes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity_logs (task_id, actor_user_id, activity_type, new_value)
    values (
      new.id,
      auth.uid(),
      'task_created',
      jsonb_build_object(
        'title', new.title,
        'status', new.status,
        'priority', new.priority
      )
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.task_activity_logs (task_id, actor_user_id, activity_type, old_value, new_value)
    values (
      new.id,
      auth.uid(),
      'status_changed',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status)
    );
  elsif old.priority is distinct from new.priority then
    insert into public.task_activity_logs (task_id, actor_user_id, activity_type, old_value, new_value)
    values (
      new.id,
      auth.uid(),
      'priority_changed',
      jsonb_build_object('priority', old.priority),
      jsonb_build_object('priority', new.priority)
    );
  else
    insert into public.task_activity_logs (task_id, actor_user_id, activity_type, old_value, new_value)
    values (
      new.id,
      auth.uid(),
      'task_updated',
      jsonb_build_object(
        'title', old.title,
        'description', old.description,
        'due_date', old.due_date
      ),
      jsonb_build_object(
        'title', new.title,
        'description', new.description,
        'due_date', new.due_date
      )
    );
  end if;

  return new;
end;
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
    (current_workspace_id, 'is-takibi', 'İş Takibi', 'PDF görev paylaşımı ve süreç yönetimi için ana pano.', '#f97316', 'active', current_user_id)
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

drop trigger if exists workspaces_touch_updated_at on public.workspaces;
create trigger workspaces_touch_updated_at
before update on public.workspaces
for each row execute function public.touch_updated_at();

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

drop trigger if exists project_columns_touch_updated_at on public.project_columns;
create trigger project_columns_touch_updated_at
before update on public.project_columns
for each row execute function public.touch_updated_at();

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
before update on public.tasks
for each row execute function public.touch_updated_at();

drop trigger if exists task_labels_touch_updated_at on public.task_labels;
create trigger task_labels_touch_updated_at
before update on public.task_labels
for each row execute function public.touch_updated_at();

drop trigger if exists task_insert_update_activity on public.tasks;
create trigger task_insert_update_activity
after insert or update on public.tasks
for each row execute function public.log_task_changes();

create or replace view public.task_board_view as
select
  t.id,
  t.project_id,
  p.workspace_id,
  p.name as project_name,
  t.task_number,
  t.title,
  t.status,
  t.priority,
  t.sort_order,
  t.due_date,
  t.start_date,
  t.completed_at,
  t.created_at,
  t.updated_at,
  pc.title as column_title,
  coalesce(
    jsonb_agg(
      distinct jsonb_build_object(
        'user_id', ta.user_id
      )
    ) filter (where ta.user_id is not null),
    '[]'::jsonb
  ) as assignees
from public.tasks t
join public.projects p on p.id = t.project_id
left join public.project_columns pc on pc.id = t.column_id
left join public.task_assignees ta on ta.task_id = t.id
group by t.id, p.id, pc.id;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_labels enable row level security;
alter table public.task_label_links enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.task_activity_logs enable row level security;

drop policy if exists "workspace_members_can_view_workspaces" on public.workspaces;
create policy "workspace_members_can_view_workspaces"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "users_can_create_workspaces" on public.workspaces;
create policy "users_can_create_workspaces"
on public.workspaces
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "workspace_admins_can_update_workspaces" on public.workspaces;
create policy "workspace_admins_can_update_workspaces"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

drop policy if exists "workspace_admins_can_delete_workspaces" on public.workspaces;
create policy "workspace_admins_can_delete_workspaces"
on public.workspaces
for delete
to authenticated
using (public.is_workspace_owner(id));

drop policy if exists "members_can_view_workspace_members" on public.workspace_members;
create policy "members_can_view_workspace_members"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "admins_can_manage_workspace_members" on public.workspace_members;
create policy "admins_can_manage_workspace_members"
on public.workspace_members
for all
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "members_can_view_projects" on public.projects;
create policy "members_can_view_projects"
on public.projects
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "members_can_create_projects" on public.projects;
create policy "members_can_create_projects"
on public.projects
for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists "members_can_update_projects" on public.projects;
create policy "members_can_update_projects"
on public.projects
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "admins_can_delete_projects" on public.projects;
create policy "admins_can_delete_projects"
on public.projects
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

drop policy if exists "members_can_view_project_columns" on public.project_columns;
create policy "members_can_view_project_columns"
on public.project_columns
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_project_columns" on public.project_columns;
create policy "members_can_manage_project_columns"
on public.project_columns
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_owner(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_owner(p.workspace_id)
  )
);

drop policy if exists "members_can_view_tasks" on public.tasks;
create policy "members_can_view_tasks"
on public.tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_tasks" on public.tasks;
create policy "members_can_manage_tasks"
on public.tasks
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_view_task_assignees" on public.task_assignees;
create policy "members_can_view_task_assignees"
on public.task_assignees
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_task_assignees" on public.task_assignees;
create policy "members_can_manage_task_assignees"
on public.task_assignees
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_view_task_labels" on public.task_labels;
create policy "members_can_view_task_labels"
on public.task_labels
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "members_can_manage_task_labels" on public.task_labels;
create policy "members_can_manage_task_labels"
on public.task_labels
for all
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "members_can_view_task_label_links" on public.task_label_links;
create policy "members_can_view_task_label_links"
on public.task_label_links
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_task_label_links" on public.task_label_links;
create policy "members_can_manage_task_label_links"
on public.task_label_links
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_view_task_comments" on public.task_comments;
create policy "members_can_view_task_comments"
on public.task_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_task_comments" on public.task_comments;
create policy "members_can_manage_task_comments"
on public.task_comments
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
      and author_user_id = auth.uid()
  )
);

drop policy if exists "members_can_view_task_attachments" on public.task_attachments;
create policy "members_can_view_task_attachments"
on public.task_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_manage_task_attachments" on public.task_attachments;
create policy "members_can_manage_task_attachments"
on public.task_attachments
for all
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
      and uploaded_by = auth.uid()
  )
);

drop policy if exists "members_can_view_task_activity_logs" on public.task_activity_logs;
create policy "members_can_view_task_activity_logs"
on public.task_activity_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.projects p on p.id = t.project_id
    where t.id = task_id
      and public.is_workspace_member(p.workspace_id)
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-files',
  'task-files',
  false,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

drop policy if exists "members_can_read_task_files" on storage.objects;
create policy "members_can_read_task_files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'task-files'
  and exists (
    select 1
    from public.task_attachments ta
    join public.tasks t on t.id = ta.task_id
    join public.projects p on p.id = t.project_id
    where ta.bucket_name = bucket_id
      and ta.storage_path = name
      and public.is_workspace_member(p.workspace_id)
  )
);

drop policy if exists "members_can_upload_task_files" on storage.objects;
create policy "members_can_upload_task_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'task-files'
);

drop policy if exists "members_can_delete_own_task_files" on storage.objects;
create policy "members_can_delete_own_task_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'task-files'
  and owner = auth.uid()
);
