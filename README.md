# Рядом — психологи онлайн

Статический одностраничный сайт (index.html) + vercel.json.

Формы записи и подписки пишут в Supabase (проект wuvadreohiphwevprwmk):
- таблица `bookings` — заявки на запись;
- таблица `subscribers` — email подписчиков (уникальные).

Публичный ключ в коде даёт только право INSERT (RLS), читать данные через сайт нельзя.
Заявки смотреть: Supabase → Table Editor.

## Деплой на Vercel
    npx vercel --prod
или импорт репозитория на vercel.com/new (Framework: Other, без сборки).
