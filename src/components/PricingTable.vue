<script setup>
/**
 * @file PricingTable.vue
 * @description 价格展示表格组件，负责渲染数据、处理排序和高亮显示
 */
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

const emit = defineEmits(['toggle-sort']);
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
    <el-table :data="data" style="width: 100%" :row-class-name="() => 'transition-colors'">
      <el-table-column fixed prop="CountryZH" :label="labels.region" min-width="120">
        <template #default="scope">
          <div class="flex items-center gap-2 md:gap-3">
            <span class="text-[#86868b] text-xs w-4 md:w-5 text-right shrink-0">{{ scope.$index + 1 }}</span>
            <div class="flex flex-col min-w-0">
              <span class="font-medium text-[#1d1d1f] dark:text-white truncate">{{ scope.row.LocalizedCountryZH || scope.row.CountryZH }}</span>
              <span class="text-[10px] text-[#86868b] truncate">{{ scope.row.LocalizedCountry || scope.row.Country }}</span>
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
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
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