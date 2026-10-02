// СОБРАНО АВТОМАТИЧЕСКИ из worker.src.js и ../psychologists-data.js командой: node bot/sync-data.mjs
/**
 * Телеграм-бот «Рядом» — психологи онлайн. Cloudflare Worker.
 * Устроен как бот Salon de Fleur «Цветочная гостиная», но под психологическую платформу.
 *
 * Роль 1. Консультант: /start → приветствие и меню. Клиент смотрит психологов, подбирает их по теме,
 *         узнаёт цены и как проходит первая встреча, записывается прямо в чате.
 *         Любое другое сообщение уходит координатору; ответ координатора (Reply) бот пересылает клиенту.
 *         Если в сообщении есть признаки кризиса, бот сразу присылает телефоны экстренной помощи.
 * Роль 2. Уведомления: сайт отправляет заявки на POST /lead (запись, заявка психолога, подписка),
 *         бот присылает их координатору в личку.
 *
 * Переменные окружения (Settings → Variables and Secrets):
 *   BOT_TOKEN       — токен от @BotFather (секрет)
 *   ADMIN_CHAT_ID   — chat id координатора: напишите боту /id, он его покажет
 *   WEBHOOK_SECRET  — любая строка из латиницы и цифр, 20+ символов (секрет)
 *   SITE_URL        — адрес сайта, например https://ryadom.vercel.app/
 *   ALLOWED_ORIGIN  — откуда принимать заявки, например https://ryadom.vercel.app (через запятую можно несколько)
 *   SUPABASE_URL, SUPABASE_KEY — необязательно: куда сохранять записи, сделанные в боте.
 *                    По умолчанию — тот же проект Supabase, что и у сайта (публичный ключ, только запись).
 *
 * Маршруты:
 *   POST /webhook          — вебхук Телеграма
 *   POST /lead             — заявки с сайта
 *   GET  /setup?key=СЕКРЕТ — один раз: подключить вебхук и меню команд
 *   GET  /test-lead?key=СЕКРЕТ — прислать координатору тестовую заявку
 *   GET  /status           — проверка настроек без секретов
 */

const BRAND = {
  name: 'Рядом',
  sub: 'психологи онлайн',
  hours: 'ежедневно с 9:00 до 21:00 по Москве',
};

const SUPABASE_DEFAULT = {
  url: 'https://wuvadreohiphwevprwmk.supabase.co',
  key: 'sb_publishable_QnCBQILrqr6PhrAE8521NA_edLJSMA-',
};
const PHOTO_BASE = 'https://wuvadreohiphwevprwmk.supabase.co/storage/v1/object/public/ryadom/photos/';

/* ---------- данные (синхронизированы с psychologists-data.js сайта) ---------- */

