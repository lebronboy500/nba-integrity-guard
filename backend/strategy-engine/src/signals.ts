/**
 * Signal Matcher
 * Matches signals from Twitter and Market data to trigger trades
 */

export interface Signal {
  type: 'HIGH_RISK_HEDGE' | 'MEDIUM_RISK' | 'LOW_RISK' | 'NO_SIGNAL';
  confidence: number;
  reasons: string[];
  timestamp: string;
}

export interface SignalInput {
  riggingIndex: number;
  anomalyScore: number;
  gameId: string;
  marketId: string;
}

export class SignalMatcher {
  private readonly RIGGING_THRESHOLD = parseFloat(process.env.RIGGING_INDEX_THRESHOLD || '0.65');
  private readonly ANOMALY_THRESHOLD = parseFloat(process.env.ANOMALY_SCORE_THRESHOLD || '0.75');

  matchSignal(input: SignalInput): Signal {
    const reasons: string[] = [];
    let confidence = 0.0;

    // Check rigging index
    if (input.riggingIndex > this.RIGGING_THRESHOLD) {
      confidence += 0.5;
      reasons.push(`High rigging index: ${input.riggingIndex}`);
    }

    // Check anomaly score
    if (input.anomalyScore > this.ANOMALY_THRESHOLD) {
      confidence += 0.5;
      reasons.push(`High anomaly score: ${input.anomalyScore}`);
    }

    // Determine signal type
    let type: Signal['type'] = 'NO_SIGNAL';

    if (input.riggingIndex > this.RIGGING_THRESHOLD && input.anomalyScore > this.ANOMALY_THRESHOLD) {
      type = 'HIGH_RISK_HEDGE';
      confidence = Math.min(confidence, 1.0);
    } else if (input.riggingIndex > this.RIGGING_THRESHOLD * 0.8 || input.anomalyScore > this.ANOMALY_THRESHOLD * 0.8) {
      type = 'MEDIUM_RISK';
      confidence = Math.min(confidence * 0.7, 1.0);
    } else if (input.riggingIndex > this.RIGGING_THRESHOLD * 0.5 || input.anomalyScore > this.ANOMALY_THRESHOLD * 0.5) {
      type = 'LOW_RISK';
      confidence = Math.min(confidence * 0.4, 1.0);
    }

    return {
      type,
      confidence: parseFloat(confidence.toFixed(4)),
      reasons,
      timestamp: new Date().toISOString(),
    };
  }

  calculateBetAmount(signal: Signal, baseAmount: number = 1000): number {
    if (signal.type === 'NO_SIGNAL') {
      return 0;
    }

    // Scale bet amount based on confidence
    const multiplier = {
      'HIGH_RISK_HEDGE': 1.5,
      'MEDIUM_RISK': 1.0,
      'LOW_RISK': 0.5,
      'NO_SIGNAL': 0,
    };

    return Math.floor(baseAmount * multiplier[signal.type] * signal.confidence);
  }

  calculateEstimatedPayout(betAmount: number, odds: number = 1.8): number {
    // Simple payout calculation: bet * odds
    return Math.floor(betAmount * odds);
  }
}
