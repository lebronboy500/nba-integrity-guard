/**
 * Analytics Service
 * Market data analysis and insights
 */

import { Pool } from 'pg';

export interface MarketSentiment {
  marketId: number;
  marketSlug: string;
  totalVolume: number;
  tradeCount: number;
  buyCount: number;
  sellCount: number;
  avgPrice: number;
  priceChange24h: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export interface PriceTrend {
  timestamp: Date;
  price: number;
  volume: number;
  outcome: 'YES' | 'NO';
}

export interface LargeTrade {
  id: number;
  txHash: string;
  marketSlug: string;
  trader: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  value: number;
  timestamp: Date;
  impact: number; // Price impact percentage
}

export interface TradingStats {
  period: string;
  totalTrades: number;
  totalVolume: number;
  uniqueTraders: number;
  avgTradeSize: number;
  largestTrade: number;
  mostActiveMarket: string;
}

export class AnalyticsService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Get market sentiment analysis
   */
  async getMarketSentiment(marketSlug: string, hours: number = 24): Promise<MarketSentiment | null> {
    const query = `
      WITH market_info AS (
        SELECT id, slug FROM markets WHERE slug = $1
      ),
      recent_trades AS (
        SELECT
          t.side,
          t.price::numeric,
          t.size::numeric,
          t.block_timestamp
        FROM pm_trades t
        JOIN market_info m ON t.market_id = m.id
        WHERE t.block_timestamp > NOW() - INTERVAL '${hours} hours'
      ),
      price_stats AS (
        SELECT
          AVG(price::numeric) as avg_price,
          COUNT(*) as trade_count,
          SUM(CASE WHEN side = 'BUY' THEN 1 ELSE 0 END) as buy_count,
          SUM(CASE WHEN side = 'SELL' THEN 1 ELSE 0 END) as sell_count,
          SUM(price::numeric * size::numeric) as total_volume
        FROM recent_trades
      ),
      price_change AS (
        SELECT
          (
            SELECT price::numeric FROM recent_trades
            ORDER BY block_timestamp DESC LIMIT 1
          ) - (
            SELECT price::numeric FROM recent_trades
            ORDER BY block_timestamp ASC LIMIT 1
          ) as change
        FROM recent_trades LIMIT 1
      )
      SELECT
        m.id as market_id,
        m.slug as market_slug,
        COALESCE(ps.total_volume, 0) as total_volume,
        COALESCE(ps.trade_count, 0) as trade_count,
        COALESCE(ps.buy_count, 0) as buy_count,
        COALESCE(ps.sell_count, 0) as sell_count,
        COALESCE(ps.avg_price, 0) as avg_price,
        COALESCE(pc.change, 0) as price_change_24h
      FROM market_info m
      LEFT JOIN price_stats ps ON true
      LEFT JOIN price_change pc ON true
    `;

    const result = await this.db.query(query, [marketSlug]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const buyRatio = row.trade_count > 0 ? row.buy_count / row.trade_count : 0.5;

    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (buyRatio > 0.6) sentiment = 'bullish';
    else if (buyRatio < 0.4) sentiment = 'bearish';

    const confidence = Math.abs(buyRatio - 0.5) * 2; // 0 to 1

    return {
      marketId: row.market_id,
      marketSlug: row.market_slug,
      totalVolume: parseFloat(row.total_volume),
      tradeCount: parseInt(row.trade_count),
      buyCount: parseInt(row.buy_count),
      sellCount: parseInt(row.sell_count),
      avgPrice: parseFloat(row.avg_price),
      priceChange24h: parseFloat(row.price_change_24h),
      sentiment,
      confidence
    };
  }

  /**
   * Get price trend data
   */
  async getPriceTrend(
    marketSlug: string,
    outcome: 'YES' | 'NO',
    hours: number = 24,
    interval: number = 1 // hours
  ): Promise<PriceTrend[]> {
    const query = `
      WITH market_info AS (
        SELECT id FROM markets WHERE slug = $1
      ),
      time_buckets AS (
        SELECT
          date_trunc('hour', block_timestamp) +
          INTERVAL '${interval} hour' * FLOOR(EXTRACT(EPOCH FROM block_timestamp - date_trunc('hour', block_timestamp)) / (${interval} * 3600)) as bucket,
          AVG(price::numeric) as avg_price,
          SUM(size::numeric) as volume,
          outcome
        FROM pm_trades t
        JOIN market_info m ON t.market_id = m.id
        WHERE
          t.block_timestamp > NOW() - INTERVAL '${hours} hours'
          AND t.outcome = $2
        GROUP BY bucket, outcome
        ORDER BY bucket ASC
      )
      SELECT
        bucket as timestamp,
        avg_price as price,
        volume,
        outcome
      FROM time_buckets
    `;

    const result = await this.db.query(query, [marketSlug, outcome]);

    return result.rows.map(row => ({
      timestamp: row.timestamp,
      price: parseFloat(row.price),
      volume: parseFloat(row.volume),
      outcome: row.outcome
    }));
  }

  /**
   * Detect large trades (whale activity)
   */
  async getLargeTrades(
    minValue: number = 10000,
    hours: number = 24,
    limit: number = 50
  ): Promise<LargeTrade[]> {
    const query = `
      SELECT
        t.id,
        t.tx_hash,
        m.slug as market_slug,
        t.taker as trader,
        t.side,
        t.size::numeric,
        t.price::numeric,
        (t.size::numeric * t.price::numeric) as value,
        t.block_timestamp as timestamp
      FROM pm_trades t
      JOIN markets m ON t.market_id = m.id
      WHERE
        t.block_timestamp > NOW() - INTERVAL '${hours} hours'
        AND (t.size::numeric * t.price::numeric) >= $1
      ORDER BY value DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [minValue, limit]);

    return result.rows.map(row => ({
      id: row.id,
      txHash: row.tx_hash,
      marketSlug: row.market_slug,
      trader: row.trader,
      side: row.side,
      size: parseFloat(row.size),
      price: parseFloat(row.price),
      value: parseFloat(row.value),
      timestamp: row.timestamp,
      impact: this.calculatePriceImpact(parseFloat(row.value))
    }));
  }

  /**
   * Get trading statistics for a period
   */
  async getTradingStats(period: 'day' | 'week' | 'month' = 'day'): Promise<TradingStats> {
    const intervals: Record<string, string> = {
      day: '24 hours',
      week: '7 days',
      month: '30 days'
    };

    const query = `
      WITH period_trades AS (
        SELECT
          t.*,
          (t.size::numeric * t.price::numeric) as value,
          m.slug as market_slug
        FROM pm_trades t
        JOIN markets m ON t.market_id = m.id
        WHERE t.block_timestamp > NOW() - INTERVAL '${intervals[period]}'
      ),
      market_volumes AS (
        SELECT
          market_slug,
          SUM(value) as volume
        FROM period_trades
        GROUP BY market_slug
        ORDER BY volume DESC
        LIMIT 1
      )
      SELECT
        COUNT(*)::int as total_trades,
        SUM(value) as total_volume,
        COUNT(DISTINCT taker)::int as unique_traders,
        AVG(value) as avg_trade_size,
        MAX(value) as largest_trade,
        (SELECT market_slug FROM market_volumes) as most_active_market
      FROM period_trades
    `;

    const result = await this.db.query(query);
    const row = result.rows[0];

    return {
      period: period,
      totalTrades: parseInt(row.total_trades) || 0,
      totalVolume: parseFloat(row.total_volume) || 0,
      uniqueTraders: parseInt(row.unique_traders) || 0,
      avgTradeSize: parseFloat(row.avg_trade_size) || 0,
      largestTrade: parseFloat(row.largest_trade) || 0,
      mostActiveMarket: row.most_active_market || 'N/A'
    };
  }

  /**
   * Get top traders by volume
   */
  async getTopTraders(hours: number = 24, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT
        taker as trader,
        COUNT(*) as trade_count,
        SUM(size::numeric * price::numeric) as total_volume,
        AVG(size::numeric * price::numeric) as avg_trade_size
      FROM pm_trades
      WHERE block_timestamp > NOW() - INTERVAL '${hours} hours'
      GROUP BY taker
      ORDER BY total_volume DESC
      LIMIT $1
    `;

    const result = await this.db.query(query, [limit]);

    return result.rows.map((row, index) => ({
      rank: index + 1,
      trader: row.trader,
      tradeCount: parseInt(row.trade_count),
      totalVolume: parseFloat(row.total_volume),
      avgTradeSize: parseFloat(row.avg_trade_size)
    }));
  }

  /**
   * Get market comparison (multiple markets)
   */
  async compareMarkets(marketSlugs: string[], hours: number = 24): Promise<any[]> {
    const query = `
      SELECT
        m.slug as market_slug,
        COUNT(t.id) as trade_count,
        SUM(t.size::numeric * t.price::numeric) as volume,
        AVG(t.price::numeric) as avg_price,
        MIN(t.price::numeric) as min_price,
        MAX(t.price::numeric) as max_price
      FROM markets m
      LEFT JOIN pm_trades t ON t.market_id = m.id
        AND t.block_timestamp > NOW() - INTERVAL '${hours} hours'
      WHERE m.slug = ANY($1)
      GROUP BY m.slug
    `;

    const result = await this.db.query(query, [marketSlugs]);

    return result.rows.map(row => ({
      marketSlug: row.market_slug,
      tradeCount: parseInt(row.trade_count) || 0,
      volume: parseFloat(row.volume) || 0,
      avgPrice: parseFloat(row.avg_price) || 0,
      minPrice: parseFloat(row.min_price) || 0,
      maxPrice: parseFloat(row.max_price) || 0,
      priceRange: (parseFloat(row.max_price) || 0) - (parseFloat(row.min_price) || 0)
    }));
  }

  /**
   * Calculate estimated price impact
   */
  private calculatePriceImpact(tradeValue: number): number {
    // Simple heuristic: larger trades have more impact
    // This is a placeholder - real calculation would need liquidity data
    if (tradeValue > 100000) return 5.0;
    if (tradeValue > 50000) return 2.5;
    if (tradeValue > 10000) return 1.0;
    return 0.5;
  }
}
