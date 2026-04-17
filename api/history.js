// Vercel serverless: daily close history with 90-day rolling window.
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
const MAX_DAYS = 90;

function authorize(req) {
  const token = process.env.PRIO_TOKEN;
  if (!token) return true;
  const header = req.headers.authorization || '';
  return header === `Bearer ${token}`;
}

function cutoffDate() {
  const d = new Date();
  d.setDate(d.getDate() - MAX_DAYS);
  return d.toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (req.method === 'GET') {
      const history = await redis.get('history');
      return res.json(history || []);
    }
    if (req.method === 'POST') {
      const entry = req.body;
      const history = (await redis.get('history')) || [];
      const cutoff = cutoffDate();
      const filtered = history.filter(e => e.date >= cutoff && e.date !== entry.date);
      filtered.push(entry);
      filtered.sort((a, b) => a.date.localeCompare(b.date));
      await redis.set('history', filtered);
      return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
