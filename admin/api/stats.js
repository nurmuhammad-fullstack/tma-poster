// GET /api/stats — returns dashboard statistics
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

function dateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `active:${d.toISOString().slice(0, 10)}`;
}

async function sunioncard(keys) {
  if (keys.length === 0) return 0;
  // Use SUNIONSTORE to a temp key, then SCARD, then DEL
  const tmpKey = `tmp:sunion:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  await redis(['SUNIONSTORE', tmpKey, ...keys]);
  const result = await redis(['SCARD', tmpKey]);
  await redis(['DEL', tmpKey]);
  return result.result || 0;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Total users
    const totalUsersRes = await redis(['SCARD', 'users']);
    const totalUsers = totalUsersRes.result || 0;

    // Active today
    const activeTodayRes = await redis(['SCARD', dateKey(0)]);
    const activeToday = activeTodayRes.result || 0;

    // Active last 7 days
    const last7Keys = Array.from({ length: 7 }, (_, i) => dateKey(i));
    const activeLast7 = await sunioncard(last7Keys);

    // Active last 30 days
    const last30Keys = Array.from({ length: 30 }, (_, i) => dateKey(i));
    const activeLast30 = await sunioncard(last30Keys);

    // Recent broadcasts (last 5)
    const broadcastsRes = await redis(['LRANGE', 'broadcasts', '0', '4']);
    const recentBroadcasts = (broadcastsRes.result || []).map((item) => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return res.status(200).json({
      totalUsers,
      activeToday,
      activeLast7,
      activeLast30,
      recentBroadcasts,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
