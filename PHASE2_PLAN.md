# Phase 2 规划 - 智能化增强与前端开发

**版本**: v2.0 规划
**参考**: neutral.trade 网站风格
**预计周期**: 2-4周

---

## 🎯 Phase 2 核心目标

1. **ML信号优化** - 动态阈值 + 历史数据训练
2. **回测系统** - 策略有效性验证
3. **Web Dashboard** - neutral.trade 风格前端

---

## 1️⃣ 机器学习信号优化

### 1.1 动态阈值调整

**当前问题**: 硬编码阈值 (0.65, 0.75)

**改进方案**:

```python
# backend/strategy-engine/src/adaptive_threshold.py

class AdaptiveThreshold:
    def __init__(self, window_size=100):
        self.history = []
        self.window_size = window_size
        self.percentile = 95  # 使用95分位数

    def calculate_threshold(self):
        """基于历史数据动态计算阈值"""
        if len(self.history) < 10:
            return 0.65  # 默认值

        return np.percentile(self.history, self.percentile)

    def update(self, rigging_index: float):
        """更新历史数据"""
        self.history.append(rigging_index)
        if len(self.history) > self.window_size:
            self.history.pop(0)

# 使用
threshold = AdaptiveThreshold()
threshold.update(current_rigging_index)
dynamic_threshold = threshold.calculate_threshold()
```

**优势**:
- ✅ 自动调整阈值
- ✅ 适应市场变化
- ✅ 不需要手动调参

### 1.2 简单ML分类

**方案**: 随机森林分类器

```python
from sklearn.ensemble import RandomForestClassifier

class MLSignalMatcher:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100)
        self.features = [
            'rigging_index',
            'anomaly_score',
            'hour_of_day',
            'day_of_week'
        ]

    def train(self, historical_data):
        """使用历史数据训练"""
        X = historical_data[self.features]
        y = historical_data['actual_outcome']  # 人工标注
        self.model.fit(X, y)

    def predict(self, current_data):
        """预测信号"""
        confidence = self.model.predict_proba(current_data)[0][1]
        if confidence > 0.8:
            return 'HIGH_RISK_HEDGE'
        # ...
```

**标注数据格式**:

```sql
CREATE TABLE signal_ground_truth (
    id SERIAL PRIMARY KEY,
    signal_id INTEGER REFERENCES signal_logs(id),
    rigging_index DECIMAL,
    anomaly_score DECIMAL,
    actual_outcome BOOLEAN,  -- 信号是否准确
    confidence DECIMAL,
    labeler VARCHAR(50),
    labeled_at TIMESTAMP
);
```

---

## 2️⃣ 回测系统

### 2.1 数据准备

```python
# backend/backtester/data_loader.py

class BacktestDataLoader:
    def __init__(self, start_date: str, end_date: str):
        self.start_date = start_date
        self.end_date = end_date

    def load_historical_data(self):
        """加载历史数据用于回测"""
        # 加载Twitter数据
        twitter_df = pd.read_sql("""
            SELECT * FROM twitter_data
            WHERE timestamp BETWEEN %s AND %s
            ORDER BY timestamp
        """, start_date, end_date)

        # 加载市场数据
        market_df = pd.read_sql("""
            SELECT * FROM market_data
            WHERE timestamp BETWEEN %s AND %s
            ORDER BY timestamp
        """, start_date, end_date)

        return twitter_df, market_df
```

### 2.2 回测引擎

