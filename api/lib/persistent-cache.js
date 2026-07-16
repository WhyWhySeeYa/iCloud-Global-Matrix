import { Redis } from '@upstash/redis';

const CACHE_KEY = 'icloud-global-matrix:pricing:last-success';

let redisClient;

const getRedisClient = () => {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  redisClient = url && token
    ? new Redis({ url, token, enableTelemetry: false })
    : null;

  return redisClient;
};

const normalizePayload = (value) => {
  if (!value) return null;

  const payload = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(payload?.data) && payload.updatedAt ? payload : null;
};

export const readPersistentPricingCache = async () => {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    return normalizePayload(await redis.get(CACHE_KEY));
  } catch (error) {
    console.error('Failed to read persistent pricing cache:', error);
    return null;
  }
};

export const writePersistentPricingCache = async (payload) => {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(CACHE_KEY, payload);
    return true;
  } catch (error) {
    console.error('Failed to write persistent pricing cache:', error);
    return false;
  }
};
