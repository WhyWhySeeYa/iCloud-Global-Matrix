import { FALLBACK_UPDATED_AT, fallbackPricingData } from './fallback-pricing.js';
import { parsePricingHtml } from './lib/pricing-parser.js';
import { readPersistentPricingCache, writePersistentPricingCache } from './lib/persistent-cache.js';

const APPLE_PRICING_URL = 'https://support.apple.com/zh-cn/108047';
const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/CNY';
const MEMORY_CACHE_TTL = 1000 * 60 * 60 * 6;
const STALE_CACHE_TTL = 1000 * 60 * 60 * 24;
const PERSISTENT_STALE_CACHE_TTL = 1000 * 60 * 60 * 24 * 7;
const REQUEST_TIMEOUT = 1000 * 12;
const APPLE_PRICING_FALLBACK_URLS = [
  APPLE_PRICING_URL,
  `https://corsproxy.io/?${encodeURIComponent(APPLE_PRICING_URL)}`,
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(APPLE_PRICING_URL)}`
];


let memoryCache = null;

const cloneData = (data) => JSON.parse(JSON.stringify(data));

const createResponsePayload = (data, meta = {}) => ({
  data,
  updatedAt: meta.updatedAt || new Date().toISOString(),
  source: APPLE_PRICING_URL,
  resolvedSource: meta.resolvedSource || APPLE_PRICING_URL,
  cacheStatus: meta.cacheStatus || 'fresh',
  isFallback: Boolean(meta.isFallback),
  message: meta.message || null
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

const decoratePersistentCache = (payload, { stale = false } = {}) => {
  if (!payload?.updatedAt) return null;

  const age = Date.now() - new Date(payload.updatedAt).getTime();
  const maxAge = stale ? PERSISTENT_STALE_CACHE_TTL : MEMORY_CACHE_TTL;
  if (!Number.isFinite(age) || age < 0 || age > maxAge) return null;

  return {
    ...payload,
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

  try {
    const [rateData, applePricing] = await Promise.all([
      fetchJson(EXCHANGE_RATE_URL),
      fetchApplePricingHtml()
    ]);

    const data = parsePricingHtml(applePricing.html, rateData.rates || {});

    if (data.length === 0) {
      throw new Error('Apple pricing page parsed successfully but no pricing data was found.');
    }

    const payload = createResponsePayload(data, {
      updatedAt: new Date().toISOString(),
      resolvedSource: applePricing.sourceUrl,
      cacheStatus: 'fresh'
    });

    setMemoryCache(payload);
    await writePersistentPricingCache(payload);
    res.setHeader('Cache-Control', shouldRefresh ? 'no-store' : 's-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to load pricing data:', error);

    const stalePayload = getStaleCache();
    if (stalePayload) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      return res.status(200).json(stalePayload);
    }

    const stalePersistentPayload = decoratePersistentCache(
      persistentPayload || await readPersistentPricingCache(),
      { stale: true }
    );
    if (stalePersistentPayload) {
      setMemoryCache(stalePersistentPayload, new Date(stalePersistentPayload.updatedAt).getTime());
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
      return res.status(200).json(stalePersistentPayload);
    }

    const fallbackPayload = createResponsePayload(cloneData(fallbackPricingData), {
      updatedAt: FALLBACK_UPDATED_AT,
      cacheStatus: 'fallback',
      isFallback: true,
      message: `Live pricing fetch failed. Serving bundled fallback data. ${error.message}`
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(fallbackPayload);
  }
}
