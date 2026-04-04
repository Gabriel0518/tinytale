# 🧪 政策配置页面 - 测试指南

## ✅ 构建状态
- ✅ 前端构建成功（无错误）
- ✅ 所有修改已应用

---

## 🚀 测试步骤

### Step 1: 重启前端服务

```bash
cd /Users/gabriel/tinytale

# 停止现有服务
pkill -f "next dev"

# 启动服务
npm run dev
```

**预期输出**：
```
ready - started server on 0.0.0.0:7001
```

---

### Step 2: 访问政策配置页面

```
URL: http://localhost:7001/admin/creators/policies
```

---

### Step 3: 检查顶部卡片

**查看 "Payment Channel Fee" 卡片**：

✅ 应该显示：
- 费率：`3.3%`（或其他实际费率，不是固定的 5%）
- 说明：`From fee-config (Airwallex/Stripe fees)`
- 链接：`Manage fee config →`

✅ 点击链接：
- 应该跳转到：`/admin/creators/fee-config`

---

### Step 4: 检查政策配置部分

**向下滚动到 "Policy controls" 部分**：

✅ 应该看到：
- 标题：`Payment Processing`
- 只读卡片（不是输入框）
- 左侧：
  - `Payment Channel Fee Rate`
  - `Managed in Fee Config (Airwallex/Stripe fees)`
- 右侧：
  - 大号费率：`3.3%`
  - 链接：`Edit in Fee Config →`

✅ 如果有激活的配置，应该看到：
- `Active Configurations:`
- 配置列表，例如：
  - `airwallex (*): 3.3% + $2.35`
  - `airwallex (INTL): 3.6% + $2.35`

✅ 点击链接：
- 应该跳转到：`/admin/creators/fee-config`

---

### Step 5: 检查计算示例

**查看 "Revenue Split Calculation" 部分**：

✅ 应该看到动态计算的金额：
- `总收入 Revenue: $1,000.00`
- `Payment Channel Fee (3.3%): -$33.00`（不是固定的 -$50.00）
- `Distributable Amount: $967.00`（不是固定的 $950.00）
- `Creator Share (70%): $677.00`（不是固定的 $665.00）
- `Platform Share (30%): $290.00`（不是固定的 $285.00）
- `Refund Reserve (10% of gross): -$100.00`
- `Creator Net Settlement: $577.00`（不是固定的 $565.00）

---

### Step 6: 测试 Fee Config 集成

**访问 Fee Config 页面**：
```
URL: http://localhost:7001/admin/creators/fee-config
```

✅ 应该看到：
- 类型列（Payment / Transfer）
- 提供商列
- Airwallex 配置（至少 2 条 payment_channel）

**修改费率**：
1. 点击编辑某个 payment_channel 配置
2. 修改 Fee Rate（例如改为 4%）
3. 保存

**返回政策配置页面**：
```
URL: http://localhost:7001/admin/creators/policies
```

✅ 应该看到：
- 顶部卡片费率更新为 4%
- 政策配置部分费率更新为 4%
- 计算示例金额自动更新

---

## 🎯 预期效果对比

### 修改前
```
顶部卡片:
  5%
  Stripe/payment processor fees deducted first.

政策配置:
  [可编辑输入框] 0.4
  Stripe/payment processor fees (typically 3-5%)

计算示例:
  Payment Channel Fee (5%): -$50.00
  Distributable Amount: $950.00
  Creator Share (70%): $665.00
  Creator Net Settlement: $565.00
```

### 修改后
```
顶部卡片:
  3.3%
  From fee-config (Airwallex/Stripe fees).
  [Manage fee config →]

政策配置:
  Payment Channel Fee Rate
  Managed in Fee Config (Airwallex/Stripe fees)
  
  3.3%
  [Edit in Fee Config →]
  
  Active Configurations:
  airwallex (*): 3.3% + $2.35
  airwallex (INTL): 3.6% + $2.35

计算示例:
  Payment Channel Fee (3.3%): -$33.00
  Distributable Amount: $967.00
  Creator Share (70%): $677.00
  Creator Net Settlement: $577.00
```

---

## 📸 截图检查点

建议截图保存以下内容：

1. **顶部卡片** - 显示实际费率和链接
2. **政策配置部分** - 只读卡片和配置列表
3. **计算示例** - 动态计算的金额
4. **Fee Config 页面** - 类型和提供商列

---

## 🐛 故障排查

### 问题 1: 费率仍然显示 5%

**原因**: Fee Config 数据未初始化

**解决**:
```bash
cd /Users/gabriel/tinytale-api
mongo mongodb://localhost:27017/tinytale scripts/init-fee-config.js
```

### 问题 2: 链接跳转 404

**原因**: 路由不存在

**解决**: 确认 fee-config 页面存在：
```
/Users/gabriel/tinytale/src/app/admin/creators/fee-config/page.tsx
```

### 问题 3: 配置列表不显示

**原因**: 没有激活的 payment_channel 配置

**解决**: 在 fee-config 页面添加配置

### 问题 4: 计算金额不正确

**原因**: 费率读取失败

**解决**: 检查浏览器控制台错误

---

## ✅ 测试完成标准

所有测试通过的标准：

1. ✅ 顶部卡片显示实际费率（不是 5%）
2. ✅ 顶部卡片链接正常跳转
3. ✅ 政策配置部分显示为只读
4. ✅ 政策配置部分显示配置列表
5. ✅ 政策配置部分链接正常跳转
6. ✅ 计算示例使用实际费率
7. ✅ 计算金额正确
8. ✅ 修改 fee-config 后自动更新
9. ✅ 无控制台错误
10. ✅ UI 样式正确

---

## 📝 测试报告模板

```
========================================
政策配置页面测试报告
========================================

测试时间: [填写时间]
测试人员: [填写姓名]

✅ 通过的测试:
- [ ] 顶部卡片显示实际费率
- [ ] 顶部卡片链接跳转
- [ ] 政策配置只读显示
- [ ] 配置列表显示
- [ ] 政策配置链接跳转
- [ ] 计算示例动态更新
- [ ] Fee Config 集成

❌ 失败的测试:
[列出失败的测试和原因]

🐛 发现的问题:
[列出发现的 bug]

💡 改进建议:
[列出改进建议]

========================================
```

---

**准备好开始测试了吗？** 🧪

按照上面的步骤逐一测试，确保所有功能正常工作！
