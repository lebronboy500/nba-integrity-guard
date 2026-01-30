import { Signal, Trade, Stats } from '@/types';

/**
 * Mock Data Generator
 * Generates realistic sample data for local testing
 */

// Game IDs pool
const GAME_IDS = [
  'NBA_20250130_LAL_BOS',
  'NBA_20250130_GSW_LAC',
  'NBA_20250130_MIA_NYK',
  'NBA_20250130_DAL_PHX',
  'NBA_20250130_DEN_MIL',
  'NBA_20250129_CHI_BKN',
  'NBA_20250129_TOR_ATL',
  'NBA_20250129_POR_SAC'
];

/**
 * Generate random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Pick random item from array
 */
function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random timestamp within last N hours
 */
function randomTimestamp(hoursAgo: number): string {
  const now = new Date();
  const past = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  const randomTime = new Date(
    past.getTime() + Math.random() * (now.getTime() - past.getTime())
  );
  return randomTime.toISOString();
}

/**
 * Generate a mock signal
 */
export function generateMockSignal(overrides?: Partial<Signal>): Signal {
  const riggingIndex = randomBetween(0.3, 0.95);
  const anomalyScore = randomBetween(0.4, 0.9);

  const statuses: Signal['status'][] = ['active', 'expired', 'executed'];
  const status = randomPick(statuses);

  return {
    timestamp: randomTimestamp(6),
    gameId: randomPick(GAME_IDS),
    riggingIndex: Number(riggingIndex.toFixed(2)),
    anomalyScore: Number(anomalyScore.toFixed(2)),
    tweetCount: randomInt(50, 500),
    avgSentiment: Number(randomBetween(-0.8, 0.3).toFixed(2)),
    status,
    confidence: Number(randomBetween(0.6, 0.95).toFixed(2)),
    ...overrides
  };
}

/**
 * Generate multiple mock signals
 */
export function generateMockSignals(count: number): Signal[] {
  const signals: Signal[] = [];

  // Always include one active signal for demo
  signals.push(generateMockSignal({
    status: 'active',
    riggingIndex: 0.72,
    anomalyScore: 0.85,
    timestamp: new Date().toISOString()
  }));

  // Generate rest
  for (let i = 1; i < count; i++) {
    signals.push(generateMockSignal());
  }

  // Sort by timestamp (newest first)
  return signals.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Generate a mock trade
 */
export function generateMockTrade(overrides?: Partial<Trade>): Trade {
  const amount = randomInt(100, 2000);
  const multiplier = randomBetween(1.5, 2.5);
  const estimatedPayout = amount * multiplier;

  const statuses: Trade['status'][] = ['PENDING', 'EXECUTED', 'COMPLETED', 'FAILED'];
  const status = randomPick(statuses);

  const actions: Trade['action'][] = ['BET_YES', 'BET_NO'];
  const action = randomPick(actions);

  const createdAt = randomTimestamp(72);
  const completedAt = status === 'COMPLETED'
    ? new Date(new Date(createdAt).getTime() + randomInt(1, 12) * 60 * 60 * 1000).toISOString()
    : undefined;

  // Calculate profit for completed trades
  let profit: number | undefined;
  let actualPayout: number | undefined;

  if (status === 'COMPLETED') {
    const won = Math.random() > 0.35; // 65% win rate
    if (won) {
      actualPayout = estimatedPayout;
      profit = actualPayout - amount;
    } else {
      actualPayout = 0;
      profit = -amount;
    }
  }

  return {
    id: `TRX_${Date.now()}_${randomInt(100, 999)}`,
    signalTimestamp: new Date(new Date(createdAt).getTime() - 5 * 60 * 1000).toISOString(),
    gameId: randomPick(GAME_IDS),
    action,
    amount,
    estimatedPayout: Number(estimatedPayout.toFixed(2)),
    actualPayout: actualPayout ? Number(actualPayout.toFixed(2)) : undefined,
    status,
    createdAt,
    completedAt,
    profit: profit ? Number(profit.toFixed(2)) : undefined,
    ...overrides
  };
}

/**
 * Generate multiple mock trades
 */
export function generateMockTrades(count: number): Trade[] {
  const trades: Trade[] = [];

  for (let i = 0; i < count; i++) {
    trades.push(generateMockTrade());
  }

  // Sort by creation time (newest first)
  return trades.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Calculate stats from trades
 */
export function calculateStatsFromTrades(trades: Trade[]): Partial<Stats> {
  const completedTrades = trades.filter(t => t.status === 'COMPLETED');
  const profitableTrades = completedTrades.filter(t => (t.profit || 0) > 0);

  const totalProfit = completedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winRate = completedTrades.length > 0
    ? profitableTrades.length / completedTrades.length
    : 0;

  return {
    totalProfit: Number(totalProfit.toFixed(2)),
    winRate: Number(winRate.toFixed(3)),
    tradesGenerated: trades.length,
    distributionsExecuted: completedTrades.filter(t => (t.profit || 0) > 500).length
  };
}

/**
 * Generate mock stats
 */
export function generateMockStats(): Stats {
  const trades = generateMockTrades(50);
  const calculatedStats = calculateStatsFromTrades(trades);

  return {
    signalsProcessed: randomInt(100, 500),
    tradesGenerated: calculatedStats.tradesGenerated || 0,
    distributionsExecuted: calculatedStats.distributionsExecuted || 0,
    totalErrors: randomInt(0, 5),
    currentRiggingIndex: Number(randomBetween(0.4, 0.8).toFixed(2)),
    currentAnomalyScore: Number(randomBetween(0.5, 0.85).toFixed(2)),
    winRate: calculatedStats.winRate || 0,
    totalProfit: calculatedStats.totalProfit || 0
  };
}

/**
 * Simulate WebSocket message
 */
export function generateWebSocketMessage(type: 'signal' | 'stats' | 'trade'): any {
  switch (type) {
    case 'signal':
      return {
        type: 'signal',
        payload: generateMockSignal({ status: 'active' })
      };

    case 'stats':
      return {
        type: 'stats',
        payload: generateMockStats()
      };

    case 'trade':
      return {
        type: 'trade',
        payload: generateMockTrade({ status: 'COMPLETED' })
      };

    default:
      return null;
  }
}

/**
 * Start mock WebSocket simulator
 * Sends random messages at intervals
 */
export class MockWebSocketSimulator {
  private intervalId?: NodeJS.Timeout;
  private onMessage?: (message: any) => void;

  constructor(onMessage: (message: any) => void) {
    this.onMessage = onMessage;
  }

  start(intervalMs: number = 5000) {
    console.log('[MockWS] Starting simulator...');

    this.intervalId = setInterval(() => {
      const messageTypes: ('signal' | 'stats' | 'trade')[] = ['signal', 'stats', 'trade'];
      const type = randomPick(messageTypes);
      const message = generateWebSocketMessage(type);

      console.log(`[MockWS] Sending ${type} message:`, message);
      this.onMessage?.(message);
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('[MockWS] Simulator stopped');
    }
  }
}
