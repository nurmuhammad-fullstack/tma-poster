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

function dateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `active:${d.toISOString().slice(0, 10)}`;
}

async function sunioncard(keys) {
  if (!REDIS_OK || keys.length === 0) return 0;
  const tmpKey = `tmp:sunion:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await redis(['SUNIONSTORE', tmpKey, ...keys]);
  const result = await redis(['SCARD', tmpKey]);
  await redis(['DEL', tmpKey]);
  return result.result || 0;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const totalUsers = REDIS_OK ? ((await redis(['SCARD', 'users'])).result || 0) : 0;
    const activeToday = REDIS_OK ? ((await redis(['SCARD', dateKey(0)])).result || 0) : 0;
    const activeLast7 = REDIS_OK ? await sunioncard(Array.from({ length: 7 }, (_, i) => dateKey(i))) : 0;
    const activeLast30 = REDIS_OK ? await sunioncard(Array.from({ length: 30 }, (_, i) => dateKey(i))) : 0;

    const broadcastsRes = REDIS_OK ? await redis(['LRANGE', 'broadcasts', '0', '4']) : { result: [] };
    const recentBroadcasts = (broadcastsRes.result || []).map((item) => {
      try { return JSON.parse(item); } catch { return null; }
    }).filter(Boolean);

    return res.status(200).json({ totalUsers, activeToday, activeLast7, activeLast30, recentBroadcasts });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
