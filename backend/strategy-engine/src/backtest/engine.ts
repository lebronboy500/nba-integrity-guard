/**
 * Backtest Engine
 * Simulates trading strategy on historical data
 */

import { DatabaseManager } from '../database';

export interface BacktestConfig {
  startDate: string;
  endDate: string;
  initialCapital: number;
  maxPositionSize: number;
  riskPerTrade: number;
  riggingThreshold: number;
  anomalyThreshold: number;
}

export interface Trade {
  id: string;
  timestamp: string;
  gameId: string;
  action: 'BET_YES' | 'BET_NO';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  profit?: number;
  reason: string;
}

export interface BacktestResult {
  config: BacktestConfig;
  summary: {
    totalReturn: number;
    totalReturnPercent: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgProfitPerTrade: number;
    avgWinAmount: number;
    avgLossAmount: number;
    profitFactor: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
  equity: Array<{ timestamp: string; value: number }>;
  trades: Trade[];
  statistics: {
    bestTrade: Trade | null;
    worstTrade: Trade | null;
    avgTradeDuration: number;
    totalDays: number;
  };
}

export class BacktestEngine {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Run backtest simulation
   */
  async run(config: BacktestConfig): Promise<BacktestResult> {
    console.log('[Backtest] Starting backtest...', config);

    // 1. Load historical data
    const historicalData = await this.loadHistoricalData(
      config.startDate,
      config.endDate
    );

    console.log(`[Backtest] Loaded ${historicalData.length} data points`);

    if (historicalData.length === 0) {
      throw new Error('No historical data found for specified date range');
    }

    // 2. Simulate trades
    const trades: Trade[] = [];
    let capital = config.initialCapital;
    const equity: Array<{ timestamp: string; value: number }> = [
      { timestamp: config.startDate, value: capital }
    ];

    for (const dataPoint of historicalData) {
      const signal = this.evaluateSignal(dataPoint, config);

      if (signal.shouldTrade) {
        const positionSize = Math.min(
          capital * config.riskPerTrade,
          config.maxPositionSize
        );

        if (positionSize > 0) {
          const trade = await this.simulateTrade(dataPoint, positionSize, signal.action);
          trades.push(trade);

          capital += trade.profit || 0;
          equity.push({ timestamp: dataPoint.timestamp, value: capital });
        }
      }
    }

    console.log(`[Backtest] Executed ${trades.length} trades`);

    // 3. Calculate performance metrics
    const result = this.calculateMetrics(trades, equity, config);

    return result;
  }

  /**
   * Load historical signal data
   */
  private async loadHistoricalData(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
      SELECT
        id,
        game_id as "gameId",
        timestamp,
        rigging_index as "riggingIndex",
        tweet_count as "tweetCount",
        avg_sentiment as "avgSentiment",
        (metadata->>'anomaly_score')::decimal as "anomalyScore",
        (metadata->>'spread_bps')::integer as "spreadBps",
        (metadata->>'liquidity')::bigint as "liquidity"
      FROM twitter_data
      WHERE timestamp >= $1
        AND timestamp <= $2
        AND rigging_index IS NOT NULL
      ORDER BY timestamp ASC
    `;

    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Evaluate if signal should trigger trade
   */
  private evaluateSignal(
    dataPoint: any,
    config: BacktestConfig
  ): { shouldTrade: boolean; action: 'BET_YES' | 'BET_NO'; confidence: number } {
    const meetsThreshold =
      dataPoint.riggingIndex >= config.riggingThreshold &&
      dataPoint.anomalyScore >= config.anomalyThreshold;

    const confidence = (dataPoint.riggingIndex + dataPoint.anomalyScore) / 2;

    return {
      shouldTrade: meetsThreshold,
      action: 'BET_NO', // Bet against suspected rigged games
      confidence
    };
  }

  /**
   * Simulate a single trade
   */
  private async simulateTrade(
    dataPoint: any,
    amount: number,
    action: 'BET_YES' | 'BET_NO'
  ): Promise<Trade> {
    // Simplified simulation:
    // - 65% win rate for signals above threshold
    // - 1.8x payout on wins
    // - Total loss on losses

    const winProbability = 0.65;
    const payoutMultiplier = 1.8;

    const won = Math.random() < winProbability;
    const exitPrice = won ? amount * payoutMultiplier : 0;
    const profit = exitPrice - amount;

    return {
      id: `BT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: dataPoint.timestamp,
      gameId: dataPoint.gameId,
      action,
      amount,
      entryPrice: amount,
      exitPrice,
      profit,
      reason: `Rigging: ${dataPoint.riggingIndex}, Anomaly: ${dataPoint.anomalyScore}`
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(
    trades: Trade[],
    equity: Array<{ timestamp: string; value: number }>,
    config: BacktestConfig
  ): BacktestResult {
    const winningTrades = trades.filter(t => (t.profit || 0) > 0);
    const losingTrades = trades.filter(t => (t.profit || 0) <= 0);

    const totalReturn = equity[equity.length - 1].value - config.initialCapital;
    const totalReturnPercent = (totalReturn / config.initialCapital) * 100;

    const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;

    // Calculate Sharpe Ratio
    const returns = equity.slice(1).map((e, i) =>
      (e.value - equity[i].value) / equity[i].value
    );
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    ) || 1;
    const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252); // Annualized

    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peak = equity[0].value;

