# ADR-0005：通知通道策略（MVP：Email）

## 状态

待定

## 背景

PRD R6 要求 Tower 能触发通知，Contact 通过通知接收关键信息并采取行动。MVP 必须至少有一条可用的通知通道，同时考虑后续扩展性。

## 决策（待定）

### 通道优先级（MVP）

**必需通道：Email（SMTP）**
- 理由： ubiquitous、可靠、异步、可验证
- 适用场景：正式通知、详细内容、可存档

**可选通道：Telegram Bot**
- 理由：即时到达、移动友好、支持简单交互
- 适用场景：快速提醒、链接分享、群组通知

**未来通道（v1.1+）**
- SMS：强触达，但成本高
- Push Notification：需要服务端支持
- 微信/钉钉：企业场景

### Email 通道详细设计

**SMTP 配置**：
```typescript
interface SMTPConfig {
  host: string;           // SMTP 服务器地址
  port: number;           // 端口（通常 587 或 465）
  secure: boolean;        // 是否使用 SSL/TLS
  auth: {
    user: string;         // 邮箱地址
    pass: string;         // 密码或应用专用密码
  };
  from: string;           // 发件人显示
  enabled: boolean;
}
```

**邮件模板**：
```typescript
interface EmailTemplate {
  subject: string;        // 主题：[iTrustCircle] 紧急警报 - {profile_name}
  body: string;          // 正文：时间、地点、原因、建议动作
  html?: string;         // HTML 版本（可选）
  attachments?: string[]; // 附件（可选）
}

// 邮件内容示例
const generateEmailContent = (event: AlertEvent): EmailTemplate => {
  const locationText = event.location 
    ? `📍 位置：${event.location.latitude}, ${event.location.longitude} (查看地图)`
    : '📍 位置：定位不可用';
    
  return {
    subject: `[iTrustCircle] 紧急警报 - ${event.profile_id}`,
    body: `
收到紧急警报！

📅 时间：${new Date(event.timestamp).toLocaleString()}
👤 对象：${event.profile_id}
🔴 原因：BLE 设备断联
${locationText}
🔧 设备：${event.device_meta.device_name}

建议动作：
1. 立即联系当事人确认安全
2. 如无法联系，前往最后位置查看
3. 联系其他协助者

详情请查看 Tower 控制台。
    `
  };
};
```

### Telegram 通道设计（可选）

**Bot 配置**：
```typescript
interface TelegramConfig {
  bot_token: string;     // Bot Token
  chat_id: string;       // 目标 Chat ID 或群组 ID
  enabled: boolean;
}
```

**消息格式**：
```typescript
const generateTelegramMessage = (event: AlertEvent): string => {
  const locationLink = event.location 
    ? ` [📍 查看位置](https://maps.google.com/?q=${event.location.latitude},${event.location.longitude})`
    : '';
    
  return `🚨 *iTrustCircle 紧急警报*

📅 ${new Date(event.timestamp).toLocaleString()}
👤 ${event.profile_id}
🔴 BLE 设备断联${locationLink}
📱 ${event.device_meta.device_name}

请立即联系确认安全！`;
};
```

## 影响分析

### Email 通道优势
- **可靠性**：异步投递，失败重试机制成熟
- **内容丰富**：支持长文本、HTML、附件
- **普遍性**：几乎人人都有邮箱
- **法律效力**：可作为正式记录

### Email 通道挑战
- **延迟**：相比即时通讯有延迟
- **垃圾邮件**：可能被拦截或进入垃圾箱
- **配置复杂**：需要用户配置 SMTP 参数

### Telegram 通道优势
- **即时性**：推送速度快
- **移动友好**：手机通知体验好
- **简单配置**：只需要 Bot Token 和 Chat ID

## 关键问题待解决

1. **SMTP 配置简化**：
   - 是否提供常用邮箱服务商预设配置
   - 如何指导用户获取应用专用密码

2. **投递失败处理**：
   - 重试策略和最大重试次数
   - 失败通知和用户指引

3. **多通道协调**：
   - 同时使用多个通道时的顺序和去重
   - 成功投递的判定标准

4. **内容适配**：
   - 不同通道的内容长度和格式限制
   - 本地化和多语言支持

## 验证方式（可执行）

1. **Email 通道验证**：
   - Tower 配置 SMTP → 发送测试邮件成功
   - Sentinel 触发事件 → Contact 收到邮件
   - 邮件内容完整 → 包含所有必需字段

2. **Telegram 通道验证**：
   - Tower 配置 Bot → 发送测试消息成功
   - 消息格式正确 → Markdown 渲染正常
   - 链接可点击 → 地图链接有效

3. **投递失败验证**：
   - SMTP 配置错误 → 状态页显示失败原因
   - 网络不可达 → 投递记录标记失败且可重试
   - 邮件被拦截 → 提供白名单设置建议

4. **Failure Modes 覆盖**：
   - FM-N1（无网络）：投递重试和状态记录
   - FM-N2（弱网）：延迟投递和超时处理
   - FM-U1（权限不足）：配置缺失的明确提示

5. **Journey 对应验证**：
   - Tower C2（接收报警）：触发通知流程
   - Contact C1（接收通知）：邮件内容完整性
   - F1.2 验收点：投递记录可追踪

## 技术实现

**依赖库**：
- `nodemailer`：SMTP 邮件发送
- `node-telegram-bot-api`：Telegram Bot API

**配置管理**：
- 敏感信息加密存储（参考 ADR-0003）
- 配置验证和测试功能
- 错误处理和用户提示

**投递状态追踪**：
- 数据库记录投递状态
- 状态页实时显示
- 失败重试和恢复机制