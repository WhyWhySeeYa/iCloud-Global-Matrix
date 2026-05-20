/**
 * @file constants.js
 * @description 全局常量配置文件，集中管理项目中使用的静态数据
 */

// iCloud 存储容量层级定义
export const STORAGE_TIERS = ['50GB', '200GB', '2TB', '6TB', '12TB'];

// 外部 API 接口地址
export const API_URLS = {
    // 实时汇率 API (以 CNY 为基准)
    EXCHANGE_RATE: 'https://open.er-api.com/v6/latest/CNY',
    // Apple 官方 iCloud 价格页面
    APPLE_PRICING: 'https://support.apple.com/zh-cn/108047'
};

// 代理服务地址 (用于解决前端跨域请求 Apple 官网的问题)
export const PROXY_URLS = {
    // 主代理：corsproxy.io
    PRIMARY: 'https://corsproxy.io/?',
    // 备用代理：codetabs (当主代理失效时使用)
    BACKUP: 'https://api.codetabs.com/v1/proxy?quest='
};