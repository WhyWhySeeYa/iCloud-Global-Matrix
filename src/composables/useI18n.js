/**
 * @file useI18n.js
 * @description 多语言翻译 Hook，支持通过环境变量数组配置可选语言区域
 */
import { computed, ref } from 'vue';

const GLOBAL_LOCALES = [
  'en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'pt-BR',
  'pt-PT', 'ru-RU', 'ar-SA', 'hi-IN', 'id-ID', 'ms-MY', 'th-TH', 'vi-VN', 'tr-TR', 'nl-NL',
  'pl-PL', 'sv-SE', 'da-DK', 'no-NO', 'fi-FI', 'cs-CZ', 'hu-HU', 'ro-RO', 'el-GR', 'he-IL',
  'uk-UA', 'sk-SK', 'hr-HR', 'bg-BG', 'ca-ES'
];
const LOCALE_CONFIG = import.meta.env.VITE_DEFAULT_LOCALE || JSON.stringify(GLOBAL_LOCALES);
const STORAGE_KEY = 'icloud-pricing-locale';

const messages = {
  en: {
    appTitle: 'iCloud+ Pricing',
    heroTitle: 'Global Pricing Matrix.',
    heroSubtitle: 'Compare iCloud+ storage plans across different regions and currencies in real-time.',
    export: 'Export',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    region: 'Region',
    currency: 'Currency',
    bestPrice: 'Best Price',
    dataSource: 'Data Source: Apple Official Support • Exchange Rates: Open ER API',
    lastUpdated: 'Last Updated',
    initializing: 'INITIALIZING SYSTEM...',
    fetchingPricingData: 'FETCHING PRICING DATA...',
    dataFetchFailed: 'DATA FETCH FAILED. CHECK NETWORK OR USE LOCAL SOURCE.',
    searchPlaceholder: 'Search region or currency',
    allPlans: 'All Plans',
    allCurrencies: 'All Currencies',
    onlyBestPrices: 'Best Prices Only',
    resetFilters: 'Reset',
    visibleRows: 'Visible',
    totalRows: 'Total',
    dataStatus: 'Data Status',
    fallbackData: 'Fallback Data',
    cachedData: 'Cached Data',
    liveData: 'Live Data',
    noMatchingData: 'No matching data',
    exportCsv: 'CSV',
    exportJson: 'JSON'
  },
  zh: {
    appTitle: 'iCloud+ 价格',
    heroTitle: '全球价格矩阵。',
    heroSubtitle: '实时比较不同国家/地区和货币的 iCloud+ 存储套餐价格。',
    export: '导出',
    switchToLight: '切换到亮色模式',
    switchToDark: '切换到暗色模式',
    region: '地区',
    currency: '货币',
    bestPrice: '最低价格',
    dataSource: '数据来源：Apple 官方支持 • 汇率：Open ER API',
    lastUpdated: '最后更新',
    initializing: '正在初始化系统...',
    fetchingPricingData: '正在获取价格数据...',
    dataFetchFailed: '数据获取失败，请检查网络或使用本地数据源。',
    searchPlaceholder: '搜索地区或货币',
    allPlans: '全部套餐',
    allCurrencies: '全部货币',
    onlyBestPrices: '只看最低价',
    resetFilters: '重置',
    visibleRows: '当前显示',
    totalRows: '总数',
    dataStatus: '数据状态',
    fallbackData: '兜底数据',
    cachedData: '缓存数据',
    liveData: '实时数据',
    noMatchingData: '没有匹配数据',
    exportCsv: 'CSV',
    exportJson: 'JSON'
  }
};

const parseLocaleConfig = (value) => {
  if (!value) return GLOBAL_LOCALES;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // 兼容 VITE_DEFAULT_LOCALE=en-US,zh-CN 这种写法
  }

  return value.split(',');
};

const normalizeLocale = (locale) => {
  const normalized = String(locale || 'en-US').trim().replace('_', '-');

  try {
    return Intl.getCanonicalLocales(normalized)[0] || 'en-US';
  } catch {
    return 'en-US';
  }
};

const configuredLocales = [...new Set(parseLocaleConfig(LOCALE_CONFIG).map(normalizeLocale))];
const supportedLocales = configuredLocales.length > 0 ? configuredLocales : GLOBAL_LOCALES;

const getMessageLocale = (value) => {
  const normalized = normalizeLocale(value).toLowerCase();
  if (normalized.startsWith('zh')) return 'zh';
  return 'en';
};

const getLocaleLabel = (value) => {
  const normalized = normalizeLocale(value);
  const lowerLocale = normalized.toLowerCase();

  if (lowerLocale.startsWith('zh')) return '中文';
  if (lowerLocale.startsWith('en')) return 'English';

  const languageNames = new Intl.DisplayNames([normalized, 'en-US'], { type: 'language' });
  const [language] = normalized.split('-');
  return languageNames.of(language) || normalized;
};

const getInitialLocale = () => {
  const savedLocale = localStorage.getItem(STORAGE_KEY);
  const browserLocale = navigator.language;
  const candidates = [savedLocale, browserLocale, ...supportedLocales].filter(Boolean).map(normalizeLocale);

  return candidates.find((candidate) => supportedLocales.includes(candidate)) || supportedLocales[0];
};

const locale = ref(getInitialLocale());

export function useI18n() {
  const availableLocales = supportedLocales.map((value) => ({
    value,
    label: getLocaleLabel(value)
  }));

  const t = (key) => {
    const messageLocale = getMessageLocale(locale.value);
    return messages[messageLocale]?.[key] || messages.en[key] || key;
  };

  const localizeRegion = (countryISO, fallbackName) => {
    if (!countryISO || countryISO === 'UN') return fallbackName;
    if (countryISO === 'CN') return getMessageLocale(locale.value) === 'zh' ? '中国大陆' : 'China mainland';

    try {
      const regionNames = new Intl.DisplayNames([locale.value, 'en-US'], { type: 'region' });
      return regionNames.of(countryISO) || fallbackName;
    } catch {
      return fallbackName;
    }
  };

  const setLocale = (nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    locale.value = supportedLocales.includes(normalized) ? normalized : supportedLocales[0];
    localStorage.setItem(STORAGE_KEY, locale.value);
    document.documentElement.lang = locale.value;
  };

  const toggleLocale = () => {
    const currentIndex = supportedLocales.indexOf(locale.value);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % supportedLocales.length : 0;
    setLocale(supportedLocales[nextIndex]);
  };

  setLocale(locale.value);

  return {
    locale,
    availableLocales,
    currentLocaleLabel: computed(() => availableLocales.find((item) => item.value === locale.value)?.label || locale.value),
    t,
    localizeRegion,
    setLocale,
    toggleLocale
  };
}
