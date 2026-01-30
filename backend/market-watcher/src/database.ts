/**
 * Database Manager for Market Watcher
 * Handles PostgreSQL connections and data storage
 */

import { Pool, PoolClient } from 'pg';

export interface MarketData {
  market_id: string;
  game_id: string;
  yes_price: number;
  no_price: number;
  spread_bps: number;
  liquidity: number;
  anomaly_detected: boolean;
  anomaly_score: number;
  timestamp: string;
}

export class DatabaseManager {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'nba_integrity',
        user: process.env.POSTGRES_USER || 'admin',
        password: process.env.POSTGRES_PASSWORD || 'password',
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }

  async insertMarketData(data: MarketData): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        INSERT INTO market_data
        (market_id, game_id, yes_price, no_price, spread_bps, liquidity,
         anomaly_detected, anomaly_score, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await this.pool.query(query, [
        data.market_id,
        data.game_id,
        data.yes_price,
        data.no_price,
        data.spread_bps,
        data.liquidity,
        data.anomaly_detected,
        data.anomaly_score,
        data.timestamp,
      ]);

      console.log(`Inserted market data for ${data.market_id}`);
      return true;
    } catch (error) {
      console.error('Error inserting market data:', error);
      return false;
    }
  }

  async getRecentMarketData(marketId: string, limit: number = 10): Promise<MarketData[]> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        SELECT * FROM market_data
        WHERE market_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await this.pool.query(query, [marketId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}
