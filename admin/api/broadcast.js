const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_OK = !!(REDIS_URL && REDIS_TOKEN);

async function redis(cmd) {
  if (!REDIS_OK) return { result: null };
  const res = await fetch(
    `${REDIS_URL}/${cmd.map(encodeURIComponent).join('/')}`,
    { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
  );
  return res.json();
}

function isAuthorized(req) {
  const expected = 'Bearer ' + Buffer.from(process.env.ADMIN_PASSWORD + ':admin').toString('base64');
  return req.headers.authorization === expected;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTelegramMessage(chatId, text, parseMode) {
  const body = { chat_id: chatId, text };
  if (parseMode) body.parse_mode = parseMode;
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = await res.json();
  return data.ok === true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { message, parseMode, chatIds: manualIds } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    // Get chat IDs from Redis or use manually provided ones
    let chatIds = [];
    if (manualIds && Array.isArray(manualIds)) {
      chatIds = manualIds;
    } else if (REDIS_OK) {
      const membersRes = await redis(['SMEMBERS', 'users']);
      chatIds = membersRes.result || [];
    }

    const total = chatIds.length;
    let success = 0, failed = 0;

    const batchSize = 25;
    for (let i = 0; i < chatIds.length; i += batchSize) {
      const batch = chatIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((chatId) => sendTelegramMessage(chatId, message.trim(), parseMode || ''))
      );
      results.forEach((ok) => { if (ok) success++; else failed++; });
      if (i + batchSize < chatIds.length) await sleep(100);
    }

    // Record broadcast history if Redis available
    if (REDIS_OK) {
      const record = JSON.stringify({
        message: message.trim(),
        parseMode: parseMode || '',
        sentAt: new Date().toISOString(),
        total, success, failed,
      });
      await redis(['LPUSH', 'broadcasts', record]);
      await redis(['LTRIM', 'broadcasts', '0', '49']);
    }

    return res.status(200).json({ ok: true, total, success, failed });
  } catch (err) {
    console.error('Broadcast error:', err);
    return res.status(500).json({ error: err.message });
  }
}
