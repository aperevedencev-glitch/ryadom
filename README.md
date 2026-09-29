# Рядом — психологи онлайн

Статический сайт без сборки, готов к деплою на Vercel (Framework: Other).

## Страницы
| Адрес | Файл | Что там |
|---|---|---|
| `/` | index.html | Главная: темы, психологи, журнал, запись, FAQ, подписка |
| `/psychologists` | psychologists.html | Каталог с фильтрами и сортировкой, запись на конкретное время |
| `/psychologist?id=…` | psychologist.html | Анкета психолога |
| `/ai` | ai.html | ИИ-собеседник (демо) + лист ожидания |
| `/blog`, `/article?slug=…` | blog.html, article.html | Журнал с поиском и 9 статьями |
| `/analytics` | analytics.html | Калькулятор дохода психолога + подписка на исследование |
| `/join` | join.html | Отбор и заявка психолога |

Общее: `styles.css`, `common.js` (данные психологов, шапка/подвал, формы), `articles.js` (статьи).

## Формы → Supabase (проект wuvadreohiphwevprwmk)
- `bookings` — записи на встречу (в т.ч. выбранный слот);
- `subscribers` — email + `source`: `letters` (письма), `ai_waitlist` (ИИ), `research` (исследование);
- `psychologist_applications` — заявки психологов.

Публичный ключ в коде даёт только INSERT (RLS), читать данные с сайта нельзя.
Смотреть заявки: Supabase → Table Editor.
