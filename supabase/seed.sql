-- Step 2: демо-данные для двух первых лекций

insert into disciplines (title, teacher_name)
values
  ('Философия науки', 'Ирина Смирнова'),
  ('Культурология', 'Алексей Борисов')
on conflict do nothing;

with d as (
  select id, title from disciplines
)
insert into lectures (discipline_id, lecture_date, generated_title, short_description, status)
select id, '2026-03-11', 'Научные революции и смена парадигм', 'Разобрали идеи Томаса Куна и почему наука развивается рывками.', 'ready'
from d where title = 'Философия науки'
union all
select id, '2026-03-18', 'Миф как язык культуры', 'Поговорили о мифе как системе смыслов и социальной памяти.', 'ready'
from d where title = 'Культурология'
on conflict do nothing;
