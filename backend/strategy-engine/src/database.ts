/**
 * Database Manager for Strategy Engine
 * Handles trade and distribution record storage
 */

import { Pool } from 'pg';

export interface TradeRecord {
  trade_id: string;
  signal_type: string;
  action: string;
  market_id: string;
  game_id: string;
  amount: number;
  estimated_payout: number;
  status: string;
  timestamp: string;
}

export interface DistributionRecord {
  trade_id: string;
  total_profit: number;
  hedge_amount: number;
  ops_fee: number;
  user_reward: number;
  status: string;
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
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const client = await this.pool.connect();
      console.log('✓ Connected to PostgreSQL database');
      client.release();
    } catch (error) {
      console.error('❌ Error connecting to database:', error);
      throw error;
    }
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
      console.warn('⚠️ Database ping failed:', error);
      return false;
    }
  }

  async insertTrade(trade: TradeRecord): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        INSERT INTO trades
        (trade_id, signal_type, action, market_id, game_id, amount,
         estimated_payout, status, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      await this.pool.query(query, [
        trade.trade_id,
        trade.signal_type,
        trade.action,
        trade.market_id,
        trade.game_id,
        trade.amount,
        trade.estimated_payout,
        trade.status,
        trade.timestamp,
      ]);

      console.log(`Inserted trade: ${trade.trade_id}`);
      return true;
    } catch (error) {
      console.error('Error inserting trade:', error);
      return false;
    }
  }

  async insertDistribution(distribution: DistributionRecord): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        INSERT INTO distributions
        (trade_id, total_profit, hedge_amount, ops_fee, user_reward, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await this.pool.query(query, [
        distribution.trade_id,
        distribution.total_profit,
        distribution.hedge_amount,
        distribution.ops_fee,
        distribution.user_reward,
        distribution.status,
      ]);

      console.log(`Inserted distribution for trade: ${distribution.trade_id}`);
      return true;
    } catch (error) {
      console.error('Error inserting distribution:', error);
      return false;
    }
  }

  async insertSignalLog(signalType: string, data: any): Promise<boolean> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        INSERT INTO signal_logs
        (signal_type, game_id, rigging_index, anomaly_score, metadata, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;

      await this.pool.query(query, [
        signalType,
        data.gameId || null,
        data.riggingIndex || null,
        data.anomalyScore || null,
        JSON.stringify(data),
        new Date().toISOString(),
      ]);

      console.log(`Inserted signal log: ${signalType}`);
      return true;
    } catch (error) {
      console.error('Error inserting signal log:', error);
      return false;
    }
  }

  async getRecentTrades(limit: number = 10): Promise<TradeRecord[]> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const query = `
        SELECT * FROM trades
        ORDER BY timestamp DESC
        LIMIT $1
      `;

      const result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching trades:', error);
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
