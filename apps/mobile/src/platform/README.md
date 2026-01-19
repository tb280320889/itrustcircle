# Platform Bridges

## Purpose
Platform 目录包含 Capacitor/Android/iOS 的原生桥接代码。用于封装 native 功能调用，与业务逻辑解耦。

## Allowed
- Capacitor 插件封装
- Android Native API 调用
- iOS Native API 调用（未来支持）
- 平台检测代码
- 权限请求封装

## Forbidden
- 禁止包含业务逻辑（应放在 module/infrastructure/）
- 禁止直接导入 `domain/`、`application/`、`ui/`
- 禁止在 bridge 中实现复杂状态管理
- 禁止放置 UI 组件

## Examples
```typescript
// Capacitor BLE Plugin Wrapper
import { BleClient } from '@capacitor-community/bluetooth-le';

export interface DeviceInfo {
  deviceId: string;
  name: string;
  rssi: number;
}

export async function scanDevices(): Promise<DeviceInfo[]> {
  await BleClient.requestPermissions({ permissions: { android: ['ACCESS_FINE_LOCATION'] } });
  // Implementation details...
}

// Platform Detection
export function isAndroid(): boolean {
  return import.meta.env.DEVICE === 'android';
}

export function isIos(): boolean {
  return import.meta.env.DEVICE === 'ios';
}
```

## Integration Pattern
1. `infrastructure/` 层定义接口（如 `BLEManager`）
2. `platform/` 层提供实现（如 `CapacitorBLEManager`）
3. `infrastructure/` 层通过依赖注入使用

## Notes
- Platform 层仅可被 `infrastructure/` 层导入
- UI/Application/Domain 层禁止直接导入 platform
- 遵循 `platform/` 的扁平结构，不创建子目录
