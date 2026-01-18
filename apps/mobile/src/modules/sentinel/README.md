# Sentinel Module

## Purpose
Sentinel 模块负责随身端的设备监测和事件触发。当绑定的 BLE 设备断联时，Sentinel 触发倒计时流程；若无人取消则生成 AlertEvent 并上报给 Tower。

## Allowed
- Domain 层：业务实体、值对象、不变量（如 `DisconnectEvent`、`CountdownState`）
- Application 层：用例编排、倒计时管理、事件生成逻辑（如 `handleDisconnect()`、`startCountdown()`）
- Infrastructure 层：BLE 设备连接管理、网络上报（HTTP/gRPC 到 Tower）
- UI 层：状态显示、倒计时取消交互、设置页面

## Forbidden
- Domain 层禁止导入 `infrastructure/`、`ui/`、`platform/`、`aspects/`
- Application 层禁止导入 `infrastructure/`、`ui/`、`platform/`
- Infrastructure 层禁止导入 `ui/`
- UI 层禁止直接导入 `infrastructure/`、`platform/`、`domain/`

## Examples
```typescript
// Domain: 定义断联事件
export class DisconnectEvent {
  constructor(
    public readonly deviceId: string,
    public readonly timestamp: number,
    public readonly triggerReason: 'ble_disconnect' | 'manual'
  ) {}
}

// Application: 编排倒计时和事件生成
import { DisconnectEvent } from '../domain';
export function handleDisconnect(event: DisconnectEvent) {
  startCountdown(event);
  if (countdownCancelled) return;
  const alertEvent = createAlertEvent(event);
  uploadToTower(alertEvent);
}

// Infrastructure: BLE 管理
import { DisconnectEvent } from '../domain';
export class BLEManager {
  onDeviceDisconnected(deviceId: string) {
    const event = new DisconnectEvent(deviceId, Date.now(), 'ble_disconnect');
    handleDisconnect(event);
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
