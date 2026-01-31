/**
 * Reputation System Service
 * Social reputation and trust scoring
 */

import { Pool } from 'pg';

export interface ReputationScore {
  traderAddress: string;
  overallScore: number; // 0-100
  tradingReputation: number; // Based on win rate and volume
  socialReputation: number; // Based on community feedback
  trustScore: number; // Based on consistency and behavior
  badges: string[];
  tier: 'novice' | 'intermediate' | 'advanced' | 'expert' | 'master';
  ranking: number; // Global ranking
  lastUpdated: Date;
}

export interface Badge {
  name: string;
  description: string;
  icon: string;
  criteria: string;
  earnedAt: Date;
}

export interface TrustMetrics {
  consistency: number; // How consistent is the trader's performance
  longevity: number; // How long has the trader been active
  activityLevel: number; // How active is the trader
  marketDiversity: number; // How many different markets traded
  avgHoldTime: number; // Average time holding a position
  slippageRate: number; // How often do they trade at bad prices
}

export class ReputationService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Calculate comprehensive reputation score
   */
  async getReputationScore(traderAddress: string): Promise<ReputationScore | null> {
    const query = `
      WITH trader_stats AS (
        SELECT
          taker as trader,
          COUNT(*) as total_trades,
          SUM(size::numeric * price::numeric) as total_volume,
          MIN(block_timestamp) as first_trade,
          MAX(block_timestamp) as last_trade,
          COUNT(DISTINCT market_id) as market_count,
          SUM(CASE WHEN (side = 'BUY' AND outcome = 'YES') OR
                       (side = 'SELL' AND outcome = 'NO') THEN 1 ELSE 0 END)::numeric /
              NULLIF(COUNT(*), 0) as win_rate
        FROM pm_trades
        WHERE LOWER(taker) = LOWER($1)
        GROUP BY taker
      )
      SELECT
        trader,
        total_trades,
        total_volume,
        first_trade,
        last_trade,
        market_count,
        COALESCE(win_rate, 0) as win_rate
      FROM trader_stats
    `;

    const result = await this.db.query(query, [traderAddress.toLowerCase()]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const tradingReputation = this.calculateTradingReputation(
      parseFloat(row.win_rate),
      parseFloat(row.total_volume),
      parseInt(row.total_trades)
    );

    const socialReputation = 50; // Placeholder - would come from community feedback

    const trustScore = this.calculateTrustScore(
      row.first_trade,
      row.last_trade,
      parseInt(row.total_trades),
      parseInt(row.market_count)
    );

    const overallScore = (tradingReputation * 0.4 + socialReputation * 0.3 + trustScore * 0.3);

    const badges = this.calculateBadges(
      parseInt(row.total_trades),
      parseFloat(row.win_rate),
      parseFloat(row.total_volume)
    );

    const tier = this.calculateTier(overallScore, parseInt(row.total_trades));

    return {
      traderAddress: row.trader,
      overallScore: Math.round(overallScore),
      tradingReputation: Math.round(tradingReputation),
      socialReputation: Math.round(socialReputation),
      trustScore: Math.round(trustScore),
      badges,
      tier,
      ranking: 0, // Would be calculated from global leaderboard
      lastUpdated: new Date()
    };
  }

  /**
   * Get trader trust metrics
   */
  async getTrustMetrics(traderAddress: string): Promise<TrustMetrics> {
    const query = `
      WITH trader_data AS (
        SELECT
          taker,
          block_timestamp,
          market_id,
          price::numeric
        FROM pm_trades
        WHERE LOWER(taker) = LOWER($1)
      ),
      time_stats AS (
        SELECT
          MIN(block_timestamp) as first_trade,
          MAX(block_timestamp) as last_trade,
          COUNT(*) as total_trades,
          COUNT(DISTINCT market_id) as unique_markets
        FROM trader_data
      )
      SELECT
        EXTRACT(EPOCH FROM (ts.last_trade - ts.first_trade)) / 86400 as days_active,
        ts.total_trades,
        ts.unique_markets
      FROM time_stats ts
    `;

    const result = await this.db.query(query, [traderAddress]);

    if (result.rows.length === 0) {
      return {
        consistency: 0,
        longevity: 0,
        activityLevel: 0,
        marketDiversity: 0,
        avgHoldTime: 0,
        slippageRate: 0
      };
    }

    const row = result.rows[0];
    const daysActive = parseFloat(row.days_active) || 1;
    const totalTrades = parseInt(row.total_trades) || 0;
    const uniqueMarkets = parseInt(row.unique_markets) || 0;

    return {
      consistency: this.calculateConsistency(totalTrades, daysActive),
      longevity: Math.min(daysActive / 365, 1) * 100, // Max out at 1 year
      activityLevel: Math.min(totalTrades / 100, 1) * 100, // Max out at 100 trades
      marketDiversity: Math.min(uniqueMarkets / 10, 1) * 100, // Max out at 10 markets
      avgHoldTime: 0, // Would need position tracking
      slippageRate: 0 // Would need price comparison
    };
  }

  /**
   * Get global reputation leaderboard
   */
  async getReputationLeaderboard(limit: number = 50): Promise<any[]> {
    const query = `
      WITH trader_scores AS (
        SELECT
          taker as trader,
          COUNT(*) as total_trades,
          SUM(size::numeric * price::numeric) as total_volume,
          SUM(CASE WHEN (side = 'BUY' AND outcome = 'YES') OR
                       (side = 'SELL' AND outcome = 'NO') THEN 1 ELSE 0 END)::numeric /
              NULLIF(COUNT(*), 0) as win_rate,
          MIN(block_timestamp) as first_trade,
          MAX(block_timestamp) as last_trade
        FROM pm_trades
        GROUP BY taker
        HAVING COUNT(*) >= 10  -- Minimum 10 trades to be on leaderboard
      )
      SELECT
        trader,
        total_trades,
        total_volume,
        win_rate,
        EXTRACT(EPOCH FROM (last_trade - first_trade)) / 86400 as days_active
      FROM trader_scores
      ORDER BY (win_rate * 40 + LEAST(total_volume / 10000, 40) + LEAST(total_trades / 10, 20)) DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);

    return result.rows.map((row, index) => {
      const tradingRep = this.calculateTradingReputation(
        parseFloat(row.win_rate),
        parseFloat(row.total_volume),
        parseInt(row.total_trades)
      );

      const trustScore = this.calculateTrustScore(
        null, null,
        parseInt(row.total_trades),
        0 // market count not available in this query
      );

      const overallScore = tradingRep * 0.7 + trustScore * 0.3;

      return {
        rank: index + 1,
        trader: row.trader,
        overallScore: Math.round(overallScore),
        totalTrades: parseInt(row.total_trades),
        totalVolume: parseFloat(row.total_volume),
        winRate: parseFloat(row.win_rate),
        tier: this.calculateTier(overallScore, parseInt(row.total_trades))
      };
    });
  }

  /**
   * Award badge to trader
   */
  async awardBadge(traderAddress: string, badge: Badge): Promise<void> {
    // TODO: Store badges in database
    console.log(`[Reputation] Awarded badge "${badge.name}" to ${traderAddress}`);
  }

  /**
   * Get all badges earned by trader
   */
  async getTraderBadges(traderAddress: string): Promise<Badge[]> {
    const query = `
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN (side = 'BUY' AND outcome = 'YES') OR
                     (side = 'SELL' AND outcome = 'NO') THEN 1 ELSE 0 END)::numeric /
            NULLIF(COUNT(*), 0) as win_rate,
        SUM(size::numeric * price::numeric) as total_volume
      FROM pm_trades
      WHERE LOWER(taker) = LOWER($1)
    `;

    const result = await this.db.query(query, [traderAddress]);
    const row = result.rows[0];

    const badges: Badge[] = [];
    const totalTrades = parseInt(row.total_trades) || 0;
    const winRate = parseFloat(row.win_rate) || 0;
    const totalVolume = parseFloat(row.total_volume) || 0;

    // Early Adopter
    if (totalTrades >= 1) {
      badges.push({
        name: 'Early Trader',
        description: 'Made your first trade',
        icon: '🚀',
        criteria: 'Complete 1 trade',
        earnedAt: new Date()
      });
    }

    // Volume Badges
    if (totalVolume >= 100000) {
      badges.push({
        name: 'Whale',
        description: 'Traded over $100,000',
        icon: '🐋',
        criteria: 'Trade volume > $100k',
        earnedAt: new Date()
      });
    } else if (totalVolume >= 10000) {
      badges.push({
        name: 'Big Player',
        description: 'Traded over $10,000',
        icon: '💰',
        criteria: 'Trade volume > $10k',
        earnedAt: new Date()
      });
    }

    // Win Rate Badges
    if (totalTrades >= 10 && winRate >= 0.8) {
      badges.push({
        name: 'Oracle',
        description: '80%+ win rate with 10+ trades',
        icon: '🔮',
        criteria: 'Win rate > 80% (min 10 trades)',
        earnedAt: new Date()
      });
    } else if (totalTrades >= 10 && winRate >= 0.7) {
      badges.push({
        name: 'Sharp Trader',
        description: '70%+ win rate with 10+ trades',
        icon: '🎯',
        criteria: 'Win rate > 70% (min 10 trades)',
        earnedAt: new Date()
      });
    }

    // Activity Badges
    if (totalTrades >= 100) {
      badges.push({
        name: 'Market Veteran',
        description: 'Completed 100+ trades',
        icon: '⭐',
        criteria: 'Complete 100 trades',
        earnedAt: new Date()
      });
    } else if (totalTrades >= 50) {
      badges.push({
        name: 'Active Trader',
        description: 'Completed 50+ trades',
        icon: '📈',
        criteria: 'Complete 50 trades',
        earnedAt: new Date()
      });
    }

    return badges;
  }

  /**
   * Helper: Calculate trading reputation
   */
  private calculateTradingReputation(winRate: number, volume: number, totalTrades: number): number {
    const winRateScore = winRate * 40; // 0-40 points
    const volumeScore = Math.min(volume / 10000, 1) * 40; // 0-40 points, max at $10k
    const activityScore = Math.min(totalTrades / 100, 1) * 20; // 0-20 points, max at 100 trades

    return winRateScore + volumeScore + activityScore;
  }

  /**
   * Helper: Calculate trust score
   */
  private calculateTrustScore(
    firstTrade: Date | null,
    lastTrade: Date | null,
    totalTrades: number,
    marketCount: number
  ): number {
    let score = 0;

    // Longevity (0-30 points)
    if (firstTrade && lastTrade) {
      const daysActive = (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.min(daysActive / 365, 1) * 30;
    }

    // Activity (0-40 points)
    score += Math.min(totalTrades / 100, 1) * 40;

    // Diversity (0-30 points)
    score += Math.min(marketCount / 10, 1) * 30;

    return score;
  }

  /**
   * Helper: Calculate tier
   */
  private calculateTier(score: number, totalTrades: number): 'novice' | 'intermediate' | 'advanced' | 'expert' | 'master' {
    if (totalTrades < 5) return 'novice';
    if (score < 30) return 'novice';
    if (score < 50) return 'intermediate';
    if (score < 70) return 'advanced';
    if (score < 85) return 'expert';
    return 'master';
  }

  /**
   * Helper: Calculate badges
   */
  private calculateBadges(totalTrades: number, winRate: number, volume: number): string[] {
    const badges: string[] = [];

    if (totalTrades >= 100) badges.push('veteran');
    if (totalTrades >= 50) badges.push('active_trader');
    if (winRate >= 0.8 && totalTrades >= 10) badges.push('oracle');
    if (winRate >= 0.7 && totalTrades >= 10) badges.push('sharp');
    if (volume >= 100000) badges.push('whale');

    return badges;
  }

  /**
   * Helper: Calculate consistency
   */
  private calculateConsistency(totalTrades: number, daysActive: number): number {
    if (daysActive === 0) return 0;
    const tradesPerDay = totalTrades / daysActive;
    return Math.min(tradesPerDay / 5, 1) * 100; // Max out at 5 trades/day
  }
}
