import { FALLBACK_UPDATED_AT, fallbackPricingData } from './fallback-pricing.js';
import { parsePricingHtml } from './lib/pricing-parser.js';
import {
  acquireRefreshLock,
  readPersistentPricingCache,
  readPersistentRatesCache,
  releaseRefreshLock,
  writePersistentPricingCache,
  writePersistentRatesCache
} from './lib/persistent-cache.js';

const APPLE_PRICING_URL = 'https://support.apple.com/zh-cn/108047';
const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/CNY';
const MEMORY_CACHE_TTL = 1000 * 60 * 60 * 6;
const STALE_CACHE_TTL = 1000 * 60 * 60 * 24;
const PERSISTENT_STALE_CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const REQUEST_TIMEOUT = 1000 * 12;
const REFRESH_COOLDOWN_MS = 1000 * 30;
const APPLE_PRICING_FALLBACK_URLS = [
  APPLE_PRICING_URL,
  `https://corsproxy.io/?${encodeURIComponent(APPLE_PRICING_URL)}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(APPLE_PRICING_URL)}`
];

let memoryCache = null;
let memoryRatesCache = null;
let memoryRefreshLockUntil = 0;
let inFlightRefresh = null;

const cloneData = (data) => JSON.parse(JSON.stringify(data));

const createResponsePayload = (data, meta = {}) => ({
  data,
  updatedAt: meta.updatedAt || new Date().toISOString(),
  source: APPLE_PRICING_URL,
  resolvedSource: meta.resolvedSource || APPLE_PRICING_URL,
  cacheStatus: meta.cacheStatus || 'fresh',
  isFallback: Boolean(meta.isFallback),
  message: meta.message || null,
  countryCount: Array.isArray(data) ? data.length : 0,
  ratesSource: meta.ratesSource || null
});

const getValidCache = () => {
  if (!memoryCache) return null;

  const age = Date.now() - memoryCache.cachedAt;
  if (age <= MEMORY_CACHE_TTL) {
    return {
      ...memoryCache.payload,
      cacheStatus: 'memory',
      cacheAgeSeconds: Math.round(age / 1000)
    };
  }

  return null;
};

const getStaleCache = () => {
  if (!memoryCache) return null;

  const age = Date.now() - memoryCache.cachedAt;
  if (age <= MEMORY_CACHE_TTL + STALE_CACHE_TTL) {
    return {
      ...memoryCache.payload,
      cacheStatus: 'stale',
      cacheAgeSeconds: Math.round(age / 1000),
      message: 'Live pricing fetch failed. Serving stale cached data.'
    };
  }

  return null;
};

const setMemoryCache = (payload, cachedAt = Date.now()) => {
  memoryCache = {
    cachedAt,
    payload
  };
};

const setMemoryRatesCache = (rates, source = 'live', updatedAt = new Date().toISOString()) => {
  if (!rates || typeof rates !== 'object') return;
  memoryRatesCache = { rates, source, updatedAt, cachedAt: Date.now() };
};

const getMemoryRates = () => {
  if (!memoryRatesCache?.rates) return null;
  return memoryRatesCache;
};

