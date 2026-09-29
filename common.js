/* ===== Рядом: общие данные, шапка, подвал, формы ===== */
const SUPABASE_URL = "https://wuvadreohiphwevprwmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_QnCBQILrqr6PhrAE8521NA_edLJSMA-";

const TOPICS = ["Тревога и паника","Нет сил","Выгорание","Отношения","Кризис в паре","Самооценка","Травма","Утрата и горе","Подростки","Дети и родители","Беременность и материнство","Работа и прокрастинация","Злость и раздражение","Зависимости","Отношения с едой","Перемены и кризисы"];
const AUDIENCE = {me:"Мне", pair:"Паре", teen:"Подростку", parent:"Родителю"};
const FORMATS = {video:"Видео", chat:"Чат", offline:"Очно"};

const PSY = [
  {id:"vera-gromova", name:"Вера Громова", g:"f", role:"Клинический психолог, КПТ-терапевт", exp:11, aud:["me"], audText:"Взрослые", formats:["video","chat"], approaches:["КПТ"], price:4500, color:"#FBEADB",
   quote:"Тревога, панические атаки и мысли, которые крутятся по кругу", topics:["Тревога и паника","Нет сил","Выгорание","Самооценка"], slots:[[0,["19:30"]],[1,["10:00","15:00","18:00"]]],
   about:"Работаю с тревогой в самых разных формах: от постоянного «а вдруг» до панических атак, из-за которых человек перестаёт ездить в метро. Вместе разбираем, что запускает тревогу, и пробуем новые способы с ней обходиться — сначала на встречах, потом в жизни.",
   edu:["МГУ им. Ломоносова, факультет психологии — клиническая психология","Программа подготовки КПТ-терапевтов, 2 года","Регулярная супервизия с 2016 года"]},
  {id:"artem-belov", name:"Артём Белов", g:"m", role:"Экзистенциальный терапевт", exp:18, aud:["me"], audText:"Взрослые", formats:["video","offline"], city:"Москве", approaches:["Экзистенциальная терапия"], price:6000, color:"#DDEFE8",
   quote:"Когда привычная жизнь закончилась, а новая ещё не началась", topics:["Перемены и кризисы","Утрата и горе","Нет сил"], slots:[[1,["10:00","12:00"]],[3,["11:00","16:00"]]],
   about:"Помогаю в периоды, когда рушится привычный порядок: переезд, развод, уход с работы, потеря близкого. Не тороплю и не даю готовых ответов — помогаю найти свои.",
   edu:["СПбГУ, психологический факультет","Экзистенциальная психотерапия, 4-летняя программа","Личная терапия более 300 часов"]},
  {id:"natalya-shevchenko", name:"Наталья Шевченко", g:"f", role:"Семейный терапевт, терапевт пар", exp:13, aud:["pair","parent","me"], audText:"Пары, взрослые, родители", formats:["video","offline"], city:"Петербурге", approaches:["Системная семейная терапия","Эмоционально-фокусированная терапия"], price:5500, color:"#E6E3F3",
   quote:"Для пар, которые устали ссориться по одному и тому же сценарию", topics:["Кризис в паре","Отношения","Дети и родители","Перемены и кризисы"], slots:[[0,["20:00"]],[1,["11:00","14:00"]]],
   about:"Работаю с парами и семьями. На встречах мы замечаем круг, в который попадает пара, и учимся выходить из него раньше, чем ссора наберёт обороты. Можно прийти и одному, если партнёр пока не готов.",
   edu:["РГПУ им. Герцена, психология","Системная семейная терапия, 3 года","Эмоционально-фокусированная терапия пар, базовый и продвинутый курс"]},
  {id:"liza-andreeva", name:"Лиза Андреева", g:"f", role:"Детский и подростковый психолог", exp:5, aud:["teen","parent"], audText:"Подростки 12–17 лет, родители", formats:["video"], approaches:["КПТ","Арт-терапия"], price:3000, color:"#F6E9C9",
   quote:"Помогаю подросткам и родителям снова слышать друг друга", topics:["Подростки","Дети и родители","Тревога и паника","Самооценка"], slots:[[1,["17:00","18:00"]],[2,["16:00"]]],
   about:"Работаю с подростками 12–17 лет и их родителями. С подростком — отдельно и конфиденциально, с родителями — на отдельных встречах, где обсуждаем, как поддержать, не давя.",
   edu:["МГППУ, психология образования","КПТ для детей и подростков","Арт-терапия, 1 год"]},
  {id:"irina-pavlova", name:"Ирина Павлова", g:"f", role:"Травматерапевт, EMDR-терапевт", exp:9, aud:["me"], audText:"Взрослые", formats:["video"], approaches:["EMDR","Телесно-ориентированная терапия"], price:5000, color:"#F3DDDD",
   quote:"Последствия трудных событий: аварии, насилие, внезапные потери", topics:["Травма","Тревога и паника","Утрата и горе"], slots:[[3,["12:00","13:00"]],[4,["10:00"]]],
   about:"Работаю с последствиями травматичных событий — когда прошлое всё ещё вмешивается в настоящее: снится, вспоминается, заставляет избегать мест и людей. Двигаемся в темпе, который безопасен для вас.",
   edu:["ЮФУ, клиническая психология","EMDR, уровни 1 и 2","Сертификат по телесно-ориентированной терапии травмы"]},
  {id:"oleg-rudenko", name:"Олег Руденко", g:"m", role:"Психолог, ACT и КПТ", exp:7, aud:["me"], audText:"Взрослые", formats:["video","chat"], approaches:["ACT","КПТ"], price:4000, color:"#DDE8F3",
   quote:"Выгорание, прокрастинация и перфекционизм у тех, кто много работает", topics:["Выгорание","Работа и прокрастинация","Самооценка","Перемены и кризисы"], slots:[[0,["21:00"]],[1,["09:00","19:00"]]],
   about:"Сам пришёл в психологию из IT и хорошо знаю, как работа может съесть всё остальное. Помогаю вернуть силы, разобраться с откладыванием и перестать требовать от себя невозможного.",
   edu:["НИУ ВШЭ, психология","Терапия принятия и ответственности (ACT), 1,5 года","КПТ, базовый курс"]},
  {id:"tamara-lvova", name:"Тамара Львова", g:"f", role:"Психоаналитический психотерапевт", exp:22, aud:["me"], audText:"Взрослые", formats:["video","offline"], city:"Москве", approaches:["Психоаналитическая терапия"], price:6000, color:"#EDE6DA",
   quote:"Долгая работа для тех, кто хочет понять, откуда берутся повторяющиеся сценарии", topics:["Отношения","Самооценка","Нет сил"], slots:[[2,["11:00","15:00"]],[5,["12:00"]]],
   about:"Провожу долгосрочную терапию, обычно одну-две встречи в неделю. Подходит тем, кто замечает, что снова и снова попадает в похожие ситуации, и хочет разобраться почему.",
   edu:["МГУ, факультет психологии","Психоаналитическая психотерапия, 5 лет","Член профессиональной ассоциации, регулярная супервизия"]},
  {id:"denis-melnikov", name:"Денис Мельников", g:"m", role:"Гештальт-терапевт", exp:12, aud:["me"], audText:"Взрослые", formats:["video","offline"], city:"Казани", approaches:["Гештальт-терапия"], price:5000, color:"#E0EDD8",
   quote:"Злость, обида и чувства, которые «не принято» показывать", topics:["Злость и раздражение","Зависимости","Отношения"], slots:[[0,["19:00"]],[2,["13:00","18:00"]]],
   about:"Помогаю замечать и выражать чувства, не разрушая отношения. Много работаю с мужчинами, которым непросто говорить о себе, и с зависимым поведением.",
   edu:["КФУ, психология","Гештальт-терапия, 4 года","Работа с зависимостями, повышение квалификации"]},
  {id:"alina-safina", name:"Алина Сафина", g:"f", role:"Перинатальный психолог", exp:8, aud:["me","pair","parent"], audText:"Взрослые, пары, родители", formats:["video","chat"], approaches:["Перинатальная психология","Клиент-центрированная терапия"], price:4000, color:"#F8E1EA",
   quote:"Беременность, роды и первый год с ребёнком", topics:["Беременность и материнство","Тревога и паника","Кризис в паре"], slots:[[1,["12:00"]],[2,["10:00","14:00"]]],
   about:"Поддерживаю во время беременности, после родов и в первые годы родительства. Работаю с тревогой за ребёнка, усталостью, чувством вины и переменами в паре.",
   edu:["УрФУ, психология","Перинатальная психология, 2 года","Клиент-центрированная терапия"]},
  {id:"kseniya-vedeneeva", name:"Ксения Веденеева", g:"f", role:"Психолог, схема-терапевт", exp:10, aud:["me"], audText:"Взрослые", formats:["video","chat"], approaches:["Схема-терапия"], price:4500, color:"#E3EFEF",
   quote:"Внутренний критик, созависимость и сложные отношения с едой", topics:["Самооценка","Отношения с едой","Отношения","Нет сил"], slots:[[1,["16:00","20:00"]],[3,["10:00"]]],
   about:"Работаю с глубинными убеждениями о себе: «я недостаточно хороша», «меня бросят», «нельзя расслабляться». Помогаю ослабить внутреннего критика и строить отношения, в которых не приходится растворяться.",
   edu:["ТГУ, клиническая психология","Схема-терапия, сертификация","Работа с расстройствами пищевого поведения, повышение квалификации"]}
];
const APPROACHES = [...new Set(PSY.flatMap(p=>p.approaches))];

