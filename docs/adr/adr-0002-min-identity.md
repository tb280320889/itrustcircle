# ADR-0002：最小身份与配对机制（Tower ↔ Sentinel）

## 状态

待定

## 背景

PRD 要求 Sentinel 需要绑定 Tower 才能上报 AlertEvent，Tower 需要识别不同 Sentinel 的来源。但 MVP 不能引入复杂账号体系，需要最小化的身份与配对机制。

## 决策（待定）

### 候选方案

**方案 A：二维码 + 简单 Token（推荐）**
```
Tower 生成包含以下信息的二维码：
- tower_id: UUID（Tower 设备唯一标识）
- endpoint: HTTP 端点 URL（局域网或公网）
- token: 短期有效认证令牌（32位随机字符）
- expires: 令牌过期时间（24小时）
```

**方案 B：本地发现 + 手动确认**
- Tower 在局域网广播服务发现
- Sentinel 扫描并手动选择 Tower
- 通过简单的 PIN 码确认配对

**方案 C：共享密钥 + 设备指纹**
- 用户手动在 Tower 和 Sentinel 间共享密钥
- 基于设备指纹建立信任关系

### 推荐方案 A 的详细设计

```json
// 二维码内容示例
{
  "tower_id": "550e8400-e29b-41d4-a716-446655440000",
  "endpoint": "http://192.168.1.100:5173/api/alerts",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expires": 1708156800,
  "version": "1.0"
}
```

**Sentinel 端存储**：
```typescript
interface TowerBinding {
  tower_id: string;
  endpoint: string;
  token: string;
  profile_id: string;  // child/elder/pet/custom
  created_at: number;
  last_contact?: number;
}
```

**Tower 端验证**：
```typescript
// 接收 AlertEvent 时的验证
const validateSentinel = (event: AlertEvent, token: string) => {
  // 验证 token 是否有效且未过期
  const binding = getBindingByToken(token);
  if (!binding || binding.expires < Date.now()) {
    throw new Error('Invalid or expired token');
  }
  
  // 记录 Sentinel 信息
  event.sentinel_id = binding.sentinel_id;
  event.tower_id = binding.tower_id;
};
```

## 影响分析

### 方案 A 优势
- 用户操作简单：扫码即可配对
- 安全性适中：Token 时效性 + HTTPS 传输
- 支持远程配对：可通过图片分享二维码

### 方案 A 风险
- 网络依赖：需要 Tower 可达（局域网或公网）
- Token 管理：需要处理过期和重新配对

## 关键问题待解决

1. **网络可达性**：ADR-0003 需要明确 Tower 端点暴露策略
2. **Token 持久化**：Sentinel 重装后如何恢复配对关系
3. **多 Sentinel 支持**：Tower 如何管理多个 Sentinel 配对
4. **配对解绑**：用户如何取消或更改配对关系

## 验证方式（可执行）

1. **配对流程验证**：
   - Tower 生成配对二维码 → 包含必需字段
   - Sentinel 扫码配对 → 成功建立绑定关系
   - Sentinel 触发事件 → Tower 正确识别来源

2. **安全验证**：
   - 过期 Token 被拒绝
   - 错误 Token 被拒绝
   - Token 泄露后的风险可控制（时效性）

3. **Failure Modes 覆盖**：
   - FM-U3（配置不完整）：未配对时明确提示
   - FM-D1（状态不一致）：配对状态本地持久化
   - FM-N1（网络失败）：配对失败重试机制

4. **Journey 对应验证**：
   - Tower C1（首次配置）：二维码生成功能
   - Sentinel C1（绑定）：扫码配对功能
   - Journey F 章节：配对成功后的验收点

## 后续依赖

- **ADR-0003**：Tower 网络可达性决策影响 endpoint 格式
- **ADR-0004**：AlertEvent 需包含 sentinel_id 和 tower_id
- **ADR-0008**：重复配对的去重策略