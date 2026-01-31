# NBA Integrity Guard - Frontend Design

## 📋 Overview

现代化的Web3体育赛事诚信监控Dashboard，参照neutral.trade风格设计，使用React 18 + TypeScript + TailwindCSS。

## 🎨 Design Features

### 深色主题 (Dark Theme)
- 黑色背景 (`bg-black`)
- 白色文字 (`text-white`)
- 淡紫色/靛蓝色强调色
- 玻璃态效果 (`backdrop-blur-xl`)
- 网格背景图案 (1px点阵)
- 环境光晕动画效果

### 响应式设计
- 移动优先 (Mobile-first)
- 平板适配 (md 断点)
- 桌面优化 (lg 断点)
- 灵活的网格系统

## 📁 Project Structure

```
frontend-web/
├── components/
│   ├── Navigation.tsx          # 导航栏 (5-page nav)
│   ├── GlassCard.tsx          # 玻璃态卡片
│   ├── Header.tsx             # 原有页头
│   ├── LiveFeed.tsx           # 实时信号流
│   ├── MainAnalysis.tsx       # 分析面板
│   ├── ExecutionLog.tsx       # 执行日志
│   └── VisualEffects.tsx      # 视觉效果
│
├── pages/
│   ├── Dashboard.tsx          # 📊 实时监控主页
│   ├── Strategies.tsx         # 🎯 对冲策略市场
│   ├── Portfolio.tsx          # 💼 投资组合
│   ├── Reputation.tsx         # ⭐ 声誉系统
│   └── Analytics.tsx          # 📈 数据分析
│
├── context/
│   └── SimulationContext.ts   # 全局状态管理
│
├── NewApp.tsx                 # 新主应用组件
├── App.tsx                    # 原有App (可删除)
├── index-new.tsx              # 新入口点
├── index.tsx                  # 原有入口
├── index.css                  # 全局样式
├── types.ts                   # TypeScript 类型定义
├── vite.config.ts             # Vite 配置
├── package.json               # 依赖管理
└── tsconfig.json              # TypeScript 配置
```

## 🎯 Pages Overview

### 1. Dashboard (`/dashboard`)
**目的**: 实时监控和信号展示

**核心组件**:
- 4个统计卡片 (总交易、总利润、胜率、活跃信号)
- 活跃信号列表 (HIGH/MEDIUM/LOW 风险标识)
- 每个信号显示:
  - 风险等级 (带颜色标识)
  - Rigging Index
  - Anomaly Score
  - 执行对冲按钮
- 最近交易列表 (placeholder)

**实时更新**: WebSocket 连接API以获取最新信号

---

### 2. Strategies (`/strategies`)
**目的**: 对冲策略市场展示

**特性**:
- 风险级别筛选 (ALL/HIGH/MEDIUM/LOW)
- 5个预设策略卡片:
  - **High-Risk Hedge (Aggressive)**: 245.5% APY
  - **Medium-Risk Hedge (Balanced)**: 145.2% APY
  - **Low-Risk Hedge (Conservative)**: 52.3% APY
  - **Social Sentiment Arb**: 132.4% APY
  - **Liquidity Drainage**: 198.6% APY

**每个策略卡片显示**:
- 策略名称和ID
- 风险等级 (彩色标签)
- 描述信息
- 关键指标 (APY, TVL, Win Rate)
- 参数配置 (阈值, 杠杆率等)
- "View Details" 和 "Invest Now" 按钮

---

### 3. Portfolio (`/portfolio`)
**目的**: 用户投资组合和收益追踪

**实现**: 目前是框架，显示:
- 总投入: $125,400
- 当前价值: $156,840 (+25.2%)
- YTD 收益: +$31,440 (APY: 125.3%)
- Placeholder for 策略分配表

**后续开发**:
- 投资组合饼图
- 按策略的收益分解
- 历史收益曲线
- 提取/增加投资功能

---

### 4. Reputation (`/reputation`)
**目的**: 声誉系统和排行榜

**用户声誉卡片**:
- 用户分数 (0-100): 模拟为78分
- 徽章级别 (Oracle/Master/Expert/Trader/Novice)
- 进度条到下一个等级
- 奖励倍数 (≥70分: 1.5x)

**评分标准** (3个维度):
1. **Prediction Accuracy (40%)**: 预测准确率
2. **Trading Volume (30%)**: 交易规模 (最小$10k)
3. **Community Trust (30%)**: 社区投票和验证

**排行榜** (Top 5):
- 排名 #1-5
- 钱包地址 (缩写)
- 分数 (彩色显示)
- 预测总数
- 准确率
- 交易量
- 奖励倍数

---