const PSY = [ { "id": "anna-sokolova", "name": "Анна Соколова", "title": "Клинический психолог, КПТ-терапевт", "since": 2017, "tier": "middle", "topics": [ "anxiety", "depression", "burnout", "selfesteem" ], "approaches": [ "cbt", "act" ], "clients": [ "adults" ], "formats": [ "video", "chat" ], "city": null, "tagline": "Панические атаки, навязчивые мысли и постоянное «а вдруг»", "schedule": { "days": [ 0, 1, 2, 3, 4 ], "from": 10, "to": 20 } }, { "id": "mikhail-orlov", "name": "Михаил Орлов", "title": "Гештальт-терапевт", "since": 2010, "tier": "senior", "topics": [ "anger", "addiction", "crisis", "relationships", "burnout" ], "approaches": [ "gestalt", "existential" ], "clients": [ "adults" ], "formats": [ "video", "offline" ], "city": "Москва", "tagline": "Помогаю мужчинам говорить о том, о чём не принято", "schedule": { "days": [ 0, 1, 3, 5 ], "from": 12, "to": 21 } }, { "id": "ekaterina-lebedeva", "name": "Екатерина Лебедева", "title": "Семейный психолог, терапевт пар", "since": 2012, "tier": "senior", "topics": [ "couples", "relationships", "parenting", "crisis" ], "approaches": [ "family", "eft" ], "clients": [ "couples", "adults", "parents" ], "formats": [ "video", "offline" ], "city": "Санкт-Петербург", "tagline": "Для пар, которые ссорятся по кругу или отдалились", "schedule": { "days": [ 1, 2, 3, 4, 5 ], "from": 11, "to": 21 } }, { "id": "dmitry-kovalev", "name": "Дмитрий Ковалёв", "title": "Психолог, КПТ и ACT", "since": 2022, "tier": "junior", "topics": [ "burnout", "career", "anxiety", "selfesteem" ], "approaches": [ "cbt", "act" ], "clients": [ "adults" ], "formats": [ "video", "chat" ], "city": null, "tagline": "Выгорание, прокрастинация и перфекционизм — в IT и не только", "schedule": { "days": [ 0, 1, 2, 3, 4, 5 ], "from": 9, "to": 22 } }, { "id": "olga-morozova", "name": "Ольга Морозова", "title": "Психолог, психоаналитический терапевт", "since": 2002, "tier": "senior", "topics": [ "selfesteem", "relationships", "depression", "crisis" ], "approaches": [ "psychoanalytic" ], "clients": [ "adults" ], "formats": [ "video", "offline" ], "city": "Москва", "tagline": "Долгосрочная терапия для тех, кто хочет понять себя глубже", "schedule": { "days": [ 0, 1, 2, 3 ], "from": 10, "to": 18 } }, { "id": "maria-kim", "name": "Мария Ким", "title": "Детский и подростковый психолог", "since": 2022, "tier": "junior", "topics": [ "teens", "parenting", "anxiety", "selfesteem" ], "approaches": [ "cbt", "art" ], "clients": [ "teens", "parents" ], "formats": [ "video" ], "city": null, "tagline": "Подростки 12–17 лет и их родители", "schedule": { "days": [ 0, 1, 2, 3, 4, 5 ], "from": 13, "to": 20 } }, { "id": "aleksey-vorontsov", "name": "Алексей Воронцов", "title": "Травматерапевт, EMDR-терапевт", "since": 2015, "tier": "senior", "topics": [ "trauma", "grief", "anxiety" ], "approaches": [ "emdr", "somatic", "cbt" ], "clients": [ "adults" ], "formats": [ "video" ], "city": null, "tagline": "Последствия травмы: аварии, насилие, внезапные потери", "schedule": { "days": [ 0, 2, 4 ], "from": 9, "to": 19 } }, { "id": "natalia-belova", "name": "Наталья Белова", "title": "Психолог, схема-терапевт", "since": 2016, "tier": "middle", "topics": [ "selfesteem", "relationships", "eating", "depression" ], "approaches": [ "schema", "cbt" ], "clients": [ "adults" ], "formats": [ "video", "chat" ], "city": null, "tagline": "Внутренний критик, созависимость и отношения с едой", "schedule": { "days": [ 1, 2, 3, 6 ], "from": 10, "to": 20 } }, { "id": "svetlana-grigorieva", "name": "Светлана Григорьева", "title": "Экзистенциальный психолог, специалист по горю", "since": 1999, "tier": "senior", "topics": [ "grief", "crisis", "depression" ], "approaches": [ "existential", "person" ], "clients": [ "adults" ], "formats": [ "video", "offline" ], "city": "Екатеринбург", "tagline": "Утрата, большие перемены и вопрос «что дальше?»", "schedule": { "days": [ 0, 1, 2 ], "from": 11, "to": 17 } }, { "id": "kamila-yusupova", "name": "Камила Юсупова", "title": "Перинатальный психолог", "since": 2018, "tier": "middle", "topics": [ "perinatal", "anxiety", "parenting", "couples" ], "approaches": [ "perinatal", "cbt", "person" ], "clients": [ "adults", "couples", "parents" ], "formats": [ "video", "chat" ], "city": null, "tagline": "Беременность, роды и первые годы с ребёнком", "schedule": { "days": [ 0, 1, 2, 3, 4 ], "from": 9, "to": 15 } } ];

const TOPICS = {
  anxiety: 'Тревога и паника', depression: 'Апатия и нет сил', burnout: 'Выгорание', relationships: 'Отношения',
  couples: 'Кризис в паре', selfesteem: 'Самооценка', trauma: 'Травма', grief: 'Утрата и горе',
  teens: 'Подростки', parenting: 'Дети и родители', perinatal: 'Беременность и материнство',
  career: 'Работа и прокрастинация', anger: 'Злость и раздражение', addiction: 'Зависимости',
  eating: 'Отношения с едой', crisis: 'Перемены и кризисы',
};
const APPROACHES = {
  cbt: 'КПТ', act: 'ACT', gestalt: 'гештальт-терапия', existential: 'экзистенциальная терапия',
  family: 'системная семейная терапия', eft: 'эмоционально-фокусированная терапия',
  psychoanalytic: 'психоаналитическая терапия', art: 'арт-терапия', emdr: 'EMDR', somatic: 'телесно-ориентированная терапия',
  schema: 'схема-терапия', person: 'клиент-центрированная терапия', perinatal: 'перинатальная психология',
};
const CLIENTS = { adults: 'взрослые', couples: 'пары', teens: 'подростки 12–17 лет', parents: 'родители' };
const FORMATS = { video: 'видео', chat: 'чат', offline: 'очно' };
const PRICE = { junior: 2500, middle: 4250, senior: 6500 };
const COUPLE_PRICE = { junior: 3750, middle: 6400, senior: 9750 };

