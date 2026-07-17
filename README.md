# iCloud Global Matrix

一个基于 Vue 3 的 **iCloud+ 全球价格矩阵** 工具。Web 端实时比较 Apple 不同国家/地区的 iCloud+ 存储套餐价格，并自动换算人民币。

- GitHub：[WhyWhySeeYa/iCloud-Global-Matrix](https://github.com/WhyWhySeeYa/iCloud-Global-Matrix)
- 在线演示：[icloud-global-matrix.vercel.app](https://icloud-global-matrix.vercel.app)

## 功能

### 价格矩阵

- 覆盖 `50GB`、`200GB`、`2TB`、`6TB`、`12TB` 套餐
- 自动换算人民币价格
- 按套餐价格升序 / 降序排序
- 全球最低价高亮标记
- 地区 / 货币搜索筛选
- 套餐多选与「只看最低价」
- 手动刷新实时价格

### 交互体验

- PC 端完整筛选栏，移动端可折叠
- 暗色 / 亮色主题切换
- 分页支持 `20`、`50`、`100` 条
- 导出状态与结果提示
- 错误态支持一键重试

### 国际化

基于 Vue I18n，内置：

- 简体中文 `zh-CN`
- 繁体中文 `zh-TW`
- English `en-US`

翻译文件位于 `src/locales`。国家 / 地区名称使用 `Intl.DisplayNames` 按当前语言本地化。

### 导出

- PNG 图片（导出当前筛选结果全量数据）
- Excel 友好 CSV
- JSON
- 导出时自动展开表格布局，避免滚动截断
- CSV 使用 UTF-16LE + BOM，兼容 Excel 中文

### 数据与缓存

- 6 小时服务端内存缓存
- CDN 边缘缓存（`s-maxage`）
- 可选 Upstash Redis 持久化缓存
- 实时抓取失败时优先返回过期缓存
- 最终兜底使用内置 fallback 数据
- 返回 `cacheStatus` 等元信息供前端展示

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 前端框架 | Vue 3、Composition API |
| 构建工具 | Vite 8 |
| UI 组件 | Element Plus |
| 样式 | Tailwind CSS、PostCSS |
| 国际化 | Vue I18n |
| 截图导出 | html2canvas |
| 服务端接口 | Vercel Serverless Functions |
| 持久化缓存 | Upstash Redis（可选） |
| 测试 | Node.js Test Runner |

## 项目结构

```text
.
├── api/
│   ├── lib/
│   │   ├── persistent-cache.js      # Upstash Redis 读写
│   │   └── pricing-parser.js        # Apple 价格页解析
│   ├── fallback-pricing.js         # 内置兜底数据
│   ├── health.js                   # 健康检查
│   └── pricing.js                  # 价格聚合接口
├── public/
├── src/
│   ├── api/                        # 前端 API 封装
│   ├── components/                 # 界面组件
│   ├── composables/                # 主题 / 导出 / 数据 / 语言
│   ├── config/                     # 常量配置
│   ├── i18n/                       # Vue I18n 初始化
│   ├── locales/                    # 翻译文案
│   ├── App.vue
│   └── main.js
├── test/
│   ├── fixtures/                   # 解析器测试 HTML
│   └── pricing-parser.test.js
├── .env.example
├── package.json
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

## 环境要求

- Node.js `>= 20.19.0`
- npm

## 本地开发

安装依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run dev
```

默认地址：

```text
http://localhost:5173
```

`vite.config.js` 已接入本地 API 中间件，普通 Vite 开发可直接访问：

```text
/api/pricing
/api/health
```

如需完全模拟 Vercel Serverless 运行时：

```bash
npm run dev:vercel
```

## 环境变量

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

macOS / Linux：

```bash
cp .env.example .env.local
```

| 变量 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `VITE_DEFAULT_LOCALE` | 否 | 默认语言：`zh-CN`、`zh-TW` 或 `en-US` | `zh-CN` |
| `VITE_APP_TITLE` | 否 | 顶部导航标题 | `iCloud+ Pricing` |
| `VITE_HERO_TITLE` | 否 | 页面主标题 | `Global Pricing Matrix.` |
| `VITE_HERO_SUBTITLE` | 否 | 页面副标题 | 见示例文件 |
| `UPSTASH_REDIS_REST_URL` | 否 | Upstash Redis REST 地址 | 空 |
| `UPSTASH_REDIS_REST_TOKEN` | 否 | Upstash Redis REST Token | 空 |

未配置 Upstash Redis 时，仍可使用内存缓存与内置兜底数据正常运行。

## 服务端接口

### `GET /api/pricing`

返回结构化价格数据与缓存元信息。

普通请求：

```http
GET /api/pricing
```

强制刷新：

```http
GET /api/pricing?refresh=1
```

响应示例：

```json
{
  "data": [],
  "updatedAt": "2026-07-16T00:00:00.000Z",
  "source": "https://support.apple.com/zh-cn/108047",
  "resolvedSource": "https://support.apple.com/zh-cn/108047",
  "cacheStatus": "fresh",
  "isFallback": false,
  "message": null
}
```

常见 `cacheStatus`：

| 值 | 含义 |
| --- | --- |
| `fresh` | 刚刚抓取的实时数据 |
| `memory` | 服务端内存缓存 |
| `stale` | 过期内存缓存（实时抓取失败） |
| `persistent` | Upstash Redis 有效缓存 |
| `persistent-stale` | Upstash Redis 过期缓存 |
| `fallback` | 内置兜底数据 |

### `GET /api/health`

健康检查：

```json
{
  "ok": true,
  "service": "icloud-global-matrix",
  "timestamp": "2026-07-16T00:00:00.000Z"
}
```

## 缓存策略

```text
请求 / CDN 缓存
  → 6 小时内存缓存
  → 6 小时内 Upstash Redis 缓存
  → Apple 官方页面 + 汇率 API 实时抓取
  → 失败后返回过期内存缓存
  → 7 天内 Upstash Redis 过期缓存
  → 最终 fallback 数据
```

强制刷新会跳过 12 小时内的有效缓存读取，但仍会写回新结果，并在失败时继续走兜底链路。

## 测试

```bash
npm test
```

当前覆盖：

- 国家 / 套餐解析
- 容量空格与逗号小数
- 重复套餐去重
- HTML 实体解码
- 脚本 / 样式忽略
- 未知地区过滤
- 地区与货币别名
- 汇率缺失
- 空数据

## 构建

```bash
npm run build
```

产物输出到：

```text
dist/
```

本地预览：

```bash
npm run preview
```

## 部署到 Vercel

1. 在 Vercel 导入 [GitHub 仓库](https://github.com/WhyWhySeeYa/iCloud-Global-Matrix)。
2. 确认构建配置：

```text
Framework Preset: Vite
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

3. 如需持久化缓存，在 Vercel 项目环境变量中配置：

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

4. 部署后验证：

```text
/api/health
/api/pricing
```

也可使用 Vercel CLI：

```bash
npm install -g vercel
vercel
vercel --prod
```

## 常见问题

### 页面提示数据获取失败

可能原因：

- Apple 官方页面暂时无法访问
- 汇率 API 暂时不可用
- Apple 页面结构发生变化
- Serverless Function 执行失败

可检查 `/api/pricing` 响应中的 `cacheStatus` 与 `message`。

### 解析结果为空或国家变少

请检查：

```text
api/lib/pricing-parser.js
```

并同步更新：

```text
test/fixtures/apple-pricing-sample.html
test/pricing-parser.test.js
```

然后运行：

```bash
npm test
```

### 本地 `/api/pricing` 异常

先重启开发服务器：

```bash
npm run dev
```

确认 Vite 中间件已加载；如需完整 Vercel 运行时，使用 `npm run dev:vercel`。

## 数据来源

- [Apple 官方 iCloud+ 价格说明](https://support.apple.com/zh-cn/108047)
- [Open Exchange Rates API](https://open.er-api.com/)

价格与汇率仅供参考，最终以 Apple 官方展示为准。
