import { computed } from 'vue';
import { useI18n as useVueI18n } from 'vue-i18n';
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '../i18n/index.js';

export function useI18n() {
  const { locale, t } = useVueI18n({ useScope: 'global' });

  const setLocale = (nextLocale) => {
    const supported = SUPPORTED_LOCALES.some((item) => item.value === nextLocale);
    locale.value = supported ? nextLocale : 'zh-CN';
    localStorage.setItem(LOCALE_STORAGE_KEY, locale.value);
    document.documentElement.lang = locale.value;
  };

  const localizeRegion = (countryISO, fallbackName) => {
    if (!countryISO || countryISO === 'UN') return fallbackName;
    if (countryISO === 'CN') return t('chinaMainland');

    try {
      const regionNames = new Intl.DisplayNames([locale.value, 'en-US'], { type: 'region' });
      return regionNames.of(countryISO) || fallbackName;
    } catch {
      return fallbackName;
    }
  };

  setLocale(locale.value);

  return {
    locale,
    availableLocales: SUPPORTED_LOCALES,
    currentLocaleLabel: computed(() =>
      SUPPORTED_LOCALES.find((item) => item.value === locale.value)?.label || locale.value
    ),
    t,
    localizeRegion,
    setLocale
  };
}
