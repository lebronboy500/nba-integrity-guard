/**
 * Trades Indexer
 * Scans Polygon blocks for OrderFilled events and stores trades
 */

import { TradeDecoder } from '../decoder/tradeDecoder';
import { MarketDecoder } from '../decoder/marketDecoder';
import { Database } from '../db/database';
import { DecodedTrade, SyncState } from '../types';

export class TradesIndexer {
  private tradeDecoder: TradeDecoder;
  private marketDecoder: MarketDecoder;
  private db: Database;
  private batchSize: number = 1000;
  private isRunning: boolean = false;

  constructor(
    tradeDecoder: TradeDecoder,
    marketDecoder: MarketDecoder,
    db: Database,
    batchSize: number = 1000
  ) {
    this.tradeDecoder = tradeDecoder;
    this.marketDecoder = marketDecoder;
    this.db = db;
    this.batchSize = batchSize;
  }

  /**
   * Start continuous indexing from the last synced block
   */
  async startContinuousIndexing(): Promise<void> {
    if (this.isRunning) {
      console.warn('[TradesIndexer] Indexing already running');
      return;
    }

    this.isRunning = true;
    console.log('[TradesIndexer] Starting continuous indexing...');

    try {
      while (this.isRunning) {
        try {
          // Get last synced block
          const lastBlock = await this.getLastSyncedBlock();
          const currentBlock = await this.tradeDecoder.getCurrentBlock();

          console.log(
            `[TradesIndexer] Synced to block ${lastBlock}, current block: ${currentBlock}`
          );

          if (lastBlock >= currentBlock) {
            console.log('[TradesIndexer] Already synced to latest block, waiting...');
            await this.sleep(30000); // Wait 30 seconds
            continue;
          }

          // Process blocks in batches
          let fromBlock = lastBlock + 1;
          while (fromBlock <= currentBlock && this.isRunning) {
            const toBlock = Math.min(fromBlock + this.batchSize - 1, currentBlock);

            try {
              const inserted = await this.indexBlocks(fromBlock, toBlock);
              console.log(
                `[TradesIndexer] ✅ Indexed blocks ${fromBlock}-${toBlock}: ${inserted} trades`
              );

              fromBlock = toBlock + 1;
            } catch (error) {
              console.error(
                `[TradesIndexer] ❌ Error indexing blocks ${fromBlock}-${toBlock}:`,
                error
              );
              await this.sleep(5000); // Wait 5 seconds before retry
            }
          }
        } catch (error) {
          console.error('[TradesIndexer] Error in indexing loop:', error);
          await this.sleep(5000);
        }
      }
    } finally {
      this.isRunning = false;
      console.log('[TradesIndexer] Continuous indexing stopped');
    }
  }

  /**
   * Stop continuous indexing
   */
  stopIndexing(): void {
    this.isRunning = false;
    console.log('[TradesIndexer] Stopping indexing...');
  }

