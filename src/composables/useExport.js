/**
 * @file useExport.js
 * @description 导出功能 Hook，负责将 DOM 元素转换为图片并下载
 */
import html2canvas from 'html2canvas';

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const normalizeCsvCell = (value) => {
  const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value) => `"${normalizeCsvCell(value).replace(/"/g, '""')}"`;

export function useExport() {
  /**
   * 将指定的 DOM 容器导出为 PNG 图片
   * 包含处理移动端横向滚动截断问题的特殊逻辑
   * 
   * @param {HTMLElement} containerRef - 需要导出的 DOM 元素引用
   * @param {boolean} isDark - 当前是否为暗色主题 (用于设置截图背景色)
   */
  const saveAsImage = async (containerRef, isDark) => {
    if (!containerRef) return;
    
    try {
      const el = containerRef;
      
      // 1. 计算表格内容的实际总宽度 (解决移动端滚动截断问题)
      // 查找 Element Plus 表格内部的实际内容区域
      const tableBody = el.querySelector('.el-table__body-wrapper .el-table__body');
      // 取内容宽度和容器宽度的最大值，加上 40px 的 padding 缓冲
      const targetWidth = tableBody ? Math.max(tableBody.offsetWidth + 40, el.offsetWidth) : el.offsetWidth;

      // 2. 保存原始内联样式，以便截图后恢复
      const originalStyle = el.getAttribute('style');
      
      // 3. 强制展开容器宽度，消除横向滚动条，让所有内容都在可视区域内
      el.setAttribute('style', `${originalStyle || ''} width: ${targetWidth}px !important; max-width: none !important;`);
      
      // 4. 等待 Vue 和 Element Plus 重新计算布局并渲染 (非常重要，否则截图可能还是旧的布局)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. 执行截图
      const canvas = await html2canvas(el, {
        scale: 2, // 提高截图清晰度 (Retina 屏幕标准)
        backgroundColor: isDark ? '#1c1c1e' : '#ffffff', // 根据当前主题设置背景色
        useCORS: true, // 允许加载跨域图片 (如果有的话)
        logging: false, // 关闭 html2canvas 的控制台日志
        width: targetWidth, // 显式指定截图的画布宽度
        windowWidth: targetWidth, // 模拟浏览器窗口宽度，确保媒体查询等样式正确应用
      });
      
      // 6. 恢复原始样式，不影响用户继续浏览
      if (originalStyle) {
        el.setAttribute('style', originalStyle);
      } else {
        el.removeAttribute('style');
      }
      
      // 7. 将 Canvas 转换为 Data URL 并触发下载
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      // 生成带有当前日期的文件名
      link.download = `icloud-pricing-matrix-${new Date().toISOString().slice(0,10)}.png`;
      link.click();
    } catch (err) {
      console.error('图片导出失败:', err);
      alert('IMAGE EXPORT FAILED');
    }
  };

  const saveAsCsv = (data, tiers) => {
    const headers = ['Region', 'RegionZH', 'ISO', 'Currency', ...tiers.flatMap((tier) => [`${tier} Price`, `${tier} CNY`])];
    const rows = data.map((country) => {
      const values = [country.Country, country.CountryZH, country.CountryISO, country.Currency];
      tiers.forEach((tier) => {
        const plan = country.Plans.find((item) => item.Name === tier);
        values.push(plan?.Price || '', plan?.PriceInCNY || '');
      });
      return values.map(escapeCsvCell).join(',');
    });

    downloadBlob(
      `\uFEFFsep=,\r\n${[headers.map(escapeCsvCell).join(','), ...rows].join('\r\n')}`,
      `icloud-pricing-matrix-${new Date().toISOString().slice(0,10)}.csv`,
      'text/csv;charset=utf-8-sig'
    );
  };

  const saveAsJson = (data) => {
    downloadBlob(
      JSON.stringify(data, null, 2),
      `icloud-pricing-matrix-${new Date().toISOString().slice(0,10)}.json`,
      'application/json;charset=utf-8'
    );
  };

  return {
    saveAsImage,
    saveAsCsv,
    saveAsJson
  };
}