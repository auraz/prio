const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const tasks = await redis.get('tasks');
      return res.json(tasks || []);
    }
    if (req.method === 'PUT') {
      await redis.set('tasks', req.body);
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
