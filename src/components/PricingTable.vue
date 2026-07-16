<script setup>
/**
 * @file PricingTable.vue
 * @description 价格展示表格组件，负责渲染数据、筛选、排序和高亮显示
 */
import { computed, ref } from 'vue';
import { STORAGE_TIERS } from '../config/constants.js';

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
  },
  labels: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-sort', 'export-csv', 'export-json']);

const searchKeyword = ref('');
const selectedTier = ref('all');
const selectedCurrency = ref('all');
const onlyBestPrices = ref(false);
const selectedBenchmark = ref('none');

const currencyOptions = computed(() => [...new Set(props.data.map((item) => item.Currency).filter(Boolean))].sort());

const countryOptions = computed(() => props.data
  .map((country) => ({
    value: country.CountryISO || country.Country,
    label: country.LocalizedCountryZH || country.LocalizedCountry || country.CountryZH || country.Country,
    currency: country.Currency
  }))
  .filter((country) => country.value && country.label)
  .sort((a, b) => a.label.localeCompare(b.label)));

const benchmarkCountry = computed(() => {
  if (selectedBenchmark.value === 'none') return null;
  return props.data.find((country) => (country.CountryISO || country.Country) === selectedBenchmark.value) || null;
});

const getPlan = (country, tier) => country?.Plans.find((plan) => plan.Name === tier);

const getBenchmarkComparison = (country, tier) => {
  const benchmarkPlan = getPlan(benchmarkCountry.value, tier);
  const currentPlan = getPlan(country, tier);
  const benchmarkPrice = benchmarkPlan?.PriceInCNY;
  const currentPrice = currentPlan?.PriceInCNY;

  if (!benchmarkCountry.value || !benchmarkPrice || !currentPrice || country === benchmarkCountry.value) return null;

  const diff = currentPrice - benchmarkPrice;
  const percent = benchmarkPrice ? (diff / benchmarkPrice) * 100 : 0;

  return {
    diff,
    percent,
    isHigher: diff > 0,
    isLower: diff < 0,
    text: `${diff > 0 ? '+' : ''}${percent.toFixed(1)}%`
  };
};

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
    const matchedTier = selectedTier.value === 'all' || country.Plans.some((plan) => plan.Name === selectedTier.value);
    const matchedBest = !onlyBestPrices.value || country.Plans.some((plan) => plan.PriceInCNY === props.bestPrices[plan.Name]);

    return matchedKeyword && matchedCurrency && matchedTier && matchedBest;
  });
});

const resetFilters = () => {
  searchKeyword.value = '';
  selectedTier.value = 'all';
  selectedCurrency.value = 'all';
  selectedBenchmark.value = 'none';
  onlyBestPrices.value = false;
};
</script>

