/**
 * @file useI18n.js
 * @description 简单多语言翻译 Hook，支持通过环境变量设置默认语言
 */
import { computed, ref } from 'vue';

const DEFAULT_LOCALE = import.meta.env.VITE_DEFAULT_LOCALE || 'en';
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
    dataFetchFailed: 'DATA FETCH FAILED. CHECK NETWORK OR USE LOCAL SOURCE.'
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
    dataFetchFailed: '数据获取失败，请检查网络或使用本地数据源。'
  }
};

const normalizeLocale = (locale) => {
  if (!locale) return 'en';
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh';
  return 'en';
};

const initialLocale = normalizeLocale(
  localStorage.getItem(STORAGE_KEY) || DEFAULT_LOCALE || navigator.language
);

const locale = ref(initialLocale);

export function useI18n() {
  const availableLocales = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' }
  ];

  const t = (key) => messages[locale.value]?.[key] || messages.en[key] || key;

  const setLocale = (nextLocale) => {
    locale.value = normalizeLocale(nextLocale);
    localStorage.setItem(STORAGE_KEY, locale.value);
    document.documentElement.lang = locale.value === 'zh' ? 'zh-CN' : 'en';
  };

  const toggleLocale = () => {
    setLocale(locale.value === 'zh' ? 'en' : 'zh');
  };

  setLocale(locale.value);

  return {
    locale,
    availableLocales,
    currentLocaleLabel: computed(() => availableLocales.find((item) => item.value === locale.value)?.label || 'English'),
    t,
    setLocale,
    toggleLocale
  };
}