```python
class Backtester:
    def __init__(self, start_date, end_date, initial_capital=10000):
        self.loader = BacktestDataLoader(start_date, end_date)
        self.initial_capital = initial_capital

    def simulate_trading(self):
        """模拟交易"""
        twitter_df, market_df = self.loader.load_historical_data()

        capital = self.initial_capital
        trades = []
        equity_curve = []

        for timestamp in pd.date_range(self.start_date, self.end_date, freq='30S'):
            # 获取当时的数据
            twitter_row = twitter_df[twitter_df['timestamp'] == timestamp]
            market_row = market_df[market_df['timestamp'] == timestamp]

            if twitter_row.empty or market_row.empty:
                continue

            # 生成信号
            signal = self.signal_matcher.matchSignal({
                'riggingIndex': twitter_row.iloc[0]['rigging_index'],
                'anomalyScore': market_row.iloc[0]['anomaly_score']
            })

            # 执行交易
            if signal.type != 'NO_SIGNAL':
                trade_result = self.execute_mock_trade(signal)
                capital += trade_result['profit']
                trades.append(trade_result)

            equity_curve.append(capital)

        return self.calculate_metrics(trades, equity_curve)

    def calculate_metrics(self, trades, equity_curve):
        """计算性能指标"""
        returns = np.diff(equity_curve) / equity_curve[:-1]

        return {
            'total_return': (equity_curve[-1] - self.initial_capital) / self.initial_capital,
            'num_trades': len(trades),
            'win_rate': len([t for t in trades if t['profit'] > 0]) / len(trades),
            'avg_trade_return': np.mean([t['profit'] / self.initial_capital for t in trades]),
            'sharpe_ratio': np.mean(returns) / np.std(returns) if np.std(returns) > 0 else 0,
            'max_drawdown': self.calculate_max_drawdown(equity_curve),
            'consecutive_wins': self.calculate_consecutive_wins(trades)
        }
```

### 2.3 回测结果展示

```
📊 === Backtest Results (2024-01-01 to 2024-12-31) ===
  💰 Total Return: +24.5%
  📈 Initial Capital: $10,000 → Final: $12,450
  🎯 Win Rate: 58.3% (35/60 trades)
  📊 Avg Trade Return: +1.2%
  📉 Max Drawdown: -8.5%
  ⚡ Sharpe Ratio: 1.45
  🏆 Consecutive Wins: 7
  ⏱️ Total Trades: 60
===================================
```

---

## 3️⃣ Web Dashboard (React + TypeScript)

### 3.1 参考设计: neutral.trade

根据你提到的 `neutral.trade` 网站风格：

**特点**:
- 现代化设计，深色主题
- 实时数据更新
- 多图表展示
- 简洁高效的交互

**我们的实现**:

```
Frontend 目录结构:

frontend-web/
├── src/
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Navigation.tsx     # 顶部导航
│   │   │   └── Stats.tsx          # 实时统计
│   │   ├── Dashboard/
│   │   │   ├── SignalPanel.tsx    # 信号显示
│   │   │   ├── TradeList.tsx      # 交易历史
│   │   │   └── Charts.tsx         # 图表展示
│   │   ├── Monitoring/
│   │   │   ├── HealthStatus.tsx   # 系统健康
│   │   │   └── ErrorLog.tsx       # 错误日志
│   │   └── Common/
│   │       ├── Card.tsx
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts        # WebSocket连接
│   │   ├── useSignals.ts          # 信号逻辑
│   │   └── useStats.ts            # 统计数据
│   ├── pages/
│   │   ├── Home.tsx               # 主页
│   │   ├── Trades.tsx             # 交易页
│   │   ├── Analytics.tsx          # 分析页
│   │   └── Settings.tsx           # 设置页
│   ├── styles/
│   │   ├── global.css             # 全局样式
│   │   └── theme.css              # 主题配置
│   └── App.tsx
```

### 3.2 核心页面设计

#### 🏠 主Dashboard页面

```tsx
// frontend-web/src/pages/Home.tsx

import React from 'react';
import SignalPanel from '../components/Dashboard/SignalPanel';
import TradeList from '../components/Dashboard/TradeList';
import Charts from '../components/Dashboard/Charts';
import HealthStatus from '../components/Monitoring/HealthStatus';

export default function Home() {
  return (
    <div className="dashboard-container">
      {/* 顶部统计 */}
      <div className="stats-row">
        <StatCard label="Rigging Index" value="0.72" trend="up" />
        <StatCard label="Anomaly Score" value="0.85" trend="up" />
        <StatCard label="Active Trades" value="3" trend="neutral" />
        <StatCard label="Total Profit" value="$2,450" trend="up" />
      </div>

      {/* 信号面板 */}
      <div className="grid-2">
        <SignalPanel />
        <HealthStatus />
      </div>

      {/* 图表 */}
      <div className="charts-section">
        <Charts />
      </div>

      {/* 交易历史 */}
      <TradeList />
    </div>
  );
}
```

#### 📊 信号面板