  /**
   * Index a range of blocks
   */
  async indexBlocks(fromBlock: number, toBlock: number): Promise<number> {
    try {
      console.log(`[TradesIndexer] Scanning blocks ${fromBlock}-${toBlock}...`);

      // Scan for trades
      const trades = await this.tradeDecoder.scanBlocks(fromBlock, toBlock);
      console.log(`[TradesIndexer] Found ${trades.length} OrderFilled events`);

      // Get block timestamps
      const blockCache = new Map<number, number>();

      // Store trades
      let inserted = 0;
      for (const trade of trades) {
        try {
          // Get block timestamp
          if (!blockCache.has(trade.blockNumber)) {
            const timestamp = await this.tradeDecoder.getBlockTimestamp(
              trade.blockNumber
            );
            blockCache.set(trade.blockNumber, timestamp);
          }
          const blockTimestamp = blockCache.get(trade.blockNumber)!;

          // Find market by token ID
          const market = await this.findMarketByTokenId(trade.tokenId);
          if (!market) {
            console.warn(
              `[TradesIndexer] ⚠️  Unknown tokenId ${trade.tokenId}, skipping trade ${trade.txHash}`
            );
            continue;
          }

          // Determine outcome
          const outcome = this.marketDecoder.determineOutcome(trade.tokenId, market);

          // Store trade
          const stored = await this.storeTrade(
            market.id,
            trade,
            blockTimestamp,
            outcome
          );

          if (stored) {
            inserted++;
          }
        } catch (error) {
          console.error(
            `[TradesIndexer] Error processing trade ${trade.txHash}:`,
            error
          );
        }
      }

      // Update sync state
      await this.updateSyncState('trade_sync', toBlock);

      return inserted;
    } catch (error) {
      console.error(
        `[TradesIndexer] Error indexing blocks ${fromBlock}-${toBlock}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Store a single trade
   */
  private async storeTrade(
    marketId: number,
    trade: DecodedTrade,
    blockTimestamp: number,
    outcome: string
  ): Promise<boolean> {
    try {
      const query = `
        INSERT INTO trades (
          market_id, tx_hash, log_index, block_number, block_timestamp,
          exchange, order_hash, maker, taker,
          maker_asset_id, taker_asset_id, maker_amount, taker_amount, fee,
          price, size, side, outcome, token_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (tx_hash, log_index) DO NOTHING
        RETURNING id
      `;

      const result = await this.db.query(query, [
        marketId,
        trade.txHash,
        trade.logIndex,
        trade.blockNumber,
        new Date(blockTimestamp * 1000),
        trade.exchange,
        trade.orderHash || null,
        trade.maker,
        trade.taker,
        trade.makerAssetId,
        trade.takerAssetId,
        trade.makerAmount,
        trade.takerAmount,
        trade.fee,
        trade.price,
        trade.size,
        trade.side,
        outcome,
        trade.tokenId
      ]);

      if (result.rows.length > 0) {
        return true; // Trade was inserted
      } else {
        console.log(
          `[TradesIndexer] ⏭️  Skipping duplicate trade ${trade.txHash}:${trade.logIndex}`
        );
        return false;
      }
    } catch (error) {
      if ((error as any).code === '23505') {
        // Duplicate key error (should not happen due to ON CONFLICT)
        console.log(`[TradesIndexer] Skipping duplicate: ${trade.txHash}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Find market by token ID
   */
  private async findMarketByTokenId(tokenId: string): Promise<any> {
    const query = `
      SELECT id, yes_token_id, no_token_id FROM markets
      WHERE yes_token_id = $1 OR no_token_id = $1
      LIMIT 1
    `;

    const result = await this.db.query(query, [tokenId]);
    return result.rows[0] || null;
  }

  /**
   * Get last synced block
   */
  private async getLastSyncedBlock(): Promise<number> {
    const query = `
      SELECT last_block FROM sync_state
      WHERE key = 'trade_sync'
      LIMIT 1
    `;

    const result = await this.db.query(query);

    if (result.rows.length > 0) {
      return result.rows[0].last_block;
    }

    // Initialize with a recent block (e.g., 1000 blocks ago from current)
    const currentBlock = await this.tradeDecoder.getCurrentBlock();
    const startBlock = Math.max(0, currentBlock - 1000);

    await this.updateSyncState('trade_sync', startBlock);
    return startBlock;
  }

  /**
   * Update sync state
   */
  private async updateSyncState(key: string, blockNumber: number): Promise<void> {
    const query = `
      INSERT INTO sync_state (key, last_block, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET last_block = $2, updated_at = NOW()
    `;

    await this.db.query(query, [key, blockNumber]);
  }

  /**
   * Get current sync state
   */
  async getSyncState(key: string = 'trade_sync'): Promise<SyncState | null> {
    const query = `
      SELECT id, key, last_block, last_block_hash, updated_at FROM sync_state
      WHERE key = $1
    `;

    const result = await this.db.query(query, [key]);
    return result.rows[0] || null;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get indexing statistics
   */
  async getStats(): Promise<{ totalTrades: number; tradesToday: number; lastSync: Date }> {
    const totalQuery = `SELECT COUNT(*) as count FROM trades`;
    const todayQuery = `
      SELECT COUNT(*) as count FROM trades
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;

    const totalResult = await this.db.query(totalQuery);
    const todayResult = await this.db.query(todayQuery);
    const syncState = await this.getSyncState('trade_sync');

    return {
      totalTrades: parseInt(totalResult.rows[0].count),
      tradesToday: parseInt(todayResult.rows[0].count),
      lastSync: syncState?.updated_at || new Date()
    };
  }
}
