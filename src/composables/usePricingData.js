/**
 * @file usePricingData.js
 * @description 核心业务数据 Hook，负责数据的获取、解析、排序和计算
 */
import { ref, computed } from 'vue';
import { STORAGE_TIERS } from '../config/constants.js';
import { fetchPricingData } from '../api/index.js';

export function usePricingData() {
  // --- 响应式状态 ---
  const rawData = ref([]); // 原始解析数据
  const loading = ref(true); // 加载状态
  const loadingText = ref('INITIALIZING SYSTEM...'); // 加载提示
  const error = ref(null); // 错误信息

  // --- 排序状态 ---
  const sortTier = ref('50GB'); // 当前排序层级
  const isAsc = ref(true); // 排序方向 (true: 升序/便宜在前)

  /**
   * 核心业务流程：获取并解析数据
   */
  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // 1. 从服务端获取已经抓取、解析并计算好的价格数据
      loadingText.value = 'FETCHING PRICING DATA...';
      rawData.value = await fetchPricingData();
      
    } catch (err) {
      console.error('数据处理失败:', err);
      error.value = "DATA FETCH FAILED. CHECK NETWORK OR USE LOCAL SOURCE.";
    } finally {
      loading.value = false;
    }
  };

  /**
   * 计算每个存储层级的全球最低价 (用于高亮显示)
   */
  const bestPrices = computed(() => {
    const best = {};
    STORAGE_TIERS.forEach(tier => {
      let min = Infinity;
      rawData.value.forEach(country => {
        const plan = country.Plans.find(p => p.Name === tier);
        if (plan && plan.PriceInCNY < min && plan.PriceInCNY > 0) {
          min = plan.PriceInCNY;
        }
      });
      best[tier] = min;
    });
    return best;
  });

  /**
   * 根据当前排序条件返回排序后的数据
   */
  const sortedData = computed(() => {
    return [...rawData.value].sort((a, b) => {
      const priceA = a.Plans.find(p => p.Name === sortTier.value)?.PriceInCNY || Infinity;
      const priceB = b.Plans.find(p => p.Name === sortTier.value)?.PriceInCNY || Infinity;
      return isAsc.value ? priceA - priceB : priceB - priceA;
    });
  });

  /**
   * 切换排序条件
   * @param {string} tier - 存储层级
   */
  const toggleSort = (tier) => {
    if (sortTier.value === tier) {
      isAsc.value = !isAsc.value;
    } else {
      sortTier.value = tier;
      isAsc.value = true;
    }
  };

  return {
    loading,
    loadingText,
    error,
    sortTier,
    isAsc,
    sortedData,
    bestPrices,
    fetchData,
    toggleSort
  };
}