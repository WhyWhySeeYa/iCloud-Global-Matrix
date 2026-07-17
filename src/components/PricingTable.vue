<script setup>
/**
 * @file PricingTable.vue
 * @description 价格展示表格组件，负责渲染数据、筛选、排序和高亮显示
 */
import { computed, ref, watch } from 'vue';
import { STORAGE_TIERS } from '../config/constants.js';
import { useI18n } from '../composables/useI18n.js';
import { useTableQueryState } from '../composables/useTableQueryState.js';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: ''
  },
  refreshing: {
    type: Boolean,
    default: false
  },
  exporting: {
    type: Boolean,
    default: false
  },
  exportingImage: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  sortTier: {
    type: String,
    required: true
  },
  isAsc: {
    type: Boolean,
    required: true
  },
  bestPrices: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-sort', 'export-csv', 'export-json', 'refresh', 'retry', 'set-sort']);

const { t } = useI18n();

const {
  searchKeyword,
  selectedTiers,
  selectedCurrency,
  onlyBestPrices,
  currentPage,
  pageSize,
  resetFilters
} = useTableQueryState({
  getSortTier: () => props.sortTier,
  getIsAsc: () => props.isAsc,
  onRestoreSort: (tier, asc) => emit('set-sort', { tier, asc })
});

const showMobileFilters = ref(false);

const getPlan = (country, tier) => country.PlansByName?.[tier]
  || country.Plans?.find((plan) => plan.Name === tier);

const currencyOptions = computed(() => [...new Set(props.data.map((item) => item.Currency).filter(Boolean))].sort());

const visibleTiers = computed(() => selectedTiers.value.length > 0
  ? STORAGE_TIERS.filter((tier) => selectedTiers.value.includes(tier))
  : STORAGE_TIERS
);

const filteredData = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();

  return props.data.filter((country) => {
    const matchedKeyword = !keyword || [
      country.Country,
      country.CountryZH,
      country.LocalizedCountry,
      country.LocalizedCountryZH,
      country.CountryISO,
      country.Currency
    ].some((value) => String(value || '').toLowerCase().includes(keyword));

    const matchedCurrency = selectedCurrency.value === 'all' || country.Currency === selectedCurrency.value;
    const matchedTier = selectedTiers.value.length === 0 || selectedTiers.value.every((tier) =>
      Boolean(getPlan(country, tier))
    );
    const matchedBest = !onlyBestPrices.value || visibleTiers.value.some((tier) => {
      const plan = getPlan(country, tier);
      return plan && plan.PriceInCNY === props.bestPrices[tier];
    });

    return matchedKeyword && matchedCurrency && matchedTier && matchedBest;
  });
});

const exportData = computed(() => filteredData.value.map((country) => ({
  ...country,
  Plans: visibleTiers.value
    .map((tier) => getPlan(country, tier))
    .filter(Boolean)
})));

// 图片导出时渲染全量筛选结果，与 CSV/JSON 数据范围一致；平时走分页
const tableData = computed(() => {
  if (props.exportingImage) return filteredData.value;
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredData.value.slice(start, start + pageSize.value);
});

watch([searchKeyword, selectedTiers, selectedCurrency, onlyBestPrices], () => {
  currentPage.value = 1;
}, { deep: true });

watch(() => filteredData.value.length, (total) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize.value));
  if (currentPage.value > lastPage) currentPage.value = lastPage;
});

watch(pageSize, () => {
  currentPage.value = 1;
});

const rowIndex = (index) => (props.exportingImage ? index + 1 : (currentPage.value - 1) * pageSize.value + index + 1);
</script>