const SOS = '🆘 <b>Если сейчас очень тяжело</b>\n' +
  'Если есть мысли причинить себе вред или вам угрожает опасность — не ждите записи, позвоните прямо сейчас:\n\n' +
  '• <b>112</b> — единый номер экстренных служб\n' +
  '• <b>8 800 2000-122</b> — телефон доверия для детей, подростков и родителей, бесплатно\n' +
  '• <b>8 495 989-50-50</b> — экстренная психологическая помощь МЧС, круглосуточно\n\n' +
  'Психологи «Рядом» не оказывают экстренную помощь, но вы можете написать сюда — координатор ответит, как только сможет.';

// Признаки кризиса: бот не ставит диагнозов, а просто сразу показывает телефоны помощи и помечает сообщение для координатора.
const CRISIS_RE = /(суицид|самоубийств|покончить с собой|не хочу жить|не хочется жить|хочу умереть|убить себя|убью себя|навредить себе|причинить себе вред|порезать себя|режу себя|нет смысла жить|жить не хочу)/i;

/* ---------- утилиты ---------- */

const rub = (n) => Number(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const yearsWord = (n) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? 'год' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'года' : 'лет'; };
const byId = (id) => PSY.find((p) => p.id === id);
const siteUrl = (env, path = '') => (env.SITE_URL ? env.SITE_URL.replace(/\/?$/, '/') + path : '');
const CITY_IN = { 'Москва': 'Москве', 'Санкт-Петербург': 'Петербурге', 'Екатеринбург': 'Екатеринбурге' };