<template>
  <!-- Error State -->
  <div v-if="error" class="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-center text-sm">
    {{ error }}
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
    <div class="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
      <div class="flex flex-col sm:flex-row gap-2 flex-1">
        <el-input v-model="searchKeyword" clearable :placeholder="labels.searchPlaceholder" class="max-w-full sm:max-w-64" />
        <el-select v-model="selectedTier" class="w-full sm:w-36">
          <el-option value="all" :label="labels.allPlans" />
          <el-option v-for="tier in STORAGE_TIERS" :key="tier" :value="tier" :label="tier" />
        </el-select>
        <el-select v-model="selectedCurrency" filterable class="w-full sm:w-40">
          <el-option value="all" :label="labels.allCurrencies" />
          <el-option v-for="currency in currencyOptions" :key="currency" :value="currency" :label="currency" />
        </el-select>
        <el-select v-model="selectedBenchmark" filterable class="w-full sm:w-52" :placeholder="labels.benchmarkPlaceholder">
          <el-option value="none" :label="labels.noBenchmark" />
          <el-option
            v-for="country in countryOptions"
            :key="country.value"
            :value="country.value"
            :label="`${country.label} (${country.currency})`"
          />
        </el-select>
        <el-checkbox v-model="onlyBestPrices" class="!mr-0">{{ labels.onlyBestPrices }}</el-checkbox>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs text-[#86868b]">
        <span>{{ labels.visibleRows }}: {{ filteredData.length }} / {{ labels.totalRows }}: {{ data.length }}</span>
        <button class="btn-filter-action" @click="resetFilters">{{ labels.resetFilters }}</button>
        <button class="btn-filter-action" @click="emit('export-csv', filteredData)">{{ labels.exportCsv }}</button>
        <button class="btn-filter-action" @click="emit('export-json', filteredData)">{{ labels.exportJson }}</button>
      </div>
    </div>

    <el-empty v-if="filteredData.length === 0" :description="labels.noMatchingData" />

    <div v-else class="pricing-export-area">
      <el-table :data="filteredData" style="width: 100%" :row-class-name="() => 'transition-colors'">
      <el-table-column fixed prop="CountryZH" :label="labels.region" min-width="120">
        <template #default="scope">
          <div class="flex items-center gap-2 md:gap-3">
            <span class="text-[#86868b] text-xs w-4 md:w-5 text-right shrink-0">{{ scope.$index + 1 }}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-medium text-[#1d1d1f] dark:text-white truncate">{{ scope.row.LocalizedCountryZH || scope.row.CountryZH }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="Currency" :label="labels.currency" align="center" min-width="120">
        <template #default="scope">
          <span class="text-xs text-[#86868b]">{{ scope.row.Currency }}</span>
        </template>
      </el-table-column>

      <el-table-column v-for="tier in STORAGE_TIERS" :key="tier" :label="tier" align="center" min-width="120">
        <template #header>
          <div class="flex items-center justify-center gap-1.5 cursor-pointer select-none group"
               @click="emit('toggle-sort', tier)"
               :class="{'text-[#1d1d1f] dark:text-white': sortTier === tier, 'text-[#86868b]': sortTier !== tier}">
            {{ tier }}
            <div class="flex flex-col gap-[2px] opacity-0 group-hover:opacity-50 transition-opacity"
                 :class="{'!opacity-100': sortTier === tier}">
              <svg class="w-2 h-2" :class="{'text-[#0071e3]': sortTier === tier && isAsc}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"></path></svg>
              <svg class="w-2 h-2" :class="{'text-[#0071e3]': sortTier === tier && !isAsc}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </template>
        <template #default="scope">
          <div class="flex flex-col items-center justify-center w-full h-full" :class="{'bg-gray-50/30 dark:bg-white/[0.01]': sortTier === tier}">
            <div class="flex items-center gap-1.5">
              <span class="text-[#1d1d1f] dark:text-white" :class="{'font-medium': scope.row.Plans.find(p => p.Name === tier)?.PriceInCNY === bestPrices[tier]}">
                <template v-if="scope.row.Plans.find(p => p.Name === tier)">
                  {{ scope.row.Plans.find(p => p.Name === tier).Price }}
                </template>
                <template v-else><span class="text-gray-300 dark:text-gray-700">-</span></template>
              </span>
              
              <span v-if="scope.row.Plans.find(p => p.Name === tier)?.PriceInCNY === bestPrices[tier]"
                    class="flex h-1.5 w-1.5 rounded-full bg-[#0071e3]" :title="labels.bestPrice">
              </span>
            </div>
            
            <span class="text-[11px] mt-0.5"
                  :class="scope.row.Plans.find(p => p.Name === tier)?.PriceInCNY === bestPrices[tier] ? 'text-[#0071e3]' : 'text-[#86868b]'">
              <span v-if="scope.row.Plans.find(p => p.Name === tier)?.PriceInCNY">
                ¥{{ scope.row.Plans.find(p => p.Name === tier)?.PriceInCNY.toFixed(2) }}
              </span>
            </span>
            <span v-if="getBenchmarkComparison(scope.row, tier)"
                  class="text-[10px] mt-0.5 font-medium"
                  :class="{
                    'text-red-500 dark:text-red-400': getBenchmarkComparison(scope.row, tier).isHigher,
                    'text-green-600 dark:text-green-400': getBenchmarkComparison(scope.row, tier).isLower,
                    'text-[#86868b]': !getBenchmarkComparison(scope.row, tier).isHigher && !getBenchmarkComparison(scope.row, tier).isLower
                  }">
              {{ getBenchmarkComparison(scope.row, tier).text }}
            </span>
          </div>
        </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.btn-filter-action {
  @apply px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-[#1d1d1f] dark:text-white transition-colors;
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
