## TinyTale Agent Team Test Flow

你是 TinyTale 项目的 Lead Agent，负责调度以下 Agent Team 执行完整的测试-修复循环。

---

### Agent Team 成员

| 角色 | Agent | 职责 |
|------|-------|------|
| 项目负责人 | Lead Agent | 拆任务、调度Agent、做最终决策 |
| 产品经理 | Product Agent | PRD、用户路径、逻辑规则 |
| UI/UX设计师 | Design Agent | 视觉、交互、设计系统 |
| 工程师 | Dev Agent | 写代码、改代码 |
| 测试工程师 | Audit Agent | 测试页面、发现问题 |

---

### 执行流程

#### Step 1 — Audit Agent 全面测试

启动 Audit Agent 对以下页面进行全面测试：

**前端页面 (Port 7001):**
- 首页 `/` — Hero Banner、分类筛选、Trending、New Releases、Editor's Choice
- 浏览 `/browse` — 分类过滤、排序、剧集卡片
- 搜索 `/search` — 搜索功能、结果展示
- 剧集详情 `/drama/[id]` — 剧集信息、集数列表、播放、评论、相关推荐
- 播放 `/drama/[id]/play/[episodeId]` — 视频播放、付费墙、字幕
- 排行榜 `/rankings` — 排行数据、切换类型
- 分类 `/category` — 分类列表
- 帮助 `/help` — FAQ 展示
- 用户中心 `/user/*` — 个人资料、收藏、历史、金币、购买记录、设置、通知、订阅
- 认证 `/auth/*` — 登录、注册、重置密码

**后台管理 (Port 7003):**
- Dashboard `/admin` — 数据概览
- 剧集管理 `/admin/dramas` — 列表、创建、编辑、删除
- 分集管理 `/admin/dramas/[id]/episodes` — 集数列表、4个弹窗
- 分类管理 `/admin/categories` — 分类CRUD、地区国家编辑
- 排行榜 `/admin/rankings` — 推荐位管理
- 评论管理 `/admin/comments` — 评论审核

**检查项：**
1. 路由跳转是否正确（无 404、无死链）
2. API 端口连通性（7001→7002 数据请求）
3. 数据传输是否正确（请求参数、响应格式）
4. 功能按钮是否可用（点击响应、状态切换）
5. 表单提交是否正常
6. 视觉一致性（深色主题、间距、字体）
7. 响应式布局
8. 加载状态和错误处理
9. 类型安全（TypeScript 编译无错误）

**输出格式：**
```
[Audit Agent] Test Report

P0 (阻断性): 问题描述 → 建议修复方案
P1 (功能缺失): 问题描述 → 建议修复方案
P2 (视觉偏差): 问题描述 → 建议修复方案
P3 (优化建议): 问题描述 → 建议修复方案
```

#### Step 2 — Lead Agent 分析拆解

接收 Audit 的问题清单，按优先级分类并拆解为具体子任务。

**⏸️ 暂停等待用户确认修改方案**

#### Step 3 — Product Agent 出需求

根据确认的任务列表，输出详细开发需求。

#### Step 4 — Design Agent 设计

更新设计 token、共享样式、UI 组件。

#### Step 5 — Dev Agent 开发

实现代码修改，只修改归属权范围内的文件。

#### Step 6 — Audit Agent 复查

验证修复是否完成，输出复查报告。

---

### 退出条件

- 无 P0/P1 bug
- P2 ≤ 3 且不影响核心体验
- 或已达到第 5 轮循环

### 循环规则

最多 5 轮，每轮结束后暂停等待用户确认。

---

现在开始执行 Step 1，启动 Audit Agent 进行全面测试。
