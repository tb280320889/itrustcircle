# ADR-0004：AlertEvent 最小数据模型（Sentinel→Tower）

## 状态

待定

## 背景

PRD 要求 Sentinel 在 BLE 断联倒计时结束后生成最小 AlertEvent 并上报塔台。需要定义 AlertEvent 的核心字段集合，确保 Tower 能接收、存储并基于此触发通知，同时保持数据最小化原则。

## 决策（待定）

### AlertEvent 最小字段集合

```json
{
  "event_id": "string",           // UUID，全局唯一，用于幂等去重
  "sentinel_id": "string",        // Sentinel 设备标识，用于 Tower 端分组
  "tower_id": "string",           // Tower 设备标识，用于路由验证
  "profile_id": "string",         // Profile 类型（child/elder/pet/custom）
  "timestamp": "number",          // Unix 时间戳，事件生成时间
  "trigger_reason": "string",     // 触发原因：ble_disconnect
  "device_meta": {                // BLE 设备元信息
    "device_name": "string",      // BLE 设备名称
    "last_seen": "number",        // 最后连接时间戳
    "rssi_last": "number"         // 最后信号强度（可选）
  },
  "location": {                   // 位置信息（可选，取决于权限）
    "latitude": "number",
    "longitude": "number",
    "accuracy": "number",
    "timestamp": "number"
  },
  "cancelled_count": "number"     // 本次守护期间误报取消次数（用于调参）
}
```

### Tower 端存储结构

SQLite 表设计建议：

```sql
-- alert_events 表
CREATE TABLE alert_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    sentinel_id TEXT NOT NULL,
    tower_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    trigger_reason TEXT NOT NULL,
    device_meta TEXT,  -- JSON
    location TEXT,     -- JSON
    cancelled_count INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- delivery_records 表
CREATE TABLE delivery_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    channel_type TEXT NOT NULL,  -- email/telegram/其他
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,         -- pending/success/failed
    error_message TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (event_id) REFERENCES alert_events(event_id)
);
```

### 字段说明

- **event_id**: 核心标识符，用于幂等去重（ADR-0008）
- **sentinel_id**: 区分不同 Sentinel 设备，支持多 Sentinel 配对
- **profile_id**: 对应用户配置的 Profile，影响通知内容和策略
- **device_meta**: 用于 Contact 理解 BLE 设备状态，辅助判断误报
- **location**: 敏感信息，仅在用户授权情况下上报
- **cancelled_count**: 用于防抖策略和误报率分析

## 验证方式（可执行）

1. **PRD 需求覆盖验证**：
   - R3（生成最小 AlertEvent）✅ 上述字段集合满足
   - R5（Tower 存档）✅ SQLite 表设计支持
   - Journey F1.2 验收点 ✅ 包含所需最小字段

2. **Journey 引用验证**：
   - Tower C2（接收报警）✅ Tower 能解析并存储
   - Sentinel C2（上报）✅ Sentinel 能生成并发送
   - Contact C1（接收通知）✅ 通知内容可基于此生成

3. **Failure Modes 支持验证**：
   - FM-D2（重复发送）✅ event_id 支持幂等去重
   - FM-N1（无网络）✅ 队列可序列化此结构
   - FM-D3（Tower 去重）✅ event_id 唯一约束

4. **可观测性验证**：
   - 诊断导出可包含原始 AlertEvent JSON
   - 状态页可基于这些字段展示事件列表
   - 邮件通知可基于这些字段生成内容

5. **边界情况验证**：
   - 缺失 location 字段时，通知应明确提示"定位不可用"
   - device_meta 不完整时，应至少包含 device_name
   - cancelled_count 为 0 时，表示首次触发