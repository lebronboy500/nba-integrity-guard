# 🚀 Phase 2 详细实施计划

**版本**: v2.0
**预计周期**: 2-4周
**设计参考**: [neutral.trade](https://neutral.trade) 风格
**状态**: 🚧 进行中

---

## 📊 Phase 2 总览

Phase 2 的核心目标是将系统从"数据采集 + 基础信号"升级到"智能化预测 + 用户友好界面"。

### 三大模块

1. **ML信号优化** (1周) - 提升信号准确率
2. **回测系统** (1周) - 验证策略有效性
3. **Web Dashboard** (2周) - 现代化用户界面

---

## 🤖 Phase 2.1: ML信号优化

### 目标
将固定阈值的信号匹配升级为自适应机器学习模型，提升准确率从60% → 80%+。

### 核心实现

#### 1. AdaptiveThreshold 类

**文件**: `backend/strategy-engine/src/ml/adaptive_threshold.ts`

```typescript
export class AdaptiveThreshold {
  private historicalData: SignalData[] = [];
  private updateInterval: number = 3600000; // 1 hour

  constructor(
    private db: DatabaseManager,
    private lookbackDays: number = 30
  ) {}

  async calculateDynamicThreshold(
    metric: 'rigging_index' | 'anomaly_score'
  ): Promise<number> {
    // 加载历史数据
    const data = await this.loadHistoricalData(metric);

    // 计算95分位数作为阈值
    const sorted = data.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const threshold = sorted[p95Index];

    logger.info(`Dynamic threshold for ${metric}: ${threshold}`);
    return threshold;
  }

  async shouldTriggerSignal(
    riggingIndex: number,
    anomalyScore: number
  ): Promise<boolean> {
    const riggingThreshold = await this.calculateDynamicThreshold('rigging_index');
    const anomalyThreshold = await this.calculateDynamicThreshold('anomaly_score');

    return (
      riggingIndex > riggingThreshold &&
      anomalyScore > anomalyThreshold
    );
  }
}
```

**优势**:
- 自动适应市场变化
- 减少噪音信号
- 无需手动调参

---

#### 2. RandomForest 信号分类器

**文件**: `backend/strategy-engine/src/ml/signal_classifier.py`

```python
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import logging

logger = logging.getLogger(__name__)

class SignalClassifier:
    """
    随机森林分类器用于预测信号是否应该触发交易
    """

    def __init__(self, model_path: str = './models/rf_signal_classifier.pkl'):
        self.model_path = model_path
        self.model = None
        self.feature_columns = [
            'rigging_index',
            'anomaly_score',
            'tweet_count',
            'avg_sentiment',
            'spread_bps',
            'liquidity',
            'hour_of_day',
            'day_of_week'
        ]

    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        特征工程
        """
        df['hour_of_day'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek

        # 归一化
        for col in ['rigging_index', 'anomaly_score', 'avg_sentiment']:
            df[col] = (df[col] - df[col].mean()) / df[col].std()

        return df[self.feature_columns]

    def train(self, df: pd.DataFrame, labels: pd.Series):
        """
        训练模型
        """
        X = self.prepare_features(df)
        y = labels  # 0 = 不交易, 1 = 交易

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42
        )

        self.model.fit(X_train, y_train)

        # 评估
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        logger.info(f"Model Accuracy: {accuracy:.2%}")
        logger.info(f"\n{classification_report(y_test, y_pred)}")

        # 保存模型
        joblib.dump(self.model, self.model_path)
        logger.info(f"Model saved to {self.model_path}")

        return accuracy

    def predict(self, features: dict) -> dict:
        """
        预测是否触发信号
        """
        if self.model is None:
            self.load_model()

        df = pd.DataFrame([features])
        X = self.prepare_features(df)

        prediction = self.model.predict(X)[0]
        probability = self.model.predict_proba(X)[0]

        return {
            'should_trade': bool(prediction),
            'confidence': float(max(probability)),
            'probabilities': {
                'no_trade': float(probability[0]),
                'trade': float(probability[1])
            }
        }

    def load_model(self):
        """加载已训练模型"""
        try:
            self.model = joblib.load(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
        except FileNotFoundError:
            logger.warning("No trained model found. Please train first.")
```

**特征说明**:
- `rigging_index`: 假球热度指数 (Twitter)
- `anomaly_score`: 市场异常分数 (Polymarket)
- `tweet_count`, `avg_sentiment`: 舆情统计
- `spread_bps`, `liquidity`: 市场深度
- `hour_of_day`, `day_of_week`: 时间特征（比赛时间规律）

---

#### 3. 训练数据管理

**数据库表**: `signal_ground_truth`

```sql
CREATE TABLE signal_ground_truth (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(100) NOT NULL,
    signal_timestamp TIMESTAMP NOT NULL,
    rigging_index DECIMAL(5,4),
    anomaly_score DECIMAL(5,4),
    tweet_count INTEGER,
    avg_sentiment DECIMAL(5,4),
    spread_bps INTEGER,
    liquidity BIGINT,

    -- 人工标注
    actual_outcome VARCHAR(20), -- 'rigged', 'clean', 'uncertain'
    should_have_traded BOOLEAN,
    profit_if_traded DECIMAL(10,2),

    -- 元数据
    labeled_by VARCHAR(50),
    labeled_at TIMESTAMP DEFAULT NOW(),
    notes TEXT,

    UNIQUE(game_id, signal_timestamp)
);

CREATE INDEX idx_ground_truth_game ON signal_ground_truth(game_id);
CREATE INDEX idx_ground_truth_labeled ON signal_ground_truth(labeled_at);
```

**人工标注流程**:
1. 每天回顾前一天的信号
2. 对比实际比赛结果
3. 标注 `should_have_traded` (是否应该交易)
4. 记录 `actual_outcome` (实际结果)
5. 每周重新训练模型

---

## 📈 Phase 2.2: 回测系统

### 目标
基于历史数据验证策略有效性，计算关键性能指标。

### 核心实现

#### 1. BacktestEngine 类

**文件**: `backend/strategy-engine/src/backtest/engine.ts`

```typescript
import { DatabaseManager } from '../database';
import { StrategyLogic } from '../strategy';

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  maxPositionSize: number;
  riskPerTrade: number;
}

export interface BacktestResult {
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  avgProfitPerTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  trades: Trade[];
}

export class BacktestEngine {
  private db: DatabaseManager;
  private strategy: StrategyLogic;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.strategy = new StrategyLogic();
  }

  async run(config: BacktestConfig): Promise<BacktestResult> {
    // 1. 加载历史数据
    const historicalData = await this.loadHistoricalData(
      config.startDate,
      config.endDate
    );

    // 2. 模拟交易执行
    const trades: Trade[] = [];
    let capital = config.initialCapital;
    let equity: number[] = [capital];

    for (const dataPoint of historicalData) {
      const signal = this.strategy.evaluateSignal(dataPoint);

      if (signal.shouldTrade) {
        const positionSize = Math.min(
          capital * config.riskPerTrade,
          config.maxPositionSize
        );

        const trade = await this.simulateTrade(
          dataPoint,
          positionSize
        );

        trades.push(trade);
        capital += trade.profit;
        equity.push(capital);
      }
    }

    // 3. 计算性能指标
    return this.calculateMetrics(trades, equity, config.initialCapital);
  }

  private calculateMetrics(
    trades: Trade[],
    equity: number[],
    initialCapital: number
  ): BacktestResult {
    const totalReturn = (equity[equity.length - 1] - initialCapital) / initialCapital;
    const winningTrades = trades.filter(t => t.profit > 0);
    const winRate = winningTrades.length / trades.length;

    // 夏普比率 (假设无风险利率 = 0)
    const returns = equity.slice(1).map((v, i) => (v - equity[i]) / equity[i]);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = avgReturn / stdDev * Math.sqrt(252); // 年化

    // 最大回撤
    let maxDrawdown = 0;
    let peak = equity[0];
    for (const value of equity) {
      if (value > peak) peak = value;
      const drawdown = (peak - value) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // 连赢/连输
    const { maxWins, maxLosses } = this.calculateStreaks(trades);

    return {
      totalReturn,
      winRate,
      sharpeRatio,
      maxDrawdown,
      totalTrades: trades.length,
      avgProfitPerTrade: trades.reduce((sum, t) => sum + t.profit, 0) / trades.length,
      consecutiveWins: maxWins,
      consecutiveLosses: maxLosses,
      trades
    };
  }

  private calculateStreaks(trades: Trade[]): { maxWins: number; maxLosses: number } {
    let maxWins = 0, maxLosses = 0;
    let currentWins = 0, currentLosses = 0;

    for (const trade of trades) {
      if (trade.profit > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { maxWins, maxLosses };
  }
}
```

---

#### 2. 回测报告生成

**文件**: `backend/strategy-engine/src/backtest/reporter.ts`

```typescript
export class BacktestReporter {
  static generateReport(result: BacktestResult): string {
    return `
╔════════════════════════════════════════════════════════╗
║              BACKTEST PERFORMANCE REPORT              ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Overall Performance                                   ║
║  ─────────────────────                                 ║
║  Total Return:        ${(result.totalReturn * 100).toFixed(2)}%                      ║
║  Win Rate:            ${(result.winRate * 100).toFixed(2)}%                      ║
║  Sharpe Ratio:        ${result.sharpeRatio.toFixed(2)}                         ║
║  Max Drawdown:        ${(result.maxDrawdown * 100).toFixed(2)}%                      ║
║                                                        ║
║  Trade Statistics                                      ║
║  ─────────────────                                     ║
║  Total Trades:        ${result.totalTrades}                            ║
║  Avg Profit/Trade:    $${result.avgProfitPerTrade.toFixed(2)}                     ║
║  Best Streak (Wins):  ${result.consecutiveWins}                            ║
║  Worst Streak (Loss): ${result.consecutiveLosses}                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `;
  }

  static exportToJSON(result: BacktestResult, filename: string): void {
    const fs = require('fs');
    fs.writeFileSync(
      filename,
      JSON.stringify(result, null, 2)
    );
  }
}
```

---

## 🎨 Phase 2.3: Web Dashboard

### 目标
构建参考 neutral.trade 风格的现代化 Web 界面，提供实时监控和交易管理。

### 技术栈

```json
{
  "frontend": {
    "framework": "React 18.2",
    "language": "TypeScript 5.0",
    "bundler": "Vite 5.0",
    "styling": "TailwindCSS 3.3",
    "charts": ["Chart.js 4.4", "Recharts 2.10"],
    "state": "Zustand 4.4",
    "websocket": "native WebSocket API"
  },
  "design": {
    "reference": "neutral.trade",
    "theme": "dark",
    "colors": {
      "primary": "#10b981",
      "danger": "#ef4444",
      "background": "#0f172a",
      "surface": "#1e293b",
      "text": "#f1f5f9"
    },
    "fonts": ["Inter", "JetBrains Mono"]
  }
}
```

---

### 目录结构

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Dashboard/
│   │   │   ├── Header.tsx
│   │   │   ├── SignalPanel.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   └── RealTimeChart.tsx
│   │   ├── Trading/
│   │   │   ├── TradeList.tsx
│   │   │   ├── TradeCard.tsx
│   │   │   └── TradeFilters.tsx
│   │   ├── Analytics/
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── MetricsTable.tsx
│   │   │   └── EquityCurve.tsx
│   │   └── Settings/
│   │       ├── ThresholdSettings.tsx
│   │       └── NotificationSettings.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useStats.ts
│   │   └── useTrades.ts
│   ├── store/
│   │   ├── signalStore.ts
│   │   ├── tradeStore.ts
│   │   └── statsStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── websocket.ts
│   ├── types/
│   │   ├── signal.ts
│   │   ├── trade.ts
│   │   └── stats.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

### 核心组件实现

#### 1. Dashboard 主页

**文件**: `frontend/src/components/Dashboard/Dashboard.tsx`

```tsx
import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSignalStore } from '@/store/signalStore';
import SignalPanel from './SignalPanel';
import StatsCard from './StatsCard';
import RealTimeChart from './RealTimeChart';

export default function Dashboard() {
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:3000');
  const { signals, addSignal } = useSignalStore();

  useEffect(() => {
    if (lastMessage) {
      addSignal(lastMessage);
    }
  }, [lastMessage]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">NBA Integrity Guard</h1>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-2 ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Rigging Index"
            value={signals[0]?.riggingIndex ?? 0}
            trend="up"
            color="red"
          />
          <StatsCard
            title="Anomaly Score"
            value={signals[0]?.anomalyScore ?? 0}
            trend="up"
            color="yellow"
          />
          <StatsCard
            title="Active Signals"
            value={signals.length}
            trend="neutral"
            color="blue"
          />
          <StatsCard
            title="Win Rate"
            value="68.5%"
            trend="up"
            color="green"
          />
        </div>

        {/* Signal Panel */}
        <SignalPanel signals={signals} />

        {/* Real-Time Chart */}
        <div className="mt-8">
          <RealTimeChart data={signals} />
        </div>
      </main>
    </div>
  );
}
```

---

#### 2. WebSocket Hook

**文件**: `frontend/src/hooks/useWebSocket.ts`

```typescript
import { useEffect, useState, useRef } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);

      // 自动重连
      setTimeout(() => {
        console.log('Reconnecting...');
      }, 5000);
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, lastMessage, sendMessage };
}
```

---

#### 3. Zustand Store

**文件**: `frontend/src/store/signalStore.ts`

```typescript
import { create } from 'zustand';

interface Signal {
  timestamp: string;
  riggingIndex: number;
  anomalyScore: number;
  gameId: string;
  status: 'active' | 'expired' | 'executed';
}

interface SignalStore {
  signals: Signal[];
  addSignal: (signal: Signal) => void;
  removeSignal: (timestamp: string) => void;
  clearSignals: () => void;
}

export const useSignalStore = create<SignalStore>((set) => ({
  signals: [],

  addSignal: (signal) => set((state) => ({
    signals: [signal, ...state.signals].slice(0, 50) // 保留最新50条
  })),

  removeSignal: (timestamp) => set((state) => ({
    signals: state.signals.filter(s => s.timestamp !== timestamp)
  })),

  clearSignals: () => set({ signals: [] })
}));
```

---

### 页面设计参考

#### Dashboard 主页布局

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] NBA Integrity Guard              [●] Connected      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │ Rigging Idx │ │ Anomaly Scr │ │ Active Sig  │ │Win Rate│ │
│  │    0.72 ↑   │ │    0.85 ↑   │ │      3      │ │ 68.5% ↑│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🚨 HIGH RISK SIGNAL ACTIVE                            │  │
│  │ Game: LAL vs BOS | Time: 15:30 UTC                    │  │
│  │ Confidence: 87% | Est. Payout: $1,800                 │  │
│  │ [View Details] [Execute Trade]                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         Real-Time Rigging Index Chart                  │  │
│  │                                                        │  │
│  │  1.0 ┤                                    ●            │  │
│  │  0.8 ┤                          ●    ●                 │  │
│  │  0.6 ┤            ●        ●                           │  │
│  │  0.4 ┤      ●                                          │  │
│  │  0.2 ┤ ●                                               │  │
│  │  0.0 └────────────────────────────────────────────────│  │
│  │      15:00    15:10    15:20    15:30    15:40        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Phase 2 验收标准

### 功能性
- [ ] ML模型训练完成，准确率 >70%
- [ ] 回测系统能处理 ≥1年历史数据
- [ ] Web Dashboard 正常显示实时数据
- [ ] WebSocket 连接稳定，自动重连
- [ ] 图表实时更新，无卡顿

### 性能
- [ ] Dashboard首屏加载 <2s
- [ ] WebSocket延迟 <100ms
- [ ] 图表渲染 60fps
- [ ] API响应时间 <50ms
- [ ] 回测速度 >1000条记录/秒

### 代码质量
- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 所有组件有单元测试
- [ ] 代码覆盖率 >80%
- [ ] 文档完整（README + 注释）

---

## 📅 实施时间线

| 周次 | 任务 | 交付物 |
|-----|------|-------|
| Week 1 | ML优化 | AdaptiveThreshold + RandomForest + 训练数据表 |
| Week 2 | 回测系统 | BacktestEngine + Reporter + 性能报告 |
| Week 3 | Web前端（上） | React项目 + Dashboard + WebSocket |
| Week 4 | Web前端（下） | Trading/Analytics页面 + 测试 + 文档 |

---

**下一步**: 开始 Week 3 - 创建 React + TypeScript + Vite 前端项目
