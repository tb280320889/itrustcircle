# ADR-0008：幂等与去重策略（队列重放/塔台去重）

## 状态

待定

## 背景

PRD R4 要求弱网/断网场景下事件进入本地队列，网络恢复后自动补发。这可能导致重复事件发送：
- 网络重试导致的重复发送
- 应用重启后队列重放
- Tower 接收后未及时确认导致的重复
- 用户手动重试操作

需要设计端到端的幂等和去重机制，确保 AlertEvent 的唯一性。

## 决策（待定）

### 幂等策略设计

**双层幂等保障**：
```
第一层：Sentinel 端幂等（避免生成重复事件）
第二层：Tower 端去重（避免处理重复事件）
```

### Sentinel 端幂等机制

**事件生成幂等**：
```typescript
interface AlertEventKey {
  sentinel_id: string;
  tower_id: string;
  profile_id: string;
  trigger_reason: string;
  session_id: string;      // 守护会话ID
  device_address: string;  // BLE设备地址
  trigger_window: number;  // 触发时间窗口（小时）
}

// 生成唯一事件ID
const generateEventId = (key: AlertEventKey): string => {
  const window = Math.floor(Date.now() / (key.trigger_window * 3600000));
  const payload = `${key.sentinel_id}-${key.tower_id}-${key.profile_id}-${key.trigger_reason}-${key.device_address}-${window}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
};
```

**防抖与去重逻辑**：
```typescript
// 防抖配置
const DEBOUNCE_CONFIG = {
  window: 30,              // 30秒内重复断联算一次
  maxEventsPerHour: 10,     // 每小时最大事件数
  cooldownAfterCancel: 300  // 取消后5分钟内不重新触发
};

// 断联事件处理
const handleDisconnect = (deviceInfo: BLEDevice) => {
  const now = Date.now();
  const lastDisconnect = getLastDisconnectTime(deviceInfo.address);
  
  // 防抖检查
  if (now - lastDisconnect < DEBOUNCE_CONFIG.window * 1000) {
    console.log('Debounce: ignoring repeated disconnect');
    return;
  }
  
  // 检查事件频率限制
  const recentEvents = getRecentEventCount(deviceInfo.address, 3600000); // 1小时
  if (recentEvents >= DEBOUNCE_CONFIG.maxEventsPerHour) {
    console.log('Rate limit: too many events, ignoring');
    return;
  }
  
  // 生成事件
  const event = generateAlertEvent(deviceInfo);
  scheduleCountdown(event);
};
```

### Tower 端去重机制

**数据库唯一约束**：
```sql
-- 事件表的唯一约束
CREATE UNIQUE INDEX idx_alert_events_unique 
ON alert_events(event_id);

