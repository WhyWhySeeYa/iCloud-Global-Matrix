import { isPersistentCacheConfigured } from './lib/persistent-cache.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ok: true,
    service: 'icloud-global-matrix',
    timestamp: new Date().toISOString(),
    redisConfigured: isPersistentCacheConfigured()
  });
}
