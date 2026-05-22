// POST /api/broadcast — send message to all users
// Body: { message: string, parseMode?: "HTML" | "Markdown" | "" }
// Requires Authorization: Bearer <token>

async function redis(cmd) {
  const res = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/${cmd.map(encodeURIComponent).join('/')}`,
    {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    }
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
  const body = {
    chat_id: chatId,
    text,
  };
  if (parseMode) {
    body.parse_mode = parseMode;
  }

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  return data.ok === true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, parseMode } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    // Get all chat IDs
    const membersRes = await redis(['SMEMBERS', 'users']);
    const chatIds = membersRes.result || [];
    const total = chatIds.length;

    let success = 0;
    let failed = 0;

    // Send in batches of 25 with 100ms delay
    const batchSize = 25;
    for (let i = 0; i < chatIds.length; i += batchSize) {
      const batch = chatIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((chatId) => sendTelegramMessage(chatId, message.trim(), parseMode || ''))
      );
      results.forEach((ok) => {
        if (ok) success++;
        else failed++;
      });
      if (i + batchSize < chatIds.length) {
        await sleep(100);
      }
    }

    // Record broadcast history
    const record = JSON.stringify({
      message: message.trim(),
      parseMode: parseMode || '',
      sentAt: new Date().toISOString(),
      total,
      success,
      failed,
    });
    await redis(['LPUSH', 'broadcasts', record]);
    await redis(['LTRIM', 'broadcasts', '0', '49']);

    return res.status(200).json({ ok: true, total, success, failed });
  } catch (err) {
    console.error('Broadcast error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
