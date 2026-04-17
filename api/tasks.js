/** Vercel serverless: state blob CRUD with auto-migration and HTTP Basic Auth. */
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();

const DEFAULT_BLOB = { version: 2, tasks: [], energyLevel: 2, locked: null };

const TASK_DEFAULTS = { importance: 'meaningful', impactScope: 'affects one area', energyRequired: 2 };

function authorize(req) {
  const user = process.env.BASIC_USER;
  const pass = process.env.BASIC_PASS;
  if (!user || !pass) return true;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString();
  const [u, p] = decoded.split(':');
  return u === user && p === pass;
}

function migrateTask(task) {
  return { ...TASK_DEFAULTS, createdAt: task.id, ...task };
}

function migrateBlob(data) {
  if (!data) return { ...DEFAULT_BLOB };
  if (Array.isArray(data)) return { ...DEFAULT_BLOB, tasks: data.map(migrateTask) };
  if (!data.version) return { ...DEFAULT_BLOB, ...data, tasks: (data.tasks || []).map(migrateTask), version: 2 };
  return data;
}

module.exports = async function handler(req, res) {
  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (req.method === 'GET') {
      const raw = await redis.get('tasks');
      return res.json(migrateBlob(raw));
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
