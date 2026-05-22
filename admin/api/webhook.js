// Telegram Bot webhook handler
// POST /api/webhook

async function redis(cmd) {
  const res = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/${cmd.map(encodeURIComponent).join('/')}`,
    {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
    }
  );
  return res.json();
}

function todayKey() {
  return `active:${new Date().toISOString().slice(0, 10)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Telegram secret token
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = req.body;

  try {
    const message = update.message || update.edited_message;
    if (!message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const firstName = message.from?.first_name || '';
    const username = message.from?.username || '';
    const now = new Date().toISOString();
    const today = todayKey();

    const text = message.text || '';

    if (text.startsWith('/start')) {
      // Register new user
      await redis(['SADD', 'users', chatId]);
      await redis([
        'HSET',
        `user:${chatId}`,
        'firstName', firstName,
        'username', username,
        'joinedAt', now,
        'lastActive', now,
      ]);
    } else {
      // Update lastActive for any other message
      await redis(['HSET', `user:${chatId}`, 'lastActive', now]);
    }

    // Track daily active — expire in 90 days
    await redis(['SADD', today, chatId]);
    await redis(['EXPIRE', today, String(90 * 24 * 60 * 60)]);

  } catch (err) {
    console.error('Webhook error:', err);
  }

  // Always return 200 to Telegram
  return res.status(200).json({ ok: true });
}
