/**
 * Strategy Engine - NBA Integrity Guard
 * Core engine for signal matching, trade execution, and distribution
 *
 * Phase 1 改进:
 * - 增强的错误处理和日志
 * - 健康检查和监控
 * - 详细的统计信息
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import { SignalMatcher } from './signals';
import { QueueManager } from './queue';
import { DatabaseManager } from './database';

config();

const app: Express = express();
const port = process.env.STRATEGY_ENGINE_PORT || 3000;

// 中间件
app.use(express.json());

// 初始化组件
const signalMatcher = new SignalMatcher();
const queueManager = new QueueManager();
const db = new DatabaseManager();

// 全局状态
let isRunning = false;
const stats = {
  signalsProcessed: 0,
  tradesGenerated: 0,
  distributionsExecuted: 0,
  totalErrors: 0,
  startTime: new Date(),
  lastError: null as string | null
};

// 错误处理中间件
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', error);
  stats.totalErrors++;
  stats.lastError = error.message;

  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// ========== HEALTH & MONITORING ==========

/**
 * 健康检查端点
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await db.ping();
    const uptime = new Date().getTime() - stats.startTime.getTime();

    res.json({
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      running: isRunning,
      uptime: `${Math.floor(uptime / 1000)}s`,
      database: dbHealthy ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

/**
 * 统计信息端点
 */
app.get('/stats', (req: Request, res: Response) => {
  const uptime = new Date().getTime() - stats.startTime.getTime();
  res.json({
    ...stats,
    uptimeMs: uptime,
    uptimeSeconds: Math.floor(uptime / 1000),
    timestamp: new Date().toISOString()
  });
});

// ========== SIGNAL PROCESSING ==========

/**
 * POST /signal - 处理信号
 * Body: { riggingIndex, anomalyScore, gameId, marketId }
 */
