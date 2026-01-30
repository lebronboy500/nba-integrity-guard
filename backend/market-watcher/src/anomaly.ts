/**
 * Anomaly Detector
 * Detects unusual market behavior that may indicate manipulation
 */

import { Market } from './market';

interface AnomalyResult {
  detected: boolean;
  score: number;
  reasons: string[];
}

interface MarketHistory {
  marketId: string;
  prices: number[];
  timestamps: number[];
}

export class AnomalyDetector {
  private history: Map<string, MarketHistory> = new Map();
  private readonly PRICE_CHANGE_THRESHOLD = 0.15; // 15% price change
  private readonly SPREAD_THRESHOLD = 500; // 5% spread in basis points
  private readonly LIQUIDITY_THRESHOLD = 10000; // Minimum liquidity

  async detectAnomaly(market: Market): Promise<AnomalyResult> {
    const reasons: string[] = [];
    let score = 0.0;

    // Get historical data for this market
    const history = this.getHistory(market.id);

    // Check 1: Rapid price movement
    if (history.prices.length > 0) {
      const lastPrice = history.prices[history.prices.length - 1];
      const priceChange = Math.abs(market.yesPrice - lastPrice);

      if (priceChange > this.PRICE_CHANGE_THRESHOLD) {
        score += 0.4;
        reasons.push(`Rapid price change: ${(priceChange * 100).toFixed(2)}%`);
      }
    }

    // Check 2: Wide spread (low liquidity indicator)
    if (market.spreadBps > this.SPREAD_THRESHOLD) {
      score += 0.3;
      reasons.push(`Wide spread: ${market.spreadBps} bps`);
    }

    // Check 3: Low liquidity
    if (market.liquidity < this.LIQUIDITY_THRESHOLD) {
      score += 0.2;
      reasons.push(`Low liquidity: $${market.liquidity}`);
    }

    // Check 4: Extreme pricing (very confident market)
    if (market.yesPrice > 0.9 || market.yesPrice < 0.1) {
      score += 0.1;
      reasons.push(`Extreme pricing: ${market.yesPrice}`);
    }

    // Update history
    this.updateHistory(market);

    const detected = score >= 0.75;

    return {
      detected,
      score: parseFloat(score.toFixed(4)),
      reasons,
    };
  }

  private getHistory(marketId: string): MarketHistory {
    if (!this.history.has(marketId)) {
      this.history.set(marketId, {
        marketId,
        prices: [],
        timestamps: [],
      });
    }
    return this.history.get(marketId)!;
  }

  private updateHistory(market: Market): void {
    const history = this.getHistory(market.id);
    const now = Date.now();

    history.prices.push(market.yesPrice);
    history.timestamps.push(now);

    // Keep only last 10 data points
    if (history.prices.length > 10) {
      history.prices.shift();
      history.timestamps.shift();
    }
  }

  clearHistory(): void {
    this.history.clear();
  }
}
