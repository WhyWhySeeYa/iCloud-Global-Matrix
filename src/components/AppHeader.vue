<script setup>
/**
 * @file AppHeader.vue
 * @description 顶部导航栏组件，包含 Logo、标题、主题切换和导出按钮
 */
defineProps({
  isDark: {
    type: Boolean,
    required: true
  }
});

defineEmits(['toggle-theme', 'export']);
</script>

<template>
  <header class="header-sticky">
    <div class="header-inner">
      <div class="header-logo-area">
        <svg class="w-5 h-5 text-[#1d1d1f] dark:text-white" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.3 48.6-.7 90.4-84.3 102.8-119.6-34.9-15.8-61.5-39.8-61.9-91zM207.6 105.5c20.8-25.9 30.4-49.6 26.3-81.2-24.4 1.5-49.3 14.1-68.2 32-17.5 16.7-28.9 39.8-25.3 64.3 25.6 2 49.8-13.2 67.2-15.1z"/></svg>
        <h1 class="header-title">iCloud+ Pricing</h1>
      </div>
      
      <div class="header-actions">
        <button @click="$emit('toggle-theme')" class="btn-theme-toggle" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
        <button @click="$emit('export')" class="btn-export">Export</button>
      </div>
    </div>
  </header>
</template>