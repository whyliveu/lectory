# Безопасное решение конфликта `package.json`

## Что обычно конфликтует
В `package.json` чаще всего конфликтуют:
1. раздел `dependencies` (кто-то добавил новый пакет),
2. раздел `scripts` (разные команды),
3. версии одних и тех же библиотек.

Для Lectory сейчас безопасный минимум:
- оставить текущие версии Next/React,
- оставить Tailwind + TypeScript + ESLint,
- добавить только один новый пакет для БД: `@supabase/supabase-js`.

## Итоговый вариант `package.json` (рекомендуемый)
Используйте именно этот файл как финальный при ручном merge:

```json
{
  "name": "lectory",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "2.49.8"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.19",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "8.4.39",
    "tailwindcss": "3.4.7",
    "typescript": "5.5.3"
  }
}
```

## Как безопасно нажимать в GitHub UI
1. Открой конфликтующий PR.
2. Нажми **Resolve conflicts**.
3. Найди блок `package.json` с маркерами `<<<<<<<`, `=======`, `>>>>>>>`.
4. Удали маркеры и вставь рекомендованный JSON выше.
5. Нажми **Mark as resolved**.
6. Нажми **Commit merge**.

## Как проверить, что всё ок
Локально в терминале:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')"
npm install
npm run dev
```

Если первая команда пишет `package.json valid`, значит JSON корректный.
