# Contact Module

## Purpose
Contact 模块负责紧急联系人的适配和通知接收。Contact 是被动方，无需安装 App，通过邮件接收关键信息并采取行动。

## Allowed
- Domain 层：联系人信息、通知模板、响应规则（如 `ContactInfo`、`NotificationTemplate`）
- Application 层：通知模板渲染、响应处理（如 `renderNotification()`、`handleResponse()`）
- Infrastructure 层：邮件模板生成、HTML 格式化、链接生成
- UI 层：联系人配置页面（可选，用于预配置接收偏好）

## Forbidden
- Domain 层禁止导入 `infrastructure/`、`ui/`、`platform/`、`aspects/`
- Application 层禁止导入 `infrastructure/`、`ui/`、`platform/`
- Infrastructure 层禁止导入 `ui/`
- UI 层禁止直接导入 `infrastructure/`、`platform/`、`domain/`

## Examples
```typescript
// Domain: 定义联系人信息
export class ContactInfo {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string
  ) {}
}

// Application: 渲染通知模板
import { ContactInfo, AlertEvent } from '../domain';
export function renderNotification(event: AlertEvent, contact: ContactInfo) {
  return {
    to: contact.email,
    subject: `[iTrustCircle] 紧急通知 - ${event.triggerReason}`,
    body: generateEmailBody(event, contact)
  };
}

// Infrastructure: 邮件生成
import { AlertEvent } from '../domain';
export function generateEmailBody(event: AlertEvent, contact: ContactInfo) {
  return `
    <h1>紧急通知</h1>
    <p>尊敬的 ${contact.name}，</p>
    <p>检测到安全事件：${event.triggerReason}</p>
    <p>时间：${new Date(event.timestamp).toLocaleString()}</p>
  `;
}
```

## Layer Import Rules
| From \ To | domain | application | infrastructure | ui | platform | aspects |
|-----------|--------|-------------|----------------|----|----------|---------|
| domain    | ✓      | ✗           | ✗              | ✗  | ✗        | ✗       |
| application | ✗   | ✓           | ✗              | ✗  | ✗        | ✓       |
| infrastructure | ✗ | ✓           | ✓              | ✗  | ✓        | ✓       |
| ui        | ✗      | ✓           | ✗              | ✓  | ✗        | ✓       |
