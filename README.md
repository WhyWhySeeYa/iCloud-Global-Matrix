# iCloud-Global-Matrix

一个基于 Vue 3、Vite、Tailwind CSS 和 Element Plus 的 iCloud+ 全球价格矩阵。

## 功能

- 展示不同国家/地区的 iCloud+ 存储套餐价格
- 自动换算人民币价格
- 支持按容量套餐排序
- 支持地区/货币搜索筛选、套餐多选和最低价筛选，移动端可折叠筛选栏
- 支持分页浏览和每页数量切换
- 支持暗色/亮色主题切换
- 使用 Vue I18n 提供简体中文、繁体中文和英文界面
- 支持导出价格表图片、CSV 和 JSON，并提供导出状态和结果提示
- 支持手动刷新实时价格
- 通过 Vercel Serverless Function 在服务端抓取和解析价格数据
- 支持服务端内存缓存、Upstash Redis 持久化缓存、过期缓存兜底和内置兜底价格数据

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Element Plus
- Vue I18n
- Vercel Serverless Function

## 本地开发

普通前端开发：

```bash
npm install
npm run dev
```

默认 Vite 开发地址通常是：

```text
http://localhost:5173
```

如果需要本地调试 `/api/pricing` 服务端接口，请使用 Vercel 本地运行时：

```bash
npm run dev:vercel
```

Vercel CLI 启动后通常会提供类似下面的地址：

```text
http://localhost:3000
```

> 注意：当前项目已在 `vite.config.js` 中接入本地 API 中间件，普通 `npm run dev` 也可以访问 `/api/pricing` 和 `/api/health`。如果需要完全模拟 Vercel Serverless Function 运行时，可使用 `npm run dev:vercel`。

## 构建

```bash
npm run build
```

构建产物会输出到：

```text
dist
```

## 环境变量

复制示例文件后按需修改：

```bash
copy .env.example .env.local
```

可配置项：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_DEFAULT_LOCALE` | 默认界面语言，可选 `zh-CN`、`zh-TW` 或 `en-US` | `zh-CN` |
| `VITE_APP_TITLE` | 顶部导航栏标题 | `iCloud+ Pricing` |
| `VITE_HERO_TITLE` | 页面主标题 | `Global Pricing Matrix.` |
| `VITE_HERO_SUBTITLE` | 页面副标题 | `Compare iCloud+ storage plans across different regions and currencies in real-time.` |
| `UPSTASH_REDIS_REST_URL` | 可选，Upstash Redis REST 地址，用于持久化最近一次成功数据 | 空 |
| `UPSTASH_REDIS_REST_TOKEN` | 可选，Upstash Redis REST Token | 空 |

> Vite 环境变量必须以 `VITE_` 开头。线上部署时可在 Vercel 项目设置的 `Environment Variables` 中配置。
>
> 项目使用 Vue I18n，翻译文件位于 `src/locales`。国家/地区名称继续使用浏览器内置 `Intl.DisplayNames` 按当前语言自动本地化。

## 服务端接口

服务端接口文件：

```text
api/pricing.js
```

接口地址：

```text
/api/pricing
```

健康检查地址：

```text
/api/health
```

接口职责：

- 获取实时汇率
- 抓取 Apple 官方 iCloud+ 价格页面
- 在服务端解析价格数据
- 返回前端可直接渲染的结构化 JSON
- 使用 6 小时内存缓存减少重复抓取
- 配置 Upstash Redis 后，冷启动时可读取 6 小时内的持久化缓存，实时抓取失败时可使用 7 天内的持久化数据
- 实时抓取失败时优先返回过期缓存，再返回 `api/fallback-pricing.js` 中的内置兜底数据
- 返回 `cacheStatus`、`isFallback`、`updatedAt` 等元信息，方便前端展示数据状态

## 测试

运行价格解析器测试：

```bash
npm test
```

测试覆盖容量空格、逗号小数、重复套餐、未知地区、汇率缺失和空数据等场景。

## Vercel 部署教程

### 方式一：通过 GitHub 导入部署，推荐

1. 打开 Vercel：[打开 Vercel](https://vercel.com/new)。

2. 使用 GitHub 登录 Vercel。

3. 选择仓库：[98yyc/iCloud-Global-Matrix](https://github.com/98yyc/iCloud-Global-Matrix)。

4. 确认项目配置：

   ```text
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. 点击 `Deploy`。

6. 部署完成后，Vercel 会生成一个线上访问地址，例如：[https://icloud-global-matrix.vercel.app](https://icloud-global-matrix.vercel.app)。

### 方式二：通过 Vercel CLI 部署

安装 Vercel CLI：

```bash
npm install -g vercel
```

登录 Vercel：

```bash
vercel login
```

首次部署：

```bash
vercel
```

生产环境部署：

```bash
vercel --prod
```

## GitHub 推送流程

如果你修改了代码，可以按下面流程提交并推送：

```bash
git status
git add .
git commit -m "Update project"
git push
```

推送到 GitHub 后，如果 Vercel 已经绑定该仓库，会自动重新部署。

## 常见问题

### 1. 本地访问 `/api/pricing` 返回源码而不是 JSON

当前版本已通过 `vite.config.js` 的本地中间件支持普通 Vite 开发服务器访问 `/api/pricing`。如果仍返回源码，请重启开发服务器：

```bash
npm run dev
```

如果需要完全模拟 Vercel 环境，可使用：

```bash
npm run dev:vercel
```

### 2. 页面提示 `DATA FETCH FAILED`

可能原因：

- Apple 官方页面暂时无法访问
- 汇率 API 暂时不可用
- Vercel Serverless Function 执行失败
- 本地开发服务器未重启，新的 API 中间件未生效

可以打开浏览器开发者工具，查看 `/api/pricing` 的响应内容。

### 3. 部署后接口能访问，但数据为空

可能是 Apple 官方页面结构发生变化，需要更新 `api/pricing.js` 中的解析逻辑。

### 4. Vercel 构建失败

先在本地执行：

```bash
npm run build
```

如果本地构建也失败，根据终端错误修复后再推送。

## 项目配置文件

Vercel 配置文件：

```text
vercel.json
```

当前配置：

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev"
}
```
