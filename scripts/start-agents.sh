#!/bin/bash
# NBA Integrity Guard - Multi-Agent Tmux Setup

SESSION_NAME="nba-agents"
PROJECT_DIR="/mnt/d/lebron/cc项目/1/nba-integrity-guard"

# 创建新会话
tmux new-session -d -s $SESSION_NAME -n "Coordinator"

# 窗口0: Coordinator Agent
tmux send-keys -t $SESSION_NAME:0 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:0 "echo '=== 主 Agent - Coordinator ===' && cat .agents/COORDINATOR_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:0 "claude" C-m

# 窗口1: Contracts Agent
tmux new-window -t $SESSION_NAME:1 -n "Contracts"
tmux send-keys -t $SESSION_NAME:1 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:1 "echo '=== 合约 Agent ===' && cat .agents/CONTRACTS_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:1 "claude" C-m

# 窗口2: Backend Agent
tmux new-window -t $SESSION_NAME:2 -n "Backend"
tmux send-keys -t $SESSION_NAME:2 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:2 "echo '=== 后端 Agent ===' && cat .agents/BACKEND_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:2 "claude" C-m

# 窗口3: Frontend Agent
tmux new-window -t $SESSION_NAME:3 -n "Frontend"
tmux send-keys -t $SESSION_NAME:3 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:3 "echo '=== 前端 Agent ===' && cat .agents/FRONTEND_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:3 "claude" C-m

# 窗口4: Infrastructure Agent
tmux new-window -t $SESSION_NAME:4 -n "Infrastructure"
tmux send-keys -t $SESSION_NAME:4 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:4 "echo '=== 基础设施 Agent ===' && cat .agents/INFRASTRUCTURE_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:4 "claude" C-m

# 窗口5: User System Agent
tmux new-window -t $SESSION_NAME:5 -n "UserSystem"
tmux send-keys -t $SESSION_NAME:5 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:5 "echo '=== 用户系统 Agent ===' && cat .agents/USER_SYSTEM_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:5 "claude" C-m

# 窗口6: Documentation Agent
tmux new-window -t $SESSION_NAME:6 -n "Documentation"
tmux send-keys -t $SESSION_NAME:6 "cd $PROJECT_DIR" C-m
tmux send-keys -t $SESSION_NAME:6 "echo '=== 文档 Agent ===' && cat .agents/DOCUMENTATION_AGENT.md | head -20" C-m
tmux send-keys -t $SESSION_NAME:6 "claude" C-m

# 返回Coordinator窗口
tmux select-window -t $SESSION_NAME:0

# 附加到会话
tmux attach-session -t $SESSION_NAME
