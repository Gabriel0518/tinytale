# 🎨 政策配置页面更新 - Fee Config 集成

## ✅ 已完成的修改

### 1. 顶部卡片 - Payment Channel Fee
**修改前**：
- 显示写死的 5%
- 说明文字：Stripe/payment processor fees deducted first.

**修改后**：
- 从 fee-config 动态读取实际费率
- 显示格式：`3.3%`（保留一位小数）
- 说明文字：From fee-config (Airwallex/Stripe fees)
- 添加链接：Manage fee config → 跳转到 fee-config 页面

### 2. 政策配置部分 - Payment Channel Fee Rate
**修改前**：
- 可编辑的输入框
- 用户可以自由修改费率

**修改后**：
- 改为只读显示卡片
- 显示实际的 fee-config 费率
- 显示所有激活的 payment_channel 配置
- 添加链接：Edit in Fee Config → 跳转到 fee-config 页面
- 显示配置详情：provider (countryCode) - 费率 + 固定费用

### 3. Revenue Split Calculation 示例
**修改前**：
- 使用写死的 5% 费率
- 固定金额计算

**修改后**：
- 使用实际的 fee-config 费率动态计算
- 所有金额根据实际费率自动更新
- 显示实际费率百分比

---

## 📊 数据流

```
1. 页面加载
   ↓
2. 调用 adminApi.getAirwallexFeeConfigs()
   ↓
3. 查找 type === 'payment_channel' && isActive 的配置
   ↓
4. 提取 feeRate 作为 actualPaymentFeeRate
   ↓
5. 在三个地方使用：
   - 顶部卡片显示
   - 政策配置部分显示
   - 计算示例动态计算
```

---

## 🎯 UI 改进

### 顶部卡片
```tsx
<article className={panelClassName}>
  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
    Payment Channel Fee
  </p>
  <p className="mt-3 text-3xl font-bold text-orange-300">
    {(actualPaymentFeeRate * 100).toFixed(1)}%  // 3.3%
  </p>
  <p className="mt-2 text-sm text-gray-400">
    From fee-config (Airwallex/Stripe fees).
  </p>
  <Link href="/admin/creators/fee-config" className="...">
    Manage fee config →
  </Link>
</article>
```

### 政策配置部分
```tsx
<div className="rounded-xl border border-gray-700/50 bg-[#0f0f17] p-4">
  <div className="flex items-start justify-between">
    <div>
      <span className="block text-sm font-medium text-gray-300">
        Payment Channel Fee Rate
      </span>
      <p className="mt-1 text-xs text-gray-500">
        Managed in Fee Config (Airwallex/Stripe fees)
      </p>
    </div>
    <div className="text-right">
      <p className="text-2xl font-bold text-orange-300">
        {(actualPaymentFeeRate * 100).toFixed(1)}%
      </p>
      <Link href="/admin/creators/fee-config" className="...">
        Edit in Fee Config →
      </Link>
    </div>
  </div>
  
  {/* 显示所有激活的配置 */}
  <div className="mt-3 space-y-2 border-t border-gray-700/50 pt-3">
    <p className="text-xs font-medium text-gray-400">Active Configurations:</p>
    {feeConfigs
      .filter(c => c.type === 'payment_channel' && c.isActive)
      .map((config, idx) => (
        <div key={idx} className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {config.provider} ({config.countryCode})
          </span>
          <span className="font-mono text-gray-400">
            {(config.feeRate * 100).toFixed(1)}% + ${config.fixedFee.toFixed(2)}
          </span>
        </div>
      ))}
  </div>
</div>
```

### 计算示例
```tsx
// 动态计算
const exampleGrossRevenue = 1000;
const examplePaymentFee = exampleGrossRevenue * actualPaymentFeeRate;
const exampleDistributable = exampleGrossRevenue - examplePaymentFee;
const exampleCreatorShare = exampleDistributable * data.creatorTierRates.gold;
const examplePlatformShare = exampleDistributable * platformShareRate;
const exampleReserve = exampleGrossRevenue * data.refundReserveRate;
const exampleNetSettlement = exampleCreatorShare - exampleReserve;

// 显示
<div className="flex items-center justify-between rounded-lg bg-[#0f0f17] px-4 py-2">
  <span className="text-gray-400">
    Payment Channel Fee ({(actualPaymentFeeRate * 100).toFixed(1)}%)
  </span>
  <span className="font-mono font-semibold text-orange-300">
    -${examplePaymentFee.toFixed(2)}
  </span>
</div>
```

