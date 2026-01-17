# ADR-0007：Contact 参与方式（无 App 的通知接收者）

## 状态

待定

## 背景

PRD 定义 Contact 为紧急联系人，负责接收通知并采取行动。Contact 角色的特点是**无需独立应用**，通过现有的通讯渠道（Email/IM/SMS）接收信息并响应。

## 决策（待定）

### Contact 角色设计原则

**零安装要求**：
- Contact 不需要下载、安装、注册任何应用
- 使用现有通讯工具：Email、Telegram、SMS、微信等
- 降低参与门槛，提高紧急情况下的响应效率

**信息驱动**：
- Contact 的所有行动基于收到的信息内容
- 信息必须包含：时间、地点、人物、事件、建议动作
- 提供明确的行动指引和联系方式

**单向通知为主**：
- MVP 聚焦：Tower → Contact 的单向通知
- 不实现复杂的双向交互或状态同步
- Contact 的反馈通过现有通讯渠道回传

### Contact 参与流程设计

**标准参与流程**：
```
1. Tower 配置 Contact 信息（邮箱/手机/Telegram ID）
2. Sentinel 触发 AlertEvent
3. Tower 接收并分析事件
4. Tower 生成通知内容
5. Tower 通过配置的通道发送给 Contact
6. Contact 收到通知并按指引行动
```

**信息内容设计**：
```typescript
interface ContactNotification {
  // 核心信息（MVP）
  timestamp: string;           // 事件发生时间
  profile_name: string;        // 关联对象（如"小明"、"奶奶"）
  trigger_reason: string;       // 触发原因（如"BLE设备断联"）
  device_name: string;          // BLE设备名称
  location?: {                  // 位置信息（可选）
    latitude: number;
    longitude: number;
    map_link: string;
  };
  
  // 行动指引
  suggested_actions: string[];  // 建议行动清单
  emergency_contacts: string[]; // 其他紧急联系人
  
  // 元信息
  tower_info: string;          // Tower 设备信息
  event_id: string;            // 事件唯一标识
}
```

**邮件通知模板**：
```html
<h2>🚨 iTrustCircle 紧急警报</h2>

<p><strong>收到紧急警报，请立即确认安全情况！</strong></p>

<table>
  <tr><td>📅 时间：</td><td>{{timestamp}}</td></tr>
  <tr><td>👤 对象：</td><td>{{profile_name}}</td></tr>
  <tr><td>🔴 原因：</td><td>{{trigger_reason}}</td></tr>
  <tr><td>📱 设备：</td><td>{{device_name}}</td></tr>
  {{#if location}}
  <tr><td>📍 位置：</td><td><a href="{{location.map_link}}">查看地图</a></td></tr>
  {{/if}}
</table>

<h3>🎯 建议行动：</h3>
<ol>
  <li>立即电话联系当事人确认安全</li>
  {{#if location}}
  <li>如无法联系，前往 <a href="{{location.map_link}}">最后位置</a> 查看</li>
  {{/if}}
  <li>联系其他协助者：{{emergency_contacts}}</li>
</ol>

<hr>
<p><small>事件ID: {{event_id}} | 来自 Tower: {{tower_info}}</small></p>
```

### 多通道适配策略

**Email 通道**（必需）：
- 支持丰富内容：HTML 格式、地图链接、附件
- 正式可靠：适合作为主要通知渠道
- 存档方便：邮件可作为正式记录

**Telegram 通道**（可选）：
- 即时推送：手机通知体验好
- 简洁格式：适合快速查看和响应
- 群组支持：可通知多个协助者

**SMS 通道**（未来）：
- 强触达：无需网络，到达率高
- 简洁限制：字符数有限，适合关键信息
- 成本考虑：需要付费短信服务

### Contact 反馈机制

**简单反馈**：
- 通过回复邮件或消息确认收到
- 电话联系 Tower 设备持有人
- 在群组中回复状态更新

**复杂反馈**（v1.1+）：
- Web 表单：点击邮件中的链接更新状态
- 简单命令：通过 Telegram Bot 发送指令
- 状态同步：更新 Tower 端的事件状态

## 影响分析

### 优势
- **低门槛**：Contact 无需学习新应用
- **可靠性**：基于成熟稳定的通讯基础设施
- **扩展性**：可支持多种通讯渠道
- **兼容性**：适合不同技术水平的用户

### 限制
- **单向性**：难以实现复杂的状态同步
- **依赖性**：依赖第三方服务的可靠性
- **格式限制**：不同渠道的内容格式差异较大

## 关键问题待解决

1. **多通道一致性**：
   - 如何保证不同渠道收到的信息一致
   - 重复通知的处理和去重

2. **投递确认**：
   - 如何确认 Contact 收到通知
   - 投递失败的重试和备用策略

3. **隐私保护**：
   - 位置信息的安全传输
   - Contact 信息的管理和权限控制

4. **紧急程度分级**：
   - 不同类型事件的通知优先级
   - 避免误报导致的疲劳效应

## 验证方式（可执行）

1. **通知接收验证**：
   - Tower 配置 Email → Contact 收到邮件通知
   - Tower 配置 Telegram → Contact 收到消息通知
   - 通知内容完整 → 包含所有必需字段

2. **信息完整性验证**：
   - 地点信息正确 → 地图链接可点击且位置准确
   - 时间信息准确 → 时区和格式正确
   - 建议动作清晰 → 用户能理解和执行

3. **多角色场景验证**：
   - 多个 Contact 同时收到通知 → 信息一致性
   - 不同渠道的通知适配 → 格式正确渲染
   - 部分渠道失败 → 备用渠道正常工作

4. **Failure Modes 覆盖**：
   - FM-E1（邮件延迟）：提供白名单设置建议
   - FM-E2（位置缺失）：明确的降级提示
   - FM-D1（重复通知）：去重机制生效

5. **Journey 对应验证**：
   - Contact C1（接收通知）：信息内容完整性
   - Contact C2（关键步骤）：行动指引有效性
   - F1.1 验收点：邮件模板包含最小字段
   - F1.2 验收点：地图链接可用性
   - F1.3 验收点：缺失信息的降级提示

## 技术实现

**模板引擎**：
- Handlebars.js：动态生成通知内容
- 多语言支持：i18n 模板管理

**渠道适配器**：
- Email 适配器：HTML/纯文本生成
- Telegram 适配器：Markdown 格式化
- SMS 适配器：字符限制和分段

**配置管理**：
- Contact 信息安全存储
- 通道配置验证和测试
- 投递状态追踪和报告