/* ===== Рядом: голосовой ИИ-собеседник — браузер =====
   Распознавание речи — Web Speech API (SpeechRecognition), озвучка — speechSynthesis,
   ответы — /api/chat (поток текста). Разговор хранится только в памяти вкладки. */
(function(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const TTS = "speechSynthesis" in window ? window.speechSynthesis : null;
  const GREETING = "Здравствуйте! Я ИИ-собеседник «Рядом». Я здесь, чтобы выслушать. Что у вас сейчас происходит?";
  const API = "/api/chat";

  const el = id => document.getElementById(id);
  const ui = {cat:el("vc-cat"), status:el("vc-status"), hint:el("vc-hint"), toggle:el("vc-toggle"), interrupt:el("vc-interrupt"),
    log:el("vc-log"), form:el("vc-form"), text:el("vc-text"), voice:el("vc-voice"), msg:el("vc-msg")};

  const history = [];          // [{role, content}]
  let active = false;          // идёт ли голосовой разговор
  let state = "idle";
  let rec = null, interimNode = null;
  let controller = null;       // AbortController текущего запроса
  let speakQueue = 0;          // сколько фраз ещё звучит
  let replyDone = true;        // поток ответа закончился
  let turn = 0;                // номер хода — чтобы игнорировать хвосты перебитых ответов
  let voice = null;

  const LABELS = {idle:"Готов к разговору", listening:"Слушаю…", thinking:"Думаю…", speaking:"Говорю…", error:"Что-то пошло не так"};
  function setState(s, label){
    state = s;
    ui.status.dataset.state = s; ui.cat.dataset.state = s;
    ui.status.textContent = label || LABELS[s];
    ui.interrupt.hidden = !(s === "speaking" || s === "thinking");
  }
  function note(text, err){ ui.msg.textContent = text || ""; ui.msg.className = "msg" + (err ? " err" : ""); }

  function bubble(role, text){
    ui.log.hidden = false;
    const p = document.createElement("p");
    p.className = role === "user" ? "u" : "a";
    p.textContent = text;
    ui.log.appendChild(p);
    ui.log.scrollTop = ui.log.scrollHeight;
    return p;
  }

  /* ---- озвучка ---- */
  function pickVoice(){
    if(!TTS) return;
    const ru = TTS.getVoices().filter(v => /^ru(-|_|$)/i.test(v.lang));
    voice = ru.find(v => /google|milena|katya|svetlana|dariya|irina/i.test(v.name)) || ru[0] || null;
  }
  if(TTS){ pickVoice(); TTS.addEventListener?.("voiceschanged", pickVoice); }

  function speak(text, myTurn){
    text = text.replace(/[*_#`>]/g, "").trim();
    if(!text || !TTS || !ui.voice.checked) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU"; if(voice) u.voice = voice; u.rate = 1;
    speakQueue++;
    if(state !== "speaking") setState("speaking");
    const done = () => { speakQueue = Math.max(0, speakQueue - 1); if(myTurn === turn) afterSpeech(); };
    u.onend = done; u.onerror = done;
    TTS.speak(u);
  }
  function afterSpeech(){
    if(speakQueue > 0 || !replyDone) return;
    if(active) listen(); else setState("idle");
  }
  function stopSpeaking(){ speakQueue = 0; TTS?.cancel(); }

  /* ---- распознавание ---- */
  function listen(){
    if(!active || !SR) return;
    stopListening();
    rec = new SR();
    rec.lang = "ru-RU"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let finalText = "";
    rec.onresult = e => {
      let interim = "";
      for(let i = e.resultIndex; i < e.results.length; i++){
        const r = e.results[i];
        if(r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      const show = (finalText + " " + interim).trim();
      if(show){
        if(!interimNode){ interimNode = bubble("user", show); interimNode.classList.add("interim"); }
        else interimNode.textContent = show;
        ui.log.scrollTop = ui.log.scrollHeight;
      }
    };
    rec.onerror = e => {
      if(e.error === "not-allowed" || e.error === "service-not-allowed"){
        active = false; ui.toggle.textContent = "Начать разговор";
        setState("error", "Нет доступа к микрофону");
        note("Разрешите доступ к микрофону в настройках браузера или пишите текстом.", true);
      } else if(e.error === "audio-capture"){
        active = false; ui.toggle.textContent = "Начать разговор";
        setState("error", "Микрофон не найден");
        note("Подключите микрофон или пишите текстом.", true);
      }
      // no-speech / aborted / network — перезапуск в onend
    };
    rec.onend = () => {
      const mine = rec; rec = null;
      const text = finalText.trim();
      if(interimNode){ interimNode.remove(); interimNode = null; }
      if(text){ send(text); return; }
      if(active && state === "listening") setTimeout(() => { if(active && state === "listening" && !rec && mine) listen(); }, 250);
    };
    try { rec.start(); setState("listening"); } catch { setState("listening"); }
  }
  function stopListening(){
    if(rec){ rec.onend = null; rec.onresult = null; rec.onerror = null; try { rec.abort(); } catch {} rec = null; }
    if(interimNode){ interimNode.remove(); interimNode = null; }
  }

  /* ---- запрос к модели ---- */
  async function send(text){
    text = text.trim().slice(0, 2000);
    if(!text) return;
    note("");
    stopListening(); stopSpeaking(); controller?.abort();
    const myTurn = ++turn;
    history.push({role:"user", content:text});
    bubble("user", text);
    setState("thinking");
    replyDone = false;

    const node = bubble("assistant", "…");
    let full = "", pending = "";
    controller = new AbortController();
    try {
      const res = await fetch(API, {method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:history}), signal:controller.signal});
      if(!res.ok || !res.body){
        const code = (await res.json().catch(() => ({}))).error;
        throw new Error(code === "not_configured" ? "Собеседник ещё не подключён на сервере. Попробуйте позже."
          : code === "busy" ? "Сейчас много разговоров. Подождите минуту и попробуйте снова."
          : "Не удалось получить ответ. Проверьте интернет и попробуйте снова.");
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      for(;;){
        const {value, done} = await reader.read();
        if(done) break;
        if(myTurn !== turn) return;
        const chunk = dec.decode(value, {stream:true});
        full += chunk; pending += chunk;
        node.textContent = full;
        ui.log.scrollTop = ui.log.scrollHeight;
        // озвучиваем по предложениям, не дожидаясь конца ответа
        let m;
        while((m = pending.match(/^[\s\S]*?[.!?…](?=\s)|^[\s\S]*?\n/))){
          speak(m[0], myTurn);
          pending = pending.slice(m[0].length);
        }
      }
      if(myTurn !== turn) return;
      speak(pending, myTurn);
      full = full.trim();
      if(full) history.push({role:"assistant", content:full}); else node.remove();
    } catch(e) {
      if(e.name === "AbortError" || myTurn !== turn) return;
      node.remove();
      history.pop();   // вопрос без ответа не держим в истории
      stopSpeaking();
      active = false; ui.toggle.textContent = "Начать разговор";
      setState("error"); note(e.message, true);
      replyDone = true;
      return;
    }
    replyDone = true;
    if(myTurn === turn) afterSpeech();
  }

  /* ---- кнопки ---- */
  function start(){
    active = true; ui.toggle.textContent = "Завершить разговор"; note("");
    if(history.length){ listen(); return; }
    history.push({role:"assistant", content:GREETING});
    bubble("assistant", GREETING);
    replyDone = true;
    if(TTS && ui.voice.checked) speak(GREETING, ++turn); else listen();
  }
  function stop(){
    active = false; turn++;
    controller?.abort(); stopListening(); stopSpeaking();
    ui.toggle.textContent = "Начать разговор";
    setState("idle");
  }

  ui.toggle.addEventListener("click", () => active ? stop() : start());
  ui.interrupt.addEventListener("click", () => {
    turn++; controller?.abort(); stopSpeaking(); replyDone = true;
    const last = ui.log.lastElementChild;
    if(last && last.classList.contains("a") && history[history.length-1]?.role === "user"){
      // ответ не дослушан: сохраняем показанную часть, чтобы модель знала, что уже прозвучало
      const said = last.textContent.trim();
      if(said && said !== "…") history.push({role:"assistant", content:said + " …"}); else last.remove();
    }
    if(active) listen(); else setState("idle");
  });
  ui.form.addEventListener("submit", e => {
    e.preventDefault();
    const t = ui.text.value; ui.text.value = "";
    if(!history.length){ history.push({role:"assistant", content:GREETING}); bubble("assistant", GREETING); }
    send(t);
  });
  ui.voice.addEventListener("change", () => { if(!ui.voice.checked){ stopSpeaking(); if(replyDone) afterSpeech(); } });
  window.addEventListener("pagehide", () => { controller?.abort(); stopListening(); stopSpeaking(); });

  if(!SR){
    ui.toggle.hidden = true;
    ui.hint.textContent = "Ваш браузер не умеет распознавать речь (голосом можно говорить в Chrome, Edge и Safari). Напишите текстом — ответ будет озвучен.";
  }
  if(!TTS){ ui.voice.checked = false; ui.voice.disabled = true; }
})();