/* ---- helpers ---- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const initials = n => n.split(" ").map(w=>w[0]).join("");
const rub = n => n.toLocaleString("ru-RU").replace(/ /g," ") + " ₽";
const yearsWord = n => { const a=n%10,b=n%100; return (a===1&&b!==11)?"год":(a>=2&&a<=4&&(b<12||b>14))?"года":"лет"; };
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function dayLabel(off){
  if(off===0) return "Сегодня";
  if(off===1) return "Завтра";
  const d = new Date(); d.setDate(d.getDate()+off);
  const wd = d.toLocaleDateString("ru-RU",{weekday:"short"});
  return wd.charAt(0).toUpperCase()+wd.slice(1)+", "+d.toLocaleDateString("ru-RU",{day:"numeric",month:"long"});
}
const firstSlot = p => `${dayLabel(p.slots[0][0]).toLowerCase()} в ${p.slots[0][1][0]}`;
const formatText = p => p.formats.map(f=>f==="offline"?`очно в ${p.city}`:FORMATS[f].toLowerCase()).join(", ").replace(/^./,c=>c.toUpperCase());
const avatar = (p,cls="") => `<span class="ava ${cls}" style="background:${p.color}" aria-hidden="true">${initials(p.name)}</span>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="16" r="9" fill="#234035"/><circle cx="20" cy="16" r="9" fill="#E9A27A" fill-opacity=".85"/></svg>`;

/* ---- layout ---- */
function renderLayout(){
  const page = document.body.dataset.page || "";
  const nav = [["psychologists","/psychologists","Психологи"],["ai","/ai","ИИ-собеседник"],["blog","/blog","Журнал"],["analytics","/analytics","Аналитика"],["join","/join","Психологам"]];
  const h = $("#site-header");
  if(h) h.outerHTML = `
  <div class="demo">Демо-проект: психологи и их анкеты вымышлены, заявки сохраняются, но никто не перезвонит.</div>
  <header class="site"><div class="wrap nav">
    <a class="logo" href="/" aria-label="Рядом — на главную">${LOGO}рядом</a>
    <ul id="menu">${nav.map(([k,href,t])=>`<li><a href="${href}"${k===page?' aria-current="page"':""}>${t}</a></li>`).join("")}</ul>
    <div class="cta"><button class="burger" type="button" aria-expanded="false" aria-controls="menu">Меню</button><button class="btn" type="button" data-open-booking>Записаться</button></div>
  </div></header>`;
  const f = $("#site-footer");
  if(f) f.outerHTML = `
  <section style="padding:24px 0 0"><div class="wrap"><div class="crisis">
    <div><h2 style="font-size:30px">Если сейчас очень тяжело</h2><p style="margin-top:12px">Если есть мысли причинить себе вред или вам угрожает опасность — позвоните прямо сейчас, не дожидаясь записи. Специалисты «Рядом» и ИИ-собеседник не оказывают экстренную помощь.</p></div>
    <div class="phones">
      <a href="tel:112"><b>112</b><span>Единый номер экстренных служб</span></a>
      <a href="tel:88002000122"><b>8 800 2000-122</b><span>Детский телефон доверия, бесплатно</span></a>
      <a href="tel:84959895050"><b>8 495 989-50-50</b><span>Экстренная психологическая помощь МЧС, круглосуточно</span></a>
    </div></div></div></section>
  <footer class="site"><div class="wrap">
    <div class="foot">
      <div><a class="logo" href="/">${LOGO}рядом</a><p class="muted" style="margin-top:10px;max-width:320px">Психологи онлайн, ИИ-собеседник и письма поддержки. Выберите, с чего начать.</p></div>
      <div><h4>Клиентам</h4><ul><li><a href="/psychologists">Все психологи</a></li><li><a href="#" data-open-booking>Записаться</a></li><li><a href="/ai">ИИ-собеседник</a></li><li><a href="/#faq">Вопросы и ответы</a></li></ul></div>
      <div><h4>Специалистам</h4><ul><li><a href="/join">Как попасть в команду</a></li><li><a href="/blog">Журнал</a></li><li><a href="/analytics">Аналитика и калькулятор</a></li></ul></div>
    </div>
    <p class="copy">© 2026 «Рядом». Демо-проект. Не является медицинской услугой.</p>
  </div></footer>`;
  const burger = $(".burger");
  if(burger) burger.addEventListener("click",()=>{const m=$("#menu");m.classList.toggle("open");burger.setAttribute("aria-expanded",m.classList.contains("open"));});
}

