/**
 * @file useTheme.js
 * @description 主题管理 Hook，负责亮色/暗色模式的切换和状态持久化
 */
import { ref, watch } from 'vue';

export function useTheme() {
  // 初始化主题：优先读取 localStorage，如果没有则跟随系统偏好设置
  const isDark = ref(
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  /**
   * 切换亮色/暗色主题
   */
  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  /**
   * 监听主题状态变化，同步更新 DOM 上的 class 和 localStorage
   */
  watch(isDark, (val) => {
    const htmlEl = document.documentElement;
    if (val) {
      htmlEl.classList.add('dark', 'dark-theme'); // 兼容 Element Plus 的暗色模式
      localStorage.setItem('theme', 'dark');
    } else {
      htmlEl.classList.remove('dark', 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, { immediate: true }); // immediate: true 确保在组件初始化时立即执行一次

  return {
    isDark,
    toggleTheme
  };
}