# TinyTale 详情页 & 播放页 UI 设计

## 1. 短剧详情页 UI

### 1.1 布局结构

```tsx
// Page Structure
<Page>
  <BackButton />
  <ShareButton />
  <MoreButton />

  // Hero Section
  <Hero>
    <CoverImage />
    <Info>
      <Title />
      <Rating />
      <Meta />
      <Actions>
        <PlayButton />
        <FavoriteButton />
      </Actions>
    </Info>
  </Hero>

  // Content
  <Description />
  <EpisodeGrid />
  <CastList />
  <RelatedDramas />
</Page>
```

### 1.2 样式细节

**Hero区域**
- 封面图: 宽120px, 圆角8px
- 标题: 24px, 粗体
- 评分: 黄色星星 + 数字
- 分类标签: 灰色背景, 圆角

**剧集网格**
- 桌面: 6列
- 平板: 4列
- 手机: 3列
- 已解锁: 正常显示缩略图
- 未解锁: 锁图标 + 金币价格遮罩

### 1.3 组件状态

| 组件 | Default | Hover | Active | Disabled |
|------|---------|-------|--------|----------|
| Play按钮 | 红色背景 | 加深10% | 缩放0.95 | 灰色 |
| 收藏按钮 | 空心心 | 填用心 | 红色填充 | 灰色 |
| 剧集卡片 | 正常 | 边框高亮 | 播放中边框 | 锁图标遮罩 |

---

## 2. 视频播放页 UI

### 2.1 播放器布局

```tsx
<PlayerPage>
  <Header>
    <BackButton />
    <EpisodeTitle />
    <MoreButton />
    <FullscreenButton />
  </Header>

  <VideoContainer ratio="9:16">
    <VideoPlayer />
    <Overlay>
      <CenterPlayButton />
      <LockedOverlay />
    </Overlay>
  </VideoContainer>

  <Controls>
    <ProgressBar />
    <ControlButtons>
      <SkipButtons />
      <PlayPauseButton />
      <TimeDisplay />
    </ControlButtons>
    <RightButtons>
      <SpeedButton />
      <VolumeButton />
      <EpisodesButton />
    </RightButtons>
  </Controls>

  <EpisodeDrawer />

  <Navigation>
    <PrevButton />
    <NextButton />
  </Navigation>
</PlayerPage>
```

### 2.2 播放器样式

**视频容器**
- 宽度: 100%
- 宽高比: 9:16 (竖屏)
- 最大高度: 80vh
- 背景: 纯黑

**控制栏**
- 背景: 渐变透明→黑色
- 高度: 48px
- 自动隐藏: 3秒无操作

**进度条**
- 高度: 4px
- 已播放: 红色
- 缓冲: 灰色
- 悬停: 高度增至8px

### 2.3 选集抽屉

```tsx
<Drawer open={true}>
  <Header>
    <Title>Episodes</Title>
    <CloseButton />
  </Header>
  <List>
    <EpisodeItem
      status="playing"  // playing | watched | locked | unlocked
      episodeNumber={1}
      title="Episode 1"
      duration="30:00"
    />
  </List>
</Drawer>
```

---

## 3. 解锁弹窗 UI

### 3.1 弹窗样式

```tsx
<Modal>
  <Backdrop />
  <Content>
    <LockIcon />
    <Title>Unlock Episode</Title>
    <EpisodeInfo>
      <EpisodeNumber />
      <Price />
    </EpisodeInfo>
    <BalanceInfo>
      Your balance: 500 coins
    </BalanceInfo>
    <Actions>
      <CancelButton />
      <UnlockButton />
    </Actions>
  </Content>
</Modal>
```

### 3.2 样式细节

- 弹窗宽度: 320px
- 背景: #1f1f1f
- 圆角: 16px
- 按钮高度: 48px
- 动画: scale + fade, 200ms

---

## 4. 交互反馈

### 4.1 动画效果

| 场景 | 动画 | 时长 |
|------|------|------|
| 页面切换 | fade | 200ms |
| 弹窗出现 | scale + fade | 200ms |
| 按钮点击 | scale | 100ms |
| 收藏成功 | heart pulse | 300ms |
| 加载 | skeleton shimmer | 1.5s循环 |

### 4.2 加载状态

- 骨架屏: 灰色闪烁动画
- 视频加载: 圆形进度指示器
- 按钮加载: spinner图标

### 4.3 错误状态

- 图片加载失败: 显示默认封面
- 视频播放失败: 显示重试按钮
- 网络错误: toast提示

---

## 5. 响应式设计

### 5.1 详情页断点

| 元素 | Mobile (<768px) | Desktop (≥768px) |
|------|-----------------|------------------|
| 封面 | 100px宽度 | 120px宽度 |
| 剧集网格 | 3列 | 6列 |
| 演员列表 | 横向滚动 | 网格 |

### 5.2 播放页断点

| 元素 | Mobile | Desktop |
|------|--------|---------|
| 控制栏 | 底部固定 | 叠加在视频上 |
| 选集抽屉 | 全屏抽屉 | 右侧滑出 |
| 倍速选项 | 底部弹出 | 悬浮菜单 |

---

## 6. 验收标准

- [ ] 详情页响应式正常
- [ ] 播放器控件自动隐藏
- [ ] 解锁弹窗动画流畅
- [ ] 选集切换无卡顿
- [ ] 收藏状态实时反馈