/* ---- supabase ---- */
async function insertRow(table,row){
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(row)});
  return r.status;
}
function setMsg(el,text,ok){ if(!el) return; el.textContent=text; el.classList.remove("ok","err"); el.classList.add(ok?"ok":"err"); }
const msgFor = f => (f.nextElementSibling && f.nextElementSibling.classList.contains("msg")) ? f.nextElementSibling : $(".msg",f);

function bindSubscribe(){
  $$('[data-form="subscribe"]').forEach(f=>{
    if(f.dataset.bound) return; f.dataset.bound=1;
    const source = f.dataset.source || "letters";
    const okText = {letters:"Готово! Первое письмо придёт в воскресенье.", ai_waitlist:"Записали. Напишем, как только живой режим заработает.", research:"Спасибо! Пришлём исследование, как только оно будет готово."}[source];
    f.addEventListener("submit", async e=>{
      e.preventDefault();
      const msg=msgFor(f), btn=$("button",f), email=f.email.value.trim().toLowerCase();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ setMsg(msg,"Проверьте адрес — кажется, в нём опечатка.",false); f.email.focus(); return; }
      btn.disabled=true;
      try{
        const s = await insertRow("subscribers",{email,source});
        if(s===201){ setMsg(msg,okText,true); f.reset(); }
        else if(s===409){ setMsg(msg,"Этот адрес уже в списке — всё в порядке.",true); f.reset(); }
        else setMsg(msg,"Не получилось сохранить адрес. Попробуйте ещё раз чуть позже.",false);
      }catch{ setMsg(msg,"Нет соединения. Проверьте интернет и попробуйте снова.",false); }
      btn.disabled=false;
    });
  });
}

