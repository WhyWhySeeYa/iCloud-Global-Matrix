# iCloud-Global-Matrix

一个基于 Vue 3、Vite、Tailwind CSS 和 Element Plus 的 iCloud+ 全球价格矩阵。

## 功能

- 展示不同国家/地区的 iCloud+ 存储套餐价格
- 自动换算人民币价格
- 支持按容量套餐排序
- 支持暗色/亮色主题切换
- 支持导出价格表图片
- 通过 Vercel Serverless Function 在服务端抓取和解析价格数据

## 本地开发

普通前端开发：

```bash
npm install
npm run dev
```

如果需要本地调试 `/api/pricing` 服务端接口，请使用 Vercel 本地运行时：

```bash
npm run dev:vercel
```

## 构建

```bash
npm run build
```

## Vercel 部署配置

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

服务端接口位于：

```text
/api/pricing
```
