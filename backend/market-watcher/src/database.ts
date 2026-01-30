/**
 * Database Manager for Market Watcher - Phase 1 Enhanced
 * Handles PostgreSQL connections and data storage with health checks
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
  private readonly maxRetries = 3;
  private stats = { inserts: 0, errors: 0 };

  async connect(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.pool = new Pool({
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DB || 'nba_integrity',
          user: process.env.POSTGRES_USER || 'admin',
          password: process.env.POSTGRES_PASSWORD || 'password',
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        // Test connection
        const client = await this.pool.connect();
        console.log(`✓ Connected to PostgreSQL (attempt ${attempt})`);
        client.release();
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Connection attempt ${attempt}/${this.maxRetries} failed: ${error}`);

        if (attempt < this.maxRetries) {
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await this.sleep(waitTime);
        }
      }
    }

    throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  async ping(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.warn(`⚠️ Database ping failed: ${error}`);
      try {
        await this.connect();
        return true;
      } catch {
        return false;
      }
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

      this.stats.inserts++;
      console.log(
        `✓ Inserted market data: ${data.market_id} | ` +
        `Anomaly: ${data.anomaly_detected} (${data.anomaly_score.toFixed(4)})`
      );
      return true;
    } catch (error) {
      this.stats.errors++;
      console.error('❌ Error inserting market data:', error);
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
      console.error('❌ Error fetching market data:', error);
      return [];
    }
  }

  getStats() {
    return this.stats;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log(`✓ Database closed | Stats: ${JSON.stringify(this.stats)}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
