export interface Signal {
  timestamp: string;
  gameId: string;
  riggingIndex: number;
  anomalyScore: number;
  tweetCount: number;
  avgSentiment: number;
  status: 'active' | 'expired' | 'executed';
  confidence?: number;
}

export interface Trade {
  id: string;
  signalTimestamp: string;
  gameId: string;
  action: 'BET_YES' | 'BET_NO';
  amount: number;
  estimatedPayout: number;
  actualPayout?: number;
  status: 'PENDING' | 'EXECUTED' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  profit?: number;
}

export interface Stats {
  signalsProcessed: number;
  tradesGenerated: number;
  distributionsExecuted: number;
  totalErrors: number;
  currentRiggingIndex: number;
  currentAnomalyScore: number;
  winRate: number;
  totalProfit: number;
}

export interface MarketData {
  marketId: string;
  gameId: string;
  yesPrice: number;
  noPrice: number;
  spread: number;
  liquidity: number;
  volume24h: number;
}