```tsx
// 显示当前信号状态、历史信号、置信度等

<SignalPanel>
  <CurrentSignal>
    HIGH_RISK_HEDGE
    ━━━━━━━━━━━━━ 100% 置信度
  </CurrentSignal>

  <SignalBreakdown>
    🔴 Rigging Index:   0.72 / 1.00
    🟠 Anomaly Score:   0.85 / 1.00
  </SignalBreakdown>

  <RecentSignals>
    • 15:30 HIGH_RISK_HEDGE
    • 15:00 MEDIUM_RISK
    • 14:30 LOW_RISK
  </RecentSignals>
</SignalPanel>
```

#### 💹 交易列表

```tsx
// 显示交易历史、状态、利润等

<TradeList>
  | ID | Signal | Action | Amount | Status | Profit |
  |----|--------|--------|--------|--------|--------|
  | TRX...001 | HIGH_RISK | BET_NO | $1,500 | ✓ | +$450 |
  | TRX...002 | MEDIUM | BET_YES | $1,000 | ⏳ | - |
  | TRX...003 | LOW_RISK | BET_NO | $500 | ✓ | +$150 |
</TradeList>
```

#### 📈 图表

```tsx
// 使用 Chart.js 或 Recharts

<ChartSection>
  {/* 时间序列: Rigging Index */}
  <LineChart data={riggingIndexHistory} />

  {/* 时间序列: Anomaly Score */}
  <LineChart data={anomalyScoreHistory} />

  {/* 收益曲线 */}
  <AreaChart data={profitCurve} />

  {/* 信号分布 */}
  <PieChart data={signalDistribution} />

  {/* 交易统计 */}
  <BarChart data={tradeStats} />
</ChartSection>
```

### 3.3 实时更新 (WebSocket)

```typescript
// frontend-web/src/hooks/useWebSocket.ts

import { useEffect, useState } from 'react';

export function useWebSocket(url: string) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('✓ WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
      // 实时更新图表、统计等
    };

    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, [url]);

  return { data, connected };
}
```

### 3.4 API集成

```typescript
// Strategy Engine 需要添加 WebSocket 支持

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');

  // 订阅信号更新
  eventEmitter.on('new_signal', (signal) => {
    ws.send(JSON.stringify({
      type: 'signal',
      data: signal
    }));
  });

  // 订阅交易更新
  eventEmitter.on('new_trade', (trade) => {
    ws.send(JSON.stringify({
      type: 'trade',
      data: trade
    }));
  });

  // 定期发送统计
  const statsInterval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'stats',
      data: getStats()
    }));
  }, 1000);

  ws.on('close', () => {
    clearInterval(statsInterval);
  });
});
```

---

## 4️⃣ 技术栈

### Frontend Stack

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "chart.js": "^4.4.0",
    "recharts": "^2.10.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "ws": "^8.15.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

### 样式方案

```css
/* 深色主题 (参考 neutral.trade) */
:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --accent-success: #00d084;
  --accent-danger: #ff4757;
  --accent-warning: #ffa502;
  --border-color: #2a2a2a;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}
```

---

## 5️⃣ 实施计划

### Week 1: ML优化

- [ ] 实现AdaptiveThreshold
- [ ] 训练RandomForest模型
- [ ] 添加动态阈值系统
- [ ] 更新Strategy Engine

### Week 2: 回测系统

- [ ] 构建BacktestDataLoader
- [ ] 实现Backtester引擎
- [ ] 计算性能指标
- [ ] 创建回测UI

### Week 3-4: Web Dashboard

- [ ] 项目脚手架 (Vite + React)
- [ ] 基础组件库
- [ ] Dashboard页面
- [ ] WebSocket集成
- [ ] 样式和优化

---

## 📋 交付物

Phase 2 完成时应包含：

✅ ML信号优化模块
✅ 完整的回测系统
✅ React Web Dashboard
✅ WebSocket实时更新
✅ 详细的测试覆盖
✅ 性能优化

---

## 🚀 Success Metrics

- 模型准确率 > 70%
- 回测年化收益 > 20%
- Dashboard首屏加载 < 1s
- WebSocket延迟 < 100ms
- 用户体验评分 > 4/5

---

**下一步**: 开始Phase 2实施！