---

## 🔄 用户体验流程

### 场景 1: 查看当前费率
1. 用户访问政策配置页面
2. 顶部卡片显示实际费率（例如：3.3%）
3. 用户看到"From fee-config"说明
4. 用户点击"Manage fee config →"
5. 跳转到 fee-config 页面

### 场景 2: 修改费率
1. 用户在政策配置页面看到费率
2. 用户点击"Edit in Fee Config →"
3. 跳转到 fee-config 页面
4. 用户编辑或添加新的 payment_channel 配置
5. 保存后返回政策配置页面
6. 费率自动更新

### 场景 3: 查看配置详情
1. 用户在政策配置部分看到"Active Configurations"
2. 显示所有激活的 payment_channel 配置
3. 例如：
   - airwallex (*): 3.3% + $2.35
   - airwallex (INTL): 3.6% + $2.35

---

## 📝 代码变更总结

### 新增状态
```tsx
const [feeConfigs, setFeeConfigs] = useState<any[]>([]);
const [actualPaymentFeeRate, setActualPaymentFeeRate] = useState<number>(0.05);
```

### 新增数据加载
```tsx
// 加载 fee-config 数据
const feeConfigResponse: any = await adminApi.getAirwallexFeeConfigs();
if (!cancelled && feeConfigResponse?.success) {
  const configs = feeConfigResponse.data || [];
  setFeeConfigs(configs);

  // 查找 payment_channel 类型的配置
  const paymentChannelConfig = configs.find(
    (c: any) => c.type === 'payment_channel' && c.isActive
  );

  if (paymentChannelConfig) {
    setActualPaymentFeeRate(paymentChannelConfig.feeRate);
  }
}
```

### 新增计算逻辑
```tsx
const exampleGrossRevenue = 1000;
const examplePaymentFee = exampleGrossRevenue * actualPaymentFeeRate;
const exampleDistributable = exampleGrossRevenue - examplePaymentFee;
const exampleCreatorShare = exampleDistributable * data.creatorTierRates.gold;
const examplePlatformShare = exampleDistributable * platformShareRate;
const exampleReserve = exampleGrossRevenue * data.refundReserveRate;
const exampleNetSettlement = exampleCreatorShare - exampleReserve;
```

---

## ✅ 测试清单

### 功能测试
- [ ] 页面加载时正确获取 fee-config 数据
- [ ] 顶部卡片显示实际费率
- [ ] 政策配置部分显示实际费率
- [ ] 计算示例使用实际费率
- [ ] "Manage fee config" 链接正常跳转
- [ ] "Edit in Fee Config" 链接正常跳转
- [ ] Active Configurations 列表正确显示

### 数据测试
- [ ] 如果没有 payment_channel 配置，使用默认 5%
- [ ] 如果有多个配置，显示第一个激活的
- [ ] 费率格式正确（保留一位小数）
- [ ] 金额计算正确

### UI 测试
- [ ] 卡片样式正确
- [ ] 链接颜色和悬停效果正常
- [ ] 配置列表布局正确
- [ ] 响应式设计正常

---

## 🎉 完成效果

### 修改前
- Payment Channel Fee: 固定显示 5%
- 用户可以在政策配置中修改
- 计算示例使用固定值

### 修改后
- Payment Channel Fee: 动态显示实际费率（例如 3.3%）
- 用户需要在 fee-config 页面修改
- 计算示例自动更新
- 显示所有激活的配置详情
- 提供便捷的跳转链接

---

## 📚 相关文件

- `/Users/gabriel/tinytale/src/app/admin/creators/policies/page.tsx` - 政策配置页面
- `/Users/gabriel/tinytale/src/app/admin/creators/fee-config/page.tsx` - Fee Config 页面
- `/Users/gabriel/tinytale/src/lib/adminApi.ts` - API 调用
- `/Users/gabriel/tinytale/src/types/creator.ts` - 类型定义

---

**所有修改已完成！** 🎉

现在政策配置页面会从 fee-config 动态读取支付渠道费率，并提供便捷的跳转链接进行管理。
