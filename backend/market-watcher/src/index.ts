/**
 * Market Watcher - NBA Integrity Guard
 * Monitors Polymarket for NBA-related market data and anomalies
 *
 * Phase 1 改进:
 * - 增强的错误处理和重试机制
 * - 数据库健康检查
 * - 详细的日志和统计
 */

import { config } from 'dotenv';
import { MarketClient } from './market';
import { DatabaseManager } from './database';
import { AnomalyDetector } from './anomaly';

config();

const POLL_INTERVAL = 30000; // 30 seconds

interface ServiceStats {
  marketsProcessed: number;
  anomaliesDetected: number;
  totalErrors: number;
  lastSuccessfulRun: Date | null;
  failedMarkets: string[];
}

class MarketWatcher {
  private marketClient: MarketClient;
  private db: DatabaseManager;
  private anomalyDetector: AnomalyDetector;
  private isRunning: boolean = false;
  private stats: ServiceStats = {
    marketsProcessed: 0,
    anomaliesDetected: 0,
    totalErrors: 0,
    lastSuccessfulRun: null,
    failedMarkets: []
  };
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 5;

  constructor() {
    this.marketClient = new MarketClient();
    this.db = new DatabaseManager();
    this.anomalyDetector = new AnomalyDetector();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Market Watcher (Phase 1 Enhanced)...');
    try {
      await this.db.connect();
      console.log('✓ Database connected');
      await this.healthCheck();
      console.log('✓ Health check passed');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const isHealthy = await this.db.ping();
      if (!isHealthy) {
        console.warn('⚠️ Database health check failed, attempting reconnect...');
        await this.db.connect();
      }
      return true;
    } catch (error) {
      console.error('❌ Health check error:', error);
      return false;
    }
  }

  async processMarkets(): Promise<void> {
    try {
      console.log('📊 Fetching market data...');

      // 获取市场数据
      const markets = await this.marketClient.fetchNBAMarkets();

      if (!markets || markets.length === 0) {
        console.log('⚠️ No NBA markets found');
        return;
      }

      console.log(`📈 Processing ${markets.length} markets...`);
      this.stats.failedMarkets = [];

      for (const market of markets) {
        try {
          // 获取市场详情
          const marketData = await this.marketClient.getMarketDetails(market.id);

          if (!marketData) {
            this.stats.failedMarkets.push(market.id);
            continue;
          }

          // 检测异常
          const anomaly = await this.anomalyDetector.detectAnomaly(marketData);

          // 准备存储数据
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

          // 存储到数据库
          const success = await this.db.insertMarketData(data);

          if (success) {
            this.stats.marketsProcessed++;
            if (anomaly.detected) {
              this.stats.anomaliesDetected++;
              console.log(`⚠️  Anomaly detected: ${marketData.id} (score=${anomaly.score})`);
              console.log(`   Reasons: ${anomaly.reasons.join(', ')}`);
            }
          } else {
            this.stats.failedMarkets.push(market.id);
          }

        } catch (error) {
          console.error(`❌ Error processing market ${market.id}:`, error);
          this.stats.failedMarkets.push(market.id);
          this.stats.totalErrors++;
        }
      }

      this.stats.lastSuccessfulRun = new Date();
      this.consecutiveErrors = 0;
      console.log('✓ Market processing complete');

    } catch (error) {
      this.stats.totalErrors++;
      this.consecutiveErrors++;
      console.error('❌ Error processing markets:', error);

      if (this.consecutiveErrors >= 3) {
        console.warn('⚠️ Multiple consecutive errors, checking health...');
        const healthy = await this.healthCheck();
        if (!healthy) {
          console.error('❌ System unhealthy, will retry...');
        }
      }
    }
  }

  private extractGameId(question: string): string {
    // 从市场问题中提取比赛ID
    // 例: "Will Lakers beat Celtics on 2025-01-30?" -> "NBA_20250130_LAL_BOS"
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const lakers = question.toLowerCase().includes('lakers');
    const celtics = question.toLowerCase().includes('celtics');

    if (lakers && celtics) {
      return `NBA_${today}_LAL_BOS`;
    }

    return `NBA_${today}_UNKNOWN`;
  }

  private printStats(): void {
    console.log(`
📊 === Market Watcher Stats ===
  📈 Markets processed: ${this.stats.marketsProcessed}
  ⚠️  Anomalies detected: ${this.stats.anomaliesDetected}
  ❌ Total errors: ${this.stats.totalErrors}
  ⏱️ Last successful run: ${this.stats.lastSuccessfulRun ?
    new Date().getTime() - this.stats.lastSuccessfulRun.getTime() + 'ms ago' : 'N/A'}
  🚫 Failed markets: ${this.stats.failedMarkets.length}
================================
    `);
  }

  async run(): Promise<void> {
    await this.initialize();

    this.isRunning = true;
    console.log('🔄 Starting Market Watcher...');

    let iterationCount = 0;

    while (this.isRunning) {
      try {
        await this.processMarkets();
        iterationCount++;

        // 每10次迭代输出统计
        if (iterationCount % 10 === 0) {
          this.printStats();
        }

        console.log(`💤 Sleeping for ${POLL_INTERVAL / 1000} seconds...`);
        await this.sleep(POLL_INTERVAL);

      } catch (error) {
        console.error('❌ Critical error in monitoring loop:', error);
        this.stats.totalErrors++;
        this.consecutiveErrors++;

        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          console.error('🛑 Too many consecutive errors. Exiting.');
          break;
        }

        // 指数退避
        const waitTime = Math.min(60 * (2 ** (this.consecutiveErrors - 1)), 300);
        console.log(`⏳ Waiting ${waitTime}s before retry...`);
        await this.sleep(waitTime * 1000);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop(): Promise<void> {
    console.log('⏹️ Stopping Market Watcher...');
    this.isRunning = false;
    this.printStats();
    await this.db.close();
  }
}

// 主执行
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
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
