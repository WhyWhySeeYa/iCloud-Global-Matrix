import { Redis } from '@upstash/redis';

const CACHE_KEY = 'icloud-global-matrix:pricing:last-success';
const RATES_CACHE_KEY = 'icloud-global-matrix:rates:last-success';
const REFRESH_LOCK_KEY = 'icloud-global-matrix:pricing:refresh-lock';

// 与 pricing.js 中的缓存策略对齐：有效 6h，过期可读 7d
const PRICING_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const RATES_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const REFRESH_LOCK_TTL_SECONDS = 30;

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

const normalizeRates = (value) => {
  if (!value) return null;

  const payload = typeof value === 'string' ? JSON.parse(value) : value;
  if (!payload?.rates || typeof payload.rates !== 'object' || !payload.updatedAt) return null;
  return payload;
};

export const isPersistentCacheConfigured = () => Boolean(getRedisClient());

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
    await redis.set(CACHE_KEY, payload, { ex: PRICING_CACHE_TTL_SECONDS });
    return true;
  } catch (error) {
    console.error('Failed to write persistent pricing cache:', error);
    return false;
  }
};

export const readPersistentRatesCache = async () => {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    return normalizeRates(await redis.get(RATES_CACHE_KEY));
  } catch (error) {
    console.error('Failed to read persistent rates cache:', error);
    return null;
  }
};

export const writePersistentRatesCache = async (ratesPayload) => {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(RATES_CACHE_KEY, ratesPayload, { ex: RATES_CACHE_TTL_SECONDS });
    return true;
  } catch (error) {
    console.error('Failed to write persistent rates cache:', error);
    return false;
  }
};

/**
 * 尝试获取刷新锁。成功返回 true，已有其它实例在刷新则返回 false。
 */
export const acquireRefreshLock = async () => {
  const redis = getRedisClient();
  if (!redis) return true;

  try {
    const result = await redis.set(REFRESH_LOCK_KEY, String(Date.now()), {
      nx: true,
      ex: REFRESH_LOCK_TTL_SECONDS
    });
    return result === 'OK' || result === true;
  } catch (error) {
    console.error('Failed to acquire refresh lock:', error);
    return true;
  }
};

export const releaseRefreshLock = async () => {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(REFRESH_LOCK_KEY);
  } catch (error) {
    console.error('Failed to release refresh lock:', error);
  }
};