<template>
  <!-- Error State -->
  <div v-if="error" class="mb-8 p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-center text-sm space-y-4">
    <p>{{ error }}</p>
    <button
      type="button"
      class="btn-filter-action !text-red-600 dark:!text-red-300"
      :disabled="loading || refreshing"
      @click="emit('retry')"
    >
      {{ refreshing || loading ? t('refreshingPricingData') : t('retry') }}
    </button>
  </div>

  <!-- Loading State -->
  <div v-else-if="loading" class="flex flex-col items-center justify-center py-32 space-y-4">
    <svg class="animate-spin h-8 w-8 text-[#86868b]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p class="text-[#86868b] text-sm">{{ loadingText }}</p>
  </div>

  <!-- Data Table -->
  <div v-else class="bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors duration-300 p-2 md:p-4">
    <div class="mb-4 space-y-3">
      <!-- 桌面端强制单行；移动端搜索单独一行，筛选可折叠 -->
      <div class="flex flex-col gap-2 md:flex-row md:flex-nowrap md:items-center">
        <div class="flex min-w-0 flex-1 gap-2 md:max-w-xs md:flex-none">
          <el-input
            v-model="searchKeyword"
            clearable
            :placeholder="t('searchPlaceholder')"
            class="filter-control min-w-0 flex-1"
          />
          <button
            type="button"
            class="btn-filter-action md:hidden shrink-0"
            @click="showMobileFilters = !showMobileFilters"
          >
            {{ showMobileFilters ? t('hideFilters') : t('showFilters') }}
          </button>
        </div>

        <div
          class="min-w-0 flex-col gap-2 md:flex md:flex-1 md:flex-row md:flex-nowrap md:items-center"
          :class="showMobileFilters ? 'flex' : 'hidden'"
        >
          <div class="filter-control w-full md:w-44 md:shrink-0">
            <el-select
              v-model="selectedTiers"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              :placeholder="t('allPlans')"
              class="w-full"
            >
              <el-option v-for="tier in STORAGE_TIERS" :key="tier" :value="tier" :label="tier" />
            </el-select>
          </div>
          <div class="filter-control w-full md:w-36 md:shrink-0">
            <el-select v-model="selectedCurrency" filterable class="w-full">
              <el-option value="all" :label="t('allCurrencies')" />
              <el-option v-for="currency in currencyOptions" :key="currency" :value="currency" :label="currency" />
            </el-select>
          </div>
          <el-checkbox v-model="onlyBestPrices" class="!mr-0 min-h-8 shrink-0 whitespace-nowrap">
            {{ t('onlyBestPrices') }}
          </el-checkbox>
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#86868b]">
        <span class="shrink-0">{{ t('visibleRows') }}: {{ filteredData.length }} / {{ t('totalRows') }}: {{ data.length }}</span>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-nowrap">
          <button class="btn-filter-action" @click="resetFilters">{{ t('resetFilters') }}</button>
          <button class="btn-filter-action" :disabled="refreshing" @click="emit('refresh')">
            {{ refreshing ? t('refreshingPricingData') : t('refreshPricing') }}
          </button>
          <button class="btn-filter-action" :disabled="exporting" @click="emit('export-csv', { data: exportData, tiers: visibleTiers })">
            {{ t('exportCsv') }}
          </button>
          <button class="btn-filter-action" :disabled="exporting" @click="emit('export-json', exportData)">
            {{ t('exportJson') }}
          </button>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredData.length === 0" :description="t('noMatchingData')" />

    <div v-else class="pricing-export-area">
      <el-table :data="tableData" style="width: 100%" :row-class-name="() => 'transition-colors'">
        <el-table-column fixed prop="CountryZH" :label="t('region')" min-width="120">
          <template #default="scope">
            <div class="flex items-center gap-2 md:gap-3">
              <span class="text-[#86868b] text-xs w-4 md:w-5 text-right shrink-0">{{ rowIndex(scope.$index) }}</span>
              <div class="flex flex-col min-w-0">
                <span class="font-medium text-[#1d1d1f] dark:text-white truncate">{{ scope.row.LocalizedCountryZH || scope.row.CountryZH }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="Currency" :label="t('currency')" align="center" min-width="120">
          <template #default="scope">
            <span class="text-xs text-[#86868b]">{{ scope.row.Currency }}</span>
          </template>
        </el-table-column>

        <el-table-column v-for="tier in visibleTiers" :key="tier" :label="tier" align="center" min-width="120">
          <template #header>
            <button
              type="button"
              class="flex items-center justify-center gap-1.5 cursor-pointer select-none group w-full bg-transparent border-0 p-0"
              :class="{'text-[#1d1d1f] dark:text-white': sortTier === tier, 'text-[#86868b]': sortTier !== tier}"
              :aria-sort="sortTier === tier ? (isAsc ? 'ascending' : 'descending') : 'none'"
              @click="emit('toggle-sort', tier)"
            >
              {{ tier }}
              <div
                class="flex flex-col gap-[2px] opacity-0 group-hover:opacity-50 transition-opacity"
                :class="{'!opacity-100': sortTier === tier}"
              >
                <svg class="w-2 h-2" :class="{'text-[#0071e3]': sortTier === tier && isAsc}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>
                <svg class="w-2 h-2" :class="{'text-[#0071e3]': sortTier === tier && !isAsc}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </button>
          </template>
          <template #default="scope">
            <div
              v-for="plan in [getPlan(scope.row, tier)]"
              :key="tier"
              class="flex flex-col items-center justify-center w-full h-full"
              :class="{'bg-gray-50/30 dark:bg-white/[0.01]': sortTier === tier}"
            >
              <template v-if="plan">
                <div class="flex items-center gap-1.5">
                  <span
                    class="text-[#1d1d1f] dark:text-white"
                    :class="{'font-medium': plan.PriceInCNY === bestPrices[tier]}"
                  >
                    {{ plan.Price }}
                  </span>
                  <span
                    v-if="plan.PriceInCNY === bestPrices[tier]"
                    class="flex h-1.5 w-1.5 rounded-full bg-[#0071e3]"
                    :title="t('bestPrice')"
                  />
                </div>
                <span
                  v-if="plan.PriceInCNY"
                  class="text-[11px] mt-0.5"
                  :class="plan.PriceInCNY === bestPrices[tier] ? 'text-[#0071e3]' : 'text-[#86868b]'"
                >
                  ¥{{ plan.PriceInCNY.toFixed(2) }}
                </span>
              </template>
              <span v-else class="text-gray-300 dark:text-gray-700">-</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="filteredData.length > 20 && !exportingImage" class="flex justify-center mt-4 overflow-x-auto pb-1">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[20, 50, 100]"
        :total="filteredData.length"
        layout="sizes, prev, pager, next"
        small
        background
      />
    </div>
  </div>
</template>

<style scoped>
.btn-filter-action {
  @apply px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors whitespace-nowrap;
}

.btn-filter-action:disabled {
  @apply opacity-50 cursor-wait hover:bg-gray-100 dark:hover:bg-white/10;
}

/* 约束 Element Plus 控件宽度，避免桌面端把筛选栏撑换行 */
.filter-control :deep(.el-input),
.filter-control :deep(.el-select),
.filter-control :deep(.el-select__wrapper) {
  width: 100%;
}

.filter-control :deep(.el-select) {
  min-width: 0;
}

:deep(.el-table) {
  --el-table-border-color: transparent;
  --el-table-header-bg-color: #ffffff;
  --el-table-bg-color: #ffffff;
  --el-table-tr-bg-color: #ffffff;
  --el-table-row-hover-bg-color: #fcfcfd;
  background-color: transparent;
}

:deep(.el-table th.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-table__inner-wrapper::before) {
  display: none;
}
</style>

<style>
/* 使用全局样式并增加优先级，确保覆盖 Element Plus 默认的暗色变量 */
html.dark .el-table {
  --el-table-border-color: #2c2c2e !important;
  --el-border-color-lighter: #2c2c2e !important;
  --el-table-header-bg-color: #1c1c1e !important;
  --el-table-bg-color: #1c1c1e !important;
  --el-table-tr-bg-color: #1c1c1e !important;
  --el-table-row-hover-bg-color: #212123 !important;
}
</style>
