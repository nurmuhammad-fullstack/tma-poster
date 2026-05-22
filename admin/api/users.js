// GET /api/users?page=1&limit=50 — paginated user list
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));

    // Get all chat IDs
    const membersRes = await redis(['SMEMBERS', 'users']);
    const chatIds = membersRes.result || [];

    // Fetch user data for each chat ID in parallel (batches of 50)
    const batchSize = 50;
    const users = [];
    for (let i = 0; i < chatIds.length; i += batchSize) {
      const batch = chatIds.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((chatId) => redis(['HGETALL', `user:${chatId}`]))
      );
      results.forEach((res, idx) => {
        const data = res.result;
        if (data && data.length > 0) {
          // HGETALL returns flat array: [field, value, field, value, ...]
          const obj = { chatId: batch[idx] };
          for (let j = 0; j < data.length; j += 2) {
            obj[data[j]] = data[j + 1];
          }
          users.push(obj);
        } else {
          users.push({ chatId: batch[idx], firstName: '', username: '', joinedAt: '', lastActive: '' });
        }
      });
    }

    // Sort by joinedAt descending (most recent first)
    users.sort((a, b) => {
      if (!a.joinedAt) return 1;
      if (!b.joinedAt) return -1;
      return b.joinedAt.localeCompare(a.joinedAt);
    });

    const total = users.length;
    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit);

    return res.status(200).json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      users: paginated,
    });
  } catch (err) {
    console.error('Users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
