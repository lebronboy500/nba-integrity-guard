/**
 * Strategy Engine - NBA Integrity Guard
 * Core engine for signal matching, trade execution, and distribution
 */

import express, { Express, Request, Response } from 'express';
import { config } from 'dotenv';
import { SignalMatcher } from './signals';
import { QueueManager } from './queue';
import { DatabaseManager } from './database';
import { MLService } from './ml/service';
import { BacktestEngine } from './backtest/engine';
import { initializeBacktestTables } from './backtest/schema';

config();

const app: Express = express();
const port = process.env.STRATEGY_ENGINE_PORT || 3000;

// Middleware
app.use(express.json());

// Initialize components
const signalMatcher = new SignalMatcher();
const queueManager = new QueueManager();
const db = new DatabaseManager();
const mlService = new MLService(db);
const backtestEngine = new BacktestEngine(db);

// Global state
let isRunning = false;

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    running: isRunning,
  });
});

/**
 * Process signal endpoint
 * POST /signal
 * Body: { riggingIndex, anomalyScore, gameId, marketId }
 */
app.post('/signal', async (req: Request, res: Response) => {
  try {
    const { riggingIndex, anomalyScore, gameId, marketId } = req.body;

    if (riggingIndex === undefined || anomalyScore === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Match signal
    const signal = signalMatcher.matchSignal({
      riggingIndex,
      anomalyScore,
      gameId,
      marketId,
    });

    // Log signal
    await db.insertSignalLog(signal.type, {
      gameId,
      marketId,
      riggingIndex,
      anomalyScore,
      signal,
    });

    if (signal.type !== 'NO_SIGNAL') {
      // Calculate bet amount
      const baseAmount = parseInt(process.env.DEFAULT_BET_AMOUNT || '1000');
      const betAmount = signalMatcher.calculateBetAmount(signal, baseAmount);
      const estimatedPayout = signalMatcher.calculateEstimatedPayout(betAmount);

      // Generate trade ID
      const tradeId = `TRX_${new Date().toISOString().split('T')[0].replace(/-/g, '')}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create trade record
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

      // Store trade
      await db.insertTrade(tradeRecord);

      // Add to queue
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

      // Send alert
      await queueManager.addAlertJob(
        `Signal triggered: ${signal.type} (confidence: ${signal.confidence})`
      );

      return res.json({
        success: true,
        signal,
        trade: tradeRecord,
      });
    }

    res.json({
      success: true,
      signal,
      trade: null,
    });
  } catch (error) {
    console.error('Error processing signal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get recent trades
 * GET /trades?limit=10
 */
app.get('/trades', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const trades = await db.getRecentTrades(limit);
    res.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Execute distribution
 * POST /distribution
 * Body: { tradeId, totalProfit }
 */
app.post('/distribution', async (req: Request, res: Response) => {
  try {
    const { tradeId, totalProfit } = req.body;

    if (!tradeId || !totalProfit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate distribution
    const hedgeAmount = totalProfit * 0.5;
    const opsFee = totalProfit * 0.05;
    const userReward = totalProfit - hedgeAmount - opsFee;

    // Store distribution
    const distribution = {
      trade_id: tradeId,
      total_profit: totalProfit,
      hedge_amount: hedgeAmount,
      ops_fee: opsFee,
      user_reward: userReward,
      status: 'PENDING',
    };

    await db.insertDistribution(distribution);

    // Add to queue
    await queueManager.addDistributionJob({
      tradeId,
      totalProfit,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      distribution,
    });
  } catch (error) {
    console.error('Error executing distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ML: Evaluate signal with adaptive thresholds
 * POST /ml/evaluate
 * Body: { gameId, riggingIndex, anomalyScore }
 */
app.post('/ml/evaluate', async (req: Request, res: Response) => {
  try {
    const { gameId, riggingIndex, anomalyScore } = req.body;

    if (!gameId || riggingIndex === undefined || anomalyScore === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const evaluation = await mlService.evaluateSignal(gameId, riggingIndex, anomalyScore);

    res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error('Error evaluating signal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ML: Get threshold statistics
 * GET /ml/thresholds
 */
app.get('/ml/thresholds', async (req: Request, res: Response) => {
  try {
    const stats = await mlService.getThresholdStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching threshold stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * ML: Force threshold update
 * POST /ml/thresholds/update
 */
app.post('/ml/thresholds/update', async (req: Request, res: Response) => {
  try {
    const thresholds = await mlService.updateThresholds();

    res.json({
      success: true,
      thresholds
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Backtest: Run backtest simulation
 * POST /backtest/run
 * Body: { config: { startDate, endDate, initialCapital, ... } }
 */
app.post('/backtest/run', async (req: Request, res: Response) => {
  try {
    const { config } = req.body;

    if (!config || !config.startDate || !config.endDate || !config.initialCapital) {
      return res.status(400).json({ error: 'Missing required configuration' });
    }

    // Set defaults
    const backtestConfig = {
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.initialCapital,
      maxPositionSize: config.maxPositionSize || 1000,
      riskPerTrade: config.riskPerTrade || 0.02,
      riggingThreshold: config.riggingThreshold || 0.65,
      anomalyThreshold: config.anomalyThreshold || 0.75
    };

    console.log('[Backtest] Starting with config:', backtestConfig);

    const result = await backtestEngine.run(backtestConfig);

    // Save to database (optional)
    // await db.saveBacktestResult(result);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Backtest: Generate report
 * POST /backtest/report
 * Body: { result: BacktestResult }
 */
app.post('/backtest/report', async (req: Request, res: Response) => {
  try {
    const { result } = req.body;

    if (!result) {
      return res.status(400).json({ error: 'Missing backtest result' });
    }

    const report = backtestEngine.generateReport(result);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Stats: Get system statistics
 * GET /stats
 */
app.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get various stats
    const recentTrades = await db.getRecentTrades(100);
    const completedTrades = recentTrades.filter((t: any) => t.status === 'COMPLETED');
    const profitableTrades = completedTrades.filter((t: any) => (t.profit || 0) > 0);

    const stats = {
      signalsProcessed: await db.query('SELECT COUNT(*) FROM twitter_data WHERE rigging_index IS NOT NULL').then(r => parseInt(r.rows[0].count)),
      tradesGenerated: recentTrades.length,
      distributionsExecuted: await db.query('SELECT COUNT(*) FROM distributions WHERE status = \'COMPLETED\'').then(r => parseInt(r.rows[0].count)),
      totalErrors: 0, // TODO: Implement error tracking
      currentRiggingIndex: 0.5, // TODO: Get from latest signal
      currentAnomalyScore: 0.6, // TODO: Get from latest signal
      winRate: completedTrades.length > 0 ? profitableTrades.length / completedTrades.length : 0,
      totalProfit: completedTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize and start server
async function start() {
  try {
    console.log('Starting Strategy Engine...');

    // Connect to database
    await db.connect();

    // Initialize backtest tables
    await initializeBacktestTables(db);

    // Setup queue workers
    queueManager.setupWorkers();

    // Start server
    app.listen(port, () => {
      console.log(`Strategy Engine listening on port ${port}`);
      console.log(`ML Service: Adaptive Thresholds enabled`);
      console.log(`Backtest Engine: Ready`);
      isRunning = true;
    });
  } catch (error) {
    console.error('Failed to start Strategy Engine:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Strategy Engine...');
  isRunning = false;
  await db.close();
  await queueManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down Strategy Engine...');
  isRunning = false;
  await db.close();
  await queueManager.close();
  process.exit(0);
});

start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
