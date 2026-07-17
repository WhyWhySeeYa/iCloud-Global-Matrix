<script setup>
/**
 * @file App.vue
 * @description 主应用组件，负责视图渲染和组合各个业务逻辑 Hook
 */
import { computed, nextTick, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useTheme } from './composables/useTheme.js';
import { usePricingData } from './composables/usePricingData.js';
import { useExport } from './composables/useExport.js';
import { useI18n } from './composables/useI18n.js';

// 组件引入
import AppHeader from './components/AppHeader.vue';
import PricingTable from './components/PricingTable.vue';

// --- DOM 引用 ---
const tableContainer = ref(null); // 表格 DOM 容器的引用，用于截图导出
const exporting = ref(false);
const exportingImage = ref(false);

// --- 组合式 API (Hooks) 引入 ---

// 1. 多语言翻译逻辑
const { locale, availableLocales, currentLocaleLabel, t, localizeRegion, setLocale } = useI18n();

// 2. 主题管理逻辑
const { isDark, toggleTheme } = useTheme();

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || t('appTitle'));
const heroTitle = computed(() => import.meta.env.VITE_HERO_TITLE || t('heroTitle'));
const heroSubtitle = computed(() => import.meta.env.VITE_HERO_SUBTITLE || t('heroSubtitle'));

// 3. 核心业务数据逻辑 (获取、解析、排序)
const {
  loading,
  refreshing,
  loadingText,
  error,
  sortTier,
  isAsc,
  sortedData,
  bestPrices,
  meta,
  fetchData,
  toggleSort,
  setSortState
} = usePricingData(t);

const localizedSortedData = computed(() => sortedData.value.map((item) => ({
  ...item,
  LocalizedCountry: localizeRegion(item.CountryISO, item.Country),
  LocalizedCountryZH: localizeRegion(item.CountryISO, item.CountryZH)
})));

const dataStatusLabel = computed(() => {
  if (!meta.value) return '';
  if (meta.value.isFallback) return t('fallbackData');
  if (['memory', 'stale', 'persistent', 'persistent-stale'].includes(meta.value.cacheStatus)) return t('cachedData');
  return t('liveData');
});

// 4. 导出图片逻辑
const { saveAsImage, saveAsCsv, saveAsJson } = useExport();

/**
 * 触发图片导出
 * 将 DOM 引用和当前主题状态传递给导出 Hook
 */
const waitForPaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  });
});

const runExport = async (task, { expandTable = false } = {}) => {
  if (exporting.value) return;

  exporting.value = true;
  exportingImage.value = expandTable;
  try {
    // 图片导出前展开全量筛选结果，与 CSV/JSON 数据范围对齐
    if (expandTable) {
      await nextTick();
      await waitForPaint();
    }
    await task();
    ElMessage.success(t('exportSuccess'));
  } catch (err) {
    console.error('导出失败:', err);
    ElMessage.error(t('exportFailed'));
  } finally {
    exporting.value = false;
    exportingImage.value = false;
  }
};

const handleExport = () => {
  runExport(() => saveAsImage(tableContainer.value, isDark.value), { expandTable: true });
};

const handleExportCsv = ({ data, tiers }) => {
  runExport(() => saveAsCsv(data, tiers));
};

const handleExportJson = (data) => {
  runExport(() => saveAsJson({ meta: meta.value, data }));
};

const handleRefresh = async () => {
  const success = await fetchData({ force: true });
  if (success) ElMessage.success(t('refreshSuccess'));
};

const handleRetry = async () => {
  await fetchData();
};

const handleSetSort = ({ tier, asc }) => {
  setSortState(tier, asc);
};

// --- 生命周期钩子 ---

// 组件挂载完成后，自动触发数据抓取流程
onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300 selection:bg-[#0071e3]/30">

    <!-- 顶部导航栏 -->
    <AppHeader
      :is-dark="isDark"
      :app-title="appTitle"
      :export-label="t('export')"
      :theme-title="isDark ? t('switchToLight') : t('switchToDark')"
      :locale="locale"
      :available-locales="availableLocales"
      :locale-label="currentLocaleLabel"
      :exporting="exporting"
      @toggle-theme="toggleTheme"
      @set-locale="setLocale"
      @export="handleExport"
    />

    <main class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <!-- 页面标题区域 -->
      <div class="text-center mb-8 md:mb-12">
        <h2 class="text-2xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] dark:text-white mb-3 md:mb-4">{{ heroTitle }}</h2>
        <p class="text-sm md:text-lg text-[#86868b] max-w-2xl mx-auto">{{ heroSubtitle }}</p>
      </div>

      <!-- 价格表格区域 (用于截图导出的容器) -->
      <div ref="tableContainer">
        <PricingTable
          :data="localizedSortedData"
          :loading="loading"
          :loading-text="loadingText"
          :refreshing="refreshing"
          :exporting="exporting"
          :exporting-image="exportingImage"
          :error="error"
          :sort-tier="sortTier"
          :is-asc="isAsc"
          :best-prices="bestPrices"
          @toggle-sort="toggleSort"
          @set-sort="handleSetSort"
          @export-csv="handleExportCsv"
          @export-json="handleExportJson"
          @refresh="handleRefresh"
          @retry="handleRetry"
        />
      </div>

      <!-- 底部页脚 -->
      <footer class="mt-12 pb-8 text-center text-xs text-[#86868b]">
        <p>{{ t('dataSource') }}</p>
        <p v-if="meta" class="mt-1">
          {{ t('lastUpdated') }}: {{ new Date(meta.updatedAt).toLocaleString(locale) }} · {{ t('dataStatus') }}: {{ dataStatusLabel }}
          <template v-if="meta.countryCount"> · {{ t('region') }}: {{ meta.countryCount }}</template>
        </p>
        <p v-if="meta?.message" class="mt-1 text-amber-600 dark:text-amber-400">{{ meta.message }}</p>
      </footer>
    </main>
  </div>
</template>
