/**
 * Market Watcher - NBA Integrity Guard
 * Monitors Polymarket for NBA-related market data and anomalies
 */

import { config } from 'dotenv';
import { MarketClient } from './market';
import { DatabaseManager } from './database';
import { AnomalyDetector } from './anomaly';

config();

const POLL_INTERVAL = 30000; // 30 seconds

class MarketWatcher {
  private marketClient: MarketClient;
  private db: DatabaseManager;
  private anomalyDetector: AnomalyDetector;
  private isRunning: boolean = false;

  constructor() {
    this.marketClient = new MarketClient();
    this.db = new DatabaseManager();
    this.anomalyDetector = new AnomalyDetector();
  }

  async initialize(): Promise<void> {
    console.log('Initializing Market Watcher...');
    await this.db.connect();
    console.log('Market Watcher initialized');
  }

  async processMarkets(): Promise<void> {
    try {
      console.log('Fetching market data...');

      // Fetch NBA markets from Polymarket
      const markets = await this.marketClient.fetchNBAMarkets();

      if (!markets || markets.length === 0) {
        console.log('No NBA markets found');
        return;
      }

      console.log(`Processing ${markets.length} markets...`);

      for (const market of markets) {
        // Get market details
        const marketData = await this.marketClient.getMarketDetails(market.id);

        if (!marketData) {
          continue;
        }

        // Detect anomalies
        const anomaly = await this.anomalyDetector.detectAnomaly(marketData);

        // Prepare data for storage
        const data = {
          market_id: marketData.id,
          game_id: this.extractGameId(marketData.question),
          yes_price: marketData.yesPrice,
          no_price: marketData.noPrice,
          spread_bps: marketData.spreadBps,
          liquidity: marketData.liquidity,
          anomaly_detected: anomaly.detected,
          anomaly_score: anomaly.score,
          timestamp: new Date().toISOString(),
        };

        // Store in database
        await this.db.insertMarketData(data);

        if (anomaly.detected) {
          console.log(`⚠️  Anomaly detected in market ${marketData.id}: score=${anomaly.score}`);
        }
      }

      console.log('Market data processing complete');
    } catch (error) {
      console.error('Error processing markets:', error);
    }
  }

  private extractGameId(question: string): string {
    // Extract game ID from market question
    // Example: "Will Lakers beat Celtics on 2025-01-30?" -> "NBA_20250130_LAL_BOS"
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `NBA_${today}_UNKNOWN`;
  }

  async run(): Promise<void> {
    await this.initialize();

    this.isRunning = true;
    console.log('Starting Market Watcher...');

    while (this.isRunning) {
      try {
        await this.processMarkets();
        console.log(`Sleeping for ${POLL_INTERVAL / 1000} seconds...`);
        await this.sleep(POLL_INTERVAL);
      } catch (error) {
        console.error('Error in monitoring loop:', error);
        await this.sleep(POLL_INTERVAL);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop(): Promise<void> {
    console.log('Stopping Market Watcher...');
    this.isRunning = false;
    await this.db.close();
  }
}

// Main execution
const watcher = new MarketWatcher();

process.on('SIGINT', async () => {
  await watcher.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await watcher.stop();
  process.exit(0);
});

watcher.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
