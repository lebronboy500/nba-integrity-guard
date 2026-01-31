/**
 * Polymarket Indexer Entry Point
 * Week 1+2: Complete Indexer with Market Discovery and Trade Scanning
 */

import dotenv from 'dotenv';
import { TradeDecoder } from './decoder/tradeDecoder';
import { MarketDecoder } from './decoder/marketDecoder';
import { GammaClient } from './api/gammaClient';
import { Database } from './db/database';
import { MarketDiscoveryService } from './services/marketDiscoveryService';
import { TradesIndexer } from './services/tradesIndexer';
import { QueryAPIServer } from './api/server';

dotenv.config();

/**
 * Main entry point - starts the full indexer
 */
async function main() {
  console.log('🚀 Polymarket Indexer - Week 1+2: Complete Indexer\n');

  // Load configuration
  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
  const gammaUrl = process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com';
  const dbUrl = process.env.DATABASE_URL;
  const port = parseInt(process.env.PORT || '3001');

  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Initialize components
    console.log('📦 Initializing components...');

    const db = new Database(dbUrl);
    await db.connect();

    const tradeDecoder = new TradeDecoder(rpcUrl);
    const marketDecoder = new MarketDecoder();
    const gammaClient = new GammaClient(gammaUrl);

    const marketDiscovery = new MarketDiscoveryService(
      gammaClient,
      marketDecoder,
      db
    );

    const tradesIndexer = new TradesIndexer(
      tradeDecoder,
      marketDecoder,
      db,
      1000 // Batch size
    );

    const apiServer = new QueryAPIServer(db, marketDiscovery, tradesIndexer);

    console.log('✅ All components initialized\n');

    // Start API server
    console.log(`🌐 Starting Query API on port ${port}...`);
    apiServer.start(port);

    // Optional: Auto-start indexer
    if (process.env.AUTO_START_INDEXER === 'true') {
      console.log('🔄 Starting continuous indexing...');
      tradesIndexer.startContinuousIndexing();
    } else {
      console.log('⏸️  Indexer not auto-started. Use POST /indexer/start to begin');
    }

    console.log('\n✅ Polymarket Indexer is running!');
    console.log(`   API:     http://localhost:${port}`);
    console.log(`   Health:  http://localhost:${port}/health`);
    console.log(`   Markets: http://localhost:${port}/markets`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down...');
      tradesIndexer.stopIndexing();
      await db.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export all components
export {
  TradeDecoder,
  MarketDecoder,
  GammaClient,
  Database,
  MarketDiscoveryService,
  TradesIndexer,
  QueryAPIServer
};
