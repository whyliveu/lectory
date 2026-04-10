-- Step 2: базовая схема БД для Lectory MVP

create extension if not exists pgcrypto;

create table if not exists disciplines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  teacher_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists lectures (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references disciplines(id) on delete cascade,
  lecture_date date not null,
  generated_title text not null,
  short_description text,
  status text not null default 'uploaded' check (status in ('uploaded','processing','ready','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lecture_summaries (
  lecture_id uuid primary key references lectures(id) on delete cascade,
  full_summary text,
  main_outline text,
  key_points jsonb not null default '[]'::jsonb,
  mentions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lecture_files (
  lecture_id uuid primary key references lectures(id) on delete cascade,
  file_name text not null,
  file_type text not null default 'srt',
  file_url text,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_disciplines_title on disciplines(title);
create index if not exists idx_disciplines_teacher on disciplines(teacher_name);
create index if not exists idx_lectures_date on lectures(lecture_date);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_lectures_updated_at on lectures;
create trigger set_lectures_updated_at
before update on lectures
for each row execute function update_updated_at_column();

drop trigger if exists set_lecture_summaries_updated_at on lecture_summaries;
create trigger set_lecture_summaries_updated_at
before update on lecture_summaries
for each row execute function update_updated_at_column();
