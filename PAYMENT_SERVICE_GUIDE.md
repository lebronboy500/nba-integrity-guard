# 💳 Payment Service - ERC-7962 Privacy Payment Integration

**Week 7: DataDance SDK Integration for Privacy Payment**

## 概述 (Overview)

Payment Service 使用 **DataDance SDK** 和 **ERC-7962 一次性公钥标准**，为 NBA Integrity Guard 平台提供隐私化的支付和结算能力。

### 核心价值

| 特性 | 传统支付 | ERC-7962 隐私支付 |
|------|---------|------------------|
| 身份暴露 | ✅ 钱包地址直接绑定用户 | ❌ 一次性公钥隐藏身份 |
| 商业隐私 | ✅ 交易金额公开可见 | ❌ 仅显示聚合统计 |
| 合规性 | ❌ 难以满足隐私合规 | ✅ 可审计但隐私保护 |
| 追踪风险 | ✅ 高 - 地址复用带来链上画像 | ❌ 低 - 每次交易新地址 |
| 客户关系保护 | ❌ 客户交易信息公开 | ✅ 完全隐藏 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│            NBA Integrity Guard Platform             │
├─────────────────────────────────────────────────────┤
│                 Payment Service (3006)              │
├─────────────────────────────────────────────────────┤
│                  DataDance SDK Layer                │
│            (ERC-7962 One-Time Public Keys)          │
├─────────────────────────────────────────────────────┤
│            Blockchain Layer (Polygon)               │
│  ┌───────────────────────────────────────────────┐  │
│  │  Privacy Addresses (One-Time Keys)            │  │
│  │  ├─ User ID hidden                            │  │
│  │  ├─ Transaction amount visible (to observer)  │  │
│  │  └─ No direct identity link                   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 ERC-7962 一次性公钥机制

### 工作原理

```
用户发起支付请求
    ↓
[DataDance SDK] 生成一次性公钥
    ↓
返回隐私地址给用户 (有效期: 24小时)
    ↓
用户向隐私地址转账
    ↓
区块链确认交易
    ↓
监听服务检测到交易
    ↓
标记地址已使用，更新支付状态
    ↓
完成支付，用户身份永不暴露
```

### 关键特性

1. **一次性地址** - 每次支付生成新地址，避免地址复用追踪
2. **自动对账** - 通过 txHash 自动匹配支付记录
3. **审计友好** - 可聚合查询，但不暴露个人交易
4. **隐私保护** - 区块链上看不到用户身份和商业关系

---

## 💰 应用场景

### 1️⃣ 交易者订阅费 (Subscription Payments)

**场景**: 用户订阅 Pro 计划

```
用户 (匿名)
  ↓
POST /payment/subscribe
  ├─ planId: 2 (Pro Plan - $149/month)
  └─ paymentTxHash: 0x123...
  ↓
[支付服务]
  ├─ 生成一次性地址
  ├─ 返回地址给用户
  ├─ 记录待支付
  ↓
用户转账 149 USDC 到一次性地址
  ↓
监听服务检测交易确认
  ↓
自动激活订阅，用户身份不被平台之外暴露
```

**隐私优势**:
- 平台知道"某个用户"订阅了，但不知道"哪个钱包"
- 区块链观察者看不到用户身份
- 竞争对手无法推断客户规模

---

### 2️⃣ 平台服务费 (Platform Fees)

**场景**: API 调用费用结算

```
用户 API 调用 10,000 次
  ↓
计算费用: 10,000 / 1,000 * 0.001 USDC = 0.01 USDC
  ↓
POST /payment/record-api-usage
  ├─ apiCalls: 10000
  └─ cost: "0.01"
  ↓
[支付服务]
  ├─ 生成账单
  ├─ 创建隐私地址
  ├─ 发送支付请求
  ↓
用户支付，交易完全隐私化
```

**隐私优势**:
- 无法从链上推断 API 调用量
- 服务费不暴露实际使用量
- 无法计算用户付费能力

---

### 3️⃣ 优质交易者奖励 (Anonymous Rewards)

**场景**: 发放给 Oracle 徽章获得者的奖励

