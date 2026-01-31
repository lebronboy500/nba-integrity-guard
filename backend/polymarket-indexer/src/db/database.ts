/**
 * Database Connection Pool
 * Manages PostgreSQL connections
 */

import { Pool, QueryResult } from 'pg';

export class Database {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle client:', err);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('[Database] ✅ Connected to PostgreSQL');
      client.release();
      this.isConnected = true;
    } catch (error) {
      console.error('[Database] ❌ Failed to connect:', error);
      throw error;
    }
  }

  async query(text: string, values?: any[]): Promise<QueryResult> {
    try {
      return await this.pool.query(text, values);
    } catch (error) {
      console.error('[Database] Query error:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.isConnected = false;
    console.log('[Database] Connection pool closed');
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
