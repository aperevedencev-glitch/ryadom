/* ===== Рядом: голосовой ИИ-собеседник — серверная часть (Vercel Function) =====
   POST /api/chat  { messages: [{role:"user"|"assistant", content:"…"}] }
   Ответ — поток обычного текста (text/plain), чтобы браузер начинал озвучивать
   первую фразу, пока пишется остальное. Ключ: переменная окружения ANTHROPIC_API_KEY. */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const MAX_MESSAGES = 30;      // сколько последних реплик уходит в модель
const MAX_CHARS = 2000;       // длина одной реплики

const SYSTEM = `Ты — голосовой ИИ-собеседник сервиса «Рядом» (психологи онлайн). С тобой разговаривают голосом: твои ответы озвучиваются синтезатором речи.

Как говорить:
- По-русски, тепло, спокойно, на «вы», если человек сам не перешёл на «ты».
- Коротко: 1–3 предложения, как в живом разговоре. Без списков, заголовков, эмодзи, markdown и ссылок — только то, что звучит естественно вслух.
- Сначала выслушай и отрази чувства, потом задай один мягкий вопрос. Не читай нотаций и не засыпай советами.
- Умеешь: выслушать; помочь успокоиться (дыхание 4–6, заземление «5-4-3-2-1» — веди по шагам, по одному шагу за реплику); помочь разложить мысли после тяжёлого дня или ссоры; отрепетировать трудный разговор; сформулировать запрос к психологу.

Границы:
- Ты ИИ, а не человек и не психолог. Если спрашивают — честно говори, что ты ИИ.
- Не ставишь диагнозы, не называешь лекарства и дозировки, не назначаешь лечение.
- Если трудности тянутся месяцами, мешают жить, связаны с травмой, депрессией, зависимостью, расстройством пищевого поведения — бережно предложи поработать с живым специалистом; психологов можно подобрать на сайте «Рядом» в разделе «Психологи».
- Если есть признаки опасности — мысли о самоубийстве или самоповреждении, насилие, угроза жизни — прямо и спокойно скажи, что сейчас важно обратиться к людям: позвонить 112, или на бесплатный круглосуточный телефон доверия 8-800-2000-122, или попросить близкого человека побыть рядом. Оставайся в разговоре, спроси, в безопасности ли человек прямо сейчас.
- Не обсуждай темы, не связанные с эмоциональной поддержкой, дольше пары фраз — мягко возвращай к тому, как человек себя чувствует.

Разговор уже начат: ты поздоровался и спросил, что происходит. Не здоровайся повторно.`;

function clean(messages) {
  if (!Array.isArray(messages)) return null;
  const out = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter(m => m.content)
    .slice(-MAX_MESSAGES);
  while (out.length && out[0].role !== "user") out.shift();   // диалог должен начинаться с пользователя
  // склеиваем подряд идущие реплики одной роли
  const merged = [];
  for (const m of out) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content;
    else merged.push({ ...m });
  }
  if (!merged.length || merged[merged.length - 1].role !== "user") return null;
  return merged;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "not_configured" });
  }
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const messages = clean(body?.messages);
  if (!messages) return res.status(400).json({ error: "bad_request" });

  let stream;
  try {
    stream = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },   // живой разговор: важнее быстрый ответ
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages,
      stream: true,
    });
  } catch (e) {
    console.error("anthropic error", e?.status, e?.message);
    const status = e instanceof Anthropic.RateLimitError ? 429 : 502;
    return res.status(status).json({ error: status === 429 ? "busy" : "upstream" });
  }

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  });
  let sent = false, refused = false;
  try {
    for await (const ev of stream) {
      if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
        res.write(ev.delta.text);
        sent = true;
      } else if (ev.type === "message_delta" && ev.delta.stop_reason === "refusal") {
        refused = true;
      }
    }
  } catch (e) {
    console.error("stream error", e?.message);
  }
  if (!sent || refused) {
    res.write((sent ? " " : "") + "Мне сложно продолжить эту тему. Если вам сейчас тяжело или небезопасно, позвоните 112 или на телефон доверия 8-800-2000-122.");
  }
  res.end();
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
