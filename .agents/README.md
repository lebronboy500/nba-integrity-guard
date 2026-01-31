# Multi-Agent 架构使用指南

本目录包含 NBA Integrity Guard 项目的所有 Agent 对话框文档。

---

## 📚 Agent 列表

### 主 Agent
- **COORDINATOR_AGENT.md** - 项目协调员
  - 整体规划与管理
  - 任务分配与协调
  - 版本发布

### 子 Agents

1. **CONTRACTS_AGENT.md** - 智能合约专家
   - Solidity 开发
   - 合约测试与部署
   - 安全审计

2. **BACKEND_AGENT.md** - 后端服务
   - API 开发
   - 业务逻辑
   - 数据处理

3. **FRONTEND_AGENT.md** - 前端开发
   - React UI 开发
   - 实时更新
   - 用户体验

4. **INFRASTRUCTURE_AGENT.md** - 基础设施
   - Docker & K8s
   - 数据库管理
   - 部署配置

5. **USER_SYSTEM_AGENT.md** - 用户系统
   - 认证授权
   - Web3 集成
   - 信誉管理

6. **DOCUMENTATION_AGENT.md** - 文档专家
   - 文档编写
   - 知识管理
   - 教程创作

---

## 🚀 如何使用

### 方法1: 直接启动 Agent

```bash
# 启动主协调员
claude --coordinator

# 启动子Agent
claude --contracts
claude --backend
claude --frontend
claude --infrastructure
claude --user-system
claude --documentation
```

### 方法2: 使用 Agent 命令

```bash
# 在对话中调用Agent
/agent:coordinator "分析项目状态"
/agent:contracts "部署ReputationSystem"
/agent:backend "实现 /reputation API"
/agent:frontend "创建信誉分数组件"
/agent:infrastructure "执行数据库迁移"
/agent:user-system "实现Web3登录"
/agent:documentation "更新API文档"
```

### 方法3: 在文件中引用

当你启动Claude时，告诉它读取对应的Agent文档：

```
"我想作为后端Agent工作，请读取 .agents/BACKEND_AGENT.md"
```

---

## 📋 Agent 职责速查

| Agent | 主要职责 | 管理目录 | 关键技能 |
|-------|---------|---------|---------|
| Coordinator | 整体协调 | 项目根目录 | 规划、管理 |
| Contracts | 智能合约 | contracts/ | Solidity, Hardhat |
| Backend | 后端服务 | backend/ | Node.js, TypeScript |
| Frontend | Web界面 | frontend-web/ | React, TailwindCSS |
| Infrastructure | 基础设施 | docker-compose, k8s/ | Docker, PostgreSQL |
| User System | 用户系统 | backend/auth-service/ | JWT, Web3 |
| Documentation | 文档管理 | *.md, docs/ | Markdown, 写作 |

---

## 🔄 Agent 交互示例

### 场景1: 新功能开发

```
用户: "我想添加用户信誉排行榜功能"

Coordinator → Backend: "实现 /reputation/leaderboard API"
Backend → Contracts: "需要 getLeaderboard 合约接口"
Contracts: "接口已存在，ABI已提供"
Backend: "API已实现"

Coordinator → Frontend: "创建排行榜组件"
Frontend: "组件已完成，需要测试数据"

Coordinator → Infrastructure: "添加测试数据"
Infrastructure: "已插入10条测试数据"

Coordinator → Documentation: "更新文档"
Documentation: "API文档和用户指南已更新"

Coordinator → 用户: "功能已完成，可以测试"
```

### 场景2: Bug 修复

```
用户: "合约部署失败"

Coordinator → Contracts: "诊断部署问题"
Contracts: "发现Gas不足，需要增加限制"
Contracts: "已修复并重新部署"

Coordinator → Documentation: "更新部署文档"
Documentation: "已添加Gas配置说明"

Coordinator → 用户: "问题已解决"
```

---

## 🎯 最佳实践

### 1. 明确角色
启动Agent前，明确说明角色：
```
"我现在是合约Agent，专注于智能合约开发"
```

### 2. 查阅文档
每个Agent都有详细的职责说明和任务清单，先读文档再工作。

### 3. 跨Agent协作
需要其他Agent时，通过主Agent协调：
```
Contracts: "/agent:coordinator 需要后端更新ABI"
Coordinator: "/agent:backend 合约ABI已更新"
```

### 4. 保持专注
每个Agent只处理自己职责范围内的工作。

### 5. 文档同步
每次重要变更后，通知文档Agent更新。

---

## 📖 Agent 文档结构

每个Agent文档包含：

1. **身份定位** - 角色和职责
2. **工作范围** - 管理的文件和服务
3. **核心职责** - 主要任务
4. **技术栈** - 使用的技术
5. **当前状态** - 已完成和待办
6. **协作方式** - 与其他Agent交互
7. **参考资料** - 学习资源

---

## 🔧 自定义 Agent

如果需要新的Agent：

1. 复制模板文件
2. 修改角色和职责
3. 定义管理范围
4. 列出技术栈
5. 添加到主架构文档

---

## 📞 获取帮助

- **查看架构**: 阅读 `MULTI_AGENT_ARCHITECTURE.md`
- **项目指南**: 阅读 `CLAUDE.md`
- **技术文档**: 阅读 `ONCHAIN_VALIDATION_INCENTIVES.md`

---

**创建时间**: 2025-01-30
**版本**: v1.0
**维护者**: Coordinator Agent
