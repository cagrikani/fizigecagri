begin;

with seed_owner as (
  select id
  from auth.users
  order by created_at asc
  limit 1
)
insert into public.workspaces (slug, name, description, owner_user_id, is_personal)
select
  'benim-site',
  'Benim Site',
  'Tum projeleri tek yerden yonetmek icin ana calisma alani.',
  seed_owner.id,
  false
from seed_owner
on conflict (slug) do nothing;

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, seed_owner.id, 'owner'
from public.workspaces w
cross join (
  select id
  from auth.users
  order by created_at asc
  limit 1
) as seed_owner
where w.slug = 'benim-site'
on conflict (workspace_id, user_id) do nothing;

insert into public.projects (workspace_id, slug, name, description, color, status, created_by)
select
  w.id,
  seed.slug,
  seed.name,
  seed.description,
  seed.color,
  'active',
  seed_owner.id
from public.workspaces w
cross join (
  select id
  from auth.users
  order by created_at asc
  limit 1
) as seed_owner
cross join (
  values
    ('is-takibi', 'İş Takibi', 'PDF görev paylaşımı ve süreç yönetimi için ana pano.', '#f97316')
) as seed(slug, name, description, color)
where w.slug = 'benim-site'
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
where p.slug in ('is-takibi')
on conflict (project_id, status_key) do nothing;

insert into public.task_labels (workspace_id, name, color)
select w.id, l.name, l.color
from public.workspaces w
cross join (
  values
    ('oncelikli', '#ef4444'),
    ('ui', '#3b82f6'),
    ('backend', '#10b981'),
    ('veritabani', '#8b5cf6'),
    ('test', '#f59e0b')
) as l(name, color)
where w.slug = 'benim-site'
on conflict (workspace_id, name) do nothing;

insert into public.tasks (
  project_id,
  column_id,
  title,
  description,
  status,
  priority,
  sort_order,
  reporter_user_id,
  due_date,
  estimated_minutes
)
select
  p.id,
  pc.id,
  t.title,
  t.description,
  t.status::public.task_status,
  t.priority::public.task_priority,
  t.sort_order,
  seed_owner.id,
  t.due_date,
  t.estimated_minutes
from public.projects p
join public.project_columns pc
  on pc.project_id = p.id
 and pc.status_key = 'todo'
cross join (
  select id
  from auth.users
  order by created_at asc
  limit 1
) as seed_owner
cross join (
  values
    ('Supabase kurulumunu tamamla', 'Schema ve seed dosyalarini dogrulayip veri akislarini ac.', 'todo', 'urgent', 1000, current_date + 1, 60),
    ('Ilk panel ekranini tasarla', 'Proje listesi, gorev panosu ve filtreler icin ilk arayuzu hazirla.', 'todo', 'high', 2000, current_date + 3, 180),
    ('Bildirim altyapisini planla', 'Yorum ve atama hareketleri icin bildirim stratejisini netlestir.', 'todo', 'medium', 3000, current_date + 5, 90)
) as t(title, description, status, priority, sort_order, due_date, estimated_minutes)
where p.slug = 'is-takibi'
on conflict do nothing;

commit;
