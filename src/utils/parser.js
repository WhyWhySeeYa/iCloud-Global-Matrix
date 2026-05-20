/**
 * @file parser.js
 * @description 数据解析模块，负责将原始 HTML 转换为结构化的业务数据
 */

import { countryMap, currencyMap } from './dict.js';

/**
 * 解析 Apple 官网的 HTML 字符串，提取各国家/地区的 iCloud 价格数据
 * 
 * @param {string} htmlString - 从 Apple 官网抓取的原始 HTML 内容
 * @param {object} rates - 实时汇率数据对象，用于将当地货币转换为人民币 (CNY)
 * @returns {Array<Object>} 解析后的结构化数据列表，每个对象代表一个国家/地区的价格信息
 */
export const parseApplePricingHtml = (htmlString, rates) => {
    // 1. 将 HTML 字符串解析为 DOM 树，以便使用 DOM API 进行查询
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    const results = [];
    let countryIdCounter = 1; // 用于生成唯一的国家 ID
    let planIdCounter = 1;    // 用于生成唯一的套餐 ID

    const countryHeaderRegex = /^([^\(（0-9]+?)\d*\s*[（\(]([^）\)]+)[）\)]\s*$/;
    const planRegex = /(50GB|200GB|2TB|6TB|12TB)\s*[：:]\s*([^：:]+?)(?=(?:50GB|200GB|2TB|6TB|12TB)\s*[：:]|$)/g;

    // 2. Apple 官网页面结构会变化，不能只依赖旧版的 h4.gb-header 或“标题后紧跟 ul”。
    // 这里按文档顺序扫描标题、段落和列表项文本，识别“国家/地区（货币）”后再收集套餐文本。
    const textNodes = Array.from(doc.querySelectorAll('h2, h3, h4, h5, p, li'))
        .map((node) => ({
            tagName: node.tagName.toLowerCase(),
            text: node.textContent?.replace(/\s+/g, ' ').trim() || ''
        }))
        .filter((node) => node.text);

    const headers = textNodes
        .map((node, index) => ({ ...node, index, match: node.text.match(countryHeaderRegex) }))
        .filter((node) => node.match);
    
    headers.forEach((header, headerIndex) => {
        // 3. 使用正则表达式提取国家名称和货币名称
        // 匹配模式: 提取括号外的内容作为国家，括号内的内容作为货币，并兼容 Apple 脚注数字，如“美国4（美元）”
        const [, rawCountry, rawCurrency] = header.match;
        const zhCountry = rawCountry.trim();
        const zhCurrency = rawCurrency.trim();

        // 4. 通过字典映射，获取标准化的国家信息和货币代码
        const countryInfo = countryMap[zhCountry] || { iso: 'UN', en: zhCountry };
        const currencyCode = currencyMap[zhCurrency] || 'USD'; // 默认回退到 USD

        const plans = [];
        const nextHeaderIndex = headers[headerIndex + 1]?.index ?? textNodes.length;
        const sectionText = textNodes
            .slice(header.index + 1, nextHeaderIndex)
            .map((node) => node.text)
            .join(' ');

        // 5. 在当前国家/地区区块内提取全部套餐价格，兼容价格在 li、p 或同一文本节点中的情况。
        const seenPlans = new Set();
        for (const planMatch of sectionText.matchAll(planRegex)) {
            const planName = planMatch[1];
            const rawPrice = planMatch[2];

            if (seenPlans.has(planName)) continue;
            seenPlans.add(planName);
            
            // 统一将逗号替换为点号，处理部分欧洲国家的数字格式 (如 1,99 -> 1.99)
            const formattedRawPrice = rawPrice.replace(',', '.');
            
            // 6. 使用正则表达式提取纯数字价格
            // 匹配连续的数字，可选地包含一个小数点和后续数字
            const priceMatch = formattedRawPrice.match(/[0-9]+(?:\.[0-9]+)?/);
            
            if (priceMatch) {
                const priceVal = parseFloat(priceMatch[0]);
                let priceInCNY = 0;
                
                // 7. 根据汇率计算折合人民币的价格
                if (rates[currencyCode]) {
                    // 如果有对应汇率，进行换算并保留两位小数
                    priceInCNY = parseFloat((priceVal / rates[currencyCode]).toFixed(2));
                } else if (currencyCode === 'CNY') {
                    // 如果本身就是人民币，直接使用
                    priceInCNY = priceVal;
                }

                plans.push({
                    ID: planIdCounter++,
                    Name: planName,
                    Price: priceMatch[0], // 原始提取的数字字符串
                    PriceInCNY: priceInCNY // 折合人民币的数值
                });
            }
        }

        // 8. 如果成功解析到了套餐数据，则将该国家的信息加入结果列表
        if (plans.length > 0) {
            results.push({
                ID: countryIdCounter++,
                Country: countryInfo.en,       // 英文名
                CountryZH: zhCountry,          // 中文名
                CountryISO: countryInfo.iso,   // ISO 国家代码
                Currency: currencyCode,        // 货币代码 (如 USD, CNY)
                Plans: plans                   // 该国家的所有套餐列表
            });
        }
    });

    return results;
};