    for (const point of equity) {
      if (point.value > peak) peak = point.value;
      const drawdown = peak - point.value;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    // Calculate consecutive wins/losses
    const { maxWins, maxLosses } = this.calculateStreaks(trades);

    // Calculate average amounts
    const avgProfitPerTrade = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / trades.length || 0;
    const avgWinAmount = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / winningTrades.length || 0;
    const avgLossAmount = losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / losingTrades.length || 0;

    // Calculate profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    // Find best/worst trades
    const bestTrade = trades.reduce((best, t) =>
      (t.profit || 0) > (best?.profit || 0) ? t : best
    , trades[0] || null);

    const worstTrade = trades.reduce((worst, t) =>
      (t.profit || 0) < (worst?.profit || 0) ? t : worst
    , trades[0] || null);

    // Calculate average trade duration (simplified)
    const totalDays = Math.ceil(
      (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const avgTradeDuration = totalDays / trades.length || 0;

    return {
      config,
      summary: {
        totalReturn: Number(totalReturn.toFixed(2)),
        totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
        winRate: Number(winRate.toFixed(3)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        maxDrawdown: Number(maxDrawdown.toFixed(2)),
        maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        avgProfitPerTrade: Number(avgProfitPerTrade.toFixed(2)),
        avgWinAmount: Number(avgWinAmount.toFixed(2)),
        avgLossAmount: Number(avgLossAmount.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        consecutiveWins: maxWins,
        consecutiveLosses: maxLosses
      },
      equity,
      trades,
      statistics: {
        bestTrade,
        worstTrade,
        avgTradeDuration: Number(avgTradeDuration.toFixed(1)),
        totalDays
      }
    };
  }

  /**
   * Calculate consecutive win/loss streaks
   */
  private calculateStreaks(trades: Trade[]): { maxWins: number; maxLosses: number } {
    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if ((trade.profit || 0) > 0) {
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

  /**
   * Generate backtest report
   */
  generateReport(result: BacktestResult): string {
    const { summary, statistics } = result;

    return `
╔═══════════════════════════════════════════════════════════════╗
║                   BACKTEST PERFORMANCE REPORT                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Period: ${result.config.startDate} to ${result.config.endDate}        ║
║  Initial Capital: $${result.config.initialCapital.toLocaleString()}                              ║
║                                                               ║
║  OVERALL PERFORMANCE                                          ║
║  ───────────────────                                          ║
║  Total Return:        $${summary.totalReturn.toLocaleString()} (${summary.totalReturnPercent}%)      ║
║  Win Rate:            ${(summary.winRate * 100).toFixed(1)}%                          ║
║  Sharpe Ratio:        ${summary.sharpeRatio}                               ║
║  Max Drawdown:        $${summary.maxDrawdown.toLocaleString()} (${summary.maxDrawdownPercent}%)      ║
║  Profit Factor:       ${summary.profitFactor}                               ║
║                                                               ║
║  TRADE STATISTICS                                             ║
║  ────────────────                                             ║
║  Total Trades:        ${summary.totalTrades}                              ║
║  Winning Trades:      ${summary.winningTrades} (${(summary.winRate * 100).toFixed(1)}%)             ║
║  Losing Trades:       ${summary.losingTrades}                              ║
║  Avg Profit/Trade:    $${summary.avgProfitPerTrade}                       ║
║  Avg Win:             $${summary.avgWinAmount}                       ║
║  Avg Loss:            $${summary.avgLossAmount}                      ║
║  Best Streak (Wins):  ${summary.consecutiveWins}                              ║
║  Worst Streak (Loss): ${summary.consecutiveLosses}                              ║
║                                                               ║
║  TRADING DETAILS                                              ║
║  ───────────────                                              ║
║  Avg Trade Duration:  ${statistics.avgTradeDuration} days                        ║
║  Best Trade:          $${statistics.bestTrade?.profit?.toFixed(2) || 0}                       ║
║  Worst Trade:         $${statistics.worstTrade?.profit?.toFixed(2) || 0}                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `.trim();
  }
}
