alter table lecture_summaries
add column if not exists tags jsonb not null default '[]'::jsonb;

alter table lecture_summaries
add column if not exists interesting_notes jsonb not null default '[]'::jsonb;
