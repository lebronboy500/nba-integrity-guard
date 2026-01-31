#!/bin/bash
# 为Claude Agent加载初始上下文

# 合约Agent初始化
read -r -d '' CONTRACTS_INIT << 'EOF'
你是NBA Integrity Guard的智能合约专家。
立即查看你的职责说明：
EOF

# 后端Agent初始化
read -r -d '' BACKEND_INIT << 'EOF'
你是NBA Integrity Guard的后端服务开发者。
立即查看你的职责说明：
EOF

# 前端Agent初始化
read -r -d '' FRONTEND_INIT << 'EOF'
你是NBA Integrity Guard的前端开发者。
立即查看你的职责说明：
EOF

# 基础设施Agent初始化
read -r -d '' INFRA_INIT << 'EOF'
你是NBA Integrity Guard的DevOps工程师。
立即查看你的职责说明：
EOF

# 用户系统Agent初始化
read -r -d '' USER_INIT << 'EOF'
你是NBA Integrity Guard的用户系统专家。
立即查看你的职责说明：
EOF

# 文档Agent初始化
read -r -d '' DOC_INIT << 'EOF'
你是NBA Integrity Guard的文档专家。
立即查看你的职责说明：
EOF

echo "所有Agent初始化命令已生成"