function mskNow() {
  // Cloudflare работает в UTC; расписание психологов — по Москве (UTC+3, без перехода на летнее время)
  return new Date(Date.now() + 3 * 3600 * 1000);
}
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// Та же логика свободных окон, что и на сайте: детерминированно из расписания, на 2 недели вперёд
function slots(p, max = 2) {
  const now = mskNow(), out = [];
  for (let d = 0; d < 14 && out.length < max; d++) {
    const date = new Date(now); date.setUTCDate(now.getUTCDate() + d);
    const wd = (date.getUTCDay() + 6) % 7;
    if (!p.schedule.days.includes(wd)) continue;
    const key = date.toISOString().slice(0, 10), times = [];
    for (let h = p.schedule.from; h < p.schedule.to; h++) {
      if (d === 0 && h <= now.getUTCHours() + 1) continue;
      if (hash(p.id + key + h) % 3 === 0) times.push(String(h).padStart(2, '0') + ':00');
    }
    if (times.length) {
      const label = d === 0 ? 'сегодня' : d === 1 ? 'завтра' : `${DAYS[wd]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
      out.push(`${label}: ${times.slice(0, 4).join(', ')}`);
    }
  }
  return out;
}

/* ---------- тексты и клавиатуры ---------- */

const MENU = [
  [{ text: '🧑‍⚕️ Психологи', callback_data: 'list' }, { text: '🧭 Подобрать по теме', callback_data: 'topics' }],
  [{ text: '💳 Цены и формат', callback_data: 'prices' }, { text: '🤝 Первая встреча', callback_data: 'first' }],
  [{ text: '🔒 Конфиденциальность', callback_data: 'privacy' }, { text: '🤖 ИИ-собеседник', callback_data: 'ai' }],
  [{ text: '📝 Записаться', callback_data: 'book' }],
  [{ text: '💬 Написать координатору', callback_data: 'coordinator' }, { text: '🆘 Срочная помощь', callback_data: 'sos' }],
];
const BACK = [[{ text: '« Меню', callback_data: 'menu' }]];

function greeting(firstName) {
  const hi = firstName ? `Здравствуйте, ${esc(firstName)}!` : 'Здравствуйте!';
  return `${hi} Это <b>${BRAND.name}</b> — ${BRAND.sub}.\n\n` +
    `У нас ${PSY.length} психологов с профильным образованием, личной терапией и супервизией. ` +
    'Встреча по видео — 50 минут, от 2 500 ₽.\n\n' +
    'Выберите, что вас интересует, или просто напишите, что происходит, — координатор поможет подобрать специалиста.';
}

function psyLine(p) {
  const exp = new Date().getFullYear() - p.since;
  return `${p.name} — ${rub(PRICE[p.tier])}, опыт ${exp} ${yearsWord(exp)}`;
}

function psyCard(p, env) {
  const exp = new Date().getFullYear() - p.since;
  const fmt = p.formats.map((f) => (f === 'offline' && p.city ? `очно в ${CITY_IN[p.city] || p.city}` : FORMATS[f])).join(', ');
  const free = slots(p);
  const couple = p.clients.includes('couples') ? `\nДля пары — ${rub(COUPLE_PRICE[p.tier])}, 90 минут` : '';
  return `<b>${esc(p.name)}</b>\n${esc(p.title)} · опыт ${exp} ${yearsWord(exp)}\n\n` +
    `<i>${esc(p.tagline)}</i>\n\n` +
    `🧩 ${p.topics.map((t) => TOPICS[t]).join(', ')}\n` +
    `📚 ${p.approaches.map((a) => APPROACHES[a]).join(', ')}\n` +
    `👥 ${p.clients.map((c) => CLIENTS[c]).join(', ')}\n` +
    `💻 ${fmt}\n` +
    `💳 <b>${rub(PRICE[p.tier])}</b> за 50 минут${couple}\n` +
    (free.length ? `\n🗓 Ближайшие окна (МСК):\n${free.map((s) => '• ' + s).join('\n')}` : '');
}

function psyKeyboard(p, env) {
  const rows = [[{ text: `📝 Записаться к ${p.name.split(' ')[0]}`, callback_data: 'b:' + p.id }]];
  const url = siteUrl(env, 'psychologist.html?id=' + p.id);
  if (url) rows.push([{ text: '🌐 Анкета на сайте', url }]);
  rows.push([{ text: '« Все психологи', callback_data: 'list' }, { text: '« Меню', callback_data: 'menu' }]);
  return rows;
}

function listKeyboard(list) {
  return [...list.map((p) => [{ text: psyLine(p), callback_data: 'p:' + p.id }]), ...BACK];
}

function topicsKeyboard() {
  const keys = Object.keys(TOPICS), rows = [];
  for (let i = 0; i < keys.length; i += 2) {
    rows.push(keys.slice(i, i + 2).map((k) => ({ text: TOPICS[k], callback_data: 't:' + k })));
  }
  rows.push([{ text: 'Пока не знаю', callback_data: 'coordinator' }]);
  return [...rows, ...BACK];
}

function section(key, env) {
  const site = env.SITE_URL ? `\n\n<a href="${esc(env.SITE_URL)}">Открыть сайт</a>` : '';
  switch (key) {
    case 'prices':
      return '<b>Цены и формат</b>\n' +
        `• до 5 лет практики — ${rub(PRICE.junior)}\n• 5–10 лет — ${rub(PRICE.middle)}\n• больше 10 лет — ${rub(PRICE.senior)}\n` +
        '• встреча для пары — в 1,5 раза дороже и длится 90 минут\n\n' +
        'Встреча по видео — 50 минут. У некоторых психологов можно в чате или очно.\n' +
        'Первая встреча — со скидкой 20%. Если контакт не сложился, специалиста можно бесплатно сменить.' + site;
    case 'first':
      return '<b>Как проходит первая встреча</b>\n' +
        '1. Вы выбираете психолога и время или пишете координатору — он поможет подобрать.\n' +
        '2. Координатор подтверждает запись и присылает ссылку на видеовстречу.\n' +
        '3. 50 минут знакомства: вы рассказываете, что происходит, психолог — как может помочь и сколько примерно встреч понадобится.\n\n' +
        'Готовиться специально не нужно. Найдите тихое место, где вас не услышат, и проверьте звук и камеру.';
    case 'privacy':
      return '<b>Конфиденциальность</b>\n' +
        'Психологи соблюдают профессиональную этику, встречи не записываются. ' +
        'Сообщения в этом чате видит только координатор.\n\n' +
        'Психолог — не врач: он не ставит диагнозы и не назначает лекарства. ' +
        'Если увидит, что нужна медицинская помощь, скажет об этом.';
    case 'ai':
      return '<b>ИИ-собеседник</b>\n' +
        'Голосовой собеседник для поддержки между встречами: выговориться, успокоиться, разобраться в мыслях, ' +
        'сформулировать запрос к психологу. Сейчас он в демо-режиме — живой разговор пока недоступен.\n\n' +
        'Он не ставит диагнозы и не заменяет терапию.' +
        (env.SITE_URL ? `\n\n<a href="${esc(siteUrl(env, 'ai.html'))}">Подробнее на сайте</a>` : '');
    case 'coordinator':
      return 'Напишите сюда, что происходит или какой нужен специалист, — можно голосовым. ' +
        `Координатор ответит в этом чате (${BRAND.hours}).\n\n` +
        'Сообщения видит только координатор.';
    case 'book':
      return '<b>Записаться на встречу</b>\nВыберите психолога — или нажмите «Помогите подобрать», и координатор предложит варианты.';
    case 'sos':
      return SOS;
    default:
      return null;
  }
}

/* ---------- Telegram API ---------- */

const tokenOf = (env) => env.BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;

async function tg(env, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${tokenOf(env)}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.log('telegram error', method, JSON.stringify(data));
  return data;
}

const send = (env, chat_id, text, keyboard, extra = {}) =>
  tg(env, 'sendMessage', {
    chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
    ...extra,
  });

/* ---------- Supabase: записи из бота попадают в ту же таблицу, что и с сайта ---------- */

async function saveBooking(env, row) {
  const url = env.SUPABASE_URL || SUPABASE_DEFAULT.url;
  const key = env.SUPABASE_KEY || SUPABASE_DEFAULT.key;
  try {
    const r = await fetch(`${url}/rest/v1/bookings`, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json', prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
    if (r.status !== 201) console.log('supabase error', r.status, await r.text().catch(() => ''));
    return r.status === 201;
  } catch (e) {
    console.log('supabase error', e?.message || e);
    return false;
  }
}

/* ---------- роль 1: консультант ---------- */

function clientLabel(from) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Без имени';
  return esc(name) + (from.username ? ` (@${esc(from.username)})` : '');
}

// Метка #id<число> позволяет координатору ответить через Reply без базы данных.
const tagFor = (chatId) => `#id${chatId}`;
const tagRe = /#id(-?\d+)/;
// Метка записи в подсказке бота: клиент отвечает на неё — и бот понимает, к кому запись.
const BOOK_TAG = /#запись:([a-z-]+|any)/;

function bookingPrompt(p) {
  const who = p ? `к психологу <b>${esc(p.name)}</b>` : 'к психологу, которого поможет подобрать координатор';
  const free = p ? slots(p, 3) : [];
  return `📝 Запись ${who}\n\n` +
    (free.length ? `Ближайшие окна (МСК):\n${free.map((s) => '• ' + s).join('\n')}\n\n` : '') +
    '<b>Ответьте на это сообщение</b> одним текстом:\n' +
    '1. Как к вам обращаться\n2. Телефон или Telegram для связи\n3. Удобное время\n4. Коротко, с чем хотите прийти (по желанию)\n\n' +
    '<i>Отправляя ответ, вы соглашаетесь на обработку персональных данных для связи по заявке.</i>\n' +
    `#запись:${p ? p.id : 'any'}`;
}

async function forwardToCoordinator(env, msg, { crisis = false, booking = null } = {}) {
  const title = booking ? '📝 <b>Запись через бота</b>' : crisis ? '🚨 <b>Возможна кризисная ситуация</b>' : '💬 <b>Клиент пишет в бот</b>';
  const header = `${title}\n${clientLabel(msg.from)}\n` + (booking ? `Психолог: <b>${esc(booking.name || 'помочь подобрать')}</b>\n` : '') +
    (crisis ? '<i>Клиенту автоматически отправлены телефоны экстренной помощи.</i>\n' : '');
  const footer = `\n\n<i>Ответьте (Reply) на это сообщение — бот перешлёт ответ клиенту.</i>\n${tagFor(msg.chat.id)}`;

  if (msg.text) return send(env, env.ADMIN_CHAT_ID, header + '\n' + esc(msg.text) + footer);
  const canCaption = msg.photo || msg.video || msg.document || msg.voice || msg.audio || msg.animation;
  if (canCaption) {
    return tg(env, 'copyMessage', {
      chat_id: env.ADMIN_CHAT_ID, from_chat_id: msg.chat.id, message_id: msg.message_id,
      caption: header + (msg.caption ? '\n' + esc(msg.caption) : '') + footer, parse_mode: 'HTML',
    });
  }
  await tg(env, 'copyMessage', { chat_id: env.ADMIN_CHAT_ID, from_chat_id: msg.chat.id, message_id: msg.message_id });
  return send(env, env.ADMIN_CHAT_ID, header + footer);
}

async function handleBookingReply(env, msg, psyId) {
  const p = psyId === 'any' ? null : byId(psyId);
  const text = clip(msg.text || msg.caption || '', 1500);
  if (text.length < 3) {
    return send(env, msg.chat.id, 'Напишите, пожалуйста, текстом: имя, контакт и удобное время.', null,
      { reply_markup: { force_reply: true, input_field_placeholder: 'Имя, телефон, удобное время' } });
  }
  const from = msg.from || {};
  const name = clip([from.first_name, from.last_name].filter(Boolean).join(' ') || 'Клиент из Telegram', 100);
  const contact = from.username ? `@${from.username}` : `tg://user?id=${from.id}`;
  await saveBooking(env, {
    name, contact: clip(contact, 120), psychologist: p ? p.name : null, topic: null,
    preferred_time: null, message: clip('[Telegram] ' + text, 1500), slot: null, consent: true,
  });
  const r = await forwardToCoordinator(env, msg, { booking: { name: p?.name }, crisis: CRISIS_RE.test(text) });
  if (CRISIS_RE.test(text)) await send(env, msg.chat.id, SOS);
  if (r?.ok) {
    return send(env, msg.chat.id,
      `Спасибо! Заявка ${p ? `к психологу ${esc(p.name)} ` : ''}принята — координатор свяжется в течение рабочего дня и подтвердит время.`, BACK);
  }
  return send(env, msg.chat.id, 'Не получилось передать заявку. Попробуйте ещё раз чуть позже или оставьте её на сайте.', BACK);
}

async function handleClientMessage(env, msg) {
  const text = (msg.text || '').trim();
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : null;

  if (cmd === '/start') {
    // ссылка вида t.me/бот?start=psy_anna-sokolova открывает сразу анкету психолога
    const arg = text.split(/\s+/)[1] || '';
    const p = arg.startsWith('psy_') ? byId(arg.slice(4)) : null;
    if (p) return sendPsy(env, msg.chat.id, p);
    if (arg === 'book') return send(env, msg.chat.id, section('book', env), bookKeyboard());
    return send(env, msg.chat.id, greeting(msg.from?.first_name), MENU);
  }
  if (cmd === '/menu') return send(env, msg.chat.id, greeting(msg.from?.first_name), MENU);
  if (cmd === '/psychologists') return send(env, msg.chat.id, '<b>Психологи «Рядом»</b>\nНажмите на имя, чтобы открыть анкету.', listKeyboard(PSY));
  if (cmd === '/book') return send(env, msg.chat.id, section('book', env), bookKeyboard());
  if (cmd === '/help' || cmd === '/sos') return send(env, msg.chat.id, SOS, BACK);
  if (cmd === '/id') return send(env, msg.chat.id, `Ваш chat id: <code>${msg.chat.id}</code>`);
  if (cmd) return send(env, msg.chat.id, 'Такой команды нет. Вот меню:', MENU);

  // ответ на подсказку записи
  const replied = msg.reply_to_message;
  const bm = replied?.from?.is_bot && (replied.text || '').match(BOOK_TAG);
  if (bm) return handleBookingReply(env, msg, bm[1]);

  const crisis = CRISIS_RE.test(text + ' ' + (msg.caption || ''));
  if (crisis) await send(env, msg.chat.id, SOS);
  const r = await forwardToCoordinator(env, msg, { crisis });
  if (r?.ok) {
    return send(env, msg.chat.id, crisis
      ? 'Ваше сообщение передано координатору. Пожалуйста, если опасность прямо сейчас — позвоните 112.'
      : 'Спасибо! Передали координатору, ответ придёт в этот чат.', BACK);
  }
  return send(env, msg.chat.id, 'Не получилось передать сообщение. Попробуйте ещё раз чуть позже или оставьте заявку на сайте.' +
    (env.SITE_URL ? `\n${esc(env.SITE_URL)}` : ''));
}

function bookKeyboard() {
  return [
    ...PSY.map((p) => [{ text: psyLine(p), callback_data: 'b:' + p.id }]),
    [{ text: '🤝 Помогите подобрать', callback_data: 'b:any' }],
    ...BACK,
  ];
}

async function sendPsy(env, chatId, p) {
  const caption = psyCard(p, env);
  const kb = { inline_keyboard: psyKeyboard(p, env) };
  // подпись к фото ограничена 1024 символами — карточка в неё помещается
  // Фото лежат в webp; Телеграм надёжнее принимает jpg, поэтому сначала берём jpg-копию через wsrv.nl,
  // затем оригинал, а если не вышло — отправляем карточку текстом.
  const src = PHOTO_BASE + p.id + '.webp';
  for (const photo of [`https://wsrv.nl/?url=${encodeURIComponent(src)}&output=jpg&w=900`, src]) {
    const r = await tg(env, 'sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', reply_markup: kb });
    if (r?.ok) return r;
  }
  return send(env, chatId, caption, kb.inline_keyboard);
}

async function handleCoordinatorMessage(env, msg) {
  const text = (msg.text || '').trim();
  if (text === '/start' || text === '/menu') {
    return send(env, msg.chat.id,
      'Вы координатор этого бота.\n\n• Заявки с сайта, записи из бота и сообщения клиентов приходят сюда.\n' +
      '• Чтобы ответить клиенту, нажмите <b>Ответить (Reply)</b> на его сообщение — можно текстом, фото или голосом.\n' +
      '• Сообщения с пометкой 🚨 — возможная кризисная ситуация: клиенту уже отправлены телефоны помощи, ответьте как можно скорее.\n' +
      '• /client — посмотреть меню глазами клиента.');
  }
  if (text === '/client') return send(env, msg.chat.id, greeting(msg.from?.first_name), MENU);
  if (text === '/id') return send(env, msg.chat.id, `Ваш chat id: <code>${msg.chat.id}</code>`);

  const replied = msg.reply_to_message;
  const source = replied && (replied.text || replied.caption || '');
  const m = source && source.match(tagRe);
  if (!m) return send(env, msg.chat.id, 'Чтобы ответить клиенту, нажмите «Ответить» (Reply) на его сообщение.');
  const r = await tg(env, 'copyMessage', { chat_id: m[1], from_chat_id: msg.chat.id, message_id: msg.message_id });
  return send(env, msg.chat.id, r?.ok ? '✅ Отправлено клиенту' : '⚠️ Не доставлено: клиент мог заблокировать бота.');
}

async function handleCallback(env, cq) {
  const chatId = cq.message?.chat?.id;
  await tg(env, 'answerCallbackQuery', { callback_query_id: cq.id });
  if (!chatId) return;
  const data = cq.data || '';

  if (data === 'menu') return send(env, chatId, greeting(cq.from?.first_name), MENU);
  if (data === 'list') return send(env, chatId, '<b>Психологи «Рядом»</b>\nНажмите на имя, чтобы открыть анкету.', listKeyboard(PSY));
  if (data === 'topics') return send(env, chatId, '<b>С чем нужна помощь?</b>\nВыберите тему — покажем психологов, которые с ней работают.', topicsKeyboard());
  if (data === 'book') return send(env, chatId, section('book', env), bookKeyboard());
  if (data.startsWith('t:')) {
    const t = data.slice(2), list = PSY.filter((p) => p.topics.includes(t));
    if (!TOPICS[t]) return;
    return send(env, chatId, list.length
      ? `<b>${TOPICS[t]}</b>\nС этой темой работают:`
      : `<b>${TOPICS[t]}</b>\nПока никого — напишите координатору, он подберёт специалиста.`,
    [...list.map((p) => [{ text: psyLine(p), callback_data: 'p:' + p.id }]), [{ text: '« Все темы', callback_data: 'topics' }], ...BACK]);
  }
  if (data.startsWith('p:')) {
    const p = byId(data.slice(2));
    if (p) return sendPsy(env, chatId, p);
    return;
  }
  if (data.startsWith('b:')) {
    const id = data.slice(2), p = id === 'any' ? null : byId(id);
    if (id !== 'any' && !p) return;
    return send(env, chatId, bookingPrompt(p), null,
      { reply_markup: { force_reply: true, input_field_placeholder: 'Имя, телефон или @ник, удобное время' } });
  }
  const text = section(data, env);
  if (text) return send(env, chatId, text, BACK);
}

async function handleUpdate(env, update) {
  if (update.callback_query) return handleCallback(env, update.callback_query);
  const msg = update.message;
  if (!msg || msg.chat?.type !== 'private') return;
  if (String(msg.chat.id) === String(env.ADMIN_CHAT_ID)) return handleCoordinatorMessage(env, msg);
  return handleClientMessage(env, msg);
}

/* ---------- роль 2: уведомления о заявках с сайта ---------- */

function formatLead(d) {
  const type = d.type || 'booking';
  const lines = [];
  if (type === 'subscribe') {
    const what = { letters: 'письма по воскресеньям', ai_waitlist: 'лист ожидания ИИ-собеседника', research: 'обновления исследования' }[d.source] || 'рассылка';
    lines.push('✉️ <b>Новая подписка</b>', '', `${esc(clip(d.email, 200))} — ${what}`);
  } else if (type === 'application') {
    lines.push('🎓 <b>Заявка психолога в команду</b>', '');
    lines.push(`👤 ${esc(clip(d.name, 120)) || '—'}`);
    lines.push(`📞 ${esc(clip(d.contact, 120)) || '—'}`);
    if (d.experience) lines.push(`🕰 Опыт: ${esc(clip(d.experience, 40))}`);
    if (d.approach) lines.push(`📚 Подход: ${esc(clip(d.approach, 80))}`);
    if (d.topics) lines.push('', `🧩 ${esc(clip(d.topics, 1500))}`);
  } else {
    lines.push('📝 <b>Новая запись с сайта</b>', '');
    lines.push(`👤 ${esc(clip(d.name, 100)) || '—'}`);
    lines.push(`📞 ${esc(clip(d.contact, 120)) || '—'}`);
    lines.push(`🧑‍⚕️ ${esc(clip(d.psychologist, 100)) || 'помочь подобрать'}`);
    if (d.topic) lines.push(`🧩 ${esc(clip(d.topic, 100))}`);
    if (d.slot) lines.push(`🗓 ${esc(clip(d.slot, 60))}`);
    else if (d.preferred_time) lines.push(`🗓 ${esc(clip(d.preferred_time, 100))}`);
    if (d.message) {
      const m = clip(d.message, 1500);
      lines.push('', `💬 ${esc(m)}`);
      if (CRISIS_RE.test(m)) lines.splice(1, 0, '🚨 <b>В сообщении есть признаки кризиса — свяжитесь как можно скорее</b>');
    }
  }
  lines.push('', `<i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} МСК</i>`);
  return lines.join('\n');
}

function cors(env, request) {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '*').split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => (s === '*' ? s : s.replace(/^(https?:\/\/[^/]+).*$/i, '$1').toLowerCase()));
  if (!allowed.length) allowed.push('*');
  const ok = allowed.includes('*') || allowed.includes(origin.toLowerCase());
  return {
    'access-control-allow-origin': ok ? (allowed.includes('*') ? '*' : origin) : 'null',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  };
}

