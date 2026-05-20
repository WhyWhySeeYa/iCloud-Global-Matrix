/**
 * @file index.js
 * @description API 请求模块，负责请求后端聚合后的价格数据
 */

/**
 * 获取服务端聚合后的 iCloud 价格数据
 * @returns {Promise<Array>} 结构化价格数据
 * @throws {Error} 网络请求失败或服务端解析失败时抛出异常
 */
export const fetchPricingData = async () => {
    const response = await fetch('/api/pricing');

    if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || `价格 API 请求失败: HTTP 状态码 ${response.status}`);
    }

    const payload = await response.json();
    return payload.data || [];
};