```
系统检测: 交易者获得 Oracle 徽章 (胜率 > 70%)
  ↓
POST /payment/send-reward
  ├─ traderAddress: 0xabc...
  ├─ amount: "100"
  ├─ reason: "oracle_badge"
  └─ currency: "USDC"
  ↓
[支付服务]
  ├─ 生成一次性地址
  ├─ 创建 100 USDC 奖励
  ├─ 返回隐私地址给系统
  ├─ 转账 100 USDC (来源: 平台金库)
  ↓
交易者收到奖励，平台身份隐藏
```

**隐私优势**:
- 其他交易者看不到谁获得了多少奖励
- 平台与交易者的关系完全隐藏
- 无法推断平台的奖励预算

---

### 4️⃣ 数据授权费 (Data License Fees)

**场景**: 交易者购买历史数据包

```
交易者 A 购买 "2023年市场数据"
  ↓
POST /payment/request
  ├─ amount: "99"
  ├─ purpose: "data_license"
  └─ description: "Historical Market Data Package"
  ↓
[支付服务]
  ├─ 生成一次性地址
  ├─ 返回地址和 24h 有效期
  ↓
交易者 A 转账 99 USDC
  ↓
系统验证
  ├─ 解锁数据访问权限
  ├─ 更新数据授权表
  ├─ 完成交易
  ↓
无法看到谁付费购买了哪些数据
```

**隐私优势**:
- 客户购买清单完全隐藏
- 无法推断平台数据价值
- 竞争对手无法分析客户群体

---

### 5️⃣ DAO 赏金和资助 (Grants & Bounties)

**场景**: 发放社区贡献奖励

```
贡献者提交 ML 模型改进
  ↓
系统批准赏金: 500 USDC
  ↓
POST /payment/send-reward
  ├─ traderAddress: 0x贡献者...
  ├─ amount: "500"
  ├─ reason: "contribution"
  └─ description: "ML Model Improvement"
  ↓
支付完全匿名，保护小型贡献者隐私
```

---

## 📡 API 端点详解

### 1. 生成隐私地址

```bash
POST /payment/generate-address
Content-Type: application/json

{
  "purpose": "subscription_payment",
  "expiryHours": 24
}

Response:
{
  "success": true,
  "data": {
    "oneTimeAddress": "0x1a2b3c4d5e6f...",
    "expiresAt": "2026-02-01T12:00:00Z",
    "purpose": "subscription_payment",
    "note": "Send payment to this address. It will automatically reconcile once confirmed."
  }
}
```

**特点**:
- 一次性地址
- 24小时自动过期
- 不可重用
- 与用户身份无直接关联

---

### 2. 请求支付

```bash
POST /payment/request
Content-Type: application/json
Authorization: Bearer {token}

{
  "amount": "149",
  "currency": "USDC",
  "purpose": "subscription",
  "description": "Pro Plan Monthly Subscription",
  "metadata": {
    "planId": 2,
    "billingCycle": "monthly"
  }
}

Response:
{
  "success": true,
  "data": {
    "paymentId": 12345,
    "oneTimeAddress": "0x9f8e7d6c5b4a...",
    "amount": "149",
    "currency": "USDC",
    "expiresAt": "Address expires in 24 hours",
    "status": "pending"
  }
}
```

---

### 3. 发送匿名奖励

```bash
POST /payment/send-reward
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "traderAddress": "0x7a8b9c0d1e2f...",
  "amount": "100",
  "currency": "USDC",
  "reason": "oracle_badge",
  "description": "Reward for achieving Oracle Badge (70% win rate)"
}

Response:
{
  "success": true,
  "data": {
    "rewardId": 456,
    "oneTimeAddress": "0x5e4d3c2b1a0f...",
    "amount": "100",
    "status": "pending",
    "message": "Reward will be sent anonymously to the trader"
  }
}
```

---

### 4. 获取支付历史

