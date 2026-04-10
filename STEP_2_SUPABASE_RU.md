# Шаг 2 — подключаем Supabase (максимально просто)

## Что мы делаем
Подключаем облачную базу данных, чтобы хранить дисциплины, лекции, summary и исходные SRT.

## Зачем
Без БД данные будут "в памяти" и пропадут. С Supabase всё будет сохраняться и сразу готово к росту.

## Куда нажимать
1. Зайди на https://supabase.com
2. Нажми **Start your project** → авторизация (GitHub удобно).
3. Нажми **New project**.
4. Заполни:
   - Organization (можно Personal)
   - Project name: `lectory-mvp`
   - Region: ближайший
   - Database Password: сохрани в менеджер паролей
5. Нажми **Create new project** и подожди 1–2 минуты.

## Что сделать в проекте
1. В Supabase слева открой **SQL Editor**.
2. Нажми **New query**.
3. Скопируй содержимое файла `supabase/schema.sql` и нажми **Run**.
4. Ещё один **New query**.
5. Скопируй `supabase/seed.sql` и нажми **Run**.

## Подключение к Next.js
1. В Supabase открой **Project Settings → API**.
2. Скопируй:
   - `Project URL`
   - `anon public key`
3. В корне проекта создай файл `.env.local` и вставь:

```env
NEXT_PUBLIC_SUPABASE_URL=...твой URL...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...твой anon key...
```

4. Установи библиотеку:
```bash
npm install @supabase/supabase-js
```

## Как проверить
1. Перезапусти dev-сервер:
```bash
npm run dev
```
2. В Supabase открой **Table Editor**.
3. Ты должна увидеть 4 таблицы:
   - `disciplines`
   - `lectures`
   - `lecture_summaries`
   - `lecture_files`
4. В `disciplines` и `lectures` должны быть демо-строки (2 записи).

## Как понять ошибку
- Если в SQL ошибка: смотри красный текст в SQL Editor, обычно там строка и причина.
- Если в Next.js видишь предупреждение про env — проверь `.env.local`.
- Если данные не появились в таблицах — повторно выполни сначала `schema.sql`, потом `seed.sql`.
