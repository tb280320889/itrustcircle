# ADR-0001：客户端形态与部署边界（Tower/Sentinel/Contact）

## 状态

已定

## 背景

PRD 定义了三角色模型：Tower（塔台设备）、Sentinel（哨兵设备）、Contact（联系人）。需要明确 MVP 的客户端形态边界，避免范围蔓延。

## 决策

**MVP 采用单应用多角色模式**：
- 单一 SvelteKit + Capacitor 应用支持 Tower/Sentinel 两种模式切换
- Contact 无需独立应用，通过 Email/IM/SMS 接收通知
- 首次启动时让用户选择角色：Tower 模式或 Sentinel 模式
- 支持同一设备在不同时间切换角色（如手机既可作 Sentinel 也可作 Tower）

**部署边界**：
- 仅支持 Android 平台（API 23+）
- Tower 模式：适合家里旧手机/平板等常开设备
- Sentinel 模式：适合随身手机，后台稳定运行
- 不支持 iOS/Web，留待后续版本

## 技术实现

```typescript
// 应用启动时的角色选择
enum AppMode {
  TOWER = 'tower',
  SENTINEL = 'sentinel'
}

// 角色切换逻辑
const switchMode = (mode: AppMode) => {
  // 保存用户偏好
  localStorage.setItem('appMode', mode);
  // 重启应用进入对应模式
  location.reload();
};
```

## 影响

### 正向影响
- 开发复杂度最小，单一代码库
- 符合 WIP=1 原则，避免跨层拆卡
- 用户安装成本低，一个应用覆盖所有场景

### 负向影响
- 同一设备不能同时作为 Tower 和 Sentinel
- iOS 用户无法使用，需要后续版本支持

## 备选方案（已拒绝）

- **方案 B：Tower 和 Sentinel 分别独立应用**
  - 理由：开发成本高，用户体验差
  - 拒绝原因：违反 MVP 最小化原则

- **方案 C：Web + 混合应用**
  - 理由：跨端一致性好
  - 拒绝原因：增加技术复杂度，Capacitor 工作流强制要求 native

## 验证方式（可执行）

1. **构建验证**：
   - `pnpm -C apps/mobile build` 成功
   - `pnpm -C apps/mobile exec cap sync` 成功
   - `pnpm -C apps/mobile exec cap run android` 可启动

2. **角色切换验证**：
   - 首次启动显示角色选择页面
   - 选择 Tower 模式进入塔台控制台界面
   - 选择 Sentinel 模式进入哨兵守护界面
   - 设置页面支持角色切换

3. **ADR 索引一致性**：
   - adr-index.md 中 ADR-0001 状态标记为"已定"
   - 验证方式摘要与本文档一致

4. **PRD 对应验证**：
   - PRD 4.1 节（角色）与本文档一致
   - PRD 9.3 节（塔台可达性）与单应用模式兼容