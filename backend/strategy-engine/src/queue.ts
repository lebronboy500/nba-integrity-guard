/**
 * Queue Manager
 * Manages BullMQ task queues for trade execution and distribution
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from 'dotenv';

config();

export interface TradeJob {
  tradeId: string;
  signalType: string;
  action: string;
  marketId: string;
  gameId: string;
  amount: number;
  estimatedPayout: number;
  timestamp: string;
}

export interface DistributionJob {
  tradeId: string;
  totalProfit: number;
  timestamp: string;
}

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export class QueueManager {
  private tradeQueue: Queue<TradeJob>;
  private distributionQueue: Queue<DistributionJob>;
  private alertQueue: Queue<any>;

  constructor() {
    // Initialize queues
    this.tradeQueue = new Queue<TradeJob>('TRADE_SIGNAL', {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.distributionQueue = new Queue<DistributionJob>('DISTRIBUTION_SIGNAL', {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    this.alertQueue = new Queue('ALERT_SIGNAL', {
      connection: redisConfig,
    });

    console.log('Queue Manager initialized');
  }

  async addTradeJob(job: TradeJob): Promise<string> {
    try {
      const result = await this.tradeQueue.add('execute_trade', job, {
        priority: 10,
      });
      console.log(`Added trade job: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('Error adding trade job:', error);
      throw error;
    }
  }

  async addDistributionJob(job: DistributionJob): Promise<string> {
    try {
      const result = await this.distributionQueue.add('execute_distribution', job, {
        priority: 5,
      });
      console.log(`Added distribution job: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('Error adding distribution job:', error);
      throw error;
    }
  }

  async addAlertJob(message: string): Promise<string> {
    try {
      const result = await this.alertQueue.add('send_alert', { message });
      console.log(`Added alert job: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('Error adding alert job:', error);
      throw error;
    }
  }

  setupWorkers(): void {
    // Trade execution worker
    const tradeWorker = new Worker<TradeJob>(
      'TRADE_SIGNAL',
      async (job) => {
        console.log(`Processing trade job: ${job.id}`);
        console.log(`Trade details:`, job.data);

        // Simulate trade execution
        await this.sleep(1000);

        return {
          success: true,
          tradeId: job.data.tradeId,
          executedAt: new Date().toISOString(),
        };
      },
      { connection: redisConfig }
    );

    // Distribution execution worker
    const distributionWorker = new Worker<DistributionJob>(
      'DISTRIBUTION_SIGNAL',
      async (job) => {
        console.log(`Processing distribution job: ${job.id}`);
        console.log(`Distribution details:`, job.data);

        // Simulate distribution execution
        await this.sleep(500);

        const hedgeAmount = job.data.totalProfit * 0.5;
        const opsFee = job.data.totalProfit * 0.05;
        const userReward = job.data.totalProfit - hedgeAmount - opsFee;

        return {
          success: true,
          tradeId: job.data.tradeId,
          hedgeAmount,
          opsFee,
          userReward,
          distributedAt: new Date().toISOString(),
        };
      },
      { connection: redisConfig }
    );

    // Alert worker
    const alertWorker = new Worker(
      'ALERT_SIGNAL',
      async (job) => {
        console.log(`🔔 ALERT: ${job.data.message}`);
        return { success: true };
      },
      { connection: redisConfig }
    );

    // Setup event listeners
    tradeWorker.on('completed', (job) => {
      console.log(`✓ Trade job completed: ${job.id}`);
    });

    tradeWorker.on('failed', (job, err) => {
      console.error(`✗ Trade job failed: ${job?.id}`, err);
    });

    distributionWorker.on('completed', (job) => {
      console.log(`✓ Distribution job completed: ${job.id}`);
    });

    distributionWorker.on('failed', (job, err) => {
      console.error(`✗ Distribution job failed: ${job?.id}`, err);
    });

    console.log('Workers setup complete');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.tradeQueue.close();
    await this.distributionQueue.close();
    await this.alertQueue.close();
    console.log('Queue Manager closed');
  }
}
