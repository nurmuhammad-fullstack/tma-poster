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

function todayKey() {
  return `active:${new Date().toISOString().slice(0, 10)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = req.body;

  try {
    const message = update.message || update.edited_message;
    if (!message) return res.status(200).json({ ok: true });

    const chatId = String(message.chat.id);
    const firstName = message.from?.first_name || '';
    const username = message.from?.username || '';
    const now = new Date().toISOString();
    const today = todayKey();
    const text = message.text || '';

    if (REDIS_OK) {
      if (text.startsWith('/start')) {
        await redis(['SADD', 'users', chatId]);
        await redis(['HSET', `user:${chatId}`, 'firstName', firstName, 'username', username, 'joinedAt', now, 'lastActive', now]);
      } else {
        await redis(['HSET', `user:${chatId}`, 'lastActive', now]);
      }
      await redis(['SADD', today, chatId]);
      await redis(['EXPIRE', today, String(90 * 24 * 60 * 60)]);
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  return res.status(200).json({ ok: true });
}
