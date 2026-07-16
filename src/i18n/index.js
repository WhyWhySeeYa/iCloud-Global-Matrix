import { createI18n } from 'vue-i18n';
import en from '../locales/en.json';
import zhCN from '../locales/zh-CN.json';
import zhTW from '../locales/zh-TW.json';

export const LOCALE_STORAGE_KEY = 'icloud-pricing-locale';

export const SUPPORTED_LOCALES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en-US', label: 'English' }
];

const normalizeLocale = (value) => {
  const locale = String(value || '').replace('_', '-').toLowerCase();
  if (locale === 'zh-tw' || locale === 'zh-hk' || locale === 'zh-hant') return 'zh-TW';
  if (locale.startsWith('zh')) return 'zh-CN';
  if (locale.startsWith('en')) return 'en-US';
  return null;
};

const getInitialLocale = () => {
  const configuredLocale = normalizeLocale(import.meta.env.VITE_DEFAULT_LOCALE);
  const savedLocale = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
  const browserLocale = normalizeLocale(navigator.language);
  return savedLocale || configuredLocale || browserLocale || 'zh-CN';
};

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'en-US': en,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
});