/* ---- booking (inline form and modal share one handler) ---- */
function bookingFields(){
  return `
    <label>Как к вам обращаться<input name="name" required maxlength="100" autocomplete="given-name" placeholder="Имя"></label>
    <label>Телефон или Telegram<input name="contact" required maxlength="120" autocomplete="tel" placeholder="+7 … или @username"></label>
    <label>Специалист<select name="psychologist"><option value="">Помогите подобрать</option>${PSY.map(p=>`<option>${p.name}</option>`).join("")}</select></label>
    <label>Тема<select name="topic"><option value="">Пока не знаю</option>${TOPICS.map(t=>`<option>${t}</option>`).join("")}</select></label>
    <label class="full">Удобное время<input name="preferred_time" maxlength="100" placeholder="Например: будни после 19:00"></label>
    <label class="full">Что хочется обсудить (по желанию)<textarea name="message" maxlength="1500" placeholder="Пара предложений — этого достаточно"></textarea></label>
    <label class="check full"><input type="checkbox" name="consent" required> Согласен(на) на обработку персональных данных для связи по заявке</label>
    <input type="hidden" name="slot">
    <div class="full"><button class="btn" type="submit">Отправить заявку</button></div>
    <p class="msg full" aria-live="polite"></p>`;
}
function bindBooking(f){
  if(f.dataset.bound) return; f.dataset.bound=1;
  f.addEventListener("submit", async e=>{
    e.preventDefault();
    const msg=$(".msg",f), btn=$('button[type="submit"]',f), d=Object.fromEntries(new FormData(f));
    if(!d.name.trim()){ setMsg(msg,"Напишите, как к вам обращаться.",false); f.name.focus(); return; }
    if(d.contact.trim().length<3){ setMsg(msg,"Оставьте телефон или ник в Telegram.",false); f.contact.focus(); return; }
    if(!f.consent.checked){ setMsg(msg,"Нужно согласие на обработку данных, иначе мы не сможем связаться.",false); return; }
    btn.disabled=true;
    try{
      const s = await insertRow("bookings",{name:d.name.trim(),contact:d.contact.trim(),psychologist:d.psychologist||null,topic:d.topic||null,
        preferred_time:d.preferred_time.trim()||null,message:d.message.trim()||null,slot:d.slot||null,consent:true});
      if(s===201){ setMsg(msg,`Спасибо, ${d.name.trim()}! Заявка принята — координатор свяжется в течение рабочего дня.`,true); f.reset(); f.slot.value=""; const pk=$(".pick",f.closest("dialog")||document.body); if(pk&&f.closest("dialog")) pk.hidden=true; }
      else setMsg(msg,"Не получилось отправить заявку. Попробуйте ещё раз чуть позже.",false);
    }catch{ setMsg(msg,"Нет соединения. Проверьте интернет и попробуйте снова.",false); }
    btn.disabled=false;
  });
}
function ensureModal(){
  let dlg = $("#booking-modal");
  if(dlg) return dlg;
  document.body.insertAdjacentHTML("beforeend",`
  <dialog class="modal" id="booking-modal" aria-labelledby="bm-title">
    <div class="mhead"><div><h2 id="bm-title" style="font-size:30px">Записаться на встречу</h2><p class="muted" style="margin-top:8px;font-size:15px">Координатор свяжется в течение рабочего дня и подтвердит время.</p></div>
    <button class="xbtn" type="button" aria-label="Закрыть" data-close>×</button></div>
    <div class="mbody"><div class="pick" hidden></div><form class="form-grid" data-form="booking" novalidate>${bookingFields()}</form></div>
  </dialog>`);
  dlg = $("#booking-modal");
  $("[data-close]",dlg).addEventListener("click",()=>dlg.close());
  dlg.addEventListener("click",e=>{ if(e.target===dlg) dlg.close(); });
  bindBooking($("form",dlg));
  return dlg;
}
function openBooking({psy="",slot="",topic=""}={}){
  const dlg = ensureModal(), f=$("form",dlg), pick=$(".pick",dlg);
  if(psy) f.psychologist.value=psy;
  if(topic) f.topic.value=topic;
  f.slot.value = slot;
  if(slot){ f.preferred_time.value = slot; }
  if(psy && slot){ pick.hidden=false; pick.innerHTML=`<b>${esc(psy)}</b> · ${esc(slot)}`; } else pick.hidden=true;
  const msg=$(".msg",f); msg.textContent="";
  dlg.showModal();
  setTimeout(()=>f.name.focus(),50);
}

document.addEventListener("click",e=>{
  const o = e.target.closest("[data-open-booking]");
  if(o){ e.preventDefault(); openBooking({psy:o.dataset.psy||"",slot:o.dataset.slot||"",topic:o.dataset.topic||""}); }
});

renderLayout();
document.addEventListener("DOMContentLoaded",()=>{
  bindSubscribe();
  $$('form[data-form="booking"]').forEach(f=>{ if(!f.children.length) f.innerHTML=bookingFields(); bindBooking(f); });
});
