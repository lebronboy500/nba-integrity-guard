/**
 * Trader Profile Service
 * Manages trader profiles and trading history
 */

import { Pool } from 'pg';

export interface TraderProfile {
  traderAddress: string;
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  averageTradeSize: number;
  preferredOutcome: 'YES' | 'NO' | 'mixed';
  tradingStyle: 'aggressive' | 'conservative' | 'balanced';
  riskScore: number; // 0-10
  reputationScore: number; // 0-100
  joinedAt: Date;
  lastTradeAt: Date;
  profileCompleteness: number; // 0-100
}

export interface TradeHistory {
  id: number;
  traderAddress: string;
  marketSlug: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  value: number;
  outcome: 'YES' | 'NO';
  timestamp: Date;
  profitLoss: number;
}

export interface TraderStats {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  profitFactor: number; // total profit / total loss
  avgProfit: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  profitableMarkets: string[];
  unprofitableMarkets: string[];
}

export class TraderProfileService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get or create trader profile
   */
  async getTraderProfile(traderAddress: string): Promise<TraderProfile | null> {
    const query = `
      WITH trader_stats AS (
        SELECT
          taker as trader,
          COUNT(*) as total_trades,
          SUM(size::numeric * price::numeric) as total_volume,
          AVG(size::numeric * price::numeric) as avg_trade_size,
          MIN(block_timestamp) as first_trade,
          MAX(block_timestamp) as last_trade,
          CASE
            WHEN SUM(CASE WHEN side = 'BUY' THEN 1 ELSE 0 END) >
                 SUM(CASE WHEN side = 'SELL' THEN 1 ELSE 0 END)
            THEN 'YES'
            WHEN SUM(CASE WHEN side = 'SELL' THEN 1 ELSE 0 END) >
                 SUM(CASE WHEN side = 'BUY' THEN 1 ELSE 0 END)
            THEN 'NO'
            ELSE 'mixed'
          END as preferred_outcome
        FROM pm_trades
        WHERE taker = $1
        GROUP BY taker
      ),
      win_loss AS (
        SELECT
          COUNT(CASE WHEN side = 'BUY' AND outcome = 'YES' THEN 1
                     WHEN side = 'SELL' AND outcome = 'NO' THEN 1 END) as wins,
          COUNT(*) as total
        FROM pm_trades
        WHERE taker = $1
      )
      SELECT
        ts.trader,
        ts.total_trades,
        ts.total_volume,
        CASE WHEN wl.total > 0 THEN (wl.wins::numeric / wl.total)::numeric ELSE 0 END as win_rate,
        ts.avg_trade_size,
        ts.preferred_outcome,
        ts.first_trade,
        ts.last_trade
      FROM trader_stats ts
      LEFT JOIN win_loss wl ON true
    `;

    const result = await this.db.query(query, [traderAddress.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const tradingStyle = this.calculateTradingStyle(parseFloat(row.avg_trade_size));
    const riskScore = this.calculateRiskScore(parseFloat(row.win_rate), parseFloat(row.avg_trade_size));

    return {
      traderAddress: row.trader,
      totalTrades: parseInt(row.total_trades),
      totalVolume: parseFloat(row.total_volume) || 0,
      winRate: parseFloat(row.win_rate) || 0,
      averageTradeSize: parseFloat(row.avg_trade_size) || 0,
      preferredOutcome: row.preferred_outcome || 'mixed',
      tradingStyle,
      riskScore,
      reputationScore: Math.round(parseFloat(row.win_rate) * 100) || 0,
      joinedAt: row.first_trade,
      lastTradeAt: row.last_trade,
      profileCompleteness: this.calculateProfileCompleteness(parseInt(row.total_trades))
    };
  }

  /**
   * Get trader trade history
   */
  async getTradeHistory(
    traderAddress: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TradeHistory[]> {
    const query = `
      SELECT
        t.id,
        t.taker as trader_address,
        m.slug as market_slug,
        t.side,
        t.size::numeric,
        t.price::numeric,
        (t.size::numeric * t.price::numeric) as value,
        t.outcome,
        t.block_timestamp as timestamp
      FROM pm_trades t
      JOIN markets m ON t.market_id = m.id
      WHERE LOWER(t.taker) = LOWER($1)
      ORDER BY t.block_timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [traderAddress, limit, offset]);

    return result.rows.map(row => ({
      id: row.id,
      traderAddress: row.trader_address,
      marketSlug: row.market_slug,
      side: row.side,
      size: parseFloat(row.size),
      price: parseFloat(row.price),
      value: parseFloat(row.value),
      outcome: row.outcome,
      timestamp: row.timestamp,
      profitLoss: this.calculateTradeResult(row.side, row.outcome, parseFloat(row.value))
    }));
  }

  /**
   * Get detailed trader statistics
   */
  async getTraderStats(traderAddress: string): Promise<TraderStats> {
    const query = `
      WITH trader_trades AS (
        SELECT
          side,
          outcome,
          size::numeric * price::numeric as value
        FROM pm_trades
        WHERE LOWER(taker) = LOWER($1)
      ),
      wins AS (
        SELECT
          COUNT(*) as win_count,
          COALESCE(SUM(value), 0) as total_profit
        FROM trader_trades
        WHERE (side = 'BUY' AND outcome = 'YES') OR (side = 'SELL' AND outcome = 'NO')
      ),
      losses AS (
        SELECT
          COUNT(*) as loss_count,
          COALESCE(SUM(value), 0) as total_loss
        FROM trader_trades
        WHERE (side = 'BUY' AND outcome = 'NO') OR (side = 'SELL' AND outcome = 'YES')
      )
      SELECT
        COUNT(*)::int as total_trades,
        COALESCE(w.win_count, 0)::int as wins,
        COALESCE(l.loss_count, 0)::int as losses,
        COALESCE(w.total_profit, 0) as profit,
        COALESCE(l.total_loss, 0) as loss
      FROM trader_trades t
      LEFT JOIN wins w ON true
      LEFT JOIN losses l ON true
      GROUP BY w.win_count, w.total_profit, l.loss_count, l.total_loss
    `;

    const result = await this.db.query(query, [traderAddress]);
    const row = result.rows[0];

    const totalTrades = parseInt(row.total_trades) || 0;
    const wins = parseInt(row.wins) || 0;
    const losses = parseInt(row.losses) || 0;
    const totalProfit = parseFloat(row.profit) || 0;
    const totalLoss = parseFloat(row.loss) || 0;

    return {
      totalTrades,
      winCount: wins,
      lossCount: losses,
      winRate: totalTrades > 0 ? wins / totalTrades : 0,
      totalProfit,
      totalLoss,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0,
      avgProfit: wins > 0 ? totalProfit / wins : 0,
      avgLoss: losses > 0 ? totalLoss / losses : 0,
      maxWin: 0, // TODO: calculate from detailed trades
      maxLoss: 0, // TODO: calculate from detailed trades
      profitableMarkets: [],
      unprofitableMarkets: []
    };
  }

  /**
   * Get top traders by win rate
   */
  async getTopTradersByWinRate(limit: number = 20): Promise<any[]> {
    const query = `
      WITH trader_wins AS (
        SELECT
          taker,
          COUNT(*) as total_trades,
          SUM(CASE WHEN (side = 'BUY' AND outcome = 'YES') OR (side = 'SELL' AND outcome = 'NO') THEN 1 ELSE 0 END) as wins
        FROM pm_trades
        GROUP BY taker
        HAVING COUNT(*) >= 10  -- minimum 10 trades
      )
      SELECT
        taker as trader,
        total_trades,
        wins,
        (wins::numeric / total_trades)::numeric as win_rate
      FROM trader_wins
      ORDER BY win_rate DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);

    return result.rows.map((row, index) => ({
      rank: index + 1,
      trader: row.trader,
      totalTrades: parseInt(row.total_trades),
      wins: parseInt(row.wins),
      winRate: parseFloat(row.win_rate)
    }));
  }

  /**
   * Get trader portfolio composition
   */
  async getTraderPortfolio(traderAddress: string): Promise<any> {
    const query = `
      SELECT
        outcome,
        COUNT(*) as trade_count,
        SUM(size::numeric * price::numeric) as total_value
      FROM pm_trades
      WHERE LOWER(taker) = LOWER($1)
      GROUP BY outcome
    `;

    const result = await this.db.query(query, [traderAddress]);

    const portfolio: Record<string, any> = {
      YES: { count: 0, value: 0, percentage: 0 },
      NO: { count: 0, value: 0, percentage: 0 }
    };

    let totalValue = 0;

    for (const row of result.rows) {
      portfolio[row.outcome].count = parseInt(row.trade_count);
      portfolio[row.outcome].value = parseFloat(row.total_value);
      totalValue += parseFloat(row.total_value);
    }

    if (totalValue > 0) {
      portfolio.YES.percentage = (portfolio.YES.value / totalValue) * 100;
      portfolio.NO.percentage = (portfolio.NO.value / totalValue) * 100;
    }

    return portfolio;
  }

  /**
   * Get similar traders (based on trading style)
   */
  async getSimilarTraders(traderAddress: string, limit: number = 10): Promise<any[]> {
    const query = `
      WITH trader_style AS (
        SELECT
          taker,
          SUM(CASE WHEN outcome = 'YES' THEN 1 ELSE 0 END) as yes_count,
          SUM(CASE WHEN outcome = 'NO' THEN 1 ELSE 0 END) as no_count,
          COUNT(*) as total
        FROM pm_trades
        WHERE LOWER(taker) = LOWER($1)
        GROUP BY taker
      ),
      all_traders AS (
        SELECT
          taker,
          SUM(CASE WHEN outcome = 'YES' THEN 1 ELSE 0 END)::numeric / COUNT(*) as yes_ratio,
          COUNT(*) as trade_count
        FROM pm_trades
        GROUP BY taker
        HAVING COUNT(*) >= 5
      )
      SELECT
        at.taker as trader,
        at.trade_count,
        ABS(at.yes_ratio - (ts.yes_count::numeric / ts.total)) as style_distance
      FROM all_traders at
      CROSS JOIN trader_style ts
      WHERE LOWER(at.taker) != LOWER($1)
      ORDER BY style_distance ASC
      LIMIT $2
    `;

    const result = await this.db.query(query, [traderAddress, limit]);

    return result.rows.map((row, index) => ({
      rank: index + 1,
      trader: row.trader,
      totalTrades: parseInt(row.trade_count),
      styleSimilarity: (1 - parseFloat(row.style_distance)) * 100 // Convert distance to similarity %
    }));
  }

  /**
   * Helper: Calculate trading style
   */
  private calculateTradingStyle(avgTradeSize: number): 'aggressive' | 'conservative' | 'balanced' {
    if (avgTradeSize > 50000) return 'aggressive';
    if (avgTradeSize < 5000) return 'conservative';
    return 'balanced';
  }

  /**
   * Helper: Calculate risk score
   */
  private calculateRiskScore(winRate: number, avgTradeSize: number): number {
    const winRateComponent = (1 - winRate) * 5; // Lower win rate = higher risk
    const sizeComponent = Math.min(avgTradeSize / 10000, 5); // Larger trades = higher risk
    return Math.min(Math.round(winRateComponent + sizeComponent), 10);
  }

  /**
   * Helper: Calculate profile completeness
   */
  private calculateProfileCompleteness(totalTrades: number): number {
    if (totalTrades === 0) return 0;
    if (totalTrades < 5) return 20;
    if (totalTrades < 10) return 40;
    if (totalTrades < 50) return 60;
    if (totalTrades < 100) return 80;
    return 100;
  }

  /**
   * Helper: Calculate trade result (P&L)
   */
  private calculateTradeResult(side: string, outcome: string, value: number): number {
    if ((side === 'BUY' && outcome === 'YES') || (side === 'SELL' && outcome === 'NO')) {
      return value * 0.1; // 10% profit on correct prediction
    }
    return -value * 0.1; // 10% loss on wrong prediction
  }
}
