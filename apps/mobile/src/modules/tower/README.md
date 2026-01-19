# Tower Module

## Purpose
Tower 模块负责家庭端的事件接收、存储和通知分发。接收 Sentinel 上报的 AlertEvent，进行去重和持久化存储，并通过 Email/SMTP 通知紧急联系人。

## Allowed
- Domain 层：业务实体、值对象、不变量（如 `AlertEvent`、`DeliveryRecord`）
- Application 层：用例编排、事件处理流程、通知分发逻辑（如 `processAlertEvent()`、`dispatchNotification()`）
- Infrastructure 层：SQLite 存储、Email/SMTP 发送、HTTP API（接收 Sentinel 上报）
- UI 层：状态仪表盘、诊断日志查看、配置页面

## Forbidden
- Domain 层禁止导入 `infrastructure/`、`ui/`、`platform/`、`aspects/`
- Application 层禁止导入 `infrastructure/`、`ui/`、`platform/`
- Infrastructure 层禁止导入 `ui/`
- UI 层禁止直接导入 `infrastructure/`、`platform/`、`domain/`

## Examples
```typescript
// Domain: 定义报警事件
export class AlertEvent {
  constructor(
    public readonly eventId: string,
    public readonly timestamp: number,
    public readonly triggerReason: string,
    public readonly deviceMeta: Record<string, unknown>
  ) {}
}

// Application: 编排事件处理
import { AlertEvent } from '../domain';
export function processAlertEvent(event: AlertEvent) {
  const exists = checkDuplicate(event.eventId);
  if (exists) return;
  await saveToDatabase(event);
  await dispatchNotification(event);
}

// Infrastructure: SQLite 存储
import { AlertEvent } from '../domain';
export class AlertEventRepository {
  async save(event: AlertEvent) {
    await db.execute(
      'INSERT INTO alert_events (event_id, timestamp, trigger_reason, meta) VALUES (?, ?, ?, ?)',
      [event.eventId, event.timestamp, event.triggerReason, JSON.stringify(event.deviceMeta)]
    );
  }
}
```

## Layer Import Rules
| From \ To | domain | application | infrastructure | ui | platform | aspects |
|-----------|--------|-------------|----------------|----|----------|---------|
| domain    | ✓      | ✗           | ✗              | ✗  | ✗        | ✗       |
| application | ✗   | ✓           | ✗              | ✗  | ✗        | ✓       |
| infrastructure | ✗ | ✓           | ✓              | ✗  | ✓        | ✓       |
| ui        | ✗      | ✓           | ✗              | ✓  | ✗        | ✓       |
