/* ===== Рядом: общие данные, шапка, подвал, формы ===== */
const SUPABASE_URL = "https://wuvadreohiphwevprwmk.supabase.co";
const SUPABASE_KEY = "sb_publishable_QnCBQILrqr6PhrAE8521NA_edLJSMA-";

const TOPIC_LABELS = {anxiety:"Тревога и паника", depression:"Апатия и нет сил", burnout:"Выгорание", relationships:"Отношения", couples:"Кризис в паре", selfesteem:"Самооценка", trauma:"Травма", grief:"Утрата и горе", teens:"Подростки", parenting:"Дети и родители", perinatal:"Беременность и материнство", career:"Работа и прокрастинация", anger:"Злость и раздражение", addiction:"Зависимости", eating:"Отношения с едой", crisis:"Перемены и кризисы"};
const APPROACH_LABELS = {cbt:"КПТ", act:"ACT", gestalt:"Гештальт-терапия", existential:"Экзистенциальная терапия", family:"Системная семейная терапия", eft:"Эмоционально-фокусированная терапия", psychoanalytic:"Психоаналитическая терапия", art:"Арт-терапия", emdr:"EMDR", somatic:"Телесно-ориентированная терапия", schema:"Схема-терапия", person:"Клиент-центрированная терапия", perinatal:"Перинатальная психология"};
const TOPICS = Object.values(TOPIC_LABELS);
const AUDIENCE = {me:"Мне", pair:"Паре", teen:"Подростку", parent:"Родителю"};
const FORMATS = {video:"Видео", chat:"Чат", offline:"Очно"};
const CLIENT_MAP = {adults:["me","Взрослые"], couples:["pair","Пары"], teens:["teen","Подростки 12–17 лет"], parents:["parent","Родители"]};
const CITY_IN = {"Москва":"Москве","Санкт-Петербург":"Петербурге","Екатеринбург":"Екатеринбурге"};
const TIER_PRICE = {junior:2500, middle:4250, senior:6500};
const COUPLE_PRICE = {junior:3750, middle:6400, senior:9750};
const COLORS = ["#FBEADB","#DDEFE8","#E6E3F3","#F6E9C9","#F3DDDD","#DDE8F3","#EDE6DA","#E0EDD8","#F8E1EA","#E3EFEF"];

/* свободные окна считаются из расписания специалиста: детерминированно, на 2 недели вперёд */
function hash(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function buildSlots(p){
  const now=new Date(), out=[];
  for(let d=0; d<14 && out.length<2; d++){
    const date=new Date(now); date.setDate(now.getDate()+d);
    const wd=(date.getDay()+6)%7;
    if(!p.schedule.days.includes(wd)) continue;
    const key=date.toISOString().slice(0,10), times=[];
    for(let h=p.schedule.from; h<p.schedule.to; h++){
      if(d===0 && h<=now.getHours()+1) continue;
      if(hash(p.id+key+h)%3===0) times.push(String(h).padStart(2,"0")+":00");
    }
    if(times.length) out.push([d,times.slice(0,4)]);
  }
  return out.length?out:[[1,[String(p.schedule.from).padStart(2,"0")+":00"]]];
}
const PSY = PSY_RAW.map((r,i)=>({
  ...r,
  g:r.gender, role:r.title, headline:r.tagline,
  exp:new Date().getFullYear()-r.practiceSince,
  aud:r.clients.map(c=>CLIENT_MAP[c][0]),
  audText:r.clients.map(c=>CLIENT_MAP[c][1]).join(", ").replace(/, (.)/g,(m,c)=>", "+c.toLowerCase()),
  approaches:r.approaches.map(a=>APPROACH_LABELS[a]),
  topics:r.topics.map(t=>TOPIC_LABELS[t]),
  price:TIER_PRICE[r.tier], couplePrice:r.clients.includes("couples")?COUPLE_PRICE[r.tier]:null,
  city:CITY_IN[r.city]||r.city,
  color:COLORS[i%COLORS.length],
  face:PHOTO_BASE+r.id+"-face.webp", photo:PHOTO_BASE+r.id+".webp",
  slots:buildSlots(r)
}));
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
const avatar = (p,cls="") => `<span class="ava ${cls}" style="background:${p.color}" aria-hidden="true"><img src="${cls==="lg"?p.photo:p.face}" alt="" loading="lazy" onerror="this.remove()"><i>${initials(p.name)}</i></span>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="16" r="9" fill="#234035"/><circle cx="20" cy="16" r="9" fill="#E9A27A" fill-opacity=".85"/></svg>`;

/* ---- layout ---- */
function renderLayout(){
  const page = document.body.dataset.page || "";
  const nav = [["psychologists","psychologists.html","Психологи"],["ai","ai.html","ИИ-собеседник"],["blog","blog.html","Журнал"],["analytics","analytics.html","Аналитика"],["join","join.html","Психологам"]];
  const h = $("#site-header");
  if(h) h.outerHTML = `
  <div class="demo">Демо-проект: психологи, анкеты и отзывы вымышлены, фотографии созданы нейросетью. Заявки сохраняются, но никто не перезвонит.</div>
  <header class="site"><div class="wrap nav">
    <a class="logo" href="index.html" aria-label="Рядом — на главную">${LOGO}Рядом</a>
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
      <div><a class="logo" href="index.html">${LOGO}Рядом</a><p class="muted" style="margin-top:10px;max-width:320px">Психологи онлайн, ИИ-собеседник и письма поддержки. Выберите, с чего начать.</p></div>
      <div><h4>Клиентам</h4><ul><li><a href="psychologists.html">Все психологи</a></li><li><a href="#" data-open-booking>Записаться</a></li><li><a href="ai.html">ИИ-собеседник</a></li><li><a href="index.html#faq">Вопросы и ответы</a></li></ul></div>
      <div><h4>Специалистам</h4><ul><li><a href="join.html">Как попасть в команду</a></li><li><a href="blog.html">Журнал</a></li><li><a href="analytics.html">Аналитика и калькулятор</a></li></ul></div>
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