### 5. Analytics (`/analytics`)
**目的**: 数据分析和研究

**三个分析区域** (目前是placeholder):
1. **Signal Performance**: 信号准确度和历史胜率
2. **Market Trends**: Polymarket 实时数据和流动性分析
3. **Backtesting**: 针对历史数据 (2023-2024) 的策略测试

**后续功能**:
- 交互式图表 (Recharts)
- 数据导出 (CSV/JSON)
- 高级筛选和对比
- 实时市场数据可视化

---

## 🎨 Design System

### 颜色方案
```
深色背景: bg-black, bg-slate-900, bg-white/5
强调色:   indigo-500, purple-500, pink-500
成功/正: green-500, green-400
风险/负: red-500, red-400
警告:    yellow-500, yellow-400
```

### Typography
- **标题**: text-3xl font-bold (text-transparent bg-clip-text 渐变)
- **子标题**: text-xl font-semibold
- **正文**: text-sm text-slate-300
- **标签**: text-xs text-slate-400

### 边框和背景
- 边框: `border border-white/10` 或 `border-{color}-500/30`
- 背景: `bg-white/5` 或 `bg-{color}-500/10`
- 玻璃态: `backdrop-blur-xl`

### 间距
- 卡片内间距: `p-4` 到 `p-6`
- 间隔: `gap-4` 或 `gap-6`
- 边距: `mb-4`, `mb-8` 等

---

## 🚀 Getting Started

### 安装依赖
```bash
cd frontend-web
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问: http://localhost:5173

### 构建生产版本
```bash
npm run build
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "lucide-react": "^0.x",    // Icons
    "recharts": "^2.x"         // Charts (future)
  },
  "devDependencies": {
    "vite": "^5.x"
  }
}
```

---

## 🔌 API Integration Points

### Dashboard
- `GET /api/signals` - 获取活跃信号
- `GET /api/stats` - 获取用户统计数据
- WebSocket: `ws://localhost:3001/signals` - 实时信号推送

### Strategies
- `GET /api/strategies` - 获取所有策略
- `GET /api/strategies/:id` - 获取策略详情
- `POST /api/invest` - 投资策略

### Portfolio
- `GET /api/portfolio` - 获取投资组合
- `GET /api/performance` - 获取收益数据

### Reputation
- `GET /api/user/reputation` - 获取用户声誉分数
- `GET /api/leaderboard` - 获取排行榜

### Analytics
- `GET /api/analytics/signals` - 信号分析数据
- `GET /api/analytics/markets` - 市场数据
- `GET /api/backtest/:strategy_id` - 回测结果

---

## 🎬 Usage Instructions

### 切换页面
点击顶部导航栏的任意按钮:
- **Dashboard**: 实时监控
- **Strategies**: 策略浏览
- **Portfolio**: 投资组合
- **Reputation**: 声誉系统
- **Analytics**: 数据分析

### 执行对冲
1. 在 Dashboard 看到信号
2. 点击 "Execute Hedge →"
3. 确认交易参数
4. 在 Portfolio 中跟踪收益

### 投资策略
1. 在 Strategies 选择策略
2. 点击 "Invest Now"
3. 设置投资金额
4. 确认交易

---

## 🔧 Customization

### 添加新页面
1. 在 `pages/` 创建新组件
2. 在 `NewApp.tsx` 中添加路由
3. 在 `Navigation.tsx` 中添加菜单项

### 修改颜色方案
编辑 `index.css` 或使用 Tailwind 的 `tailwind.config.js`

### 使用新图表库
```bash
npm install recharts
```

在页面中导入并使用 Recharts 组件

---

## 📱 Mobile Optimization

所有页面都经过移动优化:
- 隐藏的汉堡菜单 (`md:hidden`)
- 响应式网格 (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- 触摸友好的按钮 (最小48px)
- 水平滚动表格

---

## 🐛 Troubleshooting

### 页面不刷新
检查 `NewApp.tsx` 中的 `useState` 状态是否正确传递

### 样式不应用
确保使用了正确的 Tailwind class 名称，检查 `index.css`

### 导航不工作
确保在 `Navigation.tsx` 中正确处理了 `onPageChange` 回调

---

## 📚 Next Steps

1. **连接API**: 替换模拟数据为实际API调用
2. **WebSocket**: 实现实时信号推送
3. **钱包集成**: 集成 MetaMask/WalletConnect
4. **图表**: 使用 Recharts 添加交互式数据可视化
5. **表单**: 实现投资和设置表单
6. **通知**: 添加 toast/notification 系统

---

**设计完成日期**: 2025-01-31
**版本**: 1.0.0 Beta
**参考**: neutral.trade UI/UX 风格
