# Cross-Cutting Concerns (Aspects)

## Purpose
Aspects 目录包含横切关注点的集中实现。用于日志、错误处理、遥测、诊断等跨模块共享的能力。

## Allowed
- 日志记录（`aspects/logger`）
- 错误处理（`aspects/errors`）
- 诊断导出（`aspects/diagnostics`）
- 性能遥测
- 安全审计

## Forbidden
- 禁止在业务代码中散落横切逻辑（应统一使用 aspects API）
- 禁止在 domain 层导入 aspects（保持 domain 纯净）
- 禁止直接使用 `console.log` 或第三方日志器
- 禁止内联错误处理（应使用 aspects/errors）

## Examples
```typescript
// 日志使用
import { logger } from 'aspects/logger';
logger.info('Alert event received', { eventId: '123' });

// 错误处理使用
import { handleError } from 'aspects/errors';
try {
  await saveToDatabase(event);
} catch (error) {
  handleError(error, { eventId: event.eventId, operation: 'save' });
}

// 诊断导出
import { diagnostics } from 'aspects/diagnostics';
export function exportDiagnostics() {
  return diagnostics.export({ includeLogs: true, includeConfig: true });
}
```

## API Style
使用模块导入风格：
```typescript
import { logger } from 'aspects/logger';
import { handleError } from 'aspects/errors';
import { diagnostics } from 'aspects/diagnostics';
```

## Layer Visibility
| Layer     | Can Import Aspects |
|-----------|-------------------|
| domain    | ✗                 |
| application | ✓               |
| infrastructure | ✓           |
| ui        | ✓                 |

## Notes
- 保持扁平结构，子目录/子文件可选（如 `aspects/logger.ts`、`aspects/errors.ts`）
- 诊断导出可在 `aspects/diagnostics.*` 中实现（文件或目录均可）
- Aspects 层不依赖 domain 层，保持业务无关性
