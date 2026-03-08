# TinyTale 版本记录

## v1.0.0-stable-video-player (2026-03-08)

### 🎉 稳定版本 - 视频播放器修复

**状态**: ✅ 已部署到生产环境并验证通过

### 主要变更

#### 视频播放器重构
- **问题**: 原有自定义Video.js播放器组件存在初始化和导入问题，导致生产环境视频无法加载
- **解决方案**: 替换为成熟稳定的 `react-player` 库
- **影响范围**:
  - `/src/components/player/SimplePlayer.tsx` (新增)
  - `/src/app/drama/[id]/play/[episodeId]/page.tsx` (简化)

#### 技术改进
1. **播放器库**: Video.js → react-player
2. **架构简化**: 移除复杂的PlayerRoot/Context架构
3. **类型安全**: 使用any类型绕过react-player的类型定义问题
4. **SSR处理**: 使用dynamic import避免服务端渲染问题

#### 保留功能
- ✅ HLS流播放支持
- ✅ 播放进度自动上报
- ✅ 自动连播下一集
- ✅ 错误处理
- ✅ 封面图显示
- ✅ 自动播放

### 依赖变更
```json
{
  "react-player": "^2.16.0"  // 新增
}
```

### 部署信息
- **提交哈希**: b140c89
- **部署时间**: 2026-03-08 12:30 (UTC+8)
- **部署环境**:
  - 生产环境: https://tinytale.top ✅
  - 本地开发: localhost:7001 ✅
  - GitHub: main分支 ✅

### 验证测试
- [x] 生产环境视频播放正常
- [x] 免费剧集可以播放
- [x] 付费剧集解锁流程正常
- [x] 自动连播功能正常
- [x] 播放进度上报正常

### 相关提交
- b140c89: fix: ReactPlayer type issue with any cast
- 2c1d1c1: fix: type error in SimplePlayer
- 907ee32: fix: replace video player with react-player for better stability

### 回滚方案
如需回滚到此版本：
```bash
git checkout v1.0.0-stable-video-player
npm install
npm run build
pm2 restart tinytale-web
```

### 已知问题
- 无

### 下一步计划
- 监控生产环境播放器稳定性
- 收集用户反馈
- 考虑添加更多播放器控制功能（如果需要）

---

## 历史版本

### v1.0.0-stable (2026-03-07)
- 初始稳定版本
- 基础功能完整
- 视频播放器存在问题（已在v1.0.0-stable-video-player中修复）