const decoratePersistentCache = (payload, { stale = false } = {}) => {
  if (!payload?.updatedAt) return null;

  const age = Date.now() - new Date(payload.updatedAt).getTime();
  const maxAge = stale ? PERSISTENT_STALE_CACHE_TTL : MEMORY_CACHE_TTL;
  if (!Number.isFinite(age) || age < 0 || age > maxAge) return null;

  return {
    ...payload,
    countryCount: Array.isArray(payload.data) ? payload.data.length : 0,
    cacheStatus: stale ? 'persistent-stale' : 'persistent',
    cacheAgeSeconds: Math.round(age / 1000),
    message: stale ? 'Live pricing fetch failed. Serving persistent cached data.' : payload.message
  };
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async (url) => {
  const response = await fetchWithTimeout(url, {
    headers: {
      'accept': 'application/json',
      'user-agent': 'Mozilla/5.0 (compatible; iCloudPricingBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }

  return response.json();
};

const fetchText = async (url) => {
  const response = await fetchWithTimeout(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${url} (${response.status})`);
  }

  return response.text();
};

const fetchApplePricingHtml = async () => {
  const errors = [];

  for (const url of APPLE_PRICING_FALLBACK_URLS) {
    try {
      const html = await fetchText(url);
      if (/50\s*GB/i.test(html) && /iCloud/i.test(html)) {
        return { html, sourceUrl: url };
      }
      errors.push(`${url}: response does not look like Apple pricing HTML`);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(`Unable to fetch Apple pricing page. ${errors.join(' | ')}`);
};

/**
 * 独立获取汇率：优先实时，失败回落到内存/Redis 缓存，不阻塞 HTML 抓取。
 */
const resolveExchangeRates = async () => {
  try {
    const rateData = await fetchJson(EXCHANGE_RATE_URL);
    const rates = rateData.rates || {};
    if (Object.keys(rates).length === 0) {
      throw new Error('Exchange rate response is empty');
    }

    const payload = {
      rates,
      updatedAt: new Date().toISOString(),
      source: 'live'
    };
    setMemoryRatesCache(rates, 'live', payload.updatedAt);
    await writePersistentRatesCache(payload);
    return { rates, ratesSource: 'live' };
  } catch (error) {
    console.error('Failed to fetch live exchange rates:', error);

    const memoryRates = getMemoryRates();
    if (memoryRates) {
      return {
        rates: memoryRates.rates,
        ratesSource: `memory-${memoryRates.source || 'cached'}`
      };
    }

    const persistentRates = await readPersistentRatesCache();
    if (persistentRates?.rates) {
      setMemoryRatesCache(persistentRates.rates, 'persistent', persistentRates.updatedAt);
      return {
        rates: persistentRates.rates,
        ratesSource: 'persistent'
      };
    }

    throw new Error(`Unable to resolve exchange rates. ${error.message}`);
  }
};

const loadFreshPricing = async () => {
  const [ratesResult, applePricing] = await Promise.all([
    resolveExchangeRates(),
    fetchApplePricingHtml()
  ]);

  const data = parsePricingHtml(applePricing.html, ratesResult.rates);

  if (data.length === 0) {
    throw new Error('Apple pricing page parsed successfully but no pricing data was found.');
  }

  const payload = createResponsePayload(data, {
    updatedAt: new Date().toISOString(),
    resolvedSource: applePricing.sourceUrl,
    cacheStatus: 'fresh',
    ratesSource: ratesResult.ratesSource
  });

  setMemoryCache(payload);
  await writePersistentPricingCache(payload);
  return payload;
};

const serveFallbackChain = async (error, persistentPayload) => {
  const stalePayload = getStaleCache();
  if (stalePayload) {
    return { status: 200, cacheControl: 's-maxage=300, stale-while-revalidate=3600', body: stalePayload };
  }

  const stalePersistentPayload = decoratePersistentCache(
    persistentPayload || await readPersistentPricingCache(),
    { stale: true }
  );
  if (stalePersistentPayload) {
    setMemoryCache(stalePersistentPayload, new Date(stalePersistentPayload.updatedAt).getTime());
    return {
      status: 200,
      cacheControl: 's-maxage=300, stale-while-revalidate=3600',
      body: stalePersistentPayload
    };
  }

  const fallbackPayload = createResponsePayload(cloneData(fallbackPricingData), {
    updatedAt: FALLBACK_UPDATED_AT,
    cacheStatus: 'fallback',
    isFallback: true,
    message: `Live pricing fetch failed. Serving bundled fallback data. ${error.message}`
  });

  return {
    status: 200,
    cacheControl: 's-maxage=300, stale-while-revalidate=3600',
    body: fallbackPayload
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const shouldRefresh = req.query?.refresh === '1';
  const cachedPayload = shouldRefresh ? null : getValidCache();
  if (cachedPayload) {
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(cachedPayload);
  }

  const persistentPayload = shouldRefresh ? null : await readPersistentPricingCache();
  const validPersistentPayload = decoratePersistentCache(persistentPayload);
  if (validPersistentPayload) {
    setMemoryCache(validPersistentPayload, new Date(validPersistentPayload.updatedAt).getTime());
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(validPersistentPayload);
  }

  // 强制刷新：冷却期内直接返回现有缓存，避免击穿上游
  if (shouldRefresh && Date.now() < memoryRefreshLockUntil) {
    const cooldownPersistent = await readPersistentPricingCache();
    const cooldownPayload = getValidCache()
      || getStaleCache()
      || decoratePersistentCache(cooldownPersistent)
      || decoratePersistentCache(cooldownPersistent, { stale: true });
    if (cooldownPayload) {
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
      return res.status(200).json({
        ...cooldownPayload,
        message: cooldownPayload.message || 'Refresh cooldown active. Serving cached data.'
      });
    }
  }

  // 单实例 in-flight 合并
  if (inFlightRefresh) {
    try {
      const payload = await inFlightRefresh;
      res.setHeader('Cache-Control', shouldRefresh ? 'no-store' : 's-maxage=21600, stale-while-revalidate=86400');
      return res.status(200).json(payload);
    } catch (error) {
      const fallback = await serveFallbackChain(error, persistentPayload);
      res.setHeader('Cache-Control', fallback.cacheControl);
      return res.status(fallback.status).json(fallback.body);
    }
  }

  const lockAcquired = shouldRefresh ? await acquireRefreshLock() : true;
  if (shouldRefresh && !lockAcquired) {
    const lockedPersistent = await readPersistentPricingCache();
    const lockedPayload = getValidCache()
      || getStaleCache()
      || decoratePersistentCache(lockedPersistent)
      || decoratePersistentCache(lockedPersistent, { stale: true });
    if (lockedPayload) {
      res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
      return res.status(200).json({
        ...lockedPayload,
        message: lockedPayload.message || 'Another refresh is in progress. Serving cached data.'
      });
    }
  }

  inFlightRefresh = (async () => {
    try {
      return await loadFreshPricing();
    } finally {
      if (shouldRefresh) {
        memoryRefreshLockUntil = Date.now() + REFRESH_COOLDOWN_MS;
        await releaseRefreshLock();
      }
    }
  })();

  try {
    const payload = await inFlightRefresh;
    res.setHeader('Cache-Control', shouldRefresh ? 'no-store' : 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load pricing data:', error);
    const fallback = await serveFallbackChain(error, persistentPayload);
    res.setHeader('Cache-Control', fallback.cacheControl);
    return res.status(fallback.status).json(fallback.body);
  } finally {
    inFlightRefresh = null;
  }
}
