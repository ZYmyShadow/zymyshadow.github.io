# 修仙藏书阁 · The Cultivation Library

> 一座收录**知识库文章**、**热点情报**、**游戏攻略**与**网址导航**的数字藏书阁。
> 人工甄选，AI 归纳，每次 push 即上线。

🔗 在线访问：<https://zymyshadow.github.io> （英文版：[/en/](https://zymyshadow.github.io/en/)）

## 内容板块

| 板块 | 说明 |
| --- | --- |
| 📚 知识库文章 | 18 篇，按主题分为 AI / 开发 / 生活 / 安全 四个系列 |
| 🔥 热点情报 | 科技、抖音、B站、小红书四类热点，人工甄选快照 + 历史归档 |
| 🎮 游戏专区 | 我的世界（MC）攻略与工具 |
| 🧭 网址导航 | 5 大分类、23 个精选站点 |
| 🧰 在线工具 | Base64、JSON 格式化、正则测试、时间戳、Hash 生成等 8 个纯本地工具 |

## 特性

- **纯静态、零构建**：HTML + 原生 JS + JSON 数据驱动，托管于 GitHub Pages，无框架无后端
- **中英双语**：`en/` 目录完整镜像，导航栏一键切换
- **明暗主题**：跟随系统 + 手动切换，首屏防闪烁
- **阅读体验**：文章自动目录、滚动高亮、阅读进度条
- **评论区**：基于 [Giscus](https://github.com/giscus/giscus)（GitHub Discussions 驱动），跟随站点主题换肤
- **SEO**：`robots.txt`、`sitemap.xml`、全站 `og:image` 封面

## 技术栈

GitHub Pages · 原生 HTML / CSS / JavaScript · JSON 数据源 · Giscus · Google Fonts（马善政书法体 / 思源宋体 / 思源黑体 / JetBrains Mono）

## 目录结构

```
├─ index.html          首页（门楣 + 热点 + 系列 + 游戏入口）
├─ articles/           知识库文章（series-ai / series-dev / series-life / series-sec）
├─ news/               热点情报页与数据快照
├─ games/              游戏专区（mc/）
├─ nav.html            网址导航
├─ tools/              在线工具箱
├─ search.html         全站搜索
├─ about.html          关于本站
├─ assets/             样式 / 脚本 / 图片
├─ data/               文章、导航、工具、游戏等 JSON 数据
├─ partials/           公共导航栏 / 页脚片段（JS 注入）
├─ scripts/            维护脚本（sitemap 生成）
└─ en/                 英文版镜像（结构同根目录）
```

## 本地运行

```bash
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

> 注意：直接双击 HTML（`file://`）打开时浏览器会拦截 JSON 请求，页面数据将无法加载，请务必使用本地静态服务器预览。

## 内容维护

- **新增文章**：将 HTML 放入对应 `articles/series-*` 目录，并在 `data/articles.json` 追加一条记录（英文版同步 `en/`）。
- **增删页面后**：运行 `node scripts/gen-sitemap.js` 重新生成 sitemap。
- **热点更新**：替换 `news/data/hot-news.json` 的 `current` 快照，旧快照移入 `history`（保留 3 期）。

## 说明

本站为个人学习与分享用途的公益小站，内容仅供参考；转载或引用请注明出处。
