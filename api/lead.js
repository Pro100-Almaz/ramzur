/*
  POST /api/lead  —  приём заявки со страницы и отправка её в Telegram.

  Зачем это нужно: токен бота живёт здесь, в переменной окружения на
  сервере, и никогда не попадает в браузер. До этой функции запрос уходил
  прямо из script.js, а значит токен был виден любому в исходном коде.

  Переменные окружения (Vercel → Project → Settings → Environment Variables):
    TELEGRAM_BOT_TOKEN   токен от @BotFather
    TELEGRAM_CHAT_ID     id группы, отрицательный (напр. -1001234567890)

  Оба значения нужно добавить для всех окружений (Production, Preview,
  Development) и после этого сделать Redeploy — переменные подхватываются
  только при новом деплое.

  Сообщение собирается ЗДЕСЬ, а не на клиенте, и это принципиально: иначе
  любой мог бы отправить POST на этот адрес с произвольным текстом и писать
  в группу от имени бота. Клиент присылает только поля заявки, формат
  сообщения контролирует сервер.
*/

'use strict';

const TELEGRAM_API = 'https://api.telegram.org';

// жёсткие ограничения на длину: Telegram отклоняет сообщения длиннее 4096
const LIMITS = { name: 200, phone: 100, task: 3000, source: 300, pageUrl: 500 };

/* Простейший ограничитель частоты. Живёт в памяти одного инстанса, поэтому
   работает только пока инстанс «тёплый» и не защищает от распределённой
   атаки — это «лежачий полицейский», а не настоящий rate limit. Для
   честного ограничения нужно внешнее хранилище (Vercel KV / Upstash). */
const RATE = { windowMs: 60_000, max: 8 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const fresh = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  fresh.push(now);
  hits.set(ip, fresh);
  if (hits.size > 5000) hits.clear();   // защита от роста памяти
  return fresh.length > RATE.max;
}

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clamp(v, max) {
  const s = String(v == null ? '' : v).trim();
  return s.length <= max ? s : s.slice(0, max) + '… [обрезано]';
}

function stamp() {
  try {
    return new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Almaty', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  }
}

function buildMessage(lead) {
  const lines = [
    '🔔 <b>Новая заявка — Ramzur</b>',
    '',
    '<b>Имя:</b> ' + esc(lead.name),
    '<b>Телефон:</b> ' + esc(lead.phone),
  ];
  if (lead.task) lines.push('<b>Задача:</b> ' + esc(lead.task));
  lines.push('');
  if (lead.source) lines.push('<b>Откуда:</b> ' + esc(lead.source));
  lines.push('<b>Время:</b> ' + esc(stamp()) + ' (Астана)');
  if (lead.pageUrl) lines.push('<b>Страница:</b> ' + esc(lead.pageUrl));
  if (lead.suspicious) {
    lines.push('');
    lines.push('⚠️ <i>Форма заполнена подозрительно быстро — возможно, бот.</i>');
  }
  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // в логах Vercel будет видно, в ответе — нет: не раскрываем внутренности
    console.error('[lead] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }

  // req.body уже разобран рантаймом Vercel для application/json
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'bad_body' });
  }

  /* Приманка проверяется и здесь, а не только на клиенте: клиентскую
     проверку бот может просто не выполнять, выполнив POST напрямую.
     Ответ при этом — успешный, чтобы бот не понял, что его отсекли. */
  if (body.hp) {
    console.warn('[lead] отброшено по приманке, ip=' + ip);
    return res.status(200).json({ ok: true });
  }

  const name = clamp(body.name, LIMITS.name);
  const phone = clamp(body.phone, LIMITS.phone);
  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: 'missing_fields' });
  }

  const text = buildMessage({
    name,
    phone,
    task: clamp(body.task, LIMITS.task),
    source: clamp(body.source, LIMITS.source),
    pageUrl: clamp(body.pageUrl, LIMITS.pageUrl),
    suspicious: body.suspicious === true,
  });

  try {
    const tgRes = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await tgRes.json().catch(() => null);

    if (!data || !data.ok) {
      // описание ошибки — только в логи: оно может содержать детали чата
      console.error('[lead] Telegram отказал: ' + (data && data.description));
      return res.status(502).json({ ok: false, error: 'telegram_rejected' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] сеть недоступна: ' + err.message);
    return res.status(502).json({ ok: false, error: 'upstream_unreachable' });
  }
};