const json = (obj, status, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

async function handleLead(request, env) {
  const h = cors(env, request);
  if (h['access-control-allow-origin'] === 'null') {
    console.log('lead rejected: origin', request.headers.get('origin'), 'allowed', env.ALLOWED_ORIGIN);
    return json({ ok: false, error: 'origin' }, 403, { ...h, 'access-control-allow-origin': request.headers.get('origin') || '*' });
  }
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'bad json' }, 400, h); }
  if (d.website) return json({ ok: true }, 200, h); // ловушка для ботов
  const type = d.type || 'booking';
  if (type === 'subscribe') {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clip(d.email, 200))) return json({ ok: false, error: 'Укажите email' }, 422, h);
  } else if (clip(d.contact, 120).length < 3) {
    return json({ ok: false, error: 'Укажите телефон или Telegram' }, 422, h);
  }
  if (!env.ADMIN_CHAT_ID) return json({ ok: false, error: 'admin_chat_id' }, 500, h);
  const r = await send(env, env.ADMIN_CHAT_ID, formatLead(d));
  return r?.ok ? json({ ok: true }, 200, h) : json({ ok: false, error: 'telegram: ' + (r?.description || 'нет ответа') }, 502, h);
}

/* ---------- маршрутизация ---------- */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if ((url.pathname === '/webhook' || url.pathname === '/telegram') && request.method === 'POST') {
      if (!env.WEBHOOK_SECRET || request.headers.get('x-telegram-bot-api-secret-token') !== env.WEBHOOK_SECRET) {
        return new Response('forbidden', { status: 403 });
      }
      const update = await request.json().catch(() => null);
      if (update) ctx.waitUntil(handleUpdate(env, update).catch((e) => console.log('update error', e?.stack || e)));
      return new Response('ok');
    }

    if (url.pathname === '/lead') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, request) });
      if (request.method === 'POST') return handleLead(request, env);
    }

    if (url.pathname === '/setup') {
      if (!env.WEBHOOK_SECRET || url.searchParams.get('key') !== env.WEBHOOK_SECRET) {
        return new Response('Нужен параметр ?key=WEBHOOK_SECRET', { status: 403 });
      }
      const hook = await tg(env, 'setWebhook', {
        url: `${url.origin}/webhook`, secret_token: env.WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query'], drop_pending_updates: true,
      });
      const cmds = await tg(env, 'setMyCommands', {
        commands: [
          { command: 'start', description: 'Приветствие и меню' },
          { command: 'psychologists', description: 'Все психологи' },
          { command: 'book', description: 'Записаться на встречу' },
          { command: 'sos', description: 'Срочная помощь: телефоны' },
          { command: 'menu', description: 'Показать меню' },
        ],
      });
      const desc = await tg(env, 'setMyDescription', {
        description: 'Психологи онлайн «Рядом». Подберём специалиста по вашему запросу, расскажем о ценах и запишем на видеовстречу. Если сейчас очень тяжело — звоните 112.',
      });
      const short = await tg(env, 'setMyShortDescription', { short_description: 'Психологи онлайн: подбор и запись на встречу' });
      const me = await tg(env, 'getMe', {});
      return json({ webhook: hook, commands: cmds, description: desc?.ok && short?.ok, bot: me.result?.username,
        admin_chat_id: env.ADMIN_CHAT_ID || 'не задан — напишите боту /id' }, 200);
    }

    if (url.pathname === '/test-lead') {
      if (!env.WEBHOOK_SECRET || url.searchParams.get('key') !== env.WEBHOOK_SECRET) {
        return new Response('Нужен параметр ?key=WEBHOOK_SECRET', { status: 403 });
      }
      if (!env.ADMIN_CHAT_ID) return json({ ok: false, error: 'ADMIN_CHAT_ID не задан' }, 500);
      const r = await send(env, env.ADMIN_CHAT_ID, formatLead({
        type: 'booking', name: 'Тестовая заявка', contact: '+7 000 000-00-00', psychologist: 'Проверка связи сайта и бота',
      }));
      return json({ ok: !!r?.ok, telegram: r?.ok ? 'отправлено' : (r?.description || 'нет ответа') }, r?.ok ? 200 : 502);
    }

    if (url.pathname === '/status') {
      const info = tokenOf(env) ? await tg(env, 'getWebhookInfo', {}) : null;
      const me = tokenOf(env) ? await tg(env, 'getMe', {}) : null;
      return json({
        token: tokenOf(env) ? 'задан' : 'НЕ ЗАДАН',
        bot: me?.result?.username || null,
        webhook_url: info?.result?.url || 'не подключён',
        webhook_points_here: info?.result?.url === `${url.origin}/webhook`,
        pending_updates: info?.result?.pending_update_count ?? null,
        last_error: info?.result?.last_error_message || null,
        admin_chat_id: env.ADMIN_CHAT_ID ? 'задан' : 'НЕ ЗАДАН',
        webhook_secret: env.WEBHOOK_SECRET ? 'задан' : 'НЕ ЗАДАН',
        allowed_origin: env.ALLOWED_ORIGIN || '* (любой сайт)',
        psychologists: PSY.length,
        version: 'ryadom-1',
      }, 200);
    }

    return new Response(`${BRAND.name} — ${BRAND.sub}: бот работает`, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};

// для тестов
export { formatLead, section, handleUpdate, slots, psyCard, PSY, CRISIS_RE };
