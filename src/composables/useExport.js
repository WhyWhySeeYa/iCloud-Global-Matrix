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

const encodeUtf16Le = (content) => {
  const buffer = new ArrayBuffer(content.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < content.length; i += 1) {
    view.setUint16(i * 2, content.charCodeAt(i), true);
  }

  return new Uint8Array(buffer);
};

const downloadTextFile = (content, filename, type) => {
  const utf16LeBom = new Uint8Array([0xff, 0xfe]);
  const body = encodeUtf16Le(content);
  const blob = new Blob([utf16LeBom, body], { type });
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
      const el = containerRef.querySelector('.pricing-export-area') || containerRef;
      
      // 1. 临时展开 Element Plus 表格内部滚动容器，避免只截到当前可视区域
      const tableBody = el.querySelector('.el-table__body-wrapper .el-table__body');
      const tableBodyWrapper = el.querySelector('.el-table__body-wrapper');
      const tableHeaderWrapper = el.querySelector('.el-table__header-wrapper');
      const tableWrapper = el.querySelector('.el-table__inner-wrapper');
      const scrollbarWrap = el.querySelector('.el-scrollbar__wrap');
      const scrollbarView = el.querySelector('.el-scrollbar__view');
      const bottomPadding = 180;
      const targetWidth = tableBody ? Math.max(tableBody.offsetWidth + 40, el.offsetWidth) : el.offsetWidth;
      const styledNodes = [
        [el, `width: ${targetWidth}px !important; max-width: none !important; overflow: visible !important; padding-bottom: ${bottomPadding}px !important; box-sizing: border-box !important;`],
        [tableWrapper, 'height: auto !important; max-height: none !important; overflow: visible !important;'],
        [tableBodyWrapper, 'height: auto !important; max-height: none !important; overflow: visible !important;'],
        [scrollbarWrap, 'height: auto !important; max-height: none !important; overflow: visible !important;'],
        [scrollbarView, 'height: auto !important; max-height: none !important; overflow: visible !important;'],
      ]
        .filter(([node]) => node)
        .map(([node, style]) => ({
          node,
          originalStyle: node.getAttribute('style'),
          style,
        }));

      styledNodes.forEach(({ node, originalStyle, style }) => {
        node.setAttribute('style', `${originalStyle || ''} ${style}`);
      });
      
      // 2. 等待 Vue 和 Element Plus 重新计算布局并渲染后，再按真实内容高度截图
      await new Promise(resolve => setTimeout(resolve, 300));

      const fullTableHeight = (tableHeaderWrapper?.offsetHeight || 0) + Math.max(
        tableBody?.offsetHeight || 0,
        tableBody?.scrollHeight || 0,
        tableBodyWrapper?.scrollHeight || 0,
        scrollbarView?.scrollHeight || 0
      );
      const targetHeight = Math.ceil(Math.max(
        el.scrollHeight,
        el.offsetHeight,
        tableWrapper?.scrollHeight || 0,
        tableWrapper?.offsetHeight || 0,
        fullTableHeight
      ) + bottomPadding);

      // 3. 执行截图
      const canvas = await html2canvas(el, {
        scale: 2, // 提高截图清晰度 (Retina 屏幕标准)
        backgroundColor: isDark ? '#1c1c1e' : '#ffffff', // 根据当前主题设置背景色
        useCORS: true, // 允许加载跨域图片 (如果有的话)
        logging: false, // 关闭 html2canvas 的控制台日志
        width: targetWidth, // 显式指定截图的画布宽度
        height: targetHeight, // 使用完整表格高度，避免最后一行文字被裁切
        windowWidth: targetWidth, // 模拟浏览器窗口宽度，确保媒体查询等样式正确应用
        windowHeight: targetHeight,
        scrollX: 0,
        scrollY: 0,
      });
      
      // 4. 恢复原始样式，不影响用户继续浏览
      styledNodes.forEach(({ node, originalStyle }) => {
        if (originalStyle) {
          node.setAttribute('style', originalStyle);
        } else {
          node.removeAttribute('style');
        }
      });
      
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
    const headers = ['Region', ...tiers.flatMap((tier) => [`${tier} Price`, `${tier} CNY`])];
    const rows = data.map((country) => {
      const values = [country.LocalizedCountryZH || country.LocalizedCountry || country.CountryZH || country.Country];
      tiers.forEach((tier) => {
        const plan = country.Plans.find((item) => item.Name === tier);
        values.push(plan?.Price || '', plan?.PriceInCNY || '');
      });
      return values.map(escapeCsvCell).join('\t');
    });

    downloadTextFile(
      [headers.map(escapeCsvCell).join('\t'), ...rows].join('\r\n'),
      `icloud-pricing-matrix-${new Date().toISOString().slice(0,10)}.csv`,
      'text/csv;charset=utf-16le'
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