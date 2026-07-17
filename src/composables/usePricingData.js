/**
 * @file usePricingData.js
 * @description 核心业务数据 Hook，负责数据的获取、解析、排序和计算
 */
import { ref, computed } from 'vue';
import { STORAGE_TIERS } from '../config/constants.js';
import { fetchPricingData } from '../api/index.js';

const indexPlans = (countries) => countries.map((country) => {
  const PlansByName = Object.fromEntries(
    (country.Plans || []).map((plan) => [plan.Name, plan])
  );
  return { ...country, PlansByName };
});

export function usePricingData(t) {
  // --- 响应式状态 ---
  const rawData = ref([]); // 原始解析数据（含 PlansByName 索引）
  const loading = ref(true); // 加载状态
  const refreshing = ref(false); // 手动刷新状态
  const loadingText = ref(t('initializing')); // 加载提示
  const error = ref(null); // 错误信息
  const meta = ref(null); // 服务端数据元信息
  let inFlight = null; // 进行中的请求，防止并发刷新

  // --- 排序状态 ---
  const sortTier = ref('50GB'); // 当前排序层级
  const isAsc = ref(true); // 排序方向 (true: 升序/便宜在前)

  /**
   * 核心业务流程：获取并解析数据
   */
  const fetchData = async ({ force = false } = {}) => {
    if (inFlight) return inFlight;

    if (force) {
      refreshing.value = true;
    } else {
      loading.value = true;
    }
    error.value = null;

    inFlight = (async () => {
      try {
        loadingText.value = t(force ? 'refreshingPricingData' : 'fetchingPricingData');
        const payload = await fetchPricingData({ force });
        rawData.value = indexPlans(payload.data || []);
        meta.value = payload.meta;
        return true;
      } catch (err) {
        console.error('数据处理失败:', err);
        error.value = t('dataFetchFailed');
        return false;
      } finally {
        loading.value = false;
        refreshing.value = false;
        inFlight = null;
      }
    })();

    return inFlight;
  };

  /**
   * 计算每个存储层级的全球最低价 (用于高亮显示)
   */
  const bestPrices = computed(() => {
    const best = {};
    STORAGE_TIERS.forEach((tier) => {
      let min = Infinity;
      rawData.value.forEach((country) => {
        const price = country.PlansByName[tier]?.PriceInCNY;
        if (price > 0 && price < min) min = price;
      });
      best[tier] = min;
    });
    return best;
  });

  /**
   * 根据当前排序条件返回排序后的数据
   */
  const sortedData = computed(() => {
    const tier = sortTier.value;
    const asc = isAsc.value;
    return [...rawData.value].sort((a, b) => {
      const priceA = a.PlansByName[tier]?.PriceInCNY ?? Infinity;
      const priceB = b.PlansByName[tier]?.PriceInCNY ?? Infinity;
      return asc ? priceA - priceB : priceB - priceA;
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

  /**
   * 直接设置排序状态（用于从 URL 恢复）
   */
  const setSortState = (tier, asc = true) => {
    if (STORAGE_TIERS.includes(tier)) {
      sortTier.value = tier;
    }
    isAsc.value = Boolean(asc);
  };

  return {
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
  };
}
