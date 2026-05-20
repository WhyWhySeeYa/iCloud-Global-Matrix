# iCloud-Global-Matrix

一个基于 Vue 3、Vite、Tailwind CSS 和 Element Plus 的 iCloud+ 全球价格矩阵。

## 功能

- 展示不同国家/地区的 iCloud+ 存储套餐价格
- 自动换算人民币价格
- 支持按容量套餐排序
- 支持暗色/亮色主题切换
- 支持导出价格表图片
- 通过 Vercel Serverless Function 在服务端抓取和解析价格数据

## 技术栈

- Vue 3
- Vite
- Tailwind CSS
- Element Plus
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

> 注意：普通 `npm run dev` 只会启动 Vite 前端开发服务器，不会执行 Vercel Serverless Function。调试 `/api/pricing` 时必须使用 `npm run dev:vercel`。

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
| `VITE_DEFAULT_LOCALE` | 默认语言，支持 `en` 或 `zh` | `en` |
| `VITE_APP_TITLE` | 顶部导航栏标题 | `iCloud+ Pricing` |
| `VITE_HERO_TITLE` | 页面主标题 | `Global Pricing Matrix.` |
| `VITE_HERO_SUBTITLE` | 页面副标题 | `Compare iCloud+ storage plans across different regions and currencies in real-time.` |

> Vite 环境变量必须以 `VITE_` 开头。线上部署时可在 Vercel 项目设置的 `Environment Variables` 中配置。

## 服务端接口

服务端接口文件：

```text
api/pricing.js
```

接口地址：

```text
/api/pricing
```

接口职责：

- 获取实时汇率
- 抓取 Apple 官方 iCloud+ 价格页面
- 在服务端解析价格数据
- 返回前端可直接渲染的结构化 JSON

## Vercel 部署教程

### 方式一：通过 GitHub 导入部署，推荐

1. 打开 Vercel：[https://vercel.com/new](https://vercel.com/new)。

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

原因：你使用了普通 Vite 开发服务器 `npm run dev`。

解决：改用 Vercel 本地运行时：

```bash
npm run dev:vercel
```

### 2. 页面提示 `DATA FETCH FAILED`

可能原因：

- Apple 官方页面暂时无法访问
- 汇率 API 暂时不可用
- Vercel Serverless Function 执行失败
- 本地没有使用 `npm run dev:vercel` 调试服务端接口

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
