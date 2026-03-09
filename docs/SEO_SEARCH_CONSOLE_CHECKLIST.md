# TinyTale Search Console 提交流程清单

> 目标：完成 `sitemap` 提交、`hreflang/canonical` 验证、索引覆盖监控。  
> 适用域名：`https://tinytale.top`

## 1. 上线前检查

- [ ] 访问 `https://tinytale.top/robots.txt`，确认返回 200，且包含 `Sitemap: https://tinytale.top/sitemap.xml`
- [ ] 访问 `https://tinytale.top/sitemap.xml`，确认返回 200 且包含多语言 URL
- [ ] 抽样检查下列 URL 的 `<head>`：
  - [ ] `https://tinytale.top/en/browse`
  - [ ] `https://tinytale.top/es/browse`
  - [ ] `https://tinytale.top/ja/drama/{dramaId}`
  - [ ] `https://tinytale.top/pt/drama/{dramaId}/play/{episodeId}`
- [ ] 每个抽样页都必须满足：
  - [ ] 存在唯一 `rel=\"canonical\"`
  - [ ] 存在 `rel=\"alternate\" hreflang=\"en|es|pt|id|zh|ja|hi|x-default\"`
  - [ ] canonical 指向当前语言页面，不指向 admin/api 路径

## 2. Search Console 资产配置

- [ ] 进入 Google Search Console
- [ ] 添加并验证 `Domain property: tinytale.top`（推荐 DNS TXT）
- [ ] 如果已存在 URL-prefix 资产，保留历史数据但以 Domain property 为主

## 3. Sitemap 提交

- [ ] 在 Search Console -> Indexing -> Sitemaps 提交：
  - [ ] `https://tinytale.top/sitemap.xml`
- [ ] 记录首次抓取状态：
  - [ ] `Success`（成功）
  - [ ] `Couldn't fetch`（需排查 CDN/WAF/robots）
  - [ ] `Has errors`（需定位具体 URL）

## 4. hreflang 验证项

- [ ] 抽样 10 个已收录 URL（至少覆盖 3 种语言）
- [ ] URL Inspection -> View Crawled Page -> HTML 中确认：
  - [ ] 存在自引用 hreflang（比如 `en` 页有 `hreflang=\"en\"`）
  - [ ] 存在其它语言互链（`es/pt/ja/...`）
  - [ ] 存在 `x-default`
- [ ] 确认同一内容不同语言页之间 canonical 不互相覆盖（不能全部 canonical 到 `en`）

## 5. 索引与覆盖监控（上线后 7 天）

- [ ] 每日检查 `Pages` 报告中的错误：
  - [ ] Alternate page with proper canonical（可接受，需持续观察）
  - [ ] Duplicate without user-selected canonical（需优化 canonical/hreflang）
  - [ ] Crawled - currently not indexed（需提高内容质量/内链）
- [ ] 抽样执行 URL Inspection -> Request Indexing（首页、分类页、热门剧详情页）
- [ ] 核对语言分布是否符合预期（至少 `en/es/pt` 首批有效收录）

## 6. 回归验收标准

- [ ] Search Console 中 sitemap 状态为 `Success`
- [ ] `Coverage` 无大规模新增错误（相对前一周）
- [ ] 抽样 URL 均含正确 canonical + hreflang
- [ ] `/admin/*` 页面不被索引（robots/noindex 生效）
- [ ] 新增剧集分集页可在 sitemap 中检索到

## 7. 常用快速排查命令

```bash
# 1) 检查 robots
curl -I https://tinytale.top/robots.txt

# 2) 检查 sitemap
curl -I https://tinytale.top/sitemap.xml

# 3) 抽样检查 canonical / hreflang
curl -s https://tinytale.top/en/browse | grep -E "canonical|hreflang" -n
curl -s https://tinytale.top/es/drama/<dramaId> | grep -E "canonical|hreflang" -n
curl -s https://tinytale.top/ja/drama/<dramaId>/play/<episodeId> | grep -E "canonical|hreflang" -n
```