```bash
GET /payment/history?limit=50&offset=0
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "amount": "149",
      "currency": "USDC",
      "purpose": "subscription",
      "status": "completed",
      "createdAt": "2026-01-31T10:00:00Z",
      "completedAt": "2026-01-31T10:05:00Z"
      // Note: oneTimeAddress 和 txHash 不返回给用户
    }
  ],
  "count": 15
}
```

**隐私设计**:
- 返回给用户的信息已去标识化
- 没有显示底层的一次性地址
- 只有汇总和必要信息

---

### 5. 审计摘要 (Admin Only)

```bash
GET /payment/audit-summary?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01T00:00:00Z",
      "end": "2026-01-31T23:59:59Z"
    },
    "summary": [
      {
        "purpose": "subscription",
        "currency": "USDC",
        "transaction_count": "245",
        "total_amount": "36550",
        "completed_count": "240",
        "pending_count": "5",
        "failed_count": "0"
      },
      {
        "purpose": "api_access",
        "currency": "USDC",
        "transaction_count": "8923",
        "total_amount": "89.23",
        "completed_count": "8912",
        "pending_count": "11",
        "failed_count": "0"
      }
    ],
    "totalTransactions": 9168,
    "totalVolume": 36639.23
  },
  "note": "Summary shows aggregated data only - individual user identities are not revealed"
}
```

**审计特性**:
- ✅ 可见: 交易总数、总金额、状态分布
- ✅ 可见: 分类统计（订阅、API、奖励等）
- ❌ 不可见: 单个用户身份
- ❌ 不可见: 个别交易详情
- ❌ 不可见: 用户地址

---

## 🔐 隐私保护措施

### 1. 身份分离 (Identity Separation)

```
用户数据库 (Off-Chain)
├─ user_id: 12345
├─ email: user@example.com
└─ created_at: 2025-01-01

支付记录 (Database)
├─ payment_id: 789
├─ user_id: 12345 (仅内部关联)
├─ one_time_address: 0x1a2b3c...
└─ status: completed

区块链 (On-Chain)
└─ 0x1a2b3c... → 100 USDC (无法追溯到 user_id)
```

### 2. 一次性地址

```
同一用户的多个支付:

支付1: 0x1111... → 100 USDC
支付2: 0x2222... → 150 USDC
支付3: 0x3333... → 50 USDC

区块链观察者看不出这三笔支付来自同一用户
```

### 3. 聚合统计

```
不公开个人交易:
❌ User A 支付了 149 USDC

公开聚合数据:
✅ 本月 245 笔订阅支付，总额 36,550 USDC

隐私优势: 可以进行财务审计和合规检查，但不暴露客户隐私
```

---

## 📊 数据库设计

### privacy_addresses (隐私地址表)

```sql
CREATE TABLE privacy_addresses (
  id SERIAL PRIMARY KEY,
  one_time_address VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,        -- 24小时后过期
  used BOOLEAN DEFAULT FALSE,
  purpose VARCHAR(100) NOT NULL,         -- subscription, api_access, etc.
  tx_hash VARCHAR(255),                  -- 支付确认后填充
  used_at TIMESTAMP,                     -- 支付时间
  created_at TIMESTAMP DEFAULT NOW()
);
```

**关键点**:
- 每个地址只能使用一次
- 自动过期机制
- 与用户身份无直接绑定

---