app.post('/signal', async (req: Request, res: Response) => {
  try {
    const { riggingIndex, anomalyScore, gameId, marketId } = req.body;

    // 验证输入
    if (riggingIndex === undefined || anomalyScore === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: riggingIndex, anomalyScore'
      });
    }

    if (riggingIndex < 0 || riggingIndex > 1 || anomalyScore < 0 || anomalyScore > 1) {
      return res.status(400).json({
        error: 'Scores must be between 0 and 1'
      });
    }

    console.log(`📊 Processing signal: Rigging=${riggingIndex}, Anomaly=${anomalyScore}`);
    stats.signalsProcessed++;

    // 匹配信号
    const signal = signalMatcher.matchSignal({
      riggingIndex,
      anomalyScore,
      gameId,
      marketId,
    });

    // 记录信号
    await db.insertSignalLog(signal.type, {
      gameId,
      marketId,
      riggingIndex,
      anomalyScore,
      signal,
    });

    // 如果有交易信号，生成交易
    if (signal.type !== 'NO_SIGNAL') {
      const baseAmount = parseInt(process.env.DEFAULT_BET_AMOUNT || '1000');
      const betAmount = signalMatcher.calculateBetAmount(signal, baseAmount);
      const estimatedPayout = signalMatcher.calculateEstimatedPayout(betAmount);

      // 生成交易ID
      const tradeId = `TRX_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const tradeRecord = {
        trade_id: tradeId,
        signal_type: signal.type,
        action: signal.type === 'HIGH_RISK_HEDGE' ? 'BET_NO' : 'BET_YES',
        market_id: marketId,
        game_id: gameId,
        amount: betAmount,
        estimated_payout: estimatedPayout,
        status: 'PENDING_EXECUTION',
        timestamp: new Date().toISOString(),
      };

      // 存储交易
      const tradeStored = await db.insertTrade(tradeRecord);

      if (tradeStored) {
        stats.tradesGenerated++;

        // 添加到队列
        try {
          await queueManager.addTradeJob({
            tradeId,
            signalType: signal.type,
            action: tradeRecord.action,
            marketId,
            gameId,
            amount: betAmount,
            estimatedPayout,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('❌ Error adding trade to queue:', error);
          stats.totalErrors++;
        }

        // 发送告警
        await queueManager.addAlertJob(
          `🚨 ${signal.type} triggered (confidence: ${signal.confidence})`
        );

        console.log(`✓ Trade generated: ${tradeId} | ${tradeRecord.action} | $${betAmount}`);
      }

      return res.json({
        success: true,
        signal,
        trade: tradeStored ? tradeRecord : null,
      });
    }

    res.json({
      success: true,
      signal,
      trade: null,
    });

  } catch (error) {
    console.error('❌ Error processing signal:', error);
    stats.totalErrors++;
    stats.lastError = (error as Error).message;
    res.status(500).json({
      error: 'Error processing signal',
      message: (error as Error).message
    });
  }
});

/**
 * GET /trades - 查询交易记录
 */
app.get('/trades', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    const trades = await db.getRecentTrades(limit);
    res.json({
      success: true,
      trades,
      count: trades.length
    });
  } catch (error) {
    console.error('❌ Error fetching trades:', error);
    stats.totalErrors++;
    res.status(500).json({
      error: 'Error fetching trades',
      message: (error as Error).message
    });
  }
});

/**
 * POST /distribution - 执行分账
 */
app.post('/distribution', async (req: Request, res: Response) => {
  try {
    const { tradeId, totalProfit } = req.body;

    if (!tradeId || !totalProfit) {
      return res.status(400).json({
        error: 'Missing required fields: tradeId, totalProfit'
      });
    }

    if (totalProfit <= 0) {
      return res.status(400).json({
        error: 'Total profit must be greater than 0'
      });
    }

    console.log(`💰 Processing distribution for ${tradeId}: $${totalProfit}`);

    // 计算分账
    const hedgeAmount = totalProfit * 0.5;
    const opsFee = totalProfit * 0.05;
    const userReward = totalProfit - hedgeAmount - opsFee;

    const distribution = {
      trade_id: tradeId,
      total_profit: totalProfit,
      hedge_amount: hedgeAmount,
      ops_fee: opsFee,
      user_reward: userReward,
      status: 'PENDING',
    };

    // 存储分账
    const distributionStored = await db.insertDistribution(distribution);

    if (distributionStored) {
      stats.distributionsExecuted++;

      // 添加到队列
      try {
        await queueManager.addDistributionJob({
          tradeId,
          totalProfit,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('❌ Error adding distribution to queue:', error);
        stats.totalErrors++;
      }

      console.log(`✓ Distribution: Hedge=$${hedgeAmount} | Fee=$${opsFee} | Reward=$${userReward}`);
    }

    res.json({
      success: true,
      distribution: distributionStored ? distribution : null,
    });

  } catch (error) {
    console.error('❌ Error executing distribution:', error);
    stats.totalErrors++;
    stats.lastError = (error as Error).message;
    res.status(500).json({
      error: 'Error executing distribution',
      message: (error as Error).message
    });
  }
});

// ========== INITIALIZATION & SHUTDOWN ==========

async function start() {
  try {
    console.log('🚀 Starting Strategy Engine (Phase 1 Enhanced)...');

    // 连接数据库
    await db.connect();
    console.log('✓ Database connected');

    // 设置队列Worker
    queueManager.setupWorkers();
    console.log('✓ Queue workers setup');

    // 启动服务器
    app.listen(port, () => {
      isRunning = true;
      console.log(`✓ Strategy Engine listening on port ${port}`);
      console.log('📊 Features: Signal Matching | Trade Queue | Distribution Management');
    });

  } catch (error) {
    console.error('❌ Failed to start Strategy Engine:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down Strategy Engine...');
  isRunning = false;

  try {
    await db.close();
    await queueManager.close();
    console.log('✓ Cleanup complete');
    console.log(`📊 Final stats: ${JSON.stringify(stats)}`);
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ SIGTERM received, shutting down...');
  isRunning = false;

  try {
    await db.close();
    await queueManager.close();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }

  process.exit(0);
});

// 启动
start().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
