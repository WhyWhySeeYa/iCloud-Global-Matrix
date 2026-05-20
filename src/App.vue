<script setup>
/**
 * @file App.vue
 * @description 主应用组件，负责视图渲染和组合各个业务逻辑 Hook
 */
import { computed, ref, onMounted } from 'vue';
import { useTheme } from './composables/useTheme.js';
import { usePricingData } from './composables/usePricingData.js';
import { useExport } from './composables/useExport.js';
import { useI18n } from './composables/useI18n.js';

// 组件引入
import AppHeader from './components/AppHeader.vue';
import PricingTable from './components/PricingTable.vue';

// --- DOM 引用 ---
const tableContainer = ref(null); // 表格 DOM 容器的引用，用于截图导出

// --- 组合式 API (Hooks) 引入 ---

// 1. 多语言翻译逻辑
const { locale, currentLocaleLabel, t, localizeRegion, toggleLocale } = useI18n();

// 2. 主题管理逻辑
const { isDark, toggleTheme } = useTheme();

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || t('appTitle'));
const heroTitle = computed(() => import.meta.env.VITE_HERO_TITLE || t('heroTitle'));
const heroSubtitle = computed(() => import.meta.env.VITE_HERO_SUBTITLE || t('heroSubtitle'));
const pricingTableLabels = computed(() => ({
  region: t('region'),
  currency: t('currency'),
  bestPrice: t('bestPrice')
}));

// 3. 核心业务数据逻辑 (获取、解析、排序)
const { 
  loading, 
  loadingText, 
  error, 
  sortTier, 
  isAsc, 
  sortedData, 
  bestPrices,
  fetchData,
  toggleSort
} = usePricingData(t);

const localizedSortedData = computed(() => sortedData.value.map((item) => ({
  ...item,
  LocalizedCountry: localizeRegion(item.CountryISO, item.Country),
  LocalizedCountryZH: localizeRegion(item.CountryISO, item.CountryZH)
})));

// 4. 导出图片逻辑
const { saveAsImage } = useExport();

/**
 * 触发图片导出
 * 将 DOM 引用和当前主题状态传递给导出 Hook
 */
const handleExport = () => {
  // 注意：这里传递的是 PricingTable 组件根元素的引用
  // 如果 PricingTable 内部有多个根元素，可能需要调整 ref 的绑定位置
  // 目前 PricingTable 使用 v-if/v-else 切换根元素，但在导出时通常是数据已加载状态
  // 建议在 PricingTable 内部暴露具体的表格容器 ref，或者确保导出时 DOM 结构稳定
  
  // 简单起见，我们这里假设 tableContainer 指向的是包含表格的 div
  // 由于 PricingTable 内部有 v-if，我们需要确保获取到的是实际的表格容器
  // 更好的做法是在 PricingTable 内部暴露一个方法或 ref，但为了保持父子组件解耦，
  // 我们这里通过 ref 获取组件实例，或者直接在父组件包裹一层 div 用于截图
  saveAsImage(tableContainer.value, isDark.value);
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
      :locale-label="currentLocaleLabel"
      @toggle-theme="toggleTheme"
      @toggle-locale="toggleLocale"
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
          :error="error"
          :sort-tier="sortTier"
          :is-asc="isAsc"
          :best-prices="bestPrices"
          :labels="pricingTableLabels"
          @toggle-sort="toggleSort"
        />
      </div>

      <!-- 底部页脚 -->
      <footer class="mt-12 pb-8 text-center text-xs text-[#86868b]">
        <p>{{ t('dataSource') }}</p>
        <p class="mt-1">{{ t('lastUpdated') }}: {{ new Date().toLocaleTimeString(locale) }}</p>
      </footer>
    </main>
  </div>
</template>