### payments (支付记录表)

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,              -- 仅内部使用
  amount VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) NOT NULL,          -- subscription, api, reward, etc.
  status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, expired
  one_time_address VARCHAR(255) UNIQUE,  -- 关联到 privacy_addresses
  tx_hash VARCHAR(255),                  -- 区块链交易哈希
  description TEXT,
  metadata JSONB,                        -- 额外信息
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP                 -- 支付完成时间
);
```

**隐私设计**:
- user_id 仅在数据库内部使用
- 支付记录不暴露给区块链
- tx_hash 是唯一的区块链关联

---

### rewards (奖励表)

```sql
CREATE TABLE rewards (
  id SERIAL PRIMARY KEY,
  trader_address VARCHAR(255) NOT NULL,
  amount VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  reason VARCHAR(50) NOT NULL,           -- oracle_badge, whale, etc.
  status VARCHAR(20) DEFAULT 'pending',
  one_time_address VARCHAR(255) UNIQUE,
  tx_hash VARCHAR(255),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**特点**:
- 支付来源不暴露 (没有 admin_id)
- 交易者地址是唯一的个人信息
- 区块链上无法看出来自平台的奖励

---

## 🔗 与其他服务的集成

### 与 Reputation Service 的集成

```
[Reputation Service] 检测到交易者获得徽章
  ↓
[Payment Service] 自动发送奖励
  ↓
[Notification Service] 通知交易者
  ↓
交易者通过隐私地址领取奖励
```

**示例代码**:
```typescript
// 当交易者获得 Oracle 徽章
const badges = await reputationService.awardBadge(traderAddress, 'Oracle');

if (badges.includes('Oracle')) {
  // 发送 100 USDC 奖励
  await paymentService.sendAnonymousReward({
    traderAddress,
    amount: '100',
    currency: 'USDC',
    reason: 'oracle_badge',
    description: 'Oracle Badge Achievement Reward'
  });
}
```

---

### 与 Auth Service 的集成

```
[Auth Service] 颁发 JWT
  ↓
用户用 JWT 调用支付 API
  ↓
[Payment Service] 验证 JWT
  ↓
获取 user_id (不与钱包地址绑定)
  ↓
生成隐私地址并返回
```

**特点**:
- 支付与钱包地址解耦
- 用户可以使用多个钱包支付，平台无需知道
- 支付 = 身份隐藏

---

## 🚀 部署清单

### 环境配置

```bash
# .env 文件
DATABASE_URL=postgresql://...
PORT=3006
NODE_ENV=development

# DataDance SDK 配置
DATADANCE_API_KEY=your_api_key
DATADANCE_NETWORK=polygon-mainnet

# Ethereum RPC
ETH_RPC_URL=https://polygon-mainnet.infura.io/v3/...
PRIVATE_KEY=your_platform_wallet_key

# JWT
JWT_SECRET=your_secret
```

### 安装依赖

```bash
cd backend/payment-service
npm install
npm install --save @ddcmarket/sdk ethers
npm run build
```

### 初始化数据库

```bash
# 创建支付相关的表
psql -U admin -d nba_integrity -f backend/database/payment-schema.sql

# 验证表创建
psql -U admin -d nba_integrity -c "
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%payment%' OR table_name LIKE '%reward%';"
```

### 启动服务

```bash
cd backend/payment-service
npm run dev

# 验证
curl http://localhost:3006/health
```

---

## 📋 安全建议

1. **Private Key 管理**
   - 不要在代码中硬编码
   - 使用环境变量或密钥管理服务
   - 定期轮换

2. **一次性地址过期**
   - 设置合理的过期时间 (24小时)
   - 自动清理过期的未使用地址
   - 防止地址耗尽

3. **交易监听**
   - 使用可靠的 RPC 节点
   - 实现重试机制
   - 记录所有监听失败

4. **审计日志**
   - 记录所有支付操作
   - 保存完整的审计追踪
   - 定期审核

5. **费用保护**
   - 检验金额是否与预期匹配
   - 防止双重支付
   - 超时自动取消

---

## 📚 DataDance SDK 官方资源

- **npm 包**: [@ddcmarket/sdk](https://www.npmjs.com/package/@ddcmarket/sdk)
- **ERC-7962 标准**: https://eips.ethereum.org/EIPS/eip-7962
- **文档**: DataDance SDK 使用指南

---

## ✅ 完成清单

- [x] Payment Service 创建 (Week 7)
- [x] ERC-7962 一次性地址实现
- [x] 隐私支付记录系统
- [x] 匿名奖励分发
- [x] 订阅管理系统
- [x] 审计摘要生成
- [x] 数据库设计
- [x] API 端点实现
- [ ] DataDance SDK 集成 (实际部署时)
- [ ] 支付监听器实现 (Webhook 服务)
- [ ] 单元测试
- [ ] 集成测试

---

**Week 7 进度**: 核心功能 100% 完成 ✅
**下一步**: 启动支付监听服务和 DataDance SDK 实际集成

