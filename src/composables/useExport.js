/**
 * @file useExport.js
 * @description 导出功能 Hook，负责将 DOM 元素转换为图片并下载
 */
const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
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
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const normalizeCsvCell = (value) => {
  const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const escapeCsvCell = (value) => `"${normalizeCsvCell(value).replace(/"/g, '""')}"`;

const waitForNextPaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(resolve);
  });
});

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

    let styledNodes = [];

    try {
      const { default: html2canvas } = await import('html2canvas');
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
      styledNodes = [
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

      // 2. 等待浏览器完成两帧布局后再按真实内容高度截图
      await waitForNextPaint();

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
        scale: 2,
        backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
        useCORS: true,
        logging: false,
        width: targetWidth,
        height: targetHeight,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `icloud-pricing-matrix-${new Date().toISOString().slice(0,10)}.png`;
      link.click();
    } finally {
      styledNodes.forEach(({ node, originalStyle }) => {
        if (originalStyle) {
          node.setAttribute('style', originalStyle);
        } else {
          node.removeAttribute('style');
        }
      });
    }
  };

  const saveAsCsv = (data, tiers) => {
    const headers = ['Region', ...tiers.flatMap((tier) => [`${tier} Price`, `${tier} CNY`])];
    const rows = data.map((country) => {
      const values = [country.LocalizedCountryZH || country.LocalizedCountry || country.CountryZH || country.Country];
      tiers.forEach((tier) => {
        const plan = country.PlansByName?.[tier] || country.Plans.find((item) => item.Name === tier);
        values.push(plan?.Price || '', plan?.PriceInCNY || '');
      });
      return values.map(escapeCsvCell).join('\t');
    });

    downloadTextFile(
      [headers.map(escapeCsvCell).join('\t'), ...rows].join('\r\n'),
      `icloud-pricing-${tiers.join('-')}-${new Date().toISOString().slice(0,10)}.csv`,
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
