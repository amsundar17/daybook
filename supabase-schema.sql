-- Daybook — Supabase/Postgres schema.
--
-- One-time setup:
--   1. Create a free project at https://supabase.com.
--   2. Open the SQL Editor and run this whole file once.
--   3. In Project Settings -> API, copy the "Project URL" and the "anon
--      public" key into Daybook's Settings tab.
--
-- Security note: this uses the permissive policies below (any request holding
-- your anon key can read/write), which matches a single-user personal app --
-- there is no login screen. Do not publish your anon key/URL publicly, and
-- don't commit them to a public git repo. If you later want real per-user
-- login, add Supabase Auth and change these policies to check auth.uid().

create table if not exists tasks (
  id text primary key,
  title text not null,
  notes text default '',
  due_date date,
  priority int default 2,
  done boolean default false,
  project_id text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists routines (
  id text primary key,
  title text not null,
  notes text default '',
  frequency text default 'daily',
  days_of_week jsonb default '[0,1,2,3,4,5,6]',
  log jsonb default '{}',
  best_streak int default 0,
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists projects (
  id text primary key,
  name text not null,
  type text default 'project',
  status text default 'active',
  due_date date,
  monthly_amount numeric,
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists content_items (
  id text primary key,
  title text not null,
  type text default 'video',
  stage text default 'idea',
  url text default '',
  notes text default '',
  created_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists people (
  id text primary key,
  name text not null,
  relationship text default '',
  notes text default '',
  last_contacted_at timestamptz,
  follow_up_date date,
  tags jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists library_items (
  id text primary key,
  type text default 'note',
  title text default '',
  body text not null,
  source text default '',
  tags jsonb default '[]',
  resurface_count int default 0,
  created_at timestamptz default now()
);

create table if not exists domains (
  id text primary key,
  name text not null,
  registrar text default '',
  renewal_date date,
  cost numeric default 0,
  linked_project_id text,
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists financial_accounts (
  id text primary key,
  name text not null,
  type text default 'checking',
  balance numeric default 0,
  created_at timestamptz default now()
);

create table if not exists financial_transactions (
  id text primary key,
  date date not null,
  description text not null,
  amount numeric not null,
  category text default 'uncategorized',
  account_id text,
  source text default 'manual',
  gmail_message_id text,
  created_at timestamptz default now()
);

-- Personal single-user app: allow the anon key full access to every table.
do $$
declare t text;
begin
  for t in select unnest(array[
    'tasks','routines','projects','content_items','people',
    'library_items','domains','financial_accounts','financial_transactions'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "anon full access" on %I;', t);
    execute format(
      'create policy "anon full access" on %I for all to anon using (true) with check (true);', t
    );
  end loop;
end $$;
