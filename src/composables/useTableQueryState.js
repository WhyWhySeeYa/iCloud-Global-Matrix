/**
 * @file useTableQueryState.js
 * @description 将筛选 / 排序 / 分页状态同步到 URL query，便于刷新恢复和分享
 */
import { onMounted, ref, watch } from 'vue';
import { STORAGE_TIERS } from '../config/constants.js';

const PAGE_SIZES = [20, 50, 100];

const parseBoolean = (value) => value === '1' || value === 'true';

const readQueryState = () => {
  const params = new URLSearchParams(window.location.search);
  const tiers = (params.get('tiers') || '')
    .split(',')
    .map((item) => item.trim())
    .filter((tier) => STORAGE_TIERS.includes(tier));

  const pageSize = Number(params.get('pageSize'));
  const page = Number(params.get('page'));
  const sort = params.get('sort');

  return {
    q: params.get('q') || '',
    tiers,
    currency: params.get('currency') || 'all',
    best: parseBoolean(params.get('best')),
    sort: STORAGE_TIERS.includes(sort) ? sort : null,
    asc: params.has('asc') ? params.get('asc') !== '0' : null,
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : 20,
    hasSortParams: params.has('sort') || params.has('asc')
  };
};

const writeQueryState = (state) => {
  const params = new URLSearchParams();

  if (state.q) params.set('q', state.q);
  if (state.tiers.length > 0) params.set('tiers', state.tiers.join(','));
  if (state.currency && state.currency !== 'all') params.set('currency', state.currency);
  if (state.best) params.set('best', '1');
  if (state.sort && state.sort !== '50GB') params.set('sort', state.sort);
  if (state.asc === false) params.set('asc', '0');
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== 20) params.set('pageSize', String(state.pageSize));

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, '', nextUrl);
  }
};

/**
 * @param {object} options
 * @param {() => string} options.getSortTier
 * @param {() => boolean} options.getIsAsc
 * @param {(tier: string, asc: boolean) => void} [options.onRestoreSort]
 */
export function useTableQueryState({ getSortTier, getIsAsc, onRestoreSort } = {}) {
  const initial = typeof window !== 'undefined' ? readQueryState() : {
    q: '',
    tiers: [],
    currency: 'all',
    best: false,
    sort: null,
    asc: null,
    page: 1,
    pageSize: 20,
    hasSortParams: false
  };

  const searchKeyword = ref(initial.q);
  const selectedTiers = ref([...initial.tiers]);
  const selectedCurrency = ref(initial.currency);
  const onlyBestPrices = ref(initial.best);
  const currentPage = ref(initial.page);
  const pageSize = ref(initial.pageSize);
  const ready = ref(false);

  if (initial.hasSortParams && onRestoreSort) {
    onRestoreSort(initial.sort || '50GB', initial.asc !== false);
  }

  watch(
    [searchKeyword, selectedTiers, selectedCurrency, onlyBestPrices, currentPage, pageSize],
    () => {
      if (!ready.value) return;
      writeQueryState({
        q: searchKeyword.value.trim(),
        tiers: selectedTiers.value,
        currency: selectedCurrency.value,
        best: onlyBestPrices.value,
        sort: getSortTier?.() || '50GB',
        asc: getIsAsc?.() !== false,
        page: currentPage.value,
        pageSize: pageSize.value
      });
    },
    { deep: true }
  );

  // 排序变化时也写回 URL
  watch(
    () => [getSortTier?.(), getIsAsc?.()],
    () => {
      if (!ready.value) return;
      writeQueryState({
        q: searchKeyword.value.trim(),
        tiers: selectedTiers.value,
        currency: selectedCurrency.value,
        best: onlyBestPrices.value,
        sort: getSortTier?.() || '50GB',
        asc: getIsAsc?.() !== false,
        page: currentPage.value,
        pageSize: pageSize.value
      });
    }
  );

  onMounted(() => {
    ready.value = true;
    // 首次挂载后把当前状态规范化到 URL（去掉无效参数）
    writeQueryState({
      q: searchKeyword.value.trim(),
      tiers: selectedTiers.value,
      currency: selectedCurrency.value,
      best: onlyBestPrices.value,
      sort: getSortTier?.() || '50GB',
      asc: getIsAsc?.() !== false,
      page: currentPage.value,
      pageSize: pageSize.value
    });
  });

  const resetFilters = () => {
    searchKeyword.value = '';
    selectedTiers.value = [];
    selectedCurrency.value = 'all';
    onlyBestPrices.value = false;
    currentPage.value = 1;
  };

  return {
    searchKeyword,
    selectedTiers,
    selectedCurrency,
    onlyBestPrices,
    currentPage,
    pageSize,
    resetFilters
  };
}