-- 投递记录的唯一约束
CREATE UNIQUE INDEX idx_delivery_records_unique 
ON delivery_records(event_id, channel_type, recipient);
```

**接收时去重逻辑**：
```typescript
// 接收 AlertEvent 时的去重
const receiveAlertEvent = async (event: AlertEvent, auth: AuthInfo): Promise<void> => {
  // 验证认证信息
  const isValid = await validateAuth(auth);
  if (!isValid) {
    throw new Error('Invalid authentication');
  }
  
  // 检查事件是否已存在
  const existingEvent = await getEventById(event.event_id);
  if (existingEvent) {
    console.log(`Event ${event.event_id} already exists, ignoring`);
    return; // 幂等返回
  }
  
  // 事务性写入
  await db.transaction(async (tx) => {
    // 写入事件
    await tx.run(`
      INSERT INTO alert_events (event_id, sentinel_id, tower_id, profile_id, timestamp, trigger_reason, device_meta, location, cancelled_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [event.event_id, event.sentinel_id, event.tower_id, event.profile_id, event.timestamp, event.trigger_reason, JSON.stringify(event.device_meta), JSON.stringify(event.location), event.cancelled_count]);
    
    // 创建投递任务
    await createDeliveryTasks(tx, event);
  });
  
  console.log(`Event ${event.event_id} processed successfully`);
};
```

### 重试机制幂等

**智能重试策略**：
```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  idempotencyWindow: number;  // 幂等窗口（毫秒）
}

const RETRY_CONFIG: RetryConfig = {
  maxRetries: 10,
  baseDelay: 5000,      // 5秒
  maxDelay: 3600000,    // 1小时
  backoffFactor: 2,
  idempotencyWindow: 60000  // 1分钟内认为同一请求
};

// 带幂等的重试
const retryWithIdempotency = async (eventId: string, operation: () => Promise<void>): Promise<void> => {
  const idempotencyKey = `retry-${eventId}`;
  const lastAttempt = getLastAttemptTime(idempotencyKey);
  
  // 幂等窗口检查
  if (Date.now() - lastAttempt < RETRY_CONFIG.idempotencyWindow) {
    console.log(`Idempotency window active for ${eventId}, skipping`);
    return;
  }
  
  let attemptCount = 0;
  while (attemptCount < RETRY_CONFIG.maxRetries) {
    try {
      await operation();
      recordSuccessfulAttempt(idempotencyKey);
      return;
    } catch (error) {
      attemptCount++;
      
      if (attemptCount >= RETRY_CONFIG.maxRetries) {
        console.error(`Max retries exceeded for ${eventId}`);
        throw error;
      }
      
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attemptCount),
        RETRY_CONFIG.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
      recordAttemptTime(idempotencyKey);
    }
  }
};
```

## 影响分析

### 数据一致性保障
- **强一致性**：事件ID唯一约束确保不重复
- **最终一致性**：重试机制保证最终投递成功
- **可观测性**：详细的重试和去重日志

### 性能影响
- **存储开销**：需要存储额外的去重状态
- **计算开销**：ID生成和验证的计算成本
- **网络开销**：减少重复请求，总体降低网络开销

### 用户体验
- **误报控制**：防抖机制减少用户打扰
- **可靠性提升**：重试机制确保重要事件不丢失
- **透明性**：状态页显示重试和去重情况

## 关键问题待解决

1. **时钟同步**：
   - Sentinel 和 Tower 时钟不一致对事件时间的影响
   - 是否需要使用网络时间同步

2. **冲突处理**：
   - 相同时间窗口内不同设备触发的事件处理
   - 事件优先级和合并策略

3. **存储清理**：
   - 去重状态数据的保留周期
   - 历史事件的归档和清理策略

4. **监控指标**：
   - 去重率和重复率统计
   - 重试成功率监控

## 验证方式（可执行）

1. **Sentinel 端幂等验证**：
   - 快速断开/连接 BLE → 只触发一次倒计时
   - 相同 BLE 设备重复断联 → 只生成一个事件ID
   - 取消后重新断联 → 遵守冷却时间限制

2. **Tower 端去重验证**：
   - 重复发送相同 event_id → 只处理一次
   - 数据库唯一约束 → 重复插入失败
   - 并发相同请求 → 事务保护数据一致

3. **重试机制验证**：
   - 网络失败自动重试 → 指数退避生效
   - 应用重启后重试 → 队列数据不丢失
   - 最大重试次数限制 → 达到后停止重试

4. **Failure Modes 覆盖**：
   - FM-D2（重复发送）：去重机制防止重复记录
   - FM-N1（无网络）：重试策略确保最终投递
   - FM-D1（状态不一致）：幂等操作保证一致

5. **Journey 对应验证**：
   - Sentinel C2（上报）：事件生成幂等性
   - Tower C2（接收）：事件接收去重性
   - R4（可靠投递）：重试和幂等机制支持

## 技术实现

**依赖库**：
- `crypto`：用于生成唯一ID
- SQLite：唯一约束和事务支持
- 自定义重试调度器

**监控指标**：
```typescript
interface IdempotencyMetrics {
  totalEvents: number;
  duplicateEvents: number;
  debounceFiltered: number;
  retryAttempts: number;
  retrySuccesses: number;
  averageRetries: number;
}
```

**配置管理**：
- 防抖参数可配置
- 重试策略可调优
- 监控阈值可设置