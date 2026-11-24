// Guarda y lee el estado del organizador de mesas en Upstash Redis (vía REST, sin dependencias).
// Variables de entorno (Vercel las crea al conectar Upstash desde el Marketplace):
//   KV_REST_API_URL / KV_REST_API_TOKEN   (o UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
//   MESAS_CLAVE  -> la contraseña que van a usar Sean y Cande
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'casorio:mesas';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

// Guarda solo si nadie guardó otra versión en el medio (atómico en Redis).
// KEYS[1] = documento, KEYS[2] = número de versión
const SAVE_LUA = `
local v = tonumber(redis.call('GET', KEYS[2]) or '0')
if tonumber(ARGV[1]) ~= v then return {0, v, redis.call('GET', KEYS[1]) or ''} end
redis.call('SET', KEYS[1], ARGV[2])
local nv = redis.call('INCR', KEYS[2])
return {1, nv, ''}`;

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Falta conectar la base (Upstash) en Vercel' });
  if (!process.env.MESAS_CLAVE) return res.status(500).json({ error: 'Falta la variable MESAS_CLAVE en Vercel' });
  if (req.headers['x-clave'] !== process.env.MESAS_CLAVE) return res.status(401).json({ error: 'Contraseña incorrecta' });

  try {
    if (req.method === 'GET') {
      const [raw, v] = await redis(['MGET', KEY, KEY + ':v']);
      return res.status(200).json(raw ? { ...JSON.parse(raw), v: Number(v) || 0 } : null);
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !body.state || !Array.isArray(body.state.guests) || !Array.isArray(body.state.tables))
        return res.status(400).json({ error: 'Datos inválidos' });
      const doc = { state: body.state, by: String(body.by || '').slice(0, 40), at: new Date().toISOString() };
      const [ok, v, raw] = await redis(['EVAL', SAVE_LUA, '2', KEY, KEY + ':v', String(Number(body.v) || 0), JSON.stringify(doc)]);
      if (ok) return res.status(200).json({ v: Number(v), at: doc.at, by: doc.by });
      return res.status(409).json(raw ? { ...JSON.parse(raw), v: Number(v) } : null);
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

module.exports = handler;
