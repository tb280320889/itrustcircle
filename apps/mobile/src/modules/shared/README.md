# Shared Module

## Purpose
Shared 模块包含跨模块共享的代码。用于放置多个模块共同依赖的纯类型定义、工具函数和常量。

## Allowed
- 纯 TypeScript 类型/接口（不依赖任何框架）
- 工具函数（纯函数，无副作用）
- 常量定义（配置值、枚举等）
- 跨模块共享的 DTO/数据结构

## Forbidden
- 禁止放置业务实体（应属于特定 module/domain/）
- 禁止放置依赖外部系统（SQLite、HTTP、Capacitor 等）的代码
- 禁止放置 UI 组件或 Svelte 相关代码
- 禁止放置横切关注点（日志、错误处理等，应使用 aspects/）

## Examples
```typescript
// 纯类型定义
export interface DeviceMeta {
  deviceId: string;
  deviceName: string;
  bleAddress: string;
}

// 工具函数
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// 常量定义
export const COUNTDOWN_SECONDS = 30;
export const MAX_RETRY_ATTEMPTS = 3;
```

## Notes
- Shared 模块保持扁平结构，不创建子目录
- 如果共享代码增长到需要分层，考虑提取为独立模块
- 定期审查 shared 内容，确保没有业务逻辑泄漏
