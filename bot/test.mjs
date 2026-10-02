import assert from 'node:assert/strict';
const mod = await import(new URL('./worker.js', import.meta.url));
const worker = mod.default;
let calls = [];
globalThis.fetch = async (url, opts={}) => {
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ url: String(url), body, headers: opts.headers });
  if (String(url).includes('supabase')) return new Response('', { status: 201 });
  const method = String(url).split('/').pop();
  const result = method==='getMe' ? {username:'ryadom_test_bot'} : method==='getWebhookInfo' ? {url:'https://w.dev/webhook',pending_update_count:0} : {message_id: 1};
  return new Response(JSON.stringify({ ok: true, result }), { headers: { 'content-type': 'application/json' } });
};
const env = { BOT_TOKEN: 'T', ADMIN_CHAT_ID: '999', WEBHOOK_SECRET: 's'.repeat(24), SITE_URL: 'https://ryadom.example/', ALLOWED_ORIGIN: 'https://ryadom.example' };
const ctx = { waits: [], waitUntil(p){ this.waits.push(p); } };
const tgCalls = () => calls.filter(c=>c.url.includes('api.telegram.org')).map(c=>({m:c.url.split('/').pop(), ...c.body}));
async function hook(update, secret=env.WEBHOOK_SECRET){
  calls=[]; ctx.waits=[];
  const r = await worker.fetch(new Request('https://w.dev/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret,'content-type':'application/json'},body:JSON.stringify(update)}), env, ctx);
  await Promise.all(ctx.waits); return r;
}
const user = { id: 555, first_name: 'Ольга', username: 'olga' };
const msg = (text, extra={}) => ({ message: { message_id: 10, chat: { id: 555, type: 'private' }, from: user, text, ...extra } });
const cb = (data) => ({ callback_query: { id: 'q', from: user, data, message: { chat: { id: 555 } } } });
let ok=0; const t=(name,fn)=>fn().then(()=>{ok++;console.log('✓',name)}).catch(e=>{console.log('✗',name,'\n ',e.message);process.exitCode=1});

await t('чужой секрет вебхука отклоняется', async()=>{ const r=await hook(msg('/start'),'wrong'); assert.equal(r.status,403); });
await t('/start: приветствие и меню', async()=>{ await hook(msg('/start')); const c=tgCalls(); assert.equal(c[0].m,'sendMessage'); assert.match(c[0].text,/Здравствуйте, Ольга!/); assert.ok(c[0].reply_markup.inline_keyboard.length>=5); });
await t('deep link /start psy_maria-kim открывает анкету', async()=>{ await hook(msg('/start psy_maria-kim')); const c=tgCalls(); assert.equal(c[0].m,'sendPhoto'); assert.match(c[0].caption,/Мария Ким/); });
await t('список психологов', async()=>{ await hook(cb('list')); const c=tgCalls().find(x=>x.m==='sendMessage'); assert.equal(c.reply_markup.inline_keyboard.length,11); });
await t('карточки всех психологов: фото, подпись ≤1024, кнопки ≤64 байт', async()=>{
  for (const p of mod.PSY){ await hook(cb('p:'+p.id)); const c=tgCalls().find(x=>x.m==='sendPhoto'); assert.ok(c,'нет фото '+p.id);
    assert.ok(c.caption.length<=1024, p.id+' подпись '+c.caption.length); assert.match(c.photo,/^https:\/\/wsrv\.nl\/\?url=.+output=jpg/);
    for (const row of c.reply_markup.inline_keyboard) for (const b of row) if(b.callback_data) assert.ok(Buffer.byteLength(b.callback_data)<=64); }
});
await t('подбор по теме «Травма»', async()=>{ await hook(cb('t:trauma')); const c=tgCalls().find(x=>x.m==='sendMessage'); assert.ok(JSON.stringify(c.reply_markup).includes('Алексей Воронцов')); });
await t('кнопки тем ≤64 байт', async()=>{ await hook(cb('topics')); const c=tgCalls().find(x=>x.m==='sendMessage'); for(const r of c.reply_markup.inline_keyboard) for(const b of r) assert.ok(Buffer.byteLength(b.callback_data)<=64); });
await t('запись: подсказка с force_reply и меткой', async()=>{ await hook(cb('b:anna-sokolova')); const c=tgCalls().find(x=>x.m==='sendMessage'); assert.ok(c.reply_markup.force_reply); assert.match(c.text,/#запись:anna-sokolova/); assert.match(c.text,/Анна Соколова/); });
await t('ответ на подсказку → Supabase + координатор + подтверждение', async()=>{
  await hook(msg('Ольга, +7 900 111-22-33, будни после 19', { reply_to_message: { from:{is_bot:true}, text:'📝 Запись ... #запись:anna-sokolova' } }));
  const sb=calls.find(c=>c.url.includes('supabase')); assert.ok(sb,'нет записи в Supabase'); assert.equal(sb.body.psychologist,'Анна Соколова'); assert.equal(sb.body.contact,'@olga'); assert.equal(sb.body.consent,true);
  const c=tgCalls(); const admin=c.find(x=>x.chat_id==='999'); assert.match(admin.text,/Запись через бота/); assert.match(admin.text,/#id555/);
  assert.match(c.at(-1).text,/Заявка к психологу Анна Соколова принята/);
});
await t('запись «помогите подобрать»', async()=>{ await hook(msg('Иван, @ivan, вечером', { reply_to_message: { from:{is_bot:true}, text:'... #запись:any' } })); const sb=calls.find(c=>c.url.includes('supabase')); assert.equal(sb.body.psychologist,null); });
await t('обычное сообщение уходит координатору', async()=>{ await hook(msg('Здравствуйте, ищу психолога для подростка')); const c=tgCalls(); assert.equal(c[0].chat_id,'999'); assert.match(c[0].text,/Клиент пишет в бот/); assert.match(c[1].text,/Передали координатору/); });
await t('кризис: сначала телефоны помощи, координатору — 🚨', async()=>{ await hook(msg('мне очень плохо, не хочу жить')); const c=tgCalls(); assert.equal(c[0].chat_id,555); assert.match(c[0].text,/112/); const a=c.find(x=>x.chat_id==='999'); assert.match(a.text,/🚨/); });
await t('нет ложного срабатывания на обычный текст', async()=>{ assert.equal(mod.CRISIS_RE.test('хочу жить спокойнее, тревога мешает'),false); });
await t('голосовое уходит координатору копией с подписью', async()=>{ await hook({ message: { message_id: 11, chat:{id:555,type:'private'}, from:user, voice:{file_id:'x'} } }); const c=tgCalls(); assert.equal(c[0].m,'copyMessage'); assert.match(c[0].caption,/#id555/); });
await t('ответ координатора (Reply) уходит клиенту', async()=>{ await hook({ message:{ message_id:20, chat:{id:999,type:'private'}, from:{id:999,first_name:'К'}, text:'Добрый вечер! Подберём', reply_to_message:{ text:'💬 ... #id555' } } }); const c=tgCalls(); assert.equal(c[0].m,'copyMessage'); assert.equal(c[0].chat_id,'555'); assert.match(c[1].text,/Отправлено/); });
await t('координатор без Reply получает подсказку', async()=>{ await hook({ message:{ message_id:21, chat:{id:999,type:'private'}, from:{id:999}, text:'привет' } }); assert.match(tgCalls()[0].text,/Ответить/); });
await t('/sos', async()=>{ await hook(msg('/sos')); assert.match(tgCalls()[0].text,/8 495 989-50-50/); });
await t('групповые чаты игнорируются', async()=>{ await hook({ message:{ message_id:1, chat:{id:-1,type:'group'}, from:user, text:'/start' } }); assert.equal(tgCalls().length,0); });

async function lead(body, origin='https://ryadom.example'){ calls=[]; return worker.fetch(new Request('https://w.dev/lead',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}), env, ctx); }
await t('/lead: запись с сайта', async()=>{ const r=await lead({type:'booking',name:'Анна',contact:'+79001112233',psychologist:'Мария Ким',slot:'Завтра, 13:00',message:'Сын-подросток'}); assert.equal(r.status,200); assert.equal(r.headers.get('access-control-allow-origin'),'https://ryadom.example'); const c=tgCalls()[0]; assert.match(c.text,/Новая запись с сайта/); assert.match(c.text,/Завтра, 13:00/); });
await t('/lead: заявка психолога', async()=>{ const r=await lead({type:'application',name:'Пётр Петров',contact:'@pp',experience:'5–10 лет',approach:'КПТ'}); assert.equal(r.status,200); assert.match(tgCalls()[0].text,/Заявка психолога/); });
await t('/lead: подписка', async()=>{ const r=await lead({type:'subscribe',email:'a@b.ru',source:'ai_waitlist'}); assert.equal(r.status,200); assert.match(tgCalls()[0].text,/лист ожидания/); });
await t('/lead: чужой сайт — 403', async()=>{ const r=await lead({type:'booking',contact:'+7900'},'https://evil.example'); assert.equal(r.status,403); assert.equal(tgCalls().length,0); });
await t('/lead: без контакта — 422', async()=>{ const r=await lead({type:'booking',name:'x'}); assert.equal(r.status,422); });
await t('/lead: ловушка для ботов', async()=>{ const r=await lead({type:'booking',contact:'+7900111',website:'spam'}); assert.equal(r.status,200); assert.equal(tgCalls().length,0); });
await t('/lead: HTML экранируется', async()=>{ await lead({type:'booking',name:'<b>x</b>',contact:'+7900111'}); assert.match(tgCalls()[0].text,/&lt;b&gt;x/); });
await t('/setup и /status', async()=>{ calls=[]; let r=await worker.fetch(new Request('https://w.dev/setup?key='+env.WEBHOOK_SECRET),env,ctx); const j=await r.json(); assert.equal(j.bot,'ryadom_test_bot'); assert.ok(tgCalls().some(c=>c.m==='setWebhook'&&c.secret_token===env.WEBHOOK_SECRET));
  r=await worker.fetch(new Request('https://w.dev/setup?key=bad'),env,ctx); assert.equal(r.status,403);
  r=await worker.fetch(new Request('https://w.dev/status'),env,ctx); const s=await r.json(); assert.equal(s.webhook_points_here,true); assert.equal(s.psychologists,10); assert.ok(!JSON.stringify(s).includes('T"')); });
await t('если Телеграм не принял фото — карточка уходит текстом', async()=>{
  const orig=globalThis.fetch; globalThis.fetch=async(u,o)=>{ if(String(u).endsWith('sendPhoto')){calls.push({url:String(u),body:JSON.parse(o.body)});return new Response(JSON.stringify({ok:false,description:'wrong type'}));} return orig(u,o); };
  await hook(cb('p:anna-sokolova')); globalThis.fetch=orig;
  const c=tgCalls(); assert.equal(c.filter(x=>x.m==='sendPhoto').length,2); const m=c.find(x=>x.m==='sendMessage'); assert.match(m.text,/Анна Соколова/); });
console.log(`\n${ok} тестов пройдено`);
