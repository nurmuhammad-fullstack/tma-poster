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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (!REDIS_OK) {
      return res.status(200).json({ total: 0, page: 1, limit: 50, totalPages: 0, users: [] });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));

    const membersRes = await redis(['SMEMBERS', 'users']);
    const chatIds = membersRes.result || [];

    const batchSize = 50;
    const users = [];
    for (let i = 0; i < chatIds.length; i += batchSize) {
      const batch = chatIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((chatId) => redis(['HGETALL', `user:${chatId}`]))
      );
      results.forEach((r, idx) => {
        const data = r.result;
        if (data && data.length > 0) {
          const obj = { chatId: batch[idx] };
          for (let j = 0; j < data.length; j += 2) obj[data[j]] = data[j + 1];
          users.push(obj);
        } else {
          users.push({ chatId: batch[idx], firstName: '', username: '', joinedAt: '', lastActive: '' });
        }
      });
    }

    users.sort((a, b) => {
      if (!a.joinedAt) return 1;
      if (!b.joinedAt) return -1;
      return b.joinedAt.localeCompare(a.joinedAt);
    });

    const total = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);

    return res.status(200).json({ total, page, limit, totalPages: Math.ceil(total / limit), users: paginated });
  } catch (err) {
    console.error('Users error:', err);
    return res.status(500).json({ error: err.message });
  }
}
