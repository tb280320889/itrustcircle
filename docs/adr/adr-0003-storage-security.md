# ADR-0003：本地存储与加密策略（队列/事件/配置）

## 状态

待定

## 背景

PRD 要求在弱网/离线情况下系统能够可靠工作，需要本地持久化存储：
- Sentinel：离线队列存储 AlertEvent
- Tower：SQLite 存储事件和投递记录
- 两个角色：配置信息持久化
- 安全要求：最小数据采集，敏感信息加密保护

## 决策（待定）

### 存储架构

**Sentinel 端存储**：
```typescript
// 1. 本地 SQLite 队列表
CREATE TABLE offline_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,        // 全局唯一标识
  event_data TEXT NOT NULL,              // AlertEvent JSON
  retry_count INTEGER DEFAULT 0,         // 重试次数
  next_retry_at INTEGER,                 // 下次重试时间
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

// 2. 配置表
CREATE TABLE sentinel_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

**Tower 端存储**：
```typescript
// 1. 事件存储表
CREATE TABLE alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  sentinel_id TEXT NOT NULL,
  tower_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  trigger_reason TEXT NOT NULL,
  device_meta TEXT,      // JSON
  location TEXT,         // JSON（可选）
  cancelled_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

// 2. 投递记录表
CREATE TABLE delivery_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  channel_type TEXT NOT NULL,     // email/telegram
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,            // pending/success/failed
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (event_id) REFERENCES alert_events(event_id)
);

// 3. 配置表
CREATE TABLE tower_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

### 加密策略

**加密边界**：
```typescript
// 需要加密的敏感字段
const ENCRYPTED_FIELDS = {
  // Tower 配置中的认证信息
  'tower.smtp.password': true,
  'tower.telegram.token': true,
  
  // Sentinel 配置中的认证信息  
  'sentinel.tower.token': true
};

// 简单的设备级加密（不需要用户密码）
const encryptSensitiveData = (data: string): string => {
  // 使用设备唯一标识派生的密钥
  const deviceId = Capacitor.getPlatform() + '-' + await Device.getId();
  const key = await deriveKeyFromDeviceId(deviceId);
  return await encrypt(data, key);
};
```

### 离线队列重试策略

```typescript
// 指数退避 + 最大重试次数
const RETRY_POLICY = {
  maxRetries: 10,
  baseDelay: 5000,      // 5秒
  maxDelay: 3600000,    // 1小时
  backoffFactor: 2
};

const calculateRetryDelay = (attemptCount: number): number => {
  const delay = RETRY_POLICY.baseDelay * Math.pow(RETRY_POLICY.backoffFactor, attemptCount);
  return Math.min(delay, RETRY_POLICY.maxDelay);
};
```

## 影响分析

### 数据安全性
- **最小采集原则**：仅存储业务必需数据
- **本地加密**：敏感配置信息设备级加密
- **隐私保护**：位置信息可选，明确提示用户

### 性能影响
- **存储开销**：SQLite 适合移动端，轻量高效
- **网络优化**：离线队列减少无效网络请求
- **电池友好**：避免频繁网络重试

## 关键决策待定

1. **数据库位置**：
   - Android: `Context.getDatabasePath()`
   - 是否需要支持数据库迁移

2. **加密强度**：
   - 设备级加密 vs 用户密码加密
   - 密钥派生算法选择

3. **数据清理**：
   - 事件数据保留周期
   - 失败队列清理策略

## 验证方式（可执行）

1. **离线队列验证**：
   - Sentinel 断网触发事件 → 队列中存储
   - 网络恢复后自动重试 → 成功发送
   - 应用重启后队列持久化 → 数据不丢失

2. **存储完整性验证**：
   - Tower 接收事件 → SQLite 落库成功
   - 事件去重 → event_id 唯一约束生效
   - 投递记录 → 状态可追踪和更新

3. **加密验证**：
   - 敏感配置加密存储 → 明文不在文件中暴露
   - 设备间数据迁移 → 加密数据无法直接使用
   - 配置读取 → 正确解密和使用

4. **Failure Modes 覆盖**：
   - FM-N1（无网络）：离线队列机制验证
   - FM-D1（状态不一致）：数据库事务验证
   - FM-N3（应用杀死）：数据库持久化验证

5. **Journey 对应验证**：
   - Sentinel C2（断联触发）：队列存储逻辑
   - Tower C2（接收存档）：数据库落库逻辑
   - R7（诊断导出）：配置和事件查询功能

## 技术依赖

- **Capacitor Storage API**：用于配置存储
- **SQLite 插件**：用于数据库操作
- **Crypto API**：用于加密功能（可选简化